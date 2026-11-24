using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;

using ProjetoCertacon.Data;
using ProjetoCertacon.Models;
using ProjetoCertacon.Services;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HistoricoLeituraController : ControllerBase
{
    private readonly IntegraCertaconContext _context;
    private readonly PermissaoService _permissoes;

    public HistoricoLeituraController(
        IntegraCertaconContext context,
        PermissaoService permissoes)
    {
        _context = context;
        _permissoes = permissoes;
    }

    // =========================================
    // PERMISSÕES
    // =========================================

    private Task<bool> PodeGerenciar()
    {
        return _permissoes.TemPermissaoAsync(
            User,
            "historico.leitura.gerenciar.proprio"
        );
    }

    private Guid? ObterUsuarioId()
    {
        return _permissoes.ObterUsuarioId(User);
    }

    // =========================================
    // VERIFICAR ACESSO AO ARTIGO
    // =========================================

    private async Task<bool> PodeLerArtigo(Artigo artigo)
    {
        if (artigo.Status != "PUBLICADO")
            return false;

        if (artigo.Visibilidade != "PUBLICO" &&
            artigo.Visibilidade != "EXCLUSIVO")
            return false;

        var codigo = artigo.Visibilidade == "PUBLICO"
            ? "artigo.ler.publico"
            : "artigo.ler.exclusivo";

        return await _permissoes.TemPermissaoAsync(
            User,
            codigo,
            artigo.TemaId
        );
    }

    // =========================================
    // FILTRAR ARTIGOS ACESSÍVEIS
    // =========================================

    private async Task<IQueryable<Artigo>> ArtigosPermitidos(
        Guid usuarioId)
    {
        var permissoes = await _permissoes
            .ListarPermissoesAsync(usuarioId);

        var publicos = permissoes
            .Where(p => p.Codigo == "artigo.ler.publico")
            .ToList();

        var exclusivos = permissoes
            .Where(p => p.Codigo == "artigo.ler.exclusivo")
            .ToList();

        var publicoGlobal = publicos.Any(p => p.TemaId == null);

        var exclusivoGlobal = exclusivos.Any(p => p.TemaId == null);

        var temasPublicos = publicos
            .Where(p => p.TemaId.HasValue)
            .Select(p => p.TemaId!.Value)
            .ToList();

        var temasExclusivos = exclusivos
            .Where(p => p.TemaId.HasValue)
            .Select(p => p.TemaId!.Value)
            .ToList();

        return _context.Artigos.Where(a =>
            a.Status == "PUBLICADO" &&
            (
                (
                    a.Visibilidade == "PUBLICO" &&
                    (
                        publicoGlobal ||
                        temasPublicos.Contains(a.TemaId)
                    )
                )
                ||
                (
                    a.Visibilidade == "EXCLUSIVO" &&
                    (
                        exclusivoGlobal ||
                        temasExclusivos.Contains(a.TemaId)
                    )
                )
            )
        );
    }

    // =========================================
    // GET - LISTAR MEU HISTÓRICO
    // =========================================

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var usuarioId = ObterUsuarioId();

        if (!usuarioId.HasValue)
            return Unauthorized();

        if (!await PodeGerenciar())
            return Forbid();

        var artigosPermitidos = await ArtigosPermitidos(
            usuarioId.Value
        );

        var podeVerFavoritos =
            await _permissoes.TemPermissaoAsync(
                User,
                "favorito.gerenciar.proprios"
            );

        var historico = await _context.HistoricoLeituras
            .AsNoTracking()
            .Where(h =>
                h.UsuarioId == usuarioId.Value &&
                artigosPermitidos.Any(a =>
                    a.ArtigoId == h.ArtigoId
                )
            )
            .OrderByDescending(h => h.DataUltimoAcesso)
            .Select(h => new
            {
                h.HistoricoLeituraId,
                h.ArtigoId,

                h.Artigo.Titulo,
                h.Artigo.Resumo,
                h.Artigo.Visibilidade,
                h.Artigo.Status,
                h.Artigo.TemaId,
                h.Artigo.DataPublicacao,

                Tema = h.Artigo.Tema.Nome,

                Autor = h.Artigo.AutorUsuario.Nome,

                h.DataPrimeiroAcesso,
                h.DataUltimoAcesso,
                h.QuantidadeAcessos,

                Favoritado = podeVerFavoritos &&
                    _context.FavoritoArtigos.Any(f =>
                        f.UsuarioId == usuarioId.Value &&
                        f.ArtigoId == h.ArtigoId
                    )
            })
            .ToListAsync();

        return Ok(historico);
    }

    // =========================================
    // POST - REGISTRAR ACESSO AO ARTIGO
    // =========================================

    [HttpPost("{artigoId:guid}")]
    public async Task<IActionResult> RegistrarAcesso(
        Guid artigoId)
    {
        var usuarioId = ObterUsuarioId();

        if (!usuarioId.HasValue)
            return Unauthorized();

        if (!await PodeGerenciar())
            return Forbid();

        var artigo = await _context.Artigos
            .AsNoTracking()
            .FirstOrDefaultAsync(a =>
                a.ArtigoId == artigoId
            );

        if (artigo == null || artigo.Status != "PUBLICADO")
            return NotFound(new
            {
                mensagem = "Artigo não encontrado ou indisponível."
            });

        if (!await PodeLerArtigo(artigo))
            return Forbid();

        var agora = DateTime.UtcNow;

        // Atualização direta no banco para evitar
        // perda de contagem em acessos simultâneos.

        var consulta = _context.HistoricoLeituras
            .Where(h =>
                h.UsuarioId == usuarioId.Value &&
                h.ArtigoId == artigoId
            );

        var atualizados = await consulta.ExecuteUpdateAsync(
            setters => setters

                .SetProperty(
                    h => h.DataUltimoAcesso,
                    h => h.DataUltimoAcesso > agora
                        ? h.DataUltimoAcesso
                        : agora
                )

                .SetProperty(
                    h => h.QuantidadeAcessos,
                    h => h.QuantidadeAcessos + 1
                )
        );

        var primeiroAcesso = false;

        // Se ainda não existe histórico, cria o registro.

        if (atualizados == 0)
        {
            var novoHistorico = new HistoricoLeitura
            {
                HistoricoLeituraId = Guid.NewGuid(),

                UsuarioId = usuarioId.Value,

                ArtigoId = artigoId,

                DataPrimeiroAcesso = agora,

                DataUltimoAcesso = agora,

                QuantidadeAcessos = 1
            };

            _context.HistoricoLeituras.Add(novoHistorico);

            try
            {
                await _context.SaveChangesAsync();

                primeiroAcesso = true;
            }
            catch (DbUpdateException ex)
                when (ex.InnerException is SqlException sql &&
                      (sql.Number == 2601 || sql.Number == 2627))
            {
                // Outro acesso pode ter criado o registro
                // enquanto esta requisição era processada.

                _context.Entry(novoHistorico).State =
                    EntityState.Detached;

                await consulta.ExecuteUpdateAsync(
                    setters => setters

                        .SetProperty(
                            h => h.DataUltimoAcesso,
                            h => h.DataUltimoAcesso > agora
                                ? h.DataUltimoAcesso
                                : agora
                        )

                        .SetProperty(
                            h => h.QuantidadeAcessos,
                            h => h.QuantidadeAcessos + 1
                        )
                );
            }
        }

        var historico = await consulta
            .AsNoTracking()
            .Select(h => new
            {
                h.HistoricoLeituraId,
                h.ArtigoId,
                h.DataPrimeiroAcesso,
                h.DataUltimoAcesso,
                h.QuantidadeAcessos
            })
            .FirstOrDefaultAsync();

        if (historico == null)
        {
            return Conflict(new
            {
                mensagem =
                    "O histórico foi alterado durante o registro. Tente novamente."
            });
        }

        return StatusCode(
            primeiroAcesso ? 201 : 200,
            new
            {
                mensagem = primeiroAcesso
                    ? "Primeiro acesso registrado."
                    : "Histórico de leitura atualizado.",

                historico.HistoricoLeituraId,
                historico.ArtigoId,
                historico.DataPrimeiroAcesso,
                historico.DataUltimoAcesso,
                historico.QuantidadeAcessos
            }
        );
    }

    // =========================================
    // DELETE - REMOVER UM REGISTRO
    // =========================================

    [HttpDelete("{artigoId:guid}")]
    public async Task<IActionResult> Remover(
        Guid artigoId)
    {
        var usuarioId = ObterUsuarioId();

        if (!usuarioId.HasValue)
            return Unauthorized();

        if (!await PodeGerenciar())
            return Forbid();

        var removidos = await _context.HistoricoLeituras
            .Where(h =>
                h.UsuarioId == usuarioId.Value &&
                h.ArtigoId == artigoId
            )
            .ExecuteDeleteAsync();

        return Ok(new
        {
            mensagem = removidos > 0
                ? "Registro removido do histórico."
                : "Registro não encontrado no seu histórico.",

            artigoId
        });
    }

    // =========================================
    // DELETE - LIMPAR MEU HISTÓRICO
    // =========================================

    [HttpDelete]
    public async Task<IActionResult> LimparHistorico()
    {
        var usuarioId = ObterUsuarioId();

        if (!usuarioId.HasValue)
            return Unauthorized();

        if (!await PodeGerenciar())
            return Forbid();

        var quantidade = await _context.HistoricoLeituras
            .Where(h =>
                h.UsuarioId == usuarioId.Value
            )
            .ExecuteDeleteAsync();

        return Ok(new
        {
            mensagem = "Histórico de leitura limpo com sucesso.",
            registrosRemovidos = quantidade
        });
    }
}