using System;
using System.Collections.Generic;

namespace ProjetoCertacon.Models;

public partial class UsuarioPerfil
{
    public Guid UsuarioPerfilId { get; set; }

    public Guid UsuarioId { get; set; }

    public Guid PerfilId { get; set; }

    public DateTime DataAtribuicao { get; set; }

    public virtual Perfil Perfil { get; set; } = null!;

    public virtual Usuario Usuario { get; set; } = null!;
}
