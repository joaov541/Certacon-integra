
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Data;
using ProjetoCertacon.Models;
using ProjetoCertacon.Services;
using System;
using System.Linq;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace ProjetoCertacon.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
public class CadastroClientesController : ControllerBase
{
    private readonly IntegraCertaconContext _context;
    private readonly IPasswordHasher<Usuario> _passwordHasher;
    private readonly AuditoriaService _auditoria;

    public CadastroClientesController(
        IntegraCertaconContext context,
        IPasswordHasher<Usuario> passwordHasher,
        AuditoriaService auditoria)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _auditoria = auditoria;
    }

    // NORMALIZA O CNPJ
    private static string NormalizarCnpj(string cnpj)
    {
        return Regex.Replace(cnpj, @"[^a-zA-Z0-9]", "")
            .ToUpperInvariant();
    }

    // CALCULA O DÍGITO VERIFICADOR
    private static int CalcularDigitoCnpj(
        string cnpj,
        int[] pesos)
    {
        int soma = 0;

        for (int i = 0; i < pesos.Length; i++)
        {
            int valor = cnpj[i] - 48;
            soma += valor * pesos[i];
        }

        int resto = soma % 11;

        return resto < 2 ? 0 : 11 - resto;
    }

    // VALIDA CNPJ NUMÉRICO OU ALFANUMÉRICO
    private static bool CnpjValido(string cnpj)
    {
        if (!Regex.IsMatch(cnpj, @"^[A-Z0-9]{12}[0-9]{2}$"))
            return false;

        if (cnpj.Distinct().Count() == 1)
            return false;

        int[] pesosPrimeiroDigito =
        {
            5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2
        };

        int primeiroDigito = CalcularDigitoCnpj(
            cnpj.Substring(0, 12),
            pesosPrimeiroDigito);

        string baseSegundoDigito =
            cnpj.Substring(0, 12) + primeiroDigito;

        int[] pesosSegundoDigito =
        {
            6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2
        };

        int segundoDigito = CalcularDigitoCnpj(
            baseSegundoDigito,
            pesosSegundoDigito);

        string digitosCalculados =
            $"{primeiroDigito}{segundoDigito}";

        return cnpj.Substring(12, 2) == digitosCalculados;
    }

    // CADASTRA UM NOVO CLIENTE
    [HttpPost]
    public async Task<IActionResult> Cadastrar(
        [FromBody] UsuarioRequest dados)
    {
        if (string.IsNullOrWhiteSpace(dados.Nome) ||
            string.IsNullOrWhiteSpace(dados.Email) ||
            string.IsNullOrWhiteSpace(dados.Senha) ||
            string.IsNullOrWhiteSpace(dados.RazaoSocial) ||
            string.IsNullOrWhiteSpace(dados.Cnpj))
        {
            return BadRequest(
                "Preencha todos os campos obrigatórios.");
        }

        // NORMALIZA E-MAIL
        var email = dados.Email.Trim().ToLowerInvariant();

        // VERIFICA E-MAIL DUPLICADO
        if (await _context.Usuarios.AnyAsync(
            u => u.Email == email))
        {
            return BadRequest(
                "Este e-mail já está cadastrado.");
        }

        // NORMALIZA CNPJ
        var cnpj = NormalizarCnpj(dados.Cnpj);

        // VALIDA CNPJ
        if (!CnpjValido(cnpj))
        {
            return BadRequest(
                "CNPJ inválido. Informe um CNPJ válido com 14 caracteres.");
        }

        // VERIFICA CNPJ DUPLICADO
        if (await _context.Usuarios.AnyAsync(
            u => u.Cnpj == cnpj))
        {
            return BadRequest(
                "Este CNPJ já está cadastrado.");
        }

        // LOCALIZA PERFIL CLIENTE
        var perfil = await _context.Perfils
            .FirstOrDefaultAsync(p =>
                p.Nome == "Cliente" && p.Ativo);

        if (perfil == null)
        {
            return BadRequest(
                "Perfil Cliente não encontrado ou inativo.");
        }

        // CRIA USUÁRIO
        var usuario = new Usuario
        {
            UsuarioId = Guid.NewGuid(),
            Nome = dados.Nome.Trim(),
            Email = email,
            RazaoSocial = dados.RazaoSocial.Trim(),
            Cnpj = cnpj,
            TelefoneContato = dados.TelefoneContato?.Trim(),
            Ativo = true,
            DataCriacao = DateTime.Now
        };

        // GERA HASH DA SENHA
        usuario.SenhaHash = _passwordHasher.HashPassword(
            usuario,
            dados.Senha);

        // ADICIONA USUÁRIO
        _context.Usuarios.Add(usuario);

        // ATRIBUI PERFIL CLIENTE
        var usuarioPerfil = new UsuarioPerfil
        {
            UsuarioPerfilId = Guid.NewGuid(),
            UsuarioId = usuario.UsuarioId,
            PerfilId = perfil.PerfilId,
            DataAtribuicao = DateTime.Now
        };

        _context.UsuarioPerfils.Add(usuarioPerfil);

        // SALVA NO BANCO
        await _context.SaveChangesAsync();

        // IDENTIFICA ADMINISTRADOR RESPONSÁVEL
        var usuarioLogado = User.FindFirst(
            ClaimTypes.NameIdentifier)?.Value;

        Guid? administradorId = Guid.TryParse(
            usuarioLogado, out var idLogado)
                ? idLogado
                : null;

        // REGISTRA AUDITORIA
        await _auditoria.RegistrarAsync(
            administradorId,
            "USUARIO_CRIADO",
            "USUARIO",
            usuario.UsuarioId,
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            "Cliente cadastrado: " + usuario.Email);

        // RETORNA RESULTADO
        return Ok(new
        {
            mensagem = "Cliente cadastrado com sucesso.",
            usuario.UsuarioId,
            usuario.Nome,
            usuario.Email,
            usuario.RazaoSocial,
            usuario.Cnpj,
            usuario.TelefoneContato,
            usuario.Ativo,
            usuario.DataCriacao,
            Perfil = perfil.Nome
        });
    }
}
