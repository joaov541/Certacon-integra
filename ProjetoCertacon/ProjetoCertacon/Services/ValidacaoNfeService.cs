using System.Text.RegularExpressions;

namespace ProjetoCertacon.Services;

public class ValidacaoNfeService
{
    private readonly ValidacaoCnpjService _cnpj;
    public ValidacaoNfeService(ValidacaoCnpjService cnpj) => _cnpj = cnpj;

    public bool ChaveValida(string chave)
    {
        if (string.IsNullOrWhiteSpace(chave)) return false;
        chave = chave.Trim().ToUpperInvariant();
        if (!Regex.IsMatch(chave, @"\A[0-9]{6}[A-Z0-9]{12}[0-9]{26}\z")) return false;
        if (!_cnpj.Valido(chave.Substring(6, 14))) return false;
        int soma = 0, peso = 2;
        for (int i = 42; i >= 0; i--)
        {
            soma += (chave[i] - 48) * peso;
            peso = peso == 9 ? 2 : peso + 1;
        }
        int resto = soma % 11;
        return (resto < 2 ? 0 : 11 - resto) == chave[43] - '0';
    }
}
