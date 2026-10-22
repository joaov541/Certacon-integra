using System;
using System.Collections.Generic;

namespace ProjetoCertacon.Models;

public partial class LogAuditorium
{
    public Guid LogAuditoriaId { get; set; }

    public Guid? UsuarioId { get; set; }

    public string Acao { get; set; } = null!;

    public string? TabelaAfetada { get; set; }

    public Guid? RegistroId { get; set; }

    public string? EnderecoIp { get; set; }

    public string? Detalhes { get; set; }

    public DateTime DataHora { get; set; }

    public virtual Usuario? Usuario { get; set; }
}
