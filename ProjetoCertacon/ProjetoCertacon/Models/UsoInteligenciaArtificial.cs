using System;

namespace ProjetoCertacon.Models;

public partial class UsoInteligenciaArtificial
{
    public Guid UsoInteligenciaArtificialId { get; set; }

    public Guid UsuarioId { get; set; }

    public DateOnly DataReferencia { get; set; }

    public int QuantidadeResumos { get; set; }

    public int QuantidadePerguntas { get; set; }

    public DateTime DataUltimaConsulta { get; set; }

    public virtual Usuario Usuario { get; set; } = null!;
}