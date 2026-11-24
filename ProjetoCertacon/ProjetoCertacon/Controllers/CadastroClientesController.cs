using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Data;
using ProjetoCertacon.Models;
using ProjetoCertacon.Services;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CadastroClientesController : ControllerBase
{
    private readonly IntegraCertaconContext _context;
    private readonly IPasswordHasher<Usuario> _passwordHasher;
    private readonly AuditoriaService _auditoria;
    private readonly PermissaoService _permissao;
    private readonly ValidacaoCnpjService _cnpj;

    public CadastroClientesController(IntegraCertaconContext context,
        IPasswordHasher<Usuario> passwordHasher, AuditoriaService auditoria,
        PermissaoService permissao, ValidacaoCnpjService cnpj)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _auditoria = auditoria;
        _permissao = permissao;
        _cnpj = cnpj;
    }

    [HttpPost]
    public async Task<IActionResult> Cadastrar([FromBody] UsuarioRequest dados)
    {
        if (!await _permissao.TemPermissaoAsync(User, "cliente.gerenciar"))
            return Forbid();
        if (string.IsNullOrWhiteSpace(dados.Nome) || string.IsNullOrWhiteSpace(dados.Email) ||
            string.IsNullOrWhiteSpace(dados.Senha) || string.IsNullOrWhiteSpace(dados.RazaoSocial) ||
            string.IsNullOrWhiteSpace(dados.Cnpj))
            return BadRequest("Preencha todos os campos obrigatórios.");
        if (dados.Senha.Length < 8)
            return BadRequest("A senha deve possuir pelo menos 8 caracteres.");
        var email = dados.Email.Trim().ToLowerInvariant();
        if (await _context.Usuarios.AnyAsync(u => u.Email == email))
            return BadRequest("Este e-mail já está cadastrado.");
        var cnpj = _cnpj.Normalizar(dados.Cnpj);
        if (!_cnpj.Valido(cnpj))
            return BadRequest("CNPJ inválido.");
        if (await _context.Usuarios.AnyAsync(u => u.Cnpj == cnpj))
            return BadRequest("Este CNPJ já está cadastrado.");
        var perfil = await _context.Perfils.FirstOrDefaultAsync(p => p.Nome == "Cliente" && p.Ativo);
        if (perfil == null) return BadRequest("Perfil Cliente não encontrado ou inativo.");
        var usuario = new Usuario
        {
            UsuarioId = Guid.NewGuid(),
            Nome = dados.Nome.Trim(),
            Email = email,
            RazaoSocial = dados.RazaoSocial.Trim(),
            Cnpj = cnpj,
            TelefoneContato = dados.TelefoneContato?.Trim(),
            Ativo = true,
            DataCriacao = DateTime.Now
        };
        usuario.SenhaHash = _passwordHasher.HashPassword(usuario, dados.Senha);
        _context.Usuarios.Add(usuario);
        _context.UsuarioPerfils.Add(new UsuarioPerfil
        {
            UsuarioPerfilId = Guid.NewGuid(),
            UsuarioId = usuario.UsuarioId,
            PerfilId = perfil.PerfilId,
            DataAtribuicao = DateTime.Now
        });
        await _context.SaveChangesAsync();
        await _auditoria.RegistrarAsync(_permissao.ObterUsuarioId(User), "USUARIO_CRIADO", "USUARIO",
            usuario.UsuarioId, HttpContext.Connection.RemoteIpAddress?.ToString(), "Cliente cadastrado: " + usuario.Email);
        return Ok(new
        {
            mensagem = "Cliente cadastrado com sucesso.",
            usuario.UsuarioId,
            usuario.Nome,
            usuario.Email,
            usuario.RazaoSocial,
            usuario.Cnpj,
            usuario.TelefoneContato,
            usuario.Ativo,
            usuario.DataCriacao,
            Perfil = perfil.Nome
        });
    }
}
