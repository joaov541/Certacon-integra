
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

        public AutenticacaoController(
            IntegraCertaconContext context,
            IPasswordHasher<Usuario> passwordHasher,
            IConfiguration configuration)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _configuration = configuration;
        }

        [HttpPost("cadastrar")]
        [AllowAnonymous]
        public async Task<IActionResult> Cadastrar(CadastroRequest dados)
        {
            if (await _context.Usuarios.AnyAsync())
                return BadRequest("O cadastro inicial já foi realizado.");

            if (string.IsNullOrWhiteSpace(dados.Nome) ||
                string.IsNullOrWhiteSpace(dados.Email) ||
                string.IsNullOrWhiteSpace(dados.Senha))
            {
                return BadRequest("Preencha nome, e-mail e senha.");
            }

            if (dados.Senha.Length < 8)
                return BadRequest("A senha deve ter pelo menos 8 caracteres.");

            var email = dados.Email.Trim().ToLowerInvariant();

            var usuario = new Usuario
            {
                UsuarioId = Guid.NewGuid(),
                Nome = dados.Nome.Trim(),
                Email = email,
                Ativo = true,
                RazaoSocial = dados.RazaoSocial,
                Cnpj = dados.CNPJ,
                TelefoneContato = dados.TelefoneContato,
                DataCriacao = DateTime.UtcNow
            };

            usuario.SenhaHash = _passwordHasher.HashPassword(
                usuario, dados.Senha);

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensagem = "Usuário cadastrado com sucesso.",
                usuario.UsuarioId,
                usuario.Nome,
                usuario.Email
            });
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(LoginRequest dados)
        {
            var email = dados.Email?.Trim().ToLowerInvariant();

            if (string.IsNullOrWhiteSpace(email) ||
                string.IsNullOrWhiteSpace(dados.Senha))
            {
                return BadRequest("Informe o e-mail e a senha.");
            }

            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Email == email);

            if (usuario == null || !usuario.Ativo)
                return Unauthorized("E-mail ou senha inválidos.");

            var resultado = _passwordHasher.VerifyHashedPassword(
                usuario, usuario.SenhaHash, dados.Senha);

            if (resultado == PasswordVerificationResult.Failed)
                return Unauthorized("E-mail ou senha inválidos.");

            var perfis = await _context.UsuarioPerfils
                .Where(up => up.UsuarioId == usuario.UsuarioId)
                .Join(
                    _context.Perfils,
                    up => up.PerfilId,
                    p => p.PerfilId,
                    (up, p) => p.Nome
                )
                .ToListAsync();

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
        public string Email { get; set; } = "";
        public string Senha { get; set; } = "";
    }
}
