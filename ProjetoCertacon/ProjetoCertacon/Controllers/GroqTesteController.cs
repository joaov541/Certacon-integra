using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

using ProjetoCertacon.Services;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
public class GroqTesteController : ControllerBase
{
    private readonly GroqService _groq;

    private readonly IWebHostEnvironment _environment;

    public GroqTesteController(
        GroqService groq,
        IWebHostEnvironment environment)
    {
        _groq = groq;

        _environment = environment;
    }

    // =========================================
    // TESTAR COMUNICAÇÃO COM GROQ
    // =========================================

    [HttpPost]
    public async Task<IActionResult> Testar(
        CancellationToken cancellationToken)
    {
        // Endpoint temporário de desenvolvimento.

        if (!_environment.IsDevelopment())
        {
            return NotFound();
        }

        try
        {
            string instrucaoSistema =
                "Você é o Assistente Fiscal do IntegraCertacon. " +
                "Responda exclusivamente em português do Brasil. " +
                "Seja objetivo, claro e educado.";

            string pergunta =
                "Apresente-se brevemente como o Assistente " +
                "Fiscal do IntegraCertacon e informe que " +
                "a comunicação com a inteligência artificial " +
                "está funcionando corretamente.";

            string resposta =
                await _groq.GerarRespostaAsync(
                    instrucaoSistema,
                    pergunta,
                    cancellationToken
                );

            return Ok(new
            {
                mensagem =
                    "Comunicação com Groq realizada com sucesso.",

                provedor = "Groq",

                resposta
            });
        }
        catch (HttpRequestException ex)
        {
            if ((int?)ex.StatusCode == 429)
            {
                return StatusCode(429, new
                {
                    mensagem = ex.Message
                });
            }

            return StatusCode(502, new
            {
                mensagem = ex.StatusCode.HasValue
                    ? ex.Message
                    : "Não foi possível estabelecer conexão com a Groq."
            });
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
        catch (InvalidOperationException ex)
        {
            return StatusCode(503, new
            {
                mensagem = ex.Message
            });
        }
        catch (JsonException)
        {
            return StatusCode(502, new
            {
                mensagem =
                    "A Groq retornou uma resposta em formato inválido."
            });
        }
    }
}