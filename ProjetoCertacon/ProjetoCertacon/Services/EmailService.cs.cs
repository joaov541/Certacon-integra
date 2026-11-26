using MailKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace ProjetoCertacon.Services;

public class EmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    // =========================================
    // ENVIAR E-MAIL
    // =========================================

    public async Task EnviarAsync(
        string destinatario,
        string assunto,
        string conteudoHtml,
        CancellationToken cancellationToken = default)
    {
        // =====================================
        // CARREGAR CONFIGURAÇÕES
        // =====================================

        var host = _configuration["Email:Host"];

        var porta = _configuration
            .GetValue<int>("Email:Port", 587);

        var remetente = _configuration["Email:Remetente"];

        var nomeRemetente =
            _configuration["Email:NomeRemetente"]
            ?? "IntegraCertacon";

        var usuario = _configuration["Email:Usuario"];

        var senha = _configuration["Email:Senha"];

        // =====================================
        // VALIDAR CONFIGURAÇÕES
        // =====================================

        if (
            string.IsNullOrWhiteSpace(host) ||
            string.IsNullOrWhiteSpace(remetente) ||
            string.IsNullOrWhiteSpace(usuario) ||
            string.IsNullOrWhiteSpace(senha)
        )
        {
            throw new InvalidOperationException(
                "O serviço de e-mail não está configurado corretamente."
            );
        }

        if (
            !MailboxAddress.TryParse(
                destinatario,
                out var enderecoDestinatario
            )
        )
        {
            throw new ArgumentException(
                "Endereço de e-mail inválido."
            );
        }

        // =====================================
        // MONTAR MENSAGEM
        // =====================================

        var mensagem = new MimeMessage();

        mensagem.From.Add(
            new MailboxAddress(
                nomeRemetente,
                remetente
            )
        );

        mensagem.To.Add(
            enderecoDestinatario
        );

        mensagem.Subject = assunto;

        mensagem.Body = new BodyBuilder
        {
            HtmlBody = conteudoHtml
        }.ToMessageBody();

        // =====================================
        // CONEXÃO COM O GMAIL SMTP
        // =====================================

        using var smtp = new SmtpClient();

        smtp.Timeout = 30000;

        await smtp.ConnectAsync(
            host,
            porta,
            SecureSocketOptions.StartTls,
            cancellationToken
        );

        try
        {
            // =================================
            // AUTENTICAR
            // =================================

            await smtp.AuthenticateAsync(
                usuario,
                senha,
                cancellationToken
            );

            // =================================
            // ENVIAR MENSAGEM
            // =================================

            await smtp.SendAsync(
                mensagem,
                cancellationToken
            );
        }
        finally
        {
            if (smtp.IsConnected)
            {
                await smtp.DisconnectAsync(
                    true,
                    CancellationToken.None
                );
            }
        }
    }
}