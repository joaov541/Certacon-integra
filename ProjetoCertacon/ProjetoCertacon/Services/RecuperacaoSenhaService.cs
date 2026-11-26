using System.Data;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Data;
using ProjetoCertacon.Models;

namespace ProjetoCertacon.Services;

public class RecuperacaoSenhaService
{
    private readonly IntegraCertaconContext _context;
    private readonly EmailService _emailService;
    private readonly IPasswordHasher<Usuario> _passwordHasher;
    private readonly IConfiguration _configuration;
    private readonly ILogger<RecuperacaoSenhaService> _logger;

    public RecuperacaoSenhaService(
        IntegraCertaconContext context,
        EmailService emailService,
        IPasswordHasher<Usuario> passwordHasher,
        IConfiguration configuration,
        ILogger<RecuperacaoSenhaService> logger)
    {
        _context = context;
        _emailService = emailService;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
        _logger = logger;
    }

    // =========================================
    // GERAR TOKEN SEGURO
    // =========================================

    private static string GerarToken()
    {
        return Convert.ToHexString(
            RandomNumberGenerator.GetBytes(32)
        );
    }

    // =========================================
    // GERAR HASH DO TOKEN
    // =========================================

    private static string GerarHash(string token)
    {
        var bytes = SHA256.HashData(
            Encoding.UTF8.GetBytes(token)
        );

        return Convert.ToHexString(bytes);
    }

    // =========================================
    // SOLICITAR RECUPERAÇÃO DE SENHA
    // =========================================

    public async Task SolicitarAsync(
        string email,
        CancellationToken cancellationToken = default)
    {
        if (
            string.IsNullOrWhiteSpace(email) ||
            email.Length > 254
        )
        {
            return;
        }

        email = email.Trim().ToUpperInvariant();

        var usuario = await _context.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(
                u =>
                    u.Email.ToUpper() == email &&
                    u.Ativo == true,
                cancellationToken
            );

        // Não revelar se o usuário existe.

        if (usuario == null)
        {
            return;
        }

        var urlFrontend =
            _configuration["RecuperacaoSenha:UrlFrontend"];

        if (string.IsNullOrWhiteSpace(urlFrontend))
        {
            throw new InvalidOperationException(
                "A URL do frontend não está configurada."
            );
        }

        var validadeMinutos = Math.Clamp(
            _configuration.GetValue<int>(
                "RecuperacaoSenha:ValidadeMinutos",
                15
            ),
            1,
            15
        );

        var agora = DateTime.UtcNow;

        var token = GerarToken();

        var tokenHash = GerarHash(token);

        var link =
            $"{urlFrontend.TrimEnd('/')}" +
            $"/redefinir-senha#token={token}";

        // =====================================
        // INICIAR TRANSAÇÃO
        // =====================================

        await using (
            var transacao = await _context.Database
                .BeginTransactionAsync(
                    IsolationLevel.Serializable,
                    cancellationToken
                )
        )
        {
            // =================================
            // LIMITAR SOLICITAÇÕES
            // =================================

            var ultimaHora = agora.AddHours(-1);

            var solicitacoesRecentes =
                await _context.RecuperacaoSenhas
                    .CountAsync(
                        r =>
                            r.UsuarioId == usuario.UsuarioId &&
                            r.DataCriacao >= ultimaHora,
                        cancellationToken
                    );

            // Máximo de 3 solicitações por hora.

            if (solicitacoesRecentes >= 3)
            {
                return;
            }

            var ultimoMinuto = agora.AddMinutes(-1);

            var solicitacaoRecente =
                await _context.RecuperacaoSenhas
                    .AnyAsync(
                        r =>
                            r.UsuarioId == usuario.UsuarioId &&
                            r.DataCriacao >= ultimoMinuto,
                        cancellationToken
                    );

            if (solicitacaoRecente)
            {
                return;
            }

            // =================================
            // REVOGAR TOKENS ANTERIORES
            // =================================

            await _context.RecuperacaoSenhas
                .Where(
                    r =>
                        r.UsuarioId == usuario.UsuarioId &&
                        r.DataUtilizacao == null &&
                        !r.Revogado
                )
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(
                        r => r.Revogado,
                        true
                    ),
                    cancellationToken
                );

            // =================================
            // REGISTRAR NOVA SOLICITAÇÃO
            // =================================

            var recuperacao = new RecuperacaoSenha
            {
                RecuperacaoSenhaId = Guid.NewGuid(),

                UsuarioId = usuario.UsuarioId,

                TokenHash = tokenHash,

                DataCriacao = agora,

                DataExpiracao =
                    agora.AddMinutes(validadeMinutos),

                DataUtilizacao = null,

                Revogado = false
            };

            _context.RecuperacaoSenhas.Add(recuperacao);

            await _context.SaveChangesAsync(
                cancellationToken
            );

            await transacao.CommitAsync(
                cancellationToken
            );
        }

        // =====================================
        // ENVIAR E-MAIL
        // =====================================

        var conteudoHtml = GerarEmailRecuperacao(
            usuario.Nome,
            link,
            validadeMinutos
        );

        try
        {
            await _emailService.EnviarAsync(
                usuario.Email,
                "IntegraCertacon - Recuperação de senha",
                conteudoHtml,
                cancellationToken
            );
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            // Não registrar senhas, tokens ou links.

            _logger.LogError(
                "Falha no envio da recuperação de senha. Tipo: {TipoErro}",
                ex.GetType().Name
            );
        }
    }

    // =========================================
    // VALIDAR TOKEN
    // =========================================

    public async Task<bool> ValidarTokenAsync(
        string token,
        CancellationToken cancellationToken = default)
    {
        if (
            string.IsNullOrWhiteSpace(token) ||
            token.Length != 64
        )
        {
            return false;
        }

        var tokenHash = GerarHash(token);

        var agora = DateTime.UtcNow;

        return await _context.RecuperacaoSenhas
            .AsNoTracking()
            .AnyAsync(
                r =>
                    r.TokenHash == tokenHash &&
                    !r.Revogado &&
                    r.DataUtilizacao == null &&
                    r.DataExpiracao > agora &&
                    r.Usuario.Ativo == true,
                cancellationToken
            );
    }

    // =========================================
    // REDEFINIR SENHA
    // =========================================

    public async Task<Guid?> RedefinirAsync(
        string token,
        string novaSenha,
        CancellationToken cancellationToken = default)
    {
        if (
            string.IsNullOrWhiteSpace(token) ||
            token.Length != 64 ||
            string.IsNullOrWhiteSpace(novaSenha) ||
            novaSenha.Length < 8 ||
            novaSenha.Length > 128
        )
        {
            return null;
        }

        var tokenHash = GerarHash(token);

        var agora = DateTime.UtcNow;

        await using var transacao =
            await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken
            );

        // =====================================
        // LOCALIZAR TOKEN VÁLIDO
        // =====================================

        var recuperacao =
            await _context.RecuperacaoSenhas
                .Include(r => r.Usuario)
                .FirstOrDefaultAsync(
                    r =>
                        r.TokenHash == tokenHash &&
                        !r.Revogado &&
                        r.DataUtilizacao == null &&
                        r.DataExpiracao > agora &&
                        r.Usuario.Ativo == true,
                    cancellationToken
                );

        if (recuperacao == null)
        {
            return null;
        }

        var usuario = recuperacao.Usuario;

        // =====================================
        // GERAR NOVO HASH DA SENHA
        // =====================================

        usuario.SenhaHash =
            _passwordHasher.HashPassword(
                usuario,
                novaSenha
            );

        // =====================================
        // MARCAR TOKEN COMO UTILIZADO
        // =====================================

        recuperacao.DataUtilizacao = agora;

        await _context.SaveChangesAsync(
            cancellationToken
        );

        // =====================================
        // REVOGAR DEMAIS TOKENS
        // =====================================

        await _context.RecuperacaoSenhas
            .Where(
                r =>
                    r.UsuarioId == usuario.UsuarioId &&
                    r.RecuperacaoSenhaId !=
                        recuperacao.RecuperacaoSenhaId &&
                    r.DataUtilizacao == null &&
                    !r.Revogado
            )
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(
                    r => r.Revogado,
                    true
                ),
                cancellationToken
            );

        await transacao.CommitAsync(
            cancellationToken
        );

        return usuario.UsuarioId;
    }

    // =========================================
    // TEMPLATE DO E-MAIL
    // =========================================

    private static string GerarEmailRecuperacao(
        string nome,
        string link,
        int validadeMinutos)
    {
        var nomeSeguro = WebUtility.HtmlEncode(nome);

        var linkSeguro = WebUtility.HtmlEncode(link);

        return $"""
            <!DOCTYPE html>
            <html lang="pt-BR">

            <body style="margin:0;padding:25px;background:#f4f7fb;font-family:Arial,sans-serif;">

                <div style="max-width:600px;margin:auto;background:#ffffff;border:1px solid #dfe3eb;border-radius:12px;overflow:hidden;">

                    <div style="background:#1d2e68;padding:30px;text-align:center;">

                        <h1 style="margin:0;color:#ffffff;">
                            Integra<span style="color:#ff8500;">Certacon</span>
                        </h1>

                        <p style="color:#dce5f3;font-size:14px;">
                            Portal de Inteligência Tributária
                        </p>

                    </div>

                    <div style="height:5px;background:#ff8500;"></div>

                    <div style="padding:30px;color:#333333;line-height:1.7;">

                        <h2 style="color:#1d2e68;">
                            Recuperação de senha
                        </h2>

                        <p>
                            Olá, <strong>{nomeSeguro}</strong>!
                        </p>

                        <p>
                            Recebemos uma solicitação para redefinir
                            a senha da sua conta no IntegraCertacon.
                        </p>

                        <p>
                            Clique no botão abaixo para criar
                            uma nova senha de acesso.
                        </p>

                        <div style="text-align:center;margin:30px 0;">

                            <a href="{linkSeguro}"
                               style="display:inline-block;background:#ff8500;color:#1d2e68;padding:15px 25px;text-decoration:none;font-weight:bold;border-radius:8px;">

                                Redefinir minha senha

                            </a>

                        </div>

                        <div style="background:#f4f7fb;border-left:4px solid #1d2e68;padding:15px;border-radius:6px;">

                            <strong>
                                Informações de segurança
                            </strong>

                            <p style="margin-bottom:0;">
                                Este link possui validade de
                                {validadeMinutos} minutos e poderá
                                ser utilizado somente uma vez.
                            </p>

                        </div>

                        <p>
                            Caso você não tenha solicitado a
                            recuperação de senha, ignore este e-mail.
                            Sua senha permanecerá inalterada.
                        </p>

                        <p style="font-size:12px;color:#777777;overflow-wrap:anywhere;">

                            Caso o botão não funcione, copie e cole
                            o endereço abaixo no navegador:

                            <br><br>

                            {linkSeguro}

                        </p>

                        <p>
                            Atenciosamente,<br>
                            <strong>Equipe IntegraCertacon</strong>
                        </p>

                    </div>

                    <div style="background:#f4f7fb;padding:20px;text-align:center;color:#777777;font-size:12px;">

                        © 2026 IntegraCertacon

                        <br>

                        Mensagem automática do sistema.

                        <br>

                        Não responda a este e-mail.

                    </div>

                </div>

            </body>

            </html>
            """;
    }
}