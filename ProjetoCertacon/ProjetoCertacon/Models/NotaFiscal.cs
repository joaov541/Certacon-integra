using System;
using System.Collections.Generic;

namespace ProjetoCertacon.Models;

public partial class NotaFiscal
{
    public Guid NotaFiscalId { get; set; }

    public Guid UsuarioId { get; set; }

    public string Numero { get; set; } = null!;

    public string? Serie { get; set; }

    public string? ChaveAcesso { get; set; }

    public string? Cnpjemitente { get; set; }

    public string? Cnpjdestinatario { get; set; }

    public DateTime? DataEmissao { get; set; }

    public decimal ValorTotal { get; set; }

    public string Status { get; set; } = null!;

    public string? CaminhoArquivo { get; set; }

    public DateTime DataEnvio { get; set; }

    public virtual ICollection<ItemNotaFiscal> ItemNotaFiscals { get; set; } = new List<ItemNotaFiscal>();

    public virtual Usuario Usuario { get; set; } = null!;
}
