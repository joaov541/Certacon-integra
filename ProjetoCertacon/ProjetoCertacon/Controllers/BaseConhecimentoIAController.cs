using System;
using System.Data;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using ProjetoCertacon.Data;
using ProjetoCertacon.Models;
using ProjetoCertacon.Services;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BaseConhecimentoIAController : ControllerBase
{
    private readonly IntegraCertaconContext _context;

    private readonly PermissaoService _permissoes;

    private readonly AuditoriaService _auditoria;

    public BaseConhecimentoIAController(
        IntegraCertaconContext context,
        PermissaoService permissoes,
        AuditoriaService auditoria)
    {
        _context = context;

        _permissoes = permissoes;

        _auditoria = auditoria;
    }

    // =========================================
    // VERIFICAR PERMISSÃO
    // =========================================

    private Task<bool> PodeGerenciarAsync()
    {
        return _permissoes.TemPermissaoAsync(
            User,
            "ia.gerenciar.artigos"
        );
    }

    // =========================================
    // DETERMINAR SITUAÇÃO DO ARTIGO
    // =========================================

    private static string ObterSituacao(
        Artigo artigo)
    {
        if (
            artigo.Status != "PUBLICADO" ||
            artigo.Visibilidade != "PUBLICO"
        )
        {
            return "INDISPONIVEL";
        }

        if (!artigo.AutorizadoIA)
        {
            return "NAO_AUTORIZADO";
        }

        if (
            !HashArtigoIAService
                .PossuiAutorizacaoValida(artigo)
        )
        {
            return "DESATUALIZADO";
        }

        return "AUTORIZADO";
    }

    // =========================================
    // GET - LISTAR BASE DE CONHECIMENTO
    // =========================================

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] string? pesquisa,
        [FromQuery] Guid? temaId,
        [FromQuery] string? situacao,
        CancellationToken cancellationToken)
    {
        var usuarioId =
            _permissoes.ObterUsuarioId(User);

        if (!usuarioId.HasValue)
        {
            return Unauthorized();
        }

        if (!await PodeGerenciarAsync())
        {
            return Forbid();
        }

        string? filtroSituacao =
            situacao?.Trim().ToUpperInvariant();

        if (
            !string.IsNullOrWhiteSpace(filtroSituacao) &&

            filtroSituacao != "AUTORIZADO" &&

            filtroSituacao != "NAO_AUTORIZADO" &&

            filtroSituacao != "DESATUALIZADO" &&

            filtroSituacao != "INDISPONIVEL"
        )
        {
            return BadRequest(new
            {
                mensagem = "Situação inválida."
            });
        }

        var consulta = _context.Artigos
            .AsNoTracking()
            .Include(a => a.Tema)
            .Include(a => a.AutorizadorIA)
            .Where(a =>

                (
                    a.Status == "PUBLICADO" &&

                    a.Visibilidade == "PUBLICO"
                )

                ||

                a.AutorizadoIA
            );

        if (temaId.HasValue)
        {
            consulta = consulta.Where(a =>
                a.TemaId == temaId.Value
            );
        }

        if (!string.IsNullOrWhiteSpace(pesquisa))
        {
            string texto =
                pesquisa.Trim();

            consulta = consulta.Where(a =>

                a.Titulo.Contains(texto)

                ||

                a.Tema.Nome.Contains(texto)
            );
        }

        var artigos = await consulta

            .OrderByDescending(
                a => a.DataPublicacao
            )

            .ThenBy(a => a.Titulo)

            .ToListAsync(cancellationToken);

        var resultado = artigos
            .Select(a => new
            {
                a.ArtigoId,

                a.Titulo,

                a.TemaId,

                Tema = a.Tema.Nome,

                a.Status,

                a.Visibilidade,

                a.AutorizadoIA,

                AutorizacaoValida =
                    HashArtigoIAService
                        .PossuiAutorizacaoValida(a),

                Situacao =
                    ObterSituacao(a),

                a.DataAutorizacaoIA,

                a.DataRevogacaoIA,

                a.DataPublicacao,

                a.DataAtualizacao,

                Autorizador =
                    a.AutorizadorIA?.Nome,

                PodeAutorizar =
                    a.Status == "PUBLICADO" &&

                    a.Visibilidade == "PUBLICO" &&

                    !string.IsNullOrWhiteSpace(
                        BuscaArtigosService.ExtrairTexto(
                            a.Conteudo
                        )
                    ),

                PodeRevogar =
                    a.AutorizadoIA
            })
            .ToList();

        if (!string.IsNullOrWhiteSpace(filtroSituacao))
        {
            resultado = resultado
                .Where(a =>
                    a.Situacao == filtroSituacao
                )
                .ToList();
        }

        return Ok(resultado);
    }

    // =========================================
    // GET - CONSULTAR ARTIGO PARA AUTORIZAÇÃO
    // =========================================

    [HttpGet("{artigoId:guid}")]
    public async Task<IActionResult> ConsultarArtigo(
        Guid artigoId,
        CancellationToken cancellationToken)
    {
        if (!_permissoes.ObterUsuarioId(User).HasValue)
        {
            return Unauthorized();
        }

        if (!await PodeGerenciarAsync())
        {
            return Forbid();
        }

        var artigo = await _context.Artigos
            .AsNoTracking()
            .Include(a => a.Tema)
            .FirstOrDefaultAsync(
                a =>

                    a.ArtigoId == artigoId &&

                    (
                        (
                            a.Status == "PUBLICADO" &&

                            a.Visibilidade == "PUBLICO"
                        )

                        ||

                        a.AutorizadoIA
                    ),

                cancellationToken
            );

        if (artigo == null)
        {
            return NotFound(new
            {
                mensagem =
                    "Artigo indisponível para gerenciamento da IA."
            });
        }

        // Se deixou de ser público, não retornar seu texto.

        if (
            artigo.Status != "PUBLICADO" ||
            artigo.Visibilidade != "PUBLICO"
        )
        {
            return Ok(new
            {
                artigo.ArtigoId,

                artigo.Titulo,

                Situacao = "INDISPONIVEL",

                PodeAutorizar = false,

                PodeRevogar = artigo.AutorizadoIA
            });
        }

        if (
            !await _permissoes.TemPermissaoAsync(
                User,
                "artigo.ler.publico",
                artigo.TemaId
            )
        )
        {
            return Forbid();
        }

        return Ok(new
        {
            artigo.ArtigoId,

            artigo.Titulo,

            Tema = artigo.Tema.Nome,

            Resumo = BuscaArtigosService
                .ExtrairTexto(artigo.Resumo),

            Conteudo = BuscaArtigosService
                .ExtrairTexto(artigo.Conteudo),

            HashConteudo =
                HashArtigoIAService.GerarHash(artigo),

            Situacao =
                ObterSituacao(artigo),

            PodeAutorizar = true,

            PodeRevogar = artigo.AutorizadoIA
        });
    }

    // =========================================
    // PATCH - AUTORIZAR OU REVOGAR ARTIGO
    // =========================================

    [HttpPatch("{artigoId:guid}/autorizacao")]
    public async Task<IActionResult> AlterarAutorizacao(
        Guid artigoId,
        [FromBody] AutorizacaoIARequest dados,
        CancellationToken cancellationToken)
    {
        var usuarioId =
            _permissoes.ObterUsuarioId(User);

        if (!usuarioId.HasValue)
        {
            return Unauthorized();
        }

        if (!await PodeGerenciarAsync())
        {
            return Forbid();
        }

        if (!dados.Autorizado.HasValue)
        {
            return BadRequest(new
            {
                mensagem =
                    "Informe se deseja autorizar ou revogar o artigo."
            });
        }

        await using var transacao =
            await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken
            );

        var artigo = await _context.Artigos
            .Include(a => a.Tema)
            .FirstOrDefaultAsync(
                a => a.ArtigoId == artigoId,
                cancellationToken
            );

        if (artigo == null)
        {
            return NotFound(new
            {
                mensagem = "Artigo não encontrado."
            });
        }

        string acao;

        string mensagem;

        // =====================================
        // AUTORIZAR ARTIGO
        // =====================================

        if (dados.Autorizado.Value)
        {
            if (
                artigo.Status != "PUBLICADO" ||
                artigo.Visibilidade != "PUBLICO"
            )
            {
                return BadRequest(new
                {
                    mensagem =
                        "Somente artigos públicos e publicados podem ser autorizados."
                });
            }

            if (
                !await _permissoes.TemPermissaoAsync(
                    User,
                    "artigo.ler.publico",
                    artigo.TemaId
                )
            )
            {
                return Forbid();
            }

            if (
                string.IsNullOrWhiteSpace(
                    BuscaArtigosService.ExtrairTexto(
                        artigo.Conteudo
                    )
                )
            )
            {
                return BadRequest(new
                {
                    mensagem =
                        "O artigo não possui conteúdo textual."
                });
            }

            string hashAtual =
                HashArtigoIAService.GerarHash(artigo);

            if (
                !string.Equals(
                    dados.HashConteudo,
                    hashAtual,
                    StringComparison.Ordinal
                )
            )
            {
                return Conflict(new
                {
                    mensagem =
                        "O artigo foi alterado ou sua versão não foi informada. Consulte novamente o conteúdo antes de autorizar."
                });
            }

            if (
                HashArtigoIAService
                    .PossuiAutorizacaoValida(artigo)
            )
            {
                return Ok(new
                {
                    mensagem =
                        "Esta versão do artigo já está autorizada.",

                    artigo.ArtigoId,

                    artigo.AutorizadoIA,

                    Situacao = "AUTORIZADO"
                });
            }

            artigo.AutorizadoIA = true;

            artigo.HashAutorizacaoIA =
                hashAtual;

            artigo.AutorizadorIAId =
                usuarioId.Value;

            artigo.DataAutorizacaoIA =
                DateTime.UtcNow;

            acao = "ARTIGO_AUTORIZADO_IA";

            mensagem =
                "Artigo autorizado para utilização pela inteligência artificial.";
        }

        // =====================================
        // REVOGAR AUTORIZAÇÃO
        // =====================================

        else
        {
            if (!artigo.AutorizadoIA)
            {
                return Ok(new
                {
                    mensagem =
                        "O artigo já está sem autorização.",

                    artigo.ArtigoId,

                    artigo.AutorizadoIA,

                    Situacao =
                        ObterSituacao(artigo)
                });
            }

            artigo.AutorizadoIA = false;

            artigo.HashAutorizacaoIA = null;

            artigo.DataRevogacaoIA =
                DateTime.UtcNow;

            acao = "ARTIGO_REVOGADO_IA";

            mensagem =
                "Autorização para inteligência artificial revogada com sucesso.";
        }

        await _context.SaveChangesAsync(
            cancellationToken
        );

        // Invalidar resumos armazenados quando
        // a autorização é alterada.

        await _context.ResumoInteligentes
            .Where(r => r.ArtigoId == artigoId)
            .ExecuteDeleteAsync(cancellationToken);

        await transacao.CommitAsync(
            cancellationToken
        );

        // =====================================
        // AUDITORIA
        // =====================================

        await _auditoria.RegistrarAsync(
            usuarioId.Value,

            acao,

            "ARTIGO",

            artigo.ArtigoId,

            HttpContext.Connection.RemoteIpAddress?
                .ToString(),

            $"{mensagem} Artigo: {artigo.Titulo}."
        );

        return Ok(new
        {
            mensagem,

            artigo.ArtigoId,

            artigo.Titulo,

            artigo.AutorizadoIA,

            AutorizacaoValida =
                HashArtigoIAService
                    .PossuiAutorizacaoValida(artigo),

            Situacao =
                ObterSituacao(artigo),

            artigo.DataAutorizacaoIA,

            artigo.DataRevogacaoIA
        });
    }
}

// =============================================
// DTO - AUTORIZAÇÃO DE ARTIGO
// =============================================

public class AutorizacaoIARequest
{
    public bool? Autorizado { get; set; }

    public string? HashConteudo { get; set; }
}