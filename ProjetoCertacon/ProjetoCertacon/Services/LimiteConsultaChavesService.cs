namespace ProjetoCertacon.Services;

public class LimiteConsultaChavesService
{
    private readonly object _lock = new();
    private readonly Dictionary<string, int> _consultas = new();
    private DateOnly _dia;
    private readonly int _limite;
    private readonly TimeZoneInfo _fuso;

    public LimiteConsultaChavesService(IConfiguration configuration)
    {
        _limite = Math.Clamp(configuration.GetValue<int?>("ConsultaChaves:LimiteDiario") ?? 10, 1, 10000);
        _fuso = TimeZoneInfo.FindSystemTimeZoneById(OperatingSystem.IsWindows()
            ? "E. South America Standard Time" : "America/Sao_Paulo");
    }

    public int Limite => _limite;

    public bool TentarConsultar(string ip, out int restantes, out int segundosParaRenovar)
    {
        lock (_lock)
        {
            var agora = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _fuso);
            var dia = DateOnly.FromDateTime(agora);
            if (dia != _dia)
            {
                _consultas.Clear();
                _dia = dia;
            }
            var proximaMeiaNoite = TimeZoneInfo.ConvertTimeToUtc(agora.Date.AddDays(1), _fuso);
            segundosParaRenovar = Math.Max(1, (int)Math.Ceiling((proximaMeiaNoite - DateTime.UtcNow).TotalSeconds));
            _consultas.TryGetValue(ip, out var quantidade);
            if (quantidade >= _limite)
            {
                restantes = 0;
                return false;
            }
            _consultas[ip] = quantidade + 1;
            restantes = _limite - quantidade - 1;
            return true;
        }
    }
}
