using System.Text.RegularExpressions;

namespace ProjetoCertacon.Services;

public class ValidacaoCnpjService
{
    public string Normalizar(string? cnpj) =>
        Regex.Replace(cnpj?.Trim().ToUpperInvariant() ?? "", @"[.\-/]", "");

    public bool Valido(string? cnpj)
    {
        var valor = Normalizar(cnpj);
        if (!Regex.IsMatch(valor, @"\A[A-Z0-9]{12}[0-9]{2}\z") ||
            valor.All(c => c == valor[0])) return false;
        int[] pesos1 = { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
        int[] pesos2 = { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
        int Calcular(int[] pesos)
        {
            int soma = 0;
            for (int i = 0; i < pesos.Length; i++) soma += (valor[i] - 48) * pesos[i];
            int resto = soma % 11;
            return resto < 2 ? 0 : 11 - resto;
        }
        return Calcular(pesos1) == valor[12] - '0' && Calcular(pesos2) == valor[13] - '0';
    }

    public string? Formatar(string? cnpj)
    {
        var v = Normalizar(cnpj);
        return Valido(v) ? $"{v[..2]}.{v[2..5]}.{v[5..8]}/{v[8..12]}-{v[12..]}" : null;
    }
}
