using System;
using System.Collections.Generic;

namespace ProjetoCertacon.Models;

public partial class Tema
{
    public Guid TemaId { get; set; }

    public string Nome { get; set; } = null!;

    public string? Descricao { get; set; }

    public bool Ativo { get; set; }

    public DateTime DataCriacao { get; set; }

    public DateTime? DataAtualizacao { get; set; }

    public virtual ICollection<Artigo> Artigos { get; set; } = new List<Artigo>();
}
