
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Data;
using ProjetoCertacon.Models;
using System.Security.Claims;

namespace ProjetoCertacon.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ArtigosController : ControllerBase
    {
        private readonly IntegraCertaconContext _context;

        public ArtigosController(IntegraCertaconContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetArtigos()
        {
            var consulta = _context.Artigos
                .Where(a => a.Status == "PUBLICADO");

            if (User.Identity?.IsAuthenticated == true)
            {
                consulta = consulta.Where(a =>
                    a.Visibilidade == "PUBLICO" ||
                    a.Visibilidade == "EXCLUSIVO");
            }
            else
            {
                consulta = consulta.Where(a =>
                    a.Visibilidade == "PUBLICO");
            }

            var artigos = await consulta
                .Select(a => new
                {
                    a.ArtigoId,
                    a.Titulo,
                    a.Resumo,
                    a.Conteudo,
                    a.Visibilidade,
                    a.DataPublicacao,
                    Tema = a.Tema.Nome
                })
                .ToListAsync();

            return Ok(artigos);
        }

        [HttpPost]
        [Authorize(Roles = "Administrador,Coordenador Fiscal")]
        public async Task<IActionResult> CriarArtigo(ArtigoRequest dados)
        {
            if (string.IsNullOrWhiteSpace(dados.Titulo) ||
                string.IsNullOrWhiteSpace(dados.Conteudo))
            {
                return BadRequest("Preencha o titulo e o conteudo.");
            }

            if (dados.Visibilidade != "PUBLICO" &&
                dados.Visibilidade != "EXCLUSIVO")
            {
                return BadRequest(
                    "A visibilidade deve ser PUBLICO ou EXCLUSIVO.");
            }

            var usuarioId = User.FindFirst(
                ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(usuarioId, out var autorId))
                return Unauthorized("Usuario do token invalido.");

            var temaExiste = await _context.Temas
                .AnyAsync(t => t.TemaId == dados.TemaId);

            if (!temaExiste)
                return BadRequest("O tema informado nao existe.");

            var artigo = new Artigo
            {
                ArtigoId = Guid.NewGuid(),
                TemaId = dados.TemaId,
                AutorUsuarioId = autorId,
                Titulo = dados.Titulo.Trim(),
                Resumo = dados.Resumo,
                Conteudo = dados.Conteudo,
                Visibilidade = dados.Visibilidade,
                Status = "RASCUNHO",
                DataCriacao = DateTime.UtcNow
            };

            _context.Artigos.Add(artigo);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensagem = "Artigo criado com sucesso.",
                artigo.ArtigoId,
                artigo.Titulo,
                artigo.Status
            });
        }

        [HttpPost("{id:guid}/enviar-revisao")]
        [Authorize(Roles = "Administrador,Coordenador Fiscal,Analista SPED,Analista de Documentos Fiscais,Analista de Reforma Tributária")]
        public async Task<IActionResult> EnviarParaRevisao(Guid id)
        {
            var artigo = await _context.Artigos
                .FirstOrDefaultAsync(a => a.ArtigoId == id);

            if (artigo == null)
                return NotFound("Artigo nao encontrado.");

            var usuarioId = User.FindFirst(
                ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(usuarioId, out var autorId))
                return Unauthorized("Usuario do token invalido.");

            var ehAdministrador = User.IsInRole("Administrador");

            if (artigo.AutorUsuarioId != autorId && !ehAdministrador)
                return Forbid();

            if (artigo.Status != "RASCUNHO")
                return BadRequest(
                    "Somente artigos em RASCUNHO podem ser enviados para revisao.");

            artigo.Status = "EM_REVISAO";
            artigo.DataAtualizacao = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensagem = "Artigo enviado para revisao.",
                artigo.ArtigoId,
                artigo.Titulo,
                artigo.Status
            });
        }

        [HttpGet("pendentes-revisao")]
        [Authorize(Roles = "Administrador,Coordenador Fiscal")]
        public async Task<IActionResult> GetArtigosPendentes()
        {
            var artigos = await _context.Artigos
                .Where(a => a.Status == "EM_REVISAO")
                .Select(a => new
                {
                    a.ArtigoId,
                    a.Titulo,
                    a.Resumo,
                    a.Visibilidade,
                    a.DataCriacao,
                    Tema = a.Tema.Nome,
                    Autor = a.AutorUsuario.Nome
                })
                .ToListAsync();

            return Ok(artigos);
        }

        [HttpPost("{id:guid}/aprovar")]
        [Authorize(Roles = "Administrador,Coordenador Fiscal")]
        public async Task<IActionResult> AprovarArtigo(
            Guid id, RevisaoRequest dados)
        {
            var artigo = await _context.Artigos
                .FirstOrDefaultAsync(a => a.ArtigoId == id);

            if (artigo == null)
                return NotFound("Artigo nao encontrado.");

            if (artigo.Status != "EM_REVISAO")
                return BadRequest("O artigo nao esta aguardando revisao.");

            var revisorId = ObterUsuarioId();

            if (revisorId == null)
                return Unauthorized("Usuario do token invalido.");

            var revisao = CriarRevisao(
                artigo, revisorId.Value, "APROVADA",
                "APROVADO", dados.Comentario);

            artigo.Status = "APROVADO";
            artigo.DataAtualizacao = DateTime.UtcNow;

            _context.RevisaoArtigos.Add(revisao);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensagem = "Artigo aprovado com sucesso.",
                artigo.ArtigoId,
                artigo.Status
            });
        }

        [HttpPost("{id:guid}/rejeitar")]
        [Authorize(Roles = "Administrador,Coordenador Fiscal")]
        public async Task<IActionResult> RejeitarArtigo(
            Guid id, RevisaoRequest dados)
        {
            var artigo = await _context.Artigos
                .FirstOrDefaultAsync(a => a.ArtigoId == id);

            if (artigo == null)
                return NotFound("Artigo nao encontrado.");

            if (artigo.Status != "EM_REVISAO")
                return BadRequest("O artigo nao esta aguardando revisao.");

            var revisorId = ObterUsuarioId();

            if (revisorId == null)
                return Unauthorized("Usuario do token invalido.");

            var revisao = CriarRevisao(
                artigo, revisorId.Value, "REJEITADA",
                "REJEITADO", dados.Comentario);

            artigo.Status = "REJEITADO";
            artigo.DataAtualizacao = DateTime.UtcNow;

            _context.RevisaoArtigos.Add(revisao);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensagem = "Artigo rejeitado.",
                artigo.ArtigoId,
                artigo.Status
            });
        }

        [HttpPost("{id:guid}/solicitar-ajustes")]
        [Authorize(Roles = "Administrador,Coordenador Fiscal")]
        public async Task<IActionResult> SolicitarAjustes(
            Guid id, RevisaoRequest dados)
        {
            if (string.IsNullOrWhiteSpace(dados.Comentario))
                return BadRequest("Informe os ajustes necessarios.");

            var artigo = await _context.Artigos
                .FirstOrDefaultAsync(a => a.ArtigoId == id);

            if (artigo == null)
                return NotFound("Artigo nao encontrado.");

            if (artigo.Status != "EM_REVISAO")
                return BadRequest("O artigo nao esta aguardando revisao.");

            var revisorId = ObterUsuarioId();

            if (revisorId == null)
                return Unauthorized("Usuario do token invalido.");

            var revisao = CriarRevisao(
                artigo, revisorId.Value, "AJUSTES_SOLICITADOS",
                "RASCUNHO", dados.Comentario);

            artigo.Status = "RASCUNHO";
            artigo.DataAtualizacao = DateTime.UtcNow;

            _context.RevisaoArtigos.Add(revisao);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensagem = "Ajustes solicitados ao autor.",
                artigo.ArtigoId,
                artigo.Status
            });
        }

        private Guid? ObterUsuarioId()
        {
            var id = User.FindFirst(
                ClaimTypes.NameIdentifier)?.Value;

            return Guid.TryParse(id, out var usuarioId)
                ? usuarioId
                : null;
        }

        private RevisaoArtigo CriarRevisao(
            Artigo artigo, Guid usuarioId, string decisao,
            string novoStatus, string? comentario)
        {
            return new RevisaoArtigo
            {
                RevisaoArtigoId = Guid.NewGuid(),
                ArtigoId = artigo.ArtigoId,
                UsuarioId = usuarioId,
                Status = decisao,
                Comentario = comentario,
                StatusAnterior = artigo.Status,
                StatusNovo = novoStatus,
                DataRevisao = DateTime.UtcNow
            };
        }
    }

    public class ArtigoRequest
    {
        public Guid TemaId { get; set; }
        public string Titulo { get; set; } = "";
        public string? Resumo { get; set; }
        public string Conteudo { get; set; } = "";
        public string Visibilidade { get; set; } = "PUBLICO";
    }

    public class RevisaoRequest
    {
        public string? Comentario { get; set; }
    }
}
