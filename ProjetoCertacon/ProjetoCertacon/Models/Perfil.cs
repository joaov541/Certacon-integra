using System;
using System.Collections.Generic;

namespace ProjetoCertacon.Models;

public partial class Perfil
{
    public Guid PerfilId { get; set; }

    public string Nome { get; set; } = null!;

    public string? Descricao { get; set; }

    public bool Ativo { get; set; }

    public DateTime DataCriacao { get; set; }

    public virtual ICollection<UsuarioPerfil> UsuarioPerfils { get; set; } = new List<UsuarioPerfil>();
}
