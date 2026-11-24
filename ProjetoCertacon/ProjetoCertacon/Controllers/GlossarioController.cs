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
public class GlossarioController : ControllerBase
{
    private readonly IntegraCertaconContext _context;
    private readonly PermissaoService _permissoes;
    private readonly AuditoriaService _auditoria;

    public GlossarioController(
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

    private Task<bool> PodeGerenciar()
    {
        return _permissoes.TemPermissaoAsync(
            User,
            "glossario.gerenciar"
        );
    }

    // =========================================
    // AUDITORIA
    // =========================================

    private Task RegistrarAuditoria(
        string acao,
        GlossarioFiscal termo)
    {
        return _auditoria.RegistrarAsync(
            _permissoes.ObterUsuarioId(User),
            acao,
            "GLOSSARIO_FISCAL",
            termo.GlossarioFiscalId,
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            termo.Termo
        );
    }

    // =========================================
    // CONSULTA COM PESQUISA E FILTRO POR LETRA
    // =========================================

    private IQueryable<GlossarioFiscal> AplicarFiltros(
        IQueryable<GlossarioFiscal> consulta,
        string? pesquisa,
        string? letra)
    {
        if (!string.IsNullOrWhiteSpace(pesquisa))
        {
            pesquisa = pesquisa.Trim().ToUpperInvariant();

            consulta = consulta.Where(g =>
                g.Termo.ToUpper().Contains(pesquisa) ||
                g.Significado.ToUpper().Contains(pesquisa) ||
                g.Descricao.ToUpper().Contains(pesquisa)
            );
        }

        if (!string.IsNullOrWhiteSpace(letra))
        {
            letra = letra.Trim().ToUpperInvariant();

            if (letra.Length == 1)
            {
                consulta = consulta.Where(g =>
                    g.Termo.ToUpper().StartsWith(letra)
                );
            }
        }

        return consulta;
    }

    // =========================================
    // GET - LISTAR TERMOS PÚBLICOS
    // =========================================

    /// <summary>
    /// Lista os termos ativos do glossário fiscal.
    /// Disponível para visitantes e usuários autenticados.
    /// </summary>

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Listar(
        [FromQuery] string? pesquisa = null,
        [FromQuery] string? letra = null)
    {
        var consulta = _context.GlossarioFiscais
            .AsNoTracking()
            .Where(g => g.Ativo);

        consulta = AplicarFiltros(
            consulta,
            pesquisa,
            letra
        );

        var termos = await consulta
            .OrderBy(g => g.Termo)
            .Select(g => new
            {
                g.GlossarioFiscalId,
                g.Termo,
                g.Significado,
                g.Descricao,
                g.DataCriacao,
                g.DataAtualizacao
            })
            .ToListAsync();

        return Ok(termos);
    }

    // =========================================
    // GET - CONSULTAR TERMO POR ID
    // =========================================

    /// <summary>
    /// Consulta um termo ativo pelo identificador.
    /// </summary>

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> Consultar(Guid id)
    {
        var termo = await _context.GlossarioFiscais
            .AsNoTracking()
            .Where(g =>
                g.GlossarioFiscalId == id &&
                g.Ativo
            )
            .Select(g => new
            {
                g.GlossarioFiscalId,
                g.Termo,
                g.Significado,
                g.Descricao,
                g.DataCriacao,
                g.DataAtualizacao
            })
            .FirstOrDefaultAsync();

        if (termo == null)
        {
            return NotFound(new
            {
                mensagem = "Termo não encontrado."
            });
        }

        return Ok(termo);
    }

    // =========================================
    // GET - GERENCIAMENTO DE TERMOS
    // =========================================

    /// <summary>
    /// Lista os termos ativos e inativos.
    /// Exige a permissão glossario.gerenciar.
    /// </summary>

    [HttpGet("gerenciar")]
    public async Task<IActionResult> Gerenciar(
        [FromQuery] string? pesquisa = null,
        [FromQuery] string? letra = null,
        [FromQuery] bool? ativo = null)
    {
        if (!await PodeGerenciar())
        {
            return Forbid();
        }

        var consulta = _context.GlossarioFiscais
            .AsNoTracking()
            .AsQueryable();

        if (ativo.HasValue)
        {
            consulta = consulta.Where(g =>
                g.Ativo == ativo.Value
            );
        }

        consulta = AplicarFiltros(
            consulta,
            pesquisa,
            letra
        );

        var termos = await consulta
            .OrderBy(g => g.Termo)
            .Select(g => new
            {
                g.GlossarioFiscalId,
                g.AutorUsuarioId,
                Autor = g.AutorUsuario.Nome,
                g.Termo,
                g.Significado,
                g.Descricao,
                g.Ativo,
                g.DataCriacao,
                g.DataAtualizacao
            })
            .ToListAsync();

        return Ok(termos);
    }

    // =========================================
    // POST - CADASTRAR TERMO
    // =========================================

    /// <summary>
    /// Cadastra um novo termo fiscal.
    /// </summary>

    [HttpPost]
    public async Task<IActionResult> Criar(
        [FromBody] GlossarioRequest dados)
    {
        if (!await PodeGerenciar())
        {
            return Forbid();
        }

        var usuarioId = _permissoes.ObterUsuarioId(User);

        if (!usuarioId.HasValue || usuarioId.Value == Guid.Empty)
        {
            return Unauthorized(new
            {
                mensagem = "Não foi possível identificar o usuário autenticado."
            });
        }

        var termo = dados.Termo?.Trim() ?? "";
        var significado = dados.Significado?.Trim() ?? "";
        var descricao = dados.Descricao?.Trim() ?? "";

        var erro = ValidarCampos(
            termo,
            significado,
            descricao
        );

        if (erro != null)
        {
            return BadRequest(new
            {
                mensagem = erro
            });
        }

        var termoNormalizado = termo.ToUpperInvariant();

        var existe = await _context.GlossarioFiscais
            .AnyAsync(g =>
                g.Termo.ToUpper() == termoNormalizado
            );

        if (existe)
        {
            return Conflict(new
            {
                mensagem = "Este termo já está cadastrado."
            });
        }

        var novoTermo = new GlossarioFiscal
        {
            GlossarioFiscalId = Guid.NewGuid(),
            AutorUsuarioId = usuarioId.Value,
            Termo = termo,
            Significado = significado,
            Descricao = descricao,
            Ativo = true,
            DataCriacao = DateTime.UtcNow,
            DataAtualizacao = null
        };

        _context.GlossarioFiscais.Add(novoTermo);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is SqlException sql &&
                  (sql.Number == 2601 || sql.Number == 2627))
        {
            return Conflict(new
            {
                mensagem = "Este termo já está cadastrado."
            });
        }

        await RegistrarAuditoria(
            "GLOSSARIO_CRIADO",
            novoTermo
        );

        return CreatedAtAction(
            nameof(Consultar),
            new { id = novoTermo.GlossarioFiscalId },
            new
            {
                mensagem = "Termo cadastrado com sucesso.",
                novoTermo.GlossarioFiscalId,
                novoTermo.Termo,
                novoTermo.Significado,
                novoTermo.Descricao,
                novoTermo.Ativo,
                novoTermo.DataCriacao
            }
        );
    }

    // =========================================
    // PUT - EDITAR TERMO
    // =========================================

    /// <summary>
    /// Atualiza as informações de um termo fiscal.
    /// </summary>

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Editar(
        Guid id,
        [FromBody] GlossarioRequest dados)
    {
        if (!await PodeGerenciar())
        {
            return Forbid();
        }

        var termoExistente = await _context.GlossarioFiscais
            .FirstOrDefaultAsync(g =>
                g.GlossarioFiscalId == id
            );

        if (termoExistente == null)
        {
            return NotFound(new
            {
                mensagem = "Termo não encontrado."
            });
        }

        var termo = dados.Termo?.Trim() ?? "";
        var significado = dados.Significado?.Trim() ?? "";
        var descricao = dados.Descricao?.Trim() ?? "";

        var erro = ValidarCampos(
            termo,
            significado,
            descricao
        );

        if (erro != null)
        {
            return BadRequest(new
            {
                mensagem = erro
            });
        }

        var termoNormalizado = termo.ToUpperInvariant();

        var duplicado = await _context.GlossarioFiscais
            .AnyAsync(g =>
                g.GlossarioFiscalId != id &&
                g.Termo.ToUpper() == termoNormalizado
            );

        if (duplicado)
        {
            return Conflict(new
            {
                mensagem = "Já existe outro registro com esse termo."
            });
        }

        termoExistente.Termo = termo;
        termoExistente.Significado = significado;
        termoExistente.Descricao = descricao;
        termoExistente.DataAtualizacao = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is SqlException sql &&
                  (sql.Number == 2601 || sql.Number == 2627))
        {
            return Conflict(new
            {
                mensagem = "Já existe outro registro com esse termo."
            });
        }

        await RegistrarAuditoria(
            "GLOSSARIO_EDITADO",
            termoExistente
        );

        return Ok(new
        {
            mensagem = "Termo atualizado com sucesso.",
            termoExistente.GlossarioFiscalId,
            termoExistente.Termo,
            termoExistente.Significado,
            termoExistente.Descricao,
            termoExistente.Ativo,
            termoExistente.DataAtualizacao
        });
    }

    // =========================================
    // PATCH - ATIVAR OU DESATIVAR
    // =========================================

    /// <summary>
    /// Ativa ou desativa um termo do glossário.
    /// </summary>

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> AlterarStatus(
        Guid id,
        [FromBody] GlossarioStatusRequest dados)
    {
        if (!await PodeGerenciar())
        {
            return Forbid();
        }

        if (!dados.Ativo.HasValue)
        {
            return BadRequest(new
            {
                mensagem = "Informe o status do termo."
            });
        }

        var termo = await _context.GlossarioFiscais
            .FirstOrDefaultAsync(g =>
                g.GlossarioFiscalId == id
            );

        if (termo == null)
        {
            return NotFound(new
            {
                mensagem = "Termo não encontrado."
            });
        }

        if (termo.Ativo == dados.Ativo.Value)
        {
            return Ok(new
            {
                mensagem = "O termo já possui o status informado.",
                termo.GlossarioFiscalId,
                termo.Ativo
            });
        }

        termo.Ativo = dados.Ativo.Value;
        termo.DataAtualizacao = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await RegistrarAuditoria(
            termo.Ativo
                ? "GLOSSARIO_ATIVADO"
                : "GLOSSARIO_DESATIVADO",
            termo
        );

        return Ok(new
        {
            mensagem = termo.Ativo
                ? "Termo ativado com sucesso."
                : "Termo desativado com sucesso.",
            termo.GlossarioFiscalId,
            termo.Ativo,
            termo.DataAtualizacao
        });
    }

    // =========================================
    // VALIDAÇÃO DOS CAMPOS
    // =========================================

    private static string? ValidarCampos(
        string termo,
        string significado,
        string descricao)
    {
        if (string.IsNullOrWhiteSpace(termo))
        {
            return "Informe o termo fiscal.";
        }

        if (termo.Length > 100)
        {
            return "O termo deve possuir até 100 caracteres.";
        }

        if (string.IsNullOrWhiteSpace(significado))
        {
            return "Informe o significado do termo.";
        }

        if (significado.Length > 250)
        {
            return "O significado deve possuir até 250 caracteres.";
        }

        if (string.IsNullOrWhiteSpace(descricao))
        {
            return "Informe a descrição do termo.";
        }

        if (descricao.Length > 5000)
        {
            return "A descrição deve possuir até 5000 caracteres.";
        }

        return null;
    }
}

// =============================================
// DTOs
// =============================================

public class GlossarioRequest
{
    public string? Termo { get; set; }

    public string? Significado { get; set; }

    public string? Descricao { get; set; }
}

public class GlossarioStatusRequest
{
    public bool? Ativo { get; set; }
}