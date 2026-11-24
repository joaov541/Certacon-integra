import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import LogoIntegra from "../../assets/Icones/LogoNomeMobile.png";
import LupaPesquisa from "../../assets/Icones/LupaPesquisa.png";

import { requisicaoApi } from "../../services/api";
import usePermissoes from "../../hooks/usePermissoes";

import "./header.css";

function Header({ mostrarPesquisa = true }) {
  const navigate = useNavigate();
  const { autenticado, temAlgumaPermissao, carregando } = usePermissoes();
  const podeLerArtigos = !autenticado || temAlgumaPermissao("artigo.ler.publico") || temAlgumaPermissao("artigo.ler.exclusivo");
  const podeLerNotas = autenticado && (temAlgumaPermissao("nota.ler.todas") || temAlgumaPermissao("nota.ler.proprias"));
  const areaPesquisaRef = useRef(null);

  const [usuario, setUsuario] = useState(null);
  const [fotoPerfil, setFotoPerfil] = useState(null);

  const [pesquisa, setPesquisa] = useState("");
  const [resultadosArtigos, setResultadosArtigos] = useState([]);
  const [resultadosNotas, setResultadosNotas] = useState([]);
  const [pesquisando, setPesquisando] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);

  // ========================================
  // DADOS DO USUÁRIO
  // ========================================

  useEffect(() => {
    let ativo = true;

    async function carregarUsuario() {
      try {
        const dados = await requisicaoApi("/api/MeuPerfil");
        if (ativo) setUsuario(dados);
      } catch (erro) {
        console.error("Erro ao carregar usuário:", erro);
      }
    }

    carregarUsuario();

    return () => {
      ativo = false;
    };
  }, []);

  // ========================================
  // FOTO DE PERFIL
  // ========================================

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

  // ========================================
  // NORMALIZAR TEXTOS DA PESQUISA
  // ========================================

  function normalizar(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  // ========================================
  // PESQUISAR NA API
  // ========================================

  useEffect(() => {
    const termo = pesquisa.trim();

    if (carregando || !mostrarPesquisa || termo.length < 2 || (!podeLerArtigos && !podeLerNotas)) {
      setResultadosArtigos([]);
      setResultadosNotas([]);
      setPesquisando(false);
      return;
    }

    let ativo = true;

    const temporizador = setTimeout(async () => {
      setPesquisando(true);

      try {
        const respostas = await Promise.allSettled([
          podeLerArtigos ? requisicaoApi("/api/Artigos") : Promise.resolve([]),
          podeLerNotas ? requisicaoApi("/api/NotasFiscais") : Promise.resolve([])
        ]);

        if (!ativo) return;

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

        setResultadosArtigos(artigosFiltrados);
        setResultadosNotas(notasFiltradas);

      } catch (erro) {
        if (ativo) {
          console.error("Erro na pesquisa:", erro);
          setResultadosArtigos([]);
          setResultadosNotas([]);
        }
      } finally {
        if (ativo) setPesquisando(false);
      }
    }, 350);

    return () => {
      ativo = false;
      clearTimeout(temporizador);
    };

  }, [pesquisa, mostrarPesquisa, carregando, podeLerArtigos, podeLerNotas]);

  // ========================================
  // FECHAR AO CLICAR FORA
  // ========================================

  useEffect(() => {
    function fecharPesquisa(event) {
      if (
        areaPesquisaRef.current &&
        !areaPesquisaRef.current.contains(event.target)
      ) {
        setMostrarResultados(false);
      }
    }

    document.addEventListener("pointerdown", fecharPesquisa);

    return () => {
      document.removeEventListener(
        "pointerdown",
        fecharPesquisa
      );
    };
  }, []);

  // ========================================
  // ABRIR ARTIGO
  // ========================================

  function abrirArtigo(artigo) {
    setMostrarResultados(false);

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
            ? new Date(artigo.dataPublicacao)
                .toLocaleDateString("pt-BR")
            : "Não informada",
          temArquivo: artigo.temArquivo,
          nomeArquivo: artigo.nomeArquivo,
          tamanhoArquivo: artigo.tamanhoArquivo
        }
      }
    });
  }

  // ========================================
  // ABRIR NOTAS FISCAIS
  // ========================================

  function abrirNota(nota) {
    setMostrarResultados(false);

    const chave = nota.chaveAcesso || "";

    navigate(
      `/notas-fiscais?busca=${encodeURIComponent(chave)}`
    );
  }

  // ========================================
  // BUSCAR AO PRESSIONAR ENTER
  // ========================================

  function enviarPesquisa(event) {
    event.preventDefault();

    const termo = pesquisa.trim();

    if (!termo || (!podeLerArtigos && !podeLerNotas)) return;

    setMostrarResultados(false);

    // Abre a tela de conteúdos com o filtro aplicado.
    navigate(
      `${podeLerArtigos ? "/conteudos" : "/notas-fiscais"}?busca=${encodeURIComponent(termo)}`
    );
  }

  // ========================================
  // INFORMAÇÕES DO PERFIL
  // ========================================

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
    resultadosArtigos.length > 0 ||
    resultadosNotas.length > 0;

  // ========================================
  // TELA
  // ========================================

  return (
    <header className="integra-header">

      <div className="header-superior">

        <img
          src={LogoIntegra}
          alt="Integra"
          className="header-logo"
        />

        <div className="header-usuario">

          <NavLink
            to="/perfil"
            className="header-foto"
            title="Acessar meu perfil"
          >
            {fotoPerfil ? (
              <img
                src={fotoPerfil}
                alt="Minha foto de perfil"
                className="header-foto-imagem"
              />
            ) : (
              iniciais
            )}
          </NavLink>

          <div className="header-dados">
            <strong>{nome}</strong>
            <span>{perfil}</span>
          </div>

        </div>

      </div>

      {mostrarPesquisa && (
      <div
        className="header-pesquisa-container"
        ref={areaPesquisaRef}
      >
        <form
          className="header-pesquisa"
          onSubmit={enviarPesquisa}
        >
          <img src={LupaPesquisa} alt="" />

          <input
            type="search"
            placeholder={podeLerArtigos && podeLerNotas ? "Buscar conteúdos, notas fiscais..." : podeLerNotas ? "Buscar notas fiscais..." : "Buscar conteúdos..."}
            aria-label="Pesquisar no sistema"
            value={pesquisa}
            onChange={(event) => {
              setPesquisa(event.target.value);
              setMostrarResultados(true);
            }}
            onFocus={() => setMostrarResultados(true)}
            autoComplete="off"
          />
        </form>

        {mostrarResultados &&
          pesquisa.trim().length >= 2 && (

          <div className="header-resultados-pesquisa">

            {pesquisando ? (
              <p className="header-pesquisa-mensagem">
                Pesquisando...
              </p>
            ) : (
              <>

                {!possuiResultados && (
                  <p className="header-pesquisa-mensagem">
                    Nenhum resultado encontrado.
                  </p>
                )}

                {podeLerArtigos && resultadosArtigos.length > 0 && (
                  <div className="header-grupo-resultados">

                    <h3>Conteúdos tributários</h3>

                    {resultadosArtigos.map((artigo) => (
                      <button
                        key={artigo.artigoId}
                        type="button"
                        className="header-resultado-item"
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

                {podeLerNotas && resultadosNotas.length > 0 && (
                  <div className="header-grupo-resultados">

                    <h3>Notas fiscais</h3>

                    {resultadosNotas.map((nota) => (
                      <button
                        key={nota.notaFiscalId}
                        type="button"
                        className="header-resultado-item"
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

    </header>
  );
}

export default Header;
