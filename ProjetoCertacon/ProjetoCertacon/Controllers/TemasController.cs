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
public class TemasController : ControllerBase
{
    private readonly IntegraCertaconContext _context;
    private readonly PermissaoService _permissoes;
    private readonly AuditoriaService _auditoria;

    public TemasController(IntegraCertaconContext context, PermissaoService permissoes, AuditoriaService auditoria)
    {
        _context = context;
        _permissoes = permissoes;
        _auditoria = auditoria;
    }

    private Task<bool> PodeGerenciar() => _permissoes.TemPermissaoAsync(User, "tema.gerenciar");
    private async Task Registrar(string acao, Tema tema) => await _auditoria.RegistrarAsync(
        _permissoes.ObterUsuarioId(User), acao, "TEMA", tema.TemaId,
        HttpContext.Connection.RemoteIpAddress?.ToString(), tema.Nome);

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetTemas()
    {
        var gerenciar = await PodeGerenciar();
        var temas = await _context.Temas.AsNoTracking()
            .Where(t => gerenciar || t.Ativo).OrderBy(t => t.Nome)
            .Select(t => new { t.TemaId, t.Nome, t.Descricao, t.Ativo, t.DataCriacao, t.DataAtualizacao })
            .ToListAsync();
        return Ok(temas);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> Consultar(Guid id)
    {
        var gerenciar = await PodeGerenciar();
        var tema = await _context.Temas.AsNoTracking()
            .Where(t => t.TemaId == id && (gerenciar || t.Ativo))
            .Select(t => new { t.TemaId, t.Nome, t.Descricao, t.Ativo, t.DataCriacao, t.DataAtualizacao })
            .FirstOrDefaultAsync();
        if (tema == null) return NotFound("Tema não encontrado.");
        return Ok(tema);
    }

    [HttpPost]
    public async Task<IActionResult> Criar(TemaRequest dados)
    {
        if (!await PodeGerenciar()) return Forbid();
        var nome = dados.Nome?.Trim();
        if (string.IsNullOrWhiteSpace(nome) || nome.Length > 150 || dados.Descricao?.Length > 400)
            return BadRequest("Informe um nome válido (até 150 caracteres) e descrição de até 400 caracteres.");
        if (await _context.Temas.AnyAsync(t => t.Nome == nome)) return Conflict("Tema já cadastrado.");
        var tema = new Tema { TemaId = Guid.NewGuid(), Nome = nome, Descricao = dados.Descricao?.Trim(), Ativo = true, DataCriacao = DateTime.UtcNow };
        _context.Temas.Add(tema);
        await _context.SaveChangesAsync();
        await Registrar("TEMA_CRIADO", tema);
        return CreatedAtAction(nameof(Consultar), new { id = tema.TemaId }, new { mensagem = "Tema criado com sucesso.", tema.TemaId, tema.Nome, tema.Descricao, tema.Ativo });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Editar(Guid id, TemaRequest dados)
    {
        if (!await PodeGerenciar()) return Forbid();
        var nome = dados.Nome?.Trim();
        if (string.IsNullOrWhiteSpace(nome) || nome.Length > 150 || dados.Descricao?.Length > 400)
            return BadRequest("Nome ou descrição inválidos.");
        var tema = await _context.Temas.FindAsync(id);
        if (tema == null) return NotFound("Tema não encontrado.");
        if (await _context.Temas.AnyAsync(t => t.TemaId != id && t.Nome == nome)) return Conflict("Tema já cadastrado.");
        tema.Nome = nome;
        tema.Descricao = dados.Descricao?.Trim();
        tema.DataAtualizacao = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await Registrar("TEMA_ATUALIZADO", tema);
        return Ok(new { mensagem = "Tema atualizado.", tema.TemaId, tema.Nome, tema.Descricao, tema.Ativo });
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> AlterarStatus(Guid id, TemaStatusRequest dados)
    {
        if (!await PodeGerenciar()) return Forbid();
        var tema = await _context.Temas.FindAsync(id);
        if (tema == null) return NotFound("Tema não encontrado.");
        tema.Ativo = dados.Ativo;
        tema.DataAtualizacao = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await Registrar(tema.Ativo ? "TEMA_ATIVADO" : "TEMA_DESATIVADO", tema);
        return Ok(new { mensagem = "Status atualizado.", tema.TemaId, tema.Ativo });
    }

    [HttpDelete("{id:guid}")]
    public Task<IActionResult> Excluir(Guid id) => AlterarStatus(id, new TemaStatusRequest { Ativo = false });
}

public class TemaRequest
{
    public string Nome { get; set; } = "";
    public string? Descricao { get; set; }
}
public class TemaStatusRequest { public bool Ativo { get; set; } }
