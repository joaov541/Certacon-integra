
using ProjetoCertacon.Data;
using ProjetoCertacon.Models;

namespace ProjetoCertacon.Services;

public class AuditoriaService
{
    private readonly IntegraCertaconContext _context;

    public AuditoriaService(IntegraCertaconContext context)
    {
        _context = context;
    }

    public async Task RegistrarAsync(
        Guid? usuarioId,
        string acao,
        string? tabelaAfetada = null,
        Guid? registroId = null,
        string? enderecoIp = null,
        string? detalhes = null)
    {
        var log = new LogAuditorium
        {
            LogAuditoriaId = Guid.NewGuid(),
            UsuarioId = usuarioId,
            Acao = acao,
            TabelaAfetada = tabelaAfetada,
            RegistroId = registroId,
            EnderecoIp = enderecoIp,
            Detalhes = detalhes,
            DataHora = DateTime.UtcNow
        };

        _context.Set<LogAuditorium>().Add(log);
        await _context.SaveChangesAsync();
    }
}
