using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjetoCertacon.Services;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MinhasPermissoesController : ControllerBase
{
    private readonly PermissaoService _permissaoService;

    public MinhasPermissoesController(
        PermissaoService permissaoService)
    {
        _permissaoService = permissaoService;
    }

    // =========================================
    // LISTAR PERMISSÕES DO USUÁRIO LOGADO
    // =========================================

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var usuarioId =
            _permissaoService.ObterUsuarioId(User);

        if (!usuarioId.HasValue)
        {
            return Unauthorized(new
            {
                mensagem = "Usuário não identificado."
            });
        }

        var permissoes = await _permissaoService
            .ListarPermissoesAsync(usuarioId.Value);

        return Ok(permissoes);
    }

    // =========================================
    // VERIFICAR UMA PERMISSÃO ESPECÍFICA
    // =========================================

    [HttpGet("verificar")]
    public async Task<IActionResult> Verificar(
        [FromQuery] string codigo,
        [FromQuery] Guid? temaId = null)
    {
        var usuarioId =
            _permissaoService.ObterUsuarioId(User);

        if (!usuarioId.HasValue)
            return Unauthorized();

        var permitido = await _permissaoService
            .TemPermissaoAsync(
                usuarioId.Value,
                codigo,
                temaId
            );

        return Ok(new
        {
            codigo,
            temaId,
            permitido
        });
    }
}