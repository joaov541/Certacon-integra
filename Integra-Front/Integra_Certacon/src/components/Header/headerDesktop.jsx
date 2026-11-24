import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./headerDesktop.css";

import { requisicaoApi } from "../../services/api";
import usePermissoes from "../../hooks/usePermissoes";
import LupaPesquisa from "../../assets/Icones/LupaPesquisa.png";

function HeaderDesktop({ mostrarPesquisa = true, pesquisaPersonalizada = null }) {
  const navigate = useNavigate();
  const { autenticado, temAlgumaPermissao, carregando } = usePermissoes();
  const podeLerArtigos = !autenticado || temAlgumaPermissao("artigo.ler.publico") || temAlgumaPermissao("artigo.ler.exclusivo");
  const podeLerNotas = autenticado && (temAlgumaPermissao("nota.ler.todas") || temAlgumaPermissao("nota.ler.proprias"));
  const pesquisaRef = useRef(null);

  const [usuario, setUsuario] = useState(null);
  const [fotoPerfil, setFotoPerfil] = useState(null);

  // Estados da pesquisa
  const [pesquisa, setPesquisa] = useState("");
  const [artigosEncontrados, setArtigosEncontrados] = useState([]);
  const [notasEncontradas, setNotasEncontradas] = useState([]);
  const [pesquisando, setPesquisando] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);

  // =========================================
  // CARREGAR USUÁRIO
  // =========================================

  useEffect(() => {
    let ativo = true;

    async function carregarUsuario() {
      try {
        const dados = await requisicaoApi("/api/MeuPerfil");
        if (ativo) setUsuario(dados);
      } catch (erro) {
        console.error(
          "Erro ao carregar usuário do HeaderDesktop:",
          erro
        );
      }
    }

    carregarUsuario();

    return () => {
      ativo = false;
    };
  }, []);

  // =========================================
  // CARREGAR FOTO DE PERFIL
  // =========================================

  useEffect(() => {
    let ativo = true;

    async function carregarFoto() {
      try {
        const dados = await requisicaoApi("/api/FotoPerfil");

        if (ativo) {
          setFotoPerfil(dados?.foto || null);
        }
      } catch (erro) {
        if (ativo) setFotoPerfil(null);

        console.error(
          "Erro ao carregar foto no HeaderDesktop:",
          erro
        );
      }
    }

    carregarFoto();

    window.addEventListener(
      "foto-perfil-atualizada",
      carregarFoto
    );

    return () => {
      ativo = false;

      window.removeEventListener(
        "foto-perfil-atualizada",
        carregarFoto
      );
    };
  }, []);

  // =========================================
  // NORMALIZAR TEXTOS
  // =========================================

  function normalizar(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  // =========================================
  // PESQUISAR ARTIGOS E NOTAS FISCAIS
  // =========================================

  useEffect(() => {
    const termo = pesquisa.trim();

    if (carregando || !mostrarPesquisa || termo.length < 2 || (!podeLerArtigos && !podeLerNotas)) {
      setArtigosEncontrados([]);
      setNotasEncontradas([]);
      setPesquisando(false);
      return;
    }

    let cancelado = false;

    // Pequeno intervalo para não requisitar a cada tecla
    const temporizador = setTimeout(async () => {
      setPesquisando(true);
      setArtigosEncontrados([]);
      setNotasEncontradas([]);

      try {
        const respostas = await Promise.allSettled([
          podeLerArtigos ? requisicaoApi("/api/Artigos") : Promise.resolve([]),
          podeLerNotas ? requisicaoApi("/api/NotasFiscais") : Promise.resolve([])
        ]);

        if (cancelado) return;

        const artigos =
          respostas[0].status === "fulfilled" &&
          Array.isArray(respostas[0].value)
            ? respostas[0].value
            : [];

        const notas =
          respostas[1].status === "fulfilled" &&
          Array.isArray(respostas[1].value)
            ? respostas[1].value
            : [];

        const busca = normalizar(termo);

        // Filtrar artigos
        const artigosFiltrados = artigos
          .filter((artigo) => {
            const texto = [
              artigo.titulo,
              artigo.tema,
              artigo.resumo
            ].join(" ");

            return normalizar(texto).includes(busca);
          })
          .slice(0, 5);

        // Filtrar notas fiscais
        const notasFiltradas = notas
          .filter((nota) => {
            const texto = [
              nota.chaveAcesso,
              nota.cnpjdestinatario,
              nota.cnpjemitente,
              nota.numero
            ].join(" ");

            return normalizar(texto).includes(busca);
          })
          .slice(0, 5);

        setArtigosEncontrados(artigosFiltrados);
        setNotasEncontradas(notasFiltradas);

      } catch (erro) {
        if (!cancelado) {
          console.error("Erro ao pesquisar:", erro);
        }
      } finally {
        if (!cancelado) {
          setPesquisando(false);
        }
      }
    }, 350);

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [pesquisa, mostrarPesquisa, carregando, podeLerArtigos, podeLerNotas]);

  // =========================================
  // FECHAR PESQUISA AO CLICAR FORA
  // =========================================

  useEffect(() => {
    function clicarFora(event) {
      if (
        pesquisaRef.current &&
        !pesquisaRef.current.contains(event.target)
      ) {
        setMostrarResultados(false);
      }
    }

    document.addEventListener("pointerdown", clicarFora);

    return () => {
      document.removeEventListener("pointerdown", clicarFora);
    };
  }, []);

  // =========================================
  // ABRIR DETALHES DE ARTIGO
  // =========================================

  function abrirArtigo(artigo) {
    setMostrarResultados(false);
    setPesquisa("");

    navigate("/conteudos/detalhes", {
      state: {
        conteudo: {
          id: artigo.artigoId,
          artigoId: artigo.artigoId,
          titulo: artigo.titulo,
          tema: artigo.tema,
          autor: artigo.autor,
          resumo: artigo.resumo,
          conteudo: artigo.conteudo,
          visibilidade: artigo.visibilidade,
          status: artigo.status,
          dataPublicacao: artigo.dataPublicacao,
          data: artigo.dataPublicacao
            ? new Date(
                artigo.dataPublicacao
              ).toLocaleDateString("pt-BR")
            : "Não informada",

          // Informações do documento anexo
          temArquivo: artigo.temArquivo,
          nomeArquivo: artigo.nomeArquivo,
          tamanhoArquivo: artigo.tamanhoArquivo
        }
      }
    });
  }

  // =========================================
  // ABRIR NOTA FISCAL
  // =========================================

  function abrirNota(nota) {
    const chave = nota.chaveAcesso || "";

    setMostrarResultados(false);
    setPesquisa("");

    navigate(
      `/notas-fiscais?busca=${encodeURIComponent(chave)}`
    );
  }

  // =========================================
  // PESQUISA AO PRESSIONAR ENTER
  // =========================================

  function enviarPesquisa(event) {
    event.preventDefault();

    const termo = pesquisa.trim();
    if (!termo || (!podeLerArtigos && !podeLerNotas)) return;

    setMostrarResultados(false);
    setPesquisa("");

    navigate(
      `${podeLerArtigos ? "/conteudos" : "/notas-fiscais"}?busca=${encodeURIComponent(termo)}`
    );
  }

  // =========================================
  // DADOS DO USUÁRIO
  // =========================================

  const nome = usuario?.nome || "Usuário";

  const perfil = Array.isArray(usuario?.perfis)
    ? usuario.perfis.join(", ") || "Sem perfil"
    : "Carregando...";

  const iniciais = nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join("")
    .toUpperCase();

  const possuiResultados =
    artigosEncontrados.length > 0 ||
    notasEncontradas.length > 0;

  // =========================================
  // TELA
  // =========================================

  return (
    <header className="integra-header-desktop">

      <div className="header-desktop-superior" style={!mostrarPesquisa && !pesquisaPersonalizada ? { justifyContent: "flex-end" } : undefined}>

        {/* PESQUISA */}

        {pesquisaPersonalizada && (
          <div className="header-desktop-pesquisa-area">
            <div className="header-desktop-pesquisa">
              <img src={LupaPesquisa} alt="" />
              <input type="search" placeholder={pesquisaPersonalizada.placeholder || "Buscar usuários..."} aria-label={pesquisaPersonalizada.placeholder || "Buscar usuários"} autoComplete="off" value={pesquisaPersonalizada.valor} onChange={(e) => pesquisaPersonalizada.onChange(e.target.value)} />
            </div>
          </div>
        )}
        {mostrarPesquisa && !pesquisaPersonalizada && (
<div
          className="header-desktop-pesquisa-area"
          ref={pesquisaRef}
        >
          <form
            className="header-desktop-pesquisa"
            onSubmit={enviarPesquisa}
          >
            <img src={LupaPesquisa} alt="" />

            <input
              type="search"
              placeholder={podeLerArtigos && podeLerNotas ? "Buscar conteúdos, notas fiscais..." : podeLerNotas ? "Buscar notas fiscais..." : "Buscar conteúdos..."}
              aria-label="Pesquisar no sistema"
              value={pesquisa}
              autoComplete="off"
              onChange={(event) => {
                setPesquisa(event.target.value);
                setMostrarResultados(true);
              }}
              onFocus={() => setMostrarResultados(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setMostrarResultados(false);
                }
              }}
            />
          </form>

          {/* RESULTADOS DA PESQUISA */}

          {mostrarResultados &&
            pesquisa.trim().length >= 2 && (

            <div className="header-desktop-resultados">

              {pesquisando ? (

                <p className="header-desktop-mensagem">
                  Pesquisando...
                </p>

              ) : (

                <>
                  {!possuiResultados && (
                    <p className="header-desktop-mensagem">
                      Nenhum resultado encontrado.
                    </p>
                  )}

                  {/* ARTIGOS */}

                  {podeLerArtigos && artigosEncontrados.length > 0 && (
                    <div className="header-desktop-grupo">

                      <h3>Conteúdos tributários</h3>

                      {artigosEncontrados.map((artigo) => (
                        <button
                          key={artigo.artigoId}
                          type="button"
                          className="header-desktop-resultado-item"
                          onClick={() => abrirArtigo(artigo)}
                        >
                          <strong>{artigo.titulo}</strong>

                          <span>
                            {artigo.tema || "Sem tema"}
                          </span>
                        </button>
                      ))}

                    </div>
                  )}

                  {/* NOTAS FISCAIS */}

                  {podeLerNotas && notasEncontradas.length > 0 && (
                    <div className="header-desktop-grupo">

                      <h3>Notas fiscais</h3>

                      {notasEncontradas.map((nota) => (
                        <button
                          key={nota.notaFiscalId}
                          type="button"
                          className="header-desktop-resultado-item"
                          onClick={() => abrirNota(nota)}
                        >
                          <strong>
                            {nota.chaveAcesso || "Sem chave"}
                          </strong>

                          <span>
                            {nota.cnpjdestinatario ||
                              nota.cnpjemitente ||
                              "Cliente não informado"}
                          </span>
                        </button>
                      ))}

                    </div>
                  )}
                </>
              )}

            </div>
          )}

        </div>
      )}

        {/* USUÁRIO */}

        <div className="header-desktop-usuario">

          <NavLink
            to="/perfil"
            className="header-desktop-foto"
            aria-label="Acessar meu perfil"
          >
            {fotoPerfil ? (
              <img
                src={fotoPerfil}
                alt="Minha foto de perfil"
                className="header-desktop-foto-imagem"
              />
            ) : (
              iniciais
            )}
          </NavLink>

          <div className="header-desktop-dados">
            <strong>{nome}</strong>
            <span>{perfil}</span>
          </div>

        </div>

      </div>

    </header>
  );
}

export default HeaderDesktop;
