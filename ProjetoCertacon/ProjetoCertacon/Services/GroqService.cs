using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.Extensions.Configuration;

namespace ProjetoCertacon.Services;

public class GroqService
{
    private readonly HttpClient _httpClient;

    private readonly string _apiKey;

    private readonly string _model;

    private readonly int _maxCompletionTokens;

    public GroqService(
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _httpClient = httpClient;

        _apiKey =
            configuration["Groq:ApiKey"] ?? "";

        _model =
            configuration["Groq:Model"]
            ?? "openai/gpt-oss-20b";

        _maxCompletionTokens = Math.Clamp(
            configuration.GetValue<int>(
                "Groq:MaxCompletionTokens",
                2048
            ),
            256,
            8192
        );

        _httpClient.BaseAddress = new Uri(
            "https://api.groq.com/openai/v1/"
        );

        _httpClient.Timeout =
            TimeSpan.FromSeconds(60);
    }

    // =========================================
    // GERAR RESPOSTA COM INTELIGÊNCIA ARTIFICIAL
    // =========================================

    public async Task<string> GerarRespostaAsync(
        string instrucaoSistema,
        string mensagemUsuario,
        CancellationToken cancellationToken = default)
    {
        // =====================================
        // VALIDAR CONFIGURAÇÕES
        // =====================================

        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            throw new InvalidOperationException(
                "A chave da API Groq não foi configurada."
            );
        }

        if (string.IsNullOrWhiteSpace(mensagemUsuario))
        {
            throw new ArgumentException(
                "A mensagem não pode estar vazia."
            );
        }

        // =====================================
        // MONTAR REQUISIÇÃO
        // =====================================

        var dados = new
        {
            model = _model,

            messages = new[]
            {
                new
                {
                    role = "system",

                    content = instrucaoSistema
                },

                new
                {
                    role = "user",

                    content = mensagemUsuario
                }
            },

            temperature = 0.2,

            max_completion_tokens =
                _maxCompletionTokens,

            stream = false
        };

        using var requisicao =
            new HttpRequestMessage(
                HttpMethod.Post,
                "chat/completions"
            );

        requisicao.Headers.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                _apiKey
            );

        requisicao.Content =
            JsonContent.Create(dados);

        // =====================================
        // ENVIAR REQUISIÇÃO PARA GROQ
        // =====================================

        using var resposta =
            await _httpClient.SendAsync(
                requisicao,
                cancellationToken
            );

        // =====================================
        // TRATAR ERROS DA API
        // =====================================

        if (!resposta.IsSuccessStatusCode)
        {
            int codigo =
                (int)resposta.StatusCode;

            string mensagem = codigo switch
            {
                400 =>
                    "A requisição enviada à Groq é inválida.",

                401 =>
                    "A chave da API Groq é inválida ou foi revogada.",

                403 =>
                    "A chave não possui permissão para acessar o recurso.",

                404 =>
                    "O modelo de inteligência artificial não está disponível.",

                413 =>
                    "O conteúdo enviado excede o tamanho permitido.",

                429 =>
                    "O limite de utilização da Groq foi atingido.",

                500 =>
                    "Erro interno no serviço de inteligência artificial.",

                503 =>
                    "A Groq está temporariamente indisponível.",

                _ =>
                    $"Erro na comunicação com Groq: HTTP {codigo}."
            };

            throw new HttpRequestException(
                mensagem,
                null,
                resposta.StatusCode
            );
        }

        // =====================================
        // INTERPRETAR RESPOSTA JSON
        // =====================================

        var conteudo =
            await resposta.Content.ReadAsStringAsync(
                cancellationToken
            );

        using var documento =
            JsonDocument.Parse(conteudo);

        var raiz = documento.RootElement;

        if (
            !raiz.TryGetProperty(
                "choices",
                out var escolhas
            ) ||
            escolhas.ValueKind != JsonValueKind.Array ||
            escolhas.GetArrayLength() == 0
        )
        {
            throw new InvalidOperationException(
                "A Groq não retornou uma resposta."
            );
        }

        var escolha = escolhas[0];

        // =====================================
        // VERIFICAR CONCLUSÃO DA RESPOSTA
        // =====================================

        if (
            escolha.TryGetProperty(
                "finish_reason",
                out var motivo
            ) &&
            motivo.ValueKind == JsonValueKind.String
        )
        {
            if (motivo.GetString() != "stop")
            {
                throw new InvalidOperationException(
                    "A inteligência artificial não conseguiu concluir a resposta."
                );
            }
        }

        // =====================================
        // RECUPERAR TEXTO GERADO
        // =====================================

        if (
            !escolha.TryGetProperty(
                "message",
                out var mensagemResposta
            ) ||
            !mensagemResposta.TryGetProperty(
                "content",
                out var texto
            ) ||
            texto.ValueKind != JsonValueKind.String
        )
        {
            throw new InvalidOperationException(
                "Não foi possível interpretar a resposta da inteligência artificial."
            );
        }

        string? resultado =
            texto.GetString();

        if (string.IsNullOrWhiteSpace(resultado))
        {
            throw new InvalidOperationException(
                "A inteligência artificial retornou uma resposta vazia."
            );
        }

        return resultado.Trim();
    }
}