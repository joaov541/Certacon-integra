using System;

namespace ProjetoCertacon.Models;

public partial class PerfilPermissao
{
    public Guid PerfilPermissaoId { get; set; }

    public Guid PerfilId { get; set; }

    public Guid PermissaoId { get; set; }

    public Guid? TemaId { get; set; }

    public DateTime DataAtribuicao { get; set; }

    public virtual Perfil Perfil { get; set; } = null!;

    public virtual Permissao Permissao { get; set; } = null!;

    public virtual Tema? Tema { get; set; }
}