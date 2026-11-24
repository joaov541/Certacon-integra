import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
    BookOpen,
    FileSearch,
    ArrowRight,
    Users,
} from "lucide-react";

import api from "../../services/api";

import LogoNome from "../../assets/Icones/LogoNome.png";

import "./PortalPublico.css";

// =========================================
// FERRAMENTAS FISCAIS PÚBLICAS
// =========================================
const ferramentasPublicas = [
    {
        titulo: "Consultar NF-e",
        descricao:
            "Verifique a estrutura da chave de acesso da sua nota fiscal eletrônica.",
        rota: "/consultar-chave",
        acao: "Consultar chave",
        Icone: FileSearch
    },
    {
        titulo: "Glossário Fiscal",
        descricao:
            "Conheça o significado dos principais termos e siglas do universo tributário.",
        rota: "/glossario",
        acao: "Explorar glossário",
        Icone: BookOpen
    },
    {
        titulo: "Área do Cidadão",
        descricao:
            "Entenda a importância do CPF na nota fiscal e conheça o cashback da Reforma Tributária.",
        rota: "/area-cidadao",
        acao: "Conhecer meus direitos",
        Icone: Users
    }
];

// =========================================
// FUNÇÕES AUXILIARES
// =========================================

const publico = (artigo) =>
    artigo?.visibilidade === "PUBLICO" &&
    artigo?.status === "PUBLICADO";

function normalizar(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function formatarData(valor) {
    const data = new Date(valor);

    return valor && !isNaN(data)
        ? data.toLocaleDateString("pt-BR")
        : "";
}

// =========================================
// CONSULTA PÚBLICA SEM TOKEN JWT
// =========================================

async function buscar(caminho, signal) {

    const resposta = await fetch(`${api}${caminho}`, {
        signal,
        credentials: "omit",
        cache: "no-store"
    });

    if (!resposta.ok) {
        throw new Error(
            "Não foi possível carregar o conteúdo público."
        );
    }

    return resposta.json();

}

// =========================================
// COMPONENTE PRINCIPAL
// =========================================

export default function PortalPublico() {

    const [params, setParams] = useSearchParams();

    const id = params.get("artigo");

    // =========================================
    // ESTADOS
    // =========================================

    const [artigos, setArtigos] = useState([]);
    const [detalhe, setDetalhe] = useState(null);

    const [pesquisa, setPesquisa] = useState("");
    const [tema, setTema] = useState("");
    const [pagina, setPagina] = useState(1);

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [tentativa, setTentativa] = useState(0);

    const token = localStorage.getItem("token");

    const artigosPorPagina = 6;

    // =========================================
    // CARREGAR CONTEÚDOS
    // =========================================

    useEffect(() => {

        const controle = new AbortController();

        setCarregando(true);
        setErro("");
        setDetalhe(null);

        async function carregarConteudos() {

            try {

                if (id) {

                    const artigo = await buscar(
                        `/api/Artigos/${encodeURIComponent(id)}`,
                        controle.signal
                    );

                    if (!publico(artigo)) {
                        throw new Error(
                            "Conteúdo indisponível para visitantes."
                        );
                    }

                    if (!controle.signal.aborted) {
                        setDetalhe(artigo);
                    }

                } else {

                    const lista = await buscar(
                        "/api/Artigos",
                        controle.signal
                    );

                    if (!Array.isArray(lista)) {
                        throw new Error(
                            "Resposta inesperada da API."
                        );
                    }

                    if (!controle.signal.aborted) {
                        setArtigos(lista.filter(publico));
                    }

                }

            } catch (error) {

                if (!controle.signal.aborted) {
                    setErro(
                        error.message ||
                        "Não foi possível carregar os conteúdos."
                    );
                }

            } finally {

                if (!controle.signal.aborted) {
                    setCarregando(false);
                }

            }

        }

        carregarConteudos();

        return () => controle.abort();

    }, [id, tentativa]);

    // =========================================
    // TEMAS DISPONÍVEIS
    // =========================================

    const temas = [
        ...new Set(
            artigos
                .map(artigo => artigo.tema)
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b, "pt-BR"));

    // =========================================
    // PESQUISA E FILTROS
    // =========================================

    const artigosFiltrados = artigos.filter(artigo => {

        const correspondeTema =
            !tema || artigo.tema === tema;

        const texto = normalizar([
            artigo.titulo,
            artigo.resumo,
            artigo.tema,
            artigo.autor
        ].join(" "));

        const correspondePesquisa = texto.includes(
            normalizar(pesquisa.trim())
        );

        return correspondeTema && correspondePesquisa;

    });

    // =========================================
    // PAGINAÇÃO
    // =========================================

    const totalPaginas = Math.max(
        1,
        Math.ceil(
            artigosFiltrados.length / artigosPorPagina
        )
    );

    const paginaAtual = Math.min(
        pagina,
        totalPaginas
    );

    const artigosExibidos = artigosFiltrados.slice(
        (paginaAtual - 1) * artigosPorPagina,
        paginaAtual * artigosPorPagina
    );

    // =========================================
    // RENDERIZAÇÃO
    // =========================================

    return (

        <div className="pp-pagina">

            {/* CABEÇALHO PÚBLICO */}

            <header className="pp-header">

                <Link
                    to="/portal"
                    aria-label="Portal Integra"
                >
                    <img
                        src={LogoNome}
                        alt="Integra"
                    />
                </Link>

                <nav aria-label="Navegação pública">

                    <Link to="/portal">
                        Conteúdos
                    </Link>

                    <Link to="/consultar-chave">
                        Consultar NF-e
                    </Link>

                    {/* NOVO LINK */}

                    <Link to="/glossario">
                        Glossário Fiscal
                    </Link>

                    <Link to="/area-cidadao">
                        Área do Cidadão
                    </Link>



                    {token ? (

                        <Link
                            className="pp-cta"
                            to="/home"
                        >
                            Meu painel
                        </Link>

                    ) : (

                        <>
                            <Link to="/login">
                                Entrar
                            </Link>

                            <Link
                                className="pp-cta"
                                to="/cadastro"
                            >
                                Criar conta
                            </Link>
                        </>

                    )}

                </nav>

            </header>

            {/* CONTEÚDO PRINCIPAL */}

            <main className="pp-main">

                {!id && (

                    <>

                        {/* APRESENTAÇÃO */}

                        <section className="pp-hero">

                            <span>
                                PORTAL TRIBUTÁRIO
                            </span>

                            <h1>
                                Informação tributária ao seu alcance
                            </h1>

                            <p>
                                Acompanhe conteúdos públicos, consulte
                                a estrutura da chave de acesso da sua
                                nota fiscal e compreenda os principais
                                termos do universo tributário.
                            </p>

                            <div className="pp-acoes">

                                <a href="#pp-conteudos">
                                    Explorar conteúdos
                                </a>

                                <Link to="/consultar-chave">
                                    Consultar chave NF-e
                                </Link>

                                <a href="#pp-ferramentas">
                                    Ferramentas Fiscais
                                </a>

                            </div>

                        </section>

                        {/* =====================================
                            NOVA SEÇÃO DE FERRAMENTAS FISCAIS
                        ===================================== */}

                        <section
                            id="pp-ferramentas"
                            className="pp-ferramentas"
                        >

                            <div className="pp-secao-titulo">

                                <h2>
                                    Ferramentas Fiscais
                                </h2>

                                <p>
                                    Recursos gratuitos para facilitar
                                    seu dia a dia e ampliar seus
                                    conhecimentos tributários.
                                </p>

                            </div>

                            <div className="pp-ferramentas-grid">

                                {ferramentasPublicas.map(item => {

                                    const Icone = item.Icone;

                                    return (

                                        <article
                                            className="pp-ferramenta-card"
                                            key={item.rota}
                                        >

                                            <div
                                                className="pp-ferramenta-icone"
                                                aria-hidden="true"
                                            >
                                                <Icone size={27} />
                                            </div>

                                            <h3>
                                                {item.titulo}
                                            </h3>

                                            <p>
                                                {item.descricao}
                                            </p>

                                            <Link
                                                to={item.rota}
                                                className="pp-ferramenta-link"
                                            >

                                                {item.acao}

                                                <ArrowRight
                                                    size={17}
                                                    aria-hidden="true"
                                                />

                                            </Link>

                                        </article>

                                    );

                                })}

                            </div>

                        </section>

                        {/* PESQUISA E FILTROS */}

                        <section
                            id="pp-conteudos"
                            className="pp-lista"
                        >

                            <h2>
                                Conteúdos tributários
                            </h2>

                            <p>
                                Explore as publicações disponíveis
                                sem cadastro.
                            </p>

                            <div className="pp-filtros">

                                <label>

                                    Pesquisar conteúdos

                                    <input
                                        type="search"
                                        value={pesquisa}
                                        placeholder="Título, assunto ou autor"
                                        onChange={event => {
                                            setPesquisa(
                                                event.target.value
                                            );

                                            setPagina(1);
                                        }}
                                    />

                                </label>

                                <label>

                                    Tema

                                    <select
                                        value={tema}
                                        onChange={event => {
                                            setTema(
                                                event.target.value
                                            );

                                            setPagina(1);
                                        }}
                                    >

                                        <option value="">
                                            Todos os temas
                                        </option>

                                        {temas.map(item => (

                                            <option
                                                key={item}
                                                value={item}
                                            >
                                                {item}
                                            </option>

                                        ))}

                                    </select>

                                </label>

                            </div>

                        </section>

                    </>

                )}

                {/* VOLTAR PARA LISTAGEM */}

                {id && (

                    <button
                        type="button"
                        className="pp-voltar"
                        onClick={() => setParams({})}
                    >
                        ← Voltar aos conteúdos
                    </button>

                )}

                {/* CARREGAMENTO */}

                {carregando ? (

                    <p role="status">
                        Carregando conteúdos...
                    </p>

                ) : erro ? (

                    <div
                        className="pp-erro"
                        role="alert"
                    >

                        {erro}

                        <button
                            type="button"
                            onClick={() =>
                                setTentativa(valor => valor + 1)
                            }
                        >
                            Tentar novamente
                        </button>

                    </div>

                ) : id ? (

                    /* DETALHES DO ARTIGO */

                    detalhe && (

                        <article className="pp-detalhe">

                            <span className="pp-tema">
                                {detalhe.tema}
                            </span>

                            <h1>
                                {detalhe.titulo}
                            </h1>

                            <p className="pp-meta">
                                {detalhe.autor} ·{" "}
                                {formatarData(
                                    detalhe.dataPublicacao
                                )}
                            </p>

                            {detalhe.resumo && (

                                <p className="pp-resumo">
                                    {detalhe.resumo}
                                </p>

                            )}

                            <div className="pp-texto">
                                {detalhe.conteudo}
                            </div>

                            {detalhe.temArquivo && (

                                <a
                                    className="pp-anexo"
                                    href={`${api}/api/Artigos/${encodeURIComponent(detalhe.artigoId)}/arquivo`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >

                                    Baixar documento:{" "}
                                    {detalhe.nomeArquivo || "Anexo"}

                                </a>

                            )}

                        </article>

                    )

                ) : (

                    /* LISTAGEM DOS ARTIGOS */

                    <>

                        <div className="pp-grid">

                            {artigosExibidos.map(artigo => (

                                <article
                                    className="pp-card"
                                    key={artigo.artigoId}
                                >

                                    <span className="pp-tema">
                                        {artigo.tema || "Tributário"}
                                    </span>

                                    <h3>
                                        {artigo.titulo}
                                    </h3>

                                    <p>
                                        {artigo.resumo ||
                                            String(
                                                artigo.conteudo ?? ""
                                            ).slice(0, 180)}
                                    </p>

                                    <small>

                                        {formatarData(
                                            artigo.dataPublicacao
                                        )}

                                    </small>

                                    <Link
                                        to={`/portal?artigo=${encodeURIComponent(artigo.artigoId)}`}
                                    >
                                        Ler conteúdo →
                                    </Link>

                                </article>

                            ))}

                        </div>

                        {artigosFiltrados.length === 0 && (

                            <p>
                                Nenhum conteúdo público encontrado.
                            </p>

                        )}

                        {/* PAGINAÇÃO */}

                        {totalPaginas > 1 && (

                            <nav
                                className="pp-paginacao"
                                aria-label="Paginação"
                            >

                                <button
                                    type="button"
                                    disabled={paginaAtual === 1}
                                    onClick={() =>
                                        setPagina(paginaAtual - 1)
                                    }
                                >
                                    Anterior
                                </button>

                                <span>
                                    {paginaAtual} de {totalPaginas}
                                </span>

                                <button
                                    type="button"
                                    disabled={
                                        paginaAtual === totalPaginas
                                    }
                                    onClick={() =>
                                        setPagina(paginaAtual + 1)
                                    }
                                >
                                    Próxima
                                </button>

                            </nav>

                        )}

                    </>

                )}

                {/* CONVITE PARA CADASTRO */}

                {!token && (

                    <section className="pp-convite">

                        <div>

                            <h2>
                                Conheça o IntegraCertacon
                            </h2>

                            <p>
                                Crie sua conta para acessar as
                                funcionalidades destinadas aos clientes.
                            </p>

                        </div>

                        <Link to="/cadastro">
                            Criar uma conta
                        </Link>

                    </section>

                )}

            </main>

            {/* RODAPÉ */}

            <footer className="pp-footer">

                IntegraCertacon · Portal tributário

            </footer>

        </div>

    );

}