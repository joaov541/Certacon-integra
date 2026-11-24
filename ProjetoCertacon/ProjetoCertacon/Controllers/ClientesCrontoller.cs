using Microsoft.AspNetCore.Authorization;
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
public class ClientesController : ControllerBase
{
    private readonly IntegraCertaconContext _context;
    private readonly PermissaoService _permissao;
    private readonly ValidacaoCnpjService _cnpj;
    private readonly AuditoriaService _auditoria;

    public ClientesController(IntegraCertaconContext context, PermissaoService permissao,
        ValidacaoCnpjService cnpj, AuditoriaService auditoria)
    {
        _context = context;
        _permissao = permissao;
        _cnpj = cnpj;
        _auditoria = auditoria;
    }

    private Task<bool> PodeGerenciar() =>
        _permissao.TemPermissaoAsync(User, "cliente.gerenciar");

    private IQueryable<Usuario> ConsultaClientes() => _context.Usuarios
        .Where(u => u.UsuarioPerfils.Any(up => up.Perfil.Nome == "Cliente"));

    private Task Registrar(string acao, Guid id, string detalhes) =>
        _auditoria.RegistrarAsync(_permissao.ObterUsuarioId(User), acao, "USUARIO", id,
            HttpContext.Connection.RemoteIpAddress?.ToString(), detalhes);

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        if (!await PodeGerenciar()) return Forbid();
        var clientes = await ConsultaClientes().AsNoTracking().OrderBy(u => u.RazaoSocial)
            .Select(u => new {
                u.UsuarioId,
                u.Nome,
                u.Email,
                u.RazaoSocial,
                u.Cnpj,
                u.TelefoneContato,
                u.Ativo,
                u.DataCriacao,
                Perfis = u.UsuarioPerfils.Select(up => up.Perfil.Nome).ToList()
            }).ToListAsync();
        return Ok(clientes);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Consultar(Guid id)
    {
        if (!await PodeGerenciar()) return Forbid();
        var cliente = await ConsultaClientes().AsNoTracking().Where(u => u.UsuarioId == id)
            .Select(u => new {
                u.UsuarioId,
                u.Nome,
                u.Email,
                u.RazaoSocial,
                u.Cnpj,
                u.TelefoneContato,
                u.Ativo,
                u.DataCriacao,
                Perfis = u.UsuarioPerfils.Select(up => up.Perfil.Nome).ToList()
            }).FirstOrDefaultAsync();
        if (cliente == null) return NotFound("Cliente não encontrado.");
        return Ok(cliente);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Editar(Guid id, [FromBody] ClienteEditarRequest dados)
    {
        if (!await PodeGerenciar()) return Forbid();
        var cliente = await ConsultaClientes().FirstOrDefaultAsync(u => u.UsuarioId == id);
        if (cliente == null) return NotFound("Cliente não encontrado.");
        var nome = dados.Nome?.Trim() ?? "";
        var email = dados.Email?.Trim().ToLowerInvariant() ?? "";
        var razao = dados.RazaoSocial?.Trim() ?? "";
        var telefone = dados.TelefoneContato?.Trim();
        if (nome.Length == 0 || nome.Length > 150 || razao.Length == 0 || razao.Length > 200 ||
            email.Length > 256 || (telefone?.Length ?? 0) > 30 ||
            !MailAddress.TryCreate(email, out var endereco) || endereco.Address != email)
            return BadRequest("Confira nome, razão social, e-mail e telefone.");
        var cnpj = _cnpj.Normalizar(dados.Cnpj);
        if (!_cnpj.Valido(cnpj)) return BadRequest("CNPJ inválido.");
        if (cnpj != cliente.Cnpj) return BadRequest("O CNPJ de um cliente cadastrado não pode ser alterado.");
        if (await _context.Usuarios.AnyAsync(u => u.UsuarioId != id && u.Email == email))
            return Conflict("Este e-mail já está cadastrado.");
        cliente.Nome = nome;
        cliente.Email = email;
        cliente.RazaoSocial = razao;
        cliente.TelefoneContato = telefone;
        if (dados.Ativo.HasValue)
        {
            if (!dados.Ativo.Value && _permissao.ObterUsuarioId(User) == id)
                return BadRequest("Não é possível desativar a própria conta.");
            cliente.Ativo = dados.Ativo.Value;
        }
        try { await _context.SaveChangesAsync(); }
        catch (DbUpdateException) { return Conflict("Não foi possível salvar os dados do cliente."); }
        await Registrar("USUARIO_ATUALIZADO", id, "Cliente atualizado: " + email);
        return Ok(new
        {
            mensagem = "Cliente atualizado com sucesso.",
            cliente.UsuarioId,
            cliente.Nome,
            cliente.Email,
            cliente.RazaoSocial,
            cliente.Cnpj,
            cliente.TelefoneContato,
            cliente.Ativo
        });
    }

    [HttpPatch("{id:guid}/status")]
    public Task<IActionResult> AlterarStatus(Guid id, [FromBody] UsuarioStatusRequest dados) =>
        DefinirStatus(id, dados.Ativo);

    [HttpDelete("{id:guid}")]
    public Task<IActionResult> Excluir(Guid id) => DefinirStatus(id, false);

    private async Task<IActionResult> DefinirStatus(Guid id, bool ativo)
    {
        if (!await PodeGerenciar()) return Forbid();
        var cliente = await ConsultaClientes().FirstOrDefaultAsync(u => u.UsuarioId == id);
        if (cliente == null) return NotFound("Cliente não encontrado.");
        if (!ativo && _permissao.ObterUsuarioId(User) == id)
            return BadRequest("Não é possível desativar a própria conta.");
        cliente.Ativo = ativo;
        await _context.SaveChangesAsync();
        await Registrar(ativo ? "USUARIO_ATIVADO" : "USUARIO_DESATIVADO", id, "Status do cliente alterado.");
        return Ok(new
        {
            mensagem = ativo ? "Cliente ativado com sucesso." : "Cliente desativado com sucesso.",
            cliente.UsuarioId,
            cliente.Ativo
        });
    }

    [HttpGet("validar-cnpj")]
    public async Task<IActionResult> ValidarCnpj([FromQuery] string cnpj)
    {
        if (!await PodeGerenciar()) return Forbid();
        return Ok(new { valido = _cnpj.Valido(cnpj), cnpj = _cnpj.Normalizar(cnpj), formatado = _cnpj.Formatar(cnpj) });
    }
}

public class ClienteEditarRequest
{
    public string Nome { get; set; } = "";
    public string Email { get; set; } = "";
    public string RazaoSocial { get; set; } = "";
    public string Cnpj { get; set; } = "";
    public string? TelefoneContato { get; set; }
    public bool? Ativo { get; set; }
}
