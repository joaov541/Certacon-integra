
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Data;

namespace ProjetoCertacon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TemasController : ControllerBase
    {
        private readonly IntegraCertaconContext _context;

        public TemasController(IntegraCertaconContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "Administrador,Coordenador Fiscal,Analista SPED,Analista de Documentos Fiscais,Analista de Reforma Tributária")]
        public async Task<IActionResult> GetTemas()
        {
            var temas = await _context.Temas.ToListAsync();

            return Ok(temas);
        }
    }
}
