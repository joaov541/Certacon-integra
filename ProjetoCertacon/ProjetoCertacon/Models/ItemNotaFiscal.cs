using System;
using System.Collections.Generic;

namespace ProjetoCertacon.Models;

public partial class ItemNotaFiscal
{
    public Guid ItemNotaFiscalId { get; set; }

    public Guid NotaFiscalId { get; set; }

    public int NumeroItem { get; set; }

    public string? CodigoProduto { get; set; }

    public string Descricao { get; set; } = null!;

    public string? Ncm { get; set; }

    public string? Cfop { get; set; }

    public decimal Quantidade { get; set; }

    public decimal ValorUnitario { get; set; }

    public decimal ValorTotal { get; set; }

    public virtual NotaFiscal NotaFiscal { get; set; } = null!;
}
