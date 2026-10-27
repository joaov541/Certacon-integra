
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

    public NotasFiscaisController(
        IntegraCertaconContext context,
        ArmazenamentoXmlService armazenamento,
        ValidacaoNfeService validacaoNfe)
    {
        _context = context;
        _armazenamento = armazenamento;
        _validacaoNfe = validacaoNfe;
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var usuarioId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(usuarioId, out var id))
            return Unauthorized();

        var notas = await _context.NotaFiscals
            .Where(n => n.UsuarioId == id)
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
                n.DataEnvio
            })
            .ToListAsync();

        return Ok(notas);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Consultar(Guid id)
    {
        var usuarioId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(usuarioId, out var idUsuario))
            return Unauthorized();

        var nota = await _context.NotaFiscals
            .Where(n => n.NotaFiscalId == id &&
                        n.UsuarioId == idUsuario)
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

    [HttpPost("upload")]
    [RequestSizeLimit(5_000_000)]
    public async Task<IActionResult> EnviarXml(
        IFormFile arquivo,
        CancellationToken cancellationToken)
    {
        var usuarioId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(usuarioId, out var idUsuario))
            return Unauthorized();

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
            .Replace("NFe", "");

        if (string.IsNullOrWhiteSpace(chave) ||
            !_validacaoNfe.ChaveValida(chave))
        {
            return BadRequest("A chave de acesso da NF-e é inválida.");
        }

        var chaveProtocolo = raiz
            .Descendants(ns + "infProt")
            .Elements(ns + "chNFe")
            .FirstOrDefault()?.Value;

        if (chaveProtocolo != null && chaveProtocolo != chave)
            return BadRequest("A chave do protocolo é diferente da chave da NF-e.");

        var cnpjEmitente = emit.Element(ns + "CNPJ")?.Value
            ?? emit.Element(ns + "CPF")?.Value;

        var cnpjDestinatario = dest?.Element(ns + "CNPJ")?.Value
            ?? dest?.Element(ns + "CPF")?.Value;

        if (string.IsNullOrWhiteSpace(cnpjEmitente))
            return BadRequest("O XML não possui CNPJ ou CPF do emitente.");

        if (cnpjEmitente.Length != 14)
            return BadRequest("O documento do emitente deve ter 14 caracteres para esta estrutura.");

        if (chave.Substring(6, 14) != cnpjEmitente)
            return BadRequest("O documento do emitente não corresponde à chave de acesso.");

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
                UsuarioId = idUsuario,
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
        catch (DbUpdateException)
        {
            await transacao.RollbackAsync(cancellationToken);

            if (caminhoArquivo != null && System.IO.File.Exists(caminhoArquivo))
                System.IO.File.Delete(caminhoArquivo);

            return Conflict("Não foi possível gravar a nota. Verifique se a chave já foi importada.");
        }
        catch
        {
            await transacao.RollbackAsync(cancellationToken);

            if (caminhoArquivo != null && System.IO.File.Exists(caminhoArquivo))
                System.IO.File.Delete(caminhoArquivo);

            throw;
        }
    }
}
