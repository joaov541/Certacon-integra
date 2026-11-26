import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "./conteudoTributario.css";
import "../../styles/coresTemas.css";

import { classeCorTema } from "../../utils/coresTemas";
import { requisicaoApi } from "../../services/api";

import usePermissoes from "../../hooks/usePermissoes";
import usePesquisaLayout from "../../hooks/usePesquisaLayout";

// ÍCONES

import LupaCinza from "../../assets/Icones/LupaCinza.png";
import ExpandirText from "../../assets/Icones/ExpandirText.png";
import Lixeira from "../../assets/Icones/Lixeira.png";
import iconeConteudo from "../../assets/Icones/DoisDocumentos.png";

function ConteudoTributario() {

    const navigate = useNavigate();

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

    const podeCriar =
        temAlgumaPermissao("artigo.criar");

    const podeVerMeusConteudos =
        temAlgumaPermissao("artigo.ler.rascunho");

    const podeArquivar =
        temAlgumaPermissao("artigo.arquivar");

    // =========================================
    // ESTADOS
    // =========================================

    const [conteudos, setConteudos] = useState([]);
    const [meusConteudos, setMeusConteudos] = useState([]);

    const [abaSelecionada, setAbaSelecionada] =
        useState("publicados");

    const [pesquisa, setPesquisa] = useState("");
    const [visualizacao, setVisualizacao] = useState("lista");

    const [temaSelecionado, setTemaSelecionado] =
        useState("Todos");

    const [ordem, setOrdem] =
        useState("recentes");

    const [carregando, setCarregando] =
        useState(true);

    const [carregandoMeus, setCarregandoMeus] =
        useState(false);

    const [erro, setErro] = useState("");
    const [erroMeus, setErroMeus] = useState("");

    const [enviandoRevisao, setEnviandoRevisao] =
        useState(null);

    const [arquivando, setArquivando] =
        useState(null);

    // =========================================
    // PESQUISA DO HEADER COMPARTILHADO
    // =========================================

    usePesquisaLayout(pesquisa, setPesquisa);

    // =========================================
    // SESSÃO ATUAL
    // =========================================

    const token = localStorage.getItem("token");

    // =========================================
    // CARREGAR CONTEÚDOS PUBLICADOS
    // =========================================

    useEffect(() => {

        let ativo = true;

        setConteudos([]);
        setErro("");

        if (carregandoPermissoes) {
            setCarregando(true);
            return;
        }

        if (erroPermissoes) {
            setCarregando(false);
            return;
        }

        async function carregarConteudos() {

            try {

                setCarregando(true);

                const dados = await requisicaoApi(
                    "/api/Artigos"
                );

                if (!ativo) return;

                setConteudos(
                    Array.isArray(dados)
                        ? dados
                        : []
                );

            } catch (error) {

                if (!ativo) return;

                console.error(
                    "Erro ao carregar conteúdos:",
                    error
                );

                setErro(
                    error.message ||
                    "Não foi possível carregar os conteúdos."
                );

            } finally {

                if (ativo) {
                    setCarregando(false);
                }

            }

        }

        carregarConteudos();

        return () => {
            ativo = false;
        };

    }, [
        token,
        carregandoPermissoes,
        erroPermissoes
    ]);

    // =========================================
    // CARREGAR MEUS CONTEÚDOS
    // =========================================

    useEffect(() => {

        let ativo = true;

        setMeusConteudos([]);
        setErroMeus("");

        if (
            !autenticado ||
            carregandoPermissoes ||
            erroPermissoes ||
            !podeVerMeusConteudos
        ) {

            setCarregandoMeus(false);

            return;

        }

        async function carregarMeusConteudos() {

            try {

                setCarregandoMeus(true);

                const dados = await requisicaoApi(
                    "/api/Artigos/meus-artigos"
                );

                if (!ativo) return;

                setMeusConteudos(
                    Array.isArray(dados)
                        ? dados
                        : []
                );

            } catch (error) {

                if (!ativo) return;

                console.error(
                    "Erro ao carregar meus conteúdos:",
                    error
                );

                setErroMeus(
                    error.message ||
                    "Não foi possível carregar seus conteúdos."
                );

            } finally {

                if (ativo) {
                    setCarregandoMeus(false);
                }

            }

        }

        carregarMeusConteudos();

        return () => {
            ativo = false;
        };

    }, [
        token,
        autenticado,
        carregandoPermissoes,
        erroPermissoes,
        podeVerMeusConteudos
    ]);

    // =========================================
    // CONTROLAR ABA SELECIONADA
    // =========================================

    useEffect(() => {

        if (
            abaSelecionada === "meus" &&
            !podeVerMeusConteudos
        ) {

            setAbaSelecionada("publicados");
            setTemaSelecionado("Todos");

        }

    }, [
        abaSelecionada,
        podeVerMeusConteudos
    ]);

    // =========================================
    // FORMATAÇÃO DE DATA
    // =========================================

    function formatarData(data) {

        if (!data) {
            return "Data não informada";
        }

        const dataFormatada = new Date(data);

        if (isNaN(dataFormatada.getTime())) {
            return "Data não informada";
        }

        return dataFormatada.toLocaleDateString(
            "pt-BR"
        );

    }

    // =========================================
    // NORMALIZAR TEXTO
    // =========================================

    function normalizarTexto(texto) {

        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

    }

    // =========================================
    // NORMALIZAR STATUS
    // =========================================

    function normalizarStatus(status) {

        return String(status || "")
            .trim()
            .toUpperCase();

    }

    // =========================================
    // PERMISSÕES POR ARTIGO
    // =========================================

    function obterTemaId(artigo) {

        return artigo.temaId ??
            artigo.TemaId ??
            null;

    }

    function podeEditarArtigo(artigo) {

        return (
            abaSelecionada === "meus" &&
            normalizarStatus(artigo.status) === "RASCUNHO" &&
            temPermissao(
                "artigo.editar",
                obterTemaId(artigo)
            )
        );

    }

    function podeEnviarArtigo(artigo) {

        return (
            abaSelecionada === "meus" &&
            normalizarStatus(artigo.status) === "RASCUNHO" &&
            temPermissao(
                "artigo.enviar.revisao",
                obterTemaId(artigo)
            )
        );

    }

    function podeArquivarArtigo(artigo) {

        if (!podeArquivar) return false;

        const status = normalizarStatus(
            artigo.status
        );

        if (status === "ARQUIVADO") {
            return false;
        }

        const permissaoGlobal =
            temPermissao("artigo.arquivar");

        if (permissaoGlobal) {
            return true;
        }

        return (
            abaSelecionada === "meus" &&
            status === "RASCUNHO" &&
            temPermissao(
                "artigo.arquivar",
                obterTemaId(artigo)
            )
        );

    }

    // =========================================
    // CONTEÚDOS PUBLICADOS
    // =========================================

    const conteudosPublicados = conteudos.filter(
        artigo => {

            const status = normalizarStatus(
                artigo.status
            );

            return !status ||
                status === "PUBLICADO";

        }
    );

    // =========================================
    // MEUS CONTEÚDOS AUTORIZADOS
    // =========================================

    const meusConteudosPermitidos =
        meusConteudos.filter(artigo => {

            if (
                normalizarStatus(artigo.status) ===
                "ARQUIVADO"
            ) {
                return false;
            }

            return temPermissao(
                "artigo.ler.rascunho",
                obterTemaId(artigo)
            );

        });

    // =========================================
    // LISTA ATUAL
    // =========================================

    const listaAtual =
        abaSelecionada === "publicados"
            ? conteudosPublicados
            : meusConteudosPermitidos;

    // =========================================
    // TEMAS DISPONÍVEIS
    // =========================================

    const temasDisponiveis = [
        ...new Set(
            listaAtual
                .map(artigo => artigo.tema)
                .filter(Boolean)
        )
    ];

    // =========================================
    // PESQUISA, FILTRO E ORDENAÇÃO
    // =========================================

    const listaFiltrada = listaAtual

        .filter(artigo => {

            const texto = normalizarTexto(pesquisa);

            const titulo = normalizarTexto(
                artigo.titulo
            );

            const tema = normalizarTexto(
                artigo.tema
            );

            const resumo = normalizarTexto(
                artigo.resumo
            );

            const autor = normalizarTexto(
                artigo.autor
            );

            const encontrouTexto =
                titulo.includes(texto) ||
                tema.includes(texto) ||
                resumo.includes(texto) ||
                autor.includes(texto);

            const encontrouTema =
                temaSelecionado === "Todos" ||
                artigo.tema === temaSelecionado;

            return encontrouTexto && encontrouTema;

        })

        .sort((a, b) => {

            const dataA = new Date(
                abaSelecionada === "publicados"
                    ? a.dataPublicacao || 0
                    : a.dataCriacao || 0
            ).getTime();

            const dataB = new Date(
                abaSelecionada === "publicados"
                    ? b.dataPublicacao || 0
                    : b.dataCriacao || 0
            ).getTime();

            return ordem === "recentes"
                ? dataB - dataA
                : dataA - dataB;

        });

    // =========================================
    // CONTROLE DA COLUNA DE AÇÕES
    // =========================================

    const exibirAcoes = listaAtual.some(
        artigo =>
            podeEditarArtigo(artigo) ||
            podeEnviarArtigo(artigo) ||
            podeArquivarArtigo(artigo)
    );

    const totalColunas =
        4 +
        (abaSelecionada === "meus" ? 1 : 0) +
        (exibirAcoes ? 1 : 0);

    // =========================================
    // CLASSE DO STATUS
    // =========================================

    function classeStatus(status) {

        const classes = {

            RASCUNHO: "status-rascunho",

            EM_REVISAO: "status-em-revisao",

            APROVADO: "status-aprovado",

            PUBLICADO: "status-publicado",

            REJEITADO: "status-rejeitado",

            ARQUIVADO: "status-arquivado"

        };

        return classes[normalizarStatus(status)] ||
            "status-padrao";

    }

    // =========================================
    // TEXTO DO STATUS
    // =========================================

    function textoStatus(status) {

        const nomes = {

            RASCUNHO: "Rascunho",

            EM_REVISAO: "Em revisão",

            APROVADO: "Aprovado",

            PUBLICADO: "Publicado",

            REJEITADO: "Rejeitado",

            ARQUIVADO: "Arquivado"

        };

        return nomes[normalizarStatus(status)] ||
            status ||
            "Não informado";

    }

    // =========================================
    // ABRIR DETALHES
    // =========================================

    function abrirDetalhes(artigo) {

        navigate("/conteudos/detalhes", {

            state: {

                conteudo: {

                    ...artigo,

                    id: artigo.artigoId,

                    artigoId: artigo.artigoId,

                    temaId: obterTemaId(artigo),

                    data: formatarData(
                        artigo.dataPublicacao ||
                        artigo.dataCriacao
                    ),

                    autor:
                        artigo.autor ||
                        "Não informado",

                    nomeArquivo: artigo.nomeArquivo,

                    tamanhoArquivo:
                        artigo.tamanhoArquivo,

                    temArquivo: artigo.temArquivo

                }

            }

        });

    }

    // =========================================
    // EDITAR CONTEÚDO
    // =========================================

    function editarConteudo(artigo) {

        if (!podeEditarArtigo(artigo)) {

            alert(
                "Você não possui permissão para editar este conteúdo."
            );

            return;

        }

        navigate(
            `/conteudos/editar/${artigo.artigoId}`,
            {
                state: {
                    conteudo: {
                        ...artigo,
                        temaId: obterTemaId(artigo)
                    }
                }
            }
        );

    }

    // =========================================
    // ENVIAR PARA REVISÃO
    // =========================================

    async function enviarParaRevisao(artigo) {

        if (
            !podeEnviarArtigo(artigo) ||
            enviandoRevisao
        ) {
            return;
        }

        const confirmar = window.confirm(
            "Deseja enviar este conteúdo para revisão?"
        );

        if (!confirmar) return;

        try {

            setEnviandoRevisao(
                artigo.artigoId
            );

            const resposta = await requisicaoApi(
                `/api/Artigos/${artigo.artigoId}/enviar-revisao`,
                {
                    method: "POST"
                }
            );

            setMeusConteudos(atuais =>
                atuais.map(item =>

                    item.artigoId === artigo.artigoId

                        ? {
                            ...item,
                            status: "EM_REVISAO"
                        }

                        : item

                )
            );

            alert(
                resposta?.mensagem ||
                "Conteúdo enviado para revisão com sucesso!"
            );

        } catch (error) {

            console.error(
                "Erro ao enviar para revisão:",
                error
            );

            alert(
                error.message ||
                "Não foi possível enviar o conteúdo para revisão."
            );

        } finally {

            setEnviandoRevisao(null);

        }

    }

    // =========================================
    // ARQUIVAR CONTEÚDO
    // =========================================

    async function excluirConteudo(artigo) {

        if (
            !podeArquivarArtigo(artigo) ||
            arquivando
        ) {
            return;
        }

        const confirmar = window.confirm(
            "Deseja realmente arquivar este conteúdo?"
        );

        if (!confirmar) return;

        try {

            setArquivando(artigo.artigoId);

            await requisicaoApi(
                `/api/Artigos/${artigo.artigoId}`,
                {
                    method: "DELETE"
                }
            );

            setConteudos(atuais =>
                atuais.filter(
                    item =>
                        item.artigoId !== artigo.artigoId
                )
            );

            setMeusConteudos(atuais =>
                atuais.filter(
                    item =>
                        item.artigoId !== artigo.artigoId
                )
            );

            alert(
                "Conteúdo arquivado com sucesso!"
            );

        } catch (error) {

            console.error(
                "Erro ao arquivar conteúdo:",
                error
            );

            alert(
                error.message ||
                "Não foi possível arquivar este conteúdo."
            );

        } finally {

            setArquivando(null);

        }

    }

    // =========================================
    // ESTADO DA LISTA ATUAL
    // =========================================

    const carregandoLista =
        carregandoPermissoes ||
        (
            abaSelecionada === "publicados"
                ? carregando
                : carregandoMeus
        );

    const erroLista =
        abaSelecionada === "publicados"
            ? erro
            : erroMeus;

    // =========================================
    // RENDERIZAÇÃO
    //
    // Sidebar e Headers são fornecidos
    // exclusivamente pelo LayoutSistema.
    // =========================================

    return (

        <div className={`pagina-conteudos ct-${visualizacao}`}>

            <main className="principal-conteudos">

                <section className="area-lista-conteudos">

                    {/* TÍTULO */}

                    <div className="titulo-conteudos">

                        <div>

                            <span className="ct-eyebrow">BIBLIOTECA TRIBUTÁRIA</span>
                            <h1>
                                Conteúdos Tributários
                            </h1>

                            <p>
                                Explore conteúdos por tema e mantenha-se atualizado.
                            </p>

                        </div>

                        {podeCriar &&
                            !carregandoPermissoes &&
                            !erroPermissoes && (

                            <button
                                type="button"
                                className="adicionar-conteudo"
                                onClick={() =>
                                    navigate("/conteudos/novo")
                                }
                            >

                                <span className="adicionar-conteudo-texto">
                                    + Adicionar Conteúdo
                                </span>

                                <span className="adicionar-conteudo-mais">
                                    +
                                </span>

                            </button>

                        )}

                    </div>

                    {/* ERRO DE PERMISSÕES */}

                    {erroPermissoes && (

                        <div
                            className="erro-permissoes-conteudos"
                            role="alert"
                        >

                            <p>
                                Não foi possível carregar
                                suas permissões de acesso.
                            </p>

                            <button
                                type="button"
                                onClick={atualizar}
                            >
                                Tentar novamente
                            </button>

                        </div>

                    )}

                    {/* ABAS */}

                    <div className="abas-conteudos">

                        <button
                            type="button"
                            className={
                                abaSelecionada === "publicados"
                                    ? "aba-conteudos aba-conteudos-ativa"
                                    : "aba-conteudos"
                            }

                            onClick={() => {

                                setAbaSelecionada(
                                    "publicados"
                                );

                                setTemaSelecionado(
                                    "Todos"
                                );

                            }}
                        >

                            Todos os conteúdos

                        </button>

                        {podeVerMeusConteudos &&
                            !carregandoPermissoes &&
                            !erroPermissoes && (

                            <button
                                type="button"
                                className={
                                    abaSelecionada === "meus"
                                        ? "aba-conteudos aba-conteudos-ativa"
                                        : "aba-conteudos"
                                }

                                onClick={() => {

                                    setAbaSelecionada(
                                        "meus"
                                    );

                                    setTemaSelecionado(
                                        "Todos"
                                    );

                                }}
                            >

                                Meus conteúdos

                            </button>

                        )}

                    </div>

                    {/* FILTROS */}

                    <div className="filtros-conteudos">

                        <div className="pesquisa-lista-conteudos">

                            <img
                                src={LupaCinza}
                                alt=""
                            />

                            <input
                                type="text"
                                aria-label="Buscar conteúdos"
                                 placeholder="Buscar por título ou palavra-chave"
                                value={pesquisa}
                                onChange={event =>
                                    setPesquisa(
                                        event.target.value
                                    )
                                }
                            />

                        </div>

                        {/* FILTRO DE TEMA */}

                        <div className="seletor-conteudos">

                            <select
                                aria-label="Filtrar por tema"
                                 value={temaSelecionado}
                                onChange={event =>
                                    setTemaSelecionado(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="Todos">
                                    Todos os temas
                                </option>

                                {temasDisponiveis.map(tema => (

                                    <option
                                        key={tema}
                                        value={tema}
                                    >
                                        {tema}
                                    </option>

                                ))}

                            </select>

                            <img
                                src={ExpandirText}
                                alt=""
                            />

                        </div>

                        {/* ORDENAÇÃO */}

                        <div className="seletor-conteudos">

                            <select
                                aria-label="Ordenar conteúdos"
                                 value={ordem}
                                onChange={event =>
                                    setOrdem(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="recentes">
                                    Mais recentes
                                </option>

                                <option value="antigos">
                                    Mais antigos
                                </option>

                            </select>

                            <img
                                src={ExpandirText}
                                alt=""
                            />

                        </div>

                    </div>

                    {/* TABELA */}

                    <div className="ct-barra-resultados">
                        <span role="status">
                            {carregandoLista ? "Carregando conteúdos…" : erroPermissoes || erroLista ? "Conteúdos indisponíveis" : `${listaFiltrada.length} de ${listaAtual.length} conteúdos`}
                        </span>
                        <div className="ct-controles">
                            {(pesquisa || temaSelecionado !== "Todos" || ordem !== "recentes") && (
                                <button type="button" className="ct-limpar" onClick={() => {
                                    setPesquisa("");
                                    setTemaSelecionado("Todos");
                                    setOrdem("recentes");
                                }}>Limpar filtros</button>
                            )}
                            <div className="ct-modos" role="group" aria-label="Visualização">
                                <button type="button" aria-pressed={visualizacao === "lista"} onClick={() => setVisualizacao("lista")}>☰ Lista</button>
                                <button type="button" aria-pressed={visualizacao === "grade"} onClick={() => setVisualizacao("grade")}>▦ Grade</button>
                            </div>
                        </div>
                    </div>
                    <div className="tabela-conteudos" aria-busy={carregandoLista}>

                        <table
                            className={
                                !exibirAcoes
                                    ? "tabela-sem-acoes"
                                    : ""
                            }
                        >

                            <thead>

                                <tr>

                                    <th>Título</th>

                                    <th>Tema</th>

                                    <th>

                                        {abaSelecionada === "publicados"
                                            ? "Data de publicação"
                                            : "Data de criação"}

                                    </th>

                                    <th>Autor</th>

                                    {abaSelecionada === "meus" && (

                                        <th>Status</th>

                                    )}

                                    {exibirAcoes && (

                                        <th className="coluna-acoes">
                                            Ações
                                        </th>

                                    )}

                                </tr>

                            </thead>

                            <tbody>

                                {carregandoLista ? (

                                    <tr>

                                        <td
                                            colSpan={totalColunas}
                                            className="sem-conteudos"
                                        >

                                            <div className="ct-skeleton" aria-hidden="true">
                                                 {[0, 1, 2].map(i => <span key={i} />)}
                                             </div>
                                             <span role="status">Carregando conteúdos...</span>
                                        </td>

                                    </tr>

                                ) : erroPermissoes || erroLista ? (

                                    <tr>

                                        <td
                                            colSpan={totalColunas}
                                            className="sem-conteudos"
                                        >

                                            {erroPermissoes
                                                ? "Não foi possível carregar as permissões."
                                                : erroLista}

                                        </td>

                                    </tr>

                                ) : listaFiltrada.length > 0 ? (

                                    listaFiltrada.map((artigo, indice) => (

                                        <tr
                                            key={artigo.artigoId}
                                            className="linha-conteudo-clicavel"
                                            style={{ "--ct-atraso": `${Math.min(indice, 6) * 35}ms` }}

                                            onClick={() =>
                                                abrirDetalhes(artigo)
                                            }
                                        >

                                            {/* TÍTULO */}

                                            <td className="celula-titulo">

                                                <img
                                                    src={iconeConteudo}
                                                    alt=""
                                                    className="icone-card-conteudo"
                                                />

                                                <button type="button" className="ct-titulo-link" onClick={event => {
                                                    event.stopPropagation();
                                                    abrirDetalhes(artigo);
                                                }}>
                                                    <strong>{artigo.titulo}</strong>
                                                </button>

                                            </td>

                                            {/* TEMA */}

                                            <td className="celula-tema">

                                                <span
                                                    className={`etiqueta-tema ${classeCorTema(artigo.tema)}`}
                                                >

                                                    {artigo.tema ||
                                                        "Sem tema"}

                                                </span>

                                            </td>

                                            {/* DATA */}

                                            <td className="celula-data">

                                                {formatarData(
                                                    abaSelecionada === "publicados"
                                                        ? artigo.dataPublicacao
                                                        : artigo.dataCriacao
                                                )}

                                            </td>

                                            {/* AUTOR */}

                                            <td className="celula-autor">

                                                {artigo.autor ||
                                                    "Não informado"}

                                            </td>

                                            {/* STATUS */}

                                            {abaSelecionada === "meus" && (

                                                <td className="celula-status">

                                                    <span
                                                        className={`etiqueta-status-artigo ${classeStatus(artigo.status)}`}
                                                    >

                                                        {textoStatus(
                                                            artigo.status
                                                        )}

                                                    </span>

                                                </td>

                                            )}

                                            {/* AÇÕES */}

                                            {exibirAcoes && (

                                                <td className="coluna-acoes">

                                                    <div className="acoes-artigo">

                                                        {/* EDITAR */}

                                                        {podeEditarArtigo(artigo) && (

                                                            <button
                                                                type="button"
                                                                className="acao-editar-artigo"
                                                                title="Editar rascunho"

                                                                onClick={event => {

                                                                    event.stopPropagation();

                                                                    editarConteudo(
                                                                        artigo
                                                                    );

                                                                }}
                                                            >

                                                                Editar

                                                            </button>

                                                        )}

                                                        {/* ENVIAR PARA REVISÃO */}

                                                        {podeEnviarArtigo(artigo) && (

                                                            <button
                                                                type="button"
                                                                className="acao-enviar-revisao"
                                                                title="Enviar para revisão"

                                                                disabled={
                                                                    enviandoRevisao !== null
                                                                }

                                                                onClick={event => {

                                                                    event.stopPropagation();

                                                                    enviarParaRevisao(
                                                                        artigo
                                                                    );

                                                                }}
                                                            >

                                                                {enviandoRevisao === artigo.artigoId
                                                                    ? "Enviando..."
                                                                    : "Enviar"}

                                                            </button>

                                                        )}

                                                        {/* ARQUIVAR */}

                                                        {podeArquivarArtigo(artigo) && (

                                                            <button
                                                                type="button"
                                                                className="excluir-conteudo"
                                                                title="Arquivar conteúdo"

                                                                disabled={
                                                                    arquivando !== null
                                                                }

                                                                onClick={event => {

                                                                    event.stopPropagation();

                                                                    excluirConteudo(
                                                                        artigo
                                                                    );

                                                                }}
                                                            >

                                                                <img
                                                                    src={Lixeira}
                                                                    alt="Arquivar"
                                                                />

                                                            </button>

                                                        )}

                                                    </div>

                                                </td>

                                            )}

                                        </tr>

                                    ))

                                ) : (

                                    <tr>

                                        <td
                                            colSpan={totalColunas}
                                            className="sem-conteudos"
                                        >

                                            {abaSelecionada === "meus"
                                                ? "Nenhum conteúdo encontrado entre seus artigos."
                                                : "Nenhum conteúdo encontrado."}

                                        </td>

                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>

            </main>

        </div>

    );

}

export default ConteudoTributario;