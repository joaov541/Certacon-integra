using System;
using System.Collections.Generic;

namespace ProjetoCertacon.Models;

public partial class Artigo
{
    public Guid ArtigoId { get; set; }

    public Guid TemaId { get; set; }

    public Guid AutorUsuarioId { get; set; }

    public string Titulo { get; set; } = null!;

    public string? Resumo { get; set; }

    public string Conteudo { get; set; } = null!;

    public string Visibilidade { get; set; } = null!;

    public string Status { get; set; } = null!;

    public DateTime DataCriacao { get; set; }

    public DateTime? DataAtualizacao { get; set; }

    public DateTime? DataPublicacao { get; set; }

    public virtual Usuario AutorUsuario { get; set; } = null!;

    public virtual ICollection<RevisaoArtigo> RevisaoArtigos { get; set; } = new List<RevisaoArtigo>();

    public virtual Tema Tema { get; set; } = null!;
}
