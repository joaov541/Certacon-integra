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
        private readonly PermissaoService _permissao;

        private const long TamanhoMaximoArquivo = 10 * 1024 * 1024;

        public ArtigosController(
            IntegraCertaconContext context,
            AuditoriaService auditoria,
            IWebHostEnvironment ambiente,
            PermissaoService permissao)
        {
            _context = context;
            _auditoria = auditoria;
            _ambiente = ambiente;
            _permissao = permissao;
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

            var bloqueio = await VerificarLeituraAsync(artigo.Status, artigo.Visibilidade, artigo.TemaId);
            if (bloqueio != null) return bloqueio;

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
        [Authorize]
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

            if (!await PodeAlterarAsync(artigo, "artigo.editar", usuarioId.Value))
                return Forbid();

            if (artigo.Status != "RASCUNHO" &&
                !(artigo.Status == "EM_REVISAO" &&
                  await _permissao.TemPermissaoAsync(User, "artigo.revisar", artigo.TemaId)))
                return BadRequest("Não é possível alterar o arquivo neste status.");

            var pasta = Path.Combine(
                _ambiente.ContentRootPath,
                "App_Data",
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
                "App_Data",
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

                artigo.TipoConteudo = extensao switch
                {
                    ".pdf" => "application/pdf",
                    ".doc" => "application/msword",
                    ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    _ => "application/octet-stream"
                };

                artigo.TamanhoArquivo = arquivo.Length;
                artigo.DataAtualizacao = DateTime.UtcNow;

                await SalvarAlteracaoComRevogacaoIAAsync(artigo);
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

            await _auditoria.RegistrarAsync(usuarioId.Value, "ARTIGO_ARQUIVO_ENVIADO", "ARTIGO",
                artigo.ArtigoId, HttpContext.Connection.RemoteIpAddress?.ToString(), "Anexo atualizado: " + artigo.Titulo);

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
        [Authorize]
        public async Task<IActionResult> GetArtigosRevisados(
            string status)
        {
            status = status.Trim().ToUpperInvariant();

            if (status != "APROVADO" && status != "REJEITADO")
                return BadRequest("Status inválido.");

            var consulta = await FiltrarPorPermissaoAsync(_context.Artigos.AsNoTracking(), "artigo.revisar");
            if (consulta == null) return Forbid();
            var artigos = await consulta
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
                    Autor = a.AutorUsuario.Nome,
                    a.TemaId
                })
                .ToListAsync();

            return Ok(artigos);
        }

        // ============================================================
        // LISTAR ARTIGOS DO USUÁRIO LOGADO
        // GET: api/Artigos/meus-artigos
        // ============================================================

        [HttpGet("meus-artigos")]
        [Authorize]
        public async Task<IActionResult> GetMeusArtigos()
        {
            var usuarioId = ObterUsuarioId();

            if (usuarioId == null)
                return Unauthorized("Usuário do token inválido.");

            var consulta = await FiltrarPorPermissaoAsync(_context.Artigos.AsNoTracking(), "artigo.ler.rascunho");
            if (consulta == null) return Forbid();
            var artigos = await consulta
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
        // LISTAR ARTIGOS PUBLICADOS
        // GET: api/Artigos
        // ============================================================

        [HttpGet]
        public async Task<IActionResult> GetArtigos()
        {
            var consulta = _context.Artigos.AsNoTracking()
                .Where(a => a.Status == "PUBLICADO");

            if (User.Identity?.IsAuthenticated == true)
            {
                var usuarioId = ObterUsuarioId();
                if (!usuarioId.HasValue) return Unauthorized();
                var permissoes = await _permissao.ListarPermissoesAsync(usuarioId.Value);
                var publicos = permissoes.Where(p => p.Codigo == "artigo.ler.publico").ToList();
                var exclusivos = permissoes.Where(p => p.Codigo == "artigo.ler.exclusivo").ToList();
                var todosPublicos = publicos.Any(p => p.TemaId == null);
                var todosExclusivos = exclusivos.Any(p => p.TemaId == null);
                var temasPublicos = publicos.Where(p => p.TemaId.HasValue).Select(p => p.TemaId!.Value).ToList();
                var temasExclusivos = exclusivos.Where(p => p.TemaId.HasValue).Select(p => p.TemaId!.Value).ToList();
                consulta = consulta.Where(a =>
                    (a.Visibilidade == "PUBLICO" && (todosPublicos || temasPublicos.Contains(a.TemaId))) ||
                    (a.Visibilidade == "EXCLUSIVO" && (todosExclusivos || temasExclusivos.Contains(a.TemaId))));
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
                    Autor = a.AutorUsuario.Nome,
                    a.TemaId
                })
                .ToListAsync();

            return Ok(artigos);
        }

        // ============================================================
        // CRIAR ARTIGO
        // POST: api/Artigos
        // ============================================================

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CriarArtigo(
            [FromBody] ArtigoRequest dados)
        {
            if (string.IsNullOrWhiteSpace(dados.Titulo) ||
                string.IsNullOrWhiteSpace(dados.Conteudo) ||
                dados.Titulo.Trim().Length > 200 || (dados.Resumo?.Length ?? 0) > 500)
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

            if (tema == null || !tema.Ativo)
                return BadRequest("O tema informado não existe ou está inativo.");

            if (!await _permissao.TemPermissaoAsync(User, "artigo.criar", tema.TemaId))
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


        [HttpPut("{id:guid}")]
        [Authorize]
        public async Task<IActionResult> EditarArtigo(Guid id, [FromBody] ArtigoRequest dados)
        {
            var usuarioId = ObterUsuarioId();
            if (!usuarioId.HasValue) return Unauthorized();
            var artigo = await _context.Artigos.FirstOrDefaultAsync(a => a.ArtigoId == id);
            if (artigo == null) return NotFound("Artigo não encontrado.");
            if (!await PodeAlterarAsync(artigo, "artigo.editar", usuarioId.Value)) return Forbid();
            if (!await _permissao.TemPermissaoAsync(User, "artigo.editar", dados.TemaId)) return Forbid();
            if (artigo.Status != "RASCUNHO" &&
                !(artigo.Status == "EM_REVISAO" && await _permissao.TemPermissaoAsync(User, "artigo.revisar", artigo.TemaId)))
                return BadRequest("Não é possível editar o artigo neste status.");
            if (!await _context.Temas.AnyAsync(t => t.TemaId == dados.TemaId && t.Ativo))
                return BadRequest("Tema inexistente ou inativo.");
            if (string.IsNullOrWhiteSpace(dados.Titulo) || string.IsNullOrWhiteSpace(dados.Conteudo) ||
                dados.Titulo.Trim().Length > 200 || (dados.Resumo?.Length ?? 0) > 500)
                return BadRequest("Título ou conteúdo inválido, ou tamanho excedido.");
            if (dados.Visibilidade != "PUBLICO" && dados.Visibilidade != "EXCLUSIVO")
                return BadRequest("Visibilidade inválida.");
            artigo.TemaId = dados.TemaId;
            artigo.Titulo = dados.Titulo.Trim();
            artigo.Resumo = dados.Resumo;
            artigo.Conteudo = dados.Conteudo;
            artigo.Visibilidade = dados.Visibilidade;
            artigo.DataAtualizacao = DateTime.UtcNow;
            await SalvarAlteracaoComRevogacaoIAAsync(artigo);
            await _auditoria.RegistrarAsync(usuarioId.Value, "ARTIGO_EDITADO", "ARTIGO", artigo.ArtigoId,
                HttpContext.Connection.RemoteIpAddress?.ToString(), "Artigo editado: " + artigo.Titulo);
            return Ok(new { mensagem = "Artigo atualizado com sucesso.", artigo.ArtigoId, artigo.Titulo, artigo.Status });
        }

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

            var bloqueio = await VerificarLeituraAsync(artigo.Status, artigo.Visibilidade, artigo.TemaId);
            if (bloqueio != null) return bloqueio;

            return Ok(artigo);
        }

        // ============================================================
        // ARQUIVAR ARTIGO
        // DELETE: api/Artigos/{id}
        // ============================================================

        [HttpDelete("{id:guid}")]
        [Authorize]
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

            if (!await _permissao.TemPermissaoAsync(User, "artigo.arquivar", artigo.TemaId))
                return Forbid();

            bool revisa = await _permissao.TemPermissaoAsync(User, "artigo.revisar", artigo.TemaId);
            if (!revisa && (artigo.AutorUsuarioId != usuarioId.Value || artigo.Status != "RASCUNHO"))
                return Forbid();

            artigo.Status = "ARQUIVADO";
            artigo.DataAtualizacao = DateTime.UtcNow;

            await SalvarAlteracaoComRevogacaoIAAsync(artigo);

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
        [Authorize]
        public async Task<IActionResult> EnviarParaRevisao(Guid id)
        {
            var artigo = await _context.Artigos
                .FirstOrDefaultAsync(a => a.ArtigoId == id);

            if (artigo == null)
                return NotFound("Artigo não encontrado.");

            var autorId = ObterUsuarioId();

            if (autorId == null)
                return Unauthorized("Usuário do token inválido.");

            if (!await PodeAlterarAsync(artigo, "artigo.enviar.revisao", autorId.Value))
                return Forbid();

            if (artigo.Status != "RASCUNHO")
            {
                return BadRequest(
                    "Somente artigos em RASCUNHO podem ser enviados para revisão.");
            }

            artigo.Status = "EM_REVISAO";
            artigo.DataAtualizacao = DateTime.UtcNow;

            await SalvarAlteracaoComRevogacaoIAAsync(artigo);

            await _auditoria.RegistrarAsync(autorId.Value, "ARTIGO_ENVIADO_REVISAO", "ARTIGO",
                artigo.ArtigoId, HttpContext.Connection.RemoteIpAddress?.ToString(),
                "Artigo enviado para revisão: " + artigo.Titulo);

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
        [Authorize]
        public async Task<IActionResult> GetArtigosPendentes()
        {
            var consulta = await FiltrarPorPermissaoAsync(_context.Artigos.AsNoTracking(), "artigo.revisar");
            if (consulta == null) return Forbid();
            var artigos = await consulta
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
                    Autor = a.AutorUsuario.Nome,
                    a.TemaId,
                    a.Status,
                    a.AutorUsuarioId,
                })
                .ToListAsync();

            return Ok(artigos);
        }

        // ============================================================
        // APROVAR ARTIGO
        // POST: api/Artigos/{id}/aprovar
        // ============================================================

        [HttpPost("{id:guid}/aprovar")]
        [Authorize]
        public async Task<IActionResult> AprovarArtigo(
            Guid id,
            [FromBody] RevisaoRequest dados)
        {
            var artigo = await _context.Artigos
                .FirstOrDefaultAsync(a => a.ArtigoId == id);

            if (artigo == null)
                return NotFound("Artigo não encontrado.");

            if (!await _permissao.TemPermissaoAsync(User, "artigo.aprovar", artigo.TemaId))
                return Forbid();

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

            await SalvarAlteracaoComRevogacaoIAAsync(artigo);

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
        [Authorize]
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

            if (!await _permissao.TemPermissaoAsync(User, "artigo.rejeitar", artigo.TemaId))
                return Forbid();

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

            await SalvarAlteracaoComRevogacaoIAAsync(artigo);

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
        [Authorize]
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

            if (!await _permissao.TemPermissaoAsync(User, "artigo.solicitar.ajustes", artigo.TemaId))
                return Forbid();

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

            await SalvarAlteracaoComRevogacaoIAAsync(artigo);

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
        [Authorize]
        public async Task<IActionResult> GetHistorico(Guid id)
        {
            var artigo = await _context.Artigos.AsNoTracking().FirstOrDefaultAsync(a => a.ArtigoId == id);
            if (artigo == null) return NotFound("Artigo não encontrado.");
            if (!await _permissao.TemPermissaoAsync(User, "artigo.revisar", artigo.TemaId))
                return Forbid();

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
        [Authorize]
        public async Task<IActionResult> PublicarArtigo(Guid id)
        {
            var usuarioId = ObterUsuarioId();

            if (usuarioId == null)
                return Unauthorized("Usuário do token inválido.");

            var artigo = await _context.Artigos
                .FirstOrDefaultAsync(a => a.ArtigoId == id);

            if (artigo == null)
                return NotFound("Artigo não encontrado.");

            if (!await _permissao.TemPermissaoAsync(User, "artigo.publicar", artigo.TemaId))
                return Forbid();

            if (artigo.Status != "APROVADO")
            {
                return BadRequest(
                    "Somente artigos aprovados podem ser publicados.");
            }

            artigo.Status = "PUBLICADO";
            artigo.DataPublicacao = DateTime.UtcNow;
            artigo.DataAtualizacao = DateTime.UtcNow;

            await SalvarAlteracaoComRevogacaoIAAsync(artigo);

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

        // Salva a alteração e invalida a autorização e o cache na mesma transação.
        private async Task SalvarAlteracaoComRevogacaoIAAsync(Artigo artigo)
        {
            var usuarioId = ObterUsuarioId();
            var agora = DateTime.UtcNow;

            await using var transacao = await _context.Database.BeginTransactionAsync();

            await _context.SaveChangesAsync();

            var revogados = await _context.Artigos
                .Where(a => a.ArtigoId == artigo.ArtigoId &&
                    (a.AutorizadoIA || a.HashAutorizacaoIA != null))
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(a => a.AutorizadoIA, false)
                    .SetProperty(a => a.HashAutorizacaoIA, (string?)null)
                    .SetProperty(a => a.DataRevogacaoIA, (DateTime?)agora));

            await _context.ResumoInteligentes
                .Where(r => r.ArtigoId == artigo.ArtigoId)
                .ExecuteDeleteAsync();

            if (revogados > 0)
            {
                await _auditoria.RegistrarAsync(usuarioId, "ARTIGO_REVOGADO_IA", "ARTIGO",
                    artigo.ArtigoId, HttpContext.Connection.RemoteIpAddress?.ToString(),
                    "Autorização de IA revogada automaticamente por alteração do artigo: " + artigo.Titulo);
            }

            await transacao.CommitAsync();
        }

        private Guid? ObterUsuarioId() => _permissao.ObterUsuarioId(User);

        private async Task<bool> PodeAlterarAsync(Artigo artigo, string codigo, Guid usuarioId)
        {
            if (!await _permissao.TemPermissaoAsync(User, codigo, artigo.TemaId)) return false;
            return artigo.AutorUsuarioId == usuarioId ||
                await _permissao.TemPermissaoAsync(User, "artigo.revisar", artigo.TemaId);
        }

        private async Task<IActionResult?> VerificarLeituraAsync(string status, string visibilidade, Guid temaId)
        {
            if (status == "ARQUIVADO") return NotFound();
            bool autenticado = User.Identity?.IsAuthenticated == true;
            if (status == "PUBLICADO")
            {
                if (visibilidade != "PUBLICO" && visibilidade != "EXCLUSIVO") return Forbid();
                if (!autenticado) return visibilidade == "PUBLICO" ? null : Unauthorized();
                var codigo = visibilidade == "PUBLICO" ? "artigo.ler.publico" : "artigo.ler.exclusivo";
                return await _permissao.TemPermissaoAsync(User, codigo, temaId) ? null : Forbid();
            }
            if (!autenticado) return Unauthorized();
            if (await _permissao.TemPermissaoAsync(User, "artigo.ler.rascunho", temaId) ||
                await _permissao.TemPermissaoAsync(User, "artigo.revisar", temaId)) return null;
            return Forbid();
        }

        private async Task<IQueryable<Artigo>?> FiltrarPorPermissaoAsync(IQueryable<Artigo> consulta, string codigo)
        {
            var usuarioId = ObterUsuarioId();
            if (!usuarioId.HasValue) return null;
            var permissoes = (await _permissao.ListarPermissoesAsync(usuarioId.Value))
                .Where(p => p.Codigo == codigo).ToList();
            if (permissoes.Any(p => p.TemaId == null)) return consulta;
            var temas = permissoes.Where(p => p.TemaId.HasValue).Select(p => p.TemaId!.Value).ToList();
            return temas.Count == 0 ? null : consulta.Where(a => temas.Contains(a.TemaId));
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

        // Aceita anexos antigos e novos, somente dentro das pastas de artigos.
        private string? ObterCaminhoSeguroArquivo(string caminhoRelativo)
        {
            if (string.IsNullOrWhiteSpace(caminhoRelativo)) return null;
            var relativo = caminhoRelativo.Replace('\\', '/');
            var partes = relativo.Split('/');
            bool novo = partes.Length == 4 && partes[0] == "App_Data" && partes[1] == "arquivos" && partes[2] == "artigos";
            bool antigo = partes.Length == 3 && partes[0] == "arquivos" && partes[1] == "artigos";
            if (!novo && !antigo) return null;
            var nome = partes[^1];
            if (string.IsNullOrWhiteSpace(nome) || nome == "." || nome == ".." || nome.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0) return null;
            var privado = Path.Combine(_ambiente.ContentRootPath, "App_Data", "arquivos", "artigos", nome);
            if (novo || System.IO.File.Exists(privado)) return privado;
            return Path.Combine(_ambiente.ContentRootPath, "wwwroot", "arquivos", "artigos", nome);
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
