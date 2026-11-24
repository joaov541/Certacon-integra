using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Data;
using ProjetoCertacon.Models;
using ProjetoCertacon.Services;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PerfisController : ControllerBase
{
    private readonly IntegraCertaconContext _context;
    private readonly PermissaoService _permissoes;
    private readonly AuditoriaService _auditoria;

    public PerfisController(IntegraCertaconContext context,
        PermissaoService permissoes, AuditoriaService auditoria)
    {
        _context = context;
        _permissoes = permissoes;
        _auditoria = auditoria;
    }

    private Task<bool> PodeGerenciar() =>
        _permissoes.TemPermissaoAsync(User, "perfil.gerenciar");

    private static bool Reservado(string nome) =>
        string.Equals(nome, "Administrador", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(nome, "Cliente", StringComparison.OrdinalIgnoreCase);

    private Task Auditar(string acao, Perfil perfil) => _auditoria.RegistrarAsync(
        _permissoes.ObterUsuarioId(User), acao, "PERFIL", perfil.PerfilId,
        HttpContext.Connection.RemoteIpAddress?.ToString(), perfil.Nome);

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        if (!await PodeGerenciar()) return Forbid();
        return Ok(await _context.Perfils.AsNoTracking().OrderBy(p => p.Nome)
            .Select(p => new {
                p.PerfilId,
                p.Nome,
                p.Descricao,
                p.Ativo,
                p.DataCriacao,
                TotalUsuarios = p.UsuarioPerfils.Count(),
                TotalPermissoes = p.PerfilPermissoes.Count()
            }).ToListAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Consultar(Guid id)
    {
        if (!await PodeGerenciar()) return Forbid();
        var perfil = await _context.Perfils.AsNoTracking().Where(p => p.PerfilId == id)
            .Select(p => new { p.PerfilId, p.Nome, p.Descricao, p.Ativo, p.DataCriacao })
            .FirstOrDefaultAsync();
        return perfil == null ? NotFound() : Ok(perfil);
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] PerfilCadastroRequest dados)
    {
        if (!await PodeGerenciar()) return Forbid();
        var nome = dados.Nome?.Trim() ?? "";
        var descricao = dados.Descricao?.Trim();
        if (nome.Length == 0 || nome.Length > 100 || descricao?.Length > 300)
            return BadRequest("Informe nome de até 100 e descrição de até 300 caracteres.");
        if (Reservado(nome) || await _context.Perfils.AnyAsync(p => p.Nome == nome))
            return Conflict("Já existe um perfil com esse nome.");
        var perfil = new Perfil
        {
            PerfilId = Guid.NewGuid(),
            Nome = nome,
            Descricao = descricao,
            Ativo = true,
            DataCriacao = DateTime.UtcNow
        };
        _context.Perfils.Add(perfil);
        await _context.SaveChangesAsync();
        await Auditar("PERFIL_CRIADO", perfil);
        return CreatedAtAction(nameof(Consultar), new { id = perfil.PerfilId },
            new { mensagem = "Perfil criado com sucesso.", perfil.PerfilId, perfil.Nome, perfil.Descricao, perfil.Ativo });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Editar(Guid id, [FromBody] PerfilCadastroRequest dados)
    {
        if (!await PodeGerenciar()) return Forbid();
        var perfil = await _context.Perfils.FindAsync(id);
        if (perfil == null) return NotFound();
        var nome = dados.Nome?.Trim() ?? "";
        var descricao = dados.Descricao?.Trim();
        if (nome.Length == 0 || nome.Length > 100 || descricao?.Length > 300)
            return BadRequest("Informe nome de até 100 e descrição de até 300 caracteres.");
        if ((Reservado(perfil.Nome) && nome != perfil.Nome) ||
            (Reservado(nome) && nome != perfil.Nome))
            return BadRequest("Não é possível renomear um perfil reservado.");
        if (await _context.Perfils.AnyAsync(p => p.PerfilId != id && p.Nome == nome))
            return Conflict("Já existe um perfil com esse nome.");
        perfil.Nome = nome;
        perfil.Descricao = descricao;
        await _context.SaveChangesAsync();
        await Auditar("PERFIL_ATUALIZADO", perfil);
        return Ok(new { mensagem = "Perfil atualizado com sucesso.", perfil.PerfilId, perfil.Nome, perfil.Descricao, perfil.Ativo });
    }

    [HttpPatch("{id:guid}/status")]
    public Task<IActionResult> AlterarStatus(Guid id, [FromBody] PerfilStatusRequest dados) =>
        DefinirStatus(id, dados.Ativo);

    [HttpDelete("{id:guid}")]
    public Task<IActionResult> Excluir(Guid id) => DefinirStatus(id, false);

    private async Task<IActionResult> DefinirStatus(Guid id, bool ativo)
    {
        if (!await PodeGerenciar() || !await _permissoes.TemPermissaoAsync(User, "permissao.gerenciar")) return Forbid();
        var perfil = await _context.Perfils.FindAsync(id);
        if (perfil == null) return NotFound();
        if (Reservado(perfil.Nome) && !ativo) return BadRequest("Não é possível desativar um perfil reservado.");
        perfil.Ativo = ativo;
        await _context.SaveChangesAsync();
        await Auditar(ativo ? "PERFIL_ATIVADO" : "PERFIL_DESATIVADO", perfil);
        return Ok(new { mensagem = "Status atualizado com sucesso.", perfil.PerfilId, perfil.Ativo });
    }
}

public class PerfilCadastroRequest
{
    public string Nome { get; set; } = "";
    public string? Descricao { get; set; }
}

public class PerfilStatusRequest
{
    public bool Ativo { get; set; }
}
