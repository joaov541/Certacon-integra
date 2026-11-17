
import { useState, useEffect } from "react";
import "./Home.css";

import { NavLink, useNavigate } from "react-router-dom";
import { requisicaoApi } from "../../services/api";

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

    // Dados do usuário que realizou o login
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

    const nomeUsuario = usuario.nome?.split(" ")[0] || "usuário";

    const perfis = usuario.perfis ||
        JSON.parse(localStorage.getItem("perfis") || "[]");

    const ehAdministrador = perfis.includes("Administrador");

    const podeRevisar =
        ehAdministrador || perfis.includes("Coordenador Fiscal");

    // Dados do Dashboard
    const [artigos, setArtigos] = useState([]);
    const [notas, setNotas] = useState([]);
    const [pendentes, setPendentes] = useState([]);

    const [carregando, setCarregando] = useState(true);
    const [erroDashboard, setErroDashboard] = useState("");

    // Carrega as informações da API
    useEffect(() => {
        async function carregarDashboard() {
            setCarregando(true);
            setErroDashboard("");

            const erros = [];

            try {
                const dadosArtigos = await requisicaoApi("/api/Artigos");

                setArtigos(
                    Array.isArray(dadosArtigos) ? dadosArtigos : []
                );
            } catch (error) {
                console.error("Erro ao carregar conteúdos:", error);
                erros.push("Não foi possível carregar os conteúdos.");
            }

            try {
                const dadosNotas = await requisicaoApi("/api/NotasFiscais");

                setNotas(
                    Array.isArray(dadosNotas) ? dadosNotas : []
                );
            } catch (error) {
                console.error("Erro ao carregar notas fiscais:", error);
                erros.push("Não foi possível carregar as notas fiscais.");
            }

            if (podeRevisar) {
                try {
                    const dadosPendentes = await requisicaoApi(
                        "/api/Artigos/pendentes-revisao"
                    );

                    setPendentes(
                        Array.isArray(dadosPendentes) ? dadosPendentes : []
                    );
                } catch (error) {
                    console.error("Erro ao carregar revisões:", error);
                    erros.push("Não foi possível carregar os conteúdos em revisão.");
                }
            }

            if (erros.length > 0) {
                setErroDashboard(erros.join(" "));
            }

            setCarregando(false);
        }

        carregarDashboard();
    }, [podeRevisar]);

    // Organiza os conteúdos mais recentes
    const ultimosArtigos = [...artigos]
        .sort((a, b) => {
            return new Date(b.dataPublicacao || 0) -
                new Date(a.dataPublicacao || 0);
        })
        .slice(0, 3);

    // Formata as datas
    function formatarData(data) {
        if (!data) {
            return "Data não informada";
        }

        const dataFormatada = new Date(data);

        if (isNaN(dataFormatada.getTime())) {
            return "Data não informada";
        }

        return dataFormatada.toLocaleDateString("pt-BR");
    }

    // Realiza o logout
    function sairSistema() {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        localStorage.removeItem("perfis");

        navigate("/login", { replace: true });
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

                    <h1>Olá, {nomeUsuario}!</h1>

                    <p className="home-subtitulo">
                        Confira um resumo das principais informações do sistema.
                    </p>

                    {erroDashboard && (
                        <p className="home-erro">
                            {erroDashboard}
                        </p>
                    )}

                    {/* CARDS DE RESUMO */}
                    <div className="home-resumo">

                        {/* CONTEÚDOS PUBLICADOS */}
                        <div
                            className="home-card"
                            role="link"
                            tabIndex={0}
                            onClick={() => navigate("/conteudos")}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    navigate("/conteudos");
                                }
                            }}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="home-card-icone">
                                <img src={arquivoHome} alt="" />
                            </div>

                            <div className="home-card-info">
                                <p>Conteúdos publicados</p>
                                <strong>
                                    {carregando ? "..." : artigos.length}
                                </strong>
                            </div>

                            <span className="home-card-crescimento">
                                Publicados
                            </span>
                        </div>

                        {/* NOTAS FISCAIS */}
                        <div
                            className="home-card"
                            role="link"
                            tabIndex={0}
                            onClick={() => navigate("/notas-fiscais")}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    navigate("/notas-fiscais");
                                }
                            }}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="home-card-icone">
                                <img src={arquivoHome} alt="" />
                            </div>

                            <div className="home-card-info">
                                <p>Notas Fiscais</p>
                                <strong>
                                    {carregando ? "..." : notas.length}
                                </strong>
                            </div>

                            <span className="home-card-crescimento home-card-ativas">
                                Ativas
                            </span>
                        </div>

                        {/* CONTEÚDOS EM REVISÃO */}
                        {podeRevisar && (
                            <div
                                className="home-card"
                                role="link"
                                tabIndex={0}
                                onClick={() => navigate("/conteudos/revisao")}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        navigate("/conteudos/revisao");
                                    }
                                }}
                                style={{ cursor: "pointer" }}
                            >
                                <div className="home-card-icone">
                                    <img src={arquivoHome} alt="" />
                                </div>

                                <div className="home-card-info">
                                    <p>Conteúdos em revisão</p>
                                    <strong>
                                        {carregando ? "..." : pendentes.length}
                                    </strong>
                                </div>

                                <span className="home-card-crescimento home-card-atencao">
                                    Atenção
                                </span>
                            </div>
                        )}

                    </div>

                    {/* LISTA E ACESSO RÁPIDO */}
                    <div className="home-baixo">

                        {/* ÚLTIMAS ATUALIZAÇÕES */}
                        <section className="home-lista">

                            {ultimosArtigos.length > 0 ? (
                                ultimosArtigos.map((artigo, index) => (
                                    <div
                                        key={artigo.artigoId}
                                        className="home-lista-item"
                                        onClick={() => navigate("/conteudos/detalhes")}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <div
                                            className={`home-lista-icone ${
                                                index === 0
                                                    ? "home-lista-icone-verde"
                                                    : index === 1
                                                        ? "home-lista-icone-vermelho"
                                                        : "home-lista-icone-azul"
                                            }`}
                                        >
                                            <img src={DoisDocumentos} alt="" />
                                        </div>

                                        <div className="home-lista-texto">
                                            <h3>{artigo.titulo}</h3>

                                            <p>
                                                Publicado em{" "}
                                                {formatarData(artigo.dataPublicacao)}
                                            </p>
                                        </div>

                                        <span
                                            className={`home-tag ${
                                                index === 0
                                                    ? "home-tag-verde"
                                                    : "home-tag-roxo"
                                            }`}
                                        >
                                            {artigo.tema || "Conteúdo"}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="home-lista-vazia">
                                    {carregando
                                        ? "Carregando conteúdos..."
                                        : "Nenhum conteúdo publicado encontrado."}
                                </p>
                            )}

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

                            {podeRevisar && (
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
                            )}

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

                            {ehAdministrador && (
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
                            )}

                        </section>

                    </div>

                </div>

            </section>

        </main>
    );
}
