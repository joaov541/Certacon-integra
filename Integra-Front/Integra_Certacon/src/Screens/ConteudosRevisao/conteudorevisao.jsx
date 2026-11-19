
import { useState, useEffect } from "react";
import "./conteudorevisao.css";
import {
    Check,
    Pencil,
    X,
    Eye,
    Send
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { requisicaoApi } from "../../services/api";

import CasaBranca from "../../assets/Icones/CasaBranca.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
import SairBranco from "../../assets/Icones/SairBranco.png";
import LogoNome from "../../assets/Icones/LogoNome.png";

import Header from "../../components/Header/header";

// Perfis do usuário autenticado (apenas para exibição da interface).
// A autorização real continua sendo validada na API.
function obterPerfisLogados() {
    try {
        const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
        const armazenados = JSON.parse(localStorage.getItem("perfis") || "[]");
        return Array.isArray(usuario.perfis) && usuario.perfis.length > 0
            ? usuario.perfis
            : Array.isArray(armazenados) ? armazenados : [];
    } catch {
        return [];
    }
}

const PERFIS_FISCAIS = [
    "Coordenador Fiscal",
    "Analista SPED",
    "Analista de Documentos Fiscais",
    "Analista de Reforma Tributária",
    "Cliente"
];

const itensPorPagina = 5;

function ConteudoRevisao() {

    // =========================================
    // ESTADOS
    // =========================================

    const [conteudos, setConteudos] = useState({
        Pendente: [],
        Aprovado: [],
        Rejeitado: []
    });

    const [abaAtiva, setAbaAtiva] = useState("Pendente");

    const [pagina, setPagina] = useState(1);

    const [pesquisa, setPesquisa] = useState("");

    const [carregando, setCarregando] = useState(true);

    const [erro, setErro] = useState("");

    const [acaoEmAndamento, setAcaoEmAndamento] = useState(null);

    const navigate = useNavigate();

    // =========================================
    // CARREGAR CONTEÚDOS DA API
    // =========================================

    async function carregarConteudos() {

        try {

            setCarregando(true);
            setErro("");

            const [pendentes, aprovados, rejeitados] =
                await Promise.all([

                    requisicaoApi(
                        "/api/Artigos/pendentes-revisao"
                    ),

                    requisicaoApi(
                        "/api/Artigos/revisados/APROVADO"
                    ),

                    requisicaoApi(
                        "/api/Artigos/revisados/REJEITADO"
                    )

                ]);

            setConteudos({

                Pendente: Array.isArray(pendentes)
                    ? pendentes
                    : [],

                Aprovado: Array.isArray(aprovados)
                    ? aprovados
                    : [],

                Rejeitado: Array.isArray(rejeitados)
                    ? rejeitados
                    : []

            });

        } catch (error) {

            console.error(
                "Erro ao carregar conteúdos para revisão:",
                error
            );

            setErro(
                error.message ||
                "Não foi possível carregar os conteúdos."
            );

        } finally {

            setCarregando(false);

        }

    }

    useEffect(() => {

        carregarConteudos();

    }, []);

    // =========================================
    // CONTAGENS
    // =========================================

    const contagens = {

        Pendente: conteudos.Pendente.length,

        Aprovado: conteudos.Aprovado.length,

        Rejeitado: conteudos.Rejeitado.length

    };

    // =========================================
    // FORMATAÇÃO DE DATA
    // =========================================

    function formatarData(data) {

        if (!data) return "Não informada";

        const dataFormatada = new Date(data);

        if (isNaN(dataFormatada.getTime())) {
            return "Não informada";
        }

        return dataFormatada.toLocaleDateString("pt-BR");

    }

    // =========================================
    // PESQUISA
    // =========================================

    const listaFiltrada = conteudos[abaAtiva].filter((item) => {

        const texto = pesquisa.toLowerCase();

        const titulo = (item.titulo || "").toLowerCase();

        const tema = (item.tema || "").toLowerCase();

        const autor = (item.autor || "").toLowerCase();

        return (
            titulo.includes(texto) ||
            tema.includes(texto) ||
            autor.includes(texto)
        );

    });

    // =========================================
    // PAGINAÇÃO
    // =========================================

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

        setPesquisa("");

    }

    // =========================================
    // APROVAR ARTIGO
    // =========================================

    async function aprovarConteudo(id) {

        const comentario = window.prompt(
            "Digite um comentário para o histórico da revisão (opcional):"
        );

        if (comentario === null) return;

        try {

            setAcaoEmAndamento(id);

            const resposta = await requisicaoApi(
                `/api/Artigos/${id}/aprovar`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        comentario: comentario.trim() || null
                    })
                }
            );

            alert(
                resposta?.mensagem ||
                "Conteúdo aprovado com sucesso!"
            );

            await carregarConteudos();

        } catch (error) {

            console.error("Erro ao aprovar conteúdo:", error);

            alert(
                error.message ||
                "Não foi possível aprovar o conteúdo."
            );

        } finally {

            setAcaoEmAndamento(null);

        }

    }

    // =========================================
    // REJEITAR ARTIGO
    // =========================================

    async function rejeitarConteudo(id) {

        const comentario = window.prompt(
            "Informe o motivo da rejeição:"
        );

        if (comentario === null) return;

        if (!comentario.trim()) {

            alert(
                "Informe o motivo da rejeição para continuar."
            );

            return;

        }

        try {

            setAcaoEmAndamento(id);

            const resposta = await requisicaoApi(
                `/api/Artigos/${id}/rejeitar`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        comentario: comentario.trim()
                    })
                }
            );

            alert(
                resposta?.mensagem ||
                "Conteúdo rejeitado."
            );

            await carregarConteudos();

        } catch (error) {

            console.error("Erro ao rejeitar conteúdo:", error);

            alert(
                error.message ||
                "Não foi possível rejeitar o conteúdo."
            );

        } finally {

            setAcaoEmAndamento(null);

        }

    }

    // =========================================
    // SOLICITAR AJUSTES
    // =========================================

    async function solicitarAjustes(id) {

        const comentario = window.prompt(
            "Descreva os ajustes que o autor precisa realizar:"
        );

        if (comentario === null) return;

        if (!comentario.trim()) {

            alert(
                "Descreva os ajustes necessários para continuar."
            );

            return;

        }

        try {

            setAcaoEmAndamento(id);

            const resposta = await requisicaoApi(
                `/api/Artigos/${id}/solicitar-ajustes`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        comentario: comentario.trim()
                    })
                }
            );

            alert(
                resposta?.mensagem ||
                "Ajustes solicitados ao autor."
            );

            await carregarConteudos();

        } catch (error) {

            console.error(
                "Erro ao solicitar ajustes:",
                error
            );

            alert(
                error.message ||
                "Não foi possível solicitar os ajustes."
            );

        } finally {

            setAcaoEmAndamento(null);

        }

    }

    // =========================================
    // PUBLICAR ARTIGO APROVADO
    // =========================================

    async function publicarConteudo(id) {

        const confirmar = window.confirm(
            "Deseja publicar este conteúdo? Ele ficará disponível conforme sua visibilidade."
        );

        if (!confirmar) return;

        try {

            setAcaoEmAndamento(id);

            const resposta = await requisicaoApi(
                `/api/Artigos/${id}/publicar`,
                {
                    method: "POST"
                }
            );

            alert(
                resposta?.mensagem ||
                "Conteúdo publicado com sucesso!"
            );

            await carregarConteudos();

        } catch (error) {

            console.error("Erro ao publicar conteúdo:", error);

            alert(
                error.message ||
                "Não foi possível publicar o conteúdo."
            );

        } finally {

            setAcaoEmAndamento(null);

        }

    }

    // =========================================
    // VISUALIZAR CONTEÚDO
    // =========================================

   function visualizarConteudo(item) {

    console.log("DADOS COMPLETOS DO ARTIGO:", item);

    navigate("/conteudos/detalhes", {

        state: {

            conteudo: {

                id: item.artigoId,
                artigoId: item.artigoId,
                titulo: item.titulo,
                tema: item.tema,
                data: formatarData(item.dataCriacao),
                dataPublicacao: item.dataPublicacao,
                autor: item.autor,
                resumo: item.resumo,
                conteudo: item.conteudo,
                visibilidade: item.visibilidade,
                status: item.status,

                nomeArquivo: item.nomeArquivo,
                tamanhoArquivo: item.tamanhoArquivo,
                temArquivo: item.temArquivo

            }

        }

    });

}
    // =========================================
    // AÇÕES POR ARTIGO
    // =========================================

   
function botoesAcoes(item) {

    const ocupado = acaoEmAndamento === item.artigoId;

    return (

        <div className="revisao-acoes-status">

            {abaAtiva === "Pendente" && (

                <>

                    {/* APROVAR */}
                    <button
                        className="revisao-botao-aprovar"
                        title="Aprovar conteúdo"
                        aria-label="Aprovar conteúdo"
                        disabled={ocupado}
                        onClick={() =>
                            aprovarConteudo(item.artigoId)
                        }
                    >
                        <Check size={18} strokeWidth={2.5} />
                    </button>

                    {/* SOLICITAR AJUSTES */}
                    <button
                        className="revisao-botao-ajustes"
                        title="Solicitar ajustes"
                        aria-label="Solicitar ajustes"
                        disabled={ocupado}
                        onClick={() =>
                            solicitarAjustes(item.artigoId)
                        }
                    >
                        <Pencil size={17} strokeWidth={2} />
                    </button>

                    {/* REJEITAR */}
                    <button
                        className="revisao-botao-rejeitar"
                        title="Rejeitar conteúdo"
                        aria-label="Rejeitar conteúdo"
                        disabled={ocupado}
                        onClick={() =>
                            rejeitarConteudo(item.artigoId)
                        }
                    >
                        <X size={19} strokeWidth={2.5} />
                    </button>

                </>

            )}

            {abaAtiva === "Aprovado" && (

                <button
                    type="button"
                    className="revisao-botao-publicar"
                    title={ocupado ? "Publicando conteúdo..." : "Publicar conteúdo"}
                    aria-label={ocupado ? "Publicando conteúdo" : "Publicar conteúdo"}
                    disabled={ocupado}
                    onClick={() =>
                        publicarConteudo(item.artigoId)
                    }
                >
                    <Send size={18} strokeWidth={2} aria-hidden="true" />
                </button>

            )}

            {/* VISUALIZAR */}
            <button
                className="revisao-botao-visualizar"
                title="Visualizar conteúdo"
                aria-label="Visualizar conteúdo"
                onClick={() => visualizarConteudo(item)}
            >
                <Eye size={18} strokeWidth={2} />
            </button>

        </div>

    );

}

    // =========================================
    // TELA
    // =========================================

    return (

        <div className="revisao-pagina">

            <Sidebar />

            <main className="revisao-principal">

                <Header />

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

                    {/* PESQUISA */}

                    <div className="revisao-pesquisa">

                        <input
                            type="text"
                            placeholder="Buscar por título, tema ou autor..."
                            value={pesquisa}
                            onChange={(e) => {
                                setPesquisa(e.target.value);
                                setPagina(1);
                            }}
                        />

                    </div>

                    {/* TABELA DESKTOP */}

                    <div className="revisao-tabela-container">

                        <table className="revisao-tabela">

                            <thead>

                                <tr>

                                    <th>Título</th>

                                    <th>Tema</th>

                                    <th>Data de criação</th>

                                    <th>Autor</th>

                                    <th className="revisao-coluna-acoes">
                                        Ações
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {carregando ? (

                                    <tr>
                                        <td colSpan="5" className="revisao-vazio">
                                            Carregando conteúdos...
                                        </td>
                                    </tr>

                                ) : erro ? (

                                    <tr>
                                        <td colSpan="5" className="revisao-vazio">
                                            {erro}
                                        </td>
                                    </tr>

                                ) : listaPaginada.length > 0 ? (

                                    listaPaginada.map((item) => (

                                        <tr key={item.artigoId}>

                                            <td>{item.titulo}</td>

                                            <td>
                                                <span className="revisao-etiqueta">
                                                    {item.tema}
                                                </span>
                                            </td>

                                            <td>
                                                {formatarData(item.dataCriacao)}
                                            </td>

                                            <td>{item.autor}</td>

                                            <td className="revisao-coluna-acoes">

                                                {botoesAcoes(item)}

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

                        {carregando ? (

                            <p className="revisao-vazio-mobile">
                                Carregando conteúdos...
                            </p>

                        ) : erro ? (

                            <p className="revisao-vazio-mobile">
                                {erro}
                            </p>

                        ) : listaPaginada.length > 0 ? (

                            listaPaginada.map((item) => (

                                <article
                                    className="revisao-cartao"
                                    key={item.artigoId}
                                >

                                    <div className="cartao-campo cartao-titulo">

                                        <strong>Título</strong>

                                        <span>{item.titulo}</span>

                                    </div>

                                    <div className="cartao-campo cartao-data">

                                        <strong>Data de criação</strong>

                                        <span>
                                            {formatarData(item.dataCriacao)}
                                        </span>

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

                                        {botoesAcoes(item)}

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

                    {!carregando && !erro && (

                        <div className="revisao-paginacao">

                            <button
                                disabled={paginaAtual === 1}
                                onClick={() =>
                                    setPagina(paginaAtual - 1)
                                }
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
                                onClick={() =>
                                    setPagina(paginaAtual + 1)
                                }
                                aria-label="Próxima página"
                            >
                                {">"}
                            </button>

                        </div>

                    )}

                </section>

            </main>

        </div>

    );

}


// =========================================
// MENU LATERAL
// =========================================

function Sidebar() {

    const navigate = useNavigate();

    const perfis = obterPerfisLogados();

    const itensMenu = [

        {
            nome: "Início",
            icone: CasaBranca,
            caminho: "/home"
        },

        {
            nome: "Conteúdos",
            icone: LivroBranco,
            caminho: "/conteudos"
        },

        {
            nome: "Notas Fiscais",
            icone: DoisDocumentosBranco,
            caminho: "/notas-fiscais"
        },

        {
            nome: "Clientes",
            icone: ADDProfileBranco,
            caminho: "/clientes"
        },

        {
            nome: "Usuários",
            icone: PessoaBranca,
            caminho: "/usuario"
        }

    ].filter(item =>
        item.caminho === "/home" ||
        item.caminho === "/conteudos" ||
        (item.caminho === "/notas-fiscais" && PERFIS_FISCAIS.some(perfil => perfis.includes(perfil))) ||
        ((item.caminho === "/clientes" || item.caminho === "/usuario") && perfis.includes("Administrador"))
    );

    return (

        <aside className="revisao-sidebar">

            <div className="revisao-logo">

                <img src={LogoNome} alt="Integra" />

            </div>

            <nav className="revisao-menu">

                {itensMenu.map((item) => (

                    <NavLink
                        to={item.caminho}
                        key={item.nome}
                        className={({ isActive }) =>

                            item.nome === "Conteúdos" &&
                            window.location.pathname.startsWith("/conteudos")

                                ? "revisao-menu-item revisao-menu-ativo"

                                : isActive
                                    ? "revisao-menu-item revisao-menu-ativo"
                                    : "revisao-menu-item"

                        }
                    >

                        <img
                            src={item.icone}
                            alt=""
                        />

                        <span>{item.nome}</span>

                    </NavLink>

                ))}

            </nav>

            <button
                className="revisao-sair"
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

    );

}

export default ConteudoRevisao;
