using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Data;
using ProjetoCertacon.Models;
using ProjetoCertacon.Services;
using System.Globalization;
using System.Security.Claims;
using System.Xml;
using System.Xml.Linq;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotasFiscaisController : ControllerBase
{
    private readonly IntegraCertaconContext _context;
    private readonly ArmazenamentoXmlService _armazenamento;
    private readonly ValidacaoNfeService _validacaoNfe;
    private readonly ILogger<NotasFiscaisController> _logger;
    private readonly PermissaoService _permissoes;
    private readonly ValidacaoCnpjService _cnpj;
    private readonly AuditoriaService _auditoria;

    public NotasFiscaisController(
        ILogger<NotasFiscaisController> logger,
        IntegraCertaconContext context,
        ArmazenamentoXmlService armazenamento,
        ValidacaoNfeService validacaoNfe,
        PermissaoService permissoes,
        ValidacaoCnpjService cnpj,
        AuditoriaService auditoria)

    {
        _logger = logger;
        _context = context;
        _armazenamento = armazenamento;
        _validacaoNfe = validacaoNfe;
        _permissoes = permissoes;
        _cnpj = cnpj;
        _auditoria = auditoria;
    }


    /// <summary>
    /// Lista todas as notas ficais
    /// </summary>
    /// <returns>retorna codigo 200</returns>
    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] DateTime? inicio = null, [FromQuery] DateTime? fim = null)
    {
        var (consulta, erro) = await ConsultarNotasPermitidas();
        if (erro != null) return erro;

        if (inicio.HasValue && fim.HasValue && inicio.Value.Date > fim.Value.Date)
            return BadRequest("Período inválido.");
        if (inicio.HasValue) consulta = consulta!.Where(n => n.DataEmissao >= inicio.Value.Date);
        if (fim.HasValue) consulta = consulta!.Where(n => n.DataEmissao.HasValue && n.DataEmissao.Value.Date <= fim.Value.Date);

        var notas = await consulta!.AsNoTracking()
     .OrderByDescending(n => n.DataEnvio)
     .Select(n => new
     {
         n.NotaFiscalId,
         n.Numero,
         n.Serie,
         n.ChaveAcesso,
         n.Cnpjemitente,
         n.Cnpjdestinatario,
         n.DataEmissao,
         n.ValorTotal,
         n.Status,
         n.DataEnvio,

         // Identifica se a nota ainda possui XML.
         PossuiXml = n.CaminhoArquivo != null
                     && n.CaminhoArquivo != "",

         // Nome do arquivo armazenado no servidor.
         NomeArquivo = n.CaminhoArquivo != null
             ? Path.GetFileName(n.CaminhoArquivo)
             : null
     })
     .ToListAsync();

        return Ok(notas);
    }


    /// <summary>
    /// LIsta um usuário específico através do seu id
    /// </summary>
    /// <returns>retorna codigo 200</returns>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Consultar(Guid id)
    {
        var (consulta, erro) = await ConsultarNotasPermitidas();
        if (erro != null) return erro;

        var nota = await consulta!.AsNoTracking()
            .Where(n => n.NotaFiscalId == id)
            .Select(n => new
            {
                n.NotaFiscalId,
                n.Numero,
                n.Serie,
                n.ChaveAcesso,
                n.Cnpjemitente,
                n.Cnpjdestinatario,
                n.DataEmissao,
                n.ValorTotal,
                n.Status,
                n.DataEnvio,
                Itens = n.ItemNotaFiscals.Select(i => new
                {
                    i.ItemNotaFiscalId,
                    i.NumeroItem,
                    i.CodigoProduto,
                    i.Descricao,
                    i.Ncm,
                    i.Cfop,
                    i.Quantidade,
                    i.ValorUnitario,
                    i.ValorTotal
                }).ToList()
            })
            .FirstOrDefaultAsync();

        if (nota == null)
            return NotFound("Nota fiscal não encontrada.");

        return Ok(nota);
    }

    /// <summary>
    /// Deleta uma nota fiscal
    /// </summary>
    /// <returns>retorna 204 no content</returns>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> ExcluirNota(Guid id)
    {
        var usuarioId = _permissoes.ObterUsuarioId(User);
        if (!usuarioId.HasValue) return Unauthorized();
        if (!await _permissoes.TemPermissaoAsync(User, "nota.arquivar"))
            return Forbid();
        var (consulta, erro) = await ConsultarNotasPermitidas();
        if (erro != null) return erro;
        var nota = await consulta!.FirstOrDefaultAsync(n => n.NotaFiscalId == id);

        if (nota == null)
            return NotFound("Nota fiscal não encontrada.");

        nota.Status = "ARQUIVADA";

        try
        {
            await _context.SaveChangesAsync();
            await RegistrarAuditoria(usuarioId.Value, "NOTA_FISCAL_ARQUIVADA", nota.NotaFiscalId);

            return Ok(new
            {
                mensagem = "Nota fiscal arquivada com sucesso.",
                nota.NotaFiscalId,
                nota.Status
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Erro ao arquivar a nota fiscal {NotaFiscalId}.", id);

            return StatusCode(500,
                "Não foi possível arquivar a nota fiscal.");
        }
    }

    /// <summary>
    /// Remove o arquivo XML associado à nota, preservando o registro fiscal.
    /// </summary>
    /// <returns>retorna 204, no content</returns>
    [HttpDelete("{id:guid}/xml")]
    public async Task<IActionResult> ExcluirXml(Guid id)
    {
        var usuarioId = _permissoes.ObterUsuarioId(User);
        if (!usuarioId.HasValue) return Unauthorized();
        if (!await _permissoes.TemPermissaoAsync(User, "nota.arquivar"))
            return Forbid();
        var (consulta, erro) = await ConsultarNotasPermitidas();
        if (erro != null) return erro;
        var nota = await consulta!.FirstOrDefaultAsync(n => n.NotaFiscalId == id);

        if (nota == null)
            return NotFound("Nota fiscal não encontrada.");

        if (string.IsNullOrWhiteSpace(nota.CaminhoArquivo))
            return NotFound("A nota não possui um XML associado.");

        var caminhoArquivo = nota.CaminhoArquivo;

        try
        {
            // Primeiro remove a referência ao arquivo no banco.
            nota.CaminhoArquivo = null;
            await _context.SaveChangesAsync();
            await RegistrarAuditoria(usuarioId.Value, "NOTA_FISCAL_XML_EXCLUIDO", nota.NotaFiscalId);

            // Depois tenta remover o arquivo físico.
            if (_armazenamento.CaminhoPermitido(caminhoArquivo) && System.IO.File.Exists(caminhoArquivo))
            {
                try
                {
                    System.IO.File.Delete(caminhoArquivo);
                }
                catch (IOException ex)
                {
                    _logger.LogError(ex,
                        "Não foi possível remover o XML da nota {NotaFiscalId}.",
                        id);
                }
                catch (UnauthorizedAccessException ex)
                {
                    _logger.LogError(ex,
                        "Sem permissão para remover o XML da nota {NotaFiscalId}.",
                        id);
                }
            }

            return Ok(new
            {
                mensagem = "Solicitação de exclusão do XML concluída.",
                nota.NotaFiscalId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Erro ao excluir o XML da nota fiscal {NotaFiscalId}.", id);

            return StatusCode(500,
                "Não foi possível atualizar os dados do XML.");
        }
    }

    private void ExcluirArquivo(string? caminho)
    {
        if (string.IsNullOrWhiteSpace(caminho))
            return;

        try
        {
            if (_armazenamento.CaminhoPermitido(caminho) && System.IO.File.Exists(caminho))
                System.IO.File.Delete(caminho);
        }
        catch (IOException ex)
        {
            _logger.LogError(ex,
                "Erro ao excluir o XML após falha na importação.");
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogError(ex,
                "Sem permissão para excluir o XML.");
        }
    }

    /// <summary>
    /// 	Envia um XML para processamento e importação
    /// </summary>
    /// <returns>retorna 201 created</returns>
    [HttpPost("upload")]
    [RequestSizeLimit(5_000_000)]
    public async Task<IActionResult> EnviarXml(
        IFormFile arquivo,
        CancellationToken cancellationToken)
    {
        var usuarioId = _permissoes.ObterUsuarioId(User);
        if (!usuarioId.HasValue) return Unauthorized();
        var idUsuario = usuarioId.Value;
        if (!await _permissoes.TemPermissaoAsync(User, "nota.importar"))
            return Forbid();
        bool acessoTodas = await _permissoes.TemPermissaoAsync(User, "nota.ler.todas");
        if (!acessoTodas && !await _permissoes.TemPermissaoAsync(User, "nota.ler.proprias"))
            return Forbid();

        if (arquivo == null || arquivo.Length == 0)
            return BadRequest("Selecione um arquivo XML.");

        if (arquivo.Length > 5_000_000)
            return BadRequest("O arquivo deve ter no máximo 5 MB.");

        if (!Path.GetExtension(arquivo.FileName)
            .Equals(".xml", StringComparison.OrdinalIgnoreCase))
            return BadRequest("Envie um arquivo com extensão .xml.");

        XDocument documento;

        try
        {
            var configuracao = new XmlReaderSettings
            {
                DtdProcessing = DtdProcessing.Prohibit,
                XmlResolver = null,
                MaxCharactersInDocument = 5_000_000
            };

            await using var stream = arquivo.OpenReadStream();
            using var leitor = XmlReader.Create(stream, configuracao);

            documento = XDocument.Load(leitor);
        }
        catch (XmlException)
        {
            return BadRequest("O XML está malformado ou contém DTD.");
        }
        catch (InvalidOperationException)
        {
            return BadRequest("Não foi possível ler o XML.");
        }

        XNamespace ns = "http://www.portalfiscal.inf.br/nfe";

        var raiz = documento.Root;

        if (raiz == null)
            return BadRequest("XML vazio ou inválido.");

        var nfe = raiz.Name == ns + "NFe"
            ? raiz
            : raiz.Element(ns + "NFe");

        if (nfe == null || nfe.Element(ns + "infNFe") == null)
            return BadRequest("O arquivo não contém uma NF-e válida.");

        var infNFe = nfe.Element(ns + "infNFe")!;
        var ide = infNFe.Element(ns + "ide");
        var emit = infNFe.Element(ns + "emit");
        var dest = infNFe.Element(ns + "dest");
        var total = infNFe.Element(ns + "total")?
            .Element(ns + "ICMSTot");

        if (ide == null || emit == null || total == null)
            return BadRequest("O XML não possui os dados obrigatórios da nota.");

        var modelo = ide.Element(ns + "mod")?.Value;

        if (modelo != "55" && modelo != "65")
            return BadRequest("O modelo deve ser NF-e (55) ou NFC-e (65).");

        var chave = ((string?)infNFe.Attribute("Id"))?
    .Replace("NFe", "", StringComparison.OrdinalIgnoreCase)
    .Trim()
    .ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(chave) ||
            !_validacaoNfe.ChaveValida(chave))
        {
            return BadRequest("A chave de acesso da NF-e é inválida.");
        }

        var chaveProtocolo = raiz
      .Descendants(ns + "infProt")
      .Elements(ns + "chNFe")
      .FirstOrDefault()?.Value?
      .Trim()
      .ToUpperInvariant();

        if (chaveProtocolo != null && chaveProtocolo != chave)
            return BadRequest("A chave do protocolo é diferente da chave da NF-e.");

        var cnpjEmitente = _cnpj.Normalizar(emit.Element(ns + "CNPJ")?.Value);
        var cnpjDestinatario = _cnpj.Normalizar(dest?.Element(ns + "CNPJ")?.Value);

        if (!_cnpj.Valido(cnpjEmitente) || !_cnpj.Valido(cnpjDestinatario))
            return BadRequest("Informe CNPJs válidos do emitente e destinatário. CPF não faz parte deste fluxo empresarial.");

        if (chave.Substring(6, 14) != cnpjEmitente)
            return BadRequest("O CNPJ do emitente não corresponde à chave de acesso.");

        if (!acessoTodas)
        {
            var cnpjUsuario = await ObterCnpjUsuario(idUsuario);
            if (!_cnpj.Valido(cnpjUsuario) || cnpjUsuario != cnpjDestinatario)
                return Forbid();
        }

        // O vínculo é com a empresa destinatária, nunca com o colaborador que enviou.
        var clienteId = await _context.UsuarioPerfils.AsNoTracking()
            .Where(up => up.Perfil.Ativo && up.Perfil.Nome == "Cliente" &&
                up.Usuario.Ativo && up.Usuario.Cnpj == cnpjDestinatario)
            .OrderBy(up => up.UsuarioId)
            .Select(up => (Guid?)up.UsuarioId)
            .FirstOrDefaultAsync(cancellationToken);
        if (!clienteId.HasValue)
            return BadRequest("Não existe cliente ativo cadastrado para o CNPJ destinatário.");

        var numero = ide.Element(ns + "nNF")?.Value;
        var serie = ide.Element(ns + "serie")?.Value;
        var dataTexto = ide.Element(ns + "dhEmi")?.Value
            ?? ide.Element(ns + "dEmi")?.Value;
        var valorTexto = total.Element(ns + "vNF")?.Value;

        // Confere os campos da chave de acesso.
        var modeloChave = chave.Substring(20, 2);
        var serieChave = chave.Substring(22, 3);
        var numeroChave = chave.Substring(25, 9);
        var dataChave = chave.Substring(2, 4);

        if (modelo != modeloChave)
            return BadRequest("O modelo não corresponde à chave de acesso.");

        if (!int.TryParse(serie, out var serieXml) ||
            !int.TryParse(serieChave, out var serieChaveXml) ||
            serieXml != serieChaveXml)
        {
            return BadRequest("A série não corresponde à chave de acesso.");
        }

        if (!long.TryParse(numero, out var numeroXml) ||
            !long.TryParse(numeroChave, out var numeroChaveXml) ||
            numeroXml != numeroChaveXml)
        {
            return BadRequest("O número da nota não corresponde à chave de acesso.");
        }

        if (string.IsNullOrWhiteSpace(numero) ||
            !DateTime.TryParse(dataTexto, out var dataEmissao) ||
            !decimal.TryParse(
                valorTexto,
                NumberStyles.Any,
                CultureInfo.InvariantCulture,
                out var valorTotal) ||
            valorTotal < 0)
        {
            return BadRequest("Número, data ou valor total da nota inválido.");
        }

        if (dataEmissao.ToString("yyMM") != dataChave)
            return BadRequest("A data de emissão não corresponde à chave de acesso.");

        // A duplicidade é verificada depois das validações da chave.
        if (await _context.NotaFiscals.AnyAsync(
            n => n.ChaveAcesso == chave, cancellationToken))
        {
            return Conflict("Essa nota fiscal já foi importada.");
        }

        var itensXml = infNFe.Elements(ns + "det").ToList();

        if (itensXml.Count == 0)
            return BadRequest("A nota fiscal precisa ter pelo menos um item.");

        var itens = new List<ItemNotaFiscal>();

        foreach (var det in itensXml)
        {
            var prod = det.Element(ns + "prod");

            if (prod == null)
                return BadRequest("Um item da nota não possui dados do produto.");

            var descricao = prod.Element(ns + "xProd")?.Value;
            var quantidadeTexto = prod.Element(ns + "qCom")?.Value;
            var unitarioTexto = prod.Element(ns + "vUnCom")?.Value;
            var totalItemTexto = prod.Element(ns + "vProd")?.Value;

            if (string.IsNullOrWhiteSpace(descricao) ||
                !decimal.TryParse(quantidadeTexto, NumberStyles.Any,
                    CultureInfo.InvariantCulture, out var quantidade) ||
                !decimal.TryParse(unitarioTexto, NumberStyles.Any,
                    CultureInfo.InvariantCulture, out var unitario) ||
                !decimal.TryParse(totalItemTexto, NumberStyles.Any,
                    CultureInfo.InvariantCulture, out var totalItem) ||
                quantidade <= 0 || unitario < 0 || totalItem < 0)
            {
                return BadRequest("Um dos itens possui valores inválidos.");
            }

            itens.Add(new ItemNotaFiscal
            {
                NumeroItem = int.TryParse(
                    (string?)det.Attribute("nItem"), out var numeroItem)
                    ? numeroItem : itens.Count + 1,
                CodigoProduto = prod.Element(ns + "cProd")?.Value,
                Descricao = descricao,
                Ncm = prod.Element(ns + "NCM")?.Value,
                Cfop = prod.Element(ns + "CFOP")?.Value,
                Quantidade = quantidade,
                ValorUnitario = unitario,
                ValorTotal = Math.Round(totalItem, 2)
            });
        }

        string? caminhoArquivo = null;

        await using var transacao =
            await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            caminhoArquivo = await _armazenamento.SalvarAsync(
                arquivo, cancellationToken);

            var nota = new NotaFiscal
            {
                NotaFiscalId = Guid.NewGuid(),
                UsuarioId = clienteId.Value,
                Numero = numero!,
                Serie = serie,
                ChaveAcesso = chave,
                Cnpjemitente = cnpjEmitente,
                Cnpjdestinatario = cnpjDestinatario,
                DataEmissao = dataEmissao,
                ValorTotal = Math.Round(valorTotal, 2),
                Status = "IMPORTADA",
                CaminhoArquivo = caminhoArquivo,
                DataEnvio = DateTime.Now,
                ItemNotaFiscals = itens
            };

            _context.NotaFiscals.Add(nota);
            await _context.SaveChangesAsync(cancellationToken);
            await RegistrarAuditoria(idUsuario, "NOTA_FISCAL_IMPORTADA", nota.NotaFiscalId);
            await transacao.CommitAsync(cancellationToken);

            return CreatedAtAction(
                nameof(Consultar),
                new { id = nota.NotaFiscalId },
                new
                {
                    mensagem = "Nota fiscal importada com sucesso.",
                    nota.NotaFiscalId,
                    nota.Numero,
                    nota.ChaveAcesso,
                    nota.ValorTotal,
                    QuantidadeItens = itens.Count,
                    nota.Status
                });
        }

        catch (DbUpdateException ex)
        {
            await transacao.RollbackAsync(cancellationToken);

            if (caminhoArquivo != null && _armazenamento.CaminhoPermitido(caminhoArquivo) && System.IO.File.Exists(caminhoArquivo))
                ExcluirArquivo(caminhoArquivo);

            var erroDetalhado = ex.GetBaseException().Message;

            _logger.LogError(ex,
                "Erro ao gravar nota fiscal no banco: {Erro}",
                erroDetalhado);

            return Conflict(new
            {
                mensagem = "Erro ao gravar a nota fiscal.",
                detalhe = "Verifique os dados ou se a chave já foi importada."
            });
        }

        catch (Exception ex)
        {
            try
            {
                await transacao.RollbackAsync(CancellationToken.None);
            }
            catch (Exception erroRollback)
            {
                _logger.LogError(erroRollback,
                    "Erro ao desfazer a transação da nota fiscal.");
            }

            ExcluirArquivo(caminhoArquivo);

            _logger.LogError(ex,
                "Erro inesperado durante a importação da nota fiscal.");

            throw;
        }
    }

    private async Task<string> ObterCnpjUsuario(Guid id)
    {
        var cnpj = await _context.Usuarios.AsNoTracking()
            .Where(u => u.UsuarioId == id && u.Ativo)
            .Select(u => u.Cnpj).FirstOrDefaultAsync();
        return _cnpj.Normalizar(cnpj);
    }

    private async Task<(IQueryable<NotaFiscal>? Consulta, IActionResult? Erro)> ConsultarNotasPermitidas()
    {
        var id = _permissoes.ObterUsuarioId(User);
        if (!id.HasValue) return (null, Unauthorized());
        if (await _permissoes.TemPermissaoAsync(User, "nota.ler.todas"))
            return (_context.NotaFiscals, null);
        if (!await _permissoes.TemPermissaoAsync(User, "nota.ler.proprias"))
            return (null, Forbid());
        var cnpj = await ObterCnpjUsuario(id.Value);
        if (!_cnpj.Valido(cnpj)) return (null, Forbid());
        return (_context.NotaFiscals.Where(n => n.Cnpjdestinatario == cnpj), null);
    }

    private async Task RegistrarAuditoria(Guid usuarioId, string acao, Guid notaId)
    {
        await _auditoria.RegistrarAsync(usuarioId, acao, "NOTA_FISCAL", notaId,
            HttpContext.Connection.RemoteIpAddress?.ToString(), acao);
    }
}
