using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Data;
using ProjetoCertacon.Models;
using System.Security.Claims;

namespace ProjetoCertacon.Services;

public class PermissaoService
{
    private readonly IntegraCertaconContext _context;

    public PermissaoService(
        IntegraCertaconContext context)
    {
        _context = context;
    }

    // =========================================
    // IDENTIFICAR USUÁRIO PELO TOKEN
    // =========================================

    public Guid? ObterUsuarioId(ClaimsPrincipal usuario)
    {
        if (usuario.Identity?.IsAuthenticated != true)
            return null;

        var identificador =
            usuario.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? usuario.FindFirstValue("sub");

        if (Guid.TryParse(identificador, out var usuarioId))
            return usuarioId;

        return null;
    }

    // =========================================
    // CONSULTA BASE DE PERMISSÕES
    // =========================================

    private IQueryable<PerfilPermissao> ConsultarPermissoes(
        Guid usuarioId)
    {
        return _context.PerfilPermissoes
            .AsNoTracking()
            .Where(pp =>
                pp.Perfil.Ativo &&
                pp.Permissao.Ativo &&

                (pp.TemaId == null ||
                    (pp.Tema != null && pp.Tema.Ativo)) &&

                pp.Perfil.UsuarioPerfils.Any(up =>
                    up.UsuarioId == usuarioId &&
                    up.Usuario.Ativo
                )
            );
    }

    // =========================================
    // VERIFICAR PERMISSÃO PELO ID DO USUÁRIO
    // =========================================

    public async Task<bool> TemPermissaoAsync(
        Guid usuarioId,
        string codigoPermissao,
        Guid? temaId = null)
    {
        if (usuarioId == Guid.Empty ||
            string.IsNullOrWhiteSpace(codigoPermissao))
        {
            return false;
        }

        return await ConsultarPermissoes(usuarioId)
            .AnyAsync(pp =>

                pp.Permissao.Codigo == codigoPermissao &&

                (
                    pp.TemaId == null ||

                    (
                        temaId.HasValue &&
                        pp.TemaId == temaId
                    )
                )
            );
    }

    // =========================================
    // VERIFICAR PERMISSÃO PELO TOKEN
    // =========================================

    public async Task<bool> TemPermissaoAsync(
        ClaimsPrincipal usuario,
        string codigoPermissao,
        Guid? temaId = null)
    {
        var usuarioId = ObterUsuarioId(usuario);

        if (!usuarioId.HasValue)
            return false;

        return await TemPermissaoAsync(
            usuarioId.Value,
            codigoPermissao,
            temaId
        );
    }

    // =========================================
    // LISTAR TODAS AS PERMISSÕES DO USUÁRIO
    // =========================================

    public async Task<List<PermissaoUsuarioDto>>
        ListarPermissoesAsync(Guid usuarioId)
    {
        return await ConsultarPermissoes(usuarioId)

            .Select(pp => new PermissaoUsuarioDto
            {
                Codigo = pp.Permissao.Codigo,
                Nome = pp.Permissao.Nome,
                TemaId = pp.TemaId,
                Tema = pp.Tema != null
                    ? pp.Tema.Nome
                    : null
            })

            .Distinct()
            .OrderBy(p => p.Codigo)
            .ThenBy(p => p.Tema)
            .ToListAsync();
    }
}

// =========================================
// DTO DE RETORNO DAS PERMISSÕES
// =========================================

public class PermissaoUsuarioDto
{
    public string Codigo { get; set; } = "";

    public string Nome { get; set; } = "";

    public Guid? TemaId { get; set; }

    public string? Tema { get; set; }
}