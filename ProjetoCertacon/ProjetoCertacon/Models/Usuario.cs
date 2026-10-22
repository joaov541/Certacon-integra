using System;
using System.Collections.Generic;

namespace ProjetoCertacon.Models;

public partial class Usuario
{
    public Guid UsuarioId { get; set; }

    public string Nome { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string SenhaHash { get; set; } = null!;

    public bool Ativo { get; set; }

    public string? RazaoSocial { get; set; }

    public string? Cnpj { get; set; }

    public string? TelefoneContato { get; set; }

    public DateTime DataCriacao { get; set; }

    public virtual ICollection<Artigo> Artigos { get; set; } = new List<Artigo>();

    public virtual ICollection<LogAuditorium> LogAuditoria { get; set; } = new List<LogAuditorium>();

    public virtual ICollection<NotaFiscal> NotaFiscals { get; set; } = new List<NotaFiscal>();

    public virtual ICollection<RevisaoArtigo> RevisaoArtigos { get; set; } = new List<RevisaoArtigo>();

    public virtual ICollection<UsuarioPerfil> UsuarioPerfils { get; set; } = new List<UsuarioPerfil>();
}
