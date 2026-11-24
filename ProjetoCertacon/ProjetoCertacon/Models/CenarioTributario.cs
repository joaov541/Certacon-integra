using System;

namespace ProjetoCertacon.Models;

public partial class CenarioTributario
{
    public Guid CenarioTributarioId { get; set; }

    public Guid AutorUsuarioId { get; set; }

    public string Nome { get; set; } = null!;

    public string? Descricao { get; set; }

    public int AnoReferencia { get; set; }

    public decimal AliquotaIBSEstadual { get; set; }

    public decimal AliquotaIBSMunicipal { get; set; }

    public decimal AliquotaCBS { get; set; }

    public bool Ativo { get; set; } = true;

    public DateTime DataCriacao { get; set; }

    public DateTime? DataAtualizacao { get; set; }

    public virtual Usuario AutorUsuario { get; set; } = null!;
}