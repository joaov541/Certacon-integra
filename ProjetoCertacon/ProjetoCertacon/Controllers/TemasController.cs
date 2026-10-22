using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Data;

namespace ProjetoCertacon.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Administrador")]

    public class TemasController : ControllerBase
    {
        private readonly IntegraCertaconContext _context;

        public TemasController(IntegraCertaconContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetTemas()
        {
            var temas = await _context.Temas.ToListAsync();
            return Ok(temas);
        }
    }
}
