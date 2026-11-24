using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Data;
using ProjetoCertacon.Services;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/FotoPerfil")]
[Authorize]
public class FotoPerfilController : ControllerBase
{
    private const long LimiteBytes = 2 * 1024 * 1024;
    private readonly string _diretorio;
    private readonly IntegraCertaconContext _context;
    private readonly PermissaoService _permissoes;
    private readonly AuditoriaService _auditoria;
    public FotoPerfilController(IWebHostEnvironment ambiente, IntegraCertaconContext context,
        PermissaoService permissoes, AuditoriaService auditoria)
    {
        _diretorio = Path.Combine(ambiente.ContentRootPath, "Uploads", "FotosPerfil");
        _context = context;
        _permissoes = permissoes;
        _auditoria = auditoria;
    }
    private Task<bool> ContaAtiva(Guid id) => _context.Usuarios.AnyAsync(u => u.UsuarioId == id && u.Ativo && u.UsuarioPerfils.Any(up => up.Perfil.Ativo));
    private string Caminho(Guid id) => Path.Combine(_diretorio, $"{id:N}.foto");
    private async Task Registrar(Guid id, string acao) => await _auditoria.RegistrarAsync(id, acao,
        "USUARIO", id, HttpContext.Connection.RemoteIpAddress?.ToString(), "Foto de perfil alterada.");

    [HttpGet]
    public async Task<IActionResult> Obter()
    {
        var id = _permissoes.ObterUsuarioId(User);
        if (!id.HasValue) return Unauthorized();
        if (!await ContaAtiva(id.Value)) return Forbid();
        var caminho = Caminho(id.Value);
        Response.Headers.CacheControl = "no-store";
        if (!System.IO.File.Exists(caminho)) return Ok(new { foto = (string?)null });
        var bytes = await System.IO.File.ReadAllBytesAsync(caminho);
        var tipo = IdentificarTipo(bytes);
        if (tipo is null) return Ok(new { foto = (string?)null });
        return Ok(new { foto = $"data:{tipo};base64,{Convert.ToBase64String(bytes)}" });
    }
    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(3 * 1024 * 1024)]
    public async Task<IActionResult> Enviar(IFormFile arquivo)
    {
        var id = _permissoes.ObterUsuarioId(User);
        if (!id.HasValue) return Unauthorized();
        if (!await ContaAtiva(id.Value)) return Forbid();
        if (arquivo is null || arquivo.Length == 0) return BadRequest(new { mensagem = "Selecione uma imagem." });
        if (arquivo.Length > LimiteBytes) return BadRequest(new { mensagem = "A foto deve ter no máximo 2 MB." });
        await using var memoria = new MemoryStream();
        await arquivo.CopyToAsync(memoria);
        var bytes = memoria.ToArray();
        if (bytes.Length > LimiteBytes) return BadRequest(new { mensagem = "A foto deve ter no máximo 2 MB." });
        var tipo = IdentificarTipo(bytes);
        if (tipo is null) return BadRequest(new { mensagem = "Envie uma imagem JPG, PNG ou WEBP válida." });
        Directory.CreateDirectory(_diretorio);
        var destino = Caminho(id.Value);
        var temporario = Path.Combine(_diretorio, $"{Guid.NewGuid():N}.tmp");
        try
        {
            await System.IO.File.WriteAllBytesAsync(temporario, bytes);
            System.IO.File.Move(temporario, destino, overwrite: true);
        }
        finally { if (System.IO.File.Exists(temporario)) System.IO.File.Delete(temporario); }
        await Registrar(id.Value, "FOTO_PERFIL_ATUALIZADA");
        Response.Headers.CacheControl = "no-store";
        return Ok(new { mensagem = "Foto atualizada com sucesso.", foto = $"data:{tipo};base64,{Convert.ToBase64String(bytes)}" });
    }
    [HttpDelete]
    public async Task<IActionResult> Excluir()
    {
        var id = _permissoes.ObterUsuarioId(User);
        if (!id.HasValue) return Unauthorized();
        if (!await ContaAtiva(id.Value)) return Forbid();
        var caminho = Caminho(id.Value);
        if (System.IO.File.Exists(caminho))
        {
            System.IO.File.Delete(caminho);
            await Registrar(id.Value, "FOTO_PERFIL_REMOVIDA");
        }
        return Ok(new { mensagem = "Foto removida com sucesso.", foto = (string?)null });
    }
    private static string? IdentificarTipo(byte[] b)
    {
        if (b.Length >= 3 && b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF) return "image/jpeg";
        if (b.Length >= 8 && b.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 })) return "image/png";
        if (b.Length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "image/webp";
        return null;
    }
}
