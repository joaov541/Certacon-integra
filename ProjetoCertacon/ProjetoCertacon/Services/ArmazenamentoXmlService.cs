
using Microsoft.AspNetCore.Http;

namespace ProjetoCertacon.Services;

public class ArmazenamentoXmlService
{
    private readonly string _pastaXml;

    public ArmazenamentoXmlService(IConfiguration configuration)
    {
        _pastaXml = configuration["PastaXml"]
            ?? throw new InvalidOperationException(
                "A pasta de XML não foi configurada.");
    }

    public async Task<string> SalvarAsync(
        IFormFile arquivo,
        CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(_pastaXml);

        var nomeArquivo = $"{Guid.NewGuid()}.xml";
        var caminhoCompleto = Path.Combine(_pastaXml, nomeArquivo);

        try
        {
            await using var stream = new FileStream(
                caminhoCompleto,
                FileMode.CreateNew);

            await arquivo.CopyToAsync(stream, cancellationToken);

            return caminhoCompleto;
        }
        catch
        {
            if (File.Exists(caminhoCompleto))
                File.Delete(caminhoCompleto);

            throw;
        }
    }
}
