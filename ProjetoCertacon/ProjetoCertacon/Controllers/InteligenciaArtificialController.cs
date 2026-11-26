using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

using ProjetoCertacon.Services;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InteligenciaArtificialController : ControllerBase
{
    private readonly InteligenciaArtificialService _ia;

    private readonly ControleUsoIAService _controleUso;

    private readonly PermissaoService _permissoes;

    private readonly ILogger<InteligenciaArtificialController> _logger;

    public InteligenciaArtificialController(
        InteligenciaArtificialService ia,
        ControleUsoIAService controleUso,
        PermissaoService permissoes,
        ILogger<InteligenciaArtificialController> logger)
    {
        _ia = ia;

        _controleUso = controleUso;

        _permissoes = permissoes;

        _logger = logger;
    }

    // =========================================
    // POST - RESUMIR ARTIGO
    // =========================================

    [HttpPost("resumir/{artigoId:guid}")]
    public async Task<IActionResult> Resumir(
        Guid artigoId,
        CancellationToken cancellationToken)
    {
        if (artigoId == Guid.Empty)
        {
            return BadRequest(new
            {
                mensagem = "Informe um artigo válido."
            });
        }

        try
        {
            var resultado =
                await _ia.ResumirArtigoAsync(
                    User,
                    artigoId,
                    cancellationToken
                );

            return Ok(resultado);
        }
        catch (AcessoIAException ex)
        {
            return await TratarAcessoAsync(
                ex,
                cancellationToken
            );
        }
        catch (HttpRequestException ex)
        {
            return await TratarErroGroqAsync(
                ex,
                cancellationToken
            );
        }
        catch (OperationCanceledException)
            when (!cancellationToken.IsCancellationRequested)
        {
            return StatusCode(504, new
            {
                mensagem =
                    "A inteligência artificial demorou demais para responder."
            });
        }
        catch (JsonException)
        {
            return StatusCode(502, new
            {
                mensagem =
                    "O serviço de inteligência artificial retornou uma resposta inválida."
            });
        }
        catch (InvalidOperationException)
        {
            _logger.LogWarning(
                "Não foi possível concluir a geração do resumo inteligente."
            );

            return StatusCode(503, new
            {
                mensagem =
                    "Não foi possível concluir o resumo. Tente novamente mais tarde."
            });
        }
        catch (Exception ex)
            when (ex is not OperationCanceledException)
        {
            _logger.LogError(
                "Falha interna ao gerar resumo inteligente. Tipo: {Tipo}",
                ex.GetType().Name
            );

            return StatusCode(500, new
            {
                mensagem =
                    "Ocorreu um erro interno ao gerar o resumo."
            });
        }
    }

    // =========================================
    // POST - PERGUNTAR AO ASSISTENTE FISCAL
    // =========================================

    [HttpPost("perguntar")]
    public async Task<IActionResult> Perguntar(
        [FromBody] PerguntaIARequest dados,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dados.Pergunta))
        {
            return BadRequest(new
            {
                mensagem =
                    "Informe uma pergunta para o assistente fiscal."
            });
        }

        if (dados.Pergunta.Trim().Length < 3)
        {
            return BadRequest(new
            {
                mensagem =
                    "A pergunta deve possuir pelo menos três caracteres."
            });
        }

        if (dados.Pergunta.Length > 1000)
        {
            return BadRequest(new
            {
                mensagem =
                    "A pergunta deve possuir até 1000 caracteres."
            });
        }

        try
        {
            var resultado =
                await _ia.PerguntarAsync(
                    User,
                    dados.Pergunta,
                    cancellationToken
                );

            return Ok(resultado);
        }
        catch (AcessoIAException ex)
        {
            return await TratarAcessoAsync(
                ex,
                cancellationToken
            );
        }
        catch (HttpRequestException ex)
        {
            return await TratarErroGroqAsync(
                ex,
                cancellationToken
            );
        }
        catch (OperationCanceledException)
            when (!cancellationToken.IsCancellationRequested)
        {
            return StatusCode(504, new
            {
                mensagem =
                    "O assistente fiscal demorou demais para responder."
            });
        }
        catch (JsonException)
        {
            return StatusCode(502, new
            {
                mensagem =
                    "O serviço de inteligência artificial retornou uma resposta inválida."
            });
        }
        catch (InvalidOperationException)
        {
            _logger.LogWarning(
                "Não foi possível concluir uma consulta à inteligência artificial."
            );

            return StatusCode(503, new
            {
                mensagem =
                    "O assistente fiscal não conseguiu concluir a resposta. Tente novamente mais tarde."
            });
        }
        catch (Exception ex)
            when (ex is not OperationCanceledException)
        {
            _logger.LogError(
                "Falha interna na consulta à IA. Tipo: {Tipo}",
                ex.GetType().Name
            );

            return StatusCode(500, new
            {
                mensagem =
                    "Ocorreu um erro interno ao consultar o assistente fiscal."
            });
        }
    }

    // =========================================
    // GET - CONSULTAR LIMITE DIÁRIO
    // =========================================

    [HttpGet("limites")]
    public async Task<IActionResult> ConsultarLimites(
        CancellationToken cancellationToken)
    {
        var usuarioId =
            _permissoes.ObterUsuarioId(User);

        if (
            !usuarioId.HasValue ||
            usuarioId.Value == Guid.Empty
        )
        {
            return Unauthorized(new
            {
                mensagem = "Usuário não autenticado."
            });
        }

        bool podeResumir =
            await _permissoes.TemPermissaoAsync(
                User,
                "ia.resumir.artigo"
            );

        bool podeConsultar =
            await _permissoes.TemPermissaoAsync(
                User,
                "ia.consultar"
            );

        if (!podeResumir && !podeConsultar)
        {
            return Forbid();
        }

        var resultado =
            await _controleUso.ConsultarAsync(
                usuarioId.Value,
                cancellationToken
            );

        return Ok(new
        {
            resultado.DataReferencia,

            resultado.LimiteDiario,

            resultado.QuantidadeResumos,

            resultado.QuantidadePerguntas,

            resultado.ConsultasUtilizadas,

            resultado.ConsultasRestantes,

            resultado.LimiteAtingido,

            PodeResumir = podeResumir,

            PodeConsultar = podeConsultar,

            FusoHorario = "America/Sao_Paulo"
        });
    }

    // =========================================
    // TRATAR ERROS DE ACESSO
    // =========================================

    private async Task<IActionResult> TratarAcessoAsync(
        AcessoIAException exception,
        CancellationToken cancellationToken)
    {
        if (exception.StatusCode == 401)
        {
            return Unauthorized(new
            {
                mensagem = exception.Message
            });
        }

        if (exception.StatusCode == 403)
        {
            return Forbid();
        }

        if (exception.StatusCode == 429)
        {
            var usuarioId =
                _permissoes.ObterUsuarioId(User);

            if (usuarioId.HasValue)
            {
                var limite =
                    await _controleUso.ConsultarAsync(
                        usuarioId.Value,
                        cancellationToken
                    );

                return StatusCode(429, new
                {
                    mensagem = exception.Message,

                    codigo = "LIMITE_DIARIO_USUARIO",

                    limite.LimiteDiario,

                    limite.ConsultasUtilizadas,

                    limite.ConsultasRestantes
                });
            }
        }

        return StatusCode(
            exception.StatusCode,
            new
            {
                mensagem = exception.Message
            }
        );
    }

    // =========================================
    // TRATAR ERROS DA GROQ
    // =========================================

    private async Task<IActionResult> TratarErroGroqAsync(
        HttpRequestException exception,
        CancellationToken cancellationToken)
    {
        var codigoExterno =
            (int?)exception.StatusCode;

        // Não registrar a API Key,
        // perguntas ou conteúdos dos artigos.

        _logger.LogWarning(
            "Falha na comunicação com Groq. HTTP: {Codigo}",
            codigoExterno
        );

        if (codigoExterno == 429)
        {
            var usuarioId =
                _permissoes.ObterUsuarioId(User);

            int? restantes = null;

            if (usuarioId.HasValue)
            {
                var limite =
                    await _controleUso.ConsultarAsync(
                        usuarioId.Value,
                        cancellationToken
                    );

                restantes =
                    limite.ConsultasRestantes;
            }

            return StatusCode(429, new
            {
                mensagem =
                    "O provedor de inteligência artificial atingiu seu limite de utilização. Tente novamente mais tarde.",

                codigo = "LIMITE_PROVEDOR_GROQ",

                consultasRestantes = restantes
            });
        }

        if (codigoExterno == 503)
        {
            return StatusCode(503, new
            {
                mensagem =
                    "O serviço de inteligência artificial está temporariamente indisponível."
            });
        }

        return StatusCode(502, new
        {
            mensagem =
                "Não foi possível estabelecer uma comunicação válida com o serviço de inteligência artificial."
        });
    }
}

// =============================================
// DTO - PERGUNTA AO ASSISTENTE
// =============================================

public class PerguntaIARequest
{
    public string Pergunta { get; set; } = "";
}