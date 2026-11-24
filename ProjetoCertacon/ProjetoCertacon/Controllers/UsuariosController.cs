
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Data;
using ProjetoCertacon.Models;
using ProjetoCertacon.Services;
using System.Linq;
using System.Text.RegularExpressions;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsuariosController : ControllerBase
{
    private readonly IntegraCertaconContext _context;
    private readonly IPasswordHasher<Usuario> _passwordHasher;
    private readonly AuditoriaService _auditoria;
    private readonly PermissaoService _permissao;
    private readonly ValidacaoCnpjService _cnpj;

    public UsuariosController(
        IntegraCertaconContext context,
        IPasswordHasher<Usuario> passwordHasher,
        AuditoriaService auditoria, PermissaoService permissao, ValidacaoCnpjService cnpj)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _auditoria = auditoria;
        _permissao = permissao;
        _cnpj = cnpj;
    }

    // REGISTRA AÇÃO NA AUDITORIA
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

    /// <summary>
    /// Lista os usuários
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        if (!await _permissao.TemPermissaoAsync(User, "usuario.gerenciar"))
            return Forbid();
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
    [HttpPost("cadastrar-colaborador")]
    public async Task<IActionResult> CadastrarColaborador(
        [FromBody] UsuarioRequest dados)
    {
        if (!await _permissao.TemPermissaoAsync(User, "usuario.gerenciar"))
            return Forbid();
        if (string.IsNullOrWhiteSpace(dados.Nome) ||
            string.IsNullOrWhiteSpace(dados.Email) ||
            string.IsNullOrWhiteSpace(dados.Senha) ||
            (string.IsNullOrWhiteSpace(dados.Perfil) && (dados.Perfis == null || dados.Perfis.Count == 0)))
        {
            return BadRequest("Preencha todos os campos obrigatórios.");
        }

        var email = dados.Email.Trim().ToLower();

        if (await _context.Usuarios.AnyAsync(u => u.Email == email))
            return BadRequest("Este e-mail já está cadastrado.");

        if (!await _permissao.TemPermissaoAsync(User, "permissao.gerenciar")) return Forbid();
        if (dados.Senha.Length < 8) return BadRequest("A senha deve possuir pelo menos 8 caracteres.");
        var nomes = (dados.Perfis ?? new List<string> { dados.Perfil }).Select(n => n.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        var perfis = await _context.Perfils.Where(p => p.Ativo && nomes.Contains(p.Nome)).ToListAsync();
        if (nomes.Count == 0 || perfis.Count != nomes.Count || perfis.Any(p => p.Nome == "Cliente"))
            return BadRequest("Selecione perfis internos ativos e válidos.");

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

        foreach (var perfil in perfis)
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
            Perfil = perfis.First().Nome,
            Perfis = perfis.Select(p => p.Nome).ToList()
        });
    }

    /// <summary>
    /// Edita um usuário
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Editar(
        Guid id,
        UsuarioAtualizarRequest dados)
    {
        if (!await _permissao.TemPermissaoAsync(User, "usuario.gerenciar"))
            return Forbid();
        if (string.IsNullOrWhiteSpace(dados.Nome) ||
            string.IsNullOrWhiteSpace(dados.Email))
        {
            return BadRequest("Nome e e-mail são obrigatórios.");
        }

        var usuario = await _context.Usuarios
            .Include(u => u.UsuarioPerfils).ThenInclude(up => up.Perfil)
            .FirstOrDefaultAsync(u => u.UsuarioId == id);

        if (usuario == null)
            return NotFound("Usuário não encontrado.");

        var email = dados.Email.Trim().ToLower();

        if (await _context.Usuarios.AnyAsync(
            u => u.UsuarioId != id && u.Email == email))
        {
            return BadRequest("Este e-mail já está cadastrado.");
        }

        // NORMALIZAÇÃO E VALIDAÇÃO DO CNPJ
        var cnpj = string.IsNullOrWhiteSpace(dados.Cnpj)
            ? null
            : _cnpj.Normalizar(dados.Cnpj);

        if (cnpj != null && !_cnpj.Valido(cnpj))
        {
            return BadRequest(
                $"CNPJ inválido. Valor recebido: '{dados.Cnpj}'. " +
                $"Valor normalizado: '{cnpj}'. " +
                $"Quantidade de caracteres: {cnpj.Length}.");
        }

        // VERIFICA SE O CNPJ JÁ ESTÁ CADASTRADO
        if (cnpj != null && await _context.Usuarios.AnyAsync(
            u => u.UsuarioId != id && u.Cnpj == cnpj))
        {
            return BadRequest("Este CNPJ já está cadastrado.");
        }

        var cliente = usuario.UsuarioPerfils.Any(up => up.Perfil.Nome == "Cliente");
        if (cliente && (cnpj == null || cnpj != usuario.Cnpj))
            return BadRequest("O CNPJ do cliente não pode ser removido ou alterado nesta rota.");
        if (!cliente && cnpj != null) return BadRequest("Colaboradores não possuem CNPJ.");
        if (cliente && !await _permissao.TemPermissaoAsync(User, "cliente.gerenciar")) return Forbid();

        List<Perfil>? novosPerfis = null;
        if (dados.Perfis != null || !string.IsNullOrWhiteSpace(dados.Perfil))
        {
            var nomes = (dados.Perfis ?? new List<string> { dados.Perfil! }).Select(n => n.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            // O campo legado Perfil não remove outros perfis quando apenas repete um vínculo atual.
            if (dados.Perfis != null || !usuario.UsuarioPerfils.Any(up => up.Perfil.Nome == dados.Perfil))
            {
                if (!await _permissao.TemPermissaoAsync(User, "permissao.gerenciar")) return Forbid();
                novosPerfis = await _context.Perfils.Where(p => p.Ativo && nomes.Contains(p.Nome)).ToListAsync();
                if (nomes.Count == 0 || novosPerfis.Count != nomes.Count ||
                    (cliente ? novosPerfis.Count != 1 || novosPerfis[0].Nome != "Cliente" : novosPerfis.Any(p => p.Nome == "Cliente")))
                    return BadRequest("Perfis inválidos para este tipo de conta.");
                if (_permissao.ObterUsuarioId(User) == id) return BadRequest("Não altere os próprios perfis por esta rota.");
            }
        }

        usuario.Nome = dados.Nome.Trim();
        usuario.Email = email;
        usuario.RazaoSocial = dados.RazaoSocial?.Trim();
        usuario.Cnpj = cnpj;
        usuario.TelefoneContato = dados.TelefoneContato?.Trim();

        if (novosPerfis != null)
        {
            var ids = novosPerfis.Select(p => p.PerfilId).ToHashSet();
            _context.UsuarioPerfils.RemoveRange(usuario.UsuarioPerfils.Where(up => !ids.Contains(up.PerfilId)).ToList());
            foreach (var perfil in novosPerfis.Where(p => !usuario.UsuarioPerfils.Any(up => up.PerfilId == p.PerfilId)))
                _context.UsuarioPerfils.Add(new UsuarioPerfil { UsuarioPerfilId = Guid.NewGuid(), UsuarioId = id, PerfilId = perfil.PerfilId, DataAtribuicao = DateTime.Now });
        }

        await _context.SaveChangesAsync();

        await RegistrarAuditoria(
            "USUARIO_ATUALIZADO",
            usuario.UsuarioId,
            "Dados do usuário atualizados: " + usuario.Email);

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
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> AlterarStatus(
        Guid id,
        UsuarioStatusRequest dados)
    {
        if (!await _permissao.TemPermissaoAsync(User, "usuario.gerenciar"))
            return Forbid();
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.UsuarioId == id);

        if (usuario == null)
            return NotFound("Usuário não encontrado.");

        if (!dados.Ativo && _permissao.ObterUsuarioId(User) == id) return BadRequest("Não desative a própria conta.");
        if (await _context.UsuarioPerfils.AnyAsync(up => up.UsuarioId == id && up.Perfil.Nome == "Cliente") && !await _permissao.TemPermissaoAsync(User, "cliente.gerenciar")) return Forbid();
        usuario.Ativo = dados.Ativo;

        await _context.SaveChangesAsync();

        await RegistrarAuditoria(
            dados.Ativo ? "USUARIO_ATIVADO" : "USUARIO_DESATIVADO",
            usuario.UsuarioId,
            "Status do usuário alterado.");

        return Ok(new
        {
            mensagem = dados.Ativo
                ? "Usuário ativado com sucesso."
                : "Usuário desativado com sucesso.",
            usuario.UsuarioId,
            usuario.Ativo
        });
    }

    // EXCLUSÃO LÓGICA: PRESERVA OS DADOS
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        if (!await _permissao.TemPermissaoAsync(User, "usuario.gerenciar"))
            return Forbid();
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.UsuarioId == id);

        if (usuario == null)
            return NotFound("Usuário não encontrado.");

        if (_permissao.ObterUsuarioId(User) == id) return BadRequest("Não desative a própria conta.");
        if (await _context.UsuarioPerfils.AnyAsync(up => up.UsuarioId == id && up.Perfil.Nome == "Cliente") && !await _permissao.TemPermissaoAsync(User, "cliente.gerenciar")) return Forbid();
        usuario.Ativo = false;

        await _context.SaveChangesAsync();

        await RegistrarAuditoria(
            "USUARIO_DESATIVADO",
            usuario.UsuarioId,
            "Usuário desativado por exclusão lógica.");

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
    public List<string>? Perfis { get; set; }
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
    public List<string>? Perfis { get; set; }
}

public class UsuarioStatusRequest
{
    public bool Ativo { get; set; }
}
