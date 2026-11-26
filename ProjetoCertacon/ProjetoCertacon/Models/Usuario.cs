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

    public virtual ICollection<GlossarioFiscal> GlossarioFiscais { get; set; }
    = new List<GlossarioFiscal>();


    public virtual ICollection<FavoritoArtigo> FavoritoArtigos { get; set; }
    = new List<FavoritoArtigo>();

    public virtual ICollection<HistoricoLeitura> HistoricoLeituras { get; set; }
        = new List<HistoricoLeitura>();


    public virtual ICollection<ObrigacaoFiscal> ObrigacaoFiscais { get; set; }
    = new List<ObrigacaoFiscal>();

    public virtual ICollection<CenarioTributario> CenarioTributarios { get; set; }
    = new List<CenarioTributario>();

    public virtual ICollection<UsoInteligenciaArtificial> UsoInteligenciaArtificiais { get; set; }
    = new List<UsoInteligenciaArtificial>();

    public virtual ICollection<Artigo> ArtigosAutorizadosIA { get; set; }
    = new List<Artigo>();
}
