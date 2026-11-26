import "./Notasfiscais.css";
import { useSearchParams } from "react-router-dom";

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

    const [searchParams, setSearchParams] = useSearchParams();

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
    const dialogRef = useRef(null);
    const montadoRef = useRef(false);
    const [aba, setAba] = useState("notas");
    const [modal, setModal] = useState(false);
    const [fila, setFila] = useState([]);
    const [arrastando, setArrastando] = useState(false);
    const [progresso, setProgresso] = useState({ atual: 0, total: 0 });
    const [excluindoXml, setExcluindoXml] = useState(null);
    const acessoRef = useRef(false);
    acessoRef.current = acessoLiberado && podeImportarXml;

    useEffect(() => {
        montadoRef.current = true;
        return () => { montadoRef.current = false; };
    }, []);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (modal && dialog && !dialog.open) dialog.showModal();
        if (!modal && dialog?.open) dialog.close();
    }, [modal, acessoLiberado, podeImportarXml]);

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
        setFila([]);
        setModal(false);
        setAba("notas");
        setProgresso({ atual: 0, total: 0 });

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

    function selecionarArquivos(lista) {
        if (!acessoRef.current || operacaoRef.current) return;
        const erros = [];
        const novos = [];
        const chaves = new Set(fila.map(item => item.chave));
        for (const arquivo of Array.from(lista || [])) {
            const chave = `${arquivo.name}|${arquivo.size}|${arquivo.lastModified}`;
            if (!arquivo.name.toLowerCase().endsWith(".xml") || !arquivo.size || arquivo.size > 5000000) {
                erros.push(`${arquivo.name}: selecione um XML não vazio de até 5 MB.`);
            } else if (chaves.has(chave)) {
                erros.push(`${arquivo.name}: já está na fila.`);
            } else {
                chaves.add(chave);
                novos.push({ id: crypto.randomUUID(), chave, nome: arquivo.name, arquivo, status: "Pendente", detalhe: "" });
            }
        }
        setFila(atual => [...atual, ...novos]);
        setErroImportacao(erros.join(" "));
        setMensagemImportacao("");
        if (inputArquivoRef.current) inputArquivoRef.current.value = "";
    }

    function sessaoValida() {
        return montadoRef.current && localStorage.getItem("token") === token;
    }

    async function importarXml() {
        if (!acessoRef.current || operacaoRef.current) return;
        const pendentes = fila.filter(item => item.arquivo && ["Pendente", "Erro"].includes(item.status));
        if (!pendentes.length) return;
        operacaoRef.current = true;
        setImportando(true);
        setErroImportacao("");
        setMensagemImportacao("");
        setProgresso({ atual: 0, total: pendentes.length });
        let sucessos = 0;
        let falhas = 0;
        let atual = 0;
        const atualizarItem = (id, dados) => {
            if (sessaoValida() && acessoRef.current) setFila(lista => lista.map(item => item.id === id ? { ...item, ...dados } : item));
        };
        try {
            for (const item of pendentes) {
                if (!sessaoValida() || !acessoRef.current) break;
                atualizarItem(item.id, { status: "Enviando", detalhe: "" });
                try {
                    const body = new FormData();
                    body.append("arquivo", item.arquivo, item.nome);
                    const resposta = await requisicaoApi("/api/NotasFiscais/upload", { method: "POST", body });
                    sucessos++;
                    atualizarItem(item.id, { status: "Importado", arquivo: null, detalhe: resposta?.mensagem || "Importado com sucesso." });
                } catch (error) {
                    falhas++;
                    atualizarItem(item.id, { status: "Erro", detalhe: error.message || "Não foi possível importar o XML." });
                }
                atual++;
                if (sessaoValida() && acessoRef.current) setProgresso({ atual, total: pendentes.length });
            }
            if (sessaoValida() && acessoRef.current) {
                setPagina(1);
                if (sucessos) await carregarNotas();
                if (!sessaoValida() || !acessoRef.current) return;
                setMensagemImportacao(sucessos ? `${sucessos} arquivo(s) importado(s).` : "");
                setErroImportacao(falhas ? `${falhas} arquivo(s) com erro. Confira a fila e tente novamente.` : "");
            }
        } finally {
            operacaoRef.current = false;
            if (montadoRef.current) setImportando(false);
        }
    }

    async function excluirXml(nota) {
        if (!acessoLiberado || !podeImportarXml || !podeExcluir || operacaoRef.current) return;
        const id = obterIdNota(nota);
        if (!id || !window.confirm("Excluir o XML armazenado? O registro da nota fiscal será preservado.")) return;
        operacaoRef.current = true;
        setExcluindoXml(id);
        setErroImportacao("");
        setMensagemImportacao("");
        try {
            await requisicaoApi(`/api/NotasFiscais/${id}/xml`, { method: "DELETE" });
            if (!sessaoValida()) return;
            setMensagemImportacao("XML excluído. A nota fiscal foi preservada.");
            await carregarNotas();
        } catch (error) {
            if (sessaoValida()) setErroImportacao(error.message || "Não foi possível excluir o XML.");
        } finally {
            operacaoRef.current = false;
            if (montadoRef.current) setExcluindoXml(null);
        }
    }

    function fecharModal() {
        if (operacaoRef.current) return;
        setArrastando(false);
        setModal(false);
    }

    function tamanhoXml(bytes) {
        if (bytes == null) return "—";
        return bytes >= 1000000 ? `${(bytes / 1000000).toFixed(1)} MB` : `${Math.max(1, Math.ceil(bytes / 1000))} KB`;
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

            if (sessaoValida()) alert(error.message || "Não foi possível arquivar a nota.");

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

        importando || arquivando !== null || excluindoXml !== null;

    // Abre o modal quando o acesso vem do Dashboard ou da rota antiga.
    useEffect(() => {
        if (
            !token ||
            !acessoLiberado ||
            !podeImportarXml ||
            operacaoEmAndamento ||
            searchParams.get("importar") !== "xml"
        ) return;

        setModal(true);

        // Consome o parâmetro para não reabrir o modal ao fechá-lo.
        const proximos = new URLSearchParams(searchParams);
        proximos.delete("importar");
        setSearchParams(proximos, { replace: true });
    }, [token, acessoLiberado, podeImportarXml, operacaoEmAndamento, searchParams, setSearchParams]);

    const xmls = acessoLiberado ? notas.filter(nota => nota.possuiXml ?? nota.PossuiXml ?? false) : [];
    const nomeXml = nota => nota.nomeArquivo ?? nota.NomeArquivo ?? `nfe_${nota.numero || obterIdNota(nota)}.xml`;
    const xmlsFiltrados = xmls.filter(nota => normalizarTexto(`${nomeXml(nota)} ${obterCnpjDestinatario(nota)} ${nota.chaveAcesso || ""}`).includes(normalizarTexto(pesquisa)));
    const quantidadeFila = fila.filter(item => item.arquivo && ["Pendente", "Erro"].includes(item.status)).length;
    const pendencias = notas.filter(nota => ["PENDENTE", "PROCESSANDO", "ERRO", "REJEITADA"].includes(normalizarStatus(nota.status))).length;

    function mudarAba(valor) {
        setAba(valor);
        setPesquisa("");
        setPagina(1);
    }

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
                    <p className="nf-subtitulo">Central de documentos e arquivos fiscais.</p>

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

                            <div className="nf-resumo" aria-label="Resumo dos documentos">
                                <div><strong>{carregandoLista || erro ? "—" : notas.length}</strong><span>Notas fiscais</span></div>
                                <div><strong>{carregandoLista || erro ? "—" : xmls.length}</strong><span>XMLs armazenados</span></div>
                                <div><strong>{carregandoLista || erro ? "—" : pendencias}</strong><span>Pendências e erros</span></div>
                            </div>
                            <div className="nf-barra">
                                <div className="nf-abas" aria-label="Documentos fiscais">
                                    <button type="button" aria-pressed={aba === "notas"} onClick={() => mudarAba("notas")}>Notas fiscais</button>
                                    <button type="button" aria-pressed={aba === "xml"} onClick={() => mudarAba("xml")}>Arquivos XML</button>
                                </div>
                                {podeImportarXml && <button type="button" className="botao-importar-xml" disabled={operacaoEmAndamento} onClick={() => setModal(true)}>+ Importar XML{quantidadeFila ? ` (${quantidadeFila})` : ""}</button>}
                            </div>
                            {!modal && mensagemImportacao && <div className="mensagem-importacao sucesso" role="status">{mensagemImportacao}</div>}
                            {!modal && erroImportacao && <div className="mensagem-importacao falha" role="alert">{erroImportacao}</div>}
                            {podeImportarXml && <dialog ref={dialogRef} className="nf-dialog" aria-labelledby="nf-modal-titulo" onCancel={event => { event.preventDefault(); fecharModal(); }}>
                                <div className="nf-dialog-topo">
                                    <div><h2 id="nf-modal-titulo">Importar arquivos XML</h2><p>Selecione os documentos e acompanhe o processamento.</p></div>
                                    <button type="button" className="nf-fechar" aria-label="Fechar importação" disabled={operacaoEmAndamento} onClick={fecharModal}>×</button>
                                </div>
                                <input ref={inputArquivoRef} type="file" accept=".xml,application/xml,text/xml" multiple hidden disabled={operacaoEmAndamento} onChange={event => selecionarArquivos(event.target.files)} />
                                <div className={`nf-upload ${arrastando ? "nf-arrastando" : ""}`} onDragOver={event => { event.preventDefault(); if (!operacaoEmAndamento) setArrastando(true); }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setArrastando(false); }} onDrop={event => { event.preventDefault(); setArrastando(false); selecionarArquivos(event.dataTransfer.files); }}>
                                    <div><strong>{arrastando ? "Solte os arquivos aqui" : "Arraste e solte seus XMLs"}</strong><small>Até 5 MB por arquivo · Seleção múltipla</small></div>
                                    <button type="button" className="botao-buscar-notas" disabled={operacaoEmAndamento} onClick={() => inputArquivoRef.current?.click()}>Selecionar</button>
                                </div>
                                {mensagemImportacao && <div className="mensagem-importacao sucesso" role="status">{mensagemImportacao}</div>}
                                {erroImportacao && <div className="mensagem-importacao falha" role="alert">{erroImportacao}</div>}
                                {importando && <div className="nf-progresso" role="status"><span>Processados: {progresso.atual} de {progresso.total}</span><progress aria-label="Arquivos processados" max={progresso.total || 1} value={progresso.atual}/></div>}
                                <div className="nf-fila" aria-label="Fila de importação">
                                    {!fila.length && <p className="nf-vazio">Nenhum arquivo selecionado.</p>}
                                    {fila.map(item => <div className="nf-arquivo" key={item.id}>
                                        <div><strong>{item.nome}</strong>{item.detalhe && <small>{item.detalhe}</small>}</div>
                                        <span className={`nf-status nf-${item.status.toLowerCase()}`}>{item.status}</span>
                                        <button type="button" className="nf-fechar" aria-label={`Remover ${item.nome} da fila`} disabled={operacaoEmAndamento} onClick={() => setFila(lista => lista.filter(x => x.id !== item.id))}>×</button>
                                    </div>)}
                                </div>
                                <div className="nf-dialog-rodape"><button type="button" className="botao-limpar-notas" disabled={operacaoEmAndamento} onClick={fecharModal}>Fechar</button><button type="button" className="botao-importar-xml" disabled={operacaoEmAndamento || !quantidadeFila} onClick={importarXml}>{importando ? "Importando..." : `Importar arquivos (${quantidadeFila})`}</button></div>
                            </dialog>}
                            {aba === "xml" ? <div className="nf-xml-painel">
                                <div className="pesquisa-lista-notas"><input type="search" aria-label="Pesquisar XMLs armazenados" placeholder="Buscar arquivo, chave ou CNPJ..." value={pesquisa} onChange={event => alterarPesquisa(event.target.value)}/></div>
                                <div className="nf-xml-lista">
                                    <div className="nf-xml-titulo">Arquivos armazenados <span>{carregandoLista || erro ? "—" : xmlsFiltrados.length}</span></div>
                                    {carregandoLista ? <p className="nf-vazio" role="status">Carregando arquivos...</p> : erro ? <div className="nf-vazio" role="alert">{erro} <button type="button" className="botao-buscar-notas" onClick={carregarNotas}>Tentar novamente</button></div> : !xmlsFiltrados.length ? <p className="nf-vazio">Nenhum XML encontrado.</p> : xmlsFiltrados.map(nota => <div className="nf-arquivo nf-armazenado" key={obterIdNota(nota)}>
                                        <div><strong>{nomeXml(nota)}</strong><small>{formatarCnpj(obterCnpjDestinatario(nota))} · {tamanhoXml(nota.tamanhoArquivo ?? nota.TamanhoArquivo)}</small></div>
                                        <span className="nf-status nf-importado">Armazenado</span>
                                        {podeImportarXml && podeExcluir && <button type="button" className="botao-excluir-nota" title="Excluir somente o XML" aria-label={`Excluir XML ${nomeXml(nota)}`} disabled={operacaoEmAndamento} onClick={() => excluirXml(nota)}><img src={Lixeira} alt=""/></button>}
                                    </div>)}
                                </div>
                            </div> : <>
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

                            </>}
                        </>

                    )}

                </section>

            </main>

        </div>

    );

}

export default NotasFiscais;