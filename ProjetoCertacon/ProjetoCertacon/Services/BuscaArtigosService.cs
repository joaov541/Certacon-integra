using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

using ProjetoCertacon.Data;
using ProjetoCertacon.Models;

namespace ProjetoCertacon.Services;

public class BuscaArtigosService
{
    private readonly IntegraCertaconContext _context;

    private readonly PermissaoService _permissoes;

    private readonly IConfiguration _configuration;

    private static readonly TimeSpan TempoRegex =
        TimeSpan.FromSeconds(2);

    private static readonly HashSet<string> PalavrasIgnoradas =
        new(StringComparer.Ordinal)
        {
            "qual", "quais", "como", "quando",
            "onde", "porque", "para", "sobre",
            "uma", "umas", "uns", "dos", "das",
            "pelo", "pela", "por", "com", "sem",
            "que", "isso", "esse", "essa", "este",
            "esta", "sao", "ser", "tem", "ter",
            "mais", "menos", "muito", "meu",
            "minha", "seu", "sua", "voce",
            "explique", "explicar", "significa",
            "significado", "funciona", "diferenca",
            "entre", "informacao", "informacoes",
            "gostaria", "saber", "pode", "poderia"
        };

    public BuscaArtigosService(
        IntegraCertaconContext context,
        PermissaoService permissoes,
        IConfiguration configuration)
    {
        _context = context;

        _permissoes = permissoes;

        _configuration = configuration;
    }

    // =========================================
    // CONVERTER HTML EM TEXTO
    // =========================================

    public static string ExtrairTexto(string? html)
    {
        if (string.IsNullOrWhiteSpace(html))
        {
            return "";
        }

        var texto = Regex.Replace(
            html,

            @"<!--[\s\S]*?-->|<(script|style|iframe|object)\b[^>]*>[\s\S]*?</\1\s*>",

            " ",

            RegexOptions.IgnoreCase,

            TempoRegex
        );

        texto = Regex.Replace(
            texto,

            @"<[^>]+>",

            " ",

            RegexOptions.None,

            TempoRegex
        );

        texto = WebUtility.HtmlDecode(texto);

        texto = Regex.Replace(
            texto,

            @"\s+",

            " ",

            RegexOptions.None,

            TempoRegex
        );

        return texto.Trim();
    }

    // =========================================
    // NORMALIZAR TEXTO
    // =========================================

    private static string Normalizar(string? texto)
    {
        if (string.IsNullOrWhiteSpace(texto))
        {
            return "";
        }

        var normalizado = texto
            .Normalize(NormalizationForm.FormD);

        var builder = new StringBuilder();

        foreach (char caractere in normalizado)
        {
            var categoria =
                CharUnicodeInfo.GetUnicodeCategory(
                    caractere
                );

            if (
                categoria !=
                UnicodeCategory.NonSpacingMark
            )
            {
                builder.Append(caractere);
            }
        }

        return builder
            .ToString()
            .Normalize(NormalizationForm.FormC)
            .ToLowerInvariant();
    }

    // =========================================
    // EXTRAIR PALAVRAS-CHAVE
    // =========================================

    private static string[] ExtrairPalavras(
        string texto,
        int limite = 30)
    {
        return Regex.Matches(
                Normalizar(texto),

                @"[\p{L}\p{N}]{2,}",

                RegexOptions.None,

                TempoRegex
            )
            .Cast<Match>()
            .Select(m => m.Value)
            .Where(p =>
                !PalavrasIgnoradas.Contains(p)
            )
            .Distinct()
            .Take(limite)
            .ToArray();
    }

    // =========================================
    // VALIDAR ACESSO E AUTORIZAÇÃO
    // =========================================

    private async Task<bool> PodeLerArtigoAsync(
        ClaimsPrincipal usuario,
        Artigo artigo)
    {
        if (
            !HashArtigoIAService
                .PossuiAutorizacaoValida(artigo)
        )
        {
            return false;
        }

        return await _permissoes.TemPermissaoAsync(
            usuario,

            "artigo.ler.publico",

            artigo.TemaId
        );
    }

    // =========================================
    // CONVERTER ARTIGO EM FONTE
    // =========================================

    private static FonteArtigoIA CriarFonte(
        Artigo artigo)
    {
        return new FonteArtigoIA
        {
            ArtigoId = artigo.ArtigoId,

            TemaId = artigo.TemaId,

            Titulo = ExtrairTexto(
                artigo.Titulo
            ),

            Resumo = ExtrairTexto(
                artigo.Resumo
            ),

            Conteudo = ExtrairTexto(
                artigo.Conteudo
            ),

            Tema = artigo.Tema?.Nome ?? "",

            DataPublicacao =
                artigo.DataPublicacao,

            HashAutorizacao =
                artigo.HashAutorizacaoIA ?? ""
        };
    }

    // =========================================
    // BUSCAR ARTIGO ESPECÍFICO
    // =========================================

    public async Task<FonteArtigoIA?>
        ObterArtigoAsync(
            ClaimsPrincipal usuario,
            Guid artigoId,
            CancellationToken cancellationToken = default)
    {
        var artigo = await _context.Artigos

            .AsNoTracking()

            .Include(a => a.Tema)

            .FirstOrDefaultAsync(

                a =>

                    a.ArtigoId == artigoId &&

                    a.Status == "PUBLICADO" &&

                    a.Visibilidade == "PUBLICO" &&

                    a.AutorizadoIA,

                cancellationToken
            );

        if (artigo == null)
        {
            return null;
        }

        if (
            !await PodeLerArtigoAsync(
                usuario,
                artigo
            )
        )
        {
            return null;
        }

        return CriarFonte(artigo);
    }

    // =========================================
    // CALCULAR RELEVÂNCIA
    // =========================================

    private static int CalcularPontuacao(
        FonteArtigoIA fonte,
        string[] palavras)
    {
        var titulo = ExtrairPalavras(
            fonte.Titulo,
            int.MaxValue
        ).ToHashSet();

        var tema = ExtrairPalavras(
            fonte.Tema,
            int.MaxValue
        ).ToHashSet();

        var resumo = ExtrairPalavras(
            fonte.Resumo,
            int.MaxValue
        ).ToHashSet();

        var conteudo = ExtrairPalavras(
            fonte.Conteudo,
            int.MaxValue
        ).ToHashSet();

        int pontuacao = 0;

        foreach (var palavra in palavras)
        {
            if (titulo.Contains(palavra))
                pontuacao += 10;

            if (tema.Contains(palavra))
                pontuacao += 6;

            if (resumo.Contains(palavra))
                pontuacao += 5;

            if (conteudo.Contains(palavra))
                pontuacao += 2;
        }

        return pontuacao;
    }

    // =========================================
    // BUSCAR ARTIGOS RELEVANTES
    // =========================================

    public async Task<List<FonteArtigoIA>>
        BuscarRelevantesAsync(
            ClaimsPrincipal usuario,
            string pergunta,
            CancellationToken cancellationToken = default)
    {
        var palavras =
            ExtrairPalavras(pergunta);

        if (palavras.Length == 0)
        {
            return new List<FonteArtigoIA>();
        }

        int maxArtigos = Math.Clamp(
            _configuration.GetValue<int>(
                "Groq:MaxArtigosPorConsulta",
                4
            ),
            1,
            6
        );

        // =====================================
        // BUSCAR AUTORIZAÇÕES NO SQL SERVER
        // =====================================

        var artigos = await _context.Artigos

            .AsNoTracking()

            .Include(a => a.Tema)

            .Where(a =>

                a.AutorizadoIA &&

                a.Status == "PUBLICADO" &&

                a.Visibilidade == "PUBLICO"
            )

            .ToListAsync(cancellationToken);

        var fontes =
            new List<FonteArtigoIA>();

        foreach (var artigo in artigos)
        {
            cancellationToken
                .ThrowIfCancellationRequested();

            // Validar o hash e a permissão
            // antes de utilizar o conteúdo.

            if (
                !await PodeLerArtigoAsync(
                    usuario,
                    artigo
                )
            )
            {
                continue;
            }

            var fonte =
                CriarFonte(artigo);

            if (
                string.IsNullOrWhiteSpace(
                    fonte.Conteudo
                )
            )
            {
                continue;
            }

            fonte.Pontuacao =
                CalcularPontuacao(
                    fonte,
                    palavras
                );

            if (fonte.Pontuacao > 0)
            {
                fontes.Add(fonte);
            }
        }

        return fontes

            .OrderByDescending(
                f => f.Pontuacao
            )

            .ThenByDescending(
                f => f.DataPublicacao
            )

            .Take(maxArtigos)

            .ToList();
    }

    // =========================================
    // EXTRAIR TRECHO RELEVANTE
    // =========================================

    public static string ExtrairTrechoRelevante(
        string conteudo,
        string pergunta,
        int limite = 4000)
    {
        if (limite <= 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(limite)
            );
        }

        if (
            string.IsNullOrWhiteSpace(conteudo) ||

            conteudo.Length <= limite
        )
        {
            return conteudo;
        }

        var palavras =
            ExtrairPalavras(pergunta);

        int melhorInicio = 0;

        int melhorPontuacao = -1;

        int passo = Math.Max(
            1,
            limite / 2
        );

        for (
            int inicio = 0;

            inicio < conteudo.Length;

            inicio += passo
        )
        {
            int tamanho = Math.Min(
                limite,
                conteudo.Length - inicio
            );

            var trecho = conteudo.Substring(
                inicio,
                tamanho
            );

            var termos = ExtrairPalavras(
                trecho,
                int.MaxValue
            ).ToHashSet();

            int pontuacao = palavras.Count(
                p => termos.Contains(p)
            );

            if (
                pontuacao >
                melhorPontuacao
            )
            {
                melhorPontuacao =
                    pontuacao;

                melhorInicio =
                    inicio;
            }
        }

        int tamanhoFinal = Math.Min(
            limite,
            conteudo.Length - melhorInicio
        );

        return conteudo.Substring(
            melhorInicio,
            tamanhoFinal
        );
    }
}

// =============================================
// DTO - FONTE DA INTELIGÊNCIA ARTIFICIAL
// =============================================

public class FonteArtigoIA
{
    public Guid ArtigoId { get; set; }

    public Guid TemaId { get; set; }

    public string Titulo { get; set; } = "";

    public string Resumo { get; set; } = "";

    public string Conteudo { get; set; } = "";

    public string Tema { get; set; } = "";

    public DateTime? DataPublicacao { get; set; }

    public string HashAutorizacao { get; set; } = "";

    public int Pontuacao { get; set; }
}