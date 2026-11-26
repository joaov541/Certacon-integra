using System;
using System.Data;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;

using ProjetoCertacon.Data;

namespace ProjetoCertacon.Services;

public class ControleUsoIAService
{
    private readonly IntegraCertaconContext _context;

    private readonly int _limiteDiario;

    private static readonly TimeZoneInfo FusoBrasilia =
        ObterFusoBrasilia();

    public ControleUsoIAService(
        IntegraCertaconContext context,
        IConfiguration configuration)
    {
        _context = context;

        _limiteDiario = Math.Clamp(
            configuration.GetValue<int>(
                "Groq:LimiteDiarioPorUsuario",
                20
            ),
            1,
            1000
        );
    }

    // =========================================
    // FUSO HORÁRIO
    // =========================================

    private static TimeZoneInfo ObterFusoBrasilia()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(
                "America/Sao_Paulo"
            );
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById(
                "E. South America Standard Time"
            );
        }
    }

    private static DateOnly ObterDataReferencia()
    {
        var horarioBrasilia =
            TimeZoneInfo.ConvertTimeFromUtc(
                DateTime.UtcNow,
                FusoBrasilia
            );

        return DateOnly.FromDateTime(
            horarioBrasilia
        );
    }

    // =========================================
    // CONSULTAR UTILIZAÇÃO DIÁRIA
    // =========================================

    public async Task<LimiteIAResultado> ConsultarAsync(
        Guid usuarioId,
        CancellationToken cancellationToken = default)
    {
        var hoje = ObterDataReferencia();

        var registro = await _context
            .UsoInteligenciaArtificiais
            .AsNoTracking()
            .FirstOrDefaultAsync(
                u =>

                    u.UsuarioId == usuarioId &&

                    u.DataReferencia == hoje,

                cancellationToken
            );

        int resumos =
            registro?.QuantidadeResumos ?? 0;

        int perguntas =
            registro?.QuantidadePerguntas ?? 0;

        int utilizado =
            resumos + perguntas;

        return new LimiteIAResultado
        {
            DataReferencia = hoje,

            LimiteDiario = _limiteDiario,

            QuantidadeResumos = resumos,

            QuantidadePerguntas = perguntas,

            ConsultasUtilizadas = utilizado,

            ConsultasRestantes = Math.Max(
                0,
                _limiteDiario - utilizado
            ),

            LimiteAtingido =
                utilizado >= _limiteDiario
        };
    }

    // =========================================
    // RESERVAR CONSULTA DE FORMA ATÔMICA
    // =========================================

    public async Task<bool> ReservarConsultaAsync(
        Guid usuarioId,
        string tipo,
        CancellationToken cancellationToken = default)
    {
        if (usuarioId == Guid.Empty)
        {
            throw new ArgumentException(
                "Usuário inválido."
            );
        }

        if (
            tipo != "RESUMO" &&
            tipo != "PERGUNTA"
        )
        {
            throw new ArgumentException(
                "Tipo de consulta inválido."
            );
        }

        var hoje = ObterDataReferencia();

        var dataReferencia = hoje.ToDateTime(
            TimeOnly.MinValue
        );

        int incrementarResumo =
            tipo == "RESUMO" ? 1 : 0;

        int incrementarPergunta =
            tipo == "PERGUNTA" ? 1 : 0;

        // A transação termina antes de chamar a Groq.

        await using var transacao =
            await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken
            );

        var conexao =
            _context.Database.GetDbConnection();

        await using var comando =
            conexao.CreateCommand();

        comando.Transaction =
            transacao.GetDbTransaction();

        comando.CommandText = @"

            DECLARE @Reservado INT = 0;

            IF EXISTS
            (
                SELECT 1
                FROM dbo.USO_INTELIGENCIA_ARTIFICIAL
                    WITH (UPDLOCK, HOLDLOCK)

                WHERE Usuario_Id = @UsuarioId

                  AND DataReferencia = @DataReferencia
            )
            BEGIN

                UPDATE dbo.USO_INTELIGENCIA_ARTIFICIAL

                SET
                    QuantidadeResumos =
                        QuantidadeResumos + @Resumos,

                    QuantidadePerguntas =
                        QuantidadePerguntas + @Perguntas,

                    DataUltimaConsulta =
                        SYSUTCDATETIME()

                WHERE Usuario_Id = @UsuarioId

                  AND DataReferencia = @DataReferencia

                  AND (
                      QuantidadeResumos +
                      QuantidadePerguntas
                  ) < @Limite;

                SET @Reservado = @@ROWCOUNT;

            END
            ELSE
            BEGIN

                INSERT INTO
                    dbo.USO_INTELIGENCIA_ARTIFICIAL
                (
                    Usuario_Id,
                    DataReferencia,
                    QuantidadeResumos,
                    QuantidadePerguntas,
                    DataUltimaConsulta
                )
                VALUES
                (
                    @UsuarioId,
                    @DataReferencia,
                    @Resumos,
                    @Perguntas,
                    SYSUTCDATETIME()
                );

                SET @Reservado = 1;

            END;

            SELECT @Reservado;
        ";

        void AdicionarParametro(
            string nome,
            DbType tipoParametro,
            object valor)
        {
            var parametro =
                comando.CreateParameter();

            parametro.ParameterName = nome;

            parametro.DbType = tipoParametro;

            parametro.Value = valor;

            comando.Parameters.Add(parametro);
        }

        AdicionarParametro(
            "@UsuarioId",
            DbType.Guid,
            usuarioId
        );

        AdicionarParametro(
            "@DataReferencia",
            DbType.Date,
            dataReferencia
        );

        AdicionarParametro(
            "@Resumos",
            DbType.Int32,
            incrementarResumo
        );

        AdicionarParametro(
            "@Perguntas",
            DbType.Int32,
            incrementarPergunta
        );

        AdicionarParametro(
            "@Limite",
            DbType.Int32,
            _limiteDiario
        );

        var resultado =
            await comando.ExecuteScalarAsync(
                cancellationToken
            );

        bool reservado =
            Convert.ToInt32(resultado) == 1;

        await transacao.CommitAsync(
            cancellationToken
        );

        return reservado;
    }
}

// =============================================
// DTO - LIMITE DE UTILIZAÇÃO
// =============================================

public class LimiteIAResultado
{
    public DateOnly DataReferencia { get; set; }

    public int LimiteDiario { get; set; }

    public int QuantidadeResumos { get; set; }

    public int QuantidadePerguntas { get; set; }

    public int ConsultasUtilizadas { get; set; }

    public int ConsultasRestantes { get; set; }

    public bool LimiteAtingido { get; set; }
}