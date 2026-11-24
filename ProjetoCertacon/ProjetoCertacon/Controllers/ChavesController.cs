using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Data;
using ProjetoCertacon.Services;
using System.Text.RegularExpressions;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChavesController : ControllerBase
{
    private readonly IntegraCertaconContext _context;
    private readonly ValidacaoNfeService _nfe;
    private readonly ValidacaoCnpjService _cnpj;
    private readonly PermissaoService _permissoes;
    private readonly LimiteConsultaChavesService _limite;

    private static readonly Dictionary<string, string> Ufs = new()
    {
        ["11"] = "RO",
        ["12"] = "AC",
        ["13"] = "AM",
        ["14"] = "RR",
        ["15"] = "PA",
        ["16"] = "AP",
        ["17"] = "TO",
        ["21"] = "MA",
        ["22"] = "PI",
        ["23"] = "CE",
        ["24"] = "RN",
        ["25"] = "PB",
        ["26"] = "PE",
        ["27"] = "AL",
        ["28"] = "SE",
        ["29"] = "BA",
        ["31"] = "MG",
        ["32"] = "ES",
        ["33"] = "RJ",
        ["35"] = "SP",
        ["41"] = "PR",
        ["42"] = "SC",
        ["43"] = "RS",
        ["50"] = "MS",
        ["51"] = "MT",
        ["52"] = "GO",
        ["53"] = "DF"
    };

    public ChavesController(IntegraCertaconContext context, ValidacaoNfeService nfe,
        ValidacaoCnpjService cnpj, PermissaoService permissoes, LimiteConsultaChavesService limite)
    {
        _context = context;
        _nfe = nfe;
        _cnpj = cnpj;
        _permissoes = permissoes;
        _limite = limite;
    }

    [AllowAnonymous]
    [HttpGet("{chave}")]
    public async Task<IActionResult> Consultar(string chave, CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        bool ilimitado = false;
        int? restantes = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            var id = _permissoes.ObterUsuarioId(User);
            if (id == null) return Unauthorized();
            var usuario = await _context.Usuarios.AsNoTracking()
                .Where(u => u.UsuarioId == id && u.Ativo)
                .Select(u => new { Cliente = u.UsuarioPerfils.Any(up => up.Perfil.Ativo && up.Perfil.Nome == "Cliente") })
                .FirstOrDefaultAsync(cancellationToken);
            if (usuario == null) return Forbid();
            ilimitado = usuario.Cliente;
        }

        // Visitantes e demais perfis compartilham a cota por IP.
        // Não confia em cabeçalhos enviados diretamente pelo cliente.
        if (!ilimitado)
        {
            var endereco = HttpContext.Connection.RemoteIpAddress;
            var ip = endereco?.IsIPv4MappedToIPv6 == true ? endereco.MapToIPv4().ToString() : endereco?.ToString() ?? "desconhecido";
            var permitido = _limite.TentarConsultar(ip, out var saldo, out var segundos);
            restantes = saldo;
            if (!permitido)
            {
                Response.Headers["Retry-After"] = segundos.ToString(System.Globalization.CultureInfo.InvariantCulture);
                return StatusCode(429, new { mensagem = "Limite diário de consultas atingido.", limiteDiario = _limite.Limite, consultasRestantes = 0 });
            }
        }

        chave = chave.Trim().ToUpperInvariant();
        IActionResult Invalida(string mensagem) => Ok(new
        {
            valida = false,
            chave,
            mensagem,
            consultasIlimitadas = ilimitado,
            consultasRestantes = restantes
        });
        if (!Regex.IsMatch(chave, @"\A[0-9]{6}[A-Z0-9]{12}[0-9]{26}\z"))
            return Invalida("A chave deve ter 44 posições no formato aceito pelo sistema.");
        if (!_cnpj.Valido(chave.Substring(6, 14)))
            return Invalida("CNPJ do emitente inválido.");
        if (!_nfe.ChaveValida(chave))
            return Invalida("Dígito verificador da chave inválido.");
        var codigoUf = chave[..2];
        if (!Ufs.TryGetValue(codigoUf, out var uf)) return Invalida("Código de UF inválido.");
        var mes = int.Parse(chave.Substring(4, 2));
        if (mes is < 1 or > 12) return Invalida("Mês de emissão inválido.");
        var modelo = chave.Substring(20, 2);
        if (modelo != "55" && modelo != "65") return Invalida("Modelo diferente de NF-e ou NFC-e.");
        return Ok(new
        {
            valida = true,
            chave,
            codigoUf,
            uf,
            ano = 2000 + int.Parse(chave.Substring(2, 2)),
            mes,
            cnpj = chave.Substring(6, 14),
            cnpjFormatado = _cnpj.Formatar(chave.Substring(6, 14)),
            modelo,
            serie = chave.Substring(22, 3),
            numero = chave.Substring(25, 9),
            digitoVerificador = chave[43].ToString(),
            mensagem = "Chave estruturalmente válida. Não houve consulta à SEFAZ.",
            consultasIlimitadas = ilimitado,
            consultasRestantes = restantes
        });
    }
}
