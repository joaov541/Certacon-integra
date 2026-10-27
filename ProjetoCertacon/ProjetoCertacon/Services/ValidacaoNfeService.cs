
namespace ProjetoCertacon.Services;

public class ValidacaoNfeService
{
    public bool ChaveValida(string chave)
    {
        if (chave.Length != 44 ||
            !chave.All(char.IsDigit))
        {
            return false;
        }

        var soma = 0;
        var peso = 2;

        for (int i = 42; i >= 0; i--)
        {
            soma += (chave[i] - '0') * peso;

            peso++;

            if (peso > 9)
                peso = 2;
        }

        var resto = soma % 11;
        var digito = resto == 0 || resto == 1
            ? 0
            : 11 - resto;

        return digito == chave[43] - '0';
    }
}
