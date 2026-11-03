
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Data;
using ProjetoCertacon.Models;
using System.Linq;
using ProjetoCertacon.Services;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
public class UsuariosController : ControllerBase
{
    private readonly IntegraCertaconContext _context;
    private readonly IPasswordHasher<Usuario> _passwordHasher;
    private readonly AuditoriaService _auditoria;


    private async Task RegistrarAuditoria(
    string acao,
    Guid registroId,
    string detalhes)
    {
        var usuarioId = User.FindFirst(
            System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        Guid? id = Guid.TryParse(usuarioId, out var resultado)
            ? resultado
            : null;

        await _auditoria.RegistrarAsync(
            id,
            acao,
            "USUARIO",
            registroId,
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            detalhes);
    }

    public UsuariosController(
     IntegraCertaconContext context,
     IPasswordHasher<Usuario> passwordHasher,
     AuditoriaService auditoria)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _auditoria = auditoria;
    }



    /// <summary>
    /// Lista os usuários
    /// </summary>
    /// <returns>retorna status code 200</returns>
    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var usuarios = await _context.Usuarios
            .Include(u => u.UsuarioPerfils)
                .ThenInclude(up => up.Perfil)
            .Select(u => new
            {
                u.UsuarioId,
                u.Nome,
                u.Email,
                u.RazaoSocial,
                u.Cnpj,
                u.TelefoneContato,
                u.Ativo,
                u.DataCriacao,
                Perfis = u.UsuarioPerfils
                    .Select(up => up.Perfil.Nome)
                    .ToList()
            })
            .ToListAsync();

        return Ok(usuarios);
    }

    
    /// <summary>
    /// Cadastra um colaborador
    /// </summary>
    /// <returns>Retorna status code 201</returns>
    [HttpPost("cadastrar-colaborador")]
    public async Task<IActionResult> CadastrarColaborador(
        [FromBody] UsuarioRequest dados)
    {
        if (string.IsNullOrWhiteSpace(dados.Nome) ||
            string.IsNullOrWhiteSpace(dados.Email) ||
            string.IsNullOrWhiteSpace(dados.Senha) ||
            string.IsNullOrWhiteSpace(dados.Perfil))
        {
            return BadRequest("Preencha todos os campos obrigatórios.");
        }

        var email = dados.Email.Trim().ToLower();

        if (await _context.Usuarios.AnyAsync(u => u.Email == email))
            return BadRequest("Este e-mail já está cadastrado.");

        var perfil = await _context.Perfils
            .FirstOrDefaultAsync(p => p.Nome == dados.Perfil && p.Ativo);

        if (perfil == null)
            return BadRequest("Perfil não encontrado ou inativo.");

        if (perfil.Nome == "Cliente")
            return BadRequest("Selecione um perfil interno.");

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

        _context.UsuarioPerfils.Add(new UsuarioPerfil
        {
            UsuarioPerfilId = Guid.NewGuid(),
            UsuarioId = usuario.UsuarioId,
            PerfilId = perfil.PerfilId,
            DataAtribuicao = DateTime.Now
        });

        await _context.SaveChangesAsync();

        await RegistrarAuditoria(
            "USUARIO_CRIADO",
            usuario.UsuarioId,
            "Colaborador cadastrado: " + usuario.Email);

        return Ok(new
        {
            mensagem = "Colaborador cadastrado com sucesso.",
            usuario.UsuarioId,
            usuario.Nome,
            usuario.Email,
            Perfil = perfil.Nome
        });
    }

    /// <summary>
    /// Edita um usuário
    /// </summary>
    /// <returns>retorna status code 200</returns>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Editar(
        Guid id, UsuarioAtualizarRequest dados)
    {
        if (string.IsNullOrWhiteSpace(dados.Nome) ||
            string.IsNullOrWhiteSpace(dados.Email))
        {
            return BadRequest("Nome e e-mail são obrigatórios.");
        }

        var usuario = await _context.Usuarios
            .Include(u => u.UsuarioPerfils)
            .FirstOrDefaultAsync(u => u.UsuarioId == id);

        if (usuario == null)
            return NotFound("Usuário não encontrado.");

        var email = dados.Email.Trim().ToLower();

        if (await _context.Usuarios.AnyAsync(
            u => u.UsuarioId != id && u.Email == email))
        {
            return BadRequest("Este e-mail já está cadastrado.");
        }

        var cnpj = string.IsNullOrWhiteSpace(dados.Cnpj)
            ? null
            : new string(dados.Cnpj.Where(char.IsDigit).ToArray());

        if (cnpj != null && cnpj.Length != 14)
            return BadRequest("O CNPJ deve ter 14 dígitos.");

        if (cnpj != null && await _context.Usuarios.AnyAsync(
            u => u.UsuarioId != id && u.Cnpj == cnpj))
        {
            return BadRequest("Este CNPJ já está cadastrado.");
        }

        Perfil? perfil = null;

        if (!string.IsNullOrWhiteSpace(dados.Perfil))
        {
            perfil = await _context.Perfils
                .FirstOrDefaultAsync(p => p.Nome == dados.Perfil && p.Ativo);

            if (perfil == null)
                return BadRequest("Perfil não encontrado ou inativo.");
        }

        usuario.Nome = dados.Nome.Trim();
        usuario.Email = email;
        usuario.RazaoSocial = dados.RazaoSocial?.Trim();
        usuario.Cnpj = cnpj;
        usuario.TelefoneContato = dados.TelefoneContato?.Trim();

        if (perfil != null)
        {
            _context.UsuarioPerfils.RemoveRange(usuario.UsuarioPerfils);

            _context.UsuarioPerfils.Add(new UsuarioPerfil
            {
                UsuarioPerfilId = Guid.NewGuid(),
                UsuarioId = usuario.UsuarioId,
                PerfilId = perfil.PerfilId,
                DataAtribuicao = DateTime.Now
            });
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem = "Usuário atualizado com sucesso.",
            usuario.UsuarioId,
            usuario.Nome,
            usuario.Email,
            usuario.RazaoSocial,
            usuario.Cnpj,
            usuario.TelefoneContato
        });
    }

    /// <summary>
    /// Ativar ou desativar usuário
    /// </summary>
    /// <returns>Retorna status code 200</returns>
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> AlterarStatus(
        Guid id, UsuarioStatusRequest dados)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.UsuarioId == id);

        if (usuario == null)
            return NotFound("Usuário não encontrado.");

        usuario.Ativo = dados.Ativo;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem = dados.Ativo
                ? "Usuário ativado com sucesso."
                : "Usuário desativado com sucesso.",
            usuario.UsuarioId,
            usuario.Ativo
        });
    }

    // Exclusão lógica: preserva os dados
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.UsuarioId == id);

        if (usuario == null)
            return NotFound("Usuário não encontrado.");

        usuario.Ativo = false;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem = "Usuário desativado com sucesso.",
            usuario.UsuarioId,
            usuario.Ativo
        });
    }
}

public class UsuarioRequest
{
    public string Nome { get; set; } = "";
    public string Email { get; set; } = "";
    public string Senha { get; set; } = "";
    public string Perfil { get; set; } = "";
    public string? RazaoSocial { get; set; }
    public string? Cnpj { get; set; }
    public string? TelefoneContato { get; set; }
}

public class UsuarioAtualizarRequest
{
    public string Nome { get; set; } = "";
    public string Email { get; set; } = "";
    public string? RazaoSocial { get; set; }
    public string? Cnpj { get; set; }
    public string? TelefoneContato { get; set; }
    public string? Perfil { get; set; }
}



public class UsuarioStatusRequest
{
    public bool Ativo { get; set; }
}
