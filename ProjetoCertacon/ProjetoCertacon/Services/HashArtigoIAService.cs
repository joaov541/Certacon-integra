using System;
using System.Text;
using System.Text.Json;
using System.Security.Cryptography;

using ProjetoCertacon.Models;

namespace ProjetoCertacon.Services;

public static class HashArtigoIAService
{
    public static string GerarHash(Artigo artigo)
    {
        ArgumentNullException.ThrowIfNull(artigo);

        string texto = JsonSerializer.Serialize(
            new
            {
                artigo.ArtigoId,

                artigo.TemaId,

                artigo.Titulo,

                artigo.Resumo,

                artigo.Conteudo,

                artigo.Visibilidade,

                artigo.DataAtualizacao,

                artigo.DataPublicacao,

                Tema = artigo.Tema?.Nome
            }
        );

        byte[] bytes =
            Encoding.UTF8.GetBytes(texto);

        byte[] hash =
            SHA256.HashData(bytes);

        return Convert.ToHexString(hash);
    }

    // =========================================
    // VERIFICAR AUTORIZAÇÃO ATUAL
    // =========================================

    public static bool PossuiAutorizacaoValida(
        Artigo artigo)
    {
        if (!artigo.AutorizadoIA)
        {
            return false;
        }

        if (artigo.Status != "PUBLICADO")
        {
            return false;
        }

        if (artigo.Visibilidade != "PUBLICO")
        {
            return false;
        }

        if (
            string.IsNullOrWhiteSpace(
                artigo.HashAutorizacaoIA
            )
        )
        {
            return false;
        }

        if (
            !artigo.AutorizadorIAId.HasValue ||
            !artigo.DataAutorizacaoIA.HasValue
        )
        {
            return false;
        }

        string hashAtual =
            GerarHash(artigo);

        return string.Equals(
            hashAtual,
            artigo.HashAutorizacaoIA,
            StringComparison.Ordinal
        );
    }
}