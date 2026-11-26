import { useEffect, useState, useRef } from "react";

import {
  useNavigate,
  useLocation,
  useSearchParams
} from "react-router-dom";
import RespostaIA from "../../components/RespostaIA/RespostaIA";
import {
  Bookmark,
  BookmarkCheck,
  LoaderCircle,
  Sparkles,
  Copy,
  X
} from "lucide-react";

import DOMPurify from "dompurify";

import { requisicaoApi } from "../../services/api";
import usePermissoes from "../../hooks/usePermissoes";

import { classeCorTema } from "../../utils/coresTemas";

import "../../styles/coresTemas.css";
import "./detalheconteudo.css";

import Pessoa from "../../assets/Icones/Pessoa.png";
import Relogio from "../../assets/Icones/Relogio.png";

function DetalheConteudo() {

  const navigate = useNavigate();
  const location = useLocation();

  const [searchParams] = useSearchParams();

  // =========================================
  // PERMISSÕES DINÂMICAS
  // =========================================

  const {
    autenticado,
    temPermissao,
    carregando: carregandoPermissoes,
    erro: erroPermissoes
  } = usePermissoes();

  const token = localStorage.getItem("token");

  const podeGerenciarFavoritos =
    autenticado &&
    !carregandoPermissoes &&
    !erroPermissoes &&
    temPermissao("favorito.gerenciar.proprios");

  const podeRegistrarHistorico =
    autenticado &&
    !carregandoPermissoes &&
    !erroPermissoes &&
    temPermissao("historico.leitura.gerenciar.proprio");

  // =========================================
  // IDENTIFICAR ARTIGO
  // =========================================

  const artigoRecebido = location.state?.conteudo;

  const artigoId =
    searchParams.get("id") ||
    artigoRecebido?.artigoId ||
    artigoRecebido?.id ||
    null;

  // =========================================
  // ESTADOS
  // =========================================

  const [artigo, setArtigo] = useState(null);

  const [carregando, setCarregando] = useState(true);

  const [erro, setErro] = useState("");

  const [baixandoArquivo, setBaixandoArquivo] =
    useState(false);

  // =========================================
  // ESTADOS DOS FAVORITOS
  // =========================================

  const [favoritado, setFavoritado] = useState(false);

  const [carregandoFavorito, setCarregandoFavorito] =
    useState(true);

  const [salvandoFavorito, setSalvandoFavorito] =
    useState(false);

  const [erroFavorito, setErroFavorito] =
    useState("");

  const [mensagemFavorito, setMensagemFavorito] =
    useState("");

  const [tentativaFavorito, setTentativaFavorito] =
    useState(0);

  const [chaveFavoritoCarregado, setChaveFavoritoCarregado] =
    useState(null);

  const favoritoEmProcessamento = useRef(null);

  const historicoRegistrado = useRef(null);

  const componenteAtivo = useRef(false);

  const contextoAtual = useRef(null);

  const chaveContexto = `${token || ""}:${artigoId || ""}`;

  contextoAtual.current = chaveContexto;

  useEffect(() => {

    componenteAtivo.current = true;

    return () => {
      componenteAtivo.current = false;
    };

  }, []);

  // =========================================
  // CARREGAR ARTIGO DIRETAMENTE DA API
  // =========================================

  useEffect(() => {

    let ativo = true;

    setArtigo(null);
    setErro("");

    if (carregandoPermissoes) {
      setCarregando(true);
      return;
    }

    if (erroPermissoes) {

      setCarregando(false);

      setErro(
        "Não foi possível verificar suas permissões."
      );

      return;
    }

    if (!artigoId) {

      setCarregando(false);

      setErro(
        "Nenhum conteúdo foi selecionado."
      );

      return;
    }

    async function carregarArtigo() {

      try {

        setCarregando(true);

        const dados = await requisicaoApi(
          `/api/Artigos/${encodeURIComponent(artigoId)}`
        );

        if (!ativo) return;

        if (!dados) {
          throw new Error("Conteúdo não encontrado.");
        }

        const artigoNormalizado = {

          artigoId:
            dados.artigoId ??
            dados.ArtigoId ??
            artigoId,

          titulo:
            dados.titulo ??
            dados.Titulo,

          temaId:
            dados.temaId ??
            dados.TemaId,

          tema:
            dados.tema ??
            dados.Tema,

          autor:
            dados.autor ??
            dados.Autor,

          resumo:
            dados.resumo ??
            dados.Resumo,

          conteudo:
            dados.conteudo ??
            dados.Conteudo,

          status:
            dados.status ??
            dados.Status,

          visibilidade:
            dados.visibilidade ??
            dados.Visibilidade,

          dataCriacao:
            dados.dataCriacao ??
            dados.DataCriacao,

          dataPublicacao:
            dados.dataPublicacao ??
            dados.DataPublicacao,

          nomeArquivo:
            dados.nomeArquivo ??
            dados.NomeArquivo,

          tamanhoArquivo:
            dados.tamanhoArquivo ??
            dados.TamanhoArquivo,

          temArquivo:
            dados.temArquivo ??
            dados.TemArquivo ??
            Boolean(
              dados.nomeArquivo ??
              dados.NomeArquivo
            ),

          topicos:
            dados.topicos ??
            dados.Topicos ??
            []
        };

        // =====================================
        // VALIDAR PERMISSÃO DE LEITURA
        // =====================================

        const status = String(
          artigoNormalizado.status || ""
        ).trim().toUpperCase();

        const visibilidade = String(
          artigoNormalizado.visibilidade || ""
        ).trim().toUpperCase();

        const temaId = artigoNormalizado.temaId;

        let permitido = false;

        if (status === "PUBLICADO") {

          if (
            visibilidade === "PUBLICO" ||
            visibilidade === "PUBLICA"
          ) {

            permitido =
              !autenticado ||
              temPermissao(
                "artigo.ler.publico",
                temaId
              );

          } else if (visibilidade === "EXCLUSIVO") {

            permitido =
              autenticado &&
              temPermissao(
                "artigo.ler.exclusivo",
                temaId
              );
          }

        } else if (
          status &&
          status !== "ARQUIVADO"
        ) {

          permitido =
            autenticado &&
            (
              temPermissao(
                "artigo.ler.rascunho",
                temaId
              ) ||

              temPermissao(
                "artigo.revisar",
                temaId
              )
            );
        }

        if (!permitido) {

          throw new Error(
            "Você não possui permissão para visualizar este conteúdo."
          );
        }

        setArtigo({
          ...artigoNormalizado,
          chaveContexto
        });

      } catch (error) {

        if (!ativo) return;

        console.error(
          "Erro ao carregar artigo:",
          error
        );

        setArtigo(null);

        setErro(
          error.message ||
          "Não foi possível carregar o conteúdo."
        );

      } finally {

        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarArtigo();

    return () => {
      ativo = false;
    };

  }, [
    artigoId,
    token,
    autenticado,
    carregandoPermissoes,
    erroPermissoes,
    temPermissao,
    chaveContexto
  ]);

  // =========================================
  // VERIFICAR SE O ARTIGO ESTÁ PUBLICADO
  // =========================================

  const artigoAtual =
    artigo &&
    artigo.chaveContexto === chaveContexto;

  const artigoPublicado =
    Boolean(artigoAtual) &&
    String(
      artigo.status || ""
    ).trim().toUpperCase() === "PUBLICADO";

  const idArtigoCarregado = artigoAtual
    ? artigo.artigoId
    : null;

  const exibirFavoritos =
    podeGerenciarFavoritos &&
    artigoPublicado &&
    !carregando &&
    !erro;

  // =========================================
  // CONSULTAR STATUS DO FAVORITO
  // =========================================

  useEffect(() => {

    let ativo = true;

    setFavoritado(false);
    setErroFavorito("");
    setMensagemFavorito("");
    setSalvandoFavorito(false);
    setChaveFavoritoCarregado(null);

    if (!exibirFavoritos || !idArtigoCarregado) {

      setCarregandoFavorito(false);

      return;
    }

    async function consultarFavorito() {

      try {

        setCarregandoFavorito(true);

        const dados = await requisicaoApi(
          `/api/Favoritos/${encodeURIComponent(idArtigoCarregado)}/status`
        );

        if (
          !ativo ||
          contextoAtual.current !== chaveContexto ||
          localStorage.getItem("token") !== token
        ) return;

        const status =
          dados?.favoritado ??
          dados?.Favoritado;

        if (typeof status !== "boolean") {
          throw new Error(
            "Resposta inválida ao consultar favorito."
          );
        }

        setFavoritado(status);

        setChaveFavoritoCarregado(chaveContexto);

      } catch (error) {

        if (!ativo) return;

        console.error(
          "Erro ao consultar favorito:",
          error
        );

        setErroFavorito(
          "Não foi possível consultar o favorito."
        );

      } finally {

        if (ativo) {
          setCarregandoFavorito(false);
        }
      }
    }

    consultarFavorito();

    return () => {
      ativo = false;
    };

  }, [
    exibirFavoritos,
    idArtigoCarregado,
    chaveContexto,
    token,
    tentativaFavorito
  ]);

  // =========================================
  // FAVORITAR OU DESFAVORITAR ARTIGO
  // =========================================

  async function alternarFavorito() {

    if (
      !exibirFavoritos ||
      !idArtigoCarregado ||
      carregandoFavorito ||
      salvandoFavorito ||
      chaveFavoritoCarregado !== chaveContexto ||
      favoritoEmProcessamento.current === chaveContexto ||
      localStorage.getItem("token") !== token
    ) return;

    const chaveOperacao = chaveContexto;

    favoritoEmProcessamento.current = chaveOperacao;

    try {

      setSalvandoFavorito(true);
      setErroFavorito("");
      setMensagemFavorito("");

      const dados = await requisicaoApi(
        `/api/Favoritos/${encodeURIComponent(idArtigoCarregado)}`,
        {
          method: favoritado
            ? "DELETE"
            : "POST"
        }
      );

      if (
        !componenteAtivo.current ||
        contextoAtual.current !== chaveOperacao ||
        localStorage.getItem("token") !== token
      ) return;

      const novoStatus =
        dados?.favoritado ??
        dados?.Favoritado;

      if (typeof novoStatus !== "boolean") {

        throw new Error(
          "Não foi possível confirmar a alteração."
        );
      }

      setFavoritado(novoStatus);

      setMensagemFavorito(
        novoStatus
          ? "Artigo salvo nos seus favoritos."
          : "Artigo removido dos seus favoritos."
      );

    } catch (error) {

      if (
        !componenteAtivo.current ||
        contextoAtual.current !== chaveOperacao
      ) return;

      console.error(
        "Erro ao alterar favorito:",
        error
      );

      setErroFavorito(
        error.message ||
        "Não foi possível alterar o favorito."
      );

    } finally {

      if (
        favoritoEmProcessamento.current ===
        chaveOperacao
      ) {

        favoritoEmProcessamento.current = null;
      }

      if (
        componenteAtivo.current &&
        contextoAtual.current === chaveOperacao
      ) {

        setSalvandoFavorito(false);
      }
    }
  }

  // =========================================
  // REGISTRAR HISTÓRICO AUTOMATICAMENTE
  // =========================================

  useEffect(() => {

    if (
      !podeRegistrarHistorico ||
      !artigoPublicado ||
      !idArtigoCarregado ||
      carregando ||
      erro ||
      !token
    ) return;

    const chaveLeitura = chaveContexto;

    // Evita registrar duas vezes durante
    // a mesma abertura do artigo.

    if (
      historicoRegistrado.current === chaveLeitura
    ) return;

    historicoRegistrado.current = chaveLeitura;

    async function registrarLeitura() {

      try {

        if (
          localStorage.getItem("token") !== token
        ) return;

        await requisicaoApi(
          `/api/HistoricoLeitura/${encodeURIComponent(idArtigoCarregado)}`,
          {
            method: "POST"
          }
        );

      } catch (error) {

        console.error(
          "Erro ao registrar histórico de leitura:",
          error
        );

        if (
          historicoRegistrado.current === chaveLeitura
        ) {
          historicoRegistrado.current = null;
        }
      }
    }

    registrarLeitura();

  }, [
    podeRegistrarHistorico,
    artigoPublicado,
    idArtigoCarregado,
    carregando,
    erro,
    chaveContexto,
    token
  ]);

  // =========================================
  // MANTER ID NA URL
  // =========================================

  useEffect(() => {

    if (
      artigoId &&
      !searchParams.get("id")
    ) {

      navigate(
        `/conteudos/detalhes?id=${encodeURIComponent(artigoId)}`,
        {
          replace: true,
          state: location.state
        }
      );
    }

  }, [
    artigoId,
    searchParams,
    navigate,
    location.state
  ]);

  // =========================================
  // FORMATAÇÃO DE DATA
  // =========================================

  function formatarData(data) {

    if (!data) {
      return "Não informada";
    }

    const dataFormatada = new Date(data);

    if (isNaN(dataFormatada.getTime())) {
      return "Não informada";
    }

    return dataFormatada.toLocaleDateString(
      "pt-BR"
    );
  }

  // =========================================
  // FORMATAÇÃO DO STATUS
  // =========================================

  function formatarStatus(status) {

    const statusFormatados = {
      RASCUNHO: "Rascunho",
      EM_REVISAO: "Em revisão",
      APROVADO: "Aprovado",
      REJEITADO: "Rejeitado",
      PUBLICADO: "Publicado",
      ARQUIVADO: "Arquivado"
    };

    return statusFormatados[
      String(status || "").toUpperCase()
    ] || status || "Não informado";
  }

  // =========================================
  // FORMATAÇÃO DA VISIBILIDADE
  // =========================================

  function formatarVisibilidade(visibilidade) {

    const visibilidades = {
      PUBLICO: "Público",
      PUBLICA: "Público",
      EXCLUSIVO: "Exclusivo"
    };

    return visibilidades[
      String(
        visibilidade || ""
      ).toUpperCase()
    ] || visibilidade || "Não informada";
  }

  // =========================================
  // FORMATAÇÃO DO TAMANHO DO ARQUIVO
  // =========================================

  function formatarTamanho(tamanho) {

    const bytes = Number(tamanho);

    if (
      tamanho == null ||
      !Number.isFinite(bytes) ||
      bytes < 0
    ) {
      return "";
    }

    if (bytes >= 1024 * 1024) {

      return (
        (bytes / (1024 * 1024)).toFixed(2) +
        " MB"
      );
    }

    return (
      (bytes / 1024).toFixed(2) +
      " KB"
    );
  }

  // =========================================
  // BAIXAR DOCUMENTO
  // =========================================

  async function baixarArquivo() {

    if (
      !artigoAtual ||
      !artigo.temArquivo ||
      baixandoArquivo
    ) {
      return;
    }

    let urlTemporaria = null;

    try {

      setBaixandoArquivo(true);

      const tokenAtual =
        localStorage.getItem("token");

      const API_URL = (
        import.meta.env.VITE_API_URL ||
        "https://localhost:7249"
      ).replace(/\/+$/, "");

      const headers = {};

      if (tokenAtual) {

        headers.Authorization =
          `Bearer ${tokenAtual}`;
      }

      const resposta = await fetch(
        `${API_URL}/api/Artigos/${encodeURIComponent(artigo.artigoId)}/arquivo`,
        {
          method: "GET",
          headers
        }
      );

      if (!resposta.ok) {

        const mensagem =
          await resposta.text();

        throw new Error(
          mensagem ||
          "Não foi possível baixar o documento."
        );
      }

      const arquivoBlob =
        await resposta.blob();

      urlTemporaria =
        window.URL.createObjectURL(arquivoBlob);

      const link =
        document.createElement("a");

      link.href = urlTemporaria;

      link.download =
        artigo.nomeArquivo ||
        "documento";

      document.body.appendChild(link);

      link.click();
      link.remove();

    } catch (error) {

      console.error(
        "Erro ao baixar documento:",
        error
      );

      alert(
        error.message ||
        "Erro ao baixar o documento."
      );

    } finally {

      if (urlTemporaria) {

        const url = urlTemporaria;

        setTimeout(() => {

          window.URL.revokeObjectURL(url);

        }, 1000);
      }

      setBaixandoArquivo(false);
    }
  }

  // =========================================
  // VOLTAR PARA CONTEÚDOS
  // =========================================

  function voltar() {

    if (
      autenticado &&
      location.state?.origem === "/assistente-ia" &&
      (temPermissao("ia.consultar") || temPermissao("ia.gerenciar.artigos"))
    ) {
      navigate("/assistente-ia");
      return;
    }


    if (
      autenticado &&
      location.state?.origem === "/conteudos/revisao"
    ) {

      navigate("/conteudos/revisao");

      return;
    }

    if (
      autenticado &&
      location.state?.origem === "/minha-biblioteca" &&
      (
        podeGerenciarFavoritos ||
        podeRegistrarHistorico
      )
    ) {

      navigate("/minha-biblioteca");

      return;
    }

    navigate(
      autenticado
        ? "/conteudos"
        : "/portal"
    );
  }

  // =========================================
  // RENDERIZAÇÃO
  // =========================================

  return (

    <div className="pagina-detalhe-conteudo">

      <section className="detalhe-revisao">

        {/* BOTÃO VOLTAR */}

        <button
          type="button"
          className="botao-voltar"
          onClick={voltar}
        >
          <span className="seta-voltar">
            ←
          </span>

          <span>
            Voltar
          </span>
        </button>

        {/* CARREGAMENTO */}

        {carregando || carregandoPermissoes ? (

          <div
            className="detalhe-carregando"
            role="status"
          >
            Carregando conteúdo...
          </div>

        ) : erro || !artigoAtual ? (

          <div
            className="detalhe-erro"
            role="alert"
          >

            <h2>
              Conteúdo indisponível
            </h2>

            <p>
              {erro ||
                "Conteúdo não encontrado."}
            </p>

            <button
              type="button"
              className="detalhe-botao-retornar"
              onClick={voltar}
            >
              Voltar aos conteúdos
            </button>

          </div>

        ) : (

          <div className="area-artigo">

            {/* ARTIGO PRINCIPAL */}

            <article className="artigo">

              <h1>
                {artigo.titulo || "Sem título"}
              </h1>

              {/* TEMA E FAVORITO */}

              <div className="detalhe-acoes-artigo">

                <span
                  className={`categoria-artigo ${classeCorTema(
                    artigo.tema
                  )}`}
                >
                  {artigo.tema ||
                    "Tema não informado"}
                </span>

                {exibirFavoritos && (

                  <button
                    type="button"
                    className={`detalhe-botao-favorito ${favoritado &&
                        chaveFavoritoCarregado === chaveContexto
                        ? "detalhe-favorito-ativo"
                        : ""
                      }`}
                    onClick={alternarFavorito}
                    disabled={
                      carregandoFavorito ||
                      salvandoFavorito ||
                      chaveFavoritoCarregado !== chaveContexto
                    }
                    aria-pressed={
                      favoritado &&
                      chaveFavoritoCarregado === chaveContexto
                    }
                  >

                    {carregandoFavorito ||
                      salvandoFavorito ? (

                      <LoaderCircle
                        size={19}
                        className="detalhe-favorito-loading"
                        aria-hidden="true"
                      />

                    ) : favoritado ? (

                      <BookmarkCheck
                        size={19}
                        aria-hidden="true"
                      />

                    ) : (

                      <Bookmark
                        size={19}
                        aria-hidden="true"
                      />

                    )}

                    <span>

                      {carregandoFavorito
                        ? "Carregando..."
                        : salvandoFavorito
                          ? "Salvando..."
                          : favoritado &&
                            chaveFavoritoCarregado === chaveContexto
                            ? "Favoritado"
                            : "Favoritar"}

                    </span>

                  </button>

                )}

              </div>

              {/* MENSAGEM DOS FAVORITOS */}

              {exibirFavoritos && erroFavorito && (

                <div
                  className="detalhe-favorito-erro"
                  role="alert"
                >

                  <span>{erroFavorito}</span>

                  <button
                    type="button"
                    onClick={() =>
                      setTentativaFavorito(
                        valor => valor + 1
                      )
                    }
                    disabled={salvandoFavorito}
                  >
                    Tentar novamente
                  </button>

                </div>

              )}

              {exibirFavoritos &&
                mensagemFavorito &&
                !erroFavorito && (

                  <p
                    className="detalhe-favorito-mensagem"
                    role="status"
                  >
                    {mensagemFavorito}
                  </p>

                )}

              {/* DATA E AUTOR */}

              <div className="informacoes-artigo">

                <span>

                  <img src={Relogio} alt="" />

                  {artigo.dataPublicacao
                    ? "Publicado em "
                    : "Criado em "}

                  {formatarData(
                    artigo.dataPublicacao ||
                    artigo.dataCriacao
                  )}

                </span>

                <span>

                  <img src={Pessoa} alt="" />

                  Por{" "}

                  {artigo.autor ||
                    "Autor não informado"}

                </span>

              </div>

              {/* STATUS E VISIBILIDADE */}

              <div className="informacoes-artigo">

                <span>

                  <strong>Status:</strong>

                  {formatarStatus(artigo.status)}

                </span>

                <span>

                  <strong>Visibilidade:</strong>

                  {formatarVisibilidade(
                    artigo.visibilidade
                  )}

                </span>

              </div>

              {/* RESUMO */}

              {artigo.resumo && (

                <div className="resumo-artigo">

                  <h2>Resumo</h2>

                  <p>{artigo.resumo}</p>

                </div>

              )}

              {/* RESUMO INTELIGENTE */}

              {autenticado && token && !erroPermissoes &&
                temPermissao("ia.resumir.artigo") &&
                artigoPublicado &&
                String(artigo.visibilidade || "").trim().toUpperCase() === "PUBLICO" && (
                  <ResumoInteligente
                    key={chaveContexto}
                    artigoId={idArtigoCarregado}
                    token={token}
                  />
                )}

              {/* CONTEÚDO FORMATADO */}

              <div className="texto-artigo">

                <h2>Conteúdo</h2>

                <div
                  className="conteudo-formatado"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      artigo.conteudo ||
                      "Nenhum conteúdo informado."
                    )
                  }}
                />

              </div>

              {/* DOCUMENTO ANEXADO */}

              {artigo.temArquivo && (

                <div className="documento-anexado">

                  <h2>Documento anexado</h2>

                  <div className="documento-anexado-info">

                    <div>

                      <strong>
                        {artigo.nomeArquivo ||
                          "Documento"}
                      </strong>

                      {artigo.tamanhoArquivo != null && (

                        <span>

                          {formatarTamanho(
                            artigo.tamanhoArquivo
                          )}

                        </span>

                      )}

                    </div>

                    <button
                      type="button"
                      onClick={baixarArquivo}
                      disabled={baixandoArquivo}
                    >

                      {baixandoArquivo
                        ? "Baixando..."
                        : "Baixar documento"}

                    </button>

                  </div>

                </div>

              )}

              {/* TÓPICOS */}

              {Array.isArray(artigo.topicos) &&
                artigo.topicos.length > 0 && (

                  <div className="topicos-artigo">

                    <h2>Tópicos abordados</h2>

                    <ul>

                      {artigo.topicos.map(
                        (topico, index) => (

                          <li key={index}>
                            {topico}
                          </li>

                        )
                      )}

                    </ul>

                  </div>

                )}

            </article>

            {/* INFORMAÇÕES COMPLEMENTARES */}

            <aside className="area-documentos">

              <h2>
                Informações do conteúdo
              </h2>

              {/* STATUS */}

              <div className="documento">

                <div className="informacao-documento">

                  <strong>Status</strong>

                  <span>
                    {formatarStatus(artigo.status)}
                  </span>

                </div>

              </div>

              {/* VISIBILIDADE */}

              <div className="documento">

                <div className="informacao-documento">

                  <strong>Visibilidade</strong>

                  <span>

                    {formatarVisibilidade(
                      artigo.visibilidade
                    )}

                  </span>

                </div>

              </div>

              {/* DATA DE CRIAÇÃO */}

              {artigo.dataCriacao && (

                <div className="documento">

                  <div className="informacao-documento">

                    <strong>Data de criação</strong>

                    <span>
                      {formatarData(artigo.dataCriacao)}
                    </span>

                  </div>

                </div>

              )}

              {/* DATA DE PUBLICAÇÃO */}

              {artigo.dataPublicacao && (

                <div className="documento">

                  <div className="informacao-documento">

                    <strong>Data de publicação</strong>

                    <span>

                      {formatarData(
                        artigo.dataPublicacao
                      )}

                    </span>

                  </div>

                </div>

              )}

              {/* FAVORITO */}

              {exibirFavoritos &&
                chaveFavoritoCarregado === chaveContexto && (

                  <div className="documento">

                    <div className="informacao-documento">

                      <strong>Meus favoritos</strong>

                      <span
                        className={
                          favoritado
                            ? "detalhe-status-favoritado"
                            : ""
                        }
                      >

                        {favoritado
                          ? "Artigo salvo"
                          : "Artigo não salvo"}

                      </span>

                    </div>

                  </div>

                )}

            </aside>

          </div>

        )}

      </section>

    </div>

  );
}

// =========================================
// RESUMO INTELIGENTE DO ARTIGO
// =========================================

function ResumoInteligente({ artigoId, token }) {
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);
  const ativo = useRef(false);
  const operacao = useRef(false);

  useEffect(() => {
    ativo.current = true;
    return () => { ativo.current = false; };
  }, []);

  function sessaoValida() {
    return ativo.current && localStorage.getItem("token") === token;
  }

  async function gerarResumo() {
    if (!artigoId || operacao.current || !sessaoValida()) return;
    if (aberto) {
      setAberto(false);
      setResultado(null);
      setErro("");
      setCopiado(false);
      return;
    }

    operacao.current = true;
    setCarregando(true);
    setErro("");
    setResultado(null);
    setCopiado(false);

    try {
      const dados = await requisicaoApi(
        `/api/InteligenciaArtificial/resumir/${encodeURIComponent(artigoId)}`,
        { method: "POST" }
      );
      if (!sessaoValida()) return;
      if (typeof dados?.resumo !== "string" || !dados.resumo.trim()) {
        throw new Error("A API não retornou um resumo válido.");
      }
      setResultado(dados);
      setAberto(true);
    } catch (error) {
      if (!sessaoValida()) return;
      setErro(error.message || "Não foi possível gerar o resumo inteligente.");
    } finally {
      operacao.current = false;
      if (sessaoValida()) setCarregando(false);
    }
  }

  async function copiarResumo() {
    if (!resultado?.resumo || !sessaoValida()) return;
    try {
      await navigator.clipboard.writeText(resultado.resumo);
      if (sessaoValida()) setCopiado(true);
    } catch {
      if (sessaoValida()) {
        setErro("Não foi possível copiar automaticamente. Selecione o texto para copiá-lo.");
      }
    }
  }

  return (
    <section className="detalhe-ia" aria-label="Resumo inteligente">

      <div className="detalhe-ia-topo">

        <div>
          <h2><Sparkles size={21} aria-hidden="true" /> Resumo inteligente
          </h2>

          <p>Entenda este artigo em linguagem simples. Disponível para conteúdos autorizados pela Certacon.

          </p>

        </div>

        <button type="button" className="detalhe-ia-botao"
          onClick={gerarResumo} disabled={carregando} aria-expanded={aberto}>
          {carregando ? <LoaderCircle size={18} className="detalhe-favorito-loading" aria-hidden="true" />
            : aberto ? <X size={18} aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
          {carregando ? "Gerando resumo..." : aberto ? "Ocultar resumo" : "Resumir com IA"}
        </button>

      </div>
      {carregando && <p className="detalhe-ia-info" role="status">Consultando a inteligência artificial...</p>}
      {erro && <p className="detalhe-ia-erro" role="alert">{erro}</p>}
      {aberto && resultado && (
        
        <div className="detalhe-ia-resultado" aria-live="polite">
          <div className="detalhe-ia-meta">
            <span>{resultado.origem === "CACHE" ? "Resumo armazenado" : "Gerado com inteligência artificial"}</span>
            {typeof resultado.consultasRestantes === "number" && <span>{resultado.consultasRestantes} consultas restantes</span>}
          </div>
          <div className="detalhe-ia-texto">
            <RespostaIA texto={resultado.resumo} />
          </div>

          <div className="detalhe-ia-rodape">
            <button type="button" className="detalhe-botao-favorito" onClick={copiarResumo}>
              <Copy size={16} aria-hidden="true" /> {copiado ? "Copiado!" : "Copiar resumo"}
            </button>
            <span role="status" className="detalhe-ia-info">{copiado ? "Resumo copiado." : ""}</span>
          </div>
          <p className="detalhe-ia-info">{resultado.aviso || "A IA pode cometer erros. Consulte o artigo original e a equipe fiscal."}</p>
        </div>
      )}
    </section>
  );
}

export default DetalheConteudo;