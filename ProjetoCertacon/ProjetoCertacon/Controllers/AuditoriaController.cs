using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Data;
using ProjetoCertacon.Services;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuditoriaController : ControllerBase
{
    private readonly IntegraCertaconContext _context;
    private readonly PermissaoService _permissoes;
    public AuditoriaController(IntegraCertaconContext context, PermissaoService permissoes)
    {
        _context = context;
        _permissoes = permissoes;
    }

    [HttpGet("filtros")]
    public async Task<IActionResult> ObterFiltros()
    {
        if (!await _permissoes.TemPermissaoAsync(User, "auditoria.ler")) return Forbid();
        var perfis = await _context.Perfils.AsNoTracking().OrderBy(p => p.Nome)
            .Select(p => new { p.PerfilId, p.Nome }).ToListAsync();
        var usuarios = await _context.UsuarioPerfils.AsNoTracking()
            .Select(v => new { v.UsuarioId, v.Usuario.Nome, v.PerfilId })
            .Distinct().OrderBy(u => u.Nome).ToListAsync();
        var acoes = await _context.LogAuditoria.AsNoTracking().Select(l => l.Acao)
            .Distinct().OrderBy(a => a).ToListAsync();
        return Ok(new { perfis, usuarios, acoes });
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] Guid? perfilId, [FromQuery] Guid? usuarioId,
        [FromQuery] string? pesquisa, [FromQuery] string? acao, [FromQuery] DateTime? dataInicio,
        [FromQuery] DateTime? dataFim, [FromQuery] int pagina = 1, [FromQuery] int tamanhoPagina = 5)
    {
        if (!await _permissoes.TemPermissaoAsync(User, "auditoria.ler")) return Forbid();
        if (pagina < 1 || tamanhoPagina < 1 || tamanhoPagina > 100 || (long)(pagina - 1) * tamanhoPagina > int.MaxValue)
            return BadRequest("Página ou tamanho da página inválido.");
        if (dataInicio.HasValue && dataFim.HasValue && dataInicio > dataFim)
            return BadRequest("A data inicial não pode ser maior que a final.");
        var consulta = _context.LogAuditoria.AsNoTracking().AsQueryable();
        if (perfilId.HasValue) consulta = consulta.Where(log => log.UsuarioId.HasValue &&
            _context.UsuarioPerfils.Any(v => v.UsuarioId == log.UsuarioId.Value && v.PerfilId == perfilId.Value));
        if (usuarioId.HasValue) consulta = consulta.Where(log => log.UsuarioId == usuarioId.Value);
        if (!string.IsNullOrWhiteSpace(acao)) consulta = consulta.Where(log => log.Acao == acao);
        if (!string.IsNullOrWhiteSpace(pesquisa))
        {
            var termo = pesquisa.Trim();
            consulta = consulta.Where(log => log.Acao.Contains(termo) ||
                (log.Detalhes != null && log.Detalhes.Contains(termo)) ||
                (log.TabelaAfetada != null && log.TabelaAfetada.Contains(termo)) ||
                (log.Usuario != null && (log.Usuario.Nome.Contains(termo) || log.Usuario.Email.Contains(termo))));
        }
        if (dataInicio.HasValue) consulta = consulta.Where(log => log.DataHora >= dataInicio.Value);
        if (dataFim.HasValue) consulta = consulta.Where(log => log.DataHora < dataFim.Value);
        var totalRegistros = await consulta.CountAsync();
        var registros = await consulta.OrderByDescending(log => log.DataHora).ThenByDescending(log => log.LogAuditoriaId)
            .Skip((pagina - 1) * tamanhoPagina).Take(tamanhoPagina)
            .Select(log => new {
                log.LogAuditoriaId,
                log.UsuarioId,
                UsuarioNome = log.Usuario != null ? log.Usuario.Nome : "Sistema",
                UsuarioEmail = log.Usuario != null ? log.Usuario.Email : null,
                log.Acao,
                log.TabelaAfetada,
                log.RegistroId,
                log.EnderecoIp,
                log.Detalhes,
                log.DataHora
            }).ToListAsync();
        return Ok(new
        {
            pagina,
            tamanhoPagina,
            totalRegistros,
            totalPaginas = (int)Math.Ceiling(totalRegistros / (double)tamanhoPagina),
            registros
        });
    }
}
