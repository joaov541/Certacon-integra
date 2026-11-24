using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Data;
using ProjetoCertacon.Models;
using ProjetoCertacon.Services;
using System.Net.Mail;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MeuPerfilController : ControllerBase
{
    private readonly IntegraCertaconContext _context;
    private readonly IPasswordHasher<Usuario> _passwordHasher;
    private readonly PermissaoService _permissoes;
    private readonly AuditoriaService _auditoria;
    public MeuPerfilController(IntegraCertaconContext context, IPasswordHasher<Usuario> passwordHasher,
        PermissaoService permissoes, AuditoriaService auditoria)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _permissoes = permissoes;
        _auditoria = auditoria;
    }
    private Guid? ObterUsuarioId() => _permissoes.ObterUsuarioId(User);
    private IQueryable<Usuario> UsuariosAtivos() => _context.Usuarios.Where(u => u.Ativo && u.UsuarioPerfils.Any(up => up.Perfil.Ativo));
    private async Task Registrar(Guid id, string acao, string detalhes) => await _auditoria.RegistrarAsync(
        id, acao, "USUARIO", id, HttpContext.Connection.RemoteIpAddress?.ToString(), detalhes);

    [HttpGet]
    public async Task<IActionResult> Consultar()
    {
        var id = ObterUsuarioId();
        if (!id.HasValue) return Unauthorized();
        var usuario = await UsuariosAtivos().AsNoTracking().Where(u => u.UsuarioId == id.Value)
            .Select(u => new {
                u.UsuarioId,
                u.Nome,
                u.Email,
                u.TelefoneContato,
                u.RazaoSocial,
                u.Cnpj,
                u.DataCriacao,
                Perfis = u.UsuarioPerfils.Where(up => up.Perfil.Ativo).Select(up => up.Perfil.Nome).ToList()
            }).FirstOrDefaultAsync();
        if (usuario == null) return Forbid();
        return Ok(usuario);
    }
    [HttpPut]
    public async Task<IActionResult> Atualizar([FromBody] AtualizarMeuPerfilRequest dados)
    {
        var id = ObterUsuarioId();
        if (!id.HasValue) return Unauthorized();
        var usuario = await UsuariosAtivos().FirstOrDefaultAsync(u => u.UsuarioId == id.Value);
        if (usuario == null) return Forbid();
        if (string.IsNullOrWhiteSpace(dados.Nome) || string.IsNullOrWhiteSpace(dados.Email))
            return BadRequest("Nome e e-mail são obrigatórios.");
        var nome = dados.Nome.Trim();
        var email = dados.Email.Trim().ToLowerInvariant();
        var telefone = string.IsNullOrWhiteSpace(dados.TelefoneContato) ? null : dados.TelefoneContato.Trim();
        if (nome.Length > 150 || email.Length > 256 || telefone?.Length > 30 ||
            !MailAddress.TryCreate(email, out var endereco) || !endereco.Address.Equals(email, StringComparison.OrdinalIgnoreCase))
            return BadRequest("Nome, e-mail ou telefone inválido.");
        if (await _context.Usuarios.AnyAsync(u => u.Email == email && u.UsuarioId != id.Value))
            return Conflict("Este e-mail já está cadastrado.");
        usuario.Nome = nome;
        usuario.Email = email;
        usuario.TelefoneContato = telefone;
        try { await _context.SaveChangesAsync(); }
        catch (DbUpdateException) { return Conflict("Não foi possível salvar os dados. Verifique se o e-mail já está cadastrado."); }
        await Registrar(id.Value, "PERFIL_ATUALIZADO", "Dados pessoais atualizados.");
        return Ok(new { mensagem = "Perfil atualizado com sucesso.", usuario.UsuarioId, usuario.Nome, usuario.Email, usuario.TelefoneContato });
    }
    [HttpPut("alterar-senha")]
    public async Task<IActionResult> AlterarSenha([FromBody] AlterarSenhaMeuPerfilRequest dados)
    {
        var id = ObterUsuarioId();
        if (!id.HasValue) return Unauthorized();
        var usuario = await UsuariosAtivos().FirstOrDefaultAsync(u => u.UsuarioId == id.Value);
        if (usuario == null) return Forbid();
        if (string.IsNullOrWhiteSpace(dados.SenhaAtual) || string.IsNullOrWhiteSpace(dados.NovaSenha))
            return BadRequest("Informe a senha atual e a nova senha.");
        if (dados.NovaSenha.Length < 8) return BadRequest("A nova senha deve possuir pelo menos 8 caracteres.");
        if (dados.SenhaAtual == dados.NovaSenha) return BadRequest("A nova senha deve ser diferente da senha atual.");
        if (_passwordHasher.VerifyHashedPassword(usuario, usuario.SenhaHash, dados.SenhaAtual) == PasswordVerificationResult.Failed)
            return BadRequest("Senha atual incorreta.");
        usuario.SenhaHash = _passwordHasher.HashPassword(usuario, dados.NovaSenha);
        await _context.SaveChangesAsync();
        await Registrar(id.Value, "SENHA_ALTERADA", "Senha pessoal alterada.");
        return Ok(new { mensagem = "Senha alterada com sucesso." });
    }
}
public class AtualizarMeuPerfilRequest
{
    public string Nome { get; set; } = "";
    public string Email { get; set; } = "";
    public string? TelefoneContato { get; set; }
}
public class AlterarSenhaMeuPerfilRequest
{
    public string SenhaAtual { get; set; } = "";
    public string NovaSenha { get; set; } = "";
}
