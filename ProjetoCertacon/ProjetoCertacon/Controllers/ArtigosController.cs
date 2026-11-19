
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Data;
using ProjetoCertacon.Models;
using ProjetoCertacon.Services;
using System.IO;
using System.Security.Claims;

namespace ProjetoCertacon.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ArtigosController : ControllerBase
    {
        private readonly IntegraCertaconContext _context;
        private readonly AuditoriaService _auditoria;
        private readonly IWebHostEnvironment _ambiente;

        private const long TamanhoMaximoArquivo = 10 * 1024 * 1024;

        public ArtigosController(
            IntegraCertaconContext context,
            AuditoriaService auditoria,
            IWebHostEnvironment ambiente)
        {
            _context = context;
            _auditoria = auditoria;
            _ambiente = ambiente;
        }

        // ============================================================
        // DOWNLOAD DO ARQUIVO ANEXADO
        // GET: api/Artigos/{id}/arquivo
        // ============================================================

        [HttpGet("{id:guid}/arquivo")]
        public async Task<IActionResult> BaixarArquivo(Guid id)
        {
            var artigo = await _context.Artigos
                .FirstOrDefaultAsync(a => a.ArtigoId == id);

            if (artigo == null)
                return NotFound("Artigo não encontrado.");

            if (artigo.Status == "ARQUIVADO")
                return NotFound("Este conteúdo não está disponível.");

            bool autenticado = User.Identity?.IsAuthenticated == true;

            bool adminOuCoordenador =
                User.IsInRole("Administrador") ||
                User.IsInRole("Coordenador Fiscal");

            var usuarioId = ObterUsuarioId();

            bool ehAutor =
                usuarioId.HasValue &&
                artigo.AutorUsuarioId == usuarioId.Value;

            // Artigos aprovados ou publicados respeitam a visibilidade.
            if (artigo.Status == "PUBLICADO" || artigo.Status == "APROVADO")
            {
                if (artigo.Visibilidade == "EXCLUSIVO" && !autenticado)
                {
                    return Unauthorized(
                        "Faça login para acessar este documento.");
                }

                if (artigo.Visibilidade != "PUBLICO" &&
                    artigo.Visibilidade != "EXCLUSIVO")
                {
                    return Forbid();
                }
            }
            else
            {
                // Conteúdos não publicados só podem ser acessados
                // pelo autor ou por Administrador/Coordenador.
                if (!autenticado)
                    return Unauthorized();

                if (!ehAutor && !adminOuCoordenador)
                    return Forbid();
            }

            if (string.IsNullOrWhiteSpace(artigo.CaminhoArquivo) ||
                string.IsNullOrWhiteSpace(artigo.NomeArquivo))
            {
                return NotFound(
                    "Este conteúdo não possui documento anexado.");
            }

            var caminho = ObterCaminhoSeguroArquivo(
                artigo.CaminhoArquivo);

            if (caminho == null)
                return BadRequest("Caminho de arquivo inválido.");

            if (!System.IO.File.Exists(caminho))
                return NotFound(
                    "O arquivo não foi encontrado no servidor.");

            return PhysicalFile(
                caminho,
                artigo.TipoConteudo ?? "application/octet-stream",
                artigo.NomeArquivo
            );
        }

        // ============================================================
        // ENVIO OU SUBSTITUIÇÃO DO ARQUIVO
        // POST: api/Artigos/{id}/arquivo
        // ============================================================

        [HttpPost("{id:guid}/arquivo")]
        [Authorize(Roles = "Administrador,Coordenador Fiscal,Analista SPED,Analista de Documentos Fiscais,Analista de Reforma Tributária")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(11 * 1024 * 1024)]
        public async Task<IActionResult> EnviarArquivo(
     Guid id,
     IFormFile arquivo)
        {
            if (arquivo == null || arquivo.Length == 0)
                return BadRequest("Selecione um arquivo.");

            if (arquivo.Length > TamanhoMaximoArquivo)
                return BadRequest("O arquivo deve ter no máximo 10 MB.");

            var extensao = Path.GetExtension(arquivo.FileName)
                .ToLowerInvariant();

            var extensoesPermitidas = new[]
            {
                ".pdf",
                ".doc",
                ".docx"
            };

            if (!extensoesPermitidas.Contains(extensao))
            {
                return BadRequest(
                    "Formato inválido. Envie PDF, DOC ou DOCX.");
            }

            var usuarioId = ObterUsuarioId();

            if (usuarioId == null)
                return Unauthorized("Usuário do token inválido.");

            var artigo = await _context.Artigos
                .FirstOrDefaultAsync(a => a.ArtigoId == id);

            if (artigo == null)
                return NotFound("Artigo não encontrado.");

            bool adminOuCoordenador =
                User.IsInRole("Administrador") ||
                User.IsInRole("Coordenador Fiscal");

            bool ehAutor =
                artigo.AutorUsuarioId == usuarioId.Value;

            if (!ehAutor && !adminOuCoordenador)
                return Forbid();

            if (artigo.Status == "ARQUIVADO")
            {
                return BadRequest(
                    "Não é possível anexar arquivo a um artigo arquivado.");
            }

            if (artigo.Status != "RASCUNHO" &&
                !(adminOuCoordenador &&
                  artigo.Status == "EM_REVISAO"))
            {
                return BadRequest(
                    "Não é possível alterar o arquivo neste status.");
            }

            var pasta = Path.Combine(
                _ambiente.ContentRootPath,
                "wwwroot",
                "arquivos",
                "artigos"
            );

            Directory.CreateDirectory(pasta);

            // Nome interno único para evitar conflitos entre arquivos.
            var nomeInterno = Guid.NewGuid().ToString("N") + extensao;

            var caminhoCompleto = Path.Combine(
                pasta,
                nomeInterno
            );

            var caminhoRelativo = Path.Combine(
                "arquivos",
                "artigos",
                nomeInterno
            ).Replace("\\", "/");

            var caminhoAnterior = artigo.CaminhoArquivo;

            try
            {
                await using (var stream = new FileStream(
                    caminhoCompleto,
                    FileMode.CreateNew,
                    FileAccess.Write,
                    FileShare.None))
                {
                    await arquivo.CopyToAsync(stream);
                }

                // Salva as informações do documento no artigo.
                artigo.NomeArquivo = Path.GetFileName(
                    arquivo.FileName);

                artigo.CaminhoArquivo = caminhoRelativo;

                artigo.TipoConteudo =
                    string.IsNullOrWhiteSpace(arquivo.ContentType)
                        ? "application/octet-stream"
                        : arquivo.ContentType;

                artigo.TamanhoArquivo = arquivo.Length;
                artigo.DataAtualizacao = DateTime.UtcNow;

                await _context.SaveChangesAsync();
            }
            catch
            {
                // Se ocorrer erro, remove o novo arquivo.
                if (System.IO.File.Exists(caminhoCompleto))
                    System.IO.File.Delete(caminhoCompleto);

                throw;
            }

            // Remove o arquivo anterior somente depois de salvar o novo.
            if (!string.IsNullOrWhiteSpace(caminhoAnterior))
            {
                var caminhoAntigo =
                    ObterCaminhoSeguroArquivo(caminhoAnterior);

                if (caminhoAntigo != null &&
                    System.IO.File.Exists(caminhoAntigo))
                {
                    System.IO.File.Delete(caminhoAntigo);
                }
            }

            return Ok(new
            {
                mensagem = "Arquivo enviado com sucesso.",
                artigo.ArtigoId,
                artigo.NomeArquivo,
                artigo.TamanhoArquivo,
                TemArquivo = true
            });
        }

        // ============================================================
        // LISTAR ARTIGOS APROVADOS OU REJEITADOS
        // GET: api/Artigos/revisados/APROVADO
        // GET: api/Artigos/revisados/REJEITADO
        // ============================================================

        [HttpGet("revisados/{status}")]
        [Authorize(Roles = "Administrador,Coordenador Fiscal")]
        public async Task<IActionResult> GetArtigosRevisados(
            string status)
        {
            status = status.Trim().ToUpperInvariant();

            if (status != "APROVADO" && status != "REJEITADO")
                return BadRequest("Status inválido.");

            var artigos = await _context.Artigos
                .Where(a => a.Status == status)
                .OrderByDescending(a => a.DataAtualizacao)
                .Select(a => new
                {
                    a.ArtigoId,
                    a.Titulo,
                    a.Resumo,
                    a.Conteudo,
                    a.Visibilidade,
                    a.Status,
                    a.DataCriacao,
                    a.DataAtualizacao,
                    a.DataPublicacao,
                    a.NomeArquivo,
                    a.TamanhoArquivo,
                    TemArquivo = a.CaminhoArquivo != null,
                    Tema = a.Tema.Nome,
                    Autor = a.AutorUsuario.Nome
                })
                .ToListAsync();

            return Ok(artigos);
        }

        // ============================================================
        // LISTAR ARTIGOS DO USUÁRIO LOGADO
        // GET: api/Artigos/meus-artigos
        // ============================================================

        [HttpGet("meus-artigos")]
        [Authorize(Roles = "Administrador,Coordenador Fiscal,Analista SPED,Analista de Documentos Fiscais,Analista de Reforma Tributária")]
        public async Task<IActionResult> GetMeusArtigos()
        {
            var usuarioId = ObterUsuarioId();

            if (usuarioId == null)
                return Unauthorized("Usuário do token inválido.");

            var artigos = await _context.Artigos
                .Where(a => a.AutorUsuarioId == usuarioId.Value)
                .OrderByDescending(a => a.DataCriacao)
                .Select(a => new
                {
                    a.ArtigoId,
                    a.Titulo,
                    a.Resumo,
                    a.Conteudo,
                    a.Visibilidade,
                    a.Status,
                    a.DataCriacao,
                    a.DataAtualizacao,
                    a.DataPublicacao,
                    a.NomeArquivo,
                    a.TamanhoArquivo,
                    TemArquivo = a.CaminhoArquivo != null,
                    Tema = a.Tema.Nome,
                    Autor = a.AutorUsuario.Nome,
                    a.TemaId
                })
                .ToListAsync();

            return Ok(artigos);
        }

        // ============================================================
        // LISTAR ARTIGOS APROVADOS OU PUBLICADOS
        // GET: api/Artigos
        // ============================================================

        [HttpGet]
        public async Task<IActionResult> GetArtigos()
        {
            // Aprovados também ficam disponíveis na aba Todos os conteúdos.
            var consulta = _context.Artigos
                .AsNoTracking()
                .Where(a => a.Status == "APROVADO" || a.Status == "PUBLICADO");

            if (User.Identity?.IsAuthenticated == true)
            {
                consulta = consulta.Where(a =>
                    a.Visibilidade == "PUBLICO" ||
                    a.Visibilidade == "EXCLUSIVO");
            }
            else
            {
                consulta = consulta.Where(a => a.Visibilidade == "PUBLICO");
            }

            var artigos = await consulta
                .OrderByDescending(a => a.DataPublicacao ?? a.DataAtualizacao ?? a.DataCriacao)
                .Select(a => new
                {
                    a.ArtigoId,
                    a.Titulo,
                    a.Resumo,
                    a.Conteudo,
                    a.Visibilidade,
                    a.Status,
                    a.DataCriacao,
                    a.DataAtualizacao,
                    a.DataPublicacao,
                    a.NomeArquivo,
                    a.TamanhoArquivo,
                    TemArquivo = a.CaminhoArquivo != null,
                    Tema = a.Tema.Nome,
                    Autor = a.AutorUsuario.Nome
                })
                .ToListAsync();

            return Ok(artigos);
        }

        // ============================================================
        // CRIAR ARTIGO
        // POST: api/Artigos
        // ============================================================

        [HttpPost]
        [Authorize(Roles = "Administrador,Coordenador Fiscal,Analista SPED,Analista de Documentos Fiscais,Analista de Reforma Tributária")]
        public async Task<IActionResult> CriarArtigo(
            [FromBody] ArtigoRequest dados)
        {
            if (string.IsNullOrWhiteSpace(dados.Titulo) ||
                string.IsNullOrWhiteSpace(dados.Conteudo))
            {
                return BadRequest(
                    "Preencha o título e o conteúdo.");
            }

            if (dados.Visibilidade != "PUBLICO" &&
                dados.Visibilidade != "EXCLUSIVO")
            {
                return BadRequest(
                    "A visibilidade deve ser PUBLICO ou EXCLUSIVO.");
            }

            var autorId = ObterUsuarioId();

            if (autorId == null)
                return Unauthorized("Usuário do token inválido.");

            var tema = await _context.Temas
                .FirstOrDefaultAsync(t => t.TemaId == dados.TemaId);

            if (tema == null)
                return BadRequest("O tema informado não existe.");

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
                "Artigo criado: " + artigo.Titulo
            );

            return Ok(new
            {
                mensagem = "Artigo criado com sucesso.",
                artigo.ArtigoId,
                artigo.Titulo,
                artigo.Status
            });
        }

        // ============================================================
        // EDITAR ARTIGO
        // PUT: api/Artigos/{id}
        // ============================================================


        // ============================================================
        // BUSCAR ARTIGO POR ID
        // GET: api/Artigos/{id}
        // ============================================================

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetArtigoPorId(Guid id)
        {
            var artigo = await _context.Artigos
                .AsNoTracking()
                .Where(a => a.ArtigoId == id)
                .Select(a => new
                {
                    a.ArtigoId,
                    a.TemaId,
                    a.AutorUsuarioId,
                    a.Titulo,
                    a.Resumo,
                    a.Conteudo,
                    a.Visibilidade,
                    a.Status,
                    a.DataCriacao,
                    a.DataAtualizacao,
                    a.DataPublicacao,
                    a.NomeArquivo,
                    a.TamanhoArquivo,
                    TemArquivo = a.CaminhoArquivo != null,
                    Tema = a.Tema.Nome,
                    Autor = a.AutorUsuario.Nome
                })
                .FirstOrDefaultAsync();

            if (artigo == null || artigo.Status == "ARQUIVADO")
                return NotFound("Artigo não encontrado.");

            bool autenticado = User.Identity?.IsAuthenticated == true;
            bool disponivel = artigo.Status == "PUBLICADO" || artigo.Status == "APROVADO";

            if (disponivel)
            {
                if (artigo.Visibilidade == "PUBLICO")
                    return Ok(artigo);

                if (artigo.Visibilidade == "EXCLUSIVO")
                    return autenticado ? Ok(artigo) : Unauthorized();

                return Forbid();
            }

            // Rascunhos e conteúdos em revisão só podem ser consultados
            // pelo autor ou por Administrador/Coordenador Fiscal.
            if (!autenticado)
                return Unauthorized();

            var usuarioId = ObterUsuarioId();
            bool adminOuCoordenador =
                User.IsInRole("Administrador") ||
                User.IsInRole("Coordenador Fiscal");

            if (artigo.AutorUsuarioId != usuarioId && !adminOuCoordenador)
                return Forbid();

            return Ok(artigo);
        }

        // ============================================================
        // ARQUIVAR ARTIGO
        // DELETE: api/Artigos/{id}
        // ============================================================

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Administrador,Coordenador Fiscal,Analista SPED,Analista de Documentos Fiscais,Analista de Reforma Tributária")]
        public async Task<IActionResult> ExcluirArtigo(Guid id)
        {
            var usuarioId = ObterUsuarioId();

            if (usuarioId == null)
                return Unauthorized("Usuário do token inválido.");

            var artigo = await _context.Artigos
                .FirstOrDefaultAsync(a => a.ArtigoId == id);

            if (artigo == null)
                return NotFound("Artigo não encontrado.");

            if (artigo.Status == "ARQUIVADO")
                return BadRequest("O artigo já está arquivado.");

            bool adminOuCoordenador =
                User.IsInRole("Administrador") ||
                User.IsInRole("Coordenador Fiscal");

            bool ehAutor =
                artigo.AutorUsuarioId == usuarioId.Value;

            if (!adminOuCoordenador &&
                (!ehAutor || artigo.Status != "RASCUNHO"))
            {
                return Forbid();
            }

            artigo.Status = "ARQUIVADO";
            artigo.DataAtualizacao = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _auditoria.RegistrarAsync(
                usuarioId.Value,
                "ARTIGO_ARQUIVADO",
                "ARTIGO",
                artigo.ArtigoId,
                HttpContext.Connection.RemoteIpAddress?.ToString(),
                "Artigo arquivado: " + artigo.Titulo
            );

            return Ok(new
            {
                mensagem = "Artigo arquivado com sucesso.",
                artigo.ArtigoId,
                artigo.Status
            });
        }

        // ============================================================
        // ENVIAR ARTIGO PARA REVISÃO
        // POST: api/Artigos/{id}/enviar-revisao
        // ============================================================

        [HttpPost("{id:guid}/enviar-revisao")]
        [Authorize(Roles = "Administrador,Coordenador Fiscal,Analista SPED,Analista de Documentos Fiscais,Analista de Reforma Tributária")]
        public async Task<IActionResult> EnviarParaRevisao(Guid id)
        {
            var artigo = await _context.Artigos
                .FirstOrDefaultAsync(a => a.ArtigoId == id);

            if (artigo == null)
                return NotFound("Artigo não encontrado.");

            var autorId = ObterUsuarioId();

            if (autorId == null)
                return Unauthorized("Usuário do token inválido.");

            bool ehAdministrador =
                User.IsInRole("Administrador");

            if (artigo.AutorUsuarioId != autorId.Value &&
                !ehAdministrador)
            {
                return Forbid();
            }

            if (artigo.Status != "RASCUNHO")
            {
                return BadRequest(
                    "Somente artigos em RASCUNHO podem ser enviados para revisão.");
            }

            artigo.Status = "EM_REVISAO";
            artigo.DataAtualizacao = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensagem = "Artigo enviado para revisão.",
                artigo.ArtigoId,
                artigo.Titulo,
                artigo.Status
            });
        }

        // ============================================================
        // LISTAR ARTIGOS PENDENTES DE REVISÃO
        // GET: api/Artigos/pendentes-revisao
        // ============================================================

        [HttpGet("pendentes-revisao")]
        [Authorize(Roles = "Administrador,Coordenador Fiscal")]
        public async Task<IActionResult> GetArtigosPendentes()
        {
            var artigos = await _context.Artigos
                .Where(a => a.Status == "EM_REVISAO")
                .OrderByDescending(a => a.DataAtualizacao)
                .Select(a => new
                {
                    a.ArtigoId,
                    a.Titulo,
                    a.Resumo,
                    a.Visibilidade,
                    a.DataCriacao,
                    a.DataAtualizacao,
                    a.NomeArquivo,
                    a.TamanhoArquivo,
                    TemArquivo = a.CaminhoArquivo != null,
                    Tema = a.Tema.Nome,
                    Autor = a.AutorUsuario.Nome
                })
                .ToListAsync();

            return Ok(artigos);
        }

        // ============================================================
        // APROVAR ARTIGO
        // POST: api/Artigos/{id}/aprovar
        // ============================================================

        [HttpPost("{id:guid}/aprovar")]
        [Authorize(Roles = "Administrador,Coordenador Fiscal")]
        public async Task<IActionResult> AprovarArtigo(
            Guid id,
            [FromBody] RevisaoRequest dados)
        {
            var artigo = await _context.Artigos
                .FirstOrDefaultAsync(a => a.ArtigoId == id);

            if (artigo == null)
                return NotFound("Artigo não encontrado.");

            if (artigo.Status != "EM_REVISAO")
            {
                return BadRequest(
                    "O artigo não está aguardando revisão.");
            }

            var revisorId = ObterUsuarioId();

            if (revisorId == null)
                return Unauthorized("Usuário do token inválido.");

            var revisao = CriarRevisao(
                artigo,
                revisorId.Value,
                "APROVADA",
                "APROVADO",
                dados.Comentario
            );

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
                "Artigo aprovado: " + artigo.Titulo
            );

            return Ok(new
            {
                mensagem = "Artigo aprovado com sucesso.",
                artigo.ArtigoId,
                artigo.Status
            });
        }

        // ============================================================
        // REJEITAR ARTIGO
        // POST: api/Artigos/{id}/rejeitar
        // ============================================================

        [HttpPost("{id:guid}/rejeitar")]
        [Authorize(Roles = "Administrador,Coordenador Fiscal")]
        public async Task<IActionResult> RejeitarArtigo(
            Guid id,
            [FromBody] RevisaoRequest dados)
        {
            if (string.IsNullOrWhiteSpace(dados.Comentario))
            {
                return BadRequest(
                    "Informe o motivo da rejeição.");
            }

            var artigo = await _context.Artigos
                .FirstOrDefaultAsync(a => a.ArtigoId == id);

            if (artigo == null)
                return NotFound("Artigo não encontrado.");

            if (artigo.Status != "EM_REVISAO")
            {
                return BadRequest(
                    "O artigo não está aguardando revisão.");
            }

            var revisorId = ObterUsuarioId();

            if (revisorId == null)
                return Unauthorized("Usuário do token inválido.");

            var revisao = CriarRevisao(
                artigo,
                revisorId.Value,
                "REJEITADA",
                "REJEITADO",
                dados.Comentario
            );

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
                "Artigo rejeitado: " + artigo.Titulo
            );

            return Ok(new
            {
                mensagem = "Artigo rejeitado.",
                artigo.ArtigoId,
                artigo.Status
            });
        }

        // ============================================================
        // SOLICITAR AJUSTES
        // POST: api/Artigos/{id}/solicitar-ajustes
        // ============================================================

        [HttpPost("{id:guid}/solicitar-ajustes")]
        [Authorize(Roles = "Administrador,Coordenador Fiscal")]
        public async Task<IActionResult> SolicitarAjustes(
            Guid id,
            [FromBody] RevisaoRequest dados)
        {
            if (string.IsNullOrWhiteSpace(dados.Comentario))
            {
                return BadRequest(
                    "Informe os ajustes necessários.");
            }

            var artigo = await _context.Artigos
                .FirstOrDefaultAsync(a => a.ArtigoId == id);

            if (artigo == null)
                return NotFound("Artigo não encontrado.");

            if (artigo.Status != "EM_REVISAO")
            {
                return BadRequest(
                    "O artigo não está aguardando revisão.");
            }

            var revisorId = ObterUsuarioId();

            if (revisorId == null)
                return Unauthorized("Usuário do token inválido.");

            var revisao = CriarRevisao(
                artigo,
                revisorId.Value,
                "AJUSTES_SOLICITADOS",
                "RASCUNHO",
                dados.Comentario
            );

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
                "Ajustes solicitados para o artigo: " + artigo.Titulo
            );

            return Ok(new
            {
                mensagem = "Ajustes solicitados ao autor.",
                artigo.ArtigoId,
                artigo.Status
            });
        }

        // ============================================================
        // HISTÓRICO DE REVISÃO
        // GET: api/Artigos/{id}/historico
        // ============================================================

        [HttpGet("{id:guid}/historico")]
        [Authorize(Roles = "Administrador,Coordenador Fiscal")]
        public async Task<IActionResult> GetHistorico(Guid id)
        {
            var artigoExiste = await _context.Artigos
                .AnyAsync(a => a.ArtigoId == id);

            if (!artigoExiste)
                return NotFound("Artigo não encontrado.");

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

        // ============================================================
        // PUBLICAR ARTIGO
        // POST: api/Artigos/{id}/publicar
        // ============================================================

        [HttpPost("{id:guid}/publicar")]
        [Authorize(Roles = "Administrador,Coordenador Fiscal")]
        public async Task<IActionResult> PublicarArtigo(Guid id)
        {
            var usuarioId = ObterUsuarioId();

            if (usuarioId == null)
                return Unauthorized("Usuário do token inválido.");

            var artigo = await _context.Artigos
                .FirstOrDefaultAsync(a => a.ArtigoId == id);

            if (artigo == null)
                return NotFound("Artigo não encontrado.");

            if (artigo.Status != "APROVADO")
            {
                return BadRequest(
                    "Somente artigos aprovados podem ser publicados.");
            }

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
                "Artigo publicado: " + artigo.Titulo
            );

            return Ok(new
            {
                mensagem = "Artigo publicado com sucesso.",
                artigo.ArtigoId,
                artigo.Titulo,
                artigo.Status,
                artigo.DataPublicacao
            });
        }

        // ============================================================
        // MÉTODOS AUXILIARES
        // ============================================================

        private bool PodeCriarNoTema(string nomeTema)
        {
            if (User.IsInRole("Administrador") ||
                User.IsInRole("Coordenador Fiscal"))
            {
                return true;
            }

            if (User.IsInRole("Analista SPED") &&
                (nomeTema == "SPED EFD" ||
                 nomeTema == "EFD-Contribuições"))
            {
                return true;
            }

            if (User.IsInRole("Analista de Documentos Fiscais") &&
                (nomeTema == "NF-e" ||
                 nomeTema == "NFP" ||
                 nomeTema == "XML"))
            {
                return true;
            }

            if (User.IsInRole("Analista de Reforma Tributária") &&
                nomeTema == "Reforma Tributária")
            {
                return true;
            }

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
            Artigo artigo,
            Guid usuarioId,
            string decisao,
            string novoStatus,
            string? comentario)
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

        // Garante que o caminho do arquivo permaneça dentro de wwwroot.
        private string? ObterCaminhoSeguroArquivo(string caminhoRelativo)
        {
            if (string.IsNullOrWhiteSpace(caminhoRelativo))
                return null;

            var raiz = Path.GetFullPath(
                Path.Combine(
                    _ambiente.ContentRootPath,
                    "wwwroot"
                )
            );

            var caminhoCompleto = Path.GetFullPath(
                Path.Combine(
                    raiz,
                    caminhoRelativo.Replace(
                        '/',
                        Path.DirectorySeparatorChar
                    )
                )
            );

            var caminhoRelativoCalculado = Path.GetRelativePath(
                raiz,
                caminhoCompleto
            );

            if (Path.IsPathRooted(caminhoRelativoCalculado) ||
                caminhoRelativoCalculado == ".." ||
                caminhoRelativoCalculado.StartsWith(
                    ".." + Path.DirectorySeparatorChar,
                    StringComparison.Ordinal))
            {
                return null;
            }

            return caminhoCompleto;
        }
    }

    // ================================================================
    // DTOs
    // ================================================================

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
