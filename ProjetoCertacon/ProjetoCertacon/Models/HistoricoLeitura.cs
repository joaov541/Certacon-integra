using System;

namespace ProjetoCertacon.Models;

public partial class HistoricoLeitura
{
    public Guid HistoricoLeituraId { get; set; }

    public Guid UsuarioId { get; set; }

    public Guid ArtigoId { get; set; }

    public DateTime DataPrimeiroAcesso { get; set; }

    public DateTime DataUltimoAcesso { get; set; }

    public int QuantidadeAcessos { get; set; } = 1;

    public virtual Usuario Usuario { get; set; } = null!;

    public virtual Artigo Artigo { get; set; } = null!;
}