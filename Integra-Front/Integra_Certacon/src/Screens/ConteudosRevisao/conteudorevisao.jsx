
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
        Pendente: conteudos.filter((item) => item.status === "Pendente").length,
        Aprovado: conteudos.filter((item) => item.status === "Aprovado").length,
        Rejeitado: conteudos.filter((item) => item.status === "Rejeitado").length,
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

                    <div className="revisao-abas">
                        <button
                            className={abaAtiva === "Pendente" ? "aba-revisao ativa" : "aba-revisao"}
                            onClick={() => mudarAba("Pendente")}
                        >
                            Pendentes ({contagens.Pendente})
                        </button>

                        <button
                            className={abaAtiva === "Aprovado" ? "aba-revisao ativa" : "aba-revisao"}
                            onClick={() => mudarAba("Aprovado")}
                        >
                            Aprovados ({contagens.Aprovado})
                        </button>

                        <button
                            className={abaAtiva === "Rejeitado" ? "aba-revisao ativa" : "aba-revisao"}
                            onClick={() => mudarAba("Rejeitado")}
                        >
                            Rejeitados ({contagens.Rejeitado})
                        </button>
                    </div>

                    <div className="revisao-tabela-container">
                        <table className="revisao-tabela">
                            <thead>
                                <tr>
                                    <th>Título</th>
                                    <th>Tema</th>
                                    <th>Data de publicação</th>
                                    <th>Autor</th>
                                    <th className="revisao-coluna-acoes">Ações</th>
                                </tr>
                            </thead>

                            <tbody>
                                {listaPaginada.length > 0 ? (
                                    listaPaginada.map((conteudo) => (
                                        <tr key={conteudo.id}>
                                            <td>{conteudo.titulo}</td>

                                            <td>
                                                <span
                                                    className={`revisao-etiqueta tema-${conteudo.tema
                                                        .toLowerCase()
                                                        .replace(/\s+/g, "-")
                                                        .replace(/[ãá]/g, "a")
                                                        .replace(/[éê]/g, "e")}`}
                                                >
                                                    {conteudo.tema}
                                                </span>
                                            </td>

                                            <td>{conteudo.data}</td>
                                            <td>{conteudo.autor}</td>

                                            <td className="revisao-coluna-acoes">
                                                <button
                                                    className="revisao-acao editar"
                                                    title="Editar conteúdo"
                                                    onClick={() => editarConteudo(conteudo)}
                                                >
                                                    <img src={EditarQuadrado} alt="Editar" />
                                                </button>

                                                <button
                                                    className="revisao-acao excluir"
                                                    title="Excluir conteúdo"
                                                    onClick={() => excluirConteudo(conteudo.id)}
                                                >
                                                    <img src={Lixeira} alt="Excluir" />
                                                </button>

                                                {abaAtiva === "Pendente" && (
                                                    <div className="revisao-acoes-status">
                                                        <button
                                                            title="Aprovar conteúdo"
                                                            onClick={() => alterarStatus(conteudo.id, "Aprovado")}
                                                        >
                                                            ✓
                                                        </button>

                                                        <button
                                                            title="Rejeitar conteúdo"
                                                            onClick={() => alterarStatus(conteudo.id, "Rejeitado")}
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
                                className={paginaAtual === numero ? "pagina-ativa" : ""}
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

function Sidebar() {
    return (
        <aside className="revisao-sidebar">
            <div className="revisao-logo">
                <img src={LogoNome} alt="Integra" />
            </div>

            <nav className="revisao-menu">
                <a href="#" className="revisao-menu-item">
                    <img src={CasaBranca} alt="" />
                    <span>Início</span>
                </a>

                <a href="#" className="revisao-menu-item revisao-menu-ativo">
                    <img src={LivroBranco} alt="" />
                    <span>Conteúdos</span>
                </a>

                <a href="#" className="revisao-menu-item">
                    <img src={DoisDocumentosBranco} alt="" />
                    <span>Notas Fiscais</span>
                </a>

                <a href="#" className="revisao-menu-item">
                    <img src={ADDProfileBranco} alt="" />
                    <span>Clientes</span>
                </a>

                <a href="#" className="revisao-menu-item">
                    <img src={PessoaBranca} alt="" />
                    <span>Usuários</span>
                </a>
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

function Header({ pesquisa, setPesquisa }) {
    return (
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
                <div className="revisao-avatar">JS</div>

                <div className="revisao-dados-usuario">
                    <strong>João Silva</strong>
                    <span>Analista SPED</span>
                </div>

                <span className="revisao-opcoes">•••</span>
            </div>
        </header>
    );
}

export default ConteudoRevisao;
