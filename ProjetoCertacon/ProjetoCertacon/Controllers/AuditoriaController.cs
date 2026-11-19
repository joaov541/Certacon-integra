using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Data;
using ProjetoCertacon.Models;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
public class AuditoriaController : ControllerBase
{
    private readonly IntegraCertaconContext _context;

    public AuditoriaController(IntegraCertaconContext context)
    {
        _context = context;
    }

    // GET /api/Auditoria/filtros
    // Retorna os 6 perfis oficiais, usuários vinculados e tipos de ação.
    [HttpGet("filtros")]
    public async Task<IActionResult> ObterFiltros()
    {
        var nomesOficiais = new[]
        {
            "Administrador",
            "Coordenador Fiscal",
            "Analista SPED",
            "Analista de Documentos Fiscais",
            "Analista de Reforma Tributária",
            "Cliente"
        };

        var perfis = await _context.Set<Perfil>()
            .AsNoTracking()
            .Where(p => p.Ativo && nomesOficiais.Contains(p.Nome))
            .OrderBy(p => p.Nome)
            .Select(p => new { p.PerfilId, p.Nome })
            .ToListAsync();

        // Um usuário pode ter mais de um perfil: enviamos cada vínculo.
        // A exclusão de Carlos é APENAS do seletor, não do histórico.
        var usuarios = await (
            from vinculo in _context.Set<UsuarioPerfil>().AsNoTracking()
            join usuario in _context.Set<Usuario>().AsNoTracking()
                on vinculo.UsuarioId equals usuario.UsuarioId
            join perfil in _context.Set<Perfil>().AsNoTracking()
                on vinculo.PerfilId equals perfil.PerfilId
            where perfil.Ativo && nomesOficiais.Contains(perfil.Nome)
                  && usuario.Nome != "Carlos Oliveira"
            select new
            {
                usuario.UsuarioId,
                usuario.Nome,
                perfil.PerfilId
            }
        ).Distinct().OrderBy(u => u.Nome).ToListAsync();

        var acoes = await _context.LogAuditoria.AsNoTracking()
            .Select(l => l.Acao)
            .Distinct()
            .OrderBy(acao => acao)
            .ToListAsync();

        return Ok(new { perfis, usuarios, acoes });
    }

    // GET /api/Auditoria?perfilId=...&usuarioId=...&pagina=1&tamanhoPagina=5
    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] Guid? perfilId,
        [FromQuery] Guid? usuarioId,
        [FromQuery] string? pesquisa,
        [FromQuery] string? acao,
        [FromQuery] DateTime? dataInicio,
        [FromQuery] DateTime? dataFim,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanhoPagina = 5)
    {
        if (pagina < 1 || tamanhoPagina < 1 || tamanhoPagina > 100)
            return BadRequest("Página inválida ou tamanhoPagina fora do intervalo de 1 a 100.");

        if (dataInicio.HasValue && dataFim.HasValue && dataInicio > dataFim)
            return BadRequest("A data inicial não pode ser maior que a final.");

        var consulta = _context.LogAuditoria.AsNoTracking().AsQueryable();

        if (perfilId.HasValue)
        {
            consulta = consulta.Where(log =>
                log.UsuarioId.HasValue &&
                _context.Set<UsuarioPerfil>().Any(vinculo =>
                    vinculo.UsuarioId == log.UsuarioId.Value &&
                    vinculo.PerfilId == perfilId.Value));
        }

        if (usuarioId.HasValue)
            consulta = consulta.Where(log => log.UsuarioId == usuarioId.Value);

        if (!string.IsNullOrWhiteSpace(acao))
            consulta = consulta.Where(log => log.Acao == acao);

        if (!string.IsNullOrWhiteSpace(pesquisa))
        {
            var termo = pesquisa.Trim();
            consulta = consulta.Where(log =>
                log.Acao.Contains(termo) ||
                (log.Detalhes != null && log.Detalhes.Contains(termo)) ||
                (log.TabelaAfetada != null && log.TabelaAfetada.Contains(termo)) ||
                (log.Usuario != null &&
                    (log.Usuario.Nome.Contains(termo) ||
                     log.Usuario.Email.Contains(termo))));
        }

        if (dataInicio.HasValue)
            consulta = consulta.Where(log => log.DataHora >= dataInicio.Value);

        // DataFim é o começo do dia SEGUINTE, não inclusivo.
        if (dataFim.HasValue)
            consulta = consulta.Where(log => log.DataHora < dataFim.Value);

        var totalRegistros = await consulta.CountAsync();

        var registros = await consulta
            .OrderByDescending(log => log.DataHora)
            .ThenByDescending(log => log.LogAuditoriaId)
            .Skip((pagina - 1) * tamanhoPagina)
            .Take(tamanhoPagina)
            .Select(log => new
            {
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
            })
            .ToListAsync();

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
