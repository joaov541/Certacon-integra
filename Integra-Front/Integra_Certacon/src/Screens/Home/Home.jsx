
import "./Home.css";

import logoIntegra from "../../assets/Icones/LogoNome.png";
import iconeCasa from "../../assets/Icones/CasaBranca.png";
import iconeLivro from "../../assets/Icones/LivroBranco.png";
import iconeNotas from "../../assets/Icones/DoisDocumentosBranco.png";
import iconeClientesBranco from "../../assets/Icones/GrupoPessoasBranco.png";
import iconePessoa from "../../assets/Icones/PessoaBranca.png";
import iconeSair from "../../assets/Icones/SairBranco.png";
import iconeLupa from "../../assets/Icones/LupaPesquisa.png";
import PerfilLaranja from "../../assets/Icones/PerfilLaranja.png";
import iconeTresPontos from "../../assets/Icones/TresPontos.png";
import iconeDocumento from "../../assets/Icones/documentoLaranja.png";
import iconeExpandir from "../../assets/Icones/ExpandirText.png";
import iconeUpload from "../../assets/Icones/Upload.png";
import iconeGrupo from "../../assets/Icones/GrupoPessoasLaranja.png";
import arquivoHome from "../../assets/Icones/ArquivoDashboard.png";
import DoisDocumentos from "../../assets/Icones/DoisDocumentos.png"

export default function Home() {
    return (
        <main className="home">

            {/* MENU LATERAL */}
            <aside className="home-menu">

                <div className="home-marca">
                    <img
                        src={logoIntegra}
                        alt="Integra"
                        className="home-logo"
                    />
                </div>

                <nav className="home-menu-lista">

                    <button
                        type="button"
                        className="home-menu-item home-menu-item-ativo"
                    >
                        <img src={iconeCasa} alt="" />
                        <span>Início</span>
                    </button>

                    <button type="button" className="home-menu-item">
                        <img src={iconeLivro} alt="" />
                        <span>Conteúdos</span>
                    </button>

                    <button type="button" className="home-menu-item">
                        <img src={iconeNotas} alt="" />
                        <span>Notas Fiscais</span>
                    </button>

                    <button type="button" className="home-menu-item">
                        <img src={iconeClientesBranco} alt="" />
                        <span>Clientes</span>
                    </button>

                    <button type="button" className="home-menu-item">
                        <img src={iconePessoa} alt="" />
                        <span>Usuários</span>
                    </button>

                </nav>

                <button
                    type="button"
                    className="home-menu-item home-menu-sair"
                >
                    <img src={iconeSair} alt="" />
                    <span>Sair</span>
                </button>

            </aside>

            {/* ÁREA PRINCIPAL */}
            <section className="home-area">

                {/* CABEÇALHO */}
                <header className="home-topo">

                    <div className="home-busca">
                        <img src={iconeLupa} alt="" />

                        <input
                            type="text"
                            placeholder="Buscar conteúdos, notas fiscais, etc..."
                        />
                    </div>

                    <div className="home-usuario">

                        <div className="home-usuario-foto">
                            <img
                                src={PerfilLaranja}
                                alt="Foto do usuário"
                            />
                        </div>

                        <div className="home-usuario-info">
                            <h3>João Silva</h3>
                            <p>Analista SPED</p>
                        </div>

                        <button
                            type="button"
                            className="home-usuario-opcoes"
                        >
                            <img
                                src={iconeTresPontos}
                                alt="Mais opções"
                            />
                        </button>

                    </div>

                </header>

                {/* CONTEÚDO DA PÁGINA */}
                <div className="home-conteudo">

                    <h1>Olá, João!</h1>

                    <p className="home-subtitulo">
                        Confira um resumo das principais informações do sistema.
                    </p>

                    {/* CARDS DE RESUMO */}
                    <div className="home-resumo">

                        <div className="home-card">

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

                        <div className="home-card">

                            <div className="home-card-icone">
                                <img src={arquivoHome} alt="" />
                            </div>

                            <div className="home-card-info">
                                <p>Notas fiscais</p>
                                <strong>100</strong>
                            </div>

                            <span className="home-card-crescimento">
                                ↑ 24%
                            </span>

                        </div>

                        <div className="home-card">

                            <div className="home-card-icone">
                                <img src={arquivoHome} alt="" />
                            </div>

                            <div className="home-card-info">
                                <p>Atualizações das tabelas liquídadas</p>
                                <strong>115</strong>
                            </div>

                            <span className="home-card-crescimento">
                                ↑ 15%
                            </span>

                        </div>

                    </div>

                    {/* LISTA E ACESSO RÁPIDO */}
                    <div className="home-baixo">

                        <section className="home-lista">

                            <div className="home-lista-item">

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

                            <div className="home-lista-item">

                                <div className="home-lista-icone home-lista-icone-vermelho">
                                    <img src={DoisDocumentos} alt="" />
                                </div>

                                <div className="home-lista-texto">
                                    <h3>
                                        Atualização de Tabelas Liquidas
                                    </h3>

                                    <p>Publicado em 02/10/2026</p>
                                </div>

                                <span className="home-tag home-tag-roxo">
                                    Reforma Tributária
                                </span>

                            </div>

                            <div className="home-lista-item">

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
                            >
                                Ver todos →
                            </button>

                        </section>

                        {/* ACESSO RÁPIDO */}
                        <section className="home-acesso">

                            <h2>Acesso rápido</h2>

                            <button
                                type="button"
                                className="home-acesso-botao"
                            >
                                <img src={iconeExpandir} alt="" />
                                <span>Novo conteúdo</span>
                            </button>

                            <button
                                type="button"
                                className="home-acesso-botao"
                            >
                                <img src={iconeUpload} alt="" />
                                <span>Enviar XML</span>
                            </button>

                            <button
                                type="button"
                                className="home-acesso-botao"
                            >
                                <img src={iconeDocumento} alt="" />
                                <span>Consultar NF-e</span>
                            </button>

                            <button
                                type="button"
                                className="home-acesso-botao"
                            >
                                <img src={iconeGrupo} alt="" />
                                <span>Consultar clientes</span>
                            </button>

                        </section>

                    </div>

                </div>

            </section>

        </main>
    );
}
