import { classeCorTema } from "../../utils/coresTemas";
import "../../styles/coresTemas.css";
import "./detalheconteudo.css";

import LogoNome from "../../assets/Icones/LogoNome.png";

import { NavLink, useNavigate, useLocation } from "react-router-dom";

import CasaBranca from "../../assets/Icones/CasaBranca.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
import SairBranco from "../../assets/Icones/SairBranco.png";

import Pessoa from "../../assets/Icones/Pessoa.png";
import Relogio from "../../assets/Icones/Relogio.png";
import { useState } from "react";
import Header from "../../components/Header/header";
import HeaderDesktop from "../../components/Header/headerDesktop";
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
  // As permissões visuais são lidas da sessão; a API valida a autorização real.
  let perfis = [];
  try {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    const perfisSalvos = JSON.parse(localStorage.getItem("perfis") || "[]");
    perfis = Array.isArray(usuario.perfis) && usuario.perfis.length
      ? usuario.perfis
      : Array.isArray(perfisSalvos) ? perfisSalvos : [];
  } catch {
    perfis = [];
  }

  const ehAdmin = perfis.includes("Administrador");
  const podeVerNotas = [
    "Coordenador Fiscal", "Analista SPED",
    "Analista de Documentos Fiscais",
    "Analista de Reforma Tributária", "Cliente"
  ].some(perfil => perfis.includes(perfil));

  const menuItems = [
    { label: "Início", icon: CasaBranca, path: "/home" },
    { label: "Conteúdos", icon: LivroBranco, path: "/conteudos" },
    ...(podeVerNotas ? [
      { label: "Notas Fiscais", icon: DoisDocumentosBranco, path: "/notas-fiscais" }
    ] : []),
    ...(ehAdmin ? [
      { label: "Clientes", icon: ADDProfileBranco, path: "/clientes" },
      { label: "Usuários", icon: PessoaBranca, path: "/usuario" }
    ] : [])
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

        {/* Cabeçalhos compartilhados: foto, nome e perfil reais do usuário */}
        <div className="detalhe-header-mobile">
          <Header />
        </div>
        <div className="detalhe-header-desktop">
          <HeaderDesktop />
        </div>

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

             <span
    className={`categoria-artigo ${classeCorTema(artigo.tema)}`}
>
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

              {/* RESUMO, QUANDO EXISTIR */}
              {artigo.resumo && (
                <div className="resumo-artigo">
                  <h2>Resumo</h2>
                  <p>{artigo.resumo}</p>
                </div>
              )}

              {/* HTML produzido pelo editor, sanitizado para exibição segura */}
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
