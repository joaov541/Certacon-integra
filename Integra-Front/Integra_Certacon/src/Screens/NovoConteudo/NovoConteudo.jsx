import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { requisicaoApi } from "../../services/api";
import usePermissoes from "../../hooks/usePermissoes";

import "./NovoConteudo.css";

// ÍCONES DO FORMULÁRIO

import iconeUpload from "../../assets/Icones/UploadLaranja.png";

import B_EstiloTexto from "../../assets/Icones/B_EstiloTexto.png";
import I_EstiloTexto from "../../assets/Icones/I_EstiloTexto.png";
import U_EstiloTexto from "../../assets/Icones/U_EstiloTexto.png";

import TextosAlinhadosEsquerda from "../../assets/Icones/TextosAlinhadosEsquerda.png";
import TextoAlinhadoDireita from "../../assets/Icones/TextoAlinhadoDireita.png";
import TextoAlinhadoCentro from "../../assets/Icones/TextoAlinhadoCentro.png";

import ExpandirCinza from "../../assets/Icones/ExpandirCinza.png";

function NovoConteudo() {

    const navigate = useNavigate();
    const { id } = useParams();

    const modoEdicao = Boolean(id);

    // =========================================
    // PERMISSÕES DINÂMICAS
    // =========================================

    const {
        autenticado,
        temPermissao,
        temAlgumaPermissao,
        carregando: carregandoPermissoes,
        erro: erroPermissoes,
        atualizar
    } = usePermissoes();

    const codigoPermissao = modoEdicao
        ? "artigo.editar"
        : "artigo.criar";

    const podeAcessar =
        autenticado &&
        temAlgumaPermissao(codigoPermissao);

    // =========================================
    // ESTADOS DO FORMULÁRIO
    // =========================================

    const [titulo, setTitulo] = useState("");
    const [tema, setTema] = useState("");
    const [conteudo, setConteudo] = useState("");
    const [arquivo, setArquivo] = useState(null);

    const [resumo, setResumo] = useState(null);
    const [visibilidade, setVisibilidade] =
        useState("PUBLICO");

    const [temaOriginal, setTemaOriginal] =
        useState("");

    const [nomeArquivoAtual, setNomeArquivoAtual] =
        useState("");

    // =========================================
    // ESTADOS DE CARREGAMENTO
    // =========================================

    const [temas, setTemas] = useState([]);

    const [carregandoTemas, setCarregandoTemas] =
        useState(true);

    const [carregandoArtigo, setCarregandoArtigo] =
        useState(modoEdicao);

    const [erroTemas, setErroTemas] = useState("");
    const [erroArtigo, setErroArtigo] = useState("");

    const [salvando, setSalvando] = useState(false);

    // =========================================
    // REFERÊNCIAS
    // =========================================

    const areaTextoRef = useRef(null);
    const arquivoRef = useRef(null);

    const htmlInicialRef = useRef("");
    const salvandoRef = useRef(false);

    const token = localStorage.getItem("token");

    // =========================================
    // CARREGAR TEMAS DA API
    // =========================================

    useEffect(() => {

        let ativo = true;

        setTemas([]);
        setErroTemas("");

        if (carregandoPermissoes) {

            setCarregandoTemas(true);
            return;

        }

        if (erroPermissoes || !podeAcessar) {

            setCarregandoTemas(false);
            return;

        }

        async function carregarTemas() {

            try {

                setCarregandoTemas(true);

                const dados = await requisicaoApi(
                    "/api/Temas"
                );

                if (!ativo) return;

                setTemas(
                    Array.isArray(dados)
                        ? dados
                        : []
                );

            } catch (erro) {

                if (!ativo) return;

                console.error(
                    "Erro ao carregar temas:",
                    erro
                );

                setErroTemas(
                    erro.message ||
                    "Não foi possível carregar os temas."
                );

            } finally {

                if (ativo) {
                    setCarregandoTemas(false);
                }

            }

        }

        carregarTemas();

        return () => {
            ativo = false;
        };

    }, [
        token,
        carregandoPermissoes,
        erroPermissoes,
        podeAcessar
    ]);

    // =========================================
    // FILTRAR TEMAS AUTORIZADOS
    // =========================================

    const temasPermitidos = temas.filter(item => {

        const temaId =
            item.temaId ?? item.TemaId;

        const ativo =
            item.ativo ?? item.Ativo ?? true;

        return (
            Boolean(temaId) &&
            ativo !== false &&
            temPermissao(
                codigoPermissao,
                temaId
            )
        );

    });

    // =========================================
    // CARREGAR ARTIGO PARA EDIÇÃO
    // =========================================

    useEffect(() => {

        let ativo = true;

        setTitulo("");
        setTema("");
        setConteudo("");
        setArquivo(null);

        setResumo(null);
        setVisibilidade("PUBLICO");
        setTemaOriginal("");
        setNomeArquivoAtual("");

        setErroArtigo("");

        htmlInicialRef.current = "";

        if (areaTextoRef.current) {
            areaTextoRef.current.innerHTML = "";
        }

        if (arquivoRef.current) {
            arquivoRef.current.value = "";
        }

        if (!modoEdicao) {

            setCarregandoArtigo(false);
            return;

        }

        if (carregandoPermissoes) {

            setCarregandoArtigo(true);
            return;

        }

        if (erroPermissoes || !podeAcessar) {

            setCarregandoArtigo(false);
            return;

        }

        async function carregarArtigo() {

            try {

                setCarregandoArtigo(true);

                // Consulta diretamente a API,
                // evitando utilizar dados desatualizados.

                const artigo = await requisicaoApi(
                    `/api/Artigos/${id}`
                );

                if (!ativo) return;

                const artigoId =
                    artigo.artigoId ??
                    artigo.ArtigoId;

                const tituloArtigo =
                    artigo.titulo ??
                    artigo.Titulo;

                const temaArtigo =
                    artigo.temaId ??
                    artigo.TemaId;

                const conteudoArtigo =
                    artigo.conteudo ??
                    artigo.Conteudo ??
                    "";

                const statusArtigo = String(
                    artigo.status ??
                    artigo.Status ??
                    ""
                ).toUpperCase();

                if (!artigoId || !temaArtigo) {

                    throw new Error(
                        "Artigo não encontrado ou dados incompletos."
                    );

                }

                // Verifica a permissão no tema original.

                if (
                    !temPermissao(
                        "artigo.editar",
                        temaArtigo
                    )
                ) {

                    throw new Error(
                        "Você não possui permissão para editar artigos deste tema."
                    );

                }

                // Preserva a regra de edição
                // de rascunhos utilizada na listagem.

                if (statusArtigo !== "RASCUNHO") {

                    throw new Error(
                        "Somente artigos em rascunho podem ser editados nesta tela."
                    );

                }

                setTitulo(tituloArtigo || "");
                setTema(temaArtigo);
                setTemaOriginal(temaArtigo);

                setConteudo(conteudoArtigo);

                setResumo(
                    artigo.resumo ??
                    artigo.Resumo ??
                    null
                );

                setVisibilidade(
                    artigo.visibilidade ??
                    artigo.Visibilidade ??
                    "PUBLICO"
                );

                setNomeArquivoAtual(
                    artigo.nomeArquivo ??
                    artigo.NomeArquivo ??
                    ""
                );

                htmlInicialRef.current =
                    conteudoArtigo;

            } catch (erro) {

                if (!ativo) return;

                console.error(
                    "Erro ao carregar artigo:",
                    erro
                );

                setErroArtigo(
                    erro.message ||
                    "Não foi possível carregar o artigo."
                );

            } finally {

                if (ativo) {
                    setCarregandoArtigo(false);
                }

            }

        }

        carregarArtigo();

        return () => {
            ativo = false;
        };

    }, [
        id,
        token,
        modoEdicao,
        podeAcessar,
        carregandoPermissoes,
        erroPermissoes,
        temPermissao
    ]);

    // =========================================
    // CONTROLE DE ACESSO AO FORMULÁRIO
    // =========================================

    const carregandoFormulario =
        carregandoPermissoes ||
        carregandoTemas ||
        carregandoArtigo;

    const podeEditarTemaOriginal =
        !modoEdicao ||
        (
            Boolean(temaOriginal) &&
            temPermissao(
                "artigo.editar",
                temaOriginal
            )
        );

    const podeExibirFormulario =
        !carregandoFormulario &&
        !erroPermissoes &&
        !erroTemas &&
        !erroArtigo &&
        podeAcessar &&
        podeEditarTemaOriginal &&
        temasPermitidos.length > 0;

    // =========================================
    // PREENCHER EDITOR APÓS RENDERIZAÇÃO
    // =========================================

    useEffect(() => {

        if (
            podeExibirFormulario &&
            areaTextoRef.current
        ) {

            areaTextoRef.current.innerHTML =
                htmlInicialRef.current;

        }

    }, [
        id,
        podeExibirFormulario
    ]);

    // =========================================
    // VALIDAR ARQUIVO
    // =========================================

    function verificarArquivo(arquivoSelecionado) {

        if (
            !arquivoSelecionado ||
            salvandoRef.current ||
            !podeExibirFormulario
        ) {
            return;
        }

        const extensaoValida =
            /\.(pdf|doc|docx)$/i.test(
                arquivoSelecionado.name
            );

        if (!extensaoValida) {

            alert(
                "Selecione um arquivo PDF, DOC ou DOCX."
            );

            if (arquivoRef.current) {
                arquivoRef.current.value = "";
            }

            setArquivo(null);
            return;

        }

        if (
            arquivoSelecionado.size >
            10 * 1024 * 1024
        ) {

            alert(
                "O arquivo deve ter no máximo 10 MB."
            );

            if (arquivoRef.current) {
                arquivoRef.current.value = "";
            }

            setArquivo(null);
            return;

        }

        setArquivo(arquivoSelecionado);

    }

    // =========================================
    // SELECIONAR ARQUIVO
    // =========================================

    function escolherArquivo(event) {

        verificarArquivo(
            event.target.files[0]
        );

    }

    // =========================================
    // ARRASTAR E SOLTAR ARQUIVO
    // =========================================

    function soltarArquivo(event) {

        event.preventDefault();

        verificarArquivo(
            event.dataTransfer.files[0]
        );

    }

    // =========================================
    // REMOVER ARQUIVO SELECIONADO
    // =========================================

    function removerArquivo() {

        setArquivo(null);

        if (arquivoRef.current) {
            arquivoRef.current.value = "";
        }

    }

    // =========================================
    // ATUALIZAR EDITOR
    // =========================================

    function atualizarConteudo(event) {

        setConteudo(
            event.currentTarget.innerHTML
        );

    }

    // =========================================
    // FORMATAÇÃO DO EDITOR
    // =========================================

    function aplicarFormatacao(comando) {

        if (
            !areaTextoRef.current ||
            salvandoRef.current
        ) {
            return;
        }

        areaTextoRef.current.focus();

        document.execCommand(
            comando,
            false,
            null
        );

        setConteudo(
            areaTextoRef.current.innerHTML
        );

    }

    const ferramentasEditor = [

        {
            titulo: "Negrito",
            comando: "bold",
            icone: B_EstiloTexto
        },

        {
            titulo: "Itálico",
            comando: "italic",
            icone: I_EstiloTexto
        },

        {
            titulo: "Sublinhado",
            comando: "underline",
            icone: U_EstiloTexto
        },

        {
            titulo: "Alinhar à esquerda",
            comando: "justifyLeft",
            icone: TextosAlinhadosEsquerda
        },

        {
            titulo: "Centralizar",
            comando: "justifyCenter",
            icone: TextoAlinhadoCentro
        },

        {
            titulo: "Alinhar à direita",
            comando: "justifyRight",
            icone: TextoAlinhadoDireita
        }

    ];

    // =========================================
    // VALIDAR FORMULÁRIO
    // =========================================

    function validarFormulario() {

        if (!podeExibirFormulario) {

            alert(
                "Você não possui permissão para esta operação."
            );

            return false;

        }

        if (!titulo.trim()) {

            alert(
                "Informe o título do conteúdo."
            );

            return false;

        }

        if (!tema) {

            alert("Selecione um tema.");

            return false;

        }

        const temaPermitido =
            temasPermitidos.some(item => {

                const temaId =
                    item.temaId ??
                    item.TemaId;

                return (
                    String(temaId).toLowerCase() ===
                    String(tema).toLowerCase()
                );

            });

        if (
            !temaPermitido ||
            !temPermissao(
                codigoPermissao,
                tema
            )
        ) {

            alert(
                "Você não possui permissão para este tema."
            );

            return false;

        }

        if (
            modoEdicao &&
            !temPermissao(
                "artigo.editar",
                temaOriginal
            )
        ) {

            alert(
                "Você não possui permissão para editar este artigo."
            );

            return false;

        }

        const textoSemHtml =
            areaTextoRef.current?.textContent
                ?.replace(/\u00a0/g, " ")
                .trim();

        if (!textoSemHtml) {

            alert(
                "Informe o conteúdo do artigo."
            );

            return false;

        }

        return true;

    }

    // =========================================
    // SALVAR OU ATUALIZAR ARTIGO
    // =========================================

    async function salvarRascunho() {

        if (
            salvandoRef.current ||
            !validarFormulario()
        ) {
            return;
        }

        let artigoId = id;
        let artigoSalvo = false;

        try {

            salvandoRef.current = true;
            setSalvando(true);

            const dadosArtigo = {

                temaId: tema,

                titulo: titulo.trim(),

                resumo: resumo,

                conteudo:
                    areaTextoRef.current?.innerHTML ??
                    conteudo,

                visibilidade: visibilidade

            };

            // ATUALIZAR ARTIGO

            if (modoEdicao) {

                await requisicaoApi(
                    `/api/Artigos/${id}`,
                    {
                        method: "PUT",

                        body: JSON.stringify(
                            dadosArtigo
                        )
                    }
                );

                artigoSalvo = true;

            } else {

                // CRIAR ARTIGO

                const resposta = await requisicaoApi(
                    "/api/Artigos",
                    {
                        method: "POST",

                        body: JSON.stringify(
                            dadosArtigo
                        )
                    }
                );

                artigoSalvo = true;

                artigoId =
                    resposta?.artigoId ??
                    resposta?.ArtigoId ??
                    resposta?.artigo?.artigoId ??
                    resposta?.artigo?.ArtigoId ??
                    resposta?.data?.artigoId ??
                    resposta?.data?.ArtigoId;

            }

            // ENVIAR DOCUMENTO ANEXADO

            if (arquivo) {

                if (!artigoId) {

                    throw new Error(
                        "A API não retornou o ID necessário para enviar o documento."
                    );

                }

                const formularioArquivo =
                    new FormData();

                formularioArquivo.append(
                    "arquivo",
                    arquivo
                );

                await requisicaoApi(
                    `/api/Artigos/${artigoId}/arquivo`,
                    {
                        method: "POST",
                        body: formularioArquivo
                    }
                );

            }

            alert(

                arquivo

                    ? modoEdicao

                        ? "Conteúdo e documento atualizados com sucesso!"

                        : "Rascunho e documento salvos com sucesso!"

                    : modoEdicao

                        ? "Conteúdo atualizado com sucesso!"

                        : "Rascunho salvo com sucesso!"

            );

            navigate("/conteudos");

        } catch (erro) {

            console.error(
                "Erro ao salvar artigo:",
                erro
            );

            // Evita criar outro artigo caso somente
            // o upload do documento tenha falhado.

            if (artigoSalvo) {

                alert(
                    "O conteúdo foi salvo, mas o documento não foi enviado. " +
                    (erro.message || "")
                );

                if (artigoId) {

                    navigate(
                        `/conteudos/editar/${artigoId}`,
                        {
                            replace: true
                        }
                    );

                } else {

                    navigate(
                        "/conteudos",
                        {
                            replace: true
                        }
                    );

                }

            } else {

                alert(
                    erro.message ||
                    "Não foi possível salvar o conteúdo."
                );

            }

        } finally {

            salvandoRef.current = false;
            setSalvando(false);

        }

    }

    // =========================================
    // CANCELAR FORMULÁRIO
    // =========================================

    function cancelar() {

        if (salvandoRef.current) return;

        const confirmar = window.confirm(
            "Deseja realmente sair e descartar as alterações?"
        );

        if (!confirmar) return;

        navigate("/conteudos");

    }

    // =========================================
    // RENDERIZAÇÃO
    //
    // Sidebar e Header são fornecidos
    // exclusivamente pelo LayoutSistema.
    // =========================================

    return (

        <div className="pagina-novo-conteudo">

            <main className="principal-novo-conteudo">

                <section className="area-novo-conteudo">

                    <h1>

                        {modoEdicao
                            ? "Editar Conteúdo"
                            : "Novo Conteúdo"}

                    </h1>

                    {/* CARREGAMENTO */}

                    {carregandoFormulario ? (

                        <p
                            className="novo-conteudo-carregando"
                            role="status"
                        >

                            Carregando dados e permissões...

                        </p>

                    ) : erroPermissoes ? (

                        <div
                            className="novo-conteudo-erro"
                            role="alert"
                        >

                            <h2>
                                Erro de permissões
                            </h2>

                            <p>

                                Não foi possível carregar
                                suas permissões de acesso.

                            </p>

                            <button
                                type="button"
                                className="botao-voltar1"
                                onClick={atualizar}
                            >

                                Tentar novamente

                            </button>

                        </div>

                    ) : !podeAcessar ? (

                        <div
                            className="novo-conteudo-erro"
                            role="alert"
                        >

                            <h2>Acesso negado</h2>

                            <p>

                                Você não possui permissão
                                para realizar esta operação.

                            </p>

                            <button
                                type="button"
                                className="botao-voltar1"
                                onClick={() =>
                                    navigate("/conteudos")
                                }
                            >

                                Voltar

                            </button>

                        </div>

                    ) : erroArtigo || erroTemas ? (

                        <div
                            className="novo-conteudo-erro"
                            role="alert"
                        >

                            <h2>
                                Não foi possível carregar
                                o formulário
                            </h2>

                            <p>
                                {erroArtigo || erroTemas}
                            </p>

                            <button
                                type="button"
                                className="botao-voltar1"
                                onClick={() =>
                                    navigate("/conteudos")
                                }
                            >

                                Voltar

                            </button>

                        </div>

                    ) : !podeExibirFormulario ? (

                        <div
                            className="novo-conteudo-erro"
                            role="alert"
                        >

                            <h2>
                                Nenhum tema disponível
                            </h2>

                            <p>

                                Você não possui temas ativos
                                autorizados para esta operação.

                            </p>

                            <button
                                type="button"
                                className="botao-voltar1"
                                onClick={() =>
                                    navigate("/conteudos")
                                }
                            >

                                Voltar

                            </button>

                        </div>

                    ) : (

                        <>

                            <div className="formulario-conteudo1">

                                <div className="formulario-esquerda">

                                    {/* TÍTULO */}

                                    <div className="campo-conteudo">

                                        <label htmlFor="titulo">
                                            Título
                                        </label>

                                        <input
                                            id="titulo"
                                            type="text"
                                            placeholder="Digite o título do conteúdo"
                                            value={titulo}
                                            onChange={event =>
                                                setTitulo(
                                                    event.target.value
                                                )
                                            }
                                            disabled={salvando}
                                        />

                                    </div>

                                    {/* TEMA */}

                                    <div className="campo-conteudo">

                                        <label htmlFor="tema">
                                            Tema
                                        </label>

                                        <div className="select-tema-container">

                                            <select
                                                id="tema"
                                                value={tema}

                                                onChange={event =>
                                                    setTema(
                                                        event.target.value
                                                    )
                                                }

                                                disabled={
                                                    carregandoTemas ||
                                                    salvando
                                                }
                                            >

                                                <option value="">

                                                    Selecione um tema

                                                </option>

                                                {temasPermitidos.map(item => {

                                                    const temaId =
                                                        item.temaId ??
                                                        item.TemaId;

                                                    const nome =
                                                        item.nome ??
                                                        item.Nome;

                                                    return (

                                                        <option
                                                            key={temaId}
                                                            value={temaId}
                                                        >

                                                            {nome}

                                                        </option>

                                                    );

                                                })}

                                            </select>

                                            <img
                                                src={ExpandirCinza}
                                                alt=""
                                                className="icone-expandir-tema"
                                            />

                                        </div>

                                    </div>

                                    {/* EDITOR DE CONTEÚDO */}

                                    <div className="campo-conteudo">

                                        <label id="rotulo-editor">
                                            Conteúdo
                                        </label>

                                        <div className="editor-conteudo">

                                            <div className="barra-editor">

                                                {ferramentasEditor.map(
                                                    ferramenta => (

                                                        <button
                                                            key={ferramenta.comando}

                                                            type="button"

                                                            title={ferramenta.titulo}

                                                            aria-label={ferramenta.titulo}

                                                            disabled={salvando}

                                                            onMouseDown={event =>
                                                                event.preventDefault()
                                                            }

                                                            onClick={() =>
                                                                aplicarFormatacao(
                                                                    ferramenta.comando
                                                                )
                                                            }
                                                        >

                                                            <img
                                                                src={ferramenta.icone}
                                                                alt=""
                                                            />

                                                        </button>

                                                    )
                                                )}

                                            </div>

                                            <div
                                                id="editor-conteudo"

                                                ref={areaTextoRef}

                                                className="area-texto"

                                                contentEditable={!salvando}

                                                suppressContentEditableWarning

                                                role="textbox"

                                                aria-multiline="true"

                                                aria-labelledby="rotulo-editor"

                                                data-placeholder="Digite o conteúdo aqui..."

                                                onInput={atualizarConteudo}
                                            />

                                        </div>

                                    </div>

                                </div>

                                {/* ÁREA DE UPLOAD */}

                                <div className="area-arquivo">

                                    <label
                                        htmlFor="arquivo"

                                        className="caixa-upload"

                                        onDragOver={event =>
                                            event.preventDefault()
                                        }

                                        onDrop={soltarArquivo}
                                    >

                                        <img
                                            src={iconeUpload}

                                            alt=""

                                            className="icone-upload-imagem"
                                        />

                                        <p>

                                            Arraste e solte
                                            os arquivos aqui

                                        </p>

                                        <span>

                                            ou clique para selecionar

                                        </span>

                                        {arquivo ? (

                                            <strong className="nome-arquivo">

                                                {arquivo.name}

                                            </strong>

                                        ) : (

                                            <div className="informacoes-arquivo">

                                                <span>

                                                    Formatos aceitos:
                                                    PDF, DOC, DOCX

                                                </span>

                                                <span>

                                                    Tamanho máximo: 10 MB

                                                </span>

                                            </div>

                                        )}

                                    </label>

                                    <input
                                        ref={arquivoRef}

                                        id="arquivo"

                                        className="input-arquivo"

                                        type="file"

                                        accept=".pdf,.doc,.docx"

                                        onChange={escolherArquivo}

                                        disabled={salvando}
                                    />

                                    {arquivo && (

                                        <button
                                            type="button"

                                            className="remover-arquivo-novo"

                                            onClick={removerArquivo}

                                            disabled={salvando}
                                        >

                                            Remover arquivo selecionado

                                        </button>

                                    )}

                                    {modoEdicao &&
                                        nomeArquivoAtual && (

                                        <div className="arquivo-atual-novo">

                                            <strong>
                                                Documento atual
                                            </strong>

                                            <span>
                                                {nomeArquivoAtual}
                                            </span>

                                            <small>

                                                Selecione outro documento
                                                apenas se desejar substituí-lo.

                                            </small>

                                        </div>

                                    )}

                                </div>

                            </div>

                            {/* BOTÕES */}

                            <div className="botoes-conteudo">

                                <button
                                    type="button"

                                    className="botao-voltar1"

                                    onClick={() =>
                                        navigate("/conteudos")
                                    }

                                    disabled={salvando}
                                >

                                    Voltar

                                </button>

                                <button
                                    type="button"

                                    className="botao-cancelar"

                                    onClick={cancelar}

                                    disabled={salvando}
                                >

                                    Cancelar

                                </button>

                                <button
                                    type="button"

                                    className="botao-rascunho"

                                    onClick={salvarRascunho}

                                    disabled={
                                        salvando ||
                                        carregandoFormulario ||
                                        !podeExibirFormulario
                                    }
                                >

                                    {salvando

                                        ? "Salvando..."

                                        : modoEdicao

                                            ? "Salvar Alterações"

                                            : "Salvar Rascunho"}

                                </button>

                            </div>

                        </>

                    )}

                </section>

            </main>

        </div>

    );

}

export default NovoConteudo;