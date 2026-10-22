
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Models;
using ProjetoCertacon.Data;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
public class UsuariosController : ControllerBase
{
    private readonly IntegraCertaconContext _context;
    private readonly IPasswordHasher<Usuario> _passwordHasher;

    public UsuariosController(
        IntegraCertaconContext context,
        IPasswordHasher<Usuario> passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    [HttpPost]
    public async Task<IActionResult> Cadastrar(UsuarioRequest dados)
    {
        if (string.IsNullOrWhiteSpace(dados.Nome) ||
            string.IsNullOrWhiteSpace(dados.Email) ||
            string.IsNullOrWhiteSpace(dados.Senha) ||
            string.IsNullOrWhiteSpace(dados.Perfil))
        {
            return BadRequest("Preencha todos os campos.");
        }

        var email = dados.Email.Trim();

        var existe = await _context.Usuarios
            .AnyAsync(u => u.Email == email);

        if (existe)
            return BadRequest("Este e-mail já está cadastrado.");

        var perfil = await _context.Perfils
            .FirstOrDefaultAsync(p =>
                p.Nome == dados.Perfil && p.Ativo);

        if (perfil == null)
            return BadRequest("Perfil não encontrado ou inativo.");

        var usuario = new Usuario
        {
            UsuarioId = Guid.NewGuid(),
            Nome = dados.Nome.Trim(),
            Email = email,
            Ativo = true,
            DataCriacao = DateTime.Now
        };

        usuario.SenhaHash = _passwordHasher.HashPassword(
            usuario, dados.Senha);

        _context.Usuarios.Add(usuario);

        var usuarioPerfil = new UsuarioPerfil
        {
            UsuarioPerfilId = Guid.NewGuid(),
            UsuarioId = usuario.UsuarioId,
            PerfilId = perfil.PerfilId,
            DataAtribuicao = DateTime.Now
        };

        _context.UsuarioPerfils.Add(usuarioPerfil);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem = "Usuário cadastrado com sucesso.",
            usuario.Nome,
            usuario.Email,
            Perfil = perfil.Nome
        });
    }
}

public class UsuarioRequest
{
    public string Nome { get; set; } = "";
    public string Email { get; set; } = "";
    public string Senha { get; set; } = "";
    public string Perfil { get; set; } = "";
}
