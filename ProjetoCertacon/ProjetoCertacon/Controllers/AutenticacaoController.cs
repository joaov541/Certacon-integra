using ProjetoCertacon.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ProjetoCertacon.Data;
using ProjetoCertacon.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ProjetoCertacon.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AutenticacaoController : ControllerBase
    {
        private readonly IntegraCertaconContext _context;
        private readonly IPasswordHasher<Usuario> _passwordHasher;
        private readonly IConfiguration _configuration;
        private readonly ValidacaoCnpjService _cnpj;

        public AutenticacaoController(
            IntegraCertaconContext context,
            IPasswordHasher<Usuario> passwordHasher,
            IConfiguration configuration, ValidacaoCnpjService cnpj)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _configuration = configuration;
            _cnpj = cnpj;
        }


        /// <summary>
        /// Cadastra uma empresa como Cliente no portal.
        /// </summary>
        [HttpPost("cadastro")]
        [AllowAnonymous]
        public async Task<IActionResult> Cadastrar(CadastroRequest dados)
        {
            if (string.IsNullOrWhiteSpace(dados.Nome) ||
                string.IsNullOrWhiteSpace(dados.Email) ||
                string.IsNullOrWhiteSpace(dados.Senha) ||
                string.IsNullOrWhiteSpace(dados.RazaoSocial) ||
                string.IsNullOrWhiteSpace(dados.CNPJ) ||
                string.IsNullOrWhiteSpace(dados.TelefoneContato))
            {
                return BadRequest("Preencha todos os campos obrigatórios.");
            }

            var email = dados.Email.Trim().ToLowerInvariant();

            // Normaliza o CNPJ sem remover as letras
            var cnpj = _cnpj.Normalizar(dados.CNPJ);

            if (!_cnpj.Valido(cnpj))
                return BadRequest("O CNPJ informado é inválido.");

            if (dados.Senha.Length < 8)
                return BadRequest("A senha deve possuir pelo menos 8 caracteres.");

            if (await _context.Usuarios.AnyAsync(u => u.Email == email))
                return BadRequest("Este e-mail já está cadastrado.");

            if (await _context.Usuarios.AnyAsync(u => u.Cnpj == cnpj))
                return BadRequest("Este CNPJ já está cadastrado.");

            var perfilCliente = await _context.Perfils
                .FirstOrDefaultAsync(p => p.Nome == "Cliente" && p.Ativo);

            if (perfilCliente == null)
                return StatusCode(500, "O perfil Cliente não está configurado.");

            var usuario = new Usuario
            {
                UsuarioId = Guid.NewGuid(),
                Nome = dados.Nome.Trim(),
                Email = email,
                RazaoSocial = dados.RazaoSocial.Trim(),
                Cnpj = cnpj,
                TelefoneContato = dados.TelefoneContato.Trim(),
                Ativo = true,
                DataCriacao = DateTime.Now
            };

            usuario.SenhaHash = _passwordHasher.HashPassword(
                usuario,
                dados.Senha
            );

            var usuarioPerfil = new UsuarioPerfil
            {
                UsuarioPerfilId = Guid.NewGuid(),
                UsuarioId = usuario.UsuarioId,
                PerfilId = perfilCliente.PerfilId,
                DataAtribuicao = DateTime.Now
            };

            _context.Usuarios.Add(usuario);
            _context.UsuarioPerfils.Add(usuarioPerfil);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensagem = "Empresa cadastrada com sucesso!",
                usuario.UsuarioId,
                usuario.Nome,
                usuario.Email,
                usuario.RazaoSocial,
                usuario.Cnpj,
                Perfil = "Cliente"
            });
        }

        /// <summary>
        /// Realiza o login do usuário e retorna o token JWT.
        ///  code="200">Login realizado com sucesso.
        /// </summary>
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(LoginRequest dados)
        {
            if (string.IsNullOrWhiteSpace(dados.Identificador) ||
                string.IsNullOrWhiteSpace(dados.Senha))
            {
                return BadRequest("Informe o CNPJ ou e-mail e a senha.");
            }

            var identificador = dados.Identificador.Trim();
            Usuario? usuario;

            // Cliente entra com CNPJ.
            // Cliente entra com CNPJ
            if (!identificador.Contains('@'))
            {
                var cnpj = _cnpj.Normalizar(identificador);

                if (!_cnpj.Valido(cnpj))
                    return Unauthorized("CNPJ ou senha inválidos.");

                usuario = await _context.Usuarios
                    .FirstOrDefaultAsync(u => u.Cnpj == cnpj);

                if (usuario == null || !usuario.Ativo)
                    return Unauthorized("CNPJ ou senha inválidos.");

                var ehCliente = await _context.UsuarioPerfils
                    .Where(up => up.UsuarioId == usuario.UsuarioId)
                    .Join(
                        _context.Perfils,
                        up => up.PerfilId,
                        p => p.PerfilId,
                        (up, p) => new { p.Nome, p.Ativo })
                    .AnyAsync(p => p.Nome == "Cliente" && p.Ativo);

                if (!ehCliente)
                    return Unauthorized("CNPJ ou senha inválidos.");
            }
            else
            {
                // Administradores e equipe entram com e-mail
                var email = identificador.ToLowerInvariant();

                usuario = await _context.Usuarios
                    .FirstOrDefaultAsync(u => u.Email == email);

                if (usuario == null || !usuario.Ativo)
                    return Unauthorized("E-mail ou senha inválidos.");

                var ehCliente = await _context.UsuarioPerfils
                    .Where(up => up.UsuarioId == usuario.UsuarioId)
                    .Join(
                        _context.Perfils,
                        up => up.PerfilId,
                        p => p.PerfilId,
                        (up, p) => new { p.Nome, p.Ativo })
                    .AnyAsync(p => p.Nome == "Cliente" && p.Ativo);

                if (ehCliente || !string.IsNullOrWhiteSpace(usuario.Cnpj))
                    return Unauthorized(
                        "Clientes devem entrar usando o CNPJ.");
            }

            var resultado = _passwordHasher.VerifyHashedPassword(
                usuario, usuario.SenhaHash, dados.Senha);

            if (resultado == PasswordVerificationResult.Failed)
                return Unauthorized("Credenciais inválidas.");

            var perfis = await _context.UsuarioPerfils
                .Where(up => up.UsuarioId == usuario.UsuarioId)
                .Join(
                    _context.Perfils,
                    up => up.PerfilId,
                    p => p.PerfilId,
                    (up, p) => new { p.Nome, p.Ativo })
                .Where(p => p.Ativo)
                .Select(p => p.Nome)
                .ToListAsync();

            if (perfis.Count == 0)
                return Unauthorized("Usuário sem perfil ativo.");

            var claims = new List<Claim>
            {
                new Claim(
                    ClaimTypes.NameIdentifier,
                    usuario.UsuarioId.ToString()),

                new Claim(ClaimTypes.Name, usuario.Nome),

                new Claim(ClaimTypes.Email, usuario.Email)
            };

            foreach (var perfil in perfis)
            {
                claims.Add(new Claim(ClaimTypes.Role, perfil));
            }

            var chave = _configuration["Jwt:Chave"]!;
            var emissor = _configuration["Jwt:Emissor"]!;
            var audiencia = _configuration["Jwt:Audiencia"]!;
            var minutos = _configuration.GetValue<int>(
                "Jwt:ExpiracaoEmMinutos");

            var chaveSegura = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(chave));

            var credenciais = new SigningCredentials(
                chaveSegura, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: emissor,
                audience: audiencia,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(minutos),
                signingCredentials: credenciais);

            return Ok(new
            {
                token = new JwtSecurityTokenHandler()
                    .WriteToken(token),
                expiracao = token.ValidTo,
                usuario.UsuarioId,
                usuario.Nome,
                usuario.Email,
                perfis
            });
        }
    }

    public class CadastroRequest
    {
        public string Nome { get; set; } = "";
        public string Email { get; set; } = "";
        public string Senha { get; set; } = "";
        public string? RazaoSocial { get; set; }
        public string? CNPJ { get; set; }
        public string? TelefoneContato { get; set; }
    }

    public class LoginRequest
    {
        public string Identificador { get; set; } = "";
        public string Senha { get; set; } = "";
    }
}
