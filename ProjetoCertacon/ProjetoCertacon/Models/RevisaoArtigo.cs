using System;
using System.Collections.Generic;

namespace ProjetoCertacon.Models;

public partial class RevisaoArtigo
{
    public Guid RevisaoArtigoId { get; set; }

    public Guid ArtigoId { get; set; }

    public Guid UsuarioId { get; set; }

    public string Status { get; set; } = null!;

    public string? Comentario { get; set; }

    public string? StatusAnterior { get; set; }

    public string StatusNovo { get; set; } = null!;

    public DateTime DataRevisao { get; set; }

    public virtual Artigo Artigo { get; set; } = null!;

    public virtual Usuario Usuario { get; set; } = null!;
}
