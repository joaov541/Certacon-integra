using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;

using ProjetoCertacon.Data;
using ProjetoCertacon.Models;
using ProjetoCertacon.Services;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SimuladorTributarioController : ControllerBase
{
    private readonly IntegraCertaconContext _context;

    private readonly PermissaoService _permissoes;

    private readonly AuditoriaService _auditoria;

    private readonly SimuladorTributarioService _simulador;

    public SimuladorTributarioController(
        IntegraCertaconContext context,
        PermissaoService permissoes,
        AuditoriaService auditoria,
        SimuladorTributarioService simulador)
    {
        _context = context;

        _permissoes = permissoes;

        _auditoria = auditoria;

        _simulador = simulador;
    }

    // =========================================
    // PERMISSÕES DINÂMICAS
    // =========================================

    private Guid? ObterUsuarioId()
    {
        return _permissoes.ObterUsuarioId(User);
    }

    private Task<bool> PodeCalcular()
    {
        return _permissoes.TemPermissaoAsync(
            User,
            "simulador.calcular"
        );
    }

    private Task<bool> PodeGerenciar()
    {
        return _permissoes.TemPermissaoAsync(
            User,
            "simulador.gerenciar"
        );
    }

    // =========================================
    // VALIDAR ALÍQUOTAS
    // =========================================

    private static bool AliquotaValida(decimal valor)
    {
        return valor >= 0m &&
               valor <= 100m &&
               Math.Round(valor, 6) == valor;
    }

    // =========================================
    // VALIDAR DADOS DO CENÁRIO
    // =========================================

    private static string? ValidarDados(
        CenarioTributarioRequest dados)
    {
        if (string.IsNullOrWhiteSpace(dados.Nome))
        {
            return "Informe o nome do cenário tributário.";
        }

        if (dados.Nome.Trim().Length > 150)
        {
            return "O nome deve possuir até 150 caracteres.";
        }

        if (
            dados.Descricao != null &&
            dados.Descricao.Trim().Length > 500
        )
        {
            return "A descrição deve possuir até 500 caracteres.";
        }

        if (
            dados.AnoReferencia < 2026 ||
            dados.AnoReferencia > 2100
        )
        {
            return "O ano de referência deve estar entre 2026 e 2100.";
        }

        if (!dados.AliquotaIBSEstadual.HasValue)
        {
            return "Informe a alíquota do IBS estadual.";
        }

        if (!dados.AliquotaIBSMunicipal.HasValue)
        {
            return "Informe a alíquota do IBS municipal.";
        }

        if (!dados.AliquotaCBS.HasValue)
        {
            return "Informe a alíquota da CBS.";
        }

        if (!AliquotaValida(
            dados.AliquotaIBSEstadual.Value))
        {
            return "A alíquota do IBS estadual deve estar " +
                   "entre 0 e 100, com até seis casas decimais.";
        }

        if (!AliquotaValida(
            dados.AliquotaIBSMunicipal.Value))
        {
            return "A alíquota do IBS municipal deve estar " +
                   "entre 0 e 100, com até seis casas decimais.";
        }

        if (!AliquotaValida(
            dados.AliquotaCBS.Value))
        {
            return "A alíquota da CBS deve estar " +
                   "entre 0 e 100, com até seis casas decimais.";
        }

        return null;
    }

    // =========================================
    // VERIFICAR CENÁRIO DUPLICADO
    // =========================================

    private async Task<bool> CenarioDuplicado(
        string nome,
        int anoReferencia,
        Guid? ignorarId = null)
    {
        var nomeNormalizado = nome
            .Trim()
            .ToUpper();

        return await _context.CenarioTributarios
            .AnyAsync(c =>

                c.Nome.ToUpper() == nomeNormalizado &&

                c.AnoReferencia == anoReferencia &&

                (
                    !ignorarId.HasValue ||
                    c.CenarioTributarioId != ignorarId.Value
                )
            );
    }

    // =========================================
    // TRATAR RESTRIÇÃO UNIQUE DO SQL SERVER
    // =========================================

    private static bool ErroDuplicidade(
        DbUpdateException exception)
    {
        return exception.InnerException is SqlException sqlException
            && (
                sqlException.Number == 2601 ||
                sqlException.Number == 2627
            );
    }

    // =========================================
    // APLICAR FILTROS
    // =========================================

    private static IQueryable<CenarioTributario>
        AplicarFiltros(
            IQueryable<CenarioTributario> consulta,
            int? ano,
            string? pesquisa)
    {
        if (ano.HasValue)
        {
            consulta = consulta.Where(c =>
                c.AnoReferencia == ano.Value
            );
        }

        if (!string.IsNullOrWhiteSpace(pesquisa))
        {
            var texto = pesquisa.Trim();

            consulta = consulta.Where(c =>
                c.Nome.Contains(texto) ||

                (
                    c.Descricao != null &&
                    c.Descricao.Contains(texto)
                )
            );
        }

        return consulta;
    }

    // =========================================
    // PROJEÇÃO DOS CENÁRIOS
    // =========================================

    private async Task<List<object>> MontarResultado(
        IQueryable<CenarioTributario> consulta,
        bool incluirDadosAdministrativos = false)
    {
        var registros = await consulta
            .AsNoTracking()
            .OrderBy(c => c.AnoReferencia)
            .ThenBy(c => c.Nome)
            .Select(c => new
            {
                c.CenarioTributarioId,

                c.AutorUsuarioId,

                c.Nome,

                c.Descricao,

                c.AnoReferencia,

                c.AliquotaIBSEstadual,

                c.AliquotaIBSMunicipal,

                c.AliquotaCBS,

                c.Ativo,

                c.DataCriacao,

                c.DataAtualizacao,

                Autor = c.AutorUsuario.Nome
            })
            .ToListAsync();

        if (incluirDadosAdministrativos)
        {
            return registros.Select(c => (object)new
            {
                c.CenarioTributarioId,

                c.AutorUsuarioId,

                c.Nome,

                c.Descricao,

                c.AnoReferencia,

                c.AliquotaIBSEstadual,

                c.AliquotaIBSMunicipal,

                AliquotaIBSTotal =
                    c.AliquotaIBSEstadual +
                    c.AliquotaIBSMunicipal,

                c.AliquotaCBS,

                AliquotaTotal =
                    c.AliquotaIBSEstadual +
                    c.AliquotaIBSMunicipal +
                    c.AliquotaCBS,

                c.Ativo,

                c.DataCriacao,

                c.DataAtualizacao,

                c.Autor

            }).ToList();
        }

        return registros.Select(c => (object)new
        {
            c.CenarioTributarioId,

            c.Nome,

            c.Descricao,

            c.AnoReferencia,

            c.AliquotaIBSEstadual,

            c.AliquotaIBSMunicipal,

            AliquotaIBSTotal =
                c.AliquotaIBSEstadual +
                c.AliquotaIBSMunicipal,

            c.AliquotaCBS,

            AliquotaTotal =
                c.AliquotaIBSEstadual +
                c.AliquotaIBSMunicipal +
                c.AliquotaCBS,

            c.Ativo

        }).ToList();
    }

    // =========================================
    // REGISTRAR AUDITORIA
    // =========================================

    private async Task RegistrarAuditoria(
        Guid usuarioId,
        string acao,
        CenarioTributario cenario,
        string detalhes)
    {
        await _auditoria.RegistrarAsync(
            usuarioId,

            acao,

            "CENARIO_TRIBUTARIO",

            cenario.CenarioTributarioId,

            HttpContext.Connection.RemoteIpAddress?
                .ToString(),

            detalhes
        );
    }

    // =========================================
    // GET - LISTAR CENÁRIOS ATIVOS
    // =========================================

    [HttpGet("cenarios")]
    public async Task<IActionResult> ListarCenarios(
        [FromQuery] int? ano = null,
        [FromQuery] string? pesquisa = null)
    {
        var usuarioId = ObterUsuarioId();

        if (!usuarioId.HasValue)
            return Unauthorized();

        if (!await PodeCalcular())
            return Forbid();

        if (
            ano.HasValue &&
            (ano.Value < 2026 || ano.Value > 2100)
        )
        {
            return BadRequest(new
            {
                mensagem = "Informe um ano válido."
            });
        }

        var consulta = _context.CenarioTributarios
            .Where(c => c.Ativo);

        consulta = AplicarFiltros(
            consulta,
            ano,
            pesquisa
        );

        var resultado =
            await MontarResultado(consulta);

        return Ok(resultado);
    }

    // =========================================
    // GET - GERENCIAR CENÁRIOS
    // =========================================

    [HttpGet("gerenciar")]
    public async Task<IActionResult> Gerenciar(
        [FromQuery] int? ano = null,
        [FromQuery] bool? ativo = null,
        [FromQuery] string? pesquisa = null)
    {
        var usuarioId = ObterUsuarioId();

        if (!usuarioId.HasValue)
            return Unauthorized();

        if (!await PodeGerenciar())
            return Forbid();

        if (
            ano.HasValue &&
            (ano.Value < 2026 || ano.Value > 2100)
        )
        {
            return BadRequest(new
            {
                mensagem = "Informe um ano válido."
            });
        }

        var consulta = _context.CenarioTributarios
            .AsQueryable();

        if (ativo.HasValue)
        {
            consulta = consulta.Where(c =>
                c.Ativo == ativo.Value
            );
        }

        consulta = AplicarFiltros(
            consulta,
            ano,
            pesquisa
        );

        var resultado = await MontarResultado(
            consulta,
            incluirDadosAdministrativos: true
        );

        return Ok(resultado);
    }

    // =========================================
    // POST - REALIZAR SIMULAÇÃO
    // =========================================

    [HttpPost("calcular")]
    public async Task<IActionResult> Calcular(
        [FromBody] SimulacaoTributariaRequest dados)
    {
        var usuarioId = ObterUsuarioId();

        if (!usuarioId.HasValue)
            return Unauthorized();

        if (!await PodeCalcular())
            return Forbid();

        if (dados.CenarioTributarioId == Guid.Empty)
        {
            return BadRequest(new
            {
                mensagem =
                    "Selecione um cenário tributário."
            });
        }

        if (
            !dados.BaseCalculo.HasValue ||
            dados.BaseCalculo.Value <= 0m
        )
        {
            return BadRequest(new
            {
                mensagem =
                    "Informe uma base de cálculo maior que zero."
            });
        }

        if (
            dados.BaseCalculo.Value >
            999999999999.99m
        )
        {
            return BadRequest(new
            {
                mensagem =
                    "A base de cálculo ultrapassa o limite permitido."
            });
        }

        if (
            Math.Round(dados.BaseCalculo.Value, 2) !=
            dados.BaseCalculo.Value
        )
        {
            return BadRequest(new
            {
                mensagem =
                    "Informe um valor com até duas casas decimais."
            });
        }

        var cenario = await _context.CenarioTributarios
            .AsNoTracking()
            .FirstOrDefaultAsync(c =>

                c.CenarioTributarioId ==
                    dados.CenarioTributarioId &&

                c.Ativo
            );

        if (cenario == null)
        {
            return NotFound(new
            {
                mensagem =
                    "Cenário tributário não encontrado ou indisponível."
            });
        }

        try
        {
            var resultado = _simulador.Calcular(
                dados.BaseCalculo.Value,
                cenario
            );

            return Ok(resultado);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                mensagem = ex.Message
            });
        }
        catch (InvalidOperationException)
        {
            return Conflict(new
            {
                mensagem =
                    "O cenário tributário não está disponível para cálculo."
            });
        }
    }

    // =========================================
    // POST - CADASTRAR CENÁRIO
    // =========================================

    [HttpPost("cenarios")]
    public async Task<IActionResult> Cadastrar(
        [FromBody] CenarioTributarioRequest dados)
    {
        var usuarioId = ObterUsuarioId();

        if (!usuarioId.HasValue)
            return Unauthorized();

        if (!await PodeGerenciar())
            return Forbid();

        var erroValidacao =
            ValidarDados(dados);

        if (erroValidacao != null)
        {
            return BadRequest(new
            {
                mensagem = erroValidacao
            });
        }

        if (await CenarioDuplicado(
            dados.Nome,
            dados.AnoReferencia))
        {
            return Conflict(new
            {
                mensagem =
                    "Já existe um cenário com esse nome e ano."
            });
        }

        var cenario = new CenarioTributario
        {
            CenarioTributarioId =
                Guid.NewGuid(),

            AutorUsuarioId =
                usuarioId.Value,

            Nome =
                dados.Nome.Trim(),

            Descricao =
                string.IsNullOrWhiteSpace(dados.Descricao)
                    ? null
                    : dados.Descricao.Trim(),

            AnoReferencia =
                dados.AnoReferencia,

            AliquotaIBSEstadual =
                dados.AliquotaIBSEstadual!.Value,

            AliquotaIBSMunicipal =
                dados.AliquotaIBSMunicipal!.Value,

            AliquotaCBS =
                dados.AliquotaCBS!.Value,

            Ativo = true,

            DataCriacao =
                DateTime.UtcNow,

            DataAtualizacao = null
        };

        _context.CenarioTributarios.Add(cenario);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
            when (ErroDuplicidade(ex))
        {
            return Conflict(new
            {
                mensagem =
                    "Já existe um cenário com esse nome e ano."
            });
        }

        await RegistrarAuditoria(
            usuarioId.Value,

            "CENARIO_TRIBUTARIO_CRIADO",

            cenario,

            $"Cenário criado: {cenario.Nome}. " +
            $"Ano: {cenario.AnoReferencia}. " +
            $"IBS estadual: {cenario.AliquotaIBSEstadual}%. " +
            $"IBS municipal: {cenario.AliquotaIBSMunicipal}%. " +
            $"CBS: {cenario.AliquotaCBS}%."
        );

        return StatusCode(201, new
        {
            mensagem =
                "Cenário tributário cadastrado com sucesso.",

            cenario.CenarioTributarioId,

            cenario.Nome,

            cenario.Descricao,

            cenario.AnoReferencia,

            cenario.AliquotaIBSEstadual,

            cenario.AliquotaIBSMunicipal,

            cenario.AliquotaCBS,

            cenario.Ativo,

            cenario.DataCriacao
        });
    }

    // =========================================
    // PUT - EDITAR CENÁRIO
    // =========================================

    [HttpPut("cenarios/{id:guid}")]
    public async Task<IActionResult> Editar(
        Guid id,
        [FromBody] CenarioTributarioRequest dados)
    {
        var usuarioId = ObterUsuarioId();

        if (!usuarioId.HasValue)
            return Unauthorized();

        if (!await PodeGerenciar())
            return Forbid();

        var cenario = await _context.CenarioTributarios
            .FirstOrDefaultAsync(c =>
                c.CenarioTributarioId == id
            );

        if (cenario == null)
        {
            return NotFound(new
            {
                mensagem =
                    "Cenário tributário não encontrado."
            });
        }

        var erroValidacao =
            ValidarDados(dados);

        if (erroValidacao != null)
        {
            return BadRequest(new
            {
                mensagem = erroValidacao
            });
        }

        if (await CenarioDuplicado(
            dados.Nome,
            dados.AnoReferencia,
            id))
        {
            return Conflict(new
            {
                mensagem =
                    "Já existe outro cenário com esse nome e ano."
            });
        }

        // Guardar dados anteriores para auditoria.

        var nomeAnterior =
            cenario.Nome;

        var anoAnterior =
            cenario.AnoReferencia;

        var ibsEstadualAnterior =
            cenario.AliquotaIBSEstadual;

        var ibsMunicipalAnterior =
            cenario.AliquotaIBSMunicipal;

        var cbsAnterior =
            cenario.AliquotaCBS;

        // Atualizar informações.

        cenario.Nome =
            dados.Nome.Trim();

        cenario.Descricao =
            string.IsNullOrWhiteSpace(dados.Descricao)
                ? null
                : dados.Descricao.Trim();

        cenario.AnoReferencia =
            dados.AnoReferencia;

        cenario.AliquotaIBSEstadual =
            dados.AliquotaIBSEstadual!.Value;

        cenario.AliquotaIBSMunicipal =
            dados.AliquotaIBSMunicipal!.Value;

        cenario.AliquotaCBS =
            dados.AliquotaCBS!.Value;

        cenario.DataAtualizacao =
            DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
            when (ErroDuplicidade(ex))
        {
            return Conflict(new
            {
                mensagem =
                    "Já existe outro cenário com esse nome e ano."
            });
        }

        await RegistrarAuditoria(
            usuarioId.Value,

            "CENARIO_TRIBUTARIO_EDITADO",

            cenario,

            $"Cenário: {nomeAnterior} -> {cenario.Nome}. " +

            $"Ano: {anoAnterior} -> " +
            $"{cenario.AnoReferencia}. " +

            $"IBS estadual: {ibsEstadualAnterior}% -> " +
            $"{cenario.AliquotaIBSEstadual}%. " +

            $"IBS municipal: {ibsMunicipalAnterior}% -> " +
            $"{cenario.AliquotaIBSMunicipal}%. " +

            $"CBS: {cbsAnterior}% -> " +
            $"{cenario.AliquotaCBS}%."
        );

        return Ok(new
        {
            mensagem =
                "Cenário tributário atualizado com sucesso.",

            cenario.CenarioTributarioId,

            cenario.Nome,

            cenario.Descricao,

            cenario.AnoReferencia,

            cenario.AliquotaIBSEstadual,

            cenario.AliquotaIBSMunicipal,

            cenario.AliquotaCBS,

            cenario.Ativo,

            cenario.DataAtualizacao
        });
    }

    // =========================================
    // PATCH - ATIVAR OU DESATIVAR CENÁRIO
    // =========================================

    [HttpPatch("cenarios/{id:guid}/status")]
    public async Task<IActionResult> AlterarStatus(
        Guid id,
        [FromBody] CenarioTributarioStatusRequest dados)
    {
        var usuarioId = ObterUsuarioId();

        if (!usuarioId.HasValue)
            return Unauthorized();

        if (!await PodeGerenciar())
            return Forbid();

        if (!dados.Ativo.HasValue)
        {
            return BadRequest(new
            {
                mensagem =
                    "Informe o status do cenário."
            });
        }

        var cenario = await _context.CenarioTributarios
            .FirstOrDefaultAsync(c =>
                c.CenarioTributarioId == id
            );

        if (cenario == null)
        {
            return NotFound(new
            {
                mensagem =
                    "Cenário tributário não encontrado."
            });
        }

        if (cenario.Ativo == dados.Ativo.Value)
        {
            return Ok(new
            {
                mensagem =
                    "O cenário já possui o status informado.",

                cenario.CenarioTributarioId,

                cenario.Ativo
            });
        }

        cenario.Ativo =
            dados.Ativo.Value;

        cenario.DataAtualizacao =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var acao = cenario.Ativo
            ? "CENARIO_TRIBUTARIO_REATIVADO"
            : "CENARIO_TRIBUTARIO_DESATIVADO";

        var mensagem = cenario.Ativo
            ? "Cenário tributário reativado com sucesso."
            : "Cenário tributário desativado com sucesso.";

        await RegistrarAuditoria(
            usuarioId.Value,

            acao,

            cenario,

            $"{mensagem} Cenário: {cenario.Nome}."
        );

        return Ok(new
        {
            mensagem,

            cenario.CenarioTributarioId,

            cenario.Nome,

            cenario.Ativo,

            cenario.DataAtualizacao
        });
    }
}

// =============================================
// DTO - CADASTRO E EDIÇÃO DE CENÁRIO
// =============================================

public class CenarioTributarioRequest
{
    public string Nome { get; set; } = "";

    public string? Descricao { get; set; }

    public int AnoReferencia { get; set; }

    public decimal? AliquotaIBSEstadual { get; set; }

    public decimal? AliquotaIBSMunicipal { get; set; }

    public decimal? AliquotaCBS { get; set; }
}

// =============================================
// DTO - REALIZAR SIMULAÇÃO
// =============================================

public class SimulacaoTributariaRequest
{
    public Guid CenarioTributarioId { get; set; }

    public decimal? BaseCalculo { get; set; }
}

// =============================================
// DTO - ALTERAÇÃO DE STATUS
// =============================================

public class CenarioTributarioStatusRequest
{
    public bool? Ativo { get; set; }
}