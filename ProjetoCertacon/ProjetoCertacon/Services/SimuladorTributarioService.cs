using System;

using ProjetoCertacon.Models;

namespace ProjetoCertacon.Services;

public class SimuladorTributarioService
{
    // =========================================
    // ARREDONDAMENTO MONETÁRIO
    // =========================================

    private static decimal Arredondar(decimal valor)
    {
        return Math.Round(
            valor,
            2,
            MidpointRounding.AwayFromZero
        );
    }

    // =========================================
    // CALCULAR TRIBUTO
    // =========================================

    private static decimal CalcularTributo(
        decimal baseCalculo,
        decimal aliquota)
    {
        return Arredondar(
            baseCalculo * aliquota / 100m
        );
    }

    // =========================================
    // VALIDAR ALÍQUOTA
    // =========================================

    private static bool AliquotaValida(decimal aliquota)
    {
        return aliquota >= 0m &&
               aliquota <= 100m;
    }

    // =========================================
    // REALIZAR SIMULAÇÃO
    // =========================================

    public SimulacaoTributariaResultado Calcular(
        decimal baseCalculo,
        CenarioTributario cenario)
    {
        ArgumentNullException.ThrowIfNull(cenario);

        if (baseCalculo <= 0m)
        {
            throw new ArgumentException(
                "A base de cálculo deve ser maior que zero."
            );
        }

        if (baseCalculo > 999999999999.99m)
        {
            throw new ArgumentException(
                "A base de cálculo ultrapassa o limite permitido."
            );
        }

        if (Math.Round(baseCalculo, 2) != baseCalculo)
        {
            throw new ArgumentException(
                "A base de cálculo deve possuir até duas casas decimais."
            );
        }

        if (!cenario.Ativo)
        {
            throw new InvalidOperationException(
                "O cenário tributário está inativo."
            );
        }

        if (
            !AliquotaValida(cenario.AliquotaIBSEstadual) ||
            !AliquotaValida(cenario.AliquotaIBSMunicipal) ||
            !AliquotaValida(cenario.AliquotaCBS)
        )
        {
            throw new InvalidOperationException(
                "O cenário possui alíquotas inválidas."
            );
        }

        // =====================================
        // IBS ESTADUAL
        // =====================================

        decimal valorIBSEstadual = CalcularTributo(
            baseCalculo,
            cenario.AliquotaIBSEstadual
        );

        // =====================================
        // IBS MUNICIPAL
        // =====================================

        decimal valorIBSMunicipal = CalcularTributo(
            baseCalculo,
            cenario.AliquotaIBSMunicipal
        );

        // =====================================
        // IBS TOTAL
        // =====================================

        decimal aliquotaIBSTotal =
            cenario.AliquotaIBSEstadual +
            cenario.AliquotaIBSMunicipal;

        decimal valorIBSTotal =
            valorIBSEstadual +
            valorIBSMunicipal;

        // =====================================
        // CBS
        // =====================================

        decimal valorCBS = CalcularTributo(
            baseCalculo,
            cenario.AliquotaCBS
        );

        // =====================================
        // TOTAL DOS TRIBUTOS
        // =====================================

        decimal totalTributos =
            valorIBSTotal +
            valorCBS;

        decimal aliquotaTotal =
            aliquotaIBSTotal +
            cenario.AliquotaCBS;

        decimal valorTotalComTributos =
            baseCalculo +
            totalTributos;

        decimal cargaTributariaEfetiva =
            Math.Round(
                totalTributos / baseCalculo * 100m,
                6,
                MidpointRounding.AwayFromZero
            );

        // =====================================
        // RETORNAR RESULTADO
        // =====================================

        return new SimulacaoTributariaResultado
        {
            CenarioTributarioId =
                cenario.CenarioTributarioId,

            NomeCenario =
                cenario.Nome,

            AnoReferencia =
                cenario.AnoReferencia,

            BaseCalculo =
                baseCalculo,

            AliquotaIBSEstadual =
                cenario.AliquotaIBSEstadual,

            AliquotaIBSMunicipal =
                cenario.AliquotaIBSMunicipal,

            AliquotaIBSTotal =
                aliquotaIBSTotal,

            AliquotaCBS =
                cenario.AliquotaCBS,

            AliquotaTotal =
                aliquotaTotal,

            ValorIBSEstadual =
                valorIBSEstadual,

            ValorIBSMunicipal =
                valorIBSMunicipal,

            ValorIBSTotal =
                valorIBSTotal,

            ValorCBS =
                valorCBS,

            TotalTributos =
                totalTributos,

            ValorTotalComTributos =
                valorTotalComTributos,

            CargaTributariaEfetiva =
                cargaTributariaEfetiva,

            DataSimulacao =
                DateTime.UtcNow,

            TipoCalculo =
                "SIMULACAO_SIMPLIFICADA",

            Aviso =
                "Simulação educativa baseada nas alíquotas " +
                "do cenário selecionado. Não considera créditos, " +
                "reduções, imunidades ou regimes especiais e " +
                "não substitui uma apuração fiscal oficial."
        };
    }
}

// =============================================
// DTO - RESULTADO DA SIMULAÇÃO
// =============================================

public class SimulacaoTributariaResultado
{
    public Guid CenarioTributarioId { get; set; }

    public string NomeCenario { get; set; } = "";

    public int AnoReferencia { get; set; }

    public decimal BaseCalculo { get; set; }

    public decimal AliquotaIBSEstadual { get; set; }

    public decimal AliquotaIBSMunicipal { get; set; }

    public decimal AliquotaIBSTotal { get; set; }

    public decimal AliquotaCBS { get; set; }

    public decimal AliquotaTotal { get; set; }

    public decimal ValorIBSEstadual { get; set; }

    public decimal ValorIBSMunicipal { get; set; }

    public decimal ValorIBSTotal { get; set; }

    public decimal ValorCBS { get; set; }

    public decimal TotalTributos { get; set; }

    public decimal ValorTotalComTributos { get; set; }

    public decimal CargaTributariaEfetiva { get; set; }

    public DateTime DataSimulacao { get; set; }

    public string TipoCalculo { get; set; } = "";

    public string Aviso { get; set; } = "";
}