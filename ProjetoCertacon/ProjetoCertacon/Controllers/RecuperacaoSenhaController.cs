using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ProjetoCertacon.Services;
using System.ComponentModel.DataAnnotations;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class RecuperacaoSenhaController : ControllerBase
{
    private readonly RecuperacaoSenhaService _recuperacao;
    private readonly AuditoriaService _auditoria;
    private readonly ILogger<RecuperacaoSenhaController> _logger;

    public RecuperacaoSenhaController(
        RecuperacaoSenhaService recuperacao,
        AuditoriaService auditoria,
        ILogger<RecuperacaoSenhaController> logger)
    {
        _recuperacao = recuperacao;
        _auditoria = auditoria;
        _logger = logger;
    }

    // =========================================
    // SOLICITAR RECUPERAÇÃO DE SENHA
    // =========================================

    [HttpPost("solicitar")]
    [EnableRateLimiting("recuperacao-senha")]
    public async Task<IActionResult> Solicitar(
        [FromBody] SolicitarRecuperacaoRequest dados,
        CancellationToken cancellationToken)
    {
        try
        {
            await _recuperacao.SolicitarAsync(
                dados.Email,
                cancellationToken
            );
        }
        catch (Exception ex)
            when (ex is not OperationCanceledException)
        {
            _logger.LogError(
                "Falha na solicitação de recuperação. Tipo: {TipoErro}",
                ex.GetType().Name
            );
        }

        // Resposta genérica para não revelar
        // se o e-mail está cadastrado.

        return Ok(new
        {
            mensagem =
                "Se o e-mail informado estiver cadastrado, " +
                "você receberá as instruções para redefinir sua senha."
        });
    }

    // =========================================
    // VALIDAR TOKEN DE RECUPERAÇÃO
    // =========================================

    [HttpPost("validar")]
    [EnableRateLimiting("validacao-recuperacao")]
    public async Task<IActionResult> Validar(
        [FromBody] ValidarRecuperacaoRequest dados,
        CancellationToken cancellationToken)
    {
        var valido = await _recuperacao.ValidarTokenAsync(
            dados.Token,
            cancellationToken
        );

        if (!valido)
        {
            return BadRequest(new
            {
                valido = false,

                mensagem =
                    "O link de recuperação é inválido, " +
                    "expirou ou já foi utilizado."
            });
        }

        return Ok(new
        {
            valido = true,

            mensagem =
                "Token de recuperação válido."
        });
    }

    // =========================================
    // REDEFINIR SENHA
    // =========================================

    [HttpPost("redefinir")]
    [EnableRateLimiting("validacao-recuperacao")]
    public async Task<IActionResult> Redefinir(
        [FromBody] RedefinirSenhaRequest dados,
        CancellationToken cancellationToken)
    {
        // =====================================
        // VALIDAR SENHAS
        // =====================================

        if (dados.NovaSenha != dados.ConfirmarSenha)
        {
            return BadRequest(new
            {
                mensagem = "As senhas informadas não coincidem."
            });
        }

        if (
            string.IsNullOrWhiteSpace(dados.NovaSenha) ||
            dados.NovaSenha.Length < 8 ||
            dados.NovaSenha.Length > 128
        )
        {
            return BadRequest(new
            {
                mensagem =
                    "A senha deve possuir entre 8 e 128 caracteres."
            });
        }

        // =====================================
        // REDEFINIR SENHA
        // =====================================

        var usuarioId = await _recuperacao.RedefinirAsync(
            dados.Token,
            dados.NovaSenha,
            cancellationToken
        );

        if (usuarioId == null)
        {
            return BadRequest(new
            {
                mensagem =
                    "O link de recuperação é inválido, " +
                    "expirou ou já foi utilizado."
            });
        }

        // =====================================
        // REGISTRAR AUDITORIA
        // =====================================

        var enderecoIp =
            HttpContext.Connection.RemoteIpAddress?.ToString();

        try
        {
            await _auditoria.RegistrarAsync(
                usuarioId.Value,
                "SENHA_REDEFINIDA",
                "USUARIO",
                usuarioId.Value,
                enderecoIp ?? "Desconhecido",
                "Senha redefinida por meio da recuperação por e-mail."
            );
        }
        catch (Exception ex)
        {
            // A senha já foi alterada.
            // Uma falha na auditoria não deve informar
            // incorretamente que a redefinição falhou.

            _logger.LogError(
                "Falha ao registrar auditoria de redefinição. Tipo: {TipoErro}",
                ex.GetType().Name
            );
        }

        return Ok(new
        {
            mensagem =
                "Senha redefinida com sucesso. " +
                "Você já pode acessar sua conta com a nova senha."
        });
    }
}

// =============================================
// DTO - SOLICITAR RECUPERAÇÃO
// =============================================

public class SolicitarRecuperacaoRequest
{
    [Required]
    [EmailAddress]
    [StringLength(254)]
    public string Email { get; set; } = "";
}

// =============================================
// DTO - VALIDAR TOKEN
// =============================================

public class ValidarRecuperacaoRequest
{
    [Required]
    [StringLength(64, MinimumLength = 64)]
    public string Token { get; set; } = "";
}

// =============================================
// DTO - REDEFINIR SENHA
// =============================================

public class RedefinirSenhaRequest
{
    [Required]
    [StringLength(64, MinimumLength = 64)]
    public string Token { get; set; } = "";

    [Required]
    [StringLength(128, MinimumLength = 8)]
    public string NovaSenha { get; set; } = "";

    [Required]
    [StringLength(128, MinimumLength = 8)]
    public string ConfirmarSenha { get; set; } = "";
}