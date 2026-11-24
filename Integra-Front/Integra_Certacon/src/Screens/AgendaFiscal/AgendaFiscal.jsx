import {
    useState,
    useEffect,
    useRef,
    useCallback
} from "react";

import { Link } from "react-router-dom";

import {
    CalendarDays,
    CalendarCheck,
    CalendarX,
    CalendarClock,
    ChevronLeft,
    ChevronRight,
    Clock,
    AlertCircle,
    Plus,
    Pencil,
    Search,
    RefreshCw,
    X,
    Check,
    Ban,
    List,
    Settings,
    Info
} from "lucide-react";

import { requisicaoApi } from "../../services/api";
import usePermissoes from "../../hooks/usePermissoes";

import { classeCorTema } from "../../utils/coresTemas";

import "../../styles/coresTemas.css";
import "./AgendaFiscal.css";

// =========================================
// CONSTANTES
// =========================================

const MESES = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"
];

const DIAS_SEMANA = [
    "Dom", "Seg", "Ter", "Qua",
    "Qui", "Sex", "Sáb"
];

const SITUACOES = {
    A_VENCER: {
        nome: "A vencer",
        classe: "af-situacao-azul"
    },
    PROXIMO_VENCIMENTO: {
        nome: "Próximo do vencimento",
        classe: "af-situacao-laranja"
    },
    VENCE_HOJE: {
        nome: "Vence hoje",
        classe: "af-situacao-hoje"
    },
    PRAZO_DECORRIDO: {
        nome: "Prazo decorrido",
        classe: "af-situacao-vermelha"
    },
    CANCELADA: {
        nome: "Cancelada",
        classe: "af-situacao-cinza"
    }
};

// =========================================
// FUNÇÕES AUXILIARES
// =========================================

function obterHoje() {

    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const ano = partes.find(
        item => item.type === "year"
    ).value;

    const mes = partes.find(
        item => item.type === "month"
    ).value;

    const dia = partes.find(
        item => item.type === "day"
    ).value;

    return `${ano}-${mes}-${dia}`;
}

function montarData(ano, mes, dia) {

    return [
        String(ano).padStart(4, "0"),
        String(mes + 1).padStart(2, "0"),
        String(dia).padStart(2, "0")
    ].join("-");
}

function formatarData(data) {

    if (!data) return "Não informada";

    const [ano, mes, dia] =
        String(data).slice(0, 10).split("-");

    return `${dia}/${mes}/${ano}`;
}

function formatarCompetencia(data) {

    if (!data) return "Não informada";

    const [ano, mes] =
        String(data).slice(0, 10).split("-");

    return `${mes}/${ano}`;
}

function normalizarTexto(valor) {

    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function calcularDiasRestantes(data, hoje) {

    const vencimento = Date.parse(
        `${data}T00:00:00Z`
    );

    const dataAtual = Date.parse(
        `${hoje}T00:00:00Z`
    );

    return Math.round(
        (vencimento - dataAtual) / 86400000
    );
}

function calcularSituacao(ativo, dias) {

    if (!ativo) return "CANCELADA";

    if (dias < 0) return "PRAZO_DECORRIDO";

    if (dias === 0) return "VENCE_HOJE";

    if (dias <= 7) return "PROXIMO_VENCIMENTO";

    return "A_VENCER";
}

function normalizarObrigacao(item) {

    return {
        obrigacaoFiscalId:
            item.obrigacaoFiscalId ??
            item.ObrigacaoFiscalId,

        temaId:
            item.temaId ??
            item.TemaId,

        titulo:
            item.titulo ??
            item.Titulo ??
            "Sem título",

        descricao:
            item.descricao ??
            item.Descricao ??
            "",

        tema:
            item.tema ??
            item.Tema ??
            "Sem tema",

        autor:
            item.autor ??
            item.Autor ??
            "Não informado",

        dataVencimento: String(
            item.dataVencimento ??
            item.DataVencimento ??
            ""
        ).slice(0, 10),

        competencia:
            item.competencia ??
            item.Competencia ??
            null,

        ativo:
            item.ativo ??
            item.Ativo ??
            false,

        situacao:
            item.situacao ??
            item.Situacao,

        diasRestantes:
            item.diasRestantes ??
            item.DiasRestantes
    };
}

function formularioInicial(data = obterHoje()) {

    return {
        titulo: "",
        descricao: "",
        temaId: "",
        dataVencimento: data,
        competencia: ""
    };
}

function descricaoPrazo(obrigacao) {

    if (!obrigacao.ativo) {
        return "Obrigação cancelada";
    }

    const dias = obrigacao.diasRestantes;

    if (dias === 0) return "Vence hoje";

    if (dias === 1) return "Vence amanhã";

    if (dias < 0) {
        return `Prazo decorrido há ${Math.abs(dias)} ${
            dias === -1 ? "dia" : "dias"
        }`;
    }

    return `Faltam ${dias} dias`;
}

// =========================================
// CONTROLE DE ACESSO
// =========================================

export default function AgendaFiscal() {

    const {
        autenticado,
        temPermissao,
        carregando,
        erro
    } = usePermissoes();

    const token = localStorage.getItem("token");

    const podeConsultar =
        autenticado &&
        temPermissao("agenda.ler");

    const podeGerenciar =
        autenticado &&
        temPermissao("agenda.gerenciar");

    if (carregando) {

        return (
            <div className="af-pagina">
                <div className="af-carregando" role="status">
                    Verificando permissões...
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
            <div className="af-pagina">

                <div className="af-vazio">

                    <AlertCircle size={42} />

                    <h2>Acesso indisponível</h2>

                    <p>
                        {erro
                            ? "Não foi possível verificar suas permissões."
                            : "Você não possui permissão para acessar a Agenda Fiscal."}
                    </p>

                    <Link
                        to="/home"
                        className="af-botao-principal"
                    >
                        Voltar ao início
                    </Link>

                </div>

            </div>
        );
    }

    return (
        <AgendaFiscalConteudo
            key={`${token}:${podeConsultar}:${podeGerenciar}`}
            token={token}
            podeConsultar={podeConsultar}
            podeGerenciar={podeGerenciar}
        />
    );
}

// =========================================
// COMPONENTE DA AGENDA
// =========================================

function AgendaFiscalConteudo({
    token,
    podeConsultar,
    podeGerenciar
}) {

    const [hoje, setHoje] = useState(obterHoje);

    const [ano, setAno] = useState(
        () => Number(obterHoje().slice(0, 4))
    );

    const [mes, setMes] = useState(
        () => Number(obterHoje().slice(5, 7)) - 1
    );

    const [aba, setAba] = useState(
        podeConsultar ? "calendario" : "gerenciar"
    );

    const [obrigacoes, setObrigacoes] = useState([]);
    const [temas, setTemas] = useState([]);

    const [diaSelecionado, setDiaSelecionado] =
        useState(null);

    const [pesquisa, setPesquisa] = useState("");
    const [temaFiltro, setTemaFiltro] = useState("");
    const [situacaoFiltro, setSituacaoFiltro] =
        useState("");

    const [carregando, setCarregando] = useState(true);
    const [carregandoTemas, setCarregandoTemas] =
        useState(false);

    const [erro, setErro] = useState("");
    const [erroTemas, setErroTemas] = useState("");
    const [mensagem, setMensagem] = useState("");

    const [modalAberto, setModalAberto] = useState(false);
    const [idEditando, setIdEditando] = useState(null);

    const [formulario, setFormulario] =
        useState(() => formularioInicial());

    const [erroFormulario, setErroFormulario] =
        useState("");

    const [salvando, setSalvando] = useState(false);
    const [alterandoStatus, setAlterandoStatus] =
        useState(null);

    const [detalhe, setDetalhe] = useState(null);

    const componenteAtivo = useRef(false);
    const versaoConsulta = useRef(0);
    const versaoTemas = useRef(0);
    const operacaoAtual = useRef(null);
    const modalRef = useRef(null);
    const focoAnterior = useRef(null);

    const chavePeriodo = `${aba}:${ano}:${mes}`;

    const [periodoCarregado, setPeriodoCarregado] =
        useState(null);

    const ocupado =
        salvando || alterandoStatus !== null;

    const dadosDisponiveis =
        periodoCarregado === chavePeriodo &&
        !carregando;

    // =========================================
    // CICLO DE VIDA E SESSÃO
    // =========================================

    useEffect(() => {

        componenteAtivo.current = true;

        const intervalo = setInterval(() => {
            setHoje(obterHoje());
        }, 60000);

        return () => {

            componenteAtivo.current = false;

            versaoConsulta.current++;
            versaoTemas.current++;

            clearInterval(intervalo);
        };

    }, []);

    const sessaoValida = useCallback(() => {

        return (
            componenteAtivo.current &&
            localStorage.getItem("token") === token
        );

    }, [token]);

    // =========================================
    // CARREGAR OBRIGAÇÕES DO MÊS
    // =========================================

    const carregarObrigacoes = useCallback(async () => {

        const numeroConsulta = ++versaoConsulta.current;

        const endpoint =
            aba === "gerenciar"
                ? "/api/AgendaFiscal/gerenciar"
                : "/api/AgendaFiscal";

        const parametros = new URLSearchParams({
            mes: String(mes + 1),
            ano: String(ano)
        });

        try {

            setCarregando(true);
            setErro("");

            const dados = await requisicaoApi(
                `${endpoint}?${parametros.toString()}`
            );

            if (
                !sessaoValida() ||
                versaoConsulta.current !== numeroConsulta
            ) return;

            if (!Array.isArray(dados)) {
                throw new Error(
                    "Resposta inválida da Agenda Fiscal."
                );
            }

            setObrigacoes(
                dados
                    .map(normalizarObrigacao)
                    .filter(item =>
                        item.obrigacaoFiscalId &&
                        /^\d{4}-\d{2}-\d{2}$/.test(
                            item.dataVencimento
                        )
                    )
            );

            setPeriodoCarregado(chavePeriodo);

        } catch (error) {

            if (
                !sessaoValida() ||
                versaoConsulta.current !== numeroConsulta
            ) return;

            console.error(
                "Erro ao carregar Agenda Fiscal:",
                error
            );

            setObrigacoes([]);

            setPeriodoCarregado(chavePeriodo);

            setErro(
                error.message ||
                "Não foi possível carregar as obrigações fiscais."
            );

        } finally {

            if (
                sessaoValida() &&
                versaoConsulta.current === numeroConsulta
            ) {
                setCarregando(false);
            }
        }

    }, [
        aba,
        mes,
        ano,
        chavePeriodo,
        sessaoValida
    ]);

    useEffect(() => {

        carregarObrigacoes();

        return () => {
            versaoConsulta.current++;
        };

    }, [carregarObrigacoes]);

    // =========================================
    // CARREGAR TEMAS ATIVOS
    // =========================================

    const carregarTemas = useCallback(async () => {

        if (!podeGerenciar) return;

        const numeroConsulta = ++versaoTemas.current;

        try {

            setCarregandoTemas(true);
            setErroTemas("");

            const dados = await requisicaoApi(
                "/api/Temas"
            );

            if (
                !sessaoValida() ||
                versaoTemas.current !== numeroConsulta
            ) return;

            if (!Array.isArray(dados)) {
                throw new Error(
                    "Resposta inválida ao consultar temas."
                );
            }

            setTemas(
                dados.map(item => ({
                    temaId:
                        item.temaId ??
                        item.TemaId,

                    nome:
                        item.nome ??
                        item.Nome,

                    ativo:
                        item.ativo ??
                        item.Ativo ??
                        true
                }))
                .filter(item =>
                    item.ativo &&
                    item.temaId &&
                    item.nome
                )
            );

        } catch (error) {

            if (
                !sessaoValida() ||
                versaoTemas.current !== numeroConsulta
            ) return;

            setTemas([]);

            setErroTemas(
                error.message ||
                "Não foi possível carregar os temas."
            );

        } finally {

            if (
                sessaoValida() &&
                versaoTemas.current === numeroConsulta
            ) {
                setCarregandoTemas(false);
            }
        }

    }, [podeGerenciar, sessaoValida]);

    useEffect(() => {

        carregarTemas();

        return () => {
            versaoTemas.current++;
        };

    }, [carregarTemas]);

    // =========================================
    // ACESSIBILIDADE DOS MODAIS
    // =========================================

    const dialogoAberto =
        modalAberto || Boolean(detalhe);

    useEffect(() => {

        if (!dialogoAberto) return;

        focoAnterior.current = document.activeElement;

        const dialogo = modalRef.current;

        dialogo?.focus();

        function tratarTeclado(event) {

            if (event.key === "Escape") {

                if (operacaoAtual.current) return;

                setModalAberto(false);
                setDetalhe(null);

                return;
            }

            if (event.key !== "Tab" || !dialogo) return;

            const elementos = Array.from(
                dialogo.querySelectorAll(
                    'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]'
                )
            );

            if (!elementos.length) {
                event.preventDefault();
                return;
            }

            const primeiro = elementos[0];

            const ultimo =
                elementos[elementos.length - 1];

            if (
                event.shiftKey &&
                (
                    document.activeElement === primeiro ||
                    document.activeElement === dialogo
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

            focoAnterior.current?.focus();
        };

    }, [dialogoAberto]);

    // =========================================
    // NAVEGAÇÃO DO CALENDÁRIO
    // =========================================

    function alterarMes(direcao) {

        if (ocupado) return;

        const novaData = new Date(
            ano,
            mes + direcao,
            1
        );

        const novoAno = novaData.getFullYear();

        if (novoAno < 1900 || novoAno > 9998) {
            return;
        }

        setAno(novoAno);
        setMes(novaData.getMonth());
        setDiaSelecionado(null);
        setTemaFiltro("");
        setMensagem("");
    }

    function voltarHoje() {

        if (ocupado) return;

        const dataAtual = obterHoje();

        setHoje(dataAtual);

        setAno(
            Number(dataAtual.slice(0, 4))
        );

        setMes(
            Number(dataAtual.slice(5, 7)) - 1
        );

        setDiaSelecionado(null);
        setTemaFiltro("");
        setMensagem("");
    }

    function trocarAba(novaAba) {

        if (ocupado || novaAba === aba) return;

        setAba(novaAba);
        setDiaSelecionado(null);
        setPesquisa("");
        setTemaFiltro("");
        setSituacaoFiltro("");
        setMensagem("");
        setErro("");
    }

    // =========================================
    // ABRIR FORMULÁRIO DE CADASTRO
    // =========================================

    function abrirCadastro() {

        if (!podeGerenciar || ocupado) return;

        const dataInicial = diaSelecionado
            ? montarData(
                ano,
                mes,
                diaSelecionado
            )
            : hoje;

        setIdEditando(null);

        setFormulario(
            formularioInicial(dataInicial)
        );

        setErroFormulario("");
        setDetalhe(null);
        setModalAberto(true);
    }

    // =========================================
    // ABRIR FORMULÁRIO DE EDIÇÃO
    // =========================================

    function abrirEdicao(obrigacao) {

        if (!podeGerenciar || ocupado) return;

        setIdEditando(
            obrigacao.obrigacaoFiscalId
        );

        setFormulario({
            titulo: obrigacao.titulo,
            descricao: obrigacao.descricao,
            temaId: obrigacao.temaId,
            dataVencimento:
                obrigacao.dataVencimento,

            competencia: obrigacao.competencia
                ? String(
                    obrigacao.competencia
                ).slice(0, 7)
                : ""
        });

        setErroFormulario("");
        setDetalhe(null);
        setModalAberto(true);
    }

    function fecharModal() {

        if (operacaoAtual.current) return;

        setModalAberto(false);
        setErroFormulario("");
    }

    function atualizarCampo(campo, valor) {

        setFormulario(anterior => ({
            ...anterior,
            [campo]: valor
        }));
    }

    // =========================================
    // CADASTRAR OU EDITAR OBRIGAÇÃO
    // =========================================

    async function salvarObrigacao(event) {

        event.preventDefault();

        if (
            !podeGerenciar ||
            operacaoAtual.current ||
            !sessaoValida()
        ) return;

        const titulo = formulario.titulo.trim();

        const descricao =
            formulario.descricao.trim();

        if (!titulo || !descricao) {

            setErroFormulario(
                "Preencha o título e a descrição."
            );

            return;
        }

        if (titulo.length > 150) {

            setErroFormulario(
                "O título deve ter até 150 caracteres."
            );

            return;
        }

        if (descricao.length > 5000) {

            setErroFormulario(
                "A descrição deve ter até 5000 caracteres."
            );

            return;
        }

        if (
            !formulario.temaId ||
            !temas.some(
                item =>
                    item.temaId ===
                    formulario.temaId
            )
        ) {

            setErroFormulario(
                "Selecione um tema tributário ativo."
            );

            return;
        }

        if (
            !formulario.dataVencimento ||
            !/^\d{4}-\d{2}-\d{2}$/.test(
                formulario.dataVencimento
            )
        ) {

            setErroFormulario(
                "Informe uma data de vencimento válida."
            );

            return;
        }

        const dados = {

            temaId: formulario.temaId,

            titulo,

            descricao,

            dataVencimento:
                formulario.dataVencimento,

            competencia:
                formulario.competencia
                    ? `${formulario.competencia}-01`
                    : null
        };

        const editando = Boolean(idEditando);

        const operacao = Symbol("salvar");

        operacaoAtual.current = operacao;

        try {

            setSalvando(true);
            setErroFormulario("");
            setMensagem("");

            const endpoint = editando
                ? `/api/AgendaFiscal/${encodeURIComponent(idEditando)}`
                : "/api/AgendaFiscal";

            await requisicaoApi(endpoint, {

                method: editando
                    ? "PUT"
                    : "POST",

                body: JSON.stringify(dados)
            });

            if (!sessaoValida()) return;

            setModalAberto(false);

            setMensagem(
                editando
                    ? "Obrigação fiscal atualizada com sucesso."
                    : "Obrigação fiscal cadastrada com sucesso."
            );

            // Exibir o mês da obrigação salva.

            const novoAno = Number(
                dados.dataVencimento.slice(0, 4)
            );

            const novoMes = Number(
                dados.dataVencimento.slice(5, 7)
            ) - 1;

            const novoDia = Number(
                dados.dataVencimento.slice(8, 10)
            );

            setPesquisa("");
            setTemaFiltro("");
            setSituacaoFiltro("");

            setDiaSelecionado(
                aba === "calendario"
                    ? novoDia
                    : null
            );

            if (
                novoAno !== ano ||
                novoMes !== mes
            ) {

                setAno(novoAno);
                setMes(novoMes);

            } else {

                await carregarObrigacoes();
            }

        } catch (error) {

            if (!sessaoValida()) return;

            setErroFormulario(
                error.message ||
                "Não foi possível salvar a obrigação."
            );

        } finally {

            if (operacaoAtual.current === operacao) {

                operacaoAtual.current = null;

                if (sessaoValida()) {
                    setSalvando(false);
                }
            }
        }
    }

    // =========================================
    // CANCELAR OU REATIVAR OBRIGAÇÃO
    // =========================================

    async function alterarStatus(obrigacao) {

        if (
            !podeGerenciar ||
            operacaoAtual.current ||
            !sessaoValida()
        ) return;

        const novoStatus = !obrigacao.ativo;

        const confirmar = window.confirm(
            novoStatus
                ? `Deseja reativar "${obrigacao.titulo}"?`
                : `Deseja cancelar "${obrigacao.titulo}"? Ela deixará de aparecer para os clientes.`
        );

        if (!confirmar) return;

        const operacao = Symbol("status");

        operacaoAtual.current = operacao;

        try {

            setAlterandoStatus(
                obrigacao.obrigacaoFiscalId
            );

            setMensagem("");

            await requisicaoApi(
                `/api/AgendaFiscal/${encodeURIComponent(
                    obrigacao.obrigacaoFiscalId
                )}/status`,
                {
                    method: "PATCH",

                    body: JSON.stringify({
                        ativo: novoStatus
                    })
                }
            );

            if (!sessaoValida()) return;

            setDetalhe(null);

            setMensagem(
                novoStatus
                    ? "Obrigação fiscal reativada com sucesso."
                    : "Obrigação fiscal cancelada com sucesso."
            );

            await carregarObrigacoes();

        } catch (error) {

            if (!sessaoValida()) return;

            alert(
                error.message ||
                "Não foi possível alterar a situação da obrigação."
            );

        } finally {

            if (operacaoAtual.current === operacao) {

                operacaoAtual.current = null;

                if (sessaoValida()) {
                    setAlterandoStatus(null);
                }
            }
        }
    }

    // =========================================
    // ATUALIZIZAR SITUAÇÕES DE VENCIMENTO
    // =========================================

    const obrigacoesAtuais = dadosDisponiveis
        ? obrigacoes.map(item => {

            const diasRestantes =
                calcularDiasRestantes(
                    item.dataVencimento,
                    hoje
                );

            return {
                ...item,

                diasRestantes,

                situacao: calcularSituacao(
                    item.ativo,
                    diasRestantes
                )
            };

        })
        : [];

    const temasDisponiveis = Array.from(
        new Map(
            obrigacoesAtuais.map(item => [
                item.temaId,
                {
                    temaId: item.temaId,
                    nome: item.tema
                }
            ])
        ).values()
    ).sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR")
    );

    // =========================================
    // FILTROS
    // =========================================

    const obrigacoesFiltradas =
        obrigacoesAtuais.filter(item => {

            const texto = normalizarTexto(
                [
                    item.titulo,
                    item.descricao,
                    item.tema
                ].join(" ")
            );

            return (
                (!temaFiltro ||
                    item.temaId === temaFiltro) &&

                (!situacaoFiltro ||
                    item.situacao === situacaoFiltro) &&

                texto.includes(
                    normalizarTexto(pesquisa.trim())
                )
            );
        });

    const obrigacoesExibidas =
        obrigacoesFiltradas.filter(item => {

            if (
                aba === "gerenciar" ||
                diaSelecionado === null
            ) {
                return true;
            }

            return item.dataVencimento === montarData(
                ano,
                mes,
                diaSelecionado
            );
        });

    // =========================================
    // INDICADORES MENSAIS
    // =========================================

    const ativas = obrigacoesAtuais.filter(
        item => item.ativo
    );

    const proximosPrazos = ativas.filter(
        item =>
            item.diasRestantes >= 0 &&
            item.diasRestantes <= 7
    ).length;

    const prazosDecorridos = ativas.filter(
        item => item.diasRestantes < 0
    ).length;

    const canceladas = obrigacoesAtuais.filter(
        item => !item.ativo
    ).length;

    // =========================================
    // MONTAR CALENDÁRIO
    // =========================================

    const primeiroDia = new Date(
        ano,
        mes,
        1
    ).getDay();

    const quantidadeDias = new Date(
        ano,
        mes + 1,
        0
    ).getDate();

    const totalCelulas =
        Math.ceil(
            (primeiroDia + quantidadeDias) / 7
        ) * 7;

    const diasCalendario = Array.from(
        { length: totalCelulas },
        (_, index) => {

            const dia = index - primeiroDia + 1;

            return dia >= 1 &&
                dia <= quantidadeDias
                ? dia
                : null;
        }
    );

    function obterObrigacoesDia(dia) {

        const data = montarData(ano, mes, dia);

        return obrigacoesFiltradas.filter(
            item => item.dataVencimento === data
        );
    }

    // =========================================
    // RENDERIZAR ETIQUETA DE SITUAÇÃO
    // =========================================

    function etiquetaSituacao(obrigacao) {

        const info =
            SITUACOES[obrigacao.situacao] ||
            SITUACOES.A_VENCER;

        return (
            <span
                className={`af-etiqueta ${info.classe}`}
            >
                {info.nome}
            </span>
        );
    }

    // =========================================
    // RENDERIZAÇÃO
    // =========================================

    return (

        <div className="af-pagina">

            {/* CABEÇALHO */}

            <header className="af-cabecalho">

                <div className="af-titulo">

                    <div className="af-titulo-icone">
                        <CalendarDays size={29} />
                    </div>

                    <div>

                        <h1>Agenda Fiscal</h1>

                        <p>
                            Acompanhe os prazos das
                            obrigações tributárias.
                        </p>

                    </div>

                </div>

                <div className="af-acoes-cabecalho">

                    <button
                        type="button"
                        className="af-botao-secundario"
                        onClick={carregarObrigacoes}
                        disabled={carregando || ocupado}
                    >

                        <RefreshCw
                            size={17}
                            className={
                                carregando
                                    ? "af-girando"
                                    : ""
                            }
                        />

                        Atualizar

                    </button>

                    {podeGerenciar && (

                        <button
                            type="button"
                            className="af-botao-principal"
                            onClick={abrirCadastro}
                            disabled={ocupado}
                        >

                            <Plus size={19} />

                            Nova obrigação

                        </button>

                    )}

                </div>

            </header>

            {/* INDICADORES */}

            <div className="af-indicadores">

                <article className="af-indicador">

                    <div className="af-indicador-icone af-icone-azul">
                        <CalendarCheck size={26} />
                    </div>

                    <div>

                        <span>Obrigações no mês</span>

                        <strong>
                            {dadosDisponiveis && !erro
                                ? ativas.length
                                : "—"}
                        </strong>

                        <small>Obrigações ativas</small>

                    </div>

                </article>

                <article className="af-indicador">

                    <div className="af-indicador-icone af-icone-laranja">
                        <CalendarClock size={26} />
                    </div>

                    <div>

                        <span>Próximos prazos</span>

                        <strong>
                            {dadosDisponiveis && !erro
                                ? proximosPrazos
                                : "—"}
                        </strong>

                        <small>Hoje e próximos 7 dias</small>

                    </div>

                </article>

                <article className="af-indicador">

                    <div className="af-indicador-icone af-icone-vermelho">
                        <CalendarX size={26} />
                    </div>

                    <div>

                        <span>Prazos decorridos</span>

                        <strong>
                            {dadosDisponiveis && !erro
                                ? prazosDecorridos
                                : "—"}
                        </strong>

                        <small>Datas já ultrapassadas</small>

                    </div>

                </article>

                {aba === "gerenciar" &&
                    podeGerenciar && (

                        <article className="af-indicador">

                            <div className="af-indicador-icone af-icone-cinza">
                                <Ban size={26} />
                            </div>

                            <div>

                                <span>Canceladas</span>

                                <strong>
                                    {dadosDisponiveis && !erro
                                        ? canceladas
                                        : "—"}
                                </strong>

                                <small>Obrigações inativas</small>

                            </div>

                        </article>

                    )}

            </div>

            {/* PAINEL PRINCIPAL */}

            <section className="af-painel">

                <div className="af-abas">

                    {podeConsultar && (

                        <button
                            type="button"
                            className={
                                aba === "calendario"
                                    ? "af-aba af-aba-ativa"
                                    : "af-aba"
                            }
                            aria-pressed={
                                aba === "calendario"
                            }
                            disabled={ocupado}
                            onClick={() =>
                                trocarAba("calendario")
                            }
                        >

                            <CalendarDays size={19} />

                            Calendário fiscal

                        </button>

                    )}

                    {podeGerenciar && (

                        <button
                            type="button"
                            className={
                                aba === "gerenciar"
                                    ? "af-aba af-aba-ativa"
                                    : "af-aba"
                            }
                            aria-pressed={
                                aba === "gerenciar"
                            }
                            disabled={ocupado}
                            onClick={() =>
                                trocarAba("gerenciar")
                            }
                        >

                            <Settings size={19} />

                            Gerenciar obrigações

                        </button>

                    )}

                </div>

                <div className="af-painel-conteudo">

                    {/* MENSAGENS */}

                    {mensagem && (

                        <div
                            className="af-mensagem"
                            role="status"
                        >

                            <Check size={18} />

                            {mensagem}

                            <button
                                type="button"
                                aria-label="Fechar mensagem"
                                onClick={() =>
                                    setMensagem("")
                                }
                            >
                                <X size={17} />
                            </button>

                        </div>

                    )}

                    {/* FILTROS */}

                    <div className="af-filtros">

                        <label className="af-campo">

                            <span>Pesquisar obrigação</span>

                            <div className="af-pesquisa">

                                <Search size={18} />

                                <input
                                    type="search"
                                    placeholder="Título, descrição ou tema"
                                    value={pesquisa}
                                    onChange={event =>
                                        setPesquisa(
                                            event.target.value
                                        )
                                    }
                                />

                            </div>

                        </label>

                        <label className="af-campo">

                            <span>Tema</span>

                            <select
                                value={temaFiltro}
                                onChange={event =>
                                    setTemaFiltro(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="">
                                    Todos os temas
                                </option>

                                {temasDisponiveis.map(item => (

                                    <option
                                        key={item.temaId}
                                        value={item.temaId}
                                    >
                                        {item.nome}
                                    </option>

                                ))}

                            </select>

                        </label>

                        <label className="af-campo">

                            <span>Situação</span>

                            <select
                                value={situacaoFiltro}
                                onChange={event =>
                                    setSituacaoFiltro(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="">
                                    Todas as situações
                                </option>

                                {Object.entries(SITUACOES)
                                    .filter(([codigo]) =>
                                        aba === "gerenciar" ||
                                        codigo !== "CANCELADA"
                                    )
                                    .map(([codigo, info]) => (

                                        <option
                                            key={codigo}
                                            value={codigo}
                                        >
                                            {info.nome}
                                        </option>

                                    ))}

                            </select>

                        </label>

                    </div>

                    {/* NAVEGAÇÃO ENTRE MESES */}

                    <div className="af-navegacao">

                        <div className="af-navegacao-periodo">

                            <button
                                type="button"
                                className="af-botao-icone"
                                aria-label="Mês anterior"
                                disabled={
                                    ocupado ||
                                    (ano === 1900 && mes === 0)
                                }
                                onClick={() => alterarMes(-1)}
                            >

                                <ChevronLeft size={22} />

                            </button>

                            <h2>
                                {MESES[mes]} de {ano}
                            </h2>

                            <button
                                type="button"
                                className="af-botao-icone"
                                aria-label="Próximo mês"
                                disabled={
                                    ocupado ||
                                    (ano === 9998 && mes === 11)
                                }
                                onClick={() => alterarMes(1)}
                            >

                                <ChevronRight size={22} />

                            </button>

                        </div>

                        <div className="af-navegacao-acoes">

                            <input
                                type="month"
                                aria-label="Selecionar mês e ano"
                                min="1900-01"
                                max="9998-12"
                                value={`${ano}-${String(
                                    mes + 1
                                ).padStart(2, "0")}`}
                                disabled={ocupado}
                                onChange={event => {

                                    const valor =
                                        event.target.value;

                                    if (!valor) return;

                                    const [novoAno, novoMes] =
                                        valor.split("-")
                                            .map(Number);

                                    if (
                                        novoAno < 1900 ||
                                        novoAno > 9998 ||
                                        novoMes < 1 ||
                                        novoMes > 12
                                    ) return;

                                    setAno(novoAno);
                                    setMes(novoMes - 1);
                                    setDiaSelecionado(null);
                                    setTemaFiltro("");
                                    setMensagem("");
                                }}
                            />

                            <button
                                type="button"
                                className="af-botao-secundario"
                                onClick={voltarHoje}
                                disabled={ocupado}
                            >
                                Hoje
                            </button>

                        </div>

                    </div>

                    {/* CARREGAMENTO E ERRO */}

                    {!dadosDisponiveis ? (

                        <div
                            className="af-carregando"
                            role="status"
                        >

                            <RefreshCw
                                size={25}
                                className="af-girando"
                            />

                            Carregando agenda fiscal...

                        </div>

                    ) : erro ? (

                        <div className="af-vazio" role="alert">

                            <AlertCircle size={40} />

                            <h2>
                                Não foi possível carregar a agenda
                            </h2>

                            <p>{erro}</p>

                            <button
                                type="button"
                                className="af-botao-principal"
                                onClick={carregarObrigacoes}
                            >
                                Tentar novamente
                            </button>

                        </div>

                    ) : (

                        <>

                            {/* CALENDÁRIO */}

                            {aba === "calendario" && (

                                <div className="af-calendario">

                                    <div className="af-calendario-semana">

                                        {DIAS_SEMANA.map(dia => (

                                            <span key={dia}>
                                                {dia}
                                            </span>

                                        ))}

                                    </div>

                                    <div className="af-calendario-grid">

                                        {diasCalendario.map((dia, index) => {

                                            if (dia === null) {

                                                return (
                                                    <div
                                                        key={`vazio-${index}`}
                                                        className="af-dia-vazio"
                                                    />
                                                );
                                            }

                                            const data =
                                                montarData(
                                                    ano,
                                                    mes,
                                                    dia
                                                );

                                            const eventos =
                                                obterObrigacoesDia(dia);

                                            const ehHoje =
                                                data === hoje;

                                            const selecionado =
                                                dia === diaSelecionado;

                                            return (

                                                <button
                                                    key={data}
                                                    type="button"
                                                    className={[
                                                        "af-dia",

                                                        ehHoje
                                                            ? "af-dia-hoje"
                                                            : "",

                                                        selecionado
                                                            ? "af-dia-selecionado"
                                                            : "",

                                                        eventos.length
                                                            ? "af-dia-com-evento"
                                                            : ""
                                                    ].join(" ")}
                                                    aria-pressed={
                                                        selecionado
                                                    }
                                                    aria-current={
                                                        ehHoje
                                                            ? "date"
                                                            : undefined
                                                    }
                                                    aria-label={
                                                        `${formatarData(data)}, ${eventos.length} obrigações`
                                                    }
                                                    onClick={() =>
                                                        setDiaSelecionado(
                                                            selecionado
                                                                ? null
                                                                : dia
                                                        )
                                                    }
                                                >

                                                    <span className="af-dia-numero">
                                                        {dia}
                                                    </span>

                                                    <div className="af-dia-eventos">

                                                        {eventos
                                                            .slice(0, 2)
                                                            .map(item => (

                                                                <span
                                                                    key={
                                                                        item.obrigacaoFiscalId
                                                                    }
                                                                    className={`af-evento ${
                                                                        SITUACOES[
                                                                            item.situacao
                                                                        ].classe
                                                                    }`}
                                                                    title={
                                                                        item.titulo
                                                                    }
                                                                >

                                                                    <span className="af-evento-ponto" />

                                                                    <span className="af-evento-texto">
                                                                        {item.titulo}
                                                                    </span>

                                                                </span>

                                                            ))}

                                                        {eventos.length > 2 && (

                                                            <small>
                                                                +{eventos.length - 2}
                                                            </small>

                                                        )}

                                                    </div>

                                                </button>

                                            );
                                        })}

                                    </div>

                                    {/* LEGENDA */}

                                    <div className="af-legenda">

                                        {Object.entries(SITUACOES)
                                            .filter(([codigo]) =>
                                                codigo !== "CANCELADA"
                                            )
                                            .map(([codigo, info]) => (

                                                <span key={codigo}>

                                                    <i className={info.classe} />

                                                    {info.nome}

                                                </span>

                                            ))}

                                    </div>

                                </div>

                            )}

                            {/* LISTAGEM */}

                            <div className="af-listagem-topo">

                                <div>

                                    <h2>

                                        {aba === "calendario" &&
                                            diaSelecionado !== null
                                            ? `Obrigações de ${formatarData(
                                                montarData(
                                                    ano,
                                                    mes,
                                                    diaSelecionado
                                                )
                                            )}`
                                            : "Obrigações do mês"}

                                    </h2>

                                    <p>

                                        {obrigacoesExibidas.length}
                                        {" "}
                                        {obrigacoesExibidas.length === 1
                                            ? "obrigação encontrada"
                                            : "obrigações encontradas"}

                                    </p>

                                </div>

                                {diaSelecionado !== null &&
                                    aba === "calendario" && (

                                        <button
                                            type="button"
                                            className="af-botao-secundario"
                                            onClick={() =>
                                                setDiaSelecionado(null)
                                            }
                                        >

                                            <List size={17} />

                                            Ver todo o mês

                                        </button>

                                    )}

                            </div>

                            {/* LISTA VAZIA */}

                            {obrigacoesExibidas.length === 0 ? (

                                <div className="af-vazio">

                                    <CalendarDays size={45} />

                                    <h2>
                                        Nenhuma obrigação encontrada
                                    </h2>

                                    <p>
                                        Não existem obrigações
                                        cadastradas para o período
                                        ou os filtros selecionados.
                                    </p>

                                    {podeGerenciar && (

                                        <button
                                            type="button"
                                            className="af-botao-principal"
                                            onClick={abrirCadastro}
                                            disabled={ocupado}
                                        >

                                            <Plus size={18} />

                                            Cadastrar obrigação

                                        </button>

                                    )}

                                </div>

                            ) : (

                                <div className="af-listagem">

                                    {obrigacoesExibidas.map(item => (

                                        <article
                                            key={item.obrigacaoFiscalId}
                                            className={`af-obrigacao ${
                                                !item.ativo
                                                    ? "af-obrigacao-cancelada"
                                                    : ""
                                            }`}
                                        >

                                            <div className="af-obrigacao-data">

                                                <strong>
                                                    {item.dataVencimento.slice(8, 10)}
                                                </strong>

                                                <span>

                                                    {MESES[
                                                        Number(
                                                            item.dataVencimento.slice(5, 7)
                                                        ) - 1
                                                    ].slice(0, 3).toUpperCase()}

                                                </span>

                                            </div>

                                            <div className="af-obrigacao-info">

                                                <div className="af-obrigacao-etiquetas">

                                                    <span
                                                        className={`af-tema ${classeCorTema(
                                                            item.tema
                                                        )}`}
                                                    >
                                                        {item.tema}
                                                    </span>

                                                    {etiquetaSituacao(item)}

                                                </div>

                                                <h3>
                                                    {item.titulo}
                                                </h3>

                                                <p>
                                                    {item.descricao}
                                                </p>

                                                <div className="af-obrigacao-meta">

                                                    <span>

                                                        <Clock size={15} />

                                                        {descricaoPrazo(item)}

                                                    </span>

                                                    {item.competencia && (

                                                        <span>

                                                            Competência:
                                                            {" "}

                                                            {formatarCompetencia(
                                                                item.competencia
                                                            )}

                                                        </span>

                                                    )}

                                                </div>

                                            </div>

                                            <div className="af-obrigacao-acoes">

                                                <button
                                                    type="button"
                                                    className="af-botao-icone"
                                                    title="Visualizar obrigação"
                                                    aria-label="Visualizar obrigação"
                                                    onClick={() =>
                                                        setDetalhe(item)
                                                    }
                                                >

                                                    <Info size={20} />

                                                </button>

                                                {aba === "gerenciar" &&
                                                    podeGerenciar && (

                                                        <>

                                                            <button
                                                                type="button"
                                                                className="af-botao-icone"
                                                                title="Editar obrigação"
                                                                aria-label="Editar obrigação"
                                                                disabled={ocupado}
                                                                onClick={() =>
                                                                    abrirEdicao(item)
                                                                }
                                                            >

                                                                <Pencil size={18} />

                                                            </button>

                                                            <button
                                                                type="button"
                                                                className={`af-botao-icone ${
                                                                    item.ativo
                                                                        ? "af-botao-perigo"
                                                                        : "af-botao-reativar"
                                                                }`}
                                                                title={
                                                                    item.ativo
                                                                        ? "Cancelar obrigação"
                                                                        : "Reativar obrigação"
                                                                }
                                                                aria-label={
                                                                    item.ativo
                                                                        ? "Cancelar obrigação"
                                                                        : "Reativar obrigação"
                                                                }
                                                                disabled={ocupado}
                                                                onClick={() =>
                                                                    alterarStatus(item)
                                                                }
                                                            >

                                                                {alterandoStatus ===
                                                                    item.obrigacaoFiscalId ? (

                                                                    <RefreshCw
                                                                        size={18}
                                                                        className="af-girando"
                                                                    />

                                                                ) : item.ativo ? (

                                                                    <Ban size={18} />

                                                                ) : (

                                                                    <Check size={19} />

                                                                )}

                                                            </button>

                                                        </>

                                                    )}

                                            </div>

                                        </article>

                                    ))}

                                </div>

                            )}

                        </>

                    )}

                </div>

            </section>

            {/* AVISO SOBRE OS PRAZOS */}

            <div className="af-aviso">

                <Info size={19} />

                <p>
                    Os prazos apresentados são cadastrados
                    pela equipe fiscal responsável.
                    A indicação de prazo decorrido não
                    significa que uma obrigação deixou de
                    ser entregue pelo cliente.
                </p>

            </div>

            {/* MODAL DE CADASTRO E EDIÇÃO */}

            {modalAberto && podeGerenciar && (

                <div
                    className="af-modal-fundo"
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
                        className="af-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="af-formulario-titulo"
                        tabIndex={-1}
                        ref={modalRef}
                    >

                        <div className="af-modal-cabecalho">

                            <div>

                                <h2 id="af-formulario-titulo">

                                    {idEditando
                                        ? "Editar obrigação fiscal"
                                        : "Nova obrigação fiscal"}

                                </h2>

                                <p>
                                    Preencha os dados fornecidos
                                    pela equipe fiscal.
                                </p>

                            </div>

                            <button
                                type="button"
                                className="af-modal-fechar"
                                onClick={fecharModal}
                                disabled={salvando}
                                aria-label="Fechar formulário"
                            >

                                <X size={23} />

                            </button>

                        </div>

                        <form
                            className="af-formulario"
                            onSubmit={salvarObrigacao}
                        >

                            {erroFormulario && (

                                <div
                                    className="af-erro"
                                    role="alert"
                                >
                                    {erroFormulario}
                                </div>

                            )}

                            <label className="af-campo">

                                <span>
                                    Título da obrigação *
                                </span>

                                <input
                                    type="text"
                                    required
                                    maxLength={150}
                                    placeholder="Informe o nome da obrigação"
                                    value={formulario.titulo}
                                    disabled={salvando}
                                    onChange={event =>
                                        atualizarCampo(
                                            "titulo",
                                            event.target.value
                                        )
                                    }
                                />

                                <small>
                                    {formulario.titulo.length}/150
                                </small>

                            </label>

                            <label className="af-campo">

                                <span>Tema tributário *</span>

                                <select
                                    required
                                    value={formulario.temaId}
                                    disabled={
                                        salvando ||
                                        carregandoTemas
                                    }
                                    onChange={event =>
                                        atualizarCampo(
                                            "temaId",
                                            event.target.value
                                        )
                                    }
                                >

                                    <option value="">

                                        {carregandoTemas
                                            ? "Carregando temas..."
                                            : "Selecione um tema"}

                                    </option>

                                    {formulario.temaId &&
                                        !temas.some(
                                            item =>
                                                item.temaId ===
                                                formulario.temaId
                                        ) && (

                                            <option
                                                value={formulario.temaId}
                                                disabled
                                            >
                                                Tema atual indisponível
                                            </option>

                                        )}

                                    {temas.map(item => (

                                        <option
                                            key={item.temaId}
                                            value={item.temaId}
                                        >
                                            {item.nome}
                                        </option>

                                    ))}

                                </select>

                            </label>

                            {erroTemas && (

                                <div className="af-erro">

                                    <p>{erroTemas}</p>

                                    <button
                                        type="button"
                                        className="af-botao-secundario"
                                        disabled={carregandoTemas}
                                        onClick={carregarTemas}
                                    >
                                        Recarregar temas
                                    </button>

                                </div>

                            )}

                            <div className="af-formulario-grid">

                                <label className="af-campo">

                                    <span>Data de vencimento *</span>

                                    <input
                                        type="date"
                                        required
                                        min="1900-01-01"
                                        max="9998-12-31"
                                        disabled={salvando}
                                        value={
                                            formulario.dataVencimento
                                        }
                                        onChange={event =>
                                            atualizarCampo(
                                                "dataVencimento",
                                                event.target.value
                                            )
                                        }
                                    />

                                </label>

                                <label className="af-campo">

                                    <span>Competência</span>

                                    <input
                                        type="month"
                                        min="1900-01"
                                        max="9998-12"
                                        disabled={salvando}
                                        value={
                                            formulario.competencia
                                        }
                                        onChange={event =>
                                            atualizarCampo(
                                                "competencia",
                                                event.target.value
                                            )
                                        }
                                    />

                                </label>

                            </div>

                            <label className="af-campo">

                                <span>Descrição e orientações *</span>

                                <textarea
                                    required
                                    rows={6}
                                    maxLength={5000}
                                    placeholder="Descreva a obrigação fiscal e suas orientações..."
                                    value={
                                        formulario.descricao
                                    }
                                    disabled={salvando}
                                    onChange={event =>
                                        atualizarCampo(
                                            "descricao",
                                            event.target.value
                                        )
                                    }
                                />

                                <small>
                                    {formulario.descricao.length}/5000
                                </small>

                            </label>

                            <p className="af-campos-obrigatorios">
                                * Campos obrigatórios
                            </p>

                            <div className="af-modal-acoes">

                                <button
                                    type="button"
                                    className="af-botao-secundario"
                                    onClick={fecharModal}
                                    disabled={salvando}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="af-botao-principal"
                                    disabled={
                                        salvando ||
                                        carregandoTemas ||
                                        Boolean(erroTemas) ||
                                        temas.length === 0
                                    }
                                >

                                    {salvando ? (

                                        <RefreshCw
                                            size={18}
                                            className="af-girando"
                                        />

                                    ) : (

                                        <Check size={18} />

                                    )}

                                    {salvando
                                        ? "Salvando..."
                                        : idEditando
                                            ? "Salvar alterações"
                                            : "Cadastrar obrigação"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

            {/* MODAL DE DETALHES */}

            {detalhe && !modalAberto && (

                <div
                    className="af-modal-fundo"
                    onClick={event => {

                        if (
                            event.target ===
                            event.currentTarget &&
                            !ocupado
                        ) {
                            setDetalhe(null);
                        }
                    }}
                >

                    <div
                        className="af-modal af-modal-detalhe"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="af-detalhe-titulo"
                        tabIndex={-1}
                        ref={modalRef}
                    >

                        <div className="af-modal-cabecalho">

                            <div>

                                <h2 id="af-detalhe-titulo">
                                    Detalhes da obrigação
                                </h2>

                                <p>
                                    Informações do prazo fiscal
                                </p>

                            </div>

                            <button
                                type="button"
                                className="af-modal-fechar"
                                aria-label="Fechar detalhes"
                                onClick={() => setDetalhe(null)}
                            >

                                <X size={23} />

                            </button>

                        </div>

                        <div className="af-detalhe-conteudo">

                            <div className="af-obrigacao-etiquetas">

                                <span
                                    className={`af-tema ${classeCorTema(
                                        detalhe.tema
                                    )}`}
                                >
                                    {detalhe.tema}
                                </span>

                                {etiquetaSituacao(detalhe)}

                            </div>

                            <h3>
                                {detalhe.titulo}
                            </h3>

                            <div className="af-detalhe-grid">

                                <div>

                                    <span>Vencimento</span>

                                    <strong>
                                        {formatarData(
                                            detalhe.dataVencimento
                                        )}
                                    </strong>

                                </div>

                                <div>

                                    <span>Competência</span>

                                    <strong>
                                        {formatarCompetencia(
                                            detalhe.competencia
                                        )}
                                    </strong>

                                </div>

                                <div>

                                    <span>Prazo</span>

                                    <strong>
                                        {descricaoPrazo(detalhe)}
                                    </strong>

                                </div>

                                <div>

                                    <span>Cadastrado por</span>

                                    <strong>
                                        {detalhe.autor}
                                    </strong>

                                </div>

                            </div>

                            <h4>Descrição e orientações</h4>

                            <p className="af-detalhe-descricao">
                                {detalhe.descricao}
                            </p>

                            <div className="af-modal-acoes">

                                <button
                                    type="button"
                                    className="af-botao-secundario"
                                    onClick={() => setDetalhe(null)}
                                >
                                    Fechar
                                </button>

                                {podeGerenciar && (

                                    <button
                                        type="button"
                                        className="af-botao-principal"
                                        disabled={ocupado}
                                        onClick={() =>
                                            abrirEdicao(detalhe)
                                        }
                                    >

                                        <Pencil size={18} />

                                        Editar obrigação

                                    </button>

                                )}

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );
}