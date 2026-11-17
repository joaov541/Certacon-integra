
using System.Text.RegularExpressions;

namespace ProjetoCertacon.Services;

public class ValidacaoNfeService
{
    public bool ChaveValida(string chave)
    {
        // Verifica se a chave foi informada.
        if (string.IsNullOrWhiteSpace(chave))
            return false;

        // Normaliza letras minúsculas para maiúsculas.
        chave = chave.Trim().ToUpperInvariant();

        // A chave deve possuir 44 caracteres.
        // As 12 primeiras posições do CNPJ podem conter letras.
        if (!Regex.IsMatch(
            chave,
            @"^[0-9]{6}[A-Z0-9]{12}[0-9]{26}$"))
        {
            return false;
        }

        int soma = 0;
        int peso = 2;

        // Calcula o dígito verificador usando os primeiros 43 caracteres.
        for (int i = 42; i >= 0; i--)
        {
            // Converte o caractere usando ASCII - 48.
            int valor = chave[i] - 48;

            soma += valor * peso;

            peso++;

            if (peso > 9)
                peso = 2;
        }

        // Calcula o módulo 11.
        int resto = soma % 11;

        int digito = resto == 0 || resto == 1
            ? 0
            : 11 - resto;

        // Compara com o último caractere da chave.
        return digito == chave[43] - 48;
    }
}
