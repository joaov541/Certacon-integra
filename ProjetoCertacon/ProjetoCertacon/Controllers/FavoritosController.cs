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
public class FavoritosController : ControllerBase
{
    private readonly IntegraCertaconContext _context;
    private readonly PermissaoService _permissoes;

    public FavoritosController(
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
            "favorito.gerenciar.proprios"
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
    // GET - LISTAR MEUS FAVORITOS
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

        var favoritos = await _context.FavoritoArtigos
            .AsNoTracking()
            .Where(f =>
                f.UsuarioId == usuarioId.Value &&
                artigosPermitidos.Any(a =>
                    a.ArtigoId == f.ArtigoId
                )
            )
            .OrderByDescending(f => f.DataCriacao)
            .Select(f => new
            {
                f.FavoritoArtigoId,
                f.ArtigoId,

                f.Artigo.Titulo,
                f.Artigo.Resumo,
                f.Artigo.Visibilidade,
                f.Artigo.Status,
                f.Artigo.TemaId,
                f.Artigo.DataPublicacao,

                Tema = f.Artigo.Tema.Nome,
                Autor = f.Artigo.AutorUsuario.Nome,

                DataFavorito = f.DataCriacao,
                Favoritado = true
            })
            .ToListAsync();

        return Ok(favoritos);
    }

    // =========================================
    // GET - VERIFICAR SE ESTÁ FAVORITADO
    // =========================================

    [HttpGet("{artigoId:guid}/status")]
    public async Task<IActionResult> ConsultarStatus(
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
                mensagem = "Artigo não encontrado."
            });

        if (!await PodeLerArtigo(artigo))
            return Forbid();

        var favoritado = await _context.FavoritoArtigos
            .AnyAsync(f =>
                f.UsuarioId == usuarioId.Value &&
                f.ArtigoId == artigoId
            );

        return Ok(new
        {
            artigoId,
            favoritado
        });
    }

    // =========================================
    // POST - FAVORITAR ARTIGO
    // =========================================

    [HttpPost("{artigoId:guid}")]
    public async Task<IActionResult> Adicionar(
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

        var existente = await _context.FavoritoArtigos
            .FirstOrDefaultAsync(f =>
                f.UsuarioId == usuarioId.Value &&
                f.ArtigoId == artigoId
            );

        if (existente != null)
        {
            return Ok(new
            {
                mensagem = "Este artigo já está nos seus favoritos.",
                artigoId,
                favoritado = true
            });
        }

        var favorito = new FavoritoArtigo
        {
            FavoritoArtigoId = Guid.NewGuid(),

            UsuarioId = usuarioId.Value,

            ArtigoId = artigoId,

            DataCriacao = DateTime.UtcNow
        };

        _context.FavoritoArtigos.Add(favorito);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is SqlException sql &&
                  (sql.Number == 2601 || sql.Number == 2627))
        {
            _context.Entry(favorito).State = EntityState.Detached;

            return Ok(new
            {
                mensagem = "Este artigo já está nos seus favoritos.",
                artigoId,
                favoritado = true
            });
        }

        return StatusCode(201, new
        {
            mensagem = "Artigo adicionado aos favoritos.",
            favorito.FavoritoArtigoId,
            favorito.ArtigoId,
            favorito.DataCriacao,
            favoritado = true
        });
    }

    // =========================================
    // DELETE - REMOVER FAVORITO
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

        var removidos = await _context.FavoritoArtigos
            .Where(f =>
                f.UsuarioId == usuarioId.Value &&
                f.ArtigoId == artigoId
            )
            .ExecuteDeleteAsync();

        return Ok(new
        {
            mensagem = removidos > 0
                ? "Artigo removido dos favoritos."
                : "Este artigo não está nos seus favoritos.",

            artigoId,

            favoritado = false
        });
    }
}