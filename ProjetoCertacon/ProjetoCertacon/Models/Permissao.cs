using System;
using System.Collections.Generic;

namespace ProjetoCertacon.Models;

public partial class Permissao
{
    public Guid PermissaoId { get; set; }

    public string Codigo { get; set; } = null!;

    public string Nome { get; set; } = null!;

    public string? Descricao { get; set; }

    public bool Ativo { get; set; } = true;

    public DateTime DataCriacao { get; set; }

    public virtual ICollection<PerfilPermissao> PerfilPermissoes
    { get; set; } = new List<PerfilPermissao>();
}