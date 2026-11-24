import {
    useEffect,
    useRef,
    useState,
    useCallback
} from "react";

import { useNavigate } from "react-router-dom";
import { requisicaoApi } from "../../services/api";

import usePermissoes from "../../hooks/usePermissoes";
import usePesquisaLayout from "../../hooks/usePesquisaLayout";

import "./Envioarquivoxml.css";

import Lixeira from "../../assets/Icones/Lixeira.png";
import ArquivoDashboard from "../../assets/Icones/ArquivoDashboard.png";
import Upload from "../../assets/Icones/UploadBranco.png";
import UploadPreto from "../../assets/Icones/Upload.png";

const API_UPLOAD = "/api/NotasFiscais/upload";
const API_NOTAS = "/api/NotasFiscais";
const LIMITE_ARQUIVO = 5_000_000;

// =========================================
// FORMATAR TAMANHO
// =========================================

function formatarTamanho(bytes) {

    if (bytes == null) return "—";

    if (bytes >= 1_000_000) {

        return `${(bytes / 1_000_000).toFixed(1)} MB`;

    }

    return `${Math.max(1, Math.ceil(bytes / 1000))} KB`;

}

// =========================================
// NORMALIZAR TEXTO
// =========================================

function normalizarTexto(texto) {

    return String(texto ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}

export default function EnvioArquivoXML() {

    const navigate = useNavigate();

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

    const podeImportar =
        autenticado &&
        temPermissao("nota.importar");

    const podeConsultar =
        autenticado &&
        (
            temPermissao("nota.ler.todas") ||
            temPermissao("nota.ler.proprias")
        );

    const podeExcluirXml =
        autenticado &&
        temPermissao("nota.arquivar");

    const acessoLiberado =
        podeImportar &&
        !carregandoPermissoes &&
        !erroPermissoes;

    // =========================================
    // ESTADOS
    // =========================================

    const [carregandoArquivos, setCarregandoArquivos] =
        useState(true);

    const [arquivos, setArquivos] =
        useState([]);

    const [arrastando, setArrastando] =
        useState(false);

    const [mensagem, setMensagem] =
        useState("");

    const [tipoMensagem, setTipoMensagem] =
        useState("erro");

    const [erroConsulta, setErroConsulta] =
        useState("");

    const [pesquisa, setPesquisa] =
        useState("");

    const [enviando, setEnviando] =
        useState(false);

    const [excluindo, setExcluindo] =
        useState(null);

    const [progresso, setProgresso] =
        useState({
            atual: 0,
            total: 0
        });

    // =========================================
    // REFERÊNCIAS
    // =========================================

    const inputRef = useRef(null);

    const operacaoRef = useRef(false);

    const requisicaoAtualRef = useRef(0);

    const montadoRef = useRef(false);

    const token =
        localStorage.getItem("token");

    const sessaoRef = useRef(token);

    sessaoRef.current = token;

    const acessoRef = useRef(acessoLiberado);

    acessoRef.current = acessoLiberado;

    useEffect(() => {

        montadoRef.current = true;

        return () => {

            montadoRef.current = false;

        };

    }, []);

    function sessaoValida() {

        return (
            montadoRef.current &&
            sessaoRef.current === token &&
            localStorage.getItem("token") === token
        );

    }

    // =========================================
    // PESQUISA DO LAYOUT
    // =========================================

    usePesquisaLayout(
        pesquisa,
        setPesquisa
    );

    // =========================================
    // MENSAGENS
    // =========================================

    function mostrarMensagem(
        texto,
        tipo = "erro"
    ) {

        setMensagem(texto);
        setTipoMensagem(tipo);

    }

    // =========================================
    // CONSULTAR XMLs ARMAZENADOS
    // =========================================

    const carregarArquivosEnviados =
        useCallback(async () => {

            const numeroRequisicao =
                ++requisicaoAtualRef.current;

            if (
                !acessoLiberado ||
                !podeConsultar ||
                localStorage.getItem("token") !== token
            ) {

                setArquivos(atuais =>
                    atuais.filter(
                        arquivo => !arquivo.armazenado
                    )
                );

                setCarregandoArquivos(false);

                return false;

            }

            try {

                setCarregandoArquivos(true);
                setErroConsulta("");

                const notas = await requisicaoApi(
                    API_NOTAS
                );

                if (
                    numeroRequisicao !==
                    requisicaoAtualRef.current ||
                    localStorage.getItem("token") !== token
                ) {

                    return false;

                }

                if (!Array.isArray(notas)) {

                    throw new Error(
                        "A API retornou uma listagem inválida."
                    );

                }

                const arquivosEnviados = notas

                    .filter(nota =>

                        nota.possuiXml ??
                        nota.PossuiXml ??
                        false

                    )

                    .map(nota => {

                        const id =
                            nota.notaFiscalId ??
                            nota.NotaFiscalId;

                        const numero =
                            nota.numero ??
                            nota.Numero ??
                            "";

                        const nome =
                            nota.nomeArquivo ??
                            nota.NomeArquivo;

                        const tamanho =
                            nota.tamanhoArquivo ??
                            nota.TamanhoArquivo ??
                            null;

                        return {

                            id,

                            nome:
                                nome ||
                                `nfe_${numero || id}.xml`,

                            tamanho:
                                formatarTamanho(tamanho),

                            status: "Importado",

                            notaFiscalId: id,

                            arquivoOriginal: null,

                            armazenado: true,

                            detalhe:
                                "XML importado e armazenado no sistema."

                        };

                    })

                    .filter(arquivo => arquivo.id);

                const idsArmazenados = new Set(

                    arquivosEnviados.map(
                        arquivo =>
                            String(
                                arquivo.notaFiscalId
                            ).toLowerCase()
                    )

                );

                setArquivos(atuais => {

                    const locais = atuais.filter(
                        arquivo =>

                            !arquivo.armazenado &&

                            (
                                !arquivo.notaFiscalId ||

                                !idsArmazenados.has(
                                    String(
                                        arquivo.notaFiscalId
                                    ).toLowerCase()
                                )
                            )

                    );

                    return [
                        ...arquivosEnviados,
                        ...locais
                    ];

                });

                return true;

            } catch (erro) {

                if (
                    numeroRequisicao !==
                    requisicaoAtualRef.current
                ) {

                    return false;

                }

                console.error(
                    "Erro ao carregar XMLs:",
                    erro
                );

                setErroConsulta(

                    erro.message ||

                    "Não foi possível consultar os XMLs enviados."

                );

                return false;

            } finally {

                if (
                    numeroRequisicao ===
                    requisicaoAtualRef.current
                ) {

                    setCarregandoArquivos(false);

                }

            }

        }, [
            acessoLiberado,
            podeConsultar,
            token
        ]);

    useEffect(() => {

        setArquivos([]);

        setMensagem("");
        setErroConsulta("");
        setPesquisa("");

    }, [token]);

    useEffect(() => {

        carregarArquivosEnviados();

        return () => {

            requisicaoAtualRef.current += 1;

        };

    }, [carregarArquivosEnviados]);

    // =========================================
    // SELECIONAR ARQUIVOS
    // =========================================

    function selecionarArquivos(lista) {

        if (
            !acessoLiberado ||
            operacaoRef.current
        ) {

            return;

        }

        setMensagem("");

        const selecionados =
            Array.from(lista || []);

        const validos = [];
        const erros = [];

        // Identifica arquivos já selecionados
        // para evitar duplicações na fila.

        const chavesExistentes = new Set(

            arquivos

                .filter(
                    item => item.arquivoOriginal
                )

                .map(item => {

                    const arquivo =
                        item.arquivoOriginal;

                    return (

                        `${arquivo.name}|` +

                        `${arquivo.size}|` +

                        `${arquivo.lastModified}`

                    );

                })

        );

        selecionados.forEach(arquivo => {

            // VALIDAR EXTENSÃO

            if (
                !arquivo.name
                    .toLowerCase()
                    .endsWith(".xml")
            ) {

                erros.push(
                    `${arquivo.name}: formato inválido.`
                );

                return;

            }

            // VALIDAR ARQUIVO VAZIO

            if (arquivo.size === 0) {

                erros.push(
                    `${arquivo.name}: arquivo vazio.`
                );

                return;

            }

            // VALIDAR TAMANHO

            if (arquivo.size > LIMITE_ARQUIVO) {

                erros.push(
                    `${arquivo.name}: ultrapassa 5 MB.`
                );

                return;

            }

            // EVITAR DUPLICAÇÃO LOCAL

            const chave =

                `${arquivo.name}|` +

                `${arquivo.size}|` +

                `${arquivo.lastModified}`;

            if (chavesExistentes.has(chave)) {

                erros.push(
                    `${arquivo.name}: já está na fila.`
                );

                return;

            }

            chavesExistentes.add(chave);

            validos.push({

                id: crypto.randomUUID(),

                nome: arquivo.name,

                tamanho:
                    formatarTamanho(arquivo.size),

                arquivoOriginal: arquivo,

                notaFiscalId: null,

                armazenado: false,

                status: "Pendente",

                detalhe: ""

            });

        });

        if (validos.length > 0) {

            setArquivos(atuais => [

                ...atuais,

                ...validos

            ]);

        }

        if (erros.length > 0) {

            mostrarMensagem(
                erros.join(" ")
            );

        } else if (validos.length > 0) {

            mostrarMensagem(

                `${validos.length} arquivo(s) selecionado(s). Clique em Enviar para importar.`,

                "sucesso"

            );

        }

        if (inputRef.current) {

            inputRef.current.value = "";

        }

    }

    // =========================================
    // ATUALIZAR ARQUIVO
    // =========================================

    function atualizarArquivo(
        id,
        alteracoes
    ) {

        if (!sessaoValida()) return;

        setArquivos(atuais =>

            atuais.map(arquivo =>

                arquivo.id === id

                    ? {
                        ...arquivo,
                        ...alteracoes
                    }

                    : arquivo

            )

        );

    }

    // =========================================
    // ENVIAR XMLs
    // =========================================

    async function enviarArquivos() {

        if (

            !acessoLiberado ||

            operacaoRef.current

        ) {

            return;

        }

        const pendentes = arquivos.filter(

            arquivo =>

                arquivo.arquivoOriginal &&

                (
                    arquivo.status === "Pendente" ||

                    arquivo.status === "Erro"
                )

        );

        if (pendentes.length === 0) {

            mostrarMensagem(

                "Não há arquivos pendentes para enviar."

            );

            return;

        }

        operacaoRef.current = true;

        setEnviando(true);
        setMensagem("");

        setProgresso({

            atual: 0,

            total: pendentes.length

        });

        let sucessos = 0;
        let falhas = 0;
        let processados = 0;

        try {

            // A API recebe um IFormFile.
            // Por isso, cada XML é enviado
            // individualmente.

            for (const item of pendentes) {

                if (
                    !sessaoValida() ||
                    !acessoRef.current
                ) {

                    break;

                }

                atualizarArquivo(item.id, {

                    status: "Enviando",

                    detalhe: ""

                });

                const formData =
                    new FormData();

                formData.append(

                    "arquivo",

                    item.arquivoOriginal,

                    item.nome

                );

                try {

                    const resposta =
                        await requisicaoApi(

                            API_UPLOAD,

                            {

                                method: "POST",

                                body: formData

                            }

                        );

                    if (!sessaoValida()) {

                        break;

                    }

                    const notaFiscalId =

                        resposta?.notaFiscalId ??

                        resposta?.NotaFiscalId ??

                        null;

                    atualizarArquivo(item.id, {

                        status: "Importado",

                        notaFiscalId,

                        arquivoOriginal: null,

                        armazenado: false,

                        detalhe:

                            resposta?.mensagem ||

                            "Nota fiscal importada com sucesso."

                    });

                    sucessos++;

                } catch (erro) {

                    if (!sessaoValida()) {

                        break;

                    }

                    console.error(

                        `Erro ao importar ${item.nome}:`,

                        erro

                    );

                    atualizarArquivo(item.id, {

                        status: "Erro",

                        detalhe:

                            erro.message ||

                            "Não foi possível importar o XML."

                    });

                    falhas++;

                }

                processados++;

                setProgresso({

                    atual: processados,

                    total: pendentes.length

                });

            }

            if (!sessaoValida()) {

                return;

            }

            if (sucessos > 0 && podeConsultar) {

                await carregarArquivosEnviados();

            }

            if (!sessaoValida()) {

                return;

            }

            if (processados < pendentes.length) {

                mostrarMensagem(

                    `Envio interrompido. ${sucessos} importado(s), ${falhas} com erro.`

                );

            } else if (falhas === 0) {

                mostrarMensagem(

                    `${sucessos} arquivo(s) importado(s) com sucesso!`,

                    "sucesso"

                );

            } else {

                mostrarMensagem(

                    `${sucessos} arquivo(s) importado(s). ` +

                    `${falhas} arquivo(s) apresentaram erro.`

                );

            }

        } finally {

            operacaoRef.current = false;

            if (montadoRef.current) {

                setEnviando(false);

            }

        }

    }

    // =========================================
    // REMOVER OU EXCLUIR XML
    // =========================================

    async function excluirArquivo(item) {

        if (

            !acessoLiberado ||

            operacaoRef.current

        ) {

            return;

        }

        // Arquivo ainda não importado:
        // remove somente da fila local.

        if (item.arquivoOriginal) {

            setArquivos(atuais =>

                atuais.filter(

                    arquivo =>
                        arquivo.id !== item.id

                )

            );

            return;

        }

        // Arquivo importado:
        // exige permissão adicional.

        if (
            !podeConsultar ||
            !podeExcluirXml ||
            !item.notaFiscalId
        ) {

            return;

        }

        const confirmar = window.confirm(

            "Deseja excluir o XML enviado? " +

            "O registro da nota fiscal será preservado."

        );

        if (!confirmar) return;

        try {

            operacaoRef.current = true;

            setExcluindo(item.id);

            await requisicaoApi(

                `${API_NOTAS}/${item.notaFiscalId}/xml`,

                {
                    method: "DELETE"
                }

            );

            if (!sessaoValida()) {

                return;

            }

            setArquivos(atuais =>

                atuais.filter(

                    arquivo =>

                        !arquivo.notaFiscalId ||

                        String(
                            arquivo.notaFiscalId
                        ).toLowerCase() !==

                        String(
                            item.notaFiscalId
                        ).toLowerCase()

                )

            );

            mostrarMensagem(

                "Exclusão do XML concluída. A nota fiscal foi preservada.",

                "sucesso"

            );

        } catch (erro) {

            console.error(
                "Erro ao excluir XML:",
                erro
            );

            if (sessaoValida()) {

                mostrarMensagem(

                    erro.message ||

                    "Não foi possível excluir o XML."

                );

            }

        } finally {

            operacaoRef.current = false;

            if (montadoRef.current) {

                setExcluindo(null);

            }

        }

    }

    // =========================================
    // FILTRAR ARQUIVOS
    // =========================================

    const arquivosVisiveis = arquivos.filter(

        arquivo =>

            podeConsultar ||

            !arquivo.armazenado

    );

    const arquivosFiltrados =
        arquivosVisiveis.filter(arquivo => {

            const texto =
                normalizarTexto(pesquisa);

            return (

                normalizarTexto(
                    arquivo.nome
                ).includes(texto) ||

                normalizarTexto(
                    arquivo.status
                ).includes(texto)

            );

        });

    // =========================================
    // CONTAGENS
    // =========================================

    const quantidadePendentes =
        arquivosVisiveis.filter(

            arquivo =>

                arquivo.arquivoOriginal &&

                (
                    arquivo.status === "Pendente" ||

                    arquivo.status === "Erro"
                )

        ).length;

    const possuiPendentes =
        quantidadePendentes > 0;

    const operacaoEmAndamento =

        enviando ||

        excluindo !== null;

    const percentualProgresso =
        progresso.total > 0

            ? Math.round(

                (
                    progresso.atual /
                    progresso.total
                ) * 100

            )

            : 0;

    // =========================================
    // CLASSE DO STATUS
    // =========================================

    function classeStatus(status) {

        switch (status) {

            case "Importado":

                return "xml-status-validado";

            case "Erro":

                return "xml-status-erro";

            case "Enviando":

                return "xml-status-enviando";

            default:

                return "xml-status-pendente";

        }

    }

    // =========================================
    // PERMISSÃO DE EXCLUSÃO
    // =========================================

    function podeRemoverArquivo(item) {

        return Boolean(

            item.arquivoOriginal ||

            (
                podeConsultar &&
                podeExcluirXml &&
                item.notaFiscalId
            )

        );

    }

    // =========================================
    // VOLTAR
    // =========================================

    function voltar() {

        navigate(

            podeConsultar

                ? "/notas-fiscais"

                : "/home"

        );

    }

    // =========================================
    // RENDERIZAÇÃO
    //
    // Sidebar e Header são fornecidos
    // exclusivamente pelo LayoutSistema.
    // =========================================

    return (

        <div className="xml-pagina">

            <main className="xml-principal">

                <section className="xml-conteudo">

                    <button
                        type="button"

                        className="xml-botao-voltar"

                        onClick={voltar}

                        disabled={operacaoEmAndamento}

                        title="Voltar"
                    >

                        ← Voltar

                    </button>

                    <h1>

                        Enviar arquivo XML

                    </h1>

                    {/* CARREGANDO PERMISSÕES */}

                    {carregandoPermissoes ? (

                        <p role="status">

                            Carregando permissões...

                        </p>

                    ) : erroPermissoes ? (

                        <div
                            className="xml-mensagem xml-mensagem-erro"

                            role="alert"
                        >

                            <p>

                                Não foi possível carregar
                                suas permissões.

                            </p>

                            <button
                                type="button"

                                className="xml-botao-enviar"

                                onClick={atualizar}
                            >

                                Tentar novamente

                            </button>

                        </div>

                    ) : !podeImportar ? (

                        <div
                            className="xml-mensagem xml-mensagem-erro"

                            role="alert"
                        >

                            <p>

                                Você não possui permissão
                                para importar arquivos XML.

                            </p>

                            <button
                                type="button"

                                className="xml-botao-enviar"

                                onClick={() =>
                                    navigate("/home")
                                }
                            >

                                Voltar ao início

                            </button>

                        </div>

                    ) : (

                        <>

                            {/* INPUT DE ARQUIVOS */}

                            <input
                                ref={inputRef}

                                className="xml-input-arquivo"

                                type="file"

                                accept=".xml,application/xml,text/xml"

                                multiple

                                disabled={
                                    operacaoEmAndamento
                                }

                                onChange={event =>

                                    selecionarArquivos(
                                        event.target.files
                                    )

                                }
                            />

                            {/* ÁREA DE ENVIO */}

                            <div className="xml-area-superior">

                                <button
                                    type="button"

                                    className="xml-botao-selecionar"

                                    disabled={
                                        operacaoEmAndamento
                                    }

                                    onClick={() =>

                                        inputRef.current?.click()

                                    }
                                >

                                    <img
                                        src={Upload}
                                        alt=""
                                    />

                                    <span>

                                        Envie um arquivo XML

                                    </span>

                                </button>

                                {/* ARRASTAR E SOLTAR */}

                                <div
                                    className={`xml-area-soltar ${
                                        arrastando
                                            ? "xml-arrastando"
                                            : ""
                                    }`}

                                    onDragOver={event => {

                                        event.preventDefault();

                                        if (!operacaoEmAndamento) {

                                            setArrastando(true);

                                        }

                                    }}

                                    onDragLeave={() =>
                                        setArrastando(false)
                                    }

                                    onDrop={event => {

                                        event.preventDefault();

                                        setArrastando(false);

                                        if (!operacaoEmAndamento) {

                                            selecionarArquivos(

                                                event.dataTransfer.files

                                            );

                                        }

                                    }}

                                    onClick={() => {

                                        if (!operacaoEmAndamento) {

                                            inputRef.current?.click();

                                        }

                                    }}

                                    role="button"

                                    aria-label="Selecionar arquivos XML"

                                    aria-disabled={
                                        operacaoEmAndamento
                                    }

                                    tabIndex={
                                        operacaoEmAndamento
                                            ? -1
                                            : 0
                                    }

                                    onKeyDown={event => {

                                        if (

                                            !operacaoEmAndamento &&

                                            (
                                                event.key === "Enter" ||

                                                event.key === " "
                                            )

                                        ) {

                                            event.preventDefault();

                                            inputRef.current?.click();

                                        }

                                    }}
                                >

                                    <strong>

                                        Ou solte seu documento aqui

                                    </strong>

                                    <img
                                        src={UploadPreto}
                                        alt=""
                                    />

                                    <span>

                                        Tamanho máximo de 5 MB

                                    </span>

                                    <span>

                                        Formato: XML

                                    </span>

                                    <span>

                                        Aceita múltiplos arquivos

                                    </span>

                                </div>

                            </div>

                            {/* MENSAGENS */}

                            {mensagem && (

                                <p
                                    className={`xml-mensagem ${
                                        tipoMensagem === "sucesso"

                                            ? "xml-mensagem-sucesso"

                                            : "xml-mensagem-erro"
                                    }`}

                                    role={
                                        tipoMensagem === "sucesso"

                                            ? "status"

                                            : "alert"
                                    }
                                >

                                    {mensagem}

                                </p>

                            )}

                            {/* ERRO DE CONSULTA */}

                            {erroConsulta && (

                                <div
                                    className="xml-mensagem xml-mensagem-erro"

                                    role="alert"
                                >

                                    <p>{erroConsulta}</p>

                                    <button
                                        type="button"

                                        className="xml-botao-enviar"

                                        onClick={
                                            carregarArquivosEnviados
                                        }

                                        disabled={
                                            operacaoEmAndamento
                                        }
                                    >

                                        Tentar novamente

                                    </button>

                                </div>

                            )}

                            {/* PROGRESSO DO ENVIO */}

                            {enviando && (

                                <div className="xml-progresso">

                                    <div className="xml-progresso-info">

                                        <span>

                                            Processando arquivos:

                                            {" "}

                                            {progresso.atual}

                                            {" de "}

                                            {progresso.total}

                                        </span>

                                        <strong>

                                            {percentualProgresso}%

                                        </strong>

                                    </div>

                                    <progress
                                        className="xml-progresso-barra"
                                        max={progresso.total || 1}
                                        value={progresso.atual}
                                        aria-label="Progresso do envio de XML"
                                    />

                                </div>

                            )}

                            {/* PESQUISA */}

                            <div className="xml-pesquisa">

                                <input
                                    type="search"

                                    placeholder="Buscar arquivo por nome ou status..."

                                    aria-label="Pesquisar arquivos XML"

                                    value={pesquisa}

                                    onChange={event =>

                                        setPesquisa(
                                            event.target.value
                                        )

                                    }
                                />

                            </div>

                            {/* LISTA DE ARQUIVOS */}

                            <div className="xml-lista">

                                <div className="xml-lista-titulo">

                                    Arquivos XML

                                    <span>

                                        ({arquivosFiltrados.length})

                                    </span>

                                </div>

                                {carregandoArquivos &&
                                    podeConsultar && (

                                    <p
                                        className="xml-lista-vazia"

                                        role="status"
                                    >

                                        Consultando XMLs enviados...

                                    </p>

                                )}

                                {arquivosFiltrados.length > 0 ? (

                                    arquivosFiltrados.map(item => (

                                        <div
                                            key={item.id}

                                            className="xml-arquivo"
                                        >

                                            {/* NOME */}

                                            <div className="xml-arquivo-nome">

                                                <img
                                                    src={ArquivoDashboard}
                                                    alt=""
                                                />

                                                <span title={item.nome}>

                                                    {item.nome}

                                                </span>

                                            </div>

                                            {/* TAMANHO */}

                                            <span className="xml-arquivo-tamanho">

                                                {item.tamanho}

                                            </span>

                                            {/* STATUS */}

                                            <span
                                                className={`xml-status ${
                                                    classeStatus(item.status)
                                                }`}

                                                title={item.detalhe}
                                            >

                                                {item.status}

                                            </span>

                                            {/* EXCLUIR */}

                                            {podeRemoverArquivo(item) ? (

                                                <button
                                                    type="button"

                                                    className="xml-botao-excluir"

                                                    title={

                                                        item.arquivoOriginal

                                                            ? "Remover da lista"

                                                            : "Excluir XML, preservando a nota"

                                                    }

                                                    aria-label={

                                                        item.arquivoOriginal

                                                            ? "Remover arquivo da lista"

                                                            : "Excluir XML armazenado"

                                                    }

                                                    disabled={
                                                        operacaoEmAndamento
                                                    }

                                                    onClick={() =>

                                                        excluirArquivo(item)

                                                    }
                                                >

                                                    <img
                                                        src={Lixeira}
                                                        alt=""
                                                    />

                                                </button>

                                            ) : (

                                                <span />

                                            )}

                                            {/* DETALHES DO ERRO */}

                                            {item.status === "Erro" &&
                                                item.detalhe && (

                                                <p className="xml-arquivo-erro">

                                                    {item.detalhe}

                                                </p>

                                            )}

                                        </div>

                                    ))

                                ) : !carregandoArquivos && (

                                    <p className="xml-lista-vazia">

                                        Nenhum arquivo encontrado.

                                    </p>

                                )}

                            </div>

                            {/* QUANTIDADE DE PENDENTES */}

                            {possuiPendentes && (

                                <p className="xml-total-pendentes">

                                    {quantidadePendentes}

                                    {" "}

                                    {quantidadePendentes === 1

                                        ? "arquivo aguardando envio"

                                        : "arquivos aguardando envio"

                                    }

                                </p>

                            )}

                            {/* BOTÃO ENVIAR */}

                            <div className="xml-rodape">

                                <button
                                    type="button"

                                    className="xml-botao-enviar"

                                    onClick={enviarArquivos}

                                    disabled={

                                        operacaoEmAndamento ||

                                        !possuiPendentes

                                    }
                                >

                                    {enviando

                                        ? "Enviando..."

                                        : "Enviar"

                                    }

                                </button>

                            </div>

                        </>

                    )}

                </section>

            </main>

        </div>

    );

}