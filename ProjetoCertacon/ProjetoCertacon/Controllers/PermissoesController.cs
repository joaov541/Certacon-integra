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
public class PermissoesController : ControllerBase
{
    private readonly IntegraCertaconContext _context;
    private readonly PermissaoService _permissoes;
    private readonly AuditoriaService _auditoria;

    public PermissoesController(IntegraCertaconContext context,
        PermissaoService permissoes, AuditoriaService auditoria)
    {
        _context = context;
        _permissoes = permissoes;
        _auditoria = auditoria;
    }

    private Task<bool> PodeGerenciar() =>
        _permissoes.TemPermissaoAsync(User, "permissao.gerenciar");

    private static bool Reservado(string nome) =>
        string.Equals(nome, "Administrador", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(nome, "Cliente", StringComparison.OrdinalIgnoreCase);

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        if (!await PodeGerenciar()) return Forbid();
        return Ok(await _context.Permissoes.AsNoTracking().OrderBy(p => p.Codigo)
            .Select(p => new { p.PermissaoId, p.Codigo, p.Nome, p.Descricao, p.Ativo, p.DataCriacao })
            .ToListAsync());
    }

    [HttpGet("perfil/{perfilId:guid}")]
    public async Task<IActionResult> ListarPorPerfil(Guid perfilId)
    {
        if (!await PodeGerenciar()) return Forbid();
        if (!await _context.Perfils.AnyAsync(p => p.PerfilId == perfilId)) return NotFound();
        return Ok(await _context.PerfilPermissoes.AsNoTracking().Where(pp => pp.PerfilId == perfilId)
            .OrderBy(pp => pp.Permissao.Codigo).ThenBy(pp => pp.TemaId)
            .Select(pp => new {
                pp.PerfilPermissaoId,
                pp.PerfilId,
                pp.PermissaoId,
                pp.Permissao.Codigo,
                pp.Permissao.Nome,
                pp.TemaId,
                Tema = pp.Tema == null ? null : pp.Tema.Nome,
                pp.DataAtribuicao
            })
            .ToListAsync());
    }

    [HttpPost("perfil/{perfilId:guid}")]
    public async Task<IActionResult> Atribuir(Guid perfilId, [FromBody] VinculoPermissaoRequest dados)
    {
        if (!await PodeGerenciar() || !await _permissoes.TemPermissaoAsync(User, "perfil.gerenciar")) return Forbid();
        var perfil = await _context.Perfils.FindAsync(perfilId);
        if (perfil == null) return NotFound("Perfil não encontrado.");
        if (Reservado(perfil.Nome)) return BadRequest("As permissões dos perfis reservados são protegidas.");
        var permissao = await _context.Permissoes.FindAsync(dados.PermissaoId);
        if (permissao == null || !permissao.Ativo || !perfil.Ativo)
            return BadRequest("Perfil ou permissão inexistente ou inativa.");
        if (dados.TemaId.HasValue)
        {
            if (!permissao.Codigo.StartsWith("artigo.", StringComparison.Ordinal))
                return BadRequest("Somente permissões de artigos aceitam restrição por tema.");
            if (!await _context.Temas.AnyAsync(t => t.TemaId == dados.TemaId && t.Ativo))
                return BadRequest("Tema inexistente ou inativo.");
        }
        // A gestão conjunta de perfis e permissões autoriza configurar acessos operacionais.
        if (await _context.PerfilPermissoes.AnyAsync(pp => pp.PerfilId == perfilId &&
            pp.PermissaoId == dados.PermissaoId && pp.TemaId == dados.TemaId))
            return Conflict("Essa permissão já está vinculada ao perfil nesse escopo.");
        var vinculo = new PerfilPermissao
        {
            PerfilPermissaoId = Guid.NewGuid(),
            PerfilId = perfilId,
            PermissaoId = dados.PermissaoId,
            TemaId = dados.TemaId,
            DataAtribuicao = DateTime.UtcNow
        };
        _context.PerfilPermissoes.Add(vinculo);
        await _context.SaveChangesAsync();
        await _auditoria.RegistrarAsync(_permissoes.ObterUsuarioId(User), "PERMISSAO_ATRIBUIDA",
            "PERFIL_PERMISSAO", vinculo.PerfilPermissaoId, HttpContext.Connection.RemoteIpAddress?.ToString(),
            $"Perfil: {perfil.Nome}; permissão: {permissao.Codigo}; tema: {dados.TemaId?.ToString() ?? "GERAL"}");
        return Ok(new
        {
            mensagem = "Permissão atribuída com sucesso.",
            vinculo.PerfilPermissaoId,
            vinculo.PerfilId,
            vinculo.PermissaoId,
            vinculo.TemaId,
            permissao.Codigo
        });
    }

    [HttpDelete("perfil/{perfilId:guid}/{vinculoId:guid}")]
    public async Task<IActionResult> Remover(Guid perfilId, Guid vinculoId)
    {
        if (!await PodeGerenciar() || !await _permissoes.TemPermissaoAsync(User, "perfil.gerenciar")) return Forbid();
        var perfil = await _context.Perfils.FindAsync(perfilId);
        if (perfil == null) return NotFound();
        if (Reservado(perfil.Nome)) return BadRequest("As permissões dos perfis reservados são protegidas.");
        var vinculo = await _context.PerfilPermissoes.Include(pp => pp.Permissao)
            .FirstOrDefaultAsync(pp => pp.PerfilId == perfilId && pp.PerfilPermissaoId == vinculoId);
        if (vinculo == null) return NotFound("Vínculo não encontrado.");
        var detalhes = $"Perfil: {perfil.Nome}; permissão: {vinculo.Permissao.Codigo}; tema: {vinculo.TemaId?.ToString() ?? "GERAL"}";
        _context.PerfilPermissoes.Remove(vinculo);
        await _context.SaveChangesAsync();
        await _auditoria.RegistrarAsync(_permissoes.ObterUsuarioId(User), "PERMISSAO_REMOVIDA",
            "PERFIL_PERMISSAO", vinculoId, HttpContext.Connection.RemoteIpAddress?.ToString(), detalhes);
        return Ok(new { mensagem = "Permissão removida com sucesso.", perfilId, vinculoId });
    }
}

public class VinculoPermissaoRequest
{
    public Guid PermissaoId { get; set; }
    public Guid? TemaId { get; set; }
}
