import {
    useState,
    useEffect,
    useRef,
    useCallback
} from "react";
import RespostaIA from "../../components/RespostaIA/RespostaIA";
import { Link } from "react-router-dom";

import {
    Bot,
    Brain,
    Sparkles,
    Send,
    MessageSquare,
    FileText,
    ShieldCheck,
    ShieldOff,
    Search,
    RefreshCw,
    Copy,
    Check,
    X,
    Trash2,
    Info,
    AlertCircle,
    Clock,
    ExternalLink,
    Database,
    Lock,
    Eye,
    User,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

import { requisicaoApi } from "../../services/api";
import usePermissoes from "../../hooks/usePermissoes";

import "./AssistenteIA.css";

// =========================================
// CONSTANTES
// =========================================

const API_IA = "/api/InteligenciaArtificial";

const API_BASE = "/api/BaseConhecimentoIA";

const ITENS_POR_PAGINA = 6;

const PERGUNTAS_SUGERIDAS = [
    "O que é o SPED EFD?",
    "Como evitar inconsistências no SPED EFD?",
    "Qual é a diferença entre IBS e CBS?",
    "Como funciona a emissão de uma NF-e?"
];

const SITUACOES = {
    AUTORIZADO: "Autorizado",
    NAO_AUTORIZADO: "Não autorizado",
    DESATUALIZADO: "Autorização desatualizada",
    INDISPONIVEL: "Indisponível"
};

// =========================================
// FUNÇÕES AUXILIARES
// =========================================

function normalizarTexto(texto) {

    return String(texto ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function formatarData(valor) {

    if (!valor) return "—";

    const texto = String(valor);

    const data = new Date(
        /(?:Z|[+-]\d{2}:\d{2})$/i.test(texto)
            ? texto
            : `${texto}Z`
    );

    if (Number.isNaN(data.getTime())) {
        return "—";
    }

    return data.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        dateStyle: "short",
        timeStyle: "short"
    });
}

function criarId() {

    return globalThis.crypto?.randomUUID?.()
        ?? `${Date.now()}-${Math.random()}`;
}

// =========================================
// CONTROLE DE PERMISSÕES
// =========================================

export default function AssistenteIA() {

    const {
        autenticado,
        carregando,
        erro,
        temPermissao
    } = usePermissoes();

    const token = localStorage.getItem("token");

    const podeConsultar =
        autenticado &&
        temPermissao("ia.consultar");

    const podeGerenciar =
        autenticado &&
        temPermissao("ia.gerenciar.artigos");

    if (carregando) {

        return (
            <div className="ia-pagina">

                <div className="ia-vazio">

                    <RefreshCw
                        size={30}
                        className="ia-girando"
                    />

                    <p>Verificando permissões...</p>

                </div>

            </div>
        );
    }

    if (
        erro ||
        !autenticado ||
        (!podeConsultar && !podeGerenciar)
    ) {

        return (
            <div className="ia-pagina">

                <div className="ia-vazio">

                    <Lock size={45} />

                    <h2>Acesso indisponível</h2>

                    <p>
                        {erro
                            ? "Não foi possível verificar suas permissões."
                            : "Você não possui permissão para acessar esta funcionalidade."}
                    </p>

                    <Link
                        to="/home"
                        className="ia-botao-principal"
                    >
                        Voltar ao início
                    </Link>

                </div>

            </div>
        );
    }

    return (
        <AssistenteConteudo
            key={`${token}:${podeConsultar}:${podeGerenciar}`}
            token={token}
            podeConsultar={podeConsultar}
            podeGerenciar={podeGerenciar}
        />
    );
}

// =========================================
// COMPONENTE PRINCIPAL
// =========================================

function AssistenteConteudo({
    token,
    podeConsultar,
    podeGerenciar
}) {

    const [aba, setAba] = useState(
        podeConsultar ? "chat" : "base"
    );

    // CHAT

    const [pergunta, setPergunta] = useState("");

    const [mensagens, setMensagens] = useState([]);

    const [enviando, setEnviando] = useState(false);

    const [erroChat, setErroChat] = useState("");

    const [copiadoId, setCopiadoId] = useState(null);

    // LIMITES

    const [limites, setLimites] = useState(null);

    const [erroLimites, setErroLimites] = useState("");

    const [carregandoLimites, setCarregandoLimites] =
        useState(false);

    // BASE DE CONHECIMENTO

    const [artigos, setArtigos] = useState([]);

    const [carregandoBase, setCarregandoBase] =
        useState(false);

    const [erroBase, setErroBase] = useState("");

    const [mensagemBase, setMensagemBase] =
        useState("");

    const [pesquisa, setPesquisa] = useState("");

    const [temaFiltro, setTemaFiltro] = useState("");

    const [situacaoFiltro, setSituacaoFiltro] =
        useState("");

    const [pagina, setPagina] = useState(1);

    // VISUALIZAÇÃO DO ARTIGO

    const [artigoDetalhe, setArtigoDetalhe] =
        useState(null);

    const [carregandoDetalhe, setCarregandoDetalhe] =
        useState(false);

    const [erroDetalhe, setErroDetalhe] =
        useState("");

    const [confirmacaoIA, setConfirmacaoIA] =
        useState(false);

    const [alterandoAutorizacao, setAlterandoAutorizacao] =
        useState(null);

    // REFERÊNCIAS

    const ativoRef = useRef(false);

    const operacaoChatRef = useRef(false);

    const operacaoBaseRef = useRef(false);

    const versaoBaseRef = useRef(0);

    const versaoLimitesRef = useRef(0);

    const versaoDetalheRef = useRef(0);

    const finalChatRef = useRef(null);

    const modalRef = useRef(null);

    const modalAberto =
        carregandoDetalhe || artigoDetalhe !== null;

    // =========================================
    // CICLO DE VIDA
    // =========================================

    useEffect(() => {

        ativoRef.current = true;

        return () => {

            ativoRef.current = false;

            versaoBaseRef.current++;
            versaoLimitesRef.current++;
            versaoDetalheRef.current++;
        };

    }, []);

    const sessaoValida = useCallback(() => {

        return (
            ativoRef.current &&
            localStorage.getItem("token") === token
        );

    }, [token]);

    // =========================================
    // CARREGAR LIMITES
    // =========================================

    const carregarLimites = useCallback(async () => {

        if (!podeConsultar || !sessaoValida()) return;

        const versao = ++versaoLimitesRef.current;

        try {

            setCarregandoLimites(true);
            setErroLimites("");

            const dados = await requisicaoApi(
                `${API_IA}/limites`
            );

            if (
                !sessaoValida() ||
                versao !== versaoLimitesRef.current
            ) return;

            setLimites(dados);

        } catch (error) {

            if (
                !sessaoValida() ||
                versao !== versaoLimitesRef.current
            ) return;

            setErroLimites(
                error.message ||
                "Não foi possível consultar o limite diário."
            );

        } finally {

            if (
                sessaoValida() &&
                versao === versaoLimitesRef.current
            ) {
                setCarregandoLimites(false);
            }
        }

    }, [podeConsultar, sessaoValida]);

    // =========================================
    // CARREGAR BASE DE CONHECIMENTO
    // =========================================

    const carregarBase = useCallback(async () => {

        if (!podeGerenciar || !sessaoValida()) return;

        const versao = ++versaoBaseRef.current;

        try {

            setCarregandoBase(true);
            setErroBase("");

            const dados = await requisicaoApi(
                API_BASE
            );

            if (
                !sessaoValida() ||
                versao !== versaoBaseRef.current
            ) return;

            if (!Array.isArray(dados)) {

                throw new Error(
                    "A API retornou uma lista inválida."
                );
            }

            setArtigos(dados);

        } catch (error) {

            if (
                !sessaoValida() ||
                versao !== versaoBaseRef.current
            ) return;

            setErroBase(
                error.message ||
                "Não foi possível carregar a base de conhecimento."
            );

        } finally {

            if (
                sessaoValida() &&
                versao === versaoBaseRef.current
            ) {
                setCarregandoBase(false);
            }
        }

    }, [podeGerenciar, sessaoValida]);

    useEffect(() => {

        carregarLimites();
        carregarBase();

    }, [
        carregarLimites,
        carregarBase
    ]);

    // =========================================
    // ATUALIZAR LIMITES AO RETORNAR À TELA
    // =========================================

    useEffect(() => {

        function atualizarAoRetornar() {

            if (
                document.visibilityState === "visible" &&
                !operacaoChatRef.current
            ) {
                carregarLimites();
            }
        }

        document.addEventListener(
            "visibilitychange",
            atualizarAoRetornar
        );

        return () => {

            document.removeEventListener(
                "visibilitychange",
                atualizarAoRetornar
            );
        };

    }, [carregarLimites]);

    // =========================================
    // ROLAGEM AUTOMÁTICA DO CHAT
    // =========================================

    useEffect(() => {

        if (aba === "chat" && mensagens.length > 0) {

            finalChatRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });
        }

    }, [mensagens, enviando, aba]);

    // =========================================
    // ENVIAR PERGUNTA
    // =========================================

    async function enviarPergunta(
        texto = pergunta
    ) {

        if (
            !podeConsultar ||
            operacaoChatRef.current ||
            !sessaoValida()
        ) return;

        const textoLimpo = texto.trim();

        if (textoLimpo.length < 3) {

            setErroChat(
                "Digite uma pergunta com pelo menos três caracteres."
            );

            return;
        }

        if (textoLimpo.length > 1000) {

            setErroChat(
                "A pergunta deve possuir até 1000 caracteres."
            );

            return;
        }

        operacaoChatRef.current = true;

        setErroChat("");
        setPergunta("");
        setEnviando(true);

        const mensagemUsuario = {

            id: criarId(),

            tipo: "usuario",

            texto: textoLimpo,

            data: new Date().toISOString()
        };

        setMensagens(anterior => [
            ...anterior,
            mensagemUsuario
        ]);

        try {

            const dados = await requisicaoApi(
                `${API_IA}/perguntar`,
                {
                    method: "POST",

                    body: JSON.stringify({
                        pergunta: textoLimpo
                    })
                }
            );

            if (!sessaoValida()) return;

            if (
                typeof dados?.resposta !== "string" ||
                !dados.resposta.trim()
            ) {

                throw new Error(
                    "A inteligência artificial não retornou uma resposta válida."
                );
            }

            const mensagemIA = {

                id: criarId(),

                tipo: "assistente",

                texto: dados.resposta,

                fontes: Array.isArray(dados.fontes)
                    ? dados.fontes
                    : [],

                origem: dados.origem,

                modelo: dados.modelo,

                aviso: dados.aviso,

                data: dados.geradoEm ||
                    new Date().toISOString()
            };

            setMensagens(anterior => [
                ...anterior,
                mensagemIA
            ]);

            if (
                typeof dados.consultasRestantes === "number"
            ) {

                setLimites(anterior =>
                    anterior
                        ? {
                            ...anterior,

                            consultasRestantes:
                                dados.consultasRestantes
                        }
                        : anterior
                );
            }

        } catch (error) {

            if (!sessaoValida()) return;

            setErroChat(
                error.message ||
                "Não foi possível consultar o assistente fiscal."
            );

            // Recuperar a pergunta para permitir nova tentativa.

            setPergunta(textoLimpo);

        } finally {

            if (sessaoValida()) {

                await carregarLimites();

                if (sessaoValida()) {
                    setEnviando(false);
                }
            }

            operacaoChatRef.current = false;
        }
    }

    function enviarFormulario(event) {

        event.preventDefault();

        enviarPergunta();
    }

    // =========================================
    // COPIAR RESPOSTA
    // =========================================

    async function copiarResposta(mensagem) {

        try {

            await navigator.clipboard.writeText(
                mensagem.texto
            );

            if (!sessaoValida()) return;

            setCopiadoId(mensagem.id);

        } catch {

            if (!sessaoValida()) return;

            setErroChat(
                "Não foi possível copiar automaticamente. Selecione o texto da resposta para copiá-lo."
            );
        }
    }

    // =========================================
    // LIMPAR CONVERSA
    // =========================================

    function limparConversa() {

        if (enviando) return;

        if (
            mensagens.length > 0 &&
            !window.confirm(
                "Deseja limpar todas as mensagens desta conversa?"
            )
        ) return;

        setMensagens([]);
        setPergunta("");
        setErroChat("");
        setCopiadoId(null);
    }

    // =========================================
    // CONSULTAR ARTIGO PARA AUTORIZAÇÃO
    // =========================================

    async function visualizarArtigo(artigo) {

        if (
            !podeGerenciar ||
            operacaoBaseRef.current ||
            !sessaoValida()
        ) return;

        const versao = ++versaoDetalheRef.current;

        setArtigoDetalhe(null);
        setConfirmacaoIA(false);
        setErroDetalhe("");
        setCarregandoDetalhe(true);

        try {

            const dados = await requisicaoApi(
                `${API_BASE}/${encodeURIComponent(
                    artigo.artigoId
                )}`
            );

            if (
                !sessaoValida() ||
                versao !== versaoDetalheRef.current
            ) return;

            setArtigoDetalhe(dados);

        } catch (error) {

            if (
                !sessaoValida() ||
                versao !== versaoDetalheRef.current
            ) return;

            setErroBase(
                error.message ||
                "Não foi possível visualizar o artigo."
            );

        } finally {

            if (
                sessaoValida() &&
                versao === versaoDetalheRef.current
            ) {
                setCarregandoDetalhe(false);
            }
        }
    }

    // =========================================
    // FECHAR MODAL
    // =========================================

    const fecharModal = useCallback(() => {

        if (operacaoBaseRef.current) return;

        versaoDetalheRef.current++;

        setArtigoDetalhe(null);
        setCarregandoDetalhe(false);
        setErroDetalhe("");
        setConfirmacaoIA(false);

    }, []);

    // =========================================
    // ACESSIBILIDADE DO MODAL
    // =========================================

    useEffect(() => {

        if (!modalAberto) return;

        const focoAnterior = document.activeElement;

        const modal = modalRef.current;

        modal?.focus();

        function tratarTeclado(event) {

            if (event.key === "Escape") {

                fecharModal();

                return;
            }

            if (event.key !== "Tab" || !modal) return;

            const elementos = Array.from(
                modal.querySelectorAll(
                    "button:not(:disabled), input:not(:disabled), a[href], [tabindex='0']"
                )
            );

            if (!elementos.length) {

                event.preventDefault();

                return;
            }

            const primeiro = elementos[0];

            const ultimo = elementos[
                elementos.length - 1
            ];

            if (
                event.shiftKey &&
                (
                    document.activeElement === primeiro ||
                    document.activeElement === modal
                )
            ) {

                event.preventDefault();
                ultimo.focus();

            } else if (
                !event.shiftKey &&
                document.activeElement === ultimo
            ) {

                event.preventDefault();
                primeiro.focus();
            }
        }

        document.addEventListener(
            "keydown",
            tratarTeclado
        );

        return () => {

            document.removeEventListener(
                "keydown",
                tratarTeclado
            );

            focoAnterior?.focus();
        };

    }, [modalAberto, fecharModal]);

    // =========================================
    // AUTORIZAR ARTIGO
    // =========================================

    async function autorizarArtigo() {

        if (
            !podeGerenciar ||
            !artigoDetalhe?.podeAutorizar ||
            !artigoDetalhe?.hashConteudo ||
            !confirmacaoIA ||
            operacaoBaseRef.current ||
            !sessaoValida()
        ) return;

        operacaoBaseRef.current = true;

        const artigoId = artigoDetalhe.artigoId;

        try {

            setAlterandoAutorizacao(artigoId);
            setErroDetalhe("");
            setMensagemBase("");

            const dados = await requisicaoApi(
                `${API_BASE}/${encodeURIComponent(
                    artigoId
                )}/autorizacao`,
                {
                    method: "PATCH",

                    body: JSON.stringify({

                        autorizado: true,

                        hashConteudo:
                            artigoDetalhe.hashConteudo
                    })
                }
            );

            if (!sessaoValida()) return;

            setArtigoDetalhe(null);
            setConfirmacaoIA(false);

            setMensagemBase(
                dados?.mensagem ||
                "Artigo autorizado com sucesso."
            );

            await carregarBase();

        } catch (error) {

            if (!sessaoValida()) return;

            setErroDetalhe(
                error.message ||
                "Não foi possível autorizar o artigo."
            );

            setConfirmacaoIA(false);

        } finally {

            operacaoBaseRef.current = false;

            if (sessaoValida()) {
                setAlterandoAutorizacao(null);
            }
        }
    }

    // =========================================
    // REVOGAR AUTORIZAÇÃO
    // =========================================

    async function revogarArtigo(artigo) {

        if (
            !podeGerenciar ||
            !artigo.podeRevogar ||
            operacaoBaseRef.current ||
            !sessaoValida()
        ) return;

        const confirmar = window.confirm(

            `Deseja revogar a autorização do artigo "${artigo.titulo}"?\n\n` +

            "Ele deixará de ser utilizado em novas consultas da inteligência artificial."
        );

        if (!confirmar) return;

        operacaoBaseRef.current = true;

        try {

            setAlterandoAutorizacao(
                artigo.artigoId
            );

            setErroBase("");
            setMensagemBase("");

            const dados = await requisicaoApi(
                `${API_BASE}/${encodeURIComponent(
                    artigo.artigoId
                )}/autorizacao`,
                {
                    method: "PATCH",

                    body: JSON.stringify({
                        autorizado: false
                    })
                }
            );

            if (!sessaoValida()) return;

            setMensagemBase(
                dados?.mensagem ||
                "Autorização revogada com sucesso."
            );

            await carregarBase();

        } catch (error) {

            if (!sessaoValida()) return;

            setErroBase(
                error.message ||
                "Não foi possível revogar a autorização."
            );

        } finally {

            operacaoBaseRef.current = false;

            if (sessaoValida()) {
                setAlterandoAutorizacao(null);
            }
        }
    }

    // =========================================
    // INDICADORES DA BASE
    // =========================================

    const totalAutorizados = artigos.filter(
        artigo => artigo.situacao === "AUTORIZADO"
    ).length;

    const totalNaoAutorizados = artigos.filter(
        artigo => artigo.situacao === "NAO_AUTORIZADO"
    ).length;

    const totalDesatualizados = artigos.filter(
        artigo =>
            artigo.situacao === "DESATUALIZADO" ||
            artigo.situacao === "INDISPONIVEL"
    ).length;

    const temas = Array.from(

        new Map(

            artigos.map(artigo => [
                artigo.temaId,
                {
                    id: artigo.temaId,
                    nome: artigo.tema
                }
            ])

        ).values()

    ).sort((a, b) =>
        String(a.nome).localeCompare(
            String(b.nome),
            "pt-BR"
        )
    );

    // =========================================
    // FILTROS E PAGINAÇÃO
    // =========================================

    const artigosFiltrados = artigos.filter(artigo => {

        const texto = normalizarTexto(
            `${artigo.titulo} ${artigo.tema}`
        );

        const correspondePesquisa = texto.includes(
            normalizarTexto(pesquisa.trim())
        );

        const correspondeTema =
            !temaFiltro ||
            String(artigo.temaId) === temaFiltro;

        const correspondeSituacao =
            !situacaoFiltro ||
            artigo.situacao === situacaoFiltro;

        return (
            correspondePesquisa &&
            correspondeTema &&
            correspondeSituacao
        );
    });

    const totalPaginas = Math.max(

        1,

        Math.ceil(
            artigosFiltrados.length /
            ITENS_POR_PAGINA
        )
    );

    const paginaAtual = Math.min(
        pagina,
        totalPaginas
    );

    const artigosPagina = artigosFiltrados.slice(

        (paginaAtual - 1) * ITENS_POR_PAGINA,

        paginaAtual * ITENS_POR_PAGINA
    );

    const percentualUso = limites?.limiteDiario > 0

        ? Math.min(
            100,
            Math.max(
                0,
                limites.consultasUtilizadas /
                limites.limiteDiario * 100
            )
        )

        : 0;

    // =========================================
    // RENDERIZAÇÃO
    // =========================================

    return (

        <div className="ia-pagina">

            {/* CABEÇALHO PRINCIPAL */}

            <header className="ia-cabecalho">

                <div className="ia-titulo">

                    <div className="ia-titulo-icone">
                        <Brain size={30} />
                    </div>

                    <div>

                        <h1>Inteligência Artificial</h1>

                        <p>
                            Seu assistente de conhecimento tributário.
                        </p>

                    </div>

                </div>

                <span className="ia-identidade">

                    <Sparkles size={16} />

                    Tecnologia Groq

                </span>

            </header>

            {/* AVISO DE SEGURANÇA */}

            <div className="ia-aviso">

                <Info size={21} />

                <div>

                    <strong>
                        Inteligência artificial responsável
                    </strong>

                    <p>
                        As respostas são baseadas nos artigos
                        autorizados da Certacon e podem conter
                        imprecisões. Não informe CPF, CNPJ,
                        senhas, documentos ou informações
                        confidenciais nas perguntas.
                    </p>

                </div>

            </div>

            {/* ABAS */}

            <section className="ia-painel">

                <div className="ia-abas">

                    {podeConsultar && (

                        <button
                            type="button"
                            className={
                                aba === "chat"
                                    ? "ia-aba ia-aba-ativa"
                                    : "ia-aba"
                            }
                            aria-pressed={aba === "chat"}
                            onClick={() => {

                                setAba("chat");

                                if (!enviando) {
                                    carregarLimites();
                                }
                            }}
                        >

                            <Bot size={20} />

                            Assistente Fiscal

                        </button>

                    )}

                    {podeGerenciar && (

                        <button
                            type="button"
                            className={
                                aba === "base"
                                    ? "ia-aba ia-aba-ativa"
                                    : "ia-aba"
                            }
                            aria-pressed={aba === "base"}
                            onClick={() => {

                                setAba("base");

                                if (!operacaoBaseRef.current) {
                                    carregarBase();
                                }
                            }}
                        >

                            <Database size={19} />

                            Base de conhecimento

                        </button>

                    )}

                </div>

                {/* ==========================
                    ASSISTENTE FISCAL
                ========================== */}

                {aba === "chat" && podeConsultar && (

                    <div className="ia-chat-layout">

                        <section className="ia-chat">

                            {/* CABEÇALHO DO CHAT */}

                            <div className="ia-chat-cabecalho">

                                <div className="ia-chat-identidade">

                                    <div className="ia-avatar-principal">

                                        <Bot size={26} />

                                    </div>

                                    <div>

                                        <h2>Assistente Fiscal IA</h2>

                                        <p>
                                            Conhecimento IntegraCertacon
                                        </p>

                                    </div>

                                </div>

                                <button
                                    type="button"
                                    className="ia-botao-secundario"
                                    onClick={limparConversa}
                                    disabled={
                                        enviando ||
                                        mensagens.length === 0
                                    }
                                >

                                    <Trash2 size={16} />

                                    Limpar

                                </button>

                            </div>

                            {/* MENSAGENS */}

                            <div
                                className="ia-chat-mensagens"
                                role="log"
                                aria-live="polite"
                                aria-relevant="additions text"
                            >

                                {mensagens.length === 0 && (

                                    <div className="ia-boas-vindas">

                                        <div className="ia-boas-vindas-icone">

                                            <Bot size={48} />

                                            <span>
                                                <Sparkles size={17} />
                                            </span>

                                        </div>

                                        <h2>
                                            Como posso ajudar você?
                                        </h2>

                                        <p>
                                            Faça perguntas sobre os
                                            conteúdos tributários
                                            disponibilizados pela Certacon.
                                        </p>

                                        <div className="ia-sugestoes">

                                            <span>
                                                Perguntas sugeridas
                                            </span>

                                            <div className="ia-sugestoes-grid">

                                                {PERGUNTAS_SUGERIDAS.map(
                                                    item => (

                                                        <button
                                                            key={item}
                                                            type="button"
                                                            onClick={() =>
                                                                enviarPergunta(item)
                                                            }
                                                            disabled={enviando}
                                                        >

                                                            <MessageSquare size={20} />

                                                            <span>
                                                                {item}
                                                            </span>

                                                            <ChevronRight size={16} />

                                                        </button>

                                                    )
                                                )}

                                            </div>

                                            <small>
                                                As respostas dependem dos
                                                artigos autorizados disponíveis.
                                            </small>

                                        </div>

                                    </div>

                                )}

                                {mensagens.map(mensagem => (

                                    <article
                                        key={mensagem.id}
                                        className={
                                            `ia-mensagem ia-mensagem-${mensagem.tipo}`
                                        }
                                    >

                                        <div className="ia-mensagem-avatar">

                                            {mensagem.tipo === "usuario"
                                                ? <User size={19} />
                                                : <Bot size={21} />}

                                        </div>

                                        <div className="ia-mensagem-corpo">

                                            <div className="ia-mensagem-nome">

                                                <strong>

                                                    {mensagem.tipo === "usuario"
                                                        ? "Você"
                                                        : "Assistente Fiscal"}

                                                </strong>

                                                <small>

                                                    {formatarData(
                                                        mensagem.data
                                                    )}

                                                </small>

                                            </div>

                                            <div className="ia-mensagem-texto">

                                                {mensagem.tipo === "assistente" ? (

                                                    <RespostaIA texto={mensagem.texto} />

                                                ) : (

                                                    mensagem.texto

                                                )}

                                            </div>

                                            {/* FONTES CONSULTADAS */}

                                            {mensagem.tipo === "assistente" &&
                                                mensagem.fontes?.length > 0 && (

                                                    <div className="ia-fontes">

                                                        <h3>

                                                            <FileText size={17} />

                                                            Fontes consultadas

                                                        </h3>

                                                        {mensagem.fontes.map(
                                                            (fonte, index) => (

                                                                <Link
                                                                    key={
                                                                        `${fonte.artigoId}-${index}`
                                                                    }
                                                                    to={
                                                                        `/conteudos/detalhes?id=${encodeURIComponent(
                                                                            fonte.artigoId
                                                                        )}`
                                                                    }
                                                                    state={{
                                                                        origem: "/assistente-ia"
                                                                    }}
                                                                    className="ia-fonte"
                                                                >

                                                                    <div className="ia-fonte-numero">

                                                                        {index + 1}

                                                                    </div>

                                                                    <div className="ia-fonte-texto">

                                                                        <strong>
                                                                            {fonte.titulo}
                                                                        </strong>

                                                                        <small>
                                                                            {fonte.tema}
                                                                        </small>

                                                                    </div>

                                                                    <ExternalLink size={16} />

                                                                </Link>

                                                            )
                                                        )}

                                                    </div>

                                                )}

                                            {mensagem.tipo === "assistente" && (

                                                <>

                                                    {mensagem.origem === "SEM_FONTES" && (

                                                        <div className="ia-sem-fontes">

                                                            <Info size={16} />

                                                            Nenhuma consulta à Groq foi necessária.

                                                        </div>

                                                    )}

                                                    <div className="ia-resposta-acoes">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                copiarResposta(mensagem)
                                                            }
                                                        >

                                                            {copiadoId === mensagem.id
                                                                ? <Check size={16} />
                                                                : <Copy size={16} />}

                                                            {copiadoId === mensagem.id
                                                                ? "Copiado"
                                                                : "Copiar resposta"}

                                                        </button>

                                                    </div>

                                                </>

                                            )}

                                        </div>

                                    </article>

                                ))}

                                {/* INDICADOR DE CARREGAMENTO */}

                                {enviando && (

                                    <article className="ia-mensagem ia-mensagem-assistente">

                                        <div className="ia-mensagem-avatar">
                                            <Bot size={21} />
                                        </div>

                                        <div className="ia-pensando">

                                            <span />
                                            <span />
                                            <span />

                                            <p>
                                                Consultando conteúdos...
                                            </p>

                                        </div>

                                    </article>

                                )}

                                <div ref={finalChatRef} />

                            </div>

                            {/* FORMULÁRIO DE ENVIO */}

                            <div className="ia-chat-rodape">

                                {erroChat && (

                                    <div
                                        className="ia-erro"
                                        role="alert"
                                    >

                                        <AlertCircle size={18} />

                                        <span>{erroChat}</span>

                                        <button
                                            type="button"
                                            aria-label="Fechar mensagem de erro"
                                            onClick={() => setErroChat("")}
                                        >

                                            <X size={17} />

                                        </button>

                                    </div>

                                )}

                                <form
                                    className="ia-formulario-chat"
                                    onSubmit={enviarFormulario}
                                >

                                    <textarea
                                        aria-label="Pergunta ao assistente fiscal"
                                        placeholder="Digite sua dúvida tributária..."
                                        value={pergunta}
                                        maxLength={1000}
                                        rows={2}
                                        disabled={enviando}
                                        onChange={event =>
                                            setPergunta(
                                                event.target.value
                                            )
                                        }
                                        onKeyDown={event => {

                                            if (
                                                event.key === "Enter" &&
                                                !event.shiftKey &&
                                                !event.nativeEvent.isComposing
                                            ) {

                                                event.preventDefault();

                                                enviarPergunta();
                                            }
                                        }}
                                    />

                                    <button
                                        type="submit"
                                        className="ia-botao-enviar"
                                        disabled={
                                            enviando ||
                                            pergunta.trim().length < 3
                                        }
                                        title="Enviar pergunta"
                                        aria-label="Enviar pergunta"
                                    >

                                        {enviando
                                            ? (
                                                <RefreshCw
                                                    size={23}
                                                    className="ia-girando"
                                                />
                                            )
                                            : <Send size={23} />}

                                    </button>

                                </form>

                                <div className="ia-chat-informacoes">

                                    <small>
                                        Enter para enviar · Shift + Enter para quebrar linha
                                    </small>

                                    <small>
                                        {pergunta.length}/1000
                                    </small>

                                </div>

                                <p className="ia-chat-disclaimer">
                                    A IA pode cometer erros.
                                    Consulte os artigos originais
                                    e a equipe fiscal.
                                </p>

                            </div>

                        </section>

                        {/* ==========================
                            PAINEL LATERAL DO CHAT
                        ========================== */}

                        <aside className="ia-chat-lateral">

                            <section className="ia-card-lateral">

                                <div className="ia-card-lateral-titulo">

                                    <Clock size={21} />

                                    <h3>Utilização diária</h3>

                                    <button
                                        type="button"
                                        className="ia-botao-atualizar"
                                        aria-label="Atualizar limite diário"
                                        onClick={carregarLimites}
                                        disabled={
                                            carregandoLimites ||
                                            enviando
                                        }
                                    >

                                        <RefreshCw
                                            size={17}
                                            className={
                                                carregandoLimites
                                                    ? "ia-girando"
                                                    : ""
                                            }
                                        />

                                    </button>

                                </div>

                                {erroLimites && (

                                    <p className="ia-texto-erro">
                                        {erroLimites}
                                    </p>

                                )}

                                {limites ? (

                                    <>

                                        <div className="ia-limite-numero">

                                            <strong>
                                                {limites.consultasRestantes}
                                            </strong>

                                            <span>
                                                / {limites.limiteDiario}
                                            </span>

                                        </div>

                                        <p className="ia-limite-legenda">
                                            Consultas restantes hoje
                                        </p>

                                        <div
                                            className="ia-progresso"
                                            role="progressbar"
                                            aria-label="Consultas utilizadas"
                                            aria-valuemin={0}
                                            aria-valuemax={
                                                limites.limiteDiario
                                            }
                                            aria-valuenow={
                                                Math.min(
                                                    limites.consultasUtilizadas,
                                                    limites.limiteDiario
                                                )
                                            }
                                        >

                                            <div
                                                style={{
                                                    width: `${percentualUso}%`
                                                }}
                                            />

                                        </div>

                                        <div className="ia-limite-detalhes">

                                            <div>

                                                <span>Resumos gerados</span>

                                                <strong>
                                                    {limites.quantidadeResumos}
                                                </strong>

                                            </div>

                                            <div>

                                                <span>Perguntas realizadas</span>

                                                <strong>
                                                    {limites.quantidadePerguntas}
                                                </strong>

                                            </div>

                                            <div>

                                                <span>Total utilizado</span>

                                                <strong>
                                                    {limites.consultasUtilizadas}
                                                </strong>

                                            </div>

                                        </div>

                                        {limites.consultasRestantes === 0 && (

                                            <div className="ia-limite-atingido">

                                                <AlertCircle size={17} />

                                                Limite diário de chamadas à IA atingido.

                                            </div>

                                        )}

                                        <small className="ia-limite-renovacao">

                                            Renovação à meia-noite,
                                            no horário de Brasília.

                                        </small>

                                    </>

                                ) : (

                                    <p className="ia-limite-legenda">

                                        {carregandoLimites
                                            ? "Carregando utilização..."
                                            : "Utilização indisponível."}

                                    </p>

                                )}

                            </section>

                            <section className="ia-card-lateral">

                                <div className="ia-card-lateral-titulo">

                                    <Brain size={21} />

                                    <h3>Como funciona?</h3>

                                </div>

                                <div className="ia-etapas">

                                    <div>

                                        <span>
                                            <MessageSquare size={18} />
                                        </span>

                                        <p>
                                            Você envia uma pergunta tributária.
                                        </p>

                                    </div>

                                    <div>

                                        <span>
                                            <Database size={18} />
                                        </span>

                                        <p>
                                            O sistema pesquisa artigos
                                            autorizados pela Certacon.
                                        </p>

                                    </div>

                                    <div>

                                        <span>
                                            <Sparkles size={18} />
                                        </span>

                                        <p>
                                            A IA utiliza os conteúdos
                                            encontrados para elaborar a resposta.
                                        </p>

                                    </div>

                                    <div>

                                        <span>
                                            <FileText size={18} />
                                        </span>

                                        <p>
                                            Você recebe a resposta e os
                                            links das fontes consultadas.
                                        </p>

                                    </div>

                                </div>

                            </section>

                            <section className="ia-card-lateral">

                                <div className="ia-card-lateral-titulo">

                                    <ShieldCheck size={21} />

                                    <h3>Segurança e privacidade</h3>

                                </div>

                                <p className="ia-privacidade">

                                    Somente artigos públicos, publicados
                                    e autorizados podem alimentar a IA.

                                    As perguntas são enviadas à Groq.
                                    Não inclua informações confidenciais.

                                </p>

                                <p className="ia-privacidade">

                                    O histórico desta conversa é temporário.
                                    Cada pergunta é processada individualmente.

                                </p>

                            </section>

                        </aside>

                    </div>

                )}

                {/* ==========================
                    BASE DE CONHECIMENTO
                ========================== */}

                {aba === "base" && podeGerenciar && (

                    <div className="ia-base">

                        <div className="ia-base-cabecalho">

                            <div>

                                <h2>Base de conhecimento da IA</h2>

                                <p>
                                    Gerencie quais artigos podem
                                    ser utilizados pela inteligência artificial.
                                </p>

                            </div>

                            <button
                                type="button"
                                className="ia-botao-secundario"
                                onClick={carregarBase}
                                disabled={
                                    carregandoBase ||
                                    alterandoAutorizacao !== null
                                }
                            >

                                <RefreshCw
                                    size={17}
                                    className={
                                        carregandoBase
                                            ? "ia-girando"
                                            : ""
                                    }
                                />

                                Atualizar

                            </button>

                        </div>

                        {mensagemBase && (

                            <div
                                className="ia-sucesso"
                                role="status"
                            >

                                <Check size={19} />

                                <span>
                                    {mensagemBase}
                                </span>

                                <button
                                    type="button"
                                    aria-label="Fechar mensagem"
                                    onClick={() =>
                                        setMensagemBase("")
                                    }
                                >
                                    <X size={17} />
                                </button>

                            </div>

                        )}

                        {erroBase && (

                            <div
                                className="ia-erro"
                                role="alert"
                            >

                                <AlertCircle size={18} />

                                <span>{erroBase}</span>

                                <button
                                    type="button"
                                    aria-label="Fechar mensagem de erro"
                                    onClick={() => setErroBase("")}
                                >
                                    <X size={17} />
                                </button>

                            </div>

                        )}

                        {/* INDICADORES */}

                        <div className="ia-indicadores">

                            <Indicador
                                titulo="Artigos listados"
                                valor={artigos.length}
                                Icone={FileText}
                            />

                            <Indicador
                                titulo="Autorizados"
                                valor={totalAutorizados}
                                Icone={ShieldCheck}
                                classe="ia-indicador-verde"
                            />

                            <Indicador
                                titulo="Não autorizados"
                                valor={totalNaoAutorizados}
                                Icone={Lock}
                                classe="ia-indicador-cinza"
                            />

                            <Indicador
                                titulo="Requerem atenção"
                                valor={totalDesatualizados}
                                Icone={AlertCircle}
                                classe="ia-indicador-laranja"
                            />

                        </div>

                        {/* FILTROS */}

                        <div className="ia-filtros">

                            <label className="ia-campo">

                                <span>Pesquisar artigo</span>

                                <div className="ia-pesquisa">

                                    <Search size={18} />

                                    <input
                                        type="search"
                                        placeholder="Título ou tema"
                                        value={pesquisa}
                                        onChange={event => {

                                            setPesquisa(
                                                event.target.value
                                            );

                                            setPagina(1);
                                        }}
                                    />

                                </div>

                            </label>

                            <label className="ia-campo">

                                <span>Tema tributário</span>

                                <select
                                    value={temaFiltro}
                                    onChange={event => {

                                        setTemaFiltro(
                                            event.target.value
                                        );

                                        setPagina(1);
                                    }}
                                >

                                    <option value="">
                                        Todos os temas
                                    </option>

                                    {temas.map(tema => (

                                        <option
                                            key={tema.id}
                                            value={tema.id}
                                        >

                                            {tema.nome}

                                        </option>

                                    ))}

                                </select>

                            </label>

                            <label className="ia-campo">

                                <span>Situação da autorização</span>

                                <select
                                    value={situacaoFiltro}
                                    onChange={event => {

                                        setSituacaoFiltro(
                                            event.target.value
                                        );

                                        setPagina(1);
                                    }}
                                >

                                    <option value="">
                                        Todas as situações
                                    </option>

                                    {Object.entries(SITUACOES).map(
                                        ([valor, titulo]) => (

                                            <option
                                                key={valor}
                                                value={valor}
                                            >
                                                {titulo}
                                            </option>

                                        )
                                    )}

                                </select>

                            </label>

                        </div>

                        <div className="ia-base-listagem-topo">

                            <h3>Artigos da base de conhecimento</h3>

                            <span>

                                {artigosFiltrados.length}
                                {" artigo(s) encontrado(s)"}

                            </span>

                        </div>

                        {carregandoBase ? (

                            <div
                                className="ia-vazio"
                                role="status"
                            >

                                <RefreshCw
                                    size={34}
                                    className="ia-girando"
                                />

                                <p>
                                    Carregando artigos...
                                </p>

                            </div>

                        ) : artigosFiltrados.length === 0 ? (

                            <div className="ia-vazio">

                                <FileText size={45} />

                                <h3>Nenhum artigo encontrado</h3>

                                <p>
                                    Altere os filtros ou publique
                                    novos conteúdos.
                                </p>

                            </div>

                        ) : (

                            <>

                                <div className="ia-artigos-lista">

                                    {artigosPagina.map(artigo => (

                                        <article
                                            key={artigo.artigoId}
                                            className="ia-artigo-card"
                                        >

                                            <div className="ia-artigo-topo">

                                                <div className="ia-artigo-icone">

                                                    <FileText size={25} />

                                                </div>

                                                <div className="ia-artigo-dados">

                                                    <div className="ia-artigo-etiquetas">

                                                        <span className="ia-tema">

                                                            {artigo.tema}

                                                        </span>

                                                        <span
                                                            className={
                                                                `ia-situacao ia-situacao-${String(
                                                                    artigo.situacao
                                                                ).toLowerCase()}`
                                                            }
                                                        >

                                                            {SITUACOES[artigo.situacao]
                                                                || artigo.situacao}

                                                        </span>

                                                    </div>

                                                    <h3>
                                                        {artigo.titulo}
                                                    </h3>

                                                    <p>

                                                        Publicação: {
                                                            formatarData(
                                                                artigo.dataPublicacao
                                                            )
                                                        }

                                                    </p>

                                                </div>

                                            </div>

                                            {artigo.autorizador && (

                                                <div className="ia-artigo-autorizacao">

                                                    <ShieldCheck size={17} />

                                                    <div>

                                                        <strong>
                                                            Última autorização
                                                        </strong>

                                                        <p>

                                                            {artigo.autorizador}

                                                            {" · "}

                                                            {formatarData(
                                                                artigo.dataAutorizacaoIA
                                                            )}

                                                        </p>

                                                    </div>

                                                </div>

                                            )}

                                            {artigo.dataRevogacaoIA && (

                                                <small className="ia-data-revogacao">

                                                    Última revogação: {
                                                        formatarData(
                                                            artigo.dataRevogacaoIA
                                                        )
                                                    }

                                                </small>

                                            )}

                                            {artigo.situacao === "DESATUALIZADO" && (

                                                <div className="ia-aviso-artigo">

                                                    <AlertCircle size={17} />

                                                    O artigo foi alterado
                                                    e precisa de uma nova autorização.

                                                </div>

                                            )}

                                            <div className="ia-artigo-rodape">

                                                <button
                                                    type="button"
                                                    className="ia-botao-secundario"
                                                    onClick={() =>
                                                        visualizarArtigo(artigo)
                                                    }
                                                    disabled={
                                                        alterandoAutorizacao !== null ||
                                                        carregandoDetalhe
                                                    }
                                                >

                                                    <Eye size={17} />

                                                    Visualizar

                                                </button>

                                                {artigo.podeAutorizar &&
                                                    !artigo.autorizacaoValida && (

                                                        <button
                                                            type="button"
                                                            className="ia-botao-principal"
                                                            onClick={() =>
                                                                visualizarArtigo(artigo)
                                                            }
                                                            disabled={
                                                                alterandoAutorizacao !== null ||
                                                                carregandoDetalhe
                                                            }
                                                        >

                                                            <ShieldCheck size={17} />

                                                            {artigo.situacao === "DESATUALIZADO"
                                                                ? "Reautorizar"
                                                                : "Autorizar"}

                                                        </button>

                                                    )}

                                                {artigo.podeRevogar && (

                                                    <button
                                                        type="button"
                                                        className="ia-botao-revogar"
                                                        onClick={() =>
                                                            revogarArtigo(artigo)
                                                        }
                                                        disabled={
                                                            alterandoAutorizacao !== null
                                                        }
                                                    >

                                                        {alterandoAutorizacao ===
                                                            artigo.artigoId
                                                            ? (
                                                                <RefreshCw
                                                                    size={17}
                                                                    className="ia-girando"
                                                                />
                                                            )
                                                            : <ShieldOff size={17} />}

                                                        Revogar

                                                    </button>

                                                )}

                                            </div>

                                        </article>

                                    ))}

                                </div>

                                {/* PAGINAÇÃO */}

                                <div className="ia-paginacao">

                                    <span>

                                        Página {paginaAtual} de {totalPaginas}

                                    </span>

                                    <div>

                                        <button
                                            type="button"
                                            aria-label="Página anterior"
                                            disabled={paginaAtual <= 1}
                                            onClick={() =>
                                                setPagina(
                                                    paginaAtual - 1
                                                )
                                            }
                                        >

                                            <ChevronLeft size={20} />

                                        </button>

                                        <strong>
                                            {paginaAtual}
                                        </strong>

                                        <button
                                            type="button"
                                            aria-label="Próxima página"
                                            disabled={
                                                paginaAtual >= totalPaginas
                                            }
                                            onClick={() =>
                                                setPagina(
                                                    paginaAtual + 1
                                                )
                                            }
                                        >

                                            <ChevronRight size={20} />

                                        </button>

                                    </div>

                                </div>

                            </>

                        )}

                    </div>

                )}

            </section>

            {/* ==========================
                MODAL DE VISUALIZAÇÃO
                E AUTORIZAÇÃO
            ========================== */}

            {modalAberto && podeGerenciar && (

                <div
                    className="ia-modal-fundo"
                    onClick={event => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {

                            fecharModal();
                        }
                    }}
                >

                    <div
                        className="ia-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="ia-modal-titulo"
                        tabIndex={-1}
                        ref={modalRef}
                    >

                        <div className="ia-modal-cabecalho">

                            <div>

                                <h2 id="ia-modal-titulo">
                                    Visualizar artigo
                                </h2>

                                <p>
                                    Confira o conteúdo antes de autorizar.
                                </p>

                            </div>

                            <button
                                type="button"
                                className="ia-modal-fechar"
                                onClick={fecharModal}
                                disabled={
                                    alterandoAutorizacao !== null
                                }
                                aria-label="Fechar visualização"
                            >

                                <X size={23} />

                            </button>

                        </div>

                        {carregandoDetalhe ? (

                            <div className="ia-vazio">

                                <RefreshCw
                                    size={32}
                                    className="ia-girando"
                                />

                                <p>
                                    Consultando artigo...
                                </p>

                            </div>

                        ) : artigoDetalhe && (

                            <div className="ia-modal-conteudo">

                                {erroDetalhe && (

                                    <div
                                        className="ia-erro"
                                        role="alert"
                                    >

                                        <AlertCircle size={18} />

                                        <span>
                                            {erroDetalhe}
                                        </span>

                                    </div>

                                )}

                                <div className="ia-modal-artigo">

                                    <span className="ia-tema">

                                        {artigoDetalhe.tema || "Artigo"}

                                    </span>

                                    <h2>
                                        {artigoDetalhe.titulo}
                                    </h2>

                                    {artigoDetalhe.resumo && (

                                        <>

                                            <h3>Resumo original</h3>

                                            <p>
                                                {artigoDetalhe.resumo}
                                            </p>

                                        </>

                                    )}

                                    <h3>Conteúdo do artigo</h3>

                                    <div className="ia-modal-texto">

                                        {artigoDetalhe.conteudo ||

                                            "O conteúdo não está disponível para processamento pela IA."}

                                    </div>

                                </div>

                                {artigoDetalhe.podeAutorizar &&
                                    artigoDetalhe.situacao !== "AUTORIZADO" && (

                                        <>

                                            <div className="ia-modal-seguranca">

                                                <ShieldCheck size={23} />

                                                <div>

                                                    <strong>
                                                        Autorização de processamento
                                                    </strong>

                                                    <p>
                                                        Ao autorizar, este conteúdo
                                                        poderá ser enviado à Groq
                                                        para geração de resumos e
                                                        respostas tributárias.
                                                    </p>

                                                    <p>
                                                        Se o artigo for alterado,
                                                        uma nova autorização poderá
                                                        ser necessária.
                                                    </p>

                                                </div>

                                            </div>

                                            <label className="ia-confirmacao">

                                                <input
                                                    type="checkbox"
                                                    checked={confirmacaoIA}
                                                    disabled={
                                                        alterandoAutorizacao !== null
                                                    }
                                                    onChange={event =>
                                                        setConfirmacaoIA(
                                                            event.target.checked
                                                        )
                                                    }
                                                />

                                                <span>
                                                    Confirmo que revisei este conteúdo
                                                    e possuo autorização da empresa
                                                    para seu processamento pela Groq.
                                                </span>

                                            </label>

                                        </>

                                    )}

                                <div className="ia-modal-acoes">

                                    <button
                                        type="button"
                                        className="ia-botao-secundario"
                                        onClick={fecharModal}
                                        disabled={
                                            alterandoAutorizacao !== null
                                        }
                                    >

                                        Fechar

                                    </button>

                                    {artigoDetalhe.podeAutorizar &&
                                        artigoDetalhe.situacao !== "AUTORIZADO" && (

                                            <button
                                                type="button"
                                                className="ia-botao-principal"
                                                onClick={autorizarArtigo}
                                                disabled={
                                                    !confirmacaoIA ||
                                                    !artigoDetalhe.hashConteudo ||
                                                    alterandoAutorizacao !== null
                                                }
                                            >

                                                {alterandoAutorizacao !== null
                                                    ? (
                                                        <RefreshCw
                                                            size={18}
                                                            className="ia-girando"
                                                        />
                                                    )
                                                    : <ShieldCheck size={18} />}

                                                {alterandoAutorizacao !== null
                                                    ? "Autorizando..."
                                                    : "Confirmar autorização"}

                                            </button>

                                        )}

                                </div>

                            </div>

                        )}

                    </div>

                </div>

            )}

        </div>

    );
}

// =========================================
// COMPONENTE DE INDICADORES
// =========================================

function Indicador({
    titulo,
    valor,
    Icone,
    classe = ""
}) {

    return (

        <article className="ia-indicador">

            <div
                className={
                    `ia-indicador-icone ${classe}`
                }
            >

                <Icone size={25} />

            </div>

            <div>

                <span>{titulo}</span>

                <strong>{valor}</strong>

            </div>

        </article>

    );
}