import { useState } from "react";
import "./Home.css";

import { NavLink, useNavigate } from "react-router-dom";

import Header from "../../components/Header/header";
import HeaderDesktop from "../../components/Header/headerDesktop";

import logoIntegra from "../../assets/Icones/LogoNome.png";
import iconeCasa from "../../assets/Icones/CasaBranca.png";
import iconeLivro from "../../assets/Icones/LivroBranco.png";
import iconeNotas from "../../assets/Icones/DoisDocumentosBranco.png";
import iconeClientesBranco from "../../assets/Icones/ADDProfileBranco.png";
import iconePessoa from "../../assets/Icones/PessoaBranca.png";
import iconeSair from "../../assets/Icones/SairBranco.png";

import iconeDocumento from "../../assets/Icones/ArquivoAcessoRapido.png";
import iconeExpandir from "../../assets/Icones/SetaAcessoRapido.png";
import iconeUpload from "../../assets/Icones/BaixarArqvAcssRapido.png";
import iconeGrupo from "../../assets/Icones/PessoaAcessoRapido.png";
import arquivoHome from "../../assets/Icones/ArquivoDashboard.png";
import DoisDocumentos from "../../assets/Icones/DoisDocumentos.png";
import TimeAcessoRapido from "../../assets/Icones/TimeAcessoRapido.png";

// Ícones do tablet e mobile
import AddClienteMobile from "../../assets/Icones/AddClienteMobile.png";
import NovoConteudoMobile from "../../assets/Icones/NovoConteudoMobile.png";
import HistoricoMobile from "../../assets/Icones/HistoricoMobile.png";
import ConsultarNFEmobile from "../../assets/Icones/ConsultarNFEmobile.png";
import EnviarXMLMobile from "../../assets/Icones/EnviarXMLMobile.png";

export default function Home() {
    const navigate = useNavigate();

    const [pesquisa, setPesquisa] = useState("");

    function sairSistema() {
        navigate("/login");
    }

    return (
        <main className="home">

            {/* MENU LATERAL */}
            <aside className="home-menu">

                <div className="home-marca">
                    <img
                        src={logoIntegra}
                        alt="Integra"
                        className="home-logo1"
                    />
                </div>

                <nav className="home-menu-lista">

                    <NavLink
                        to="/home"
                        className={({ isActive }) =>
                            isActive
                                ? "home-menu-item home-menu-item-ativo"
                                : "home-menu-item"
                        }
                    >
                        <img src={iconeCasa} alt="" />
                        <span>Início</span>
                    </NavLink>

                    <NavLink
                        to="/conteudos"
                        className={({ isActive }) =>
                            isActive
                                ? "home-menu-item home-menu-item-ativo"
                                : "home-menu-item"
                        }
                    >
                        <img src={iconeLivro} alt="" />
                        <span>Conteúdos</span>
                    </NavLink>

                    <NavLink
                        to="/notas-fiscais"
                        className={({ isActive }) =>
                            isActive
                                ? "home-menu-item home-menu-item-ativo"
                                : "home-menu-item"
                        }
                    >
                        <img src={iconeNotas} alt="" />
                        <span>Notas Fiscais</span>
                    </NavLink>

                    <NavLink
                        to="/clientes"
                        className={({ isActive }) =>
                            isActive
                                ? "home-menu-item home-menu-item-ativo"
                                : "home-menu-item"
                        }
                    >
                        <img src={iconeClientesBranco} alt="" />
                        <span>Clientes</span>
                    </NavLink>

                    <NavLink
                        to="/usuario"
                        className={({ isActive }) =>
                            isActive
                                ? "home-menu-item home-menu-item-ativo"
                                : "home-menu-item"
                        }
                    >
                        <img src={iconePessoa} alt="" />
                        <span>Usuários</span>
                    </NavLink>

                </nav>

                <button
                    type="button"
                    className="home-menu-item home-menu-sair"
                    onClick={sairSistema}
                >
                    <img src={iconeSair} alt="" />
                    <span>Sair</span>
                </button>

            </aside>

            {/* ÁREA PRINCIPAL */}
            <section className="home-area">

                {/* CABEÇALHOS COMPARTILHADOS */}
                <HeaderDesktop
                    pesquisa={pesquisa}
                    setPesquisa={setPesquisa}
                />

                <Header
                    pesquisa={pesquisa}
                    setPesquisa={setPesquisa}
                />

                {/* CONTEÚDO DA PÁGINA */}
                <div className="home-conteudo">

                    <h1>Olá, João!</h1>

                    <p className="home-subtitulo">
                        Confira um resumo das principais informações do sistema.
                    </p>

                    {/* CARDS DE RESUMO */}
                    <div className="home-resumo">

                        <div
                            className="home-card"
                            role="link"
                            tabIndex={0}
                            onClick={() => navigate("/conteudos")}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") navigate("/conteudos");
                            }}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="home-card-icone">
                                <img src={arquivoHome} alt="" />
                            </div>

                            <div className="home-card-info">
                                <p>Conteúdos publicados</p>
                                <strong>128</strong>
                            </div>

                            <span className="home-card-crescimento">
                                ↑ 12%
                            </span>
                        </div>

                        <div
                            className="home-card"
                            role="link"
                            tabIndex={0}
                            onClick={() => navigate("/notas-fiscais")}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") navigate("/notas-fiscais");
                            }}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="home-card-icone">
                                <img src={arquivoHome} alt="" />
                            </div>

                            <div className="home-card-info">
                                <p>Notas Fiscais</p>
                                <strong>1248</strong>
                            </div>

                            <span className="home-card-crescimento home-card-ativas">
                                Ativas
                            </span>
                        </div>

                        <div
                            className="home-card"
                            role="link"
                            tabIndex={0}
                            onClick={() => navigate("/conteudos")}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") navigate("/conteudos");
                            }}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="home-card-icone">
                                <img src={arquivoHome} alt="" />
                            </div>

                            <div className="home-card-info">
                                <p>Conteúdos</p>
                                <strong>128</strong>
                            </div>

                            <span className="home-card-crescimento home-card-atencao">
                                Atenção
                            </span>
                        </div>

                    </div>

                    {/* LISTA E ACESSO RÁPIDO */}
                    <div className="home-baixo">

                        {/* ÚLTIMAS ATUALIZAÇÕES */}
                        <section className="home-lista">

                            <div
                                className="home-lista-item"
                                onClick={() => navigate("/conteudos/detalhes")}
                                style={{ cursor: "pointer" }}
                            >
                                <div className="home-lista-icone home-lista-icone-verde">
                                    <img src={DoisDocumentos} alt="" />
                                </div>

                                <div className="home-lista-texto">
                                    <h3>
                                        Reforma tributária: Novas regras IBS e CBS
                                    </h3>

                                    <p>Publicado em 09/10/2026</p>
                                </div>

                                <span className="home-tag home-tag-verde">
                                    Reforma tributária
                                </span>
                            </div>

                            <div
                                className="home-lista-item"
                                onClick={() => navigate("/conteudos/detalhes")}
                                style={{ cursor: "pointer" }}
                            >
                                <div className="home-lista-icone home-lista-icone-vermelho">
                                    <img src={DoisDocumentos} alt="" />
                                </div>

                                <div className="home-lista-texto">
                                    <h3>
                                        Atualização de Tabelas Liquidadas
                                    </h3>

                                    <p>Publicado em 02/10/2026</p>
                                </div>

                                <span className="home-tag home-tag-roxo">
                                    Reforma Tributária
                                </span>
                            </div>

                            <div
                                className="home-lista-item"
                                onClick={() => navigate("/conteudos/detalhes")}
                                style={{ cursor: "pointer" }}
                            >
                                <div className="home-lista-icone home-lista-icone-azul">
                                    <img src={DoisDocumentos} alt="" />
                                </div>

                                <div className="home-lista-texto">
                                    <h3>
                                        SPED Fiscal 2025 - Principais mudanças
                                    </h3>

                                    <p>Publicado em 07/05/2026</p>
                                </div>

                                <span className="home-tag home-tag-roxo">
                                    SPED
                                </span>
                            </div>

                            <button
                                type="button"
                                className="home-ver-todos"
                                onClick={() => navigate("/conteudos")}
                            >
                                Ver todos →
                            </button>

                        </section>

                        {/* FOOTER MOBILE */}
                        <footer className="home-footer">

                            <NavLink
                                to="/home"
                                className={({ isActive }) =>
                                    isActive
                                        ? "home-footer-item home-footer-ativo"
                                        : "home-footer-item"
                                }
                            >
                                <img src={iconeCasa} alt="" />
                                <span>Início</span>
                            </NavLink>

                            <NavLink
                                to="/conteudos"
                                className={({ isActive }) =>
                                    isActive
                                        ? "home-footer-item home-footer-ativo"
                                        : "home-footer-item"
                                }
                            >
                                <img src={iconeLivro} alt="" />
                                <span>Conteúdos</span>
                            </NavLink>

                            <NavLink
                                to="/notas-fiscais"
                                className={({ isActive }) =>
                                    isActive
                                        ? "home-footer-item home-footer-ativo"
                                        : "home-footer-item"
                                }
                            >
                                <img src={iconeNotas} alt="" />
                                <span>Notas Fiscais</span>
                            </NavLink>

                            <NavLink
                                to="/clientes"
                                className={({ isActive }) =>
                                    isActive
                                        ? "home-footer-item home-footer-ativo"
                                        : "home-footer-item"
                                }
                            >
                                <img src={iconeClientesBranco} alt="" />
                                <span>Clientes</span>
                            </NavLink>

                            <NavLink
                                to="/usuario"
                                className={({ isActive }) =>
                                    isActive
                                        ? "home-footer-item home-footer-ativo"
                                        : "home-footer-item"
                                }
                            >
                                <img src={iconePessoa} alt="" />
                                <span>Usuários</span>
                            </NavLink>

                        </footer>

                        {/* ACESSO RÁPIDO */}
                        <section className="home-acesso">

                            <h2>Acesso rápido</h2>

                            <button
                                type="button"
                                className="home-acesso-botao"
                                onClick={() => navigate("/conteudos/novo")}
                            >
                                <img
                                    src={iconeExpandir}
                                    alt=""
                                    className="home-acesso-icone-desktop"
                                />

                                <img
                                    src={NovoConteudoMobile}
                                    alt=""
                                    className="home-acesso-icone-mobile"
                                />

                                <span>Novo conteúdo</span>
                            </button>

                            <button
                                type="button"
                                className="home-acesso-botao"
                                onClick={() => navigate("/conteudos/revisao")}
                            >
                                <img
                                    src={iconeDocumento}
                                    alt=""
                                    className="home-acesso-icone-desktop"
                                />

                                <img
                                    src={NovoConteudoMobile}
                                    alt=""
                                    className="home-acesso-icone-mobile"
                                />

                                <span>Conteúdos em revisão</span>
                            </button>

                            <button
                                type="button"
                                className="home-acesso-botao"
                                onClick={() => navigate("/enviar-xml")}
                            >
                                <img
                                    src={iconeUpload}
                                    alt=""
                                    className="home-acesso-icone-desktop"
                                />

                                <img
                                    src={EnviarXMLMobile}
                                    alt=""
                                    className="home-acesso-icone-mobile"
                                />

                                <span>Enviar XML</span>
                            </button>

                            <button
                                type="button"
                                className="home-acesso-botao"
                                onClick={() => navigate("/notas-fiscais")}
                            >
                                <img
                                    src={iconeDocumento}
                                    alt=""
                                    className="home-acesso-icone-desktop docAcessoRapido"
                                />

                                <img
                                    src={ConsultarNFEmobile}
                                    alt=""
                                    className="home-acesso-icone-mobile"
                                />

                                <span>Consultar NF-e</span>
                            </button>

                            <button
                                type="button"
                                className="home-acesso-botao"
                                onClick={() => navigate("/clientes")}
                            >
                                <img
                                    src={iconeGrupo}
                                    alt=""
                                    className="home-acesso-icone-desktop"
                                />

                                <img
                                    src={AddClienteMobile}
                                    alt=""
                                    className="home-acesso-icone-mobile"
                                />

                                <span>Consultar clientes</span>
                            </button>

                            <button
                                type="button"
                                className="home-acesso-botao"
                                onClick={() => navigate("/historico")}
                            >
                                <img
                                    src={TimeAcessoRapido}
                                    alt=""
                                    className="home-acesso-icone-desktop"
                                />

                                <img
                                    src={HistoricoMobile}
                                    alt=""
                                    className="home-acesso-icone-mobile"
                                />

                                <span>Histórico de ações</span>
                            </button>

                        </section>

                    </div>

                </div>

            </section>

        </main>
    );
}