
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./conteudoTributario.css";

import CasaBranca from "../../assets/Icones/CasaBranca.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
import LupaCinza from "../../assets/Icones/LupaCinza.png";
import ExpandirText from "../../assets/Icones/ExpandirText.png";
import SairBranco from "../../assets/Icones/SairBranco.png";
import Lixeira from "../../assets/Icones/Lixeira.png";
import LogoNome from "../../assets/Icones/LogoNome.png";
import iconeConteudo from "../../assets/Icones/DoisDocumentos.png";

import Header from "../../components/Header/header";
import HeaderDesktop from "../../components/Header/headerDesktop";

const dadosIniciais = [
    {
        id: 1,
        titulo: "Reforma tributária",
        tema: "Reforma Tributária",
        data: "09/10/2026",
        autor: "Maria de Oliveira",
        conteudo: "Este artigo apresenta as principais mudanças da Reforma Tributária, com destaque para a implementação do IBS e da CBS, seus impactos nas empresas e as novas regras de tributação."
    },
    {
        id: 2,
        titulo: "SPED Fiscal 2025",
        tema: "SPED",
        data: "12/09/2022",
        autor: "João da Silva",
        conteudo: "Este conteúdo aborda as atualizações do SPED Fiscal para 2025, explicando as principais obrigações, os registros fiscais e os cuidados necessários no envio das informações."
    },
    {
        id: 3,
        titulo: "Atualização das Tabelas",
        tema: "Reforma Tributária",
        data: "08/08/2028",
        autor: "Lívia Frete",
        conteudo: "Confira as atualizações das tabelas relacionadas à Reforma Tributária e entenda como essas alterações podem afetar os processos fiscais das empresas."
    },
    {
        id: 4,
        titulo: "Validação Chave Acesso",
        tema: "Reforma Tributária",
        data: "05/08/2020",
        autor: "Hugo Xavier",
        conteudo: "Neste artigo, apresentamos orientações sobre a validação da chave de acesso dos documentos fiscais e os principais pontos que devem ser verificados."
    },
    {
        id: 5,
        titulo: "PIS/Configurações",
        tema: "PES/CONFINS",
        data: "10/05/2025",
        autor: "Carlos Mendes",
        conteudo: "Este material apresenta informações sobre as configurações de PIS e COFINS, incluindo orientações para parametrização e conferência dos dados fiscais."
    },
];

function ConteudoTributario() {
    const navigate = useNavigate();

    const [conteudos, setConteudos] = useState(dadosIniciais);
    const [pesquisa, setPesquisa] = useState("");
    const [temaSelecionado, setTemaSelecionado] = useState("Todos");
    const [ordem, setOrdem] = useState("recentes");

    const listaFiltrada = conteudos
        .filter((conteudo) => {
            const texto = pesquisa.toLowerCase();

            const encontrouTexto =
                conteudo.titulo.toLowerCase().includes(texto) ||
                conteudo.tema.toLowerCase().includes(texto);

            const encontrouTema =
                temaSelecionado === "Todos" ||
                conteudo.tema === temaSelecionado;

            return encontrouTexto && encontrouTema;
        })
        .sort((a, b) => {
            const dataA = a.data.split("/").reverse().join("");
            const dataB = b.data.split("/").reverse().join("");

            return ordem === "recentes"
                ? dataB.localeCompare(dataA)
                : dataA.localeCompare(dataB);
        });

    function excluirConteudo(id) {
        const confirmar = window.confirm(
            "Deseja realmente excluir este conteúdo?"
        );

        if (confirmar) {
            setConteudos((atuais) =>
                atuais.filter((conteudo) => conteudo.id !== id)
            );
        }
    }

    return (
        <div className="pagina-conteudos">

            <Sidebar />

            <main className="principal-conteudos">

                {/* HEADER DESKTOP */}

                <HeaderDesktop
                    pesquisa={pesquisa}
                    setPesquisa={setPesquisa}
                />

                {/* HEADER RESPONSIVO */}

                <Header
                    pesquisa={pesquisa}
                    setPesquisa={setPesquisa}
                />

                <section className="area-lista-conteudos">

                    <div className="titulo-conteudos">

                        <div>
                            <h1>Conteúdos Tributários</h1>

                            <p>
                                Explore conteúdos por tema, mantenha-se conectado
                            </p>
                        </div>

                        <button
                            type="button"
                            className="adicionar-conteudo"
                            onClick={() => navigate("/conteudos/novo")}
                        >
                            <span className="adicionar-conteudo-texto">
                                + Adicionar Conteúdo
                            </span>

                            <span className="adicionar-conteudo-mais">+</span>
                        </button>

                    </div>

                    {/* FILTROS */}

                    <div className="filtros-conteudos">

                        <div className="pesquisa-lista-conteudos">

                            <img src={LupaCinza} alt="" />

                            <input
                                type="text"
                                placeholder="Buscar por título ou palavra-chave"
                                value={pesquisa}
                                onChange={(e) => setPesquisa(e.target.value)}
                            />

                        </div>

                        <div className="seletor-conteudos">

                            <select
                                value={temaSelecionado}
                                onChange={(e) => setTemaSelecionado(e.target.value)}
                            >
                                <option value="Todos">Todos os temas</option>
                                <option value="Reforma Tributária">Reforma Tributária</option>
                                <option value="SPED">SPED</option>
                                <option value="Notas Fiscais">Notas Fiscais</option>
                                <option value="ICMS">ICMS</option>
                                <option value="PES/CONFINS">PES/CONFINS</option>
                            </select>

                            <img src={ExpandirText} alt="" />

                        </div>

                        <div className="seletor-conteudos">

                            <select
                                value={ordem}
                                onChange={(e) => setOrdem(e.target.value)}
                            >
                                <option value="recentes">Mais recentes</option>
                                <option value="antigos">Mais antigos</option>
                            </select>

                            <img src={ExpandirText} alt="" />

                        </div>

                    </div>

                    {/* TABELA DE CONTEÚDOS */}

                    <div className="tabela-conteudos">

                        <table>

                            <thead>
                                <tr>
                                    <th>Título</th>
                                    <th>Tema</th>
                                    <th>Data de publicação</th>
                                    <th>Autor</th>
                                    <th className="coluna-acoes">Ações</th>
                                </tr>
                            </thead>

                            <tbody>

                                {listaFiltrada.length > 0 ? (

                                    listaFiltrada.map((conteudo) => (

                                        <tr
                                            key={conteudo.id}
                                            className="linha-conteudo-clicavel"
                                            onClick={() =>
                                                navigate("/conteudos/detalhes", {
                                                    state: { conteudo }
                                                })
                                            }
                                        >

                                            <td className="celula-titulo">

                                                <img
                                                    src={iconeConteudo}
                                                    alt=""
                                                    className="icone-card-conteudo"
                                                />

                                                <strong>{conteudo.titulo}</strong>

                                            </td>

                                            <td className="celula-tema">

                                                <span
                                                    className={`etiqueta-tema ${
                                                        conteudo.tema === "SPED"
                                                            ? "tema-sped"
                                                            : conteudo.tema === "ICMS"
                                                                ? "tema-icms"
                                                                : conteudo.tema === "Notas Fiscais"
                                                                    ? "tema-notas-fiscais"
                                                                    : conteudo.tema === "Reforma Tributária"
                                                                        ? "tema-reforma-tributaria"
                                                                        : "tema-padrao"
                                                    }`}
                                                >
                                                    {conteudo.tema}
                                                </span>

                                            </td>

                                            <td className="celula-data">
                                                {conteudo.data}
                                            </td>

                                            <td className="celula-autor">
                                                {conteudo.autor}
                                            </td>

                                            <td className="coluna-acoes">

                                                <button
                                                    type="button"
                                                    className="excluir-conteudo"
                                                    title="Excluir conteúdo"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        excluirConteudo(conteudo.id);
                                                    }}
                                                >
                                                    <img src={Lixeira} alt="Excluir" />
                                                </button>

                                            </td>

                                        </tr>

                                    ))

                                ) : (

                                    <tr>
                                        <td colSpan="5" className="sem-conteudos">
                                            Nenhum conteúdo encontrado.
                                        </td>
                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>

            </main>

            <FooterMobile />

        </div>
    );
}


// MENU LATERAL

function Sidebar() {

    const navigate = useNavigate();

    function sairSistema() {
        navigate("/login");
    }

    return (

        <aside className="menu-conteudos">

            <div className="logo-conteudos">
                <img src={LogoNome} alt="Integra" />
            </div>

            <nav className="navegacao-conteudos">

                <NavLink
                    to="/home"
                    className={({ isActive }) =>
                        isActive ? "item-menu menu-ativo" : "item-menu"
                    }
                >
                    <img src={CasaBranca} alt="" />
                    <span>Início</span>
                </NavLink>

                <NavLink
                    to="/conteudos"
                    className={({ isActive }) =>
                        isActive ? "item-menu menu-ativo" : "item-menu"
                    }
                >
                    <img src={LivroBranco} alt="" />
                    <span>Conteúdos</span>
                </NavLink>

                <NavLink
                    to="/notas-fiscais"
                    className={({ isActive }) =>
                        isActive ? "item-menu menu-ativo" : "item-menu"
                    }
                >
                    <img src={DoisDocumentosBranco} alt="" />
                    <span>Notas Fiscais</span>
                </NavLink>

                <NavLink
                    to="/clientes"
                    className={({ isActive }) =>
                        isActive ? "item-menu menu-ativo" : "item-menu"
                    }
                >
                    <img src={ADDProfileBranco} alt="" />
                    <span>Clientes</span>
                </NavLink>

                <NavLink
                    to="/usuario"
                    className={({ isActive }) =>
                        isActive ? "item-menu menu-ativo" : "item-menu"
                    }
                >
                    <img src={PessoaBranca} alt="" />
                    <span>Usuários</span>
                </NavLink>

            </nav>

            <button
                type="button"
                className="sair-conteudos"
                onClick={sairSistema}
            >
                <img src={SairBranco} alt="" />
                <span>Sair</span>
            </button>

        </aside>
    );
}


// MENU MOBILE

function FooterMobile() {

    return (

        <footer className="footer-conteudos-mobile">

            <NavLink
                to="/home"
                className={({ isActive }) =>
                    isActive ? "item-footer-mobile footer-ativo" : "item-footer-mobile"
                }
            >
                <img src={CasaBranca} alt="" />
                <span>Início</span>
            </NavLink>

            <NavLink
                to="/conteudos"
                className={({ isActive }) =>
                    isActive ? "item-footer-mobile footer-ativo" : "item-footer-mobile"
                }
            >
                <img src={LivroBranco} alt="" />
                <span>Conteúdos</span>
            </NavLink>

            <NavLink
                to="/notas-fiscais"
                className={({ isActive }) =>
                    isActive ? "item-footer-mobile footer-ativo" : "item-footer-mobile"
                }
            >
                <img src={DoisDocumentosBranco} alt="" />
                <span>Notas Fiscais</span>
            </NavLink>

            <NavLink
                to="/clientes"
                className={({ isActive }) =>
                    isActive ? "item-footer-mobile footer-ativo" : "item-footer-mobile"
                }
            >
                <img src={ADDProfileBranco} alt="" />
                <span>Clientes</span>
            </NavLink>

            <NavLink
                to="/usuario"
                className={({ isActive }) =>
                    isActive ? "item-footer-mobile footer-ativo" : "item-footer-mobile"
                }
            >
                <img src={PessoaBranca} alt="" />
                <span>Usuários</span>
            </NavLink>

        </footer>

    );
}

export default ConteudoTributario;
