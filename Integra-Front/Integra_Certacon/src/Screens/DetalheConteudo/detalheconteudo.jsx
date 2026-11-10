
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
import ArquivoDetalhe from "../../assets/Icones/ArquivoDetalhe.png";

function DetalheRevisao() {

  const navigate = useNavigate();
  const location = useLocation();

  const artigo = location.state?.conteudo || {
    titulo: "Reforma Tributária: Novas Regras do IBS e CBS",
    tema: "Reforma Tributária",
    data: "09/10/2026",
    autor: "Maria de Oliveira"
  };


  const menuItems = [
    { label: "Início", icon: CasaBranca, path: "/home" },
    { label: "Conteúdos", icon: LivroBranco, path: "/conteudos" },
    { label: "Notas Fiscais", icon: DoisDocumentosBranco, path: "/notas-fiscais" },
    { label: "Clientes", icon: ADDProfileBranco, path: "/clientes" },
    { label: "Usuários", icon: PessoaBranca, path: "/usuario" },

  ];

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
          onClick={() => navigate("/login")}
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
                JS
              </div>

              <div className="dados-usuario-mobile">
                <strong>João Silva</strong>
                <span>Analista SPED</span>
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

            <div className="foto-perfil">JS</div>

            <div className="dados-usuario">
              <strong>João Silva</strong>
              <span>Analista SPED</span>
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
            onClick={() => navigate("/conteudos")}
          >
            <span className="seta-voltar">←</span>
            <span>Voltar</span>
          </button>

          <div className="area-artigo">

            <article className="artigo">
              <article className="artigo">

                <h1>{artigo.titulo}</h1>

                <span className="categoria-artigo">
                  {artigo.tema}
                </span>

                <div className="informacoes-artigo">

                  <span>
                    <img src={Relogio} alt="" />
                    Publicado em {artigo.data}
                  </span>

                  <span>
                    <img src={Pessoa} alt="" />
                    Por {artigo.autor}
                  </span>

                  <span className="versao-artigo">
                    ⓧ Versão 1.0
                  </span>

                </div>

                <div className="texto-artigo">
                  <p>{artigo.conteudo}</p>
                </div>

                <div className="topicos-artigo">
                  <h2>Tópicos abordados</h2>

                  <ul>
                    {artigo.topicos?.map((topico, index) => (
                      <li key={index}>{topico}</li>
                    ))}
                  </ul>
                </div>

              </article>
            </article>

            {/* DOCUMENTOS */}
            <aside className="area-documentos">

              <h2>Documentos</h2>

              <div className="documento">

                <img
                  src={ArquivoDetalhe}
                  alt="Documento PDF"
                />

                <div className="informacao-documento">
                  <strong>reforma_Tributária.pdf</strong>
                  <span>2,4mb</span>
                </div>

              </div>

              <button
                className="botao-baixar"
                onClick={() =>
                  alert("Adicione o arquivo PDF para habilitar o download.")
                }
              >
                Baixar
              </button>

            </aside>

          </div>

        </section>

      </main>

    </div>
  );
}

export default DetalheRevisao;
