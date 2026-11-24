using Microsoft.AspNetCore.Http;

namespace ProjetoCertacon.Services;

public class ArmazenamentoXmlService
{
    private readonly string _pastaXml;
    public ArmazenamentoXmlService(IConfiguration configuration)
    {
        _pastaXml = Path.GetFullPath(configuration["PastaXml"]
            ?? throw new InvalidOperationException("A pasta de XML não foi configurada."));
    }

    public bool CaminhoPermitido(string? caminho)
    {
        if (string.IsNullOrWhiteSpace(caminho)) return false;
        var completo = Path.GetFullPath(caminho);
        var relativo = Path.GetRelativePath(_pastaXml, completo);
        return !Path.IsPathRooted(relativo) && relativo != ".." &&
            !relativo.StartsWith(".." + Path.DirectorySeparatorChar, StringComparison.Ordinal) &&
            Path.GetExtension(completo).Equals(".xml", StringComparison.OrdinalIgnoreCase);
    }

    public async Task<string> SalvarAsync(IFormFile arquivo, CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(_pastaXml);
        var caminho = Path.Combine(_pastaXml, $"{Guid.NewGuid()}.xml");
        try
        {
            await using var stream = new FileStream(caminho, FileMode.CreateNew);
            await arquivo.CopyToAsync(stream, cancellationToken);
            return caminho;
        }
        catch
        {
            if (File.Exists(caminho)) File.Delete(caminho);
            throw;
        }
    }
}
