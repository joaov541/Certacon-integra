import {
    useState,
    useEffect,
    useRef,
    useCallback
} from "react";

import { Link, useNavigate } from "react-router-dom";

import {
    Bookmark,
    BookmarkCheck,
    History,
    BookOpen,
    Search,
    Trash2,
    Clock,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    ArrowRight,
    Eye,
    AlertCircle
} from "lucide-react";

import { requisicaoApi } from "../../services/api";
import usePermissoes from "../../hooks/usePermissoes";

import { classeCorTema } from "../../utils/coresTemas";

import "../../styles/coresTemas.css";
import "./MinhaBiblioteca.css";

const ITENS_POR_PAGINA = 6;

// =========================================
// FUNÇÕES AUXILIARES
// =========================================

function normalizar(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function formatarData(valor, incluirHora = false) {
    if (!valor) return "Não informada";

    // As datas do banco são armazenadas em UTC.
    let texto = String(valor);

    if (!/(Z|[+-]\d{2}:\d{2})$/i.test(texto)) {
        texto += "Z";
    }

    const data = new Date(texto);

    if (Number.isNaN(data.getTime())) {
        return "Não informada";
    }

    return data.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        ...(incluirHora
            ? {
                hour: "2-digit",
                minute: "2-digit"
            }
            : {})
    });
}

function normalizarArtigo(item) {
    return {
        artigoId: item.artigoId ?? item.ArtigoId,
        titulo: item.titulo ?? item.Titulo ?? "Sem título",
        resumo: item.resumo ?? item.Resumo ?? "",
        tema: item.tema ?? item.Tema ?? "Tributário",
        temaId: item.temaId ?? item.TemaId,
        autor: item.autor ?? item.Autor ?? "Não informado",
        status: item.status ?? item.Status,
        visibilidade: item.visibilidade ?? item.Visibilidade,
        dataPublicacao:
            item.dataPublicacao ?? item.DataPublicacao,
        dataFavorito:
            item.dataFavorito ?? item.DataFavorito,
        dataPrimeiroAcesso:
            item.dataPrimeiroAcesso ?? item.DataPrimeiroAcesso,
        dataUltimoAcesso:
            item.dataUltimoAcesso ?? item.DataUltimoAcesso,
        quantidadeAcessos: Number(
            item.quantidadeAcessos ??
            item.QuantidadeAcessos ??
            0
        ),
        favoritado: Boolean(
            item.favoritado ?? item.Favoritado
        )
    };
}

// =========================================
// COMPONENTE PRINCIPAL
// =========================================

export default function MinhaBiblioteca() {

    const navigate = useNavigate();

    const {
        autenticado,
        temPermissao,
        carregando: carregandoPermissoes,
        erro: erroPermissoes
    } = usePermissoes();

    const token = localStorage.getItem("token");

    const podeFavoritos =
        autenticado &&
        !carregandoPermissoes &&
        !erroPermissoes &&
        temPermissao("favorito.gerenciar.proprios");

    const podeHistorico =
        autenticado &&
        !carregandoPermissoes &&
        !erroPermissoes &&
        temPermissao("historico.leitura.gerenciar.proprio");

    // =========================================
    // ESTADOS
    // =========================================

    const [favoritos, setFavoritos] = useState([]);
    const [historico, setHistorico] = useState([]);

    const [aba, setAba] = useState("favoritos");

    const [pesquisa, setPesquisa] = useState("");
    const [tema, setTema] = useState("");
    const [ordenacao, setOrdenacao] = useState("recentes");
    const [pagina, setPagina] = useState(1);

    const [carregando, setCarregando] = useState(true);

    const [erros, setErros] = useState({
        favoritos: "",
        historico: ""
    });

    const [mensagem, setMensagem] = useState("");
    const [erroAcao, setErroAcao] = useState("");

    const [processando, setProcessando] = useState(null);
    const [sessaoCarregada, setSessaoCarregada] =
        useState(null);

    const componenteAtivo = useRef(false);
    const tokenAtual = useRef(token);
    const versaoConsulta = useRef(0);
    const operacaoAtual = useRef(null);

    tokenAtual.current = token;

    useEffect(() => {
        componenteAtivo.current = true;

        return () => {
            componenteAtivo.current = false;
            versaoConsulta.current++;
        };
    }, []);

    // =========================================
    // VALIDAR SESSÃO
    // =========================================

    function sessaoValida(tokenOperacao) {
        return (
            componenteAtivo.current &&
            tokenAtual.current === tokenOperacao &&
            localStorage.getItem("token") === tokenOperacao
        );
    }

    // =========================================
    // AJUSTAR ABA CONFORME RBAC
    // =========================================

    useEffect(() => {

        if (
            aba === "favoritos" &&
            !podeFavoritos &&
            podeHistorico
        ) {
            setAba("historico");
            setTema("");
            setPagina(1);
        }

        if (
            aba === "historico" &&
            !podeHistorico &&
            podeFavoritos
        ) {
            setAba("favoritos");
            setTema("");
            setPagina(1);
        }

    }, [aba, podeFavoritos, podeHistorico]);

    // =========================================
    // CARREGAR FAVORITOS E HISTÓRICO
    // =========================================

    const carregarBiblioteca = useCallback(async () => {

        const numeroConsulta = ++versaoConsulta.current;
        const tokenConsulta = token;

        if (
            !tokenConsulta ||
            (!podeFavoritos && !podeHistorico)
        ) {
            setCarregando(false);
            return;
        }

        setCarregando(true);

        setErros({
            favoritos: "",
            historico: ""
        });

        function consultaValida() {
            return (
                componenteAtivo.current &&
                versaoConsulta.current === numeroConsulta &&
                tokenAtual.current === tokenConsulta &&
                localStorage.getItem("token") === tokenConsulta
            );
        }

        const requisicoes = [];

        if (podeFavoritos) {
            requisicoes.push({
                tipo: "favoritos",
                promessa: requisicaoApi("/api/Favoritos")
            });
        } else {
            setFavoritos([]);
        }

        if (podeHistorico) {
            requisicoes.push({
                tipo: "historico",
                promessa: requisicaoApi("/api/HistoricoLeitura")
            });
        } else {
            setHistorico([]);
        }

        const resultados = await Promise.allSettled(
            requisicoes.map(item => item.promessa)
        );

        if (!consultaValida()) return;

        const novosErros = {
            favoritos: "",
            historico: ""
        };

        resultados.forEach((resultado, index) => {

            const tipo = requisicoes[index].tipo;

            if (
                resultado.status === "fulfilled" &&
                Array.isArray(resultado.value)
            ) {

                const dados = resultado.value
                    .map(normalizarArtigo)
                    .filter(item => item.artigoId);

                if (tipo === "favoritos") {
                    setFavoritos(dados);
                } else {
                    setHistorico(dados);
                }

            } else {

                novosErros[tipo] =
                    resultado.reason?.message ||
                    "Não foi possível carregar os registros.";

                if (tipo === "favoritos") {
                    setFavoritos([]);
                } else {
                    setHistorico([]);
                }
            }
        });

        setErros(novosErros);
        setSessaoCarregada(tokenConsulta);
        setCarregando(false);

    }, [token, podeFavoritos, podeHistorico]);

    useEffect(() => {

        setFavoritos([]);
        setHistorico([]);
        setSessaoCarregada(null);
        setMensagem("");
        setErroAcao("");
        setProcessando(null);
        setPagina(1);

        operacaoAtual.current = null;

        if (!carregandoPermissoes && !erroPermissoes) {
            carregarBiblioteca();
        }

        return () => {
            versaoConsulta.current++;
        };

    }, [
        carregarBiblioteca,
        carregandoPermissoes,
        erroPermissoes
    ]);

    // =========================================
    // ALTERAR FAVORITO
    // =========================================

    async function alternarFavorito(artigo) {

        if (
            !podeFavoritos ||
            operacaoAtual.current ||
            carregando ||
            sessaoCarregada !== token
        ) return;

        const tokenOperacao = token;

        const operacao = Symbol("favorito");

        operacaoAtual.current = operacao;

        const jaFavoritado = favoritos.some(
            item => item.artigoId === artigo.artigoId
        ) || artigo.favoritado;

        try {

            setProcessando(artigo.artigoId);
            setMensagem("");
            setErroAcao("");

            await requisicaoApi(
                `/api/Favoritos/${encodeURIComponent(
                    artigo.artigoId
                )}`,
                {
                    method: jaFavoritado
                        ? "DELETE"
                        : "POST"
                }
            );

            if (!sessaoValida(tokenOperacao)) return;

            setMensagem(
                jaFavoritado
                    ? "Artigo removido dos favoritos."
                    : "Artigo adicionado aos favoritos."
            );

            await carregarBiblioteca();

        } catch (error) {

            if (!sessaoValida(tokenOperacao)) return;

            setErroAcao(
                error.message ||
                "Não foi possível alterar o favorito."
            );

        } finally {

            if (operacaoAtual.current === operacao) {
                operacaoAtual.current = null;

                if (sessaoValida(tokenOperacao)) {
                    setProcessando(null);
                }
            }
        }
    }

    // =========================================
    // REMOVER REGISTRO DO HISTÓRICO
    // =========================================

    async function removerHistorico(artigo) {

        if (
            !podeHistorico ||
            operacaoAtual.current ||
            carregando ||
            sessaoCarregada !== token
        ) return;

        const confirmar = window.confirm(
            `Deseja remover "${artigo.titulo}" do seu histórico de leitura?`
        );

        if (!confirmar) return;

        const tokenOperacao = token;
        const operacao = Symbol("remover-historico");

        operacaoAtual.current = operacao;

        try {

            setProcessando(artigo.artigoId);
            setMensagem("");
            setErroAcao("");

            await requisicaoApi(
                `/api/HistoricoLeitura/${encodeURIComponent(
                    artigo.artigoId
                )}`,
                {
                    method: "DELETE"
                }
            );

            if (!sessaoValida(tokenOperacao)) return;

            setMensagem(
                "Registro removido do histórico."
            );

            await carregarBiblioteca();

        } catch (error) {

            if (!sessaoValida(tokenOperacao)) return;

            setErroAcao(
                error.message ||
                "Não foi possível remover o registro."
            );

        } finally {

            if (operacaoAtual.current === operacao) {
                operacaoAtual.current = null;

                if (sessaoValida(tokenOperacao)) {
                    setProcessando(null);
                }
            }
        }
    }

    // =========================================
    // LIMPAR HISTÓRICO COMPLETO
    // =========================================

    async function limparHistorico() {

        if (
            !podeHistorico ||
            operacaoAtual.current ||
            carregando ||
            sessaoCarregada !== token ||
            historico.length === 0
        ) return;

        const confirmar = window.confirm(
            "Deseja apagar todo o seu histórico de leitura? Seus artigos favoritos serão mantidos."
        );

        if (!confirmar) return;

        const tokenOperacao = token;
        const operacao = Symbol("limpar-historico");

        operacaoAtual.current = operacao;

        try {

            setProcessando("limpar");
            setMensagem("");
            setErroAcao("");

            await requisicaoApi(
                "/api/HistoricoLeitura",
                {
                    method: "DELETE"
                }
            );

            if (!sessaoValida(tokenOperacao)) return;

            setPagina(1);

            setMensagem(
                "Histórico de leitura limpo com sucesso."
            );

            await carregarBiblioteca();

        } catch (error) {

            if (!sessaoValida(tokenOperacao)) return;

            setErroAcao(
                error.message ||
                "Não foi possível limpar o histórico."
            );

        } finally {

            if (operacaoAtual.current === operacao) {
                operacaoAtual.current = null;

                if (sessaoValida(tokenOperacao)) {
                    setProcessando(null);
                }
            }
        }
    }

    // =========================================
    // ALTERAR ABA
    // =========================================

    function trocarAba(novaAba) {
        setAba(novaAba);
        setPesquisa("");
        setTema("");
        setOrdenacao("recentes");
        setPagina(1);
        setMensagem("");
        setErroAcao("");
    }

    // =========================================
    // ABRIR ARTIGO
    // =========================================

    function abrirArtigo(artigo) {

        navigate(
            `/conteudos/detalhes?id=${encodeURIComponent(
                artigo.artigoId
            )}`,
            {
                state: {
                    origem: "/minha-biblioteca",
                    conteudo: {
                        artigoId: artigo.artigoId,
                        id: artigo.artigoId
                    }
                }
            }
        );
    }

    // =========================================
    // PESQUISA E FILTROS
    // =========================================

    const dadosDisponiveis =
        sessaoCarregada === token &&
        Boolean(token);

    const abaPermitida =
        aba === "favoritos"
            ? podeFavoritos
            : podeHistorico;

    const lista =
        dadosDisponiveis && abaPermitida
            ? aba === "favoritos"
                ? favoritos
                : historico
            : [];

    const temas = [
        ...new Set(
            lista.map(item => item.tema).filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b, "pt-BR"));

    const artigosFiltrados = lista
        .filter(item => {

            const texto = normalizar([
                item.titulo,
                item.resumo,
                item.tema,
                item.autor
            ].join(" "));

            return (
                (!tema || item.tema === tema) &&
                texto.includes(
                    normalizar(pesquisa.trim())
                )
            );
        })
        .sort((a, b) => {

            if (ordenacao === "titulo") {
                return a.titulo.localeCompare(
                    b.titulo,
                    "pt-BR"
                );
            }

            if (
                ordenacao === "mais-lidos" &&
                aba === "historico"
            ) {
                return (
                    b.quantidadeAcessos -
                    a.quantidadeAcessos
                );
            }

            const campoData =
                aba === "favoritos"
                    ? "dataFavorito"
                    : "dataUltimoAcesso";

            const dataA =
                new Date(a[campoData] || 0).getTime() || 0;

            const dataB =
                new Date(b[campoData] || 0).getTime() || 0;

            return ordenacao === "antigos"
                ? dataA - dataB
                : dataB - dataA;
        });

    // =========================================
    // PAGINAÇÃO
    // =========================================

    const totalPaginas = Math.max(
        1,
        Math.ceil(
            artigosFiltrados.length / ITENS_POR_PAGINA
        )
    );

    const paginaAtual = Math.min(pagina, totalPaginas);

    const artigosExibidos = artigosFiltrados.slice(
        (paginaAtual - 1) * ITENS_POR_PAGINA,
        paginaAtual * ITENS_POR_PAGINA
    );

    const totalAcessos = dadosDisponiveis
        ? historico.reduce(
            (total, item) =>
                total + item.quantidadeAcessos,
            0
        )
        : 0;

    const ocupado =
        carregando || processando !== null;

    // =========================================
    // VALIDAR PERMISSÕES
    // =========================================

    if (carregandoPermissoes) {
        return (
            <div className="mb-pagina">
                <p className="mb-carregando" role="status">
                    Verificando permissões...
                </p>
            </div>
        );
    }

    if (
        erroPermissoes ||
        (!podeFavoritos && !podeHistorico)
    ) {
        return (
            <div className="mb-pagina">

                <div className="mb-vazio">

                    <AlertCircle size={42} />

                    <h2>Acesso indisponível</h2>

                    <p>
                        {erroPermissoes
                            ? "Não foi possível verificar suas permissões."
                            : "Você não possui permissão para acessar esta biblioteca."}
                    </p>

                    <Link
                        to="/home"
                        className="mb-link-principal"
                    >
                        Voltar ao início
                    </Link>

                </div>

            </div>
        );
    }

    // =========================================
    // RENDERIZAÇÃO
    // =========================================

    return (

        <div className="mb-pagina">

            {/* CABEÇALHO */}

            <div className="mb-cabecalho">

                <div className="mb-titulo">

                    <div className="mb-titulo-icone">
                        <BookOpen size={29} />
                    </div>

                    <div>

                        <h1>Minha Biblioteca</h1>

                        <p>
                            Gerencie seus conteúdos favoritos e
                            acompanhe seu histórico de leitura.
                        </p>

                    </div>

                </div>

                <button
                    type="button"
                    className="mb-atualizar"
                    disabled={ocupado}
                    onClick={() => {
                        setMensagem("");
                        setErroAcao("");
                        carregarBiblioteca();
                    }}
                >

                    <RefreshCw
                        size={17}
                        className={
                            carregando
                                ? "mb-girando"
                                : ""
                        }
                    />

                    Atualizar

                </button>

            </div>

            {/* INDICADORES */}

            <div className="mb-indicadores">

                {podeFavoritos && (

                    <article className="mb-indicador">

                        <div className="mb-indicador-icone mb-icone-laranja">
                            <BookmarkCheck size={26} />
                        </div>

                        <div>

                            <span>Artigos favoritos</span>

                            <strong>
                                {!dadosDisponiveis ||
                                    carregando ||
                                    erros.favoritos
                                    ? "—"
                                    : favoritos.length}
                            </strong>

                            <small>
                                Conteúdos salvos
                            </small>

                        </div>

                    </article>

                )}

                {podeHistorico && (

                    <>

                        <article className="mb-indicador">

                            <div className="mb-indicador-icone">
                                <History size={26} />
                            </div>

                            <div>

                                <span>Artigos acessados</span>

                                <strong>
                                    {!dadosDisponiveis ||
                                        carregando ||
                                        erros.historico
                                        ? "—"
                                        : historico.length}
                                </strong>

                                <small>
                                    Conteúdos no histórico
                                </small>

                            </div>

                        </article>

                        <article className="mb-indicador">

                            <div className="mb-indicador-icone mb-icone-verde">
                                <Eye size={26} />
                            </div>

                            <div>

                                <span>Total de acessos</span>

                                <strong>
                                    {!dadosDisponiveis ||
                                        carregando ||
                                        erros.historico
                                        ? "—"
                                        : totalAcessos}
                                </strong>

                                <small>
                                    Acessos registrados
                                </small>

                            </div>

                        </article>

                    </>

                )}

            </div>

            {/* PAINEL PRINCIPAL */}

            <section className="mb-painel">

                {/* ABAS */}

                <div className="mb-abas">

                    {podeFavoritos && (

                        <button
                            type="button"
                            className={
                                aba === "favoritos"
                                    ? "mb-aba mb-aba-ativa"
                                    : "mb-aba"
                            }
                            aria-pressed={aba === "favoritos"}
                            onClick={() =>
                                trocarAba("favoritos")
                            }
                        >

                            <Bookmark size={19} />

                            Meus favoritos

                            <span className="mb-contador">
                                {dadosDisponiveis && !erros.favoritos
                                    ? favoritos.length
                                    : "—"}
                            </span>

                        </button>

                    )}

                    {podeHistorico && (

                        <button
                            type="button"
                            className={
                                aba === "historico"
                                    ? "mb-aba mb-aba-ativa"
                                    : "mb-aba"
                            }
                            aria-pressed={aba === "historico"}
                            onClick={() =>
                                trocarAba("historico")
                            }
                        >

                            <History size={19} />

                            Histórico de leitura

                            <span className="mb-contador">
                                {dadosDisponiveis && !erros.historico
                                    ? historico.length
                                    : "—"}
                            </span>

                        </button>

                    )}

                </div>

                <div className="mb-painel-conteudo">

                    {/* FILTROS */}

                    <div className="mb-filtros">

                        <label className="mb-campo">

                            <span>Pesquisar</span>

                            <div className="mb-pesquisa">

                                <Search size={19} />

                                <input
                                    type="search"
                                    value={pesquisa}
                                    placeholder="Título, tema ou autor"
                                    onChange={event => {
                                        setPesquisa(
                                            event.target.value
                                        );
                                        setPagina(1);
                                    }}
                                />

                            </div>

                        </label>

                        <label className="mb-campo">

                            <span>Tema</span>

                            <select
                                value={tema}
                                onChange={event => {
                                    setTema(event.target.value);
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

                        <label className="mb-campo">

                            <span>Ordenar por</span>

                            <select
                                value={ordenacao}
                                onChange={event => {
                                    setOrdenacao(
                                        event.target.value
                                    );
                                    setPagina(1);
                                }}
                            >

                                <option value="recentes">
                                    Mais recentes
                                </option>

                                <option value="antigos">
                                    Mais antigos
                                </option>

                                <option value="titulo">
                                    Título A-Z
                                </option>

                                {aba === "historico" && (

                                    <option value="mais-lidos">
                                        Mais acessados
                                    </option>

                                )}

                            </select>

                        </label>

                    </div>

                    {/* QUANTIDADE E LIMPAR HISTÓRICO */}

                    <div className="mb-resultados-topo">

                        <span>
                            {artigosFiltrados.length}
                            {" "}
                            {artigosFiltrados.length === 1
                                ? "conteúdo encontrado"
                                : "conteúdos encontrados"}
                        </span>

                        {aba === "historico" &&
                            podeHistorico &&
                            historico.length > 0 && (

                                <button
                                    type="button"
                                    className="mb-limpar"
                                    onClick={limparHistorico}
                                    disabled={ocupado}
                                >

                                    <Trash2 size={17} />

                                    Limpar histórico

                                </button>

                            )}

                    </div>

                    {/* MENSAGENS */}

                    {mensagem && (

                        <div
                            className="mb-mensagem"
                            role="status"
                        >
                            {mensagem}
                        </div>

                    )}

                    {erroAcao && (

                        <div
                            className="mb-erro"
                            role="alert"
                        >
                            {erroAcao}
                        </div>

                    )}

                    {/* CARREGAMENTO */}

                    {carregando || !dadosDisponiveis ? (

                        <div
                            className="mb-carregando"
                            role="status"
                        >

                            <RefreshCw
                                className="mb-girando"
                                size={25}
                            />

                            Carregando sua biblioteca...

                        </div>

                    ) : erros[aba] ? (

                        <div className="mb-vazio" role="alert">

                            <AlertCircle size={38} />

                            <h2>
                                Não foi possível carregar os conteúdos
                            </h2>

                            <p>{erros[aba]}</p>

                            <button
                                type="button"
                                className="mb-link-principal"
                                onClick={carregarBiblioteca}
                                disabled={ocupado}
                            >
                                Tentar novamente
                            </button>

                        </div>

                    ) : artigosExibidos.length === 0 ? (

                        /* ESTADO VAZIO */

                        <div className="mb-vazio">

                            {aba === "favoritos"
                                ? <Bookmark size={45} />
                                : <History size={45} />}

                            <h2>

                                {pesquisa || tema
                                    ? "Nenhum resultado encontrado"
                                    : aba === "favoritos"
                                        ? "Nenhum artigo favoritado"
                                        : "Seu histórico está vazio"}

                            </h2>

                            <p>

                                {pesquisa || tema
                                    ? "Tente pesquisar outro título ou alterar os filtros."
                                    : aba === "favoritos"
                                        ? "Salve seus conteúdos preferidos para consultar mais tarde."
                                        : "Os artigos publicados que você acessar aparecerão aqui."}

                            </p>

                            {pesquisa || tema ? (

                                <button
                                    type="button"
                                    className="mb-link-principal"
                                    onClick={() => {
                                        setPesquisa("");
                                        setTema("");
                                        setPagina(1);
                                    }}
                                >
                                    Limpar filtros
                                </button>

                            ) : (

                                <Link
                                    to="/conteudos"
                                    className="mb-link-principal"
                                >

                                    Explorar conteúdos

                                    <ArrowRight size={17} />

                                </Link>

                            )}

                        </div>

                    ) : (

                        /* CARDS DOS ARTIGOS */

                        <div className="mb-grid">

                            {artigosExibidos.map(artigo => {

                                const favoritado =
                                    favoritos.some(
                                        item =>
                                            item.artigoId ===
                                            artigo.artigoId
                                    ) ||
                                    artigo.favoritado;

                                return (

                                    <article
                                        className="mb-card"
                                        key={artigo.artigoId}
                                    >

                                        <div className="mb-card-topo">

                                            <span
                                                className={`mb-tema ${classeCorTema(
                                                    artigo.tema
                                                )}`}
                                            >

                                                {artigo.tema}

                                            </span>

                                            <div className="mb-card-acoes">

                                                {podeFavoritos && (

                                                    <button
                                                        type="button"
                                                        className={`mb-icone-botao ${
                                                            favoritado
                                                                ? "mb-favoritado"
                                                                : ""
                                                        }`}
                                                        title={
                                                            favoritado
                                                                ? "Remover favorito"
                                                                : "Favoritar artigo"
                                                        }
                                                        aria-label={
                                                            favoritado
                                                                ? "Remover favorito"
                                                                : "Favoritar artigo"
                                                        }
                                                        aria-pressed={
                                                            favoritado
                                                        }
                                                        onClick={() =>
                                                            alternarFavorito(
                                                                artigo
                                                            )
                                                        }
                                                        disabled={ocupado}
                                                    >

                                                        {favoritado
                                                            ? <BookmarkCheck size={21} />
                                                            : <Bookmark size={21} />}

                                                    </button>

                                                )}

                                                {aba === "historico" &&
                                                    podeHistorico && (

                                                        <button
                                                            type="button"
                                                            className="mb-icone-botao mb-remover"
                                                            title="Remover do histórico"
                                                            aria-label="Remover do histórico"
                                                            onClick={() =>
                                                                removerHistorico(
                                                                    artigo
                                                                )
                                                            }
                                                            disabled={ocupado}
                                                        >

                                                            <Trash2 size={19} />

                                                        </button>

                                                    )}

                                            </div>

                                        </div>

                                        <h3>{artigo.titulo}</h3>

                                        <p className="mb-resumo">

                                            {artigo.resumo ||
                                                "Acesse o conteúdo para saber mais."}

                                        </p>

                                        <span className="mb-autor">
                                            Por {artigo.autor}
                                        </span>

                                        <div className="mb-card-detalhes">

                                            <div>

                                                <Clock size={16} />

                                                <span>

                                                    {aba === "favoritos"
                                                        ? "Salvo em "
                                                        : "Último acesso: "}

                                                    {formatarData(
                                                        aba === "favoritos"
                                                            ? artigo.dataFavorito
                                                            : artigo.dataUltimoAcesso,
                                                        true
                                                    )}

                                                </span>

                                            </div>

                                            {aba === "historico" && (

                                                <div>

                                                    <Eye size={16} />

                                                    <span>

                                                        {artigo.quantidadeAcessos}
                                                        {" "}
                                                        {artigo.quantidadeAcessos === 1
                                                            ? "acesso"
                                                            : "acessos"}

                                                    </span>

                                                </div>

                                            )}

                                        </div>

                                        <div className="mb-card-rodape">

                                            <span className="mb-visibilidade">

                                                {artigo.visibilidade === "EXCLUSIVO"
                                                    ? "Exclusivo"
                                                    : "Público"}

                                            </span>

                                            <button
                                                type="button"
                                                className="mb-ler"
                                                onClick={() =>
                                                    abrirArtigo(artigo)
                                                }
                                            >

                                                Ler conteúdo

                                                <ArrowRight size={17} />

                                            </button>

                                        </div>

                                    </article>

                                );
                            })}

                        </div>

                    )}

                    {/* PAGINAÇÃO */}

                    {!carregando &&
                        !erros[aba] &&
                        totalPaginas > 1 && (

                            <nav
                                className="mb-paginacao"
                                aria-label="Paginação da biblioteca"
                            >

                                <button
                                    type="button"
                                    aria-label="Página anterior"
                                    disabled={paginaAtual === 1}
                                    onClick={() =>
                                        setPagina(
                                            paginaAtual - 1
                                        )
                                    }
                                >

                                    <ChevronLeft size={19} />

                                </button>

                                <span>

                                    Página {paginaAtual}
                                    {" de "}
                                    {totalPaginas}

                                </span>

                                <button
                                    type="button"
                                    aria-label="Próxima página"
                                    disabled={
                                        paginaAtual === totalPaginas
                                    }
                                    onClick={() =>
                                        setPagina(
                                            paginaAtual + 1
                                        )
                                    }
                                >

                                    <ChevronRight size={19} />

                                </button>

                            </nav>

                        )}

                </div>

            </section>

        </div>

    );
}