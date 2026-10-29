
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Data;
using ProjetoCertacon.Models;
using ProjetoCertacon.Services;
using System.Security.Claims;

namespace ProjetoCertacon.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ArtigosController : ControllerBase
    {
        private readonly IntegraCertaconContext _context;
        private readonly AuditoriaService _auditoria;

        public ArtigosController(
            IntegraCertaconContext context,
            AuditoriaService auditoria)
        {
            _context = context;
            _auditoria = auditoria;
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
        [Authorize(Roles = "Administrador,Coordenador Fiscal,Analista SPED,Analista de Documentos Fiscais,Analista de Reforma Tributária")]
        public async Task<IActionResult> CriarArtigo(ArtigoRequest dados)
        {
            if (string.IsNullOrWhiteSpace(dados.Titulo) ||
                string.IsNullOrWhiteSpace(dados.Conteudo))
                return BadRequest("Preencha o titulo e o conteudo.");

            if (dados.Visibilidade != "PUBLICO" &&
                dados.Visibilidade != "EXCLUSIVO")
                return BadRequest(
                    "A visibilidade deve ser PUBLICO ou EXCLUSIVO.");

            var autorId = ObterUsuarioId();

            if (autorId == null)
                return Unauthorized("Usuario do token invalido.");

            var tema = await _context.Temas
                .FirstOrDefaultAsync(t => t.TemaId == dados.TemaId);

            if (tema == null)
                return BadRequest("O tema informado nao existe.");

            if (!PodeCriarNoTema(tema.Nome))
                return Forbid();

            var artigo = new Artigo
            {
                ArtigoId = Guid.NewGuid(),
                TemaId = dados.TemaId,
                AutorUsuarioId = autorId.Value,
                Titulo = dados.Titulo.Trim(),
                Resumo = dados.Resumo,
                Conteudo = dados.Conteudo,
                Visibilidade = dados.Visibilidade,
                Status = "RASCUNHO",
                DataCriacao = DateTime.UtcNow
            };

            _context.Artigos.Add(artigo);
            await _context.SaveChangesAsync();

            await _auditoria.RegistrarAsync(
                autorId.Value,
                "ARTIGO_CRIADO",
                "ARTIGO",
                artigo.ArtigoId,
                HttpContext.Connection.RemoteIpAddress?.ToString(),
                "Artigo criado: " + artigo.Titulo);

            return Ok(new
            {
                mensagem = "Artigo criado com sucesso.",
                artigo.ArtigoId,
                artigo.Titulo,
                artigo.Status
            });
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Administrador,Coordenador Fiscal,Analista SPED,Analista de Documentos Fiscais,Analista de Reforma Tributária")]
        public async Task<IActionResult> EditarArtigo(
            Guid id, ArtigoRequest dados)
        {
            if (string.IsNullOrWhiteSpace(dados.Titulo) ||
                string.IsNullOrWhiteSpace(dados.Conteudo))
                return BadRequest("Preencha o titulo e o conteudo.");

            if (dados.Visibilidade != "PUBLICO" &&
                dados.Visibilidade != "EXCLUSIVO")
                return BadRequest("Visibilidade invalida.");

            var usuarioId = ObterUsuarioId();

            if (usuarioId == null)
                return Unauthorized("Usuario do token invalido.");

            var artigo = await _context.Artigos
                .FirstOrDefaultAsync(a => a.ArtigoId == id);

            if (artigo == null)
                return NotFound("Artigo nao encontrado.");

            if (artigo.Status == "ARQUIVADO")
                return BadRequest("O artigo esta arquivado.");

            bool adminOuCoordenador =
                User.IsInRole("Administrador") ||
                User.IsInRole("Coordenador Fiscal");

            bool ehAutor = artigo.AutorUsuarioId == usuarioId.Value;

            if (!ehAutor && !adminOuCoordenador)
                return Forbid();

            if (artigo.Status != "RASCUNHO" &&
                !(adminOuCoordenador &&
                  artigo.Status == "EM_REVISAO"))
                return BadRequest(
                    "Este artigo nao pode ser editado neste status.");

            var tema = await _context.Temas
                .FirstOrDefaultAsync(t => t.TemaId == dados.TemaId);

            if (tema == null)
                return BadRequest("O tema informado nao existe.");

            if (!PodeCriarNoTema(tema.Nome) && !adminOuCoordenador)
                return Forbid();

            artigo.TemaId = dados.TemaId;
            artigo.Titulo = dados.Titulo.Trim();
            artigo.Resumo = dados.Resumo;
            artigo.Conteudo = dados.Conteudo;
            artigo.Visibilidade = dados.Visibilidade;
            artigo.DataAtualizacao = DateTime.UtcNow;

            if (artigo.Status == "EM_REVISAO")
                artigo.Status = "RASCUNHO";

            await _context.SaveChangesAsync();

            await _auditoria.RegistrarAsync(
                usuarioId.Value,
                "ARTIGO_EDITADO",
                "ARTIGO",
                artigo.ArtigoId,
                HttpContext.Connection.RemoteIpAddress?.ToString(),
                "Artigo editado: " + artigo.Titulo);

            return Ok(new
            {
                mensagem = "Artigo atualizado com sucesso.",
                artigo.ArtigoId,
                artigo.Titulo,
                artigo.Status
            });
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Administrador,Coordenador Fiscal,Analista SPED,Analista de Documentos Fiscais,Analista de Reforma Tributária")]
        public async Task<IActionResult> ExcluirArtigo(Guid id)
        {
            var usuarioId = ObterUsuarioId();

            if (usuarioId == null)
                return Unauthorized("Usuario do token invalido.");

            var artigo = await _context.Artigos
                .FirstOrDefaultAsync(a => a.ArtigoId == id);

            if (artigo == null)
                return NotFound("Artigo nao encontrado.");

            if (artigo.Status == "ARQUIVADO")
                return BadRequest("O artigo ja esta arquivado.");

            bool adminOuCoordenador =
                User.IsInRole("Administrador") ||
                User.IsInRole("Coordenador Fiscal");

            bool ehAutor = artigo.AutorUsuarioId == usuarioId.Value;

            if (!adminOuCoordenador &&
                (!ehAutor || artigo.Status != "RASCUNHO"))
                return Forbid();

            artigo.Status = "ARQUIVADO";
            artigo.DataAtualizacao = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _auditoria.RegistrarAsync(
                usuarioId.Value,
                "ARTIGO_ARQUIVADO",
                "ARTIGO",
                artigo.ArtigoId,
                HttpContext.Connection.RemoteIpAddress?.ToString(),
                "Artigo arquivado: " + artigo.Titulo);

            return Ok(new
            {
                mensagem = "Artigo excluido com sucesso.",
                artigo.ArtigoId,
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

            var autorId = ObterUsuarioId();

            if (autorId == null)
                return Unauthorized("Usuario do token invalido.");

            bool ehAdministrador = User.IsInRole("Administrador");

            if (artigo.AutorUsuarioId != autorId.Value && !ehAdministrador)
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

            await _auditoria.RegistrarAsync(
                revisorId.Value,
                "ARTIGO_APROVADO",
                "ARTIGO",
                artigo.ArtigoId,
                HttpContext.Connection.RemoteIpAddress?.ToString(),
                "Artigo aprovado: " + artigo.Titulo);

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

            await _auditoria.RegistrarAsync(
                revisorId.Value,
                "ARTIGO_REJEITADO",
                "ARTIGO",
                artigo.ArtigoId,
                HttpContext.Connection.RemoteIpAddress?.ToString(),
                "Artigo rejeitado: " + artigo.Titulo);

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

            await _auditoria.RegistrarAsync(
                revisorId.Value,
                "ARTIGO_AJUSTES_SOLICITADOS",
                "ARTIGO",
                artigo.ArtigoId,
                HttpContext.Connection.RemoteIpAddress?.ToString(),
                "Ajustes solicitados para o artigo: " + artigo.Titulo);

            return Ok(new
            {
                mensagem = "Ajustes solicitados ao autor.",
                artigo.ArtigoId,
                artigo.Status
            });
        }

        [HttpGet("{id:guid}/historico")]
        [Authorize(Roles = "Administrador,Coordenador Fiscal")]
        public async Task<IActionResult> GetHistorico(Guid id)
        {
            var artigoExiste = await _context.Artigos
                .AnyAsync(a => a.ArtigoId == id);

            if (!artigoExiste)
                return NotFound("Artigo nao encontrado.");

            var historico = await _context.RevisaoArtigos
                .Where(r => r.ArtigoId == id)
                .OrderByDescending(r => r.DataRevisao)
                .Select(r => new
                {
                    r.RevisaoArtigoId,
                    r.ArtigoId,
                    Revisor = r.Usuario.Nome,
                    r.Status,
                    r.Comentario,
                    r.StatusAnterior,
                    r.StatusNovo,
                    r.DataRevisao
                })
                .ToListAsync();

            return Ok(historico);
        }

        [HttpPost("{id:guid}/publicar")]
        [Authorize(Roles = "Administrador,Coordenador Fiscal")]
        public async Task<IActionResult> PublicarArtigo(Guid id)
        {
            var usuarioId = ObterUsuarioId();

            if (usuarioId == null)
                return Unauthorized("Usuario do token invalido.");

            var artigo = await _context.Artigos
                .FirstOrDefaultAsync(a => a.ArtigoId == id);

            if (artigo == null)
                return NotFound("Artigo nao encontrado.");

            if (artigo.Status != "APROVADO")
                return BadRequest(
                    "Somente artigos aprovados podem ser publicados.");

            artigo.Status = "PUBLICADO";
            artigo.DataPublicacao = DateTime.UtcNow;
            artigo.DataAtualizacao = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _auditoria.RegistrarAsync(
                usuarioId.Value,
                "ARTIGO_PUBLICADO",
                "ARTIGO",
                artigo.ArtigoId,
                HttpContext.Connection.RemoteIpAddress?.ToString(),
                "Artigo publicado: " + artigo.Titulo);

            return Ok(new
            {
                mensagem = "Artigo publicado com sucesso.",
                artigo.ArtigoId,
                artigo.Titulo,
                artigo.Status,
                artigo.DataPublicacao
            });
        }

        private bool PodeCriarNoTema(string nomeTema)
        {
            if (User.IsInRole("Administrador") ||
                User.IsInRole("Coordenador Fiscal"))
                return true;

            if (User.IsInRole("Analista SPED") &&
                (nomeTema == "SPED EFD" ||
                 nomeTema == "EFD-Contribuições"))
                return true;

            if (User.IsInRole("Analista de Documentos Fiscais") &&
                (nomeTema == "NF-e" ||
                 nomeTema == "NFP" ||
                 nomeTema == "XML"))
                return true;

            if (User.IsInRole("Analista de Reforma Tributária") &&
                nomeTema == "Reforma Tributária")
                return true;

            return false;
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
