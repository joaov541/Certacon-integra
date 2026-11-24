using System;

namespace ProjetoCertacon.Models;

public partial class ObrigacaoFiscal
{
    public Guid ObrigacaoFiscalId { get; set; }

    public Guid AutorUsuarioId { get; set; }

    public Guid TemaId { get; set; }

    public string Titulo { get; set; } = null!;

    public string Descricao { get; set; } = null!;

    public DateOnly DataVencimento { get; set; }

    public DateOnly? Competencia { get; set; }

    public bool Ativo { get; set; } = true;

    public DateTime DataCriacao { get; set; }

    public DateTime? DataAtualizacao { get; set; }

    public virtual Usuario AutorUsuario { get; set; } = null!;

    public virtual Tema Tema { get; set; } = null!;
}