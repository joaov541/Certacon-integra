using System;

namespace ProjetoCertacon.Models;

public partial class FavoritoArtigo
{
    public Guid FavoritoArtigoId { get; set; }

    public Guid UsuarioId { get; set; }

    public Guid ArtigoId { get; set; }

    public DateTime DataCriacao { get; set; }

    public virtual Usuario Usuario { get; set; } = null!;

    public virtual Artigo Artigo { get; set; } = null!;
}