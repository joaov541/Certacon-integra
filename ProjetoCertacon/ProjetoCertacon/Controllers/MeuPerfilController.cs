
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Data;
using ProjetoCertacon.Models;
using System.Security.Claims;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MeuPerfilController : ControllerBase
{
    private readonly IntegraCertaconContext _context;
    private readonly IPasswordHasher<Usuario> _passwordHasher;

    public MeuPerfilController(
        IntegraCertaconContext context,
        IPasswordHasher<Usuario> passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    // Identifica o usuário autenticado pelo JWT.
    private Guid? ObterUsuarioId()
    {
        var identificador = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        return Guid.TryParse(identificador, out var id)
            ? id
            : null;
    }

    /// <summary>
    /// Consulta os dados do usuário autenticado.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Consultar()
    {
        var usuarioId = ObterUsuarioId();

        if (usuarioId == null)
            return Unauthorized();

        var usuario = await _context.Usuarios
            .AsNoTracking()
            .Where(u => u.UsuarioId == usuarioId && u.Ativo)
            .Select(u => new
            {
                u.UsuarioId,
                u.Nome,
                u.Email,
                u.TelefoneContato,
                u.RazaoSocial,
                u.Cnpj,
                u.DataCriacao,
                Perfis = u.UsuarioPerfils
                    .Where(up => up.Perfil.Ativo)
                    .Select(up => up.Perfil.Nome)
                    .ToList()
            })
            .FirstOrDefaultAsync();

        if (usuario == null)
            return NotFound("Usuário não encontrado ou desativado.");

        return Ok(usuario);
    }

    /// <summary>
    /// Atualiza os dados pessoais do usuário autenticado.
    /// Não permite alterar perfil, CNPJ ou status.
    /// </summary>
    [HttpPut]
    public async Task<IActionResult> Atualizar(
        [FromBody] AtualizarMeuPerfilRequest dados)
    {
        var usuarioId = ObterUsuarioId();

        if (usuarioId == null)
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(dados.Nome) ||
            string.IsNullOrWhiteSpace(dados.Email))
        {
            return BadRequest("Nome e e-mail são obrigatórios.");
        }

        var email = dados.Email.Trim().ToLowerInvariant();

        if (!new System.Net.Mail.MailAddress(email)
            .Address.Equals(email, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("E-mail inválido.");
        }

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u =>
                u.UsuarioId == usuarioId && u.Ativo);

        if (usuario == null)
            return NotFound("Usuário não encontrado.");

        var emailExiste = await _context.Usuarios.AnyAsync(u =>
            u.Email == email &&
            u.UsuarioId != usuario.UsuarioId);

        if (emailExiste)
            return Conflict("Este e-mail já está cadastrado.");

        usuario.Nome = dados.Nome.Trim();
        usuario.Email = email;
        usuario.TelefoneContato =
            string.IsNullOrWhiteSpace(dados.TelefoneContato)
                ? null
                : dados.TelefoneContato.Trim();

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem = "Perfil atualizado com sucesso.",
            usuario.UsuarioId,
            usuario.Nome,
            usuario.Email,
            usuario.TelefoneContato
        });
    }

    /// <summary>
    /// Altera a senha do usuário autenticado.
    /// Exige a confirmação da senha atual.
    /// </summary>
    [HttpPut("alterar-senha")]
    public async Task<IActionResult> AlterarSenha(
        [FromBody] AlterarSenhaMeuPerfilRequest dados)
    {
        var usuarioId = ObterUsuarioId();

        if (usuarioId == null)
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(dados.SenhaAtual) ||
            string.IsNullOrWhiteSpace(dados.NovaSenha))
        {
            return BadRequest(
                "Informe a senha atual e a nova senha.");
        }

        if (dados.NovaSenha.Length < 8)
            return BadRequest(
                "A nova senha deve possuir pelo menos 8 caracteres.");

        if (dados.SenhaAtual == dados.NovaSenha)
            return BadRequest(
                "A nova senha deve ser diferente da senha atual.");

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u =>
                u.UsuarioId == usuarioId && u.Ativo);

        if (usuario == null)
            return NotFound("Usuário não encontrado.");

        var verificacao = _passwordHasher.VerifyHashedPassword(
            usuario,
            usuario.SenhaHash,
            dados.SenhaAtual
        );

        if (verificacao == PasswordVerificationResult.Failed)
            return BadRequest("Senha atual incorreta.");

        usuario.SenhaHash = _passwordHasher.HashPassword(
            usuario,
            dados.NovaSenha
        );

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem = "Senha alterada com sucesso."
        });
    }
}

// Dados permitidos na edição do próprio perfil.
public class AtualizarMeuPerfilRequest
{
    public string Nome { get; set; } = "";
    public string Email { get; set; } = "";
    public string? TelefoneContato { get; set; }
}

// Dados necessários para alterar a senha.
public class AlterarSenhaMeuPerfilRequest
{
    public string SenhaAtual { get; set; } = "";
    public string NovaSenha { get; set; } = "";
}
