using System;

namespace ProjetoCertacon.Models;

public partial class GlossarioFiscal
{
    public Guid GlossarioFiscalId { get; set; }

    public Guid AutorUsuarioId { get; set; }

    public string Termo { get; set; } = null!;

    public string Significado { get; set; } = null!;

    public string Descricao { get; set; } = null!;

    public bool Ativo { get; set; } = true;

    public DateTime DataCriacao { get; set; }

    public DateTime? DataAtualizacao { get; set; }

    public virtual Usuario AutorUsuario { get; set; } = null!;
}