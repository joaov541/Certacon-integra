using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/FotoPerfil")]
[Authorize]
public class FotoPerfilController : ControllerBase
{
    private const long LimiteBytes = 2 * 1024 * 1024;
    private readonly string _diretorio;

    public FotoPerfilController(IWebHostEnvironment ambiente)
    {
        // Fora de wwwroot: o acesso às fotos passa pela autenticação da API.
        _diretorio = Path.Combine(ambiente.ContentRootPath, "Uploads", "FotosPerfil");
    }

    private bool TentarObterId(out Guid usuarioId)
    {
        var identificador = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("usuarioId")
            ?? User.FindFirstValue("sub");
        return Guid.TryParse(identificador, out usuarioId);
    }

    private string Caminho(Guid usuarioId) => Path.Combine(_diretorio, $"{usuarioId:N}.foto");

    // Lê o arquivo apenas do usuário autenticado. Retorna data URI para usar diretamente em <img>.
    [HttpGet]
    public async Task<IActionResult> Obter()
    {
        if (!TentarObterId(out var usuarioId)) return Unauthorized();
        var caminho = Caminho(usuarioId);
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
        if (!TentarObterId(out var usuarioId)) return Unauthorized();
        if (arquivo is null || arquivo.Length == 0)
            return BadRequest(new { mensagem = "Selecione uma imagem." });
        if (arquivo.Length > LimiteBytes)
            return BadRequest(new { mensagem = "A foto deve ter no máximo 2 MB." });

        byte[] bytes;
        await using (var memoria = new MemoryStream())
        {
            await arquivo.CopyToAsync(memoria);
            bytes = memoria.ToArray();
        }

        // Não confia somente na extensão ou ContentType informados pelo navegador.
        var tipo = IdentificarTipo(bytes);
        if (tipo is null)
            return BadRequest(new { mensagem = "Envie uma imagem JPG, PNG ou WEBP válida." });

        Directory.CreateDirectory(_diretorio);
        var destino = Caminho(usuarioId);
        var temporario = Path.Combine(_diretorio, $"{Guid.NewGuid():N}.tmp");
        try
        {
            await System.IO.File.WriteAllBytesAsync(temporario, bytes);
            System.IO.File.Move(temporario, destino, overwrite: true);
        }
        finally
        {
            if (System.IO.File.Exists(temporario)) System.IO.File.Delete(temporario);
        }

        return Ok(new { mensagem = "Foto atualizada com sucesso.", foto = $"data:{tipo};base64,{Convert.ToBase64String(bytes)}" });
    }

    [HttpDelete]
    public IActionResult Excluir()
    {
        if (!TentarObterId(out var usuarioId)) return Unauthorized();
        var caminho = Caminho(usuarioId);
        if (System.IO.File.Exists(caminho)) System.IO.File.Delete(caminho);
        return Ok(new { mensagem = "Foto removida com sucesso.", foto = (string?)null });
    }

    private static string? IdentificarTipo(byte[] b)
    {
        if (b.Length >= 3 && b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF)
            return "image/jpeg";
        if (b.Length >= 8 && b.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }))
            return "image/png";
        if (b.Length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
            && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P')
            return "image/webp";
        return null;
    }
}
