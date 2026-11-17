
import "./detalheconteudo.css";

import LogoNome from "../../assets/Icones/LogoNome.png";
import LogoNomeMobile from "../../assets/Icones/LogoNomeMobile.png";

import { NavLink, useNavigate, useLocation } from "react-router-dom";

import CasaBranca from "../../assets/Icones/CasaBranca.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
import LupaCinza from "../../assets/Icones/LupaCinza.png";
import SairBranco from "../../assets/Icones/SairBranco.png";

import Pessoa from "../../assets/Icones/Pessoa.png";
import TresPontos from "../../assets/Icones/TresPontos.png";
import Relogio from "../../assets/Icones/Relogio.png";
import { useState } from "react";
import DOMPurify from "dompurify";
function DetalheRevisao() {


  const navigate = useNavigate();
  const location = useLocation();

  // Dados recebidos da tela anterior
  const artigo = location.state?.conteudo;
  const [baixandoArquivo, setBaixandoArquivo] = useState(false);


  async function baixarArquivo() {
    try {
        setBaixandoArquivo(true);

        const token = localStorage.getItem("token");

        const API_URL =
            import.meta.env.VITE_API_URL ||
            "https://localhost:7249";

        const resposta = await fetch(
            `${API_URL}/api/Artigos/${artigo.id}/arquivo`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!resposta.ok) {
            const mensagem = await resposta.text();

            throw new Error(
                mensagem || "Não foi possível baixar o documento."
            );
        }

        const arquivoBlob = await resposta.blob();

        const url = window.URL.createObjectURL(arquivoBlob);

        const link = document.createElement("a");

        link.href = url;
        link.download = artigo.nomeArquivo || "documento";

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);

    } catch (erro) {
        console.error("Erro ao baixar documento:", erro);

        alert(
            erro.message || "Erro ao baixar o documento."
        );

    } finally {
        setBaixandoArquivo(false);
    }
}
  // Dados do usuário logado
  let usuario = {};
  let perfis = [];

  try {
    usuario = JSON.parse(localStorage.getItem("usuario")) || {};
    perfis = JSON.parse(localStorage.getItem("perfis")) || [];
  } catch {
    usuario = {};
    perfis = [];
  }

  const nomeUsuario =
    usuario.nome ||
    usuario.Nome ||
    usuario.email ||
    "Usuário";

  const perfilUsuario =
    Array.isArray(perfis)
      ? (typeof perfis[0] === "string"
        ? perfis[0]
        : perfis[0]?.nome || perfis[0]?.Nome || "Usuário")
      : "Usuário";

  const iniciais = nomeUsuario
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join("");

  // Menu lateral
  const menuItems = [
    { label: "Início", icon: CasaBranca, path: "/home" },
    { label: "Conteúdos", icon: LivroBranco, path: "/conteudos" },
    { label: "Notas Fiscais", icon: DoisDocumentosBranco, path: "/notas-fiscais" },
    { label: "Clientes", icon: ADDProfileBranco, path: "/clientes" },
    { label: "Usuários", icon: PessoaBranca, path: "/usuario" }
  ];

  // Formatação dos status
  function formatarStatus(status) {

    const statusFormatados = {
      RASCUNHO: "Rascunho",
      EM_REVISAO: "Em revisão",
      APROVADO: "Aprovado",
      REJEITADO: "Rejeitado",
      PUBLICADO: "Publicado",
      ARQUIVADO: "Arquivado"
    };

    return statusFormatados[status] || status || "Não informado";
  }

  // Formatação da visibilidade
  function formatarVisibilidade(visibilidade) {

    const visibilidades = {
      PUBLICO: "Público",
      PUBLICA: "Público",
      EXCLUSIVO: "Exclusivo"
    };

    return visibilidades[
      (visibilidade || "").toUpperCase()
    ] || visibilidade || "Não informada";
  }

  // Caso a tela seja aberta sem os dados do artigo
  if (!artigo) {

    return (
      <div className="pagina-revisao">

        <aside className="menu-lateral">

          <div className="logo">
            <img src={LogoNome} alt="INTEGRA" />
          </div>

          <nav className="opcoes-menu">

            {menuItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
              >
                <img src={item.icon} alt="" />
                <span>{item.label}</span>
              </NavLink>
            ))}

          </nav>

          <button
            className="botao-sair"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("usuario");
              localStorage.removeItem("perfis");
              navigate("/login", { replace: true });
            }}
          >
            <img src={SairBranco} alt="" />
            <span>Sair</span>
          </button>

        </aside>

        <main className="conteudo-principal">

          <section className="detalhe-revisao">

            <h1>Conteúdo não encontrado</h1>

            <p>
              Não foram encontrados os dados deste artigo.
              Volte à listagem e selecione um conteúdo para visualizar.
            </p>

            <button
              className="botao-voltar"
              onClick={() => navigate("/conteudos")}
            >
              <span className="seta-voltar">←</span>
              <span>Voltar aos conteúdos</span>
            </button>

          </section>

        </main>

      </div>
    );

  }

  return (

    <div className="pagina-revisao">

      {/* MENU LATERAL */}

      <aside className="menu-lateral">

        <div className="logo">
          <img src={LogoNome} alt="INTEGRA" />
        </div>

        <nav className="opcoes-menu">

          {menuItems.map((item) => (

            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                item.label === "Conteúdos" &&
                  window.location.pathname.startsWith("/conteudos")
                  ? "menu-ativo"
                  : isActive
                    ? "menu-ativo"
                    : ""
              }
            >

              <img src={item.icon} alt="" />

              <span>{item.label}</span>

            </NavLink>

          ))}

        </nav>

        <button
          className="botao-sair"
          onClick={() => {

            localStorage.removeItem("token");
            localStorage.removeItem("usuario");
            localStorage.removeItem("perfis");

            navigate("/login", { replace: true });

          }}
        >

          <img src={SairBranco} alt="" />

          <span>Sair</span>

        </button>

      </aside>

      <main className="conteudo-principal">

        {/* HEADER MOBILE */}

        <header className="cabecalho-mobile">

          <div className="cabecalho-superior-mobile">

            <img
              src={LogoNomeMobile}
              alt="Integra"
              className="logo-mobile-detalhe"
            />

            <div className="perfil-usuario-mobile">

              <div className="foto-perfil-mobile">
                {iniciais}
              </div>

              <div className="dados-usuario-mobile">

                <strong>{nomeUsuario}</strong>

                <span>{perfilUsuario}</span>

              </div>

            </div>

          </div>

          <div className="pesquisa-mobile-detalhe">

            <img src={LupaCinza} alt="" />

            <input
              type="text"
              placeholder="Buscar conteúdos, notas fiscais, etc..."
            />

          </div>

        </header>

        {/* HEADER DESKTOP */}

        <header className="cabecalho">

          <div className="pesquisa">

            <img src={LupaCinza} alt="" />

            <input
              type="text"
              placeholder="Buscar conteúdos, notas fiscais, etc..."
            />

          </div>

          <div className="perfil-usuario">

            <div className="foto-perfil">
              {iniciais}
            </div>

            <div className="dados-usuario">

              <strong>{nomeUsuario}</strong>

              <span>{perfilUsuario}</span>

            </div>

            <button
              className="botao-perfil-opcoes"
              aria-label="Mais opções do perfil"
              onClick={() => alert("Opções do perfil")}
            >
              <img src={TresPontos} alt="" />
            </button>

          </div>

        </header>

        {/* CONTEÚDO */}

        <section className="detalhe-revisao">

          <button
            className="botao-voltar"
            onClick={() => navigate(-1)}
          >

            <span className="seta-voltar">←</span>

            <span>Voltar</span>

          </button>

          <div className="area-artigo">

            {/* ARTIGO */}

            <article className="artigo">

              <h1>{artigo.titulo}</h1>

              <span className="categoria-artigo">
                {artigo.tema || "Tema não informado"}
              </span>

              <div className="informacoes-artigo">

                <span>

                  <img src={Relogio} alt="" />

                  Criado em {artigo.data || "Não informada"}

                </span>

                <span>

                  <img src={Pessoa} alt="" />

                  Por {artigo.autor || "Autor não informado"}

                </span>

              </div>

              {/* STATUS E VISIBILIDADE */}

              <div className="informacoes-artigo">

                <span>
                  <strong>Status:</strong>{" "}
                  {formatarStatus(artigo.status)}
                </span>

                <span>
                  <strong>Visibilidade:</strong>{" "}
                  {formatarVisibilidade(artigo.visibilidade)}
                </span>

              </div>

              {/* RESUMO */}

              {artigo.resumo && (

               <div className="texto-artigo">

    <h2>Conteúdo</h2>

    <div
        className="conteudo-formatado"
        dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
                artigo.conteudo || "Nenhum conteúdo informado."
            )
        }}
    />

</div>

              )}

              {/* CONTEÚDO COMPLETO */}

              <div className="texto-artigo">

                <h2>Conteúdo</h2>

                <p>
                  {artigo.conteudo || "Nenhum conteúdo informado."}
                </p>

              </div>
{/* DOCUMENTO ANEXADO */}

{artigo.temArquivo && artigo.nomeArquivo && (

    <div className="documento-anexado">

        <h2>Documento anexado</h2>

        <div className="documento-anexado-info">

            <div>
                <strong>{artigo.nomeArquivo}</strong>

                {artigo.tamanhoArquivo && (
                    <span>
                        {(artigo.tamanhoArquivo / 1024).toFixed(2)} KB
                    </span>
                )}
            </div>

            <button
                type="button"
                onClick={baixarArquivo}
                disabled={baixandoArquivo}
            >
                {baixandoArquivo ? "Baixando..." : "Baixar documento"}
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

                      {artigo.topicos.map((topico, index) => (

                        <li key={index}>
                          {topico}
                        </li>

                      ))}

                    </ul>

                  </div>

                )}

            </article>

            {/* INFORMAÇÕES COMPLEMENTARES */}

            <aside className="area-documentos">

              <h2>Informações do conteúdo</h2>

              <div className="documento">

                <div className="informacao-documento">

                  <strong>Status</strong>

                  <span>
                    {formatarStatus(artigo.status)}
                  </span>

                </div>

              </div>

              <div className="documento">

                <div className="informacao-documento">

                  <strong>Visibilidade</strong>

                  <span>
                    {formatarVisibilidade(artigo.visibilidade)}
                  </span>

                </div>

              </div>

              {artigo.dataPublicacao && (

                <div className="documento">

                  <div className="informacao-documento">

                    <strong>Data de publicação</strong>

                    <span>
                      {new Date(
                        artigo.dataPublicacao
                      ).toLocaleDateString("pt-BR")}
                    </span>

                  </div>

                </div>

              )}

            </aside>

          </div>

        </section>

      </main>

    </div>

  );

}

export default DetalheRevisao;
