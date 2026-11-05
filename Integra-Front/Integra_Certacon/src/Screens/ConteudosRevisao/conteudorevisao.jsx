
import { useState } from "react";
import "./conteudorevisao.css";

import CasaBranca from "../../assets/Icones/CasaBranca.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
import LupaCinza from "../../assets/Icones/LupaCinza.png";
import SairBranco from "../../assets/Icones/SairBranco.png";
import Lixeira from "../../assets/Icones/Lixeira.png";
import EditarQuadrado from "../../assets/Icones/EditarQuadrado.png";
import LogoNome from "../../assets/Icones/LogoNome.png";
import LogoNomeMobile from "../../assets/Icones/LogoNomeMobile.png";

const dadosIniciais = [
    {
        id: 1,
        titulo: "Reforma Tributárias",
        tema: "Reforma Tributária",
        data: "12/04/2025",
        autor: "Maria Oliveira",
        status: "Pendente",
    },
    {
        id: 2,
        titulo: "SPED focal 2025",
        tema: "SPED",
        data: "14/04/2025",
        autor: "Carlos Mendes",
        status: "Pendente",
    },
    {
        id: 3,
        titulo: "NF-e: Validação da Chave",
        tema: "Notas Fiscais",
        data: "26/04/2025",
        autor: "Ana Costa",
        status: "Pendente",
    },
    {
        id: 4,
        titulo: "SPED focal 2025",
        tema: "ICMS",
        data: "27/04/2025",
        autor: "Juliana Souza",
        status: "Pendente",
    },
    {
        id: 5,
        titulo: "NF-e: Validação da Chave",
        tema: "PES/CONFINS",
        data: "10/05/2025",
        autor: "Carlos Mendes",
        status: "Pendente",
    },
    {
        id: 6,
        titulo: "Reforma Tributária",
        tema: "Reforma Tributária",
        data: "11/05/2025",
        autor: "Maria Oliveira",
        status: "Aprovado",
    },
    {
        id: 7,
        titulo: "SPED Fiscal 2025",
        tema: "SPED",
        data: "15/05/2025",
        autor: "Carlos Mendes",
        status: "Aprovado",
    },
    {
        id: 8,
        titulo: "NF-e: Validação da Chave",
        tema: "Notas Fiscais",
        data: "20/05/2025",
        autor: "Ana Costa",
        status: "Rejeitado",
    },
];

const itensPorPagina = 5;

function ConteudoRevisao() {
    const [conteudos, setConteudos] = useState(dadosIniciais);
    const [abaAtiva, setAbaAtiva] = useState("Pendente");
    const [pagina, setPagina] = useState(1);
    const [pesquisa, setPesquisa] = useState("");

    const contagens = {
        Pendente: conteudos.filter(
            (item) => item.status === "Pendente"
        ).length,

        Aprovado: conteudos.filter(
            (item) => item.status === "Aprovado"
        ).length,

        Rejeitado: conteudos.filter(
            (item) => item.status === "Rejeitado"
        ).length,
    };

    const listaFiltrada = conteudos.filter((item) => {
        const correspondeStatus = item.status === abaAtiva;
        const texto = pesquisa.toLowerCase();

        const correspondePesquisa =
            item.titulo.toLowerCase().includes(texto) ||
            item.tema.toLowerCase().includes(texto) ||
            item.autor.toLowerCase().includes(texto);

        return correspondeStatus && correspondePesquisa;
    });

    const totalPaginas = Math.max(
        1,
        Math.ceil(listaFiltrada.length / itensPorPagina)
    );

    const paginaAtual = Math.min(pagina, totalPaginas);

    const listaPaginada = listaFiltrada.slice(
        (paginaAtual - 1) * itensPorPagina,
        paginaAtual * itensPorPagina
    );

    function mudarAba(status) {
        setAbaAtiva(status);
        setPagina(1);
    }

    function excluirConteudo(id) {
        const confirmar = window.confirm(
            "Deseja realmente excluir este conteúdo?"
        );

        if (confirmar) {
            setConteudos((lista) =>
                lista.filter((item) => item.id !== id)
            );

            setPagina(1);
        }
    }

    function editarConteudo(conteudo) {
        alert(`Editar conteúdo: ${conteudo.titulo}`);
    }

    function alterarStatus(id, status) {
        setConteudos((lista) =>
            lista.map((item) =>
                item.id === id ? { ...item, status } : item
            )
        );
    }

    return (
        <div className="revisao-pagina">

            <Sidebar />

            <main className="revisao-principal">

                <Header
                    pesquisa={pesquisa}
                    setPesquisa={(valor) => {
                        setPesquisa(valor);
                        setPagina(1);
                    }}
                />

                <section className="revisao-conteudo">

                    <h1 className="revisao-titulo">
                        Conteúdos para revisão
                    </h1>

                    {/* ABAS */}

                    <div className="revisao-abas">

                        <button
                            className={
                                abaAtiva === "Pendente"
                                    ? "aba-revisao ativa"
                                    : "aba-revisao"
                            }
                            onClick={() => mudarAba("Pendente")}
                        >
                            Pendentes ({contagens.Pendente})
                        </button>

                        <button
                            className={
                                abaAtiva === "Aprovado"
                                    ? "aba-revisao ativa"
                                    : "aba-revisao"
                            }
                            onClick={() => mudarAba("Aprovado")}
                        >
                            Aprovados ({contagens.Aprovado})
                        </button>

                        <button
                            className={
                                abaAtiva === "Rejeitado"
                                    ? "aba-revisao ativa"
                                    : "aba-revisao"
                            }
                            onClick={() => mudarAba("Rejeitado")}
                        >
                            Rejeitados ({contagens.Rejeitado})
                        </button>

                    </div>

                    {/* TABELA DESKTOP */}

                    <div className="revisao-tabela-container">

                        <table className="revisao-tabela">

                            <thead>
                                <tr>
                                    <th>Título</th>
                                    <th>Tema</th>
                                    <th>Data de publicação</th>
                                    <th>Autor</th>
                                    <th className="revisao-coluna-acoes">
                                        Ações
                                    </th>
                                </tr>
                            </thead>

                            <tbody>

                                {listaPaginada.length > 0 ? (
                                    listaPaginada.map((item) => (

                                        <tr key={item.id}>

                                            <td>{item.titulo}</td>

                                            <td>
                                                <span className="revisao-etiqueta">
                                                    {item.tema}
                                                </span>
                                            </td>

                                            <td>{item.data}</td>

                                            <td>{item.autor}</td>

                                            <td className="revisao-coluna-acoes">

                                                <button
                                                    className="revisao-acao editar"
                                                    title="Editar conteúdo"
                                                    onClick={() => editarConteudo(item)}
                                                >
                                                    <img src={EditarQuadrado} alt="Editar" />
                                                </button>

                                                <button
                                                    className="revisao-acao excluir"
                                                    title="Excluir conteúdo"
                                                    onClick={() => excluirConteudo(item.id)}
                                                >
                                                    <img src={Lixeira} alt="Excluir" />
                                                </button>

                                                {abaAtiva === "Pendente" && (
                                                    <div className="revisao-acoes-status">

                                                        <button
                                                            title="Aprovar conteúdo"
                                                            onClick={() =>
                                                                alterarStatus(item.id, "Aprovado")
                                                            }
                                                        >
                                                            ✓
                                                        </button>

                                                        <button
                                                            title="Rejeitar conteúdo"
                                                            onClick={() =>
                                                                alterarStatus(item.id, "Rejeitado")
                                                            }
                                                        >
                                                            ×
                                                        </button>

                                                    </div>
                                                )}

                                            </td>

                                        </tr>

                                    ))
                                ) : (

                                    <tr>
                                        <td colSpan="5" className="revisao-vazio">
                                            Nenhum conteúdo encontrado.
                                        </td>
                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                    {/* CARTÕES MOBILE */}

                    <div className="revisao-cartoes">

                        {listaPaginada.length > 0 ? (

                            listaPaginada.map((item) => (

                                <article className="revisao-cartao" key={item.id}>

                                    <div className="cartao-campo cartao-titulo">
                                        <strong>Título</strong>
                                        <span>{item.titulo}</span>
                                    </div>

                                    <div className="cartao-campo cartao-data">
                                        <strong>Data de publicação</strong>
                                        <span>{item.data}</span>
                                    </div>

                                    <div className="cartao-campo cartao-tema">
                                        <strong>Tema</strong>
                                        <span className="revisao-etiqueta">
                                            {item.tema}
                                        </span>
                                    </div>

                                    <div className="cartao-campo cartao-autor">
                                        <strong>Autor</strong>
                                        <span>{item.autor}</span>
                                    </div>

                                    <div className="cartao-acoes">

                                        <button
                                            className="revisao-acao editar"
                                            title="Editar conteúdo"
                                            onClick={() => editarConteudo(item)}
                                        >
                                            <img src={EditarQuadrado} alt="Editar" />
                                        </button>

                                        <button
                                            className="revisao-acao excluir"
                                            title="Excluir conteúdo"
                                            onClick={() => excluirConteudo(item.id)}
                                        >
                                            <img src={Lixeira} alt="Excluir" />
                                        </button>

                                    </div>

                                </article>

                            ))

                        ) : (

                            <p className="revisao-vazio-mobile">
                                Nenhum conteúdo encontrado.
                            </p>

                        )}

                    </div>

                    {/* PAGINAÇÃO */}

                    <div className="revisao-paginacao">

                        <button
                            disabled={paginaAtual === 1}
                            onClick={() => setPagina(paginaAtual - 1)}
                            aria-label="Página anterior"
                        >
                            {"<"}
                        </button>

                        {Array.from(
                            { length: totalPaginas },
                            (_, indice) => indice + 1
                        ).map((numero) => (

                            <button
                                key={numero}
                                className={
                                    paginaAtual === numero
                                        ? "pagina-ativa"
                                        : ""
                                }
                                onClick={() => setPagina(numero)}
                            >
                                {numero}
                            </button>

                        ))}

                        <button
                            disabled={paginaAtual === totalPaginas}
                            onClick={() => setPagina(paginaAtual + 1)}
                            aria-label="Próxima página"
                        >
                            {">"}
                        </button>

                    </div>

                </section>

            </main>

        </div>
    );
}

/* MENU LATERAL E INFERIOR */

function Sidebar() {
    const telaSelecionada = "Conteúdos";

    const itensMenu = [
        { nome: "Início", icone: CasaBranca },
        { nome: "Conteúdos", icone: LivroBranco },
        { nome: "Notas Fiscais", icone: DoisDocumentosBranco },
        { nome: "Clientes", icone: ADDProfileBranco },
        { nome: "Usuários", icone: PessoaBranca },
    ];

    return (
        <aside className="revisao-sidebar">

            <div className="revisao-logo">
                <img src={LogoNome} alt="Integra" />
            </div>

            <nav className="revisao-menu">

                {itensMenu.map((item) => {

                    const selecionado = telaSelecionada === item.nome;

                    return (
                        <a
                            href="#"
                            key={item.nome}
                            className={
                                selecionado
                                    ? "revisao-menu-item revisao-menu-ativo"
                                    : "revisao-menu-item"
                            }
                            onClick={(e) => e.preventDefault()}
                        >
                            <img
                                src={item.icone}
                                alt=""
                                className={
                                    selecionado
                                        ? "icone-menu-selecionado"
                                        : ""
                                }
                            />

                            <span>{item.nome}</span>
                        </a>
                    );
                })}

            </nav>

            <button
                className="revisao-sair"
                onClick={() => alert("Configure aqui a saída da conta.")}
            >
                <img src={SairBranco} alt="" />
                <span>Sair</span>
            </button>

        </aside>
    );
}

/* CABEÇALHO */

function Header({ pesquisa, setPesquisa }) {
    return (
        <>

            {/* HEADER MOBILE */}

            <header className="revisao-header-mobile">

                <div className="revisao-header-superior-mobile">

                    <img
                        src={LogoNomeMobile}
                        alt="Integra"
                        className="revisao-logo-mobile"
                    />

                    <div className="revisao-usuario-mobile">

                        <div className="revisao-avatar-mobile">
                            JS
                        </div>

                        <div className="revisao-dados-mobile">
                            <strong>João Silva</strong>
                            <span>Analista SPED</span>
                        </div>

                    </div>

                </div>

                <div className="revisao-busca-mobile">

                    <img src={LupaCinza} alt="" />

                    <input
                        type="text"
                        placeholder="Buscar conteúdos, notas fiscais, etc..."
                        value={pesquisa}
                        onChange={(e) => setPesquisa(e.target.value)}
                    />

                </div>

            </header>

            {/* HEADER DESKTOP */}

            <header className="revisao-header">

                <div className="revisao-busca">

                    <img src={LupaCinza} alt="" />

                    <input
                        type="text"
                        placeholder="Buscar conteúdos, notas fiscais, etc..."
                        value={pesquisa}
                        onChange={(e) => setPesquisa(e.target.value)}
                    />

                </div>

                <div className="revisao-usuario">

                    <div className="revisao-avatar">
                        JS
                    </div>

                    <div className="revisao-dados-usuario">
                        <strong>João Silva</strong>
                        <span>Analista SPED</span>
                    </div>

                    <span className="revisao-opcoes">•••</span>

                </div>

            </header>

        </>
    );
}

export default ConteudoRevisao;
