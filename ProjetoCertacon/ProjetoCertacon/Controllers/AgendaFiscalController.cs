using System;
using System.Linq;
using System.Threading.Tasks;
using System.Globalization;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using ProjetoCertacon.Data;
using ProjetoCertacon.Models;
using ProjetoCertacon.Services;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AgendaFiscalController : ControllerBase
{
    private readonly IntegraCertaconContext _context;
    private readonly PermissaoService _permissoes;
    private readonly AuditoriaService _auditoria;

    public AgendaFiscalController(
        IntegraCertaconContext context,
        PermissaoService permissoes,
        AuditoriaService auditoria)
    {
        _context = context;
        _permissoes = permissoes;
        _auditoria = auditoria;
    }

    // =========================================
    // PERMISSÕES
    // =========================================

    private Guid? ObterUsuarioId()
    {
        return _permissoes.ObterUsuarioId(User);
    }

    private Task<bool> PodeConsultar()
    {
        return _permissoes.TemPermissaoAsync(
            User,
            "agenda.ler"
        );
    }

    private Task<bool> PodeGerenciar()
    {
        return _permissoes.TemPermissaoAsync(
            User,
            "agenda.gerenciar"
        );
    }

    // =========================================
    // DATA ATUAL NO HORÁRIO DE BRASÍLIA
    // =========================================

    private static DateOnly ObterDataAtual()
    {
        var fuso = TimeZoneInfo.FindSystemTimeZoneById(
            "America/Sao_Paulo"
        );

        var agora = TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.UtcNow,
            fuso
        );

        return DateOnly.FromDateTime(agora);
    }

    // =========================================
    // CALCULAR SITUAÇÃO DA OBRIGAÇÃO
    // =========================================

    private static string CalcularSituacao(
        bool ativo,
        DateOnly vencimento,
        DateOnly hoje)
    {
        if (!ativo)
            return "CANCELADA";

        int diasRestantes =
            vencimento.DayNumber - hoje.DayNumber;

        if (diasRestantes < 0)
            return "PRAZO_DECORRIDO";

        if (diasRestantes == 0)
            return "VENCE_HOJE";

        if (diasRestantes <= 7)
            return "PROXIMO_VENCIMENTO";

        return "A_VENCER";
    }

    // =========================================
    // VALIDAR FILTROS DE CONSULTA
    // =========================================

    private static string? ValidarPeriodo(
        int? mes,
        int? ano)
    {
        if (mes.HasValue &&
            (mes.Value < 1 || mes.Value > 12))
        {
            return "O mês deve estar entre 1 e 12.";
        }

        if (ano.HasValue &&
            (ano.Value < 1900 || ano.Value > 9998))
        {
            return "Informe um ano válido.";
        }

        if (mes.HasValue && !ano.HasValue)
        {
            return "Informe o ano ao filtrar por mês.";
        }

        return null;
    }

    // =========================================
    // APLICAR FILTROS
    // =========================================

    private IQueryable<ObrigacaoFiscal> AplicarFiltros(
        IQueryable<ObrigacaoFiscal> consulta,
        int? mes,
        int? ano,
        Guid? temaId,
        string? pesquisa)
    {
        if (ano.HasValue)
        {
            DateOnly inicio;
            DateOnly fim;

            if (mes.HasValue)
            {
                inicio = new DateOnly(
                    ano.Value,
                    mes.Value,
                    1
                );

                fim = inicio.AddMonths(1);
            }
            else
            {
                inicio = new DateOnly(
                    ano.Value,
                    1,
                    1
                );

                fim = inicio.AddYears(1);
            }

            consulta = consulta.Where(o =>
                o.DataVencimento >= inicio &&
                o.DataVencimento < fim
            );
        }

        if (temaId.HasValue)
        {
            consulta = consulta.Where(o =>
                o.TemaId == temaId.Value
            );
        }

        if (!string.IsNullOrWhiteSpace(pesquisa))
        {
            var texto = pesquisa.Trim();

            consulta = consulta.Where(o =>
                o.Titulo.Contains(texto) ||
                o.Descricao.Contains(texto) ||
                o.Tema.Nome.Contains(texto)
            );
        }

        return consulta;
    }

    // =========================================
    // PROJEÇÃO DOS REGISTROS
    // =========================================

    private async Task<List<object>> MontarResultado(
        IQueryable<ObrigacaoFiscal> consulta)
    {
        var hoje = ObterDataAtual();

        var registros = await consulta
            .AsNoTracking()
            .OrderBy(o => o.DataVencimento)
            .ThenBy(o => o.Titulo)
            .Select(o => new
            {
                o.ObrigacaoFiscalId,
                o.AutorUsuarioId,
                o.TemaId,
                o.Titulo,
                o.Descricao,
                o.DataVencimento,
                o.Competencia,
                o.Ativo,
                o.DataCriacao,
                o.DataAtualizacao,

                Tema = o.Tema.Nome,

                Autor = o.AutorUsuario.Nome
            })
            .ToListAsync();

        return registros.Select(o => (object)new
        {
            o.ObrigacaoFiscalId,
            o.AutorUsuarioId,
            o.TemaId,
            o.Titulo,
            o.Descricao,
            o.DataVencimento,
            o.Competencia,
            o.Ativo,
            o.DataCriacao,
            o.DataAtualizacao,
            o.Tema,
            o.Autor,

            Situacao = CalcularSituacao(
                o.Ativo,
                o.DataVencimento,
                hoje
            ),

            DiasRestantes =
                o.DataVencimento.DayNumber -
                hoje.DayNumber

        }).ToList();
    }

    // =========================================
    // VALIDAR DADOS DO CADASTRO
    // =========================================

    private async Task<string?> ValidarDados(
        ObrigacaoFiscalRequest dados)
    {
        if (string.IsNullOrWhiteSpace(dados.Titulo))
            return "Informe o título da obrigação.";

        if (dados.Titulo.Trim().Length > 150)
            return "O título deve ter até 150 caracteres.";

        if (string.IsNullOrWhiteSpace(dados.Descricao))
            return "Informe a descrição da obrigação.";

        if (dados.Descricao.Trim().Length > 5000)
            return "A descrição deve ter até 5000 caracteres.";

        if (dados.TemaId == Guid.Empty)
            return "Selecione um tema tributário.";

        if (!dados.DataVencimento.HasValue)
            return "Informe a data de vencimento.";

        if (dados.DataVencimento.Value.Year < 1900 ||
            dados.DataVencimento.Value.Year > 9998)
        {
            return "Informe uma data de vencimento válida.";
        }

        if (dados.Competencia.HasValue)
        {
            if (dados.Competencia.Value.Day != 1)
            {
                return
                    "A competência deve corresponder ao primeiro dia do mês.";
            }

            if (dados.Competencia.Value.Year < 1900 ||
                dados.Competencia.Value.Year > 9998)
            {
                return "Informe uma competência válida.";
            }
        }

        var temaExiste = await _context.Temas
            .AnyAsync(t =>
                t.TemaId == dados.TemaId &&
                t.Ativo
            );

        if (!temaExiste)
            return "O tema informado não existe ou está inativo.";

        return null;
    }

    // =========================================
    // REGISTRAR AUDITORIA
    // =========================================

    private async Task RegistrarAuditoria(
        Guid usuarioId,
        string acao,
        ObrigacaoFiscal obrigacao,
        string detalhes)
    {
        await _auditoria.RegistrarAsync(
            usuarioId,

            acao,

            "OBRIGACAO_FISCAL",

            obrigacao.ObrigacaoFiscalId,

            HttpContext.Connection.RemoteIpAddress?
                .ToString(),

            detalhes
        );
    }

    // =========================================
    // GET - CONSULTAR AGENDA FISCAL
    // Cliente e Coordenador
    // =========================================

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] int? mes = null,
        [FromQuery] int? ano = null,
        [FromQuery] Guid? temaId = null,
        [FromQuery] string? pesquisa = null)
    {
        var usuarioId = ObterUsuarioId();

        if (!usuarioId.HasValue)
            return Unauthorized();

        if (!await PodeConsultar())
            return Forbid();

        var erroPeriodo = ValidarPeriodo(mes, ano);

        if (erroPeriodo != null)
        {
            return BadRequest(new
            {
                mensagem = erroPeriodo
            });
        }

        var consulta = _context.ObrigacaoFiscais
            .Where(o => o.Ativo);

        consulta = AplicarFiltros(
            consulta,
            mes,
            ano,
            temaId,
            pesquisa
        );

        var resultado = await MontarResultado(consulta);

        return Ok(resultado);
    }

    // =========================================
    // GET - CONSULTAR OBRIGAÇÃO POR ID
    // =========================================

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ConsultarPorId(
        Guid id)
    {
        var usuarioId = ObterUsuarioId();

        if (!usuarioId.HasValue)
            return Unauthorized();

        var podeGerenciar = await PodeGerenciar();

        var podeConsultar = await PodeConsultar();

        if (!podeConsultar && !podeGerenciar)
            return Forbid();

        var consulta = _context.ObrigacaoFiscais
            .Where(o => o.ObrigacaoFiscalId == id);

        // Apenas quem gerencia pode visualizar
        // obrigações canceladas.

        if (!podeGerenciar)
        {
            consulta = consulta.Where(o => o.Ativo);
        }

        var resultado = await MontarResultado(consulta);

        if (resultado.Count == 0)
        {
            return NotFound(new
            {
                mensagem = "Obrigação fiscal não encontrada."
            });
        }

        return Ok(resultado.First());
    }

    // =========================================
    // GET - GERENCIAR AGENDA
    // Somente usuários autorizados
    // =========================================

    [HttpGet("gerenciar")]
    public async Task<IActionResult> Gerenciar(
        [FromQuery] int? mes = null,
        [FromQuery] int? ano = null,
        [FromQuery] Guid? temaId = null,
        [FromQuery] bool? ativo = null,
        [FromQuery] string? pesquisa = null)
    {
        var usuarioId = ObterUsuarioId();

        if (!usuarioId.HasValue)
            return Unauthorized();

        if (!await PodeGerenciar())
            return Forbid();

        var erroPeriodo = ValidarPeriodo(mes, ano);

        if (erroPeriodo != null)
        {
            return BadRequest(new
            {
                mensagem = erroPeriodo
            });
        }

        var consulta = _context.ObrigacaoFiscais
            .AsQueryable();

        if (ativo.HasValue)
        {
            consulta = consulta.Where(o =>
                o.Ativo == ativo.Value
            );
        }

        consulta = AplicarFiltros(
            consulta,
            mes,
            ano,
            temaId,
            pesquisa
        );

        var resultado = await MontarResultado(consulta);

        return Ok(resultado);
    }

    // =========================================
    // POST - CADASTRAR OBRIGAÇÃO FISCAL
    // =========================================

    [HttpPost]
    public async Task<IActionResult> Cadastrar(
        [FromBody] ObrigacaoFiscalRequest dados)
    {
        var usuarioId = ObterUsuarioId();

        if (!usuarioId.HasValue)
            return Unauthorized();

        if (!await PodeGerenciar())
            return Forbid();

        var erroValidacao = await ValidarDados(dados);

        if (erroValidacao != null)
        {
            return BadRequest(new
            {
                mensagem = erroValidacao
            });
        }

        var obrigacao = new ObrigacaoFiscal
        {
            ObrigacaoFiscalId = Guid.NewGuid(),

            AutorUsuarioId = usuarioId.Value,

            TemaId = dados.TemaId,

            Titulo = dados.Titulo.Trim(),

            Descricao = dados.Descricao.Trim(),

            DataVencimento = dados.DataVencimento!.Value,

            Competencia = dados.Competencia,

            Ativo = true,

            DataCriacao = DateTime.UtcNow,

            DataAtualizacao = null
        };

        _context.ObrigacaoFiscais.Add(obrigacao);

        await _context.SaveChangesAsync();

        await RegistrarAuditoria(
            usuarioId.Value,
            "OBRIGACAO_FISCAL_CRIADA",
            obrigacao,
            $"Obrigação cadastrada: {obrigacao.Titulo}. " +
            $"Vencimento: {obrigacao.DataVencimento:dd/MM/yyyy}."
        );

        return CreatedAtAction(
            nameof(ConsultarPorId),
            new
            {
                id = obrigacao.ObrigacaoFiscalId
            },
            new
            {
                mensagem =
                    "Obrigação fiscal cadastrada com sucesso.",

                obrigacao.ObrigacaoFiscalId,
                obrigacao.Titulo,
                obrigacao.TemaId,
                obrigacao.DataVencimento,
                obrigacao.Competencia,
                obrigacao.Ativo
            }
        );
    }

    // =========================================
    // PUT - EDITAR OBRIGAÇÃO FISCAL
    // =========================================

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Editar(
        Guid id,
        [FromBody] ObrigacaoFiscalRequest dados)
    {
        var usuarioId = ObterUsuarioId();

        if (!usuarioId.HasValue)
            return Unauthorized();

        if (!await PodeGerenciar())
            return Forbid();

        var obrigacao = await _context.ObrigacaoFiscais
            .FirstOrDefaultAsync(o =>
                o.ObrigacaoFiscalId == id
            );

        if (obrigacao == null)
        {
            return NotFound(new
            {
                mensagem = "Obrigação fiscal não encontrada."
            });
        }

        var erroValidacao = await ValidarDados(dados);

        if (erroValidacao != null)
        {
            return BadRequest(new
            {
                mensagem = erroValidacao
            });
        }

        var tituloAnterior = obrigacao.Titulo;

        var vencimentoAnterior =
            obrigacao.DataVencimento;

        obrigacao.TemaId = dados.TemaId;

        obrigacao.Titulo = dados.Titulo.Trim();

        obrigacao.Descricao = dados.Descricao.Trim();

        obrigacao.DataVencimento =
            dados.DataVencimento!.Value;

        obrigacao.Competencia =
            dados.Competencia;

        obrigacao.DataAtualizacao =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await RegistrarAuditoria(
            usuarioId.Value,
            "OBRIGACAO_FISCAL_EDITADA",
            obrigacao,
            $"Obrigação editada: {tituloAnterior} -> " +
            $"{obrigacao.Titulo}. Vencimento: " +
            $"{vencimentoAnterior:dd/MM/yyyy} -> " +
            $"{obrigacao.DataVencimento:dd/MM/yyyy}."
        );

        return Ok(new
        {
            mensagem =
                "Obrigação fiscal atualizada com sucesso.",

            obrigacao.ObrigacaoFiscalId,
            obrigacao.Titulo,
            obrigacao.TemaId,
            obrigacao.DataVencimento,
            obrigacao.Competencia,
            obrigacao.Ativo,
            obrigacao.DataAtualizacao
        });
    }

    // =========================================
    // PATCH - CANCELAR OU REATIVAR
    // =========================================

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> AlterarStatus(
        Guid id,
        [FromBody] ObrigacaoFiscalStatusRequest dados)
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
                mensagem = "Informe o status da obrigação."
            });
        }

        var obrigacao = await _context.ObrigacaoFiscais
            .FirstOrDefaultAsync(o =>
                o.ObrigacaoFiscalId == id
            );

        if (obrigacao == null)
        {
            return NotFound(new
            {
                mensagem = "Obrigação fiscal não encontrada."
            });
        }

        if (obrigacao.Ativo == dados.Ativo.Value)
        {
            return Ok(new
            {
                mensagem =
                    "A obrigação já possui o status informado.",

                obrigacao.ObrigacaoFiscalId,

                obrigacao.Ativo
            });
        }

        if (dados.Ativo.Value)
        {
            var temaAtivo = await _context.Temas
                .AnyAsync(t =>
                    t.TemaId == obrigacao.TemaId &&
                    t.Ativo
                );

            if (!temaAtivo)
            {
                return BadRequest(new
                {
                    mensagem =
                        "Não é possível reativar uma obrigação vinculada a um tema inativo."
                });
            }
        }

        obrigacao.Ativo = dados.Ativo.Value;

        obrigacao.DataAtualizacao =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var acao = obrigacao.Ativo
            ? "OBRIGACAO_FISCAL_REATIVADA"
            : "OBRIGACAO_FISCAL_CANCELADA";

        var mensagem = obrigacao.Ativo
            ? "Obrigação fiscal reativada com sucesso."
            : "Obrigação fiscal cancelada com sucesso.";

        await RegistrarAuditoria(
            usuarioId.Value,
            acao,
            obrigacao,
            $"{mensagem} Título: {obrigacao.Titulo}."
        );

        return Ok(new
        {
            mensagem,

            obrigacao.ObrigacaoFiscalId,

            obrigacao.Titulo,

            obrigacao.Ativo,

            Situacao = CalcularSituacao(
                obrigacao.Ativo,
                obrigacao.DataVencimento,
                ObterDataAtual()
            ),

            obrigacao.DataAtualizacao
        });
    }
}

// =========================================
// DTO - CADASTRO E EDIÇÃO
// =========================================

public class ObrigacaoFiscalRequest
{
    public Guid TemaId { get; set; }

    public string Titulo { get; set; } = "";

    public string Descricao { get; set; } = "";

    public DateOnly? DataVencimento { get; set; }

    public DateOnly? Competencia { get; set; }
}

// =========================================
// DTO - ALTERAÇÃO DE STATUS
// =========================================

public class ObrigacaoFiscalStatusRequest
{
    public bool? Ativo { get; set; }
}