using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Data;
using ProjetoCertacon.Models;
using ProjetoCertacon.Services;
using System.Linq;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CadastroClientesController : ControllerBase
{
    private readonly IntegraCertaconContext _context;
    private readonly IPasswordHasher<Usuario> _passwordHasher;
    private readonly AuditoriaService _auditoria;

    public CadastroClientesController(
        IntegraCertaconContext context,
        IPasswordHasher<Usuario> passwordHasher,
        AuditoriaService auditoria)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _auditoria = auditoria;
    }

    /// <summary>
    /// Cadastra um novo cliente e atribui o perfil Cliente.
    /// </summary>
    ///  code="200">Cliente cadastrado com sucesso.
    [HttpPost]
    public async Task<IActionResult> Cadastrar(UsuarioRequest dados)
    {
        if (string.IsNullOrWhiteSpace(dados.Nome) ||
            string.IsNullOrWhiteSpace(dados.Email) ||
            string.IsNullOrWhiteSpace(dados.Senha) ||
            string.IsNullOrWhiteSpace(dados.RazaoSocial) ||
            string.IsNullOrWhiteSpace(dados.Cnpj))
        {
            return BadRequest("Preencha todos os campos obrigatórios.");
        }

        var email = dados.Email.Trim().ToLower();

        if (await _context.Usuarios.AnyAsync(u => u.Email == email))
            return BadRequest("Este e-mail já está cadastrado.");

        var cnpj = new string(
            dados.Cnpj.Where(char.IsDigit).ToArray());

        if (cnpj.Length != 14)
            return BadRequest("O CNPJ deve ter 14 dígitos.");

        if (await _context.Usuarios.AnyAsync(u => u.Cnpj == cnpj))
            return BadRequest("Este CNPJ já está cadastrado.");

        var perfil = await _context.Perfils
            .FirstOrDefaultAsync(p => p.Nome == "Cliente" && p.Ativo);

        if (perfil == null)
            return BadRequest("Perfil Cliente não encontrado ou inativo.");

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

        usuario.SenhaHash = _passwordHasher.HashPassword(
            usuario, dados.Senha);

        _context.Usuarios.Add(usuario);

        _context.UsuarioPerfils.Add(new UsuarioPerfil
        {
            UsuarioPerfilId = Guid.NewGuid(),
            UsuarioId = usuario.UsuarioId,
            PerfilId = perfil.PerfilId,
            DataAtribuicao = DateTime.Now
        });

        await _context.SaveChangesAsync();

        await _auditoria.RegistrarAsync(
            usuario.UsuarioId,
            "USUARIO_CRIADO",
            "USUARIO",
            usuario.UsuarioId,
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            "Cliente cadastrado: " + usuario.Email);

        return Ok(new
        {
            mensagem = "Cliente cadastrado com sucesso.",
            usuario.UsuarioId,
            usuario.Nome,
            usuario.Email,
            usuario.RazaoSocial,
            usuario.Cnpj,
            Perfil = perfil.Nome
        });
    }
}