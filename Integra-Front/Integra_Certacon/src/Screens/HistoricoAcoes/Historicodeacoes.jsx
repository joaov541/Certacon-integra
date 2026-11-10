
import { useState } from "react";
import "./Historicodeacoes.css";

import { NavLink } from "react-router-dom";

import CasaBranca from "../../assets/Icones/CasaBranca.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
import LupaCinza from "../../assets/Icones/LupaCinza.png";
import SairBranco from "../../assets/Icones/SairBranco.png";
import LogoNome from "../../assets/Icones/LogoNome.png";
import LogoNomeMobile from "../../assets/Icones/LogoNomeMobile.png";
import Calendario from "../../assets/Icones/calendario.png";
import ExpandirText from "../../assets/Icones/ExpandirText.png";

const dadosIniciais = [
    {
        id: 1,
        data: "12/04/2025",
        hora: "14:22",
        usuario: "Maria Oliveira",
        acao: "Publicação",
        descricao: "Conteúdo publicado Tributado",
    },
    {
        id: 2,
        data: "14/04/2025",
        hora: "14:44",
        usuario: "Junior Santos",
        acao: "Publicação",
        descricao: "Conteúdo publicado Tributado",
    },
    {
        id: 3,
        data: "26/04/2025",
        hora: "14:12",
        usuario: "Felipe Fontes",
        acao: "Publicação",
        descricao: "Conteúdo publicado Tributado",
    },
    {
        id: 4,
        data: "27/04/2025",
        hora: "14:40",
        usuario: "James Marques",
        acao: "Publicação",
        descricao: "Conteúdo publicado Tributado",
    },
    {
        id: 5,
        data: "01/05/2025",
        hora: "14:30",
        usuario: "Pablo Sousa",
        acao: "Publicação",
        descricao: "Conteúdo publicado Tributado",
    },
];

function Historicodeacoes() {
    const [acoes] = useState(dadosIniciais);
    const [pesquisa, setPesquisa] = useState("");
    const [usuarioSelecionado, setUsuarioSelecionado] = useState("Todos");
    const [tipoSelecionado, setTipoSelecionado] = useState("Todas");
    const [dataInicio, setDataInicio] = useState("2025-04-01");
    const [dataFim, setDataFim] = useState("2025-04-30");
    const [paginaAtual, setPaginaAtual] = useState(1);

    const itensPorPagina = 5;

    const usuarios = [
        "Todos",
        ...new Set(acoes.map((item) => item.usuario)),
    ];

    const tipos = [
        "Todas",
        ...new Set(acoes.map((item) => item.acao)),
    ];

    const listaFiltrada = acoes.filter((item) => {
        const texto = pesquisa.toLowerCase();

        const encontrouPesquisa =
            item.usuario.toLowerCase().includes(texto) ||
            item.acao.toLowerCase().includes(texto) ||
            item.descricao.toLowerCase().includes(texto);

        const encontrouUsuario =
            usuarioSelecionado === "Todos" ||
            item.usuario === usuarioSelecionado;

        const encontrouTipo =
            tipoSelecionado === "Todas" ||
            item.acao === tipoSelecionado;

        return encontrouPesquisa && encontrouUsuario && encontrouTipo;
    });

    const totalPaginas = Math.max(
        1,
        Math.ceil(listaFiltrada.length / itensPorPagina)
    );

    const inicio = (paginaAtual - 1) * itensPorPagina;

    const acoesExibidas = listaFiltrada.slice(
        inicio,
        inicio + itensPorPagina
    );

    function buscarAcoes() {
        setPaginaAtual(1);
    }

    return (
        <div className="pagina-historico">

            <Sidebar />

            <main className="principal-historico">

                <Header
                    pesquisa={pesquisa}
                    setPesquisa={setPesquisa}
                />

                <section className="conteudo-historico">

                    <NavLink to="/home" className="voltar-historico">
                        ← Voltar
                    </NavLink>

                    <h1>Histórico de ações</h1>

                    <div className="filtros-historico">

                        {/* PERÍODO */}
                        <div className="campo-filtro periodo-filtro">
                            <label>Período</label>

                            <div className="campos-periodo">

                                <div className="campo-data">
                                    <input
                                        type="date"
                                        value={dataInicio}
                                        onChange={(e) =>
                                            setDataInicio(e.target.value)
                                        }
                                    />

                                    <img src={Calendario} alt="Calendário" />
                                </div>

                                <span>-</span>

                                <div className="campo-data">
                                    <input
                                        type="date"
                                        value={dataFim}
                                        onChange={(e) =>
                                            setDataFim(e.target.value)
                                        }
                                    />

                                    <img src={Calendario} alt="Calendário" />
                                </div>

                            </div>
                        </div>

                        {/* USUÁRIO */}
                        <div className="campo-filtro usuario-filtro">
                            <label>Usuário</label>

                            <div className="select-personalizado">
                                <select
                                    value={usuarioSelecionado}
                                    onChange={(e) => {
                                        setUsuarioSelecionado(e.target.value);
                                        setPaginaAtual(1);
                                    }}
                                >
                                    {usuarios.map((usuario) => (
                                        <option key={usuario} value={usuario}>
                                            {usuario}
                                        </option>
                                    ))}
                                </select>

                                <img
                                    src={ExpandirText}
                                    alt="Expandir opções"
                                />
                            </div>
                        </div>

                        {/* TIPO DE AÇÃO */}
                        <div className="campo-filtro tipo-filtro">
                            <label>Tipo de ação</label>

                            <div className="select-personalizado">
                                <select
                                    value={tipoSelecionado}
                                    onChange={(e) => {
                                        setTipoSelecionado(e.target.value);
                                        setPaginaAtual(1);
                                    }}
                                >
                                    {tipos.map((tipo) => (
                                        <option key={tipo} value={tipo}>
                                            {tipo}
                                        </option>
                                    ))}
                                </select>

                                <img
                                    src={ExpandirText}
                                    alt="Expandir opções"
                                />
                            </div>
                        </div>

                        {/* BOTÃO BUSCAR */}
                        <button
                            className="botao-buscar-historico"
                            onClick={buscarAcoes}
                        >
                            Buscar
                        </button>

                    </div>

                    {/* TABELA */}
                    <div className="tabela-historico">

                        <table>

                            <thead>
                                <tr>
                                    <th>Data e hora</th>
                                    <th>Usuário</th>
                                    <th>Ação</th>
                                    <th>Descrição</th>
                                </tr>
                            </thead>

                            <tbody>

                                {acoesExibidas.length > 0 ? (
                                    acoesExibidas.map((item) => (
                                        <tr key={item.id}>

                                            <td>
                                                {item.data} {item.hora}
                                            </td>

                                            <td>{item.usuario}</td>

                                            <td>{item.acao}</td>

                                            <td>{item.descricao}</td>

                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="sem-acoes"
                                        >
                                            Nenhuma ação encontrada.
                                        </td>
                                    </tr>
                                )}

                            </tbody>

                        </table>

                    </div>

                    {/* PAGINAÇÃO */}
                    <div className="paginacao-historico">

                        <button
                            onClick={() => setPaginaAtual(1)}
                            className={
                                paginaAtual === 1 ? "pagina-ativa" : ""
                            }
                        >
                            1
                        </button>

                        <button
                            onClick={() =>
                                setPaginaAtual(Math.min(2, totalPaginas))
                            }
                            className={
                                paginaAtual === 2 ? "pagina-ativa" : ""
                            }
                            disabled={totalPaginas < 2}
                        >
                            2
                        </button>

                        <button
                            onClick={() =>
                                setPaginaAtual(Math.min(3, totalPaginas))
                            }
                            className={
                                paginaAtual === 3 ? "pagina-ativa" : ""
                            }
                            disabled={totalPaginas < 3}
                        >
                            3
                        </button>

                    </div>

                </section>

            </main>

        </div>
    );
}

/* SIDEBAR */
function Sidebar() {
    return (
        <aside className="menu-historico">

            <div className="logo-historico">

                <img
                    src={LogoNome}
                    alt="Integra"
                    className="logo-desktop-historico"
                />

                <img
                    src={LogoNomeMobile}
                    alt="Integra"
                    className="logo-mobile-historico"
                />

            </div>

            <nav className="navegacao-historico">

                <NavLink to="/home" className="item-menu-historico">
                    <img src={CasaBranca} alt="" />
                    <span>Início</span>
                </NavLink>

                <NavLink to="/conteudos" className="item-menu-historico">
                    <img src={LivroBranco} alt="" />
                    <span>Conteúdos</span>
                </NavLink>

                <NavLink to="/notas-fiscais" className="item-menu-historico">
                    <img src={DoisDocumentosBranco} alt="" />
                    <span>Notas Fiscais</span>
                </NavLink>

                <NavLink to="/clientes" className="item-menu-historico">
                    <img src={ADDProfileBranco} alt="" />
                    <span>Clientes</span>
                </NavLink>

                <NavLink to="/usuario" className="item-menu-historico">
                    <img src={PessoaBranca} alt="" />
                    <span>Usuários</span>
                </NavLink>

            </nav>

            <NavLink to="/login" className="sair-historico">
                <img src={SairBranco} alt="" />
                <span>Sair</span>
            </NavLink>

        </aside>
    );
}

/* HEADER */
function Header({ pesquisa, setPesquisa }) {
    return (
        <header className="topo-historico">

            <div className="pesquisa-topo-historico">

                <img src={LupaCinza} alt="" />

                <input
                    type="text"
                    placeholder="Buscar ações..."
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                />

            </div>

            <div className="usuario-topo-historico">

                <div className="avatar-historico">
                    JS
                </div>

                <div className="dados-usuario-historico">
                    <strong>João Silva</strong>
                    <span>Administrador</span>
                </div>

            </div>

        </header>
    );
}

export default Historicodeacoes;
