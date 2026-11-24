import "./Notasfiscais.css";

import {
    useState,
    useEffect,
    useRef,
    useCallback
} from "react";

import { requisicaoApi } from "../../services/api";

import usePermissoes from "../../hooks/usePermissoes";
import usePesquisaLayout from "../../hooks/usePesquisaLayout";

import Lixeira from "../../assets/Icones/Lixeira.png";
import Calendario from "../../assets/Icones/calendario.png";

const itensPorPagina = 4;

const statusFormatados = {
    IMPORTADA: "Importada",
    VALIDADA: "Validada",
    REJEITADA: "Rejeitada",
    PROCESSADO: "Processada",
    PROCESSADA: "Processada",
    PENDENTE: "Pendente",
    PROCESSANDO: "Processando",
    ERRO: "Erro",
    ARQUIVADA: "Arquivada",
    CANCELADA: "Cancelada",
    AUTENTICADA: "Autenticada"
};

function NotasFiscais() {

    // =========================================
    // PERMISSÕES DINÂMICAS
    // =========================================

    const {
        autenticado,
        temPermissao,
        carregando: carregandoPermissoes,
        erro: erroPermissoes,
        atualizar
    } = usePermissoes();

    const podeVerTodas =
        autenticado &&
        temPermissao("nota.ler.todas");

    const podeVerProprias =
        autenticado &&
        temPermissao("nota.ler.proprias");

    const podeVisualizar =
        podeVerTodas || podeVerProprias;

    const podeImportarXml =
        autenticado &&
        temPermissao("nota.importar");

    const podeExcluir =
        autenticado &&
        temPermissao("nota.arquivar");

    const acessoLiberado =
        podeVisualizar &&
        !carregandoPermissoes &&
        !erroPermissoes;

    // =========================================
    // REFERÊNCIAS
    // =========================================

    const inputArquivoRef = useRef(null);

    const requisicaoAtualRef = useRef(0);

    const operacaoRef = useRef(false);

    // =========================================
    // ESTADOS DA LISTAGEM
    // =========================================

    const [notas, setNotas] = useState([]);

    const [pesquisa, setPesquisa] =
        useState("");

    const [cliente, setCliente] =
        useState("Todos");

    const [status, setStatus] =
        useState("Todos");

    const [dataInicio, setDataInicio] =
        useState("");

    const [dataFim, setDataFim] =
        useState("");

    const [periodoAplicado, setPeriodoAplicado] =
        useState({
            inicio: "",
            fim: ""
        });

    const [pagina, setPagina] =
        useState(1);

    const [carregando, setCarregando] =
        useState(true);

    const [erro, setErro] =
        useState("");

    const [erroPeriodo, setErroPeriodo] =
        useState("");

    // =========================================
    // ESTADOS DA IMPORTAÇÃO XML
    // =========================================

    const [importando, setImportando] =
        useState(false);

    const [mensagemImportacao, setMensagemImportacao] =
        useState("");

    const [erroImportacao, setErroImportacao] =
        useState("");

    // =========================================
    // ESTADOS DO ARQUIVAMENTO
    // =========================================

    const [arquivando, setArquivando] =
        useState(null);

    // =========================================
    // SESSÃO ATUAL
    // =========================================

    const token =
        localStorage.getItem("token");

    // =========================================
    // PESQUISA DO HEADER COMPARTILHADO
    // =========================================

    const alterarPesquisa = useCallback(valor => {

        setPesquisa(valor);
        setPagina(1);

    }, []);

    usePesquisaLayout(
        pesquisa,
        alterarPesquisa
    );

    // =========================================
    // NORMALIZAÇÃO DOS DADOS
    // =========================================

    function obterIdNota(nota) {

        return (
            nota.notaFiscalId ??
            nota.NotaFiscalId ??
            nota.id
        );

    }

    function obterCnpjDestinatario(nota) {

        return (
            nota.cnpjDestinatario ??
            nota.cnpjdestinatario ??
            nota.CnpjDestinatario ??
            ""
        );

    }

    function obterCnpjEmitente(nota) {

        return (
            nota.cnpjEmitente ??
            nota.cnpjemitente ??
            nota.CnpjEmitente ??
            ""
        );

    }

    function normalizarTexto(texto) {

        return String(texto ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

    }

    function normalizarDocumento(documento) {

        return String(documento ?? "")
            .replace(/[^a-zA-Z0-9]/g, "")
            .toUpperCase();

    }

    function normalizarStatus(statusNota) {

        return String(statusNota ?? "")
            .trim()
            .toUpperCase();

    }

    // =========================================
    // CARREGAR NOTAS FISCAIS
    // =========================================

    const carregarNotas = useCallback(async () => {

        const numeroRequisicao =
            ++requisicaoAtualRef.current;

        if (
            !acessoLiberado ||
            localStorage.getItem("token") !== token
        ) {

            setNotas([]);
            setCarregando(false);

            return false;

        }

        try {

            setCarregando(true);
            setErro("");

            const dados = await requisicaoApi(
                "/api/NotasFiscais"
            );

            if (
                numeroRequisicao !==
                requisicaoAtualRef.current ||
                localStorage.getItem("token") !== token
            ) {

                return false;

            }

            if (!Array.isArray(dados)) {

                throw new Error(
                    "A API retornou uma listagem inválida."
                );

            }

            // A API é responsável por retornar
            // somente as notas autorizadas ao usuário.

            setNotas(dados);

            return true;

        } catch (error) {

            if (
                numeroRequisicao !==
                requisicaoAtualRef.current
            ) {

                return false;

            }

            console.error(
                "Erro ao carregar notas fiscais:",
                error
            );

            setNotas([]);

            setErro(
                error.message ||
                "Não foi possível carregar as notas fiscais."
            );

            return false;

        } finally {

            if (
                numeroRequisicao ===
                requisicaoAtualRef.current
            ) {

                setCarregando(false);

            }

        }

    }, [
        acessoLiberado,
        token
    ]);

    useEffect(() => {

        setNotas([]);
        setPagina(1);

        setCliente("Todos");
        setStatus("Todos");

        setMensagemImportacao("");
        setErroImportacao("");

        carregarNotas();

        return () => {

            requisicaoAtualRef.current += 1;

        };

    }, [
        token,
        carregarNotas
    ]);

    // =========================================
    // IMPORTAR XML
    // =========================================

    async function importarXml(event) {

        const input = event.currentTarget;

        const arquivo = input.files?.[0];

        // Limpa o input para permitir selecionar
        // novamente o mesmo arquivo.

        input.value = "";

        if (
            !arquivo ||
            !acessoLiberado ||
            !podeImportarXml ||
            operacaoRef.current
        ) {

            return;

        }

        setMensagemImportacao("");
        setErroImportacao("");

        // VALIDAR EXTENSÃO

        if (
            !arquivo.name
                .toLowerCase()
                .endsWith(".xml")
        ) {

            setErroImportacao(
                "Selecione um arquivo com extensão .xml."
            );

            return;

        }

        // VALIDAR TAMANHO

        if (arquivo.size === 0) {

            setErroImportacao(
                "O arquivo XML está vazio."
            );

            return;

        }

        if (arquivo.size > 5_000_000) {

            setErroImportacao(
                "O arquivo XML deve ter no máximo 5 MB."
            );

            return;

        }

        // CRIAR FORMULÁRIO

        const formulario =
            new FormData();

        formulario.append(
            "arquivo",
            arquivo
        );

        try {

            operacaoRef.current = true;
            setImportando(true);

            const resultado =
                await requisicaoApi(

                    "/api/NotasFiscais/upload",

                    {
                        method: "POST",
                        body: formulario
                    }

                );

            if (
                localStorage.getItem("token") !== token
            ) {

                return;

            }

            setMensagemImportacao(

                resultado?.mensagem ||

                "Nota fiscal importada com sucesso!"

            );

            setPagina(1);

            // Atualiza a listagem somente após
            // a importação ser confirmada pela API.

            await carregarNotas();

        } catch (error) {

            console.error(
                "Erro ao importar XML:",
                error
            );

            if (
                localStorage.getItem("token") === token
            ) {

                setErroImportacao(

                    error.message ||

                    "Não foi possível importar o XML."

                );

            }

        } finally {

            operacaoRef.current = false;
            setImportando(false);

        }

    }

    // =========================================
    // FORMATAR DATA
    // =========================================

    function formatarData(data) {

        if (!data) {

            return "Não informada";

        }

        const dataTexto =
            String(data).split("T")[0];

        const partes =
            dataTexto.split("-");

        if (partes.length !== 3) {

            return "Não informada";

        }

        const [ano, mes, dia] = partes;

        return `${dia}/${mes}/${ano}`;

    }

    // =========================================
    // FORMATAR VALOR
    // =========================================

    function formatarValor(valor) {

        const numero =
            Number(valor ?? 0);

        if (!Number.isFinite(numero)) {

            return "Não informado";

        }

        return numero.toLocaleString(

            "pt-BR",

            {
                style: "currency",
                currency: "BRL"
            }

        );

    }

    // =========================================
    // FORMATAR CNPJ NUMÉRICO OU ALFANUMÉRICO
    // =========================================

    function formatarCnpj(cnpj) {

        const documento =
            normalizarDocumento(cnpj);

        if (documento.length !== 14) {

            return cnpj || "Não informado";

        }

        return documento.replace(

            /^(.{2})(.{3})(.{3})(.{4})(.{2})$/,

            "$1.$2.$3/$4-$5"

        );

    }

    // =========================================
    // TRADUZIR STATUS
    // =========================================

    function formatarStatus(statusNota) {

        const situacao =
            normalizarStatus(statusNota);

        return (

            statusFormatados[situacao] ||

            statusNota ||

            "Não informado"

        );

    }

    // =========================================
    // CLASSE VISUAL DO STATUS
    // =========================================

    function classeStatus(statusNota) {

        const situacao =
            normalizarStatus(statusNota);

        if (

            [
                "IMPORTADA",
                "VALIDADA",
                "PROCESSADO",
                "PROCESSADA",
                "AUTENTICADA"
            ].includes(situacao)

        ) {

            return "status-autenticada";

        }

        if (

            [
                "CANCELADA",
                "ARQUIVADA",
                "REJEITADA",
                "ERRO"
            ].includes(situacao)

        ) {

            return "status-cancelada";

        }

        return "status-pendente";

    }

    // =========================================
    // CLIENTES DISPONÍVEIS
    // =========================================

    const clientesDisponiveis = [

        ...new Set(

            notas

                .map(nota =>
                    normalizarDocumento(
                        obterCnpjDestinatario(nota)
                    )
                )

                .filter(Boolean)

        )

    ].sort();

    // =========================================
    // STATUS DISPONÍVEIS
    // =========================================

    const statusDisponiveis = [

        ...new Set(

            Object.values(statusFormatados)

        )

    ];

    // =========================================
    // FILTRAR NOTAS FISCAIS
    // =========================================

    const notasFiltradas = acessoLiberado

        ? notas.filter(nota => {

            const textoPesquisa =
                normalizarTexto(pesquisa);

            const documentoPesquisa =
                normalizarDocumento(pesquisa);

            const chave =
                normalizarTexto(nota.chaveAcesso);

            const destinatario =
                obterCnpjDestinatario(nota);

            const emitente =
                obterCnpjEmitente(nota);

            const cnpjCliente =
                normalizarDocumento(destinatario);

            const nomeCliente =
                normalizarTexto(

                    nota.razaoSocialDestinatario ??

                    nota.nomeDestinatario ??

                    nota.razaoSocial ??

                    ""

                );

            const correspondePesquisa =

                !textoPesquisa ||

                chave.includes(textoPesquisa) ||

                nomeCliente.includes(textoPesquisa) ||

                normalizarTexto(
                    nota.numero
                ).includes(textoPesquisa) ||

                normalizarTexto(
                    destinatario
                ).includes(textoPesquisa) ||

                normalizarTexto(
                    emitente
                ).includes(textoPesquisa) ||

                (

                    Boolean(documentoPesquisa) &&

                    (

                        normalizarDocumento(
                            destinatario
                        ).includes(documentoPesquisa) ||

                        normalizarDocumento(
                            emitente
                        ).includes(documentoPesquisa) ||

                        normalizarDocumento(
                            nota.chaveAcesso
                        ).includes(documentoPesquisa)

                    )

                );

            const correspondeCliente =

                cliente === "Todos" ||

                cnpjCliente === cliente;

            const correspondeStatus =

                status === "Todos" ||

                formatarStatus(nota.status) === status;

            const dataNota = nota.dataEmissao

                ? String(nota.dataEmissao).split("T")[0]

                : "";

            const correspondeData =

                (

                    !periodoAplicado.inicio &&

                    !periodoAplicado.fim

                ) ||

                (

                    Boolean(dataNota) &&

                    (

                        !periodoAplicado.inicio ||

                        dataNota >= periodoAplicado.inicio

                    ) &&

                    (

                        !periodoAplicado.fim ||

                        dataNota <= periodoAplicado.fim

                    )

                );

            return (

                correspondePesquisa &&

                correspondeCliente &&

                correspondeStatus &&

                correspondeData

            );

        })

        : [];

    // =========================================
    // PAGINAÇÃO
    // =========================================

    const totalPaginas = Math.max(

        1,

        Math.ceil(
            notasFiltradas.length / itensPorPagina
        )

    );

    const paginaAtual =
        Math.min(pagina, totalPaginas);

    const notasPagina =
        notasFiltradas.slice(

            (paginaAtual - 1) * itensPorPagina,

            paginaAtual * itensPorPagina

        );

    // =========================================
    // APLICAR FILTRO DE PERÍODO
    // =========================================

    function buscarNotas() {

        setErroPeriodo("");

        if (

            dataInicio &&

            dataFim &&

            dataInicio > dataFim

        ) {

            setErroPeriodo(

                "A data inicial não pode ser maior que a data final."

            );

            return;

        }

        setPeriodoAplicado({

            inicio: dataInicio,

            fim: dataFim

        });

        setPagina(1);

    }

    // =========================================
    // LIMPAR FILTROS
    // =========================================

    function limparFiltros() {

        setPesquisa("");
        setCliente("Todos");
        setStatus("Todos");

        setDataInicio("");
        setDataFim("");

        setPeriodoAplicado({

            inicio: "",
            fim: ""

        });

        setErroPeriodo("");

        setPagina(1);

    }

    // =========================================
    // ABRIR CALENDÁRIO
    // =========================================

    function abrirCalendario(event) {

        const input =
            event.currentTarget.previousElementSibling;

        if (!input) return;

        try {

            if (
                typeof input.showPicker === "function"
            ) {

                input.showPicker();

            } else {

                input.focus();

            }

        } catch {

            input.focus();

        }

    }

    // =========================================
    // ARQUIVAR NOTA FISCAL
    // =========================================

    async function excluirNota(nota) {

        if (

            !acessoLiberado ||

            !podeExcluir ||

            operacaoRef.current ||

            normalizarStatus(nota.status) === "ARQUIVADA"

        ) {

            return;

        }

        const id =
            obterIdNota(nota);

        if (!id) {

            alert(

                "Não foi possível identificar a nota fiscal."

            );

            return;

        }

        const confirmar = window.confirm(

            "Deseja realmente arquivar esta nota fiscal?"

        );

        if (!confirmar) return;

        try {

            operacaoRef.current = true;
            setArquivando(id);

            await requisicaoApi(

                `/api/NotasFiscais/${id}`,

                {
                    method: "DELETE"
                }

            );

            if (
                localStorage.getItem("token") !== token
            ) {

                return;

            }

            setNotas(lista =>

                lista.map(item =>

                    obterIdNota(item) === id

                        ? {

                            ...item,

                            status: "ARQUIVADA"

                        }

                        : item

                )

            );

            alert(

                "Nota fiscal arquivada com sucesso!"

            );

            await carregarNotas();

        } catch (error) {

            console.error(

                "Erro ao arquivar nota fiscal:",

                error

            );

            alert(

                error.message ||

                "Não foi possível arquivar a nota."

            );

        } finally {

            operacaoRef.current = false;

            setArquivando(null);

        }

    }

    // =========================================
    // CONTROLE DA LISTAGEM
    // =========================================

    const carregandoLista =

        carregando ||

        carregandoPermissoes;

    const totalColunas =
        podeExcluir ? 6 : 5;

    const operacaoEmAndamento =

        importando ||

        arquivando !== null;

    // =========================================
    // RENDERIZAÇÃO
    //
    // O Sidebar e o Header são fornecidos
    // exclusivamente pelo LayoutSistema.
    // =========================================

    return (

        <div className="pagina-notas">

            <main className="principal-notas">

                <section className="conteudo-notas">

                    <h1>

                        Notas Fiscais

                    </h1>

                    {/* CARREGAMENTO DAS PERMISSÕES */}

                    {carregandoPermissoes ? (

                        <p role="status">

                            Carregando permissões...

                        </p>

                    ) : erroPermissoes ? (

                        <div
                            className="mensagem-importacao falha"
                            role="alert"
                        >

                            <p>

                                Não foi possível carregar
                                suas permissões.

                            </p>

                            <button
                                type="button"
                                className="botao-buscar-notas"
                                onClick={atualizar}
                            >

                                Tentar novamente

                            </button>

                        </div>

                    ) : !podeVisualizar ? (

                        <div
                            className="mensagem-importacao falha"
                            role="alert"
                        >

                            Você não possui permissão
                            para visualizar notas fiscais.

                        </div>

                    ) : (

                        <>

                            {/* IMPORTAÇÃO DE XML */}

                            {podeImportarXml && (

                                <div className="area-importacao-notas">

                                    <input
                                        type="file"

                                        accept=".xml,application/xml,text/xml"

                                        ref={inputArquivoRef}

                                        onChange={importarXml}

                                        disabled={operacaoEmAndamento}

                                        hidden
                                    />

                                    <button
                                        type="button"

                                        className="botao-importar-xml"

                                        onClick={() =>

                                            inputArquivoRef.current?.click()

                                        }

                                        disabled={
                                            operacaoEmAndamento
                                        }
                                    >

                                        {importando ? (

                                            "Importando XML..."

                                        ) : (

                                            <>

                                                <span>+</span>

                                                Importar XML

                                            </>

                                        )}

                                    </button>

                                </div>

                            )}

                            {/* MENSAGEM DE SUCESSO */}

                            {mensagemImportacao && (

                                <div
                                    className="mensagem-importacao sucesso"
                                    role="status"
                                >

                                    {mensagemImportacao}

                                </div>

                            )}

                            {/* ERRO DE IMPORTAÇÃO */}

                            {erroImportacao && (

                                <div
                                    className="mensagem-importacao falha"
                                    role="alert"
                                >

                                    {erroImportacao}

                                </div>

                            )}

                            {/* PESQUISA */}

                            <div className="pesquisa-lista-notas">

                                <input
                                    type="search"

                                    placeholder="Buscar chave, CNPJ ou número da nota..."

                                    aria-label="Pesquisar notas fiscais"

                                    value={pesquisa}

                                    onChange={event =>

                                        alterarPesquisa(
                                            event.target.value
                                        )

                                    }
                                />

                            </div>

                            {/* FILTROS */}

                            <div className="filtros-notas">

                                {/* PERÍODO */}

                                <div className="filtro-periodo">

                                    <label>

                                        Período

                                    </label>

                                    <div className="campo-periodo">

                                        <div className="campo-data-notas">

                                            <input
                                                type="date"

                                                aria-label="Data inicial"

                                                value={dataInicio}

                                                onChange={event =>
                                                    setDataInicio(
                                                        event.target.value
                                                    )
                                                }
                                            />

                                            <button
                                                type="button"

                                                className="botao-calendario-notas"

                                                title="Selecionar data inicial"

                                                aria-label="Selecionar data inicial"

                                                onClick={abrirCalendario}
                                            >

                                                <img
                                                    src={Calendario}
                                                    alt=""
                                                />

                                            </button>

                                        </div>

                                        <span>-</span>

                                        <div className="campo-data-notas">

                                            <input
                                                type="date"

                                                aria-label="Data final"

                                                value={dataFim}

                                                min={
                                                    dataInicio || undefined
                                                }

                                                onChange={event =>
                                                    setDataFim(
                                                        event.target.value
                                                    )
                                                }
                                            />

                                            <button
                                                type="button"

                                                className="botao-calendario-notas"

                                                title="Selecionar data final"

                                                aria-label="Selecionar data final"

                                                onClick={abrirCalendario}
                                            >

                                                <img
                                                    src={Calendario}
                                                    alt=""
                                                />

                                            </button>

                                        </div>

                                    </div>

                                </div>

                                {/* FILTRO CLIENTE */}

                                {podeVerTodas && (

                                    <div className="filtro-cliente">

                                        <label htmlFor="filtro-cliente-notas">

                                            Cliente

                                        </label>

                                        <select
                                            id="filtro-cliente-notas"

                                            value={cliente}

                                            onChange={event => {

                                                setCliente(
                                                    event.target.value
                                                );

                                                setPagina(1);

                                            }}
                                        >

                                            <option value="Todos">

                                                Todos

                                            </option>

                                            {clientesDisponiveis.map(cnpj => (

                                                <option
                                                    key={cnpj}
                                                    value={cnpj}
                                                >

                                                    {formatarCnpj(cnpj)}

                                                </option>

                                            ))}

                                        </select>

                                    </div>

                                )}

                                {/* FILTRO STATUS */}

                                <div className="filtro-status">

                                    <label htmlFor="filtro-status-notas">

                                        Status

                                    </label>

                                    <select
                                        id="filtro-status-notas"

                                        value={status}

                                        onChange={event => {

                                            setStatus(
                                                event.target.value
                                            );

                                            setPagina(1);

                                        }}
                                    >

                                        <option value="Todos">

                                            Todos

                                        </option>

                                        {statusDisponiveis.map(item => (

                                            <option
                                                key={item}
                                                value={item}
                                            >

                                                {item}

                                            </option>

                                        ))}

                                    </select>

                                </div>

                                {/* BOTÃO BUSCAR */}

                                <button
                                    type="button"

                                    className="botao-buscar-notas"

                                    onClick={buscarNotas}
                                >

                                    Buscar

                                </button>

                                {/* LIMPAR FILTROS */}

                                <button
                                    type="button"

                                    className="botao-limpar-notas"

                                    onClick={limparFiltros}
                                >

                                    Limpar

                                </button>

                            </div>

                            {/* ERRO DE PERÍODO */}

                            {erroPeriodo && (

                                <div
                                    className="mensagem-importacao falha"
                                    role="alert"
                                >

                                    {erroPeriodo}

                                </div>

                            )}

                            {/* ERRO AO CARREGAR NOTAS */}

                            {erro && (

                                <div
                                    className="mensagem-importacao falha"
                                    role="alert"
                                >

                                    <p>{erro}</p>

                                    <button
                                        type="button"

                                        className="botao-buscar-notas"

                                        onClick={carregarNotas}
                                    >

                                        Tentar novamente

                                    </button>

                                </div>

                            )}

                            {/* TOTAL DE REGISTROS */}

                            {!carregandoLista && !erro && (

                                <div className="total-notas">

                                    {notasFiltradas.length}

                                    {" "}

                                    {notasFiltradas.length === 1

                                        ? "nota fiscal encontrada"

                                        : "notas fiscais encontradas"

                                    }

                                </div>

                            )}

                            {/* TABELA */}

                            <div className="tabela-notas-container">

                                <table className="tabela-notas">

                                    <thead>

                                        <tr>

                                            <th>Chave de acesso</th>

                                            <th>Emissão</th>

                                            <th>Cliente</th>

                                            <th>Valor</th>

                                            <th>Status</th>

                                            {podeExcluir && (

                                                <th>Ações</th>

                                            )}

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {carregandoLista ? (

                                            <tr>

                                                <td
                                                    colSpan={totalColunas}

                                                    className="nenhuma-nota"
                                                >

                                                    Carregando notas fiscais...

                                                </td>

                                            </tr>

                                        ) : erro ? (

                                            <tr>

                                                <td
                                                    colSpan={totalColunas}

                                                    className="nenhuma-nota"
                                                >

                                                    Não foi possível carregar
                                                    as notas fiscais.

                                                </td>

                                            </tr>

                                        ) : notasPagina.length > 0 ? (

                                            notasPagina.map(nota => {

                                                const id =
                                                    obterIdNota(nota);

                                                return (

                                                    <tr key={id}>

                                                        {/* CHAVE DE ACESSO */}

                                                        <td className="chave-nota">

                                                            {nota.chaveAcesso ||

                                                                "Não informada"}

                                                        </td>

                                                        {/* DATA DE EMISSÃO */}

                                                        <td>

                                                            {formatarData(

                                                                nota.dataEmissao

                                                            )}

                                                        </td>

                                                        {/* CLIENTE */}

                                                        <td>

                                                            {formatarCnpj(

                                                                obterCnpjDestinatario(nota)

                                                            )}

                                                        </td>

                                                        {/* VALOR */}

                                                        <td>

                                                            {formatarValor(

                                                                nota.valorTotal

                                                            )}

                                                        </td>

                                                        {/* STATUS */}

                                                        <td>

                                                            <span
                                                                className={`status-nota ${classeStatus(
                                                                    nota.status
                                                                )}`}
                                                            >

                                                                {formatarStatus(

                                                                    nota.status

                                                                )}

                                                            </span>

                                                        </td>

                                                        {/* ARQUIVAR */}

                                                        {podeExcluir && (

                                                            <td>

                                                                {normalizarStatus(

                                                                    nota.status

                                                                ) !== "ARQUIVADA" && (

                                                                    <button
                                                                        type="button"

                                                                        className="botao-excluir-nota"

                                                                        title={
                                                                            arquivando === id

                                                                                ? "Arquivando nota..."

                                                                                : "Arquivar nota fiscal"
                                                                        }

                                                                        aria-label="Arquivar nota fiscal"

                                                                        disabled={
                                                                            operacaoEmAndamento
                                                                        }

                                                                        onClick={() =>
                                                                            excluirNota(nota)
                                                                        }
                                                                    >

                                                                        <img
                                                                            src={Lixeira}
                                                                            alt=""
                                                                        />

                                                                    </button>

                                                                )}

                                                            </td>

                                                        )}

                                                    </tr>

                                                );

                                            })

                                        ) : (

                                            <tr>

                                                <td
                                                    colSpan={totalColunas}

                                                    className="nenhuma-nota"
                                                >

                                                    Nenhuma nota fiscal encontrada.

                                                </td>

                                            </tr>

                                        )}

                                    </tbody>

                                </table>

                            </div>

                            {/* PAGINAÇÃO */}

                            {!carregandoLista &&

                                !erro &&

                                notasFiltradas.length > 0 && (

                                <div className="paginacao-notas">

                                    <button
                                        type="button"

                                        disabled={
                                            paginaAtual === 1
                                        }

                                        onClick={() =>

                                            setPagina(
                                                paginaAtual - 1
                                            )

                                        }
                                    >

                                        Anterior

                                    </button>

                                    {Array.from(

                                        { length: totalPaginas },

                                        (_, i) => i + 1

                                    ).map(numero => (

                                        <button
                                            key={numero}

                                            type="button"

                                            className={

                                                paginaAtual === numero

                                                    ? "pagina-ativa"

                                                    : ""

                                            }

                                            onClick={() =>
                                                setPagina(numero)
                                            }
                                        >

                                            {numero}

                                        </button>

                                    ))}

                                    <button
                                        type="button"

                                        disabled={
                                            paginaAtual === totalPaginas
                                        }

                                        aria-label="Próxima página"

                                        onClick={() =>

                                            setPagina(
                                                paginaAtual + 1
                                            )

                                        }
                                    >

                                        {">"}

                                    </button>

                                </div>

                            )}

                        </>

                    )}

                </section>

            </main>

        </div>

    );

}

export default NotasFiscais;