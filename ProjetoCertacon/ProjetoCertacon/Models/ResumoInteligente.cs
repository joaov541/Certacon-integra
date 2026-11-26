using System;

namespace ProjetoCertacon.Models;

public partial class ResumoInteligente
{
    public Guid ResumoInteligenteId { get; set; }

    public Guid ArtigoId { get; set; }

    public string Resumo { get; set; } = null!;

    public string HashConteudo { get; set; } = null!;

    public string Provedor { get; set; } = null!;

    public string Modelo { get; set; } = null!;

    public string VersaoPrompt { get; set; } = null!;

    public DateTime DataGeracao { get; set; }

    public virtual Artigo Artigo { get; set; } = null!;
}