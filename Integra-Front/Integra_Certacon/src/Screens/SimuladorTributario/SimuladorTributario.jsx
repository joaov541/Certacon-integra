import {
    useState,
    useEffect,
    useCallback,
    useRef
} from "react";

import { Link } from "react-router-dom";

import {
    Calculator,
    Settings,
    Plus,
    Pencil,
    Power,
    Check,
    X,
    Search,
    RefreshCw,
    AlertCircle,
    Info,
    Landmark,
    Building2,
    Wallet,
    ChartPie,
    RotateCcw,
    FileText
} from "lucide-react";

import { requisicaoApi } from "../../services/api";
import usePermissoes from "../../hooks/usePermissoes";

import "./SimuladorTributario.css";
import CalculadoraReceita from "./CalculadoraReceita";

// =========================================
// CONSTANTES
// =========================================

const API = "/api/SimuladorTributario";

const FORMULARIO_INICIAL = {
    nome: "",
    descricao: "",
    anoReferencia: "2026",
    aliquotaIBSEstadual: "",
    aliquotaIBSMunicipal: "",
    aliquotaCBS: ""
};

// =========================================
// FUNÇÕES AUXILIARES
// =========================================

function formatarMoeda(valor) {
    return Number(valor ?? 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarPercentual(valor) {
    return Number(valor ?? 0).toLocaleString("pt-BR", {
        maximumFractionDigits: 6
    }) + "%";
}

function normalizarTexto(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function normalizarCenario(item) {
    return {
        cenarioTributarioId:
            item.cenarioTributarioId ??
            item.CenarioTributarioId,

        nome:
            item.nome ??
            item.Nome ??
            "",

        descricao:
            item.descricao ??
            item.Descricao ??
            "",

        anoReferencia: Number(
            item.anoReferencia ??
            item.AnoReferencia
        ),

        aliquotaIBSEstadual: Number(
            item.aliquotaIBSEstadual ??
            item.AliquotaIBSEstadual ??
            0
        ),

        aliquotaIBSMunicipal: Number(
            item.aliquotaIBSMunicipal ??
            item.AliquotaIBSMunicipal ??
            0
        ),

        aliquotaCBS: Number(
            item.aliquotaCBS ??
            item.AliquotaCBS ??
            0
        ),

        ativo:
            item.ativo ??
            item.Ativo ??
            false,

        autor:
            item.autor ??
            item.Autor ??
            "",

        dataCriacao:
            item.dataCriacao ??
            item.DataCriacao,

        dataAtualizacao:
            item.dataAtualizacao ??
            item.DataAtualizacao
    };
}

function normalizarResultado(item) {

    const camposNumericos = [
        "baseCalculo",
        "aliquotaIBSEstadual",
        "aliquotaIBSMunicipal",
        "aliquotaIBSTotal",
        "aliquotaCBS",
        "aliquotaTotal",
        "valorIBSEstadual",
        "valorIBSMunicipal",
        "valorIBSTotal",
        "valorCBS",
        "totalTributos",
        "valorTotalComTributos",
        "cargaTributariaEfetiva"
    ];

    const resultado = {
        cenarioTributarioId:
            item.cenarioTributarioId ??
            item.CenarioTributarioId,

        nomeCenario:
            item.nomeCenario ??
            item.NomeCenario,

        anoReferencia:
            item.anoReferencia ??
            item.AnoReferencia,

        aviso:
            item.aviso ??
            item.Aviso,

        dataSimulacao:
            item.dataSimulacao ??
            item.DataSimulacao
    };

    camposNumericos.forEach(campo => {

        const pascal =
            campo.charAt(0).toUpperCase() +
            campo.slice(1);

        const valor = item[campo] ?? item[pascal];

        if (
            valor === undefined ||
            valor === null ||
            !Number.isFinite(Number(valor))
        ) {
            throw new Error(
                "A API retornou um resultado inválido."
            );
        }

        resultado[campo] = Number(valor);
    });

    return resultado;
}

// =========================================
// CONTROLE DE PERMISSÕES
// =========================================

export default function SimuladorTributario() {

    const {
        autenticado,
        temPermissao,
        carregando,
        erro
    } = usePermissoes();

    const token = localStorage.getItem("token");

    const podeCalcular =
        autenticado &&
        temPermissao("simulador.calcular");

    const podeGerenciar =
        autenticado &&
        temPermissao("simulador.gerenciar");

    if (carregando) {
        return (
            <div className="st-pagina">
                <div className="st-carregando">
                    Verificando permissões...
                </div>
            </div>
        );
    }

    if (
        erro ||
        !autenticado ||
        (!podeCalcular && !podeGerenciar)
    ) {
        return (
            <div className="st-pagina">

                <div className="st-vazio">

                    <AlertCircle size={44} />

                    <h2>Acesso indisponível</h2>

                    <p>
                        {erro
                            ? "Não foi possível verificar suas permissões."
                            : "Você não possui permissão para acessar o simulador tributário."}
                    </p>

                    <Link
                        to="/home"
                        className="st-botao-principal"
                    >
                        Voltar ao início
                    </Link>

                </div>

            </div>
        );
    }

    return (
        <SimuladorConteudo
            key={`${token}:${podeCalcular}:${podeGerenciar}`}
            token={token}
            podeCalcular={podeCalcular}
            podeGerenciar={podeGerenciar}
        />
    );
}

// =========================================
// COMPONENTE PRINCIPAL
// =========================================

function SimuladorConteudo({
    token,
    podeCalcular,
    podeGerenciar
}) {

    const [aba, setAba] = useState(
        podeCalcular ? "simulador" : "gerenciar"
    );

    const [cenarios, setCenarios] = useState([]);
    const [cenariosGerenciamento, setCenariosGerenciamento] =
        useState([]);

    const [cenarioId, setCenarioId] = useState("");
    const [baseCalculo, setBaseCalculo] = useState("");

    const [resultado, setResultado] = useState(null);

    const [carregando, setCarregando] = useState(true);
    const [calculando, setCalculando] = useState(false);

    const [erro, setErro] = useState("");
    const [erroCalculo, setErroCalculo] = useState("");
    const [mensagem, setMensagem] = useState("");

    const [pesquisa, setPesquisa] = useState("");
    const [anoFiltro, setAnoFiltro] = useState("");
    const [statusFiltro, setStatusFiltro] = useState("");

    const [modalAberto, setModalAberto] = useState(false);
    const [idEditando, setIdEditando] = useState(null);

    const [formulario, setFormulario] = useState({
        ...FORMULARIO_INICIAL
    });

    const [erroFormulario, setErroFormulario] = useState("");
    const [salvando, setSalvando] = useState(false);

    const [alterandoStatus, setAlterandoStatus] = useState(null);

    const componenteAtivo = useRef(false);
    const versaoConsulta = useRef(0);
    const operacaoAtual = useRef(null);
    const modalRef = useRef(null);

    const ocupado =
        calculando ||
        salvando ||
        alterandoStatus !== null;

    // =========================================
    // CICLO DE VIDA
    // =========================================

    useEffect(() => {

        componenteAtivo.current = true;

        return () => {
            componenteAtivo.current = false;
            versaoConsulta.current++;
        };

    }, []);

    const sessaoValida = useCallback(() => {

        return (
            componenteAtivo.current &&
            localStorage.getItem("token") === token
        );

    }, [token]);

    // =========================================
    // CARREGAR CENÁRIOS
    // =========================================

    const carregarCenarios = useCallback(async () => {

        const numeroConsulta = ++versaoConsulta.current;

        try {

            setCarregando(true);
            setErro("");
            setResultado(null);

            const requisicoes = [];

            if (podeCalcular) {
                requisicoes.push({
                    tipo: "simulador",
                    promessa: requisicaoApi(
                        `${API}/cenarios`
                    )
                });
            }

            if (podeGerenciar) {
                requisicoes.push({
                    tipo: "gerenciar",
                    promessa: requisicaoApi(
                        `${API}/gerenciar`
                    )
                });
            }

            const respostas = await Promise.allSettled(
                requisicoes.map(item => item.promessa)
            );

            if (
                !sessaoValida() ||
                numeroConsulta !== versaoConsulta.current
            ) return;

            const erros = [];

            respostas.forEach((resposta, index) => {

                const tipo = requisicoes[index].tipo;

                if (
                    resposta.status === "rejected" ||
                    !Array.isArray(resposta.value)
                ) {

                    const mensagemErro =
                        resposta.reason?.message ||
                        "Não foi possível carregar os cenários.";

                    erros.push(mensagemErro);

                    if (tipo === "simulador") {
                        setCenarios([]);
                        setCenarioId("");
                    } else {
                        setCenariosGerenciamento([]);
                    }

                    return;
                }

                const lista = resposta.value
                    .map(normalizarCenario)
                    .filter(item =>
                        item.cenarioTributarioId
                    );

                if (tipo === "simulador") {

                    const ativos = lista.filter(
                        item => item.ativo
                    );

                    setCenarios(ativos);

                    setCenarioId(anterior =>
                        ativos.some(
                            item =>
                                item.cenarioTributarioId === anterior
                        )
                            ? anterior
                            : ativos[0]?.cenarioTributarioId || ""
                    );

                } else {

                    setCenariosGerenciamento(lista);
                }
            });

            if (erros.length) {
                setErro(erros.join(" "));
            }

        } catch (error) {

            if (
                !sessaoValida() ||
                numeroConsulta !== versaoConsulta.current
            ) return;

            setErro(
                error.message ||
                "Erro ao carregar cenários tributários."
            );

        } finally {

            if (
                sessaoValida() &&
                numeroConsulta === versaoConsulta.current
            ) {
                setCarregando(false);
            }
        }

    }, [
        podeCalcular,
        podeGerenciar,
        sessaoValida
    ]);

    useEffect(() => {
        carregarCenarios();

        return () => {
            versaoConsulta.current++;
        };
    }, [carregarCenarios]);

    // =========================================
    // ACESSIBILIDADE DO MODAL
    // =========================================

    useEffect(() => {

        if (!modalAberto) return;

        const focoAnterior = document.activeElement;
        const dialogo = modalRef.current;

        dialogo?.focus();

        function tratarTeclado(event) {

            if (event.key === "Escape") {

                if (!operacaoAtual.current) {
                    setModalAberto(false);
                }

                return;
            }

            if (event.key !== "Tab" || !dialogo) return;

            const elementos = Array.from(
                dialogo.querySelectorAll(
                    "button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)"
                )
            );

            if (!elementos.length) {
                event.preventDefault();
                return;
            }

            const primeiro = elementos[0];
            const ultimo = elementos[elementos.length - 1];

            if (
                event.shiftKey &&
                (
                    document.activeElement === primeiro ||
                    document.activeElement === dialogo
                )
            ) {
                event.preventDefault();
                ultimo.focus();
            }

            if (
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

    }, [modalAberto]);

    // =========================================
    // CENÁRIO SELECIONADO
    // =========================================

    const cenarioSelecionado = cenarios.find(
        item => item.cenarioTributarioId === cenarioId
    );

    const aliquotaIBSTotal = cenarioSelecionado
        ? cenarioSelecionado.aliquotaIBSEstadual +
          cenarioSelecionado.aliquotaIBSMunicipal
        : 0;

    // =========================================
    // REALIZAR SIMULAÇÃO
    // =========================================

    async function calcular(event) {

        event.preventDefault();

        if (
            !podeCalcular ||
            operacaoAtual.current ||
            !sessaoValida()
        ) return;

        setErroCalculo("");
        setResultado(null);

        if (!cenarioSelecionado) {

            setErroCalculo(
                "Selecione um cenário tributário."
            );

            return;
        }

        const valorTexto = baseCalculo
            .trim()
            .replace(",", ".");

        const valor = Number(valorTexto);

        if (
            !/^\d+(?:\.\d{1,2})?$/.test(valorTexto) ||
            !Number.isFinite(valor) ||
            valor <= 0 ||
            valor > 999999999999.99
        ) {

            setErroCalculo(
                "Informe um valor maior que zero, com até duas casas decimais."
            );

            return;
        }

        const operacao = Symbol("calcular");
        operacaoAtual.current = operacao;

        try {

            setCalculando(true);

            const dados = await requisicaoApi(
                `${API}/calcular`,
                {
                    method: "POST",

                    body: JSON.stringify({
                        cenarioTributarioId: cenarioId,
                        baseCalculo: valor
                    })
                }
            );

            if (!sessaoValida()) return;

            setResultado(
                normalizarResultado(dados)
            );

        } catch (error) {

            if (!sessaoValida()) return;

            setErroCalculo(
                error.message ||
                "Não foi possível realizar a simulação."
            );

        } finally {

            if (operacaoAtual.current === operacao) {

                operacaoAtual.current = null;

                if (sessaoValida()) {
                    setCalculando(false);
                }
            }
        }
    }

    function limparSimulacao() {

        if (ocupado) return;

        setBaseCalculo("");
        setResultado(null);
        setErroCalculo("");
    }

    function trocarCenario(id) {

        setCenarioId(id);
        setResultado(null);
        setErroCalculo("");
    }

    function trocarAba(novaAba) {

        if (ocupado) return;

        setAba(novaAba);
        setMensagem("");
    }

    // =========================================
    // CADASTRO E EDIÇÃO
    // =========================================

    function abrirCadastro() {

        if (!podeGerenciar || ocupado) return;

        setIdEditando(null);

        setFormulario({
            ...FORMULARIO_INICIAL,

            anoReferencia: String(
                new Date().getFullYear()
            )
        });

        setErroFormulario("");
        setModalAberto(true);
    }

    function abrirEdicao(cenario) {

        if (!podeGerenciar || ocupado) return;

        setIdEditando(
            cenario.cenarioTributarioId
        );

        setFormulario({
            nome: cenario.nome,
            descricao: cenario.descricao || "",

            anoReferencia: String(
                cenario.anoReferencia
            ),

            aliquotaIBSEstadual: String(
                cenario.aliquotaIBSEstadual
            ),

            aliquotaIBSMunicipal: String(
                cenario.aliquotaIBSMunicipal
            ),

            aliquotaCBS: String(
                cenario.aliquotaCBS
            )
        });

        setErroFormulario("");
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
    // VALIDAR ALÍQUOTAS
    // =========================================

    function converterAliquota(valor) {

        const texto = String(valor)
            .trim()
            .replace(",", ".");

        if (!/^\d+(?:\.\d{1,6})?$/.test(texto)) {
            return null;
        }

        const numero = Number(texto);

        if (
            !Number.isFinite(numero) ||
            numero < 0 ||
            numero > 100
        ) {
            return null;
        }

        return numero;
    }

    // =========================================
    // SALVAR CENÁRIO
    // =========================================

    async function salvarCenario(event) {

        event.preventDefault();

        if (
            !podeGerenciar ||
            operacaoAtual.current ||
            !sessaoValida()
        ) return;

        const nome = formulario.nome.trim();

        const descricao =
            formulario.descricao.trim();

        const ano = Number(
            formulario.anoReferencia
        );

        const ibsEstadual = converterAliquota(
            formulario.aliquotaIBSEstadual
        );

        const ibsMunicipal = converterAliquota(
            formulario.aliquotaIBSMunicipal
        );

        const cbs = converterAliquota(
            formulario.aliquotaCBS
        );

        if (!nome || nome.length > 150) {

            setErroFormulario(
                "Informe um nome com até 150 caracteres."
            );

            return;
        }

        if (descricao.length > 500) {

            setErroFormulario(
                "A descrição deve possuir até 500 caracteres."
            );

            return;
        }

        if (
            !Number.isInteger(ano) ||
            ano < 2026 ||
            ano > 2100
        ) {

            setErroFormulario(
                "Informe um ano entre 2026 e 2100."
            );

            return;
        }

        if (
            ibsEstadual === null ||
            ibsMunicipal === null ||
            cbs === null
        ) {

            setErroFormulario(
                "Informe alíquotas entre 0 e 100, com até seis casas decimais."
            );

            return;
        }

        const dados = {
            nome,
            descricao: descricao || null,
            anoReferencia: ano,
            aliquotaIBSEstadual: ibsEstadual,
            aliquotaIBSMunicipal: ibsMunicipal,
            aliquotaCBS: cbs
        };

        const editando = Boolean(idEditando);

        const operacao = Symbol("salvar");

        operacaoAtual.current = operacao;

        try {

            setSalvando(true);
            setErroFormulario("");
            setMensagem("");

            const endpoint = editando
                ? `${API}/cenarios/${encodeURIComponent(idEditando)}`
                : `${API}/cenarios`;

            await requisicaoApi(endpoint, {
                method: editando ? "PUT" : "POST",
                body: JSON.stringify(dados)
            });

            if (!sessaoValida()) return;

            setModalAberto(false);
            setResultado(null);

            setMensagem(
                editando
                    ? "Cenário atualizado com sucesso."
                    : "Cenário cadastrado com sucesso."
            );

            setPesquisa("");
            setAnoFiltro("");
            setStatusFiltro("");

            await carregarCenarios();

        } catch (error) {

            if (!sessaoValida()) return;

            setErroFormulario(
                error.message ||
                "Não foi possível salvar o cenário."
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
    // ATIVAR OU DESATIVAR CENÁRIO
    // =========================================

    async function alterarStatus(cenario) {

        if (
            !podeGerenciar ||
            operacaoAtual.current ||
            !sessaoValida()
        ) return;

        const novoStatus = !cenario.ativo;

        const confirmar = window.confirm(
            novoStatus
                ? `Deseja reativar "${cenario.nome}"?`
                : `Deseja desativar "${cenario.nome}"? Ele não estará mais disponível para simulações.`
        );

        if (!confirmar) return;

        const operacao = Symbol("status");

        operacaoAtual.current = operacao;

        try {

            setAlterandoStatus(
                cenario.cenarioTributarioId
            );

            setMensagem("");
            setErro("");

            await requisicaoApi(
                `${API}/cenarios/${encodeURIComponent(
                    cenario.cenarioTributarioId
                )}/status`,
                {
                    method: "PATCH",

                    body: JSON.stringify({
                        ativo: novoStatus
                    })
                }
            );

            if (!sessaoValida()) return;

            setResultado(null);

            setMensagem(
                novoStatus
                    ? "Cenário reativado com sucesso."
                    : "Cenário desativado com sucesso."
            );

            await carregarCenarios();

        } catch (error) {

            if (!sessaoValida()) return;

            setErro(
                error.message ||
                "Não foi possível alterar o status."
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
    // FILTROS DO GERENCIAMENTO
    // =========================================

    const anosDisponiveis = [
        ...new Set(
            cenariosGerenciamento.map(
                item => item.anoReferencia
            )
        )
    ].sort((a, b) => a - b);

    const cenariosFiltrados =
        cenariosGerenciamento.filter(item => {

            const texto = normalizarTexto(
                `${item.nome} ${item.descricao} ${item.anoReferencia}`
            );

            return (
                texto.includes(
                    normalizarTexto(pesquisa.trim())
                ) &&

                (
                    !anoFiltro ||
                    String(item.anoReferencia) === anoFiltro
                ) &&

                (
                    !statusFiltro ||
                    (
                        statusFiltro === "ativo"
                            ? item.ativo
                            : !item.ativo
                    )
                )
            );
        });

    const totalAtivos =
        cenariosGerenciamento.filter(
            item => item.ativo
        ).length;

    const totalInativos =
        cenariosGerenciamento.length - totalAtivos;

    // =========================================
    // COMPOSIÇÃO DO GRÁFICO
    // =========================================

    const parcelas = resultado
        ? [
            {
                nome: "IBS estadual",
                valor: resultado.valorIBSEstadual,
                cor: "#3978d4"
            },
            {
                nome: "IBS municipal",
                valor: resultado.valorIBSMunicipal,
                cor: "#ff8500"
            },
            {
                nome: "CBS",
                valor: resultado.valorCBS,
                cor: "#1d2e68"
            }
        ]
        : [];

    const percentualParcela = valor => {

        if (!resultado || resultado.totalTributos === 0) {
            return 0;
        }

        return valor / resultado.totalTributos * 100;
    };

    // =========================================
    // RENDERIZAÇÃO
    // =========================================

    return (

        <div className="st-pagina">

            {/* CABEÇALHO */}

            <header className="st-cabecalho">

                <div className="st-titulo">

                    <div className="st-titulo-icone">
                        <Calculator size={30} />
                    </div>

                    <div>

                        <h1>
                            Simulador da Reforma Tributária
                        </h1>

                        <p>
                            Simule os impactos do IBS e da CBS
                            utilizando cenários próprios ou a calculadora da Receita Federal.
                        </p>

                    </div>

                </div>

                {aba !== "receita" && (
                <div className="st-cabecalho-acoes">

                    <button
                        type="button"
                        className="st-botao-secundario"
                        onClick={carregarCenarios}
                        disabled={carregando || ocupado}
                    >

                        <RefreshCw
                            size={17}
                            className={
                                carregando
                                    ? "st-girando"
                                    : ""
                            }
                        />

                        Atualizar

                    </button>

                    {podeGerenciar && (

                        <button
                            type="button"
                            className="st-botao-principal"
                            onClick={abrirCadastro}
                            disabled={ocupado}
                        >

                            <Plus size={19} />

                            Novo cenário

                        </button>

                    )}

                </div>

                )}
            </header>

            {/* AVISO */}

            {aba !== "receita" && (
            <div className="st-aviso">

                <Info size={21} />

                <div>

                    <strong>
                        Simulação tributária simplificada
                    </strong>

                    <p>
                        Os cálculos utilizam as alíquotas
                        cadastradas pela equipe fiscal.
                        Os resultados são estimativos e não
                        substituem uma apuração fiscal oficial.
                    </p>

                </div>

            </div>

            )}

            {/* PAINEL */}

            <section className="st-painel">

                <div className="st-abas">

                    {podeCalcular && (

                        <button
                            type="button"
                            className={
                                aba === "simulador"
                                    ? "st-aba st-aba-ativa"
                                    : "st-aba"
                            }
                            aria-pressed={aba === "simulador"}
                            disabled={ocupado}
                            onClick={() =>
                                trocarAba("simulador")
                            }
                        >

                            <Calculator size={19} />

                            Simulador tributário

                        </button>

                    )}

                    {podeCalcular && (
                        <button type="button"
                            className={aba === "receita" ? "st-aba st-aba-ativa" : "st-aba"}
                            aria-pressed={aba === "receita"}
                            disabled={ocupado}
                            onClick={() => trocarAba("receita")}>
                            <Landmark size={19} />
                            Receita Federal
                        </button>
                    )}

                    {podeGerenciar && (

                        <button
                            type="button"
                            className={
                                aba === "gerenciar"
                                    ? "st-aba st-aba-ativa"
                                    : "st-aba"
                            }
                            aria-pressed={aba === "gerenciar"}
                            disabled={ocupado}
                            onClick={() =>
                                trocarAba("gerenciar")
                            }
                        >

                            <Settings size={19} />

                            Gerenciar cenários

                        </button>

                    )}

                </div>

                <div className="st-painel-conteudo">

                    {aba === "receita" && podeCalcular ? (
                        <CalculadoraReceita token={token} />
                    ) : (<>
                    {/* MENSAGENS */}

                    {mensagem && (

                        <div
                            className="st-mensagem"
                            role="status"
                        >

                            <Check size={18} />

                            <span>{mensagem}</span>

                            <button
                                type="button"
                                aria-label="Fechar mensagem"
                                onClick={() => setMensagem("")}
                            >
                                <X size={17} />
                            </button>

                        </div>

                    )}

                    {erro && (

                        <div className="st-erro" role="alert">

                            <AlertCircle size={18} />

                            <span>{erro}</span>

                        </div>

                    )}

                    {carregando ? (

                        <div
                            className="st-carregando"
                            role="status"
                        >

                            <RefreshCw
                                size={25}
                                className="st-girando"
                            />

                            Carregando cenários tributários...

                        </div>

                    ) : (

                        <>

                            {/* ==============================
                                ABA SIMULADOR
                            ============================== */}

                            {aba === "simulador" &&
                                podeCalcular && (

                                <>

                                    {cenarios.length === 0 ? (

                                        <div className="st-vazio">

                                            <Calculator size={45} />

                                            <h2>
                                                Nenhum cenário disponível
                                            </h2>

                                            <p>
                                                Aguarde o cadastro de
                                                cenários tributários
                                                pela equipe fiscal.
                                            </p>

                                            {podeGerenciar && (

                                                <button
                                                    type="button"
                                                    className="st-botao-principal"
                                                    onClick={abrirCadastro}
                                                >

                                                    <Plus size={18} />

                                                    Cadastrar cenário

                                                </button>

                                            )}

                                        </div>

                                    ) : (

                                        <div className="st-simulacao-grid">

                                            {/* DADOS DA OPERAÇÃO */}

                                            <section className="st-card">

                                                <div className="st-card-titulo">

                                                    <Calculator size={22} />

                                                    <div>

                                                        <h2>
                                                            Dados da simulação
                                                        </h2>

                                                        <p>
                                                            Informe os dados
                                                            da operação.
                                                        </p>

                                                    </div>

                                                </div>

                                                <form
                                                    className="st-formulario"
                                                    onSubmit={calcular}
                                                >

                                                    <label className="st-campo">

                                                        <span>
                                                            Cenário tributário
                                                        </span>

                                                        <select
                                                            required
                                                            value={cenarioId}
                                                            disabled={ocupado}
                                                            onChange={event =>
                                                                trocarCenario(
                                                                    event.target.value
                                                                )
                                                            }
                                                        >

                                                            <option value="">
                                                                Selecione um cenário
                                                            </option>

                                                            {cenarios.map(item => (

                                                                <option
                                                                    key={item.cenarioTributarioId}
                                                                    value={item.cenarioTributarioId}
                                                                >

                                                                    {item.nome}
                                                                    {" — "}
                                                                    {item.anoReferencia}

                                                                </option>

                                                            ))}

                                                        </select>

                                                    </label>

                                                    {cenarioSelecionado?.descricao && (

                                                        <div className="st-cenario-descricao">

                                                            <Info size={16} />

                                                            <p>
                                                                {cenarioSelecionado.descricao}
                                                            </p>

                                                        </div>

                                                    )}

                                                    <label className="st-campo">

                                                        <span>
                                                            Base de cálculo
                                                        </span>

                                                        <div className="st-valor-input">

                                                            <span>R$</span>

                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                placeholder="0,00"
                                                                required
                                                                maxLength={15}
                                                                value={baseCalculo}
                                                                disabled={ocupado}
                                                                onChange={event => {

                                                                    setBaseCalculo(
                                                                        event.target.value
                                                                    );

                                                                    setResultado(null);
                                                                    setErroCalculo("");
                                                                }}
                                                            />

                                                        </div>

                                                        <small>
                                                            Informe o valor
                                                            sem separadores
                                                            de milhares.
                                                        </small>

                                                    </label>

                                                    <div className="st-valores-rapidos">

                                                        {[100, 1000, 5000, 10000]
                                                            .map(valor => (

                                                                <button
                                                                    key={valor}
                                                                    type="button"
                                                                    disabled={ocupado}
                                                                    onClick={() => {

                                                                        setBaseCalculo(
                                                                            String(valor)
                                                                        );

                                                                        setResultado(null);
                                                                        setErroCalculo("");
                                                                    }}
                                                                >

                                                                    {formatarMoeda(valor)}

                                                                </button>

                                                            ))}

                                                    </div>

                                                    <div className="st-aliquotas">

                                                        <h3>
                                                            Alíquotas aplicadas
                                                        </h3>

                                                        <div className="st-aliquotas-grid">

                                                            <div>

                                                                <span>
                                                                    IBS estadual
                                                                </span>

                                                                <strong>
                                                                    {formatarPercentual(
                                                                        cenarioSelecionado?.aliquotaIBSEstadual
                                                                    )}
                                                                </strong>

                                                            </div>

                                                            <div>

                                                                <span>
                                                                    IBS municipal
                                                                </span>

                                                                <strong>
                                                                    {formatarPercentual(
                                                                        cenarioSelecionado?.aliquotaIBSMunicipal
                                                                    )}
                                                                </strong>

                                                            </div>

                                                            <div>

                                                                <span>
                                                                    IBS total
                                                                </span>

                                                                <strong>
                                                                    {formatarPercentual(
                                                                        aliquotaIBSTotal
                                                                    )}
                                                                </strong>

                                                            </div>

                                                            <div>

                                                                <span>CBS</span>

                                                                <strong>
                                                                    {formatarPercentual(
                                                                        cenarioSelecionado?.aliquotaCBS
                                                                    )}
                                                                </strong>

                                                            </div>

                                                        </div>

                                                    </div>

                                                    {erroCalculo && (

                                                        <div
                                                            className="st-erro"
                                                            role="alert"
                                                        >

                                                            <AlertCircle size={18} />

                                                            {erroCalculo}

                                                        </div>

                                                    )}

                                                    <button
                                                        type="submit"
                                                        className="st-botao-calcular"
                                                        disabled={
                                                            ocupado ||
                                                            !cenarioId ||
                                                            carregando
                                                        }
                                                    >

                                                        {calculando ? (

                                                            <RefreshCw
                                                                size={21}
                                                                className="st-girando"
                                                            />

                                                        ) : (

                                                            <Calculator size={21} />

                                                        )}

                                                        {calculando
                                                            ? "Calculando..."
                                                            : "Calcular tributos"}

                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="st-botao-secundario st-limpar"
                                                        onClick={limparSimulacao}
                                                        disabled={ocupado}
                                                    >

                                                        <RotateCcw size={17} />

                                                        Limpar simulação

                                                    </button>

                                                </form>

                                            </section>

                                            {/* RESULTADO */}

                                            <section
                                                className="st-card st-card-resultado"
                                                aria-live="polite"
                                            >

                                                <div className="st-card-titulo">

                                                    <ChartPie size={23} />

                                                    <div>

                                                        <h2>
                                                            Resultado da simulação
                                                        </h2>

                                                        <p>
                                                            Detalhamento dos
                                                            tributos calculados.
                                                        </p>

                                                    </div>

                                                </div>

                                                {calculando ? (

                                                    <div className="st-resultado-vazio">

                                                        <RefreshCw
                                                            size={42}
                                                            className="st-girando"
                                                        />

                                                        <h3>
                                                            Calculando tributos...
                                                        </h3>

                                                    </div>

                                                ) : !resultado ? (

                                                    <div className="st-resultado-vazio">

                                                        <div className="st-resultado-icone">
                                                            <Calculator size={48} />
                                                        </div>

                                                        <h3>
                                                            Nenhuma simulação realizada
                                                        </h3>

                                                        <p>
                                                            Selecione um cenário,
                                                            informe a base de cálculo
                                                            e clique em calcular.
                                                        </p>

                                                    </div>

                                                ) : (

                                                    <>

                                                        <div className="st-resultado-cenario">

                                                            <span>
                                                                {resultado.nomeCenario}
                                                            </span>

                                                            <strong>
                                                                {resultado.anoReferencia}
                                                            </strong>

                                                        </div>

                                                        <div className="st-resultado-base">

                                                            <span>
                                                                Base de cálculo
                                                            </span>

                                                            <strong>
                                                                {formatarMoeda(
                                                                    resultado.baseCalculo
                                                                )}
                                                            </strong>

                                                        </div>

                                                        <div className="st-resultados-grid">

                                                            <CardTributo
                                                                titulo="IBS estadual"
                                                                valor={resultado.valorIBSEstadual}
                                                                aliquota={resultado.aliquotaIBSEstadual}
                                                                Icone={Landmark}
                                                                classe="st-tributo-azul"
                                                            />

                                                            <CardTributo
                                                                titulo="IBS municipal"
                                                                valor={resultado.valorIBSMunicipal}
                                                                aliquota={resultado.aliquotaIBSMunicipal}
                                                                Icone={Building2}
                                                                classe="st-tributo-laranja"
                                                            />

                                                            <CardTributo
                                                                titulo="IBS total"
                                                                valor={resultado.valorIBSTotal}
                                                                aliquota={resultado.aliquotaIBSTotal}
                                                                Icone={Wallet}
                                                                classe="st-tributo-azul"
                                                            />

                                                            <CardTributo
                                                                titulo="CBS"
                                                                valor={resultado.valorCBS}
                                                                aliquota={resultado.aliquotaCBS}
                                                                Icone={Landmark}
                                                                classe="st-tributo-verde"
                                                            />

                                                        </div>

                                                        {/* GRÁFICO */}

                                                        <div className="st-grafico">

                                                            <h3>
                                                                Composição dos tributos
                                                            </h3>

                                                            <div
                                                                className="st-grafico-barra"
                                                                aria-label="Distribuição dos tributos"
                                                            >

                                                                {parcelas.map(item => (

                                                                    <div
                                                                        key={item.nome}
                                                                        title={
                                                                            `${item.nome}: ${formatarMoeda(item.valor)}`
                                                                        }
                                                                        style={{
                                                                            width:
                                                                                `${percentualParcela(item.valor)}%`,

                                                                            backgroundColor:
                                                                                item.cor
                                                                        }}
                                                                    />

                                                                ))}

                                                            </div>

                                                            <div className="st-grafico-legenda">

                                                                {parcelas.map(item => (

                                                                    <div
                                                                        key={item.nome}
                                                                        className="st-grafico-item"
                                                                    >

                                                                        <i
                                                                            style={{
                                                                                backgroundColor:
                                                                                    item.cor
                                                                            }}
                                                                        />

                                                                        <span>
                                                                            {item.nome}
                                                                        </span>

                                                                        <small>
                                                                            {formatarPercentual(
                                                                                percentualParcela(item.valor)
                                                                            )}
                                                                        </small>

                                                                        <strong>
                                                                            {formatarMoeda(item.valor)}
                                                                        </strong>

                                                                    </div>

                                                                ))}

                                                            </div>

                                                        </div>

                                                        {/* TOTAL */}

                                                        <div className="st-total">

                                                            <div className="st-total-principal">

                                                                <span>
                                                                    Total dos tributos
                                                                </span>

                                                                <strong>
                                                                    {formatarMoeda(
                                                                        resultado.totalTributos
                                                                    )}
                                                                </strong>

                                                            </div>

                                                            <div className="st-total-linha">

                                                                <span>
                                                                    Alíquota nominal total
                                                                </span>

                                                                <strong>
                                                                    {formatarPercentual(
                                                                        resultado.aliquotaTotal
                                                                    )}
                                                                </strong>

                                                            </div>

                                                            <div className="st-total-linha">

                                                                <span>
                                                                    Carga efetiva simulada
                                                                </span>

                                                                <strong>
                                                                    {formatarPercentual(
                                                                        resultado.cargaTributariaEfetiva
                                                                    )}
                                                                </strong>

                                                            </div>

                                                            <div className="st-total-final">

                                                                <span>
                                                                    Base + tributos
                                                                </span>

                                                                <strong>
                                                                    {formatarMoeda(
                                                                        resultado.valorTotalComTributos
                                                                    )}
                                                                </strong>

                                                            </div>

                                                        </div>

                                                        <p className="st-resultado-aviso">

                                                            {resultado.aviso ||
                                                                "Resultado meramente estimativo."}

                                                        </p>

                                                    </>

                                                )}

                                            </section>

                                        </div>

                                    )}

                                    {/* ENTENDA OS TRIBUTOS */}

                                    <section className="st-explicacao">

                                        <h2>
                                            Entenda os tributos
                                        </h2>

                                        <div className="st-explicacao-grid">

                                            <article>

                                                <div className="st-explicacao-icone">
                                                    <Landmark size={24} />
                                                </div>

                                                <div>

                                                    <h3>O que é o IBS?</h3>

                                                    <p>
                                                        O Imposto sobre Bens
                                                        e Serviços é um tributo
                                                        de competência
                                                        compartilhada entre
                                                        estados, municípios
                                                        e Distrito Federal.
                                                    </p>

                                                </div>

                                            </article>

                                            <article>

                                                <div className="st-explicacao-icone">
                                                    <Building2 size={24} />
                                                </div>

                                                <div>

                                                    <h3>O que é a CBS?</h3>

                                                    <p>
                                                        A Contribuição sobre
                                                        Bens e Serviços é um
                                                        tributo federal
                                                        integrante do novo
                                                        modelo de tributação
                                                        sobre o consumo.
                                                    </p>

                                                </div>

                                            </article>

                                        </div>

                                        <Link
                                            to="/glossario"
                                            className="st-link-glossario"
                                        >

                                            <FileText size={17} />

                                            Consultar Glossário Fiscal

                                        </Link>

                                    </section>

                                </>

                            )}

                            {/* ==============================
                                ABA GERENCIAMENTO
                            ============================== */}

                            {aba === "gerenciar" &&
                                podeGerenciar && (

                                <>

                                    <div className="st-indicadores">

                                        <Indicador
                                            titulo="Total de cenários"
                                            valor={cenariosGerenciamento.length}
                                            Icone={Calculator}
                                        />

                                        <Indicador
                                            titulo="Cenários ativos"
                                            valor={totalAtivos}
                                            Icone={Check}
                                            classe="st-indicador-verde"
                                        />

                                        <Indicador
                                            titulo="Cenários inativos"
                                            valor={totalInativos}
                                            Icone={Power}
                                            classe="st-indicador-cinza"
                                        />

                                    </div>

                                    <div className="st-filtros">

                                        <label className="st-campo">

                                            <span>
                                                Pesquisar cenário
                                            </span>

                                            <div className="st-pesquisa">

                                                <Search size={18} />

                                                <input
                                                    type="search"
                                                    placeholder="Nome ou descrição"
                                                    value={pesquisa}
                                                    onChange={event =>
                                                        setPesquisa(
                                                            event.target.value
                                                        )
                                                    }
                                                />

                                            </div>

                                        </label>

                                        <label className="st-campo">

                                            <span>Ano de referência</span>

                                            <select
                                                value={anoFiltro}
                                                onChange={event =>
                                                    setAnoFiltro(
                                                        event.target.value
                                                    )
                                                }
                                            >

                                                <option value="">
                                                    Todos os anos
                                                </option>

                                                {anosDisponiveis.map(ano => (

                                                    <option
                                                        key={ano}
                                                        value={ano}
                                                    >
                                                        {ano}
                                                    </option>

                                                ))}

                                            </select>

                                        </label>

                                        <label className="st-campo">

                                            <span>Status</span>

                                            <select
                                                value={statusFiltro}
                                                onChange={event =>
                                                    setStatusFiltro(
                                                        event.target.value
                                                    )
                                                }
                                            >

                                                <option value="">
                                                    Todos
                                                </option>

                                                <option value="ativo">
                                                    Ativos
                                                </option>

                                                <option value="inativo">
                                                    Inativos
                                                </option>

                                            </select>

                                        </label>

                                    </div>

                                    <div className="st-listagem-topo">

                                        <div>

                                            <h2>Cenários tributários</h2>

                                            <p>
                                                {cenariosFiltrados.length}
                                                {" cenário(s) encontrado(s)"}
                                            </p>

                                        </div>

                                        <button
                                            type="button"
                                            className="st-botao-principal"
                                            onClick={abrirCadastro}
                                            disabled={ocupado}
                                        >

                                            <Plus size={18} />

                                            Cadastrar cenário

                                        </button>

                                    </div>

                                    {cenariosFiltrados.length === 0 ? (

                                        <div className="st-vazio">

                                            <Calculator size={43} />

                                            <h2>
                                                Nenhum cenário encontrado
                                            </h2>

                                            <p>
                                                Cadastre um novo cenário
                                                ou altere os filtros.
                                            </p>

                                        </div>

                                    ) : (

                                        <div className="st-cenarios-lista">

                                            {cenariosFiltrados.map(item => (

                                                <article
                                                    key={item.cenarioTributarioId}
                                                    className={`st-cenario-card ${
                                                        !item.ativo
                                                            ? "st-cenario-inativo"
                                                            : ""
                                                    }`}
                                                >

                                                    <div className="st-cenario-topo">

                                                        <div>

                                                            <div className="st-cenario-etiquetas">

                                                                <span className="st-etiqueta-ano">

                                                                    {item.anoReferencia}

                                                                </span>

                                                                <span
                                                                    className={
                                                                        item.ativo
                                                                            ? "st-status-ativo"
                                                                            : "st-status-inativo"
                                                                    }
                                                                >

                                                                    {item.ativo
                                                                        ? "Ativo"
                                                                        : "Inativo"}

                                                                </span>

                                                            </div>

                                                            <h3>{item.nome}</h3>

                                                            <p>

                                                                {item.descricao ||
                                                                    "Sem descrição."}

                                                            </p>

                                                        </div>

                                                        <div className="st-cenario-acoes">

                                                            <button
                                                                type="button"
                                                                className="st-botao-icone"
                                                                title="Editar cenário"
                                                                aria-label="Editar cenário"
                                                                disabled={ocupado}
                                                                onClick={() =>
                                                                    abrirEdicao(item)
                                                                }
                                                            >

                                                                <Pencil size={18} />

                                                            </button>

                                                            <button
                                                                type="button"
                                                                className={`st-botao-icone ${
                                                                    item.ativo
                                                                        ? "st-botao-perigo"
                                                                        : "st-botao-ativar"
                                                                }`}
                                                                title={
                                                                    item.ativo
                                                                        ? "Desativar cenário"
                                                                        : "Reativar cenário"
                                                                }
                                                                aria-label={
                                                                    item.ativo
                                                                        ? "Desativar cenário"
                                                                        : "Reativar cenário"
                                                                }
                                                                disabled={ocupado}
                                                                onClick={() =>
                                                                    alterarStatus(item)
                                                                }
                                                            >

                                                                {alterandoStatus ===
                                                                    item.cenarioTributarioId ? (

                                                                    <RefreshCw
                                                                        size={18}
                                                                        className="st-girando"
                                                                    />

                                                                ) : item.ativo ? (

                                                                    <Power size={18} />

                                                                ) : (

                                                                    <Check size={19} />

                                                                )}

                                                            </button>

                                                        </div>

                                                    </div>

                                                    <div className="st-cenario-aliquotas">

                                                        <div>

                                                            <span>IBS estadual</span>

                                                            <strong>
                                                                {formatarPercentual(
                                                                    item.aliquotaIBSEstadual
                                                                )}
                                                            </strong>

                                                        </div>

                                                        <div>

                                                            <span>IBS municipal</span>

                                                            <strong>
                                                                {formatarPercentual(
                                                                    item.aliquotaIBSMunicipal
                                                                )}
                                                            </strong>

                                                        </div>

                                                        <div>

                                                            <span>IBS total</span>

                                                            <strong>
                                                                {formatarPercentual(
                                                                    item.aliquotaIBSEstadual +
                                                                    item.aliquotaIBSMunicipal
                                                                )}
                                                            </strong>

                                                        </div>

                                                        <div>

                                                            <span>CBS</span>

                                                            <strong>
                                                                {formatarPercentual(
                                                                    item.aliquotaCBS
                                                                )}
                                                            </strong>

                                                        </div>

                                                        <div className="st-cenario-total">

                                                            <span>Alíquota total</span>

                                                            <strong>
                                                                {formatarPercentual(
                                                                    item.aliquotaIBSEstadual +
                                                                    item.aliquotaIBSMunicipal +
                                                                    item.aliquotaCBS
                                                                )}
                                                            </strong>

                                                        </div>

                                                    </div>

                                                    {item.autor && (

                                                        <small className="st-cenario-autor">

                                                            Cadastrado por: {item.autor}

                                                        </small>

                                                    )}

                                                </article>

                                            ))}

                                        </div>

                                    )}

                                </>

                            )}

                        </>

                    )}

                    </>)}
                </div>

            </section>

            {/* MODAL DE CADASTRO E EDIÇÃO */}

            {modalAberto && podeGerenciar && (

                <div
                    className="st-modal-fundo"
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
                        className="st-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="st-modal-titulo"
                        tabIndex={-1}
                        ref={modalRef}
                    >

                        <div className="st-modal-cabecalho">

                            <div>

                                <h2 id="st-modal-titulo">

                                    {idEditando
                                        ? "Editar cenário tributário"
                                        : "Novo cenário tributário"}

                                </h2>

                                <p>
                                    Cadastre as alíquotas fornecidas
                                    pela equipe fiscal.
                                </p>

                            </div>

                            <button
                                type="button"
                                className="st-modal-fechar"
                                onClick={fecharModal}
                                disabled={salvando}
                                aria-label="Fechar formulário"
                            >

                                <X size={23} />

                            </button>

                        </div>

                        <form
                            className="st-modal-formulario"
                            onSubmit={salvarCenario}
                        >

                            {erroFormulario && (

                                <div
                                    className="st-erro"
                                    role="alert"
                                >

                                    <AlertCircle size={18} />

                                    {erroFormulario}

                                </div>

                            )}

                            <label className="st-campo">

                                <span>Nome do cenário *</span>

                                <input
                                    type="text"
                                    required
                                    maxLength={150}
                                    placeholder="Ex.: Cenário de simulação 2027"
                                    value={formulario.nome}
                                    disabled={salvando}
                                    onChange={event =>
                                        atualizarCampo(
                                            "nome",
                                            event.target.value
                                        )
                                    }
                                />

                                <small>
                                    {formulario.nome.length}/150
                                </small>

                            </label>

                            <label className="st-campo">

                                <span>Ano de referência *</span>

                                <input
                                    type="number"
                                    required
                                    min={2026}
                                    max={2100}
                                    step={1}
                                    value={formulario.anoReferencia}
                                    disabled={salvando}
                                    onChange={event =>
                                        atualizarCampo(
                                            "anoReferencia",
                                            event.target.value
                                        )
                                    }
                                />

                            </label>

                            <label className="st-campo">

                                <span>Descrição</span>

                                <textarea
                                    rows={4}
                                    maxLength={500}
                                    placeholder="Descreva as condições e a finalidade deste cenário..."
                                    value={formulario.descricao}
                                    disabled={salvando}
                                    onChange={event =>
                                        atualizarCampo(
                                            "descricao",
                                            event.target.value
                                        )
                                    }
                                />

                                <small>
                                    {formulario.descricao.length}/500
                                </small>

                            </label>

                            <div className="st-modal-aliquotas">

                                <h3>Alíquotas tributárias</h3>

                                <p>
                                    Informe os valores em percentual,
                                    com até seis casas decimais.
                                </p>

                                <div className="st-modal-aliquotas-grid">

                                    {[
                                        {
                                            campo: "aliquotaIBSEstadual",
                                            titulo: "IBS estadual"
                                        },
                                        {
                                            campo: "aliquotaIBSMunicipal",
                                            titulo: "IBS municipal"
                                        },
                                        {
                                            campo: "aliquotaCBS",
                                            titulo: "CBS"
                                        }
                                    ].map(item => (

                                        <label
                                            className="st-campo"
                                            key={item.campo}
                                        >

                                            <span>
                                                {item.titulo} *
                                            </span>

                                            <div className="st-percentual-input">

                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    required
                                                    placeholder="0,00"
                                                    maxLength={10}
                                                    disabled={salvando}
                                                    value={
                                                        formulario[item.campo]
                                                    }
                                                    onChange={event =>
                                                        atualizarCampo(
                                                            item.campo,
                                                            event.target.value
                                                        )
                                                    }
                                                />

                                                <span>%</span>

                                            </div>

                                        </label>

                                    ))}

                                </div>

                            </div>

                            <div className="st-modal-previa">

                                <span>
                                    Alíquota nominal total
                                </span>

                                <strong>

                                    {formatarPercentual(
                                        (
                                            converterAliquota(
                                                formulario.aliquotaIBSEstadual
                                            ) ?? 0
                                        ) +
                                        (
                                            converterAliquota(
                                                formulario.aliquotaIBSMunicipal
                                            ) ?? 0
                                        ) +
                                        (
                                            converterAliquota(
                                                formulario.aliquotaCBS
                                            ) ?? 0
                                        )
                                    )}

                                </strong>

                            </div>

                            <p className="st-campos-obrigatorios">
                                * Campos obrigatórios
                            </p>

                            <div className="st-modal-acoes">

                                <button
                                    type="button"
                                    className="st-botao-secundario"
                                    onClick={fecharModal}
                                    disabled={salvando}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="st-botao-principal"
                                    disabled={salvando}
                                >

                                    {salvando ? (

                                        <RefreshCw
                                            size={18}
                                            className="st-girando"
                                        />

                                    ) : (

                                        <Check size={18} />

                                    )}

                                    {salvando
                                        ? "Salvando..."
                                        : idEditando
                                            ? "Salvar alterações"
                                            : "Cadastrar cenário"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>

    );
}

// =========================================
// COMPONENTE DE RESULTADO DE TRIBUTO
// =========================================

function CardTributo({
    titulo,
    valor,
    aliquota,
    Icone,
    classe
}) {

    return (

        <article className={`st-tributo ${classe}`}>

            <div className="st-tributo-topo">

                <Icone size={21} />

                <span>
                    {formatarPercentual(aliquota)}
                </span>

            </div>

            <p>{titulo}</p>

            <strong>
                {formatarMoeda(valor)}
            </strong>

        </article>

    );
}

// =========================================
// COMPONENTE DE INDICADOR
// =========================================

function Indicador({
    titulo,
    valor,
    Icone,
    classe = ""
}) {

    return (

        <article className="st-indicador">

            <div className={`st-indicador-icone ${classe}`}>

                <Icone size={25} />

            </div>

            <div>

                <span>{titulo}</span>

                <strong>{valor}</strong>

            </div>

        </article>

    );
}