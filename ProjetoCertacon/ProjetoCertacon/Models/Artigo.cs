using System;
using System.Collections.Generic;

namespace ProjetoCertacon.Models;

public partial class Artigo
{
    public Guid ArtigoId { get; set; }

    public Guid TemaId { get; set; }

    public Guid AutorUsuarioId { get; set; }

    public string Titulo { get; set; } = null!;

    public string? Resumo { get; set; }

    public string Conteudo { get; set; } = null!;

    public string Visibilidade { get; set; } = null!;

    public string Status { get; set; } = null!;

    public DateTime DataCriacao { get; set; }

    public DateTime? DataAtualizacao { get; set; }

    public DateTime? DataPublicacao { get; set; }

    public virtual Usuario AutorUsuario { get; set; } = null!;

    public virtual ICollection<RevisaoArtigo> RevisaoArtigos { get; set; } = new List<RevisaoArtigo>();

    public virtual Tema Tema { get; set; } = null!;

    public virtual ResumoInteligente? ResumoInteligente { get; set; }

    public string? NomeArquivo { get; set; }

    public string? CaminhoArquivo { get; set; }

    public string? TipoConteudo { get; set; }

    public bool AutorizadoIA { get; set; }

    public string? HashAutorizacaoIA { get; set; }

    public Guid? AutorizadorIAId { get; set; }

    public DateTime? DataAutorizacaoIA { get; set; }

    public DateTime? DataRevogacaoIA { get; set; }

    public virtual Usuario? AutorizadorIA { get; set; }

    public long? TamanhoArquivo { get; set; }
    public virtual ICollection<FavoritoArtigo> FavoritoArtigos { get; set; }
    = new List<FavoritoArtigo>();

    public virtual ICollection<HistoricoLeitura> HistoricoLeituras { get; set; }
        = new List<HistoricoLeitura>();
}
