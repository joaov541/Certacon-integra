using System;
using System.Collections.Generic;

namespace ProjetoCertacon.Models;

public partial class RecuperacaoSenha
{
    public Guid RecuperacaoSenhaId { get; set; }

    public Guid UsuarioId { get; set; }

    public string TokenHash { get; set; } = null!;

    public DateTime DataCriacao { get; set; }

    public DateTime DataExpiracao { get; set; }

    public DateTime? DataUtilizacao { get; set; }

    public bool Revogado { get; set; }

    public virtual Usuario Usuario { get; set; } = null!;
}