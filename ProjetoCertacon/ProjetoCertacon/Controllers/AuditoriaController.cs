
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Data;

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

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var registros = await _context.LogAuditoria
            .OrderByDescending(l => l.DataHora)
            .Take(100)
            .Select(l => new
            {
                l.LogAuditoriaId,
                l.UsuarioId,
                l.Acao,
                l.TabelaAfetada,
                l.RegistroId,
                l.EnderecoIp,
                l.Detalhes,
                l.DataHora
            })
            .ToListAsync();

        return Ok(registros);
    }
}
