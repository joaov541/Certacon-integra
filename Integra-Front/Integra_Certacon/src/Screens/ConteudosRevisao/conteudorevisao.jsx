import {
    useState,
    useEffect,
    useCallback,
    useRef
} from "react";

import { useNavigate } from "react-router-dom";

import {
    Check,
    Pencil,
    X,
    Eye,
    Send
} from "lucide-react";

import { requisicaoApi } from "../../services/api";

import usePermissoes from "../../hooks/usePermissoes";
import usePesquisaLayout from "../../hooks/usePesquisaLayout";

import "./conteudorevisao.css";

const itensPorPagina = 5;

const abas = [
    { chave: "Pendente", titulo: "Pendentes" },
    { chave: "Aprovado", titulo: "Aprovados" },
    { chave: "Rejeitado", titulo: "Rejeitados" }
];

function ConteudoRevisao() {

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

    const podeRevisar =
        autenticado &&
        temAlgumaPermissao("artigo.revisar");

    // =========================================
    // ESTADOS
    // =========================================

    const [conteudos, setConteudos] = useState({
        Pendente: [],
        Aprovado: [],
        Rejeitado: []
    });

    const [abaAtiva, setAbaAtiva] =
        useState("Pendente");

    const [pagina, setPagina] = useState(1);

    const [pesquisa, setPesquisa] = useState("");

    const [carregando, setCarregando] =
        useState(true);

    const [erro, setErro] = useState("");

    const [acaoEmAndamento, setAcaoEmAndamento] =
        useState(null);

    const executandoAcaoRef = useRef(false);

    const requisicaoAtualRef = useRef(0);

    const token = localStorage.getItem("token");

    // =========================================
    // IDENTIFICAR USUÁRIO AUTENTICADO
    // =========================================

    let usuarioId = null;

    try {

        const usuario = JSON.parse(
            localStorage.getItem("usuario") || "{}"
        );

        usuarioId =
            usuario.usuarioId ??
            usuario.UsuarioId ??
            usuario.id ??
            null;

    } catch {
        usuarioId = null;
    }

    // =========================================
    // PESQUISA DO LAYOUT COMPARTILHADO
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
    // NORMALIZAÇÃO
    // =========================================

    function normalizarTexto(texto) {

        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

    }

    function normalizarStatus(status) {

        return String(status || "")
            .trim()
            .toUpperCase();

    }

    function obterTemaId(item) {

        return item.temaId ??
            item.TemaId ??
            null;

    }

    function obterArtigoId(item) {

        return item.artigoId ??
            item.ArtigoId ??
            item.id;

    }

    // =========================================
    // CARREGAR CONTEÚDOS
    // =========================================

    const carregarConteudos = useCallback(async () => {

        const numeroRequisicao =
            ++requisicaoAtualRef.current;

        if (
            !podeRevisar ||
            carregandoPermissoes ||
            erroPermissoes
        ) {

            setConteudos({
                Pendente: [],
                Aprovado: [],
                Rejeitado: []
            });

            setCarregando(false);

            return;

        }

        try {

            setCarregando(true);
            setErro("");

            const [pendentes, aprovados, rejeitados] =
                await Promise.all([

                    requisicaoApi(
                        "/api/Artigos/pendentes-revisao"
                    ),

                    requisicaoApi(
                        "/api/Artigos/revisados/APROVADO"
                    ),

                    requisicaoApi(
                        "/api/Artigos/revisados/REJEITADO"
                    )

                ]);

            if (
                numeroRequisicao !==
                requisicaoAtualRef.current
            ) {

                return;

            }

            setConteudos({

                Pendente:
                    Array.isArray(pendentes)
                        ? pendentes
                        : [],

                Aprovado:
                    Array.isArray(aprovados)
                        ? aprovados
                        : [],

                Rejeitado:
                    Array.isArray(rejeitados)
                        ? rejeitados
                        : []

            });

        } catch (error) {

            if (
                numeroRequisicao !==
                requisicaoAtualRef.current
            ) {
                return;
            }

            console.error(
                "Erro ao carregar conteúdos para revisão:",
                error
            );

            setErro(
                error.message ||
                "Não foi possível carregar os conteúdos."
            );

        } finally {

            if (
                numeroRequisicao ===
                requisicaoAtualRef.current
            ) {

                setCarregando(false);

            }

        }

    }, [
        podeRevisar,
        carregandoPermissoes,
        erroPermissoes
    ]);

    useEffect(() => {

        setConteudos({
            Pendente: [],
            Aprovado: [],
            Rejeitado: []
        });

        carregarConteudos();

        return () => {

            requisicaoAtualRef.current += 1;

        };

    }, [
        token,
        carregarConteudos
    ]);

    // =========================================
    // PERMISSÕES ESPECÍFICAS POR ARTIGO
    // =========================================

    function podeRevisarArtigo(item) {

        return (
            podeRevisar &&
            !carregandoPermissoes &&
            !erroPermissoes &&
            temPermissao(
                "artigo.revisar",
                obterTemaId(item)
            )
        );

    }

    function ehAutorDoArtigo(item) {

        const autorId =
            item.autorUsuarioId ??
            item.AutorUsuarioId ??
            item.autorId ??
            null;

        if (!usuarioId || !autorId) {
            return false;
        }

        return (
            String(usuarioId).toLowerCase() ===
            String(autorId).toLowerCase()
        );

    }

    function estaEmRevisao(item) {

        return normalizarStatus(
            item.status ?? item.Status
        ) === "EM_REVISAO";

    }

    function estaAprovado(item) {

        return normalizarStatus(
            item.status ?? item.Status
        ) === "APROVADO";

    }

    function podeAprovarArtigo(item) {

        return (
            podeRevisarArtigo(item) &&
            estaEmRevisao(item) &&
            !ehAutorDoArtigo(item) &&
            temPermissao(
                "artigo.aprovar",
                obterTemaId(item)
            )
        );

    }

    function podeRejeitarArtigo(item) {

        return (
            podeRevisarArtigo(item) &&
            estaEmRevisao(item) &&
            !ehAutorDoArtigo(item) &&
            temPermissao(
                "artigo.rejeitar",
                obterTemaId(item)
            )
        );

    }

    function podeSolicitarAjustes(item) {

        return (
            podeRevisarArtigo(item) &&
            estaEmRevisao(item) &&
            !ehAutorDoArtigo(item) &&
            temPermissao(
                "artigo.solicitar.ajustes",
                obterTemaId(item)
            )
        );

    }

    function podePublicarArtigo(item) {

        return (
            podeRevisarArtigo(item) &&
            estaAprovado(item) &&
            temPermissao(
                "artigo.publicar",
                obterTemaId(item)
            )
        );

    }

    // =========================================
    // CONTEÚDOS AUTORIZADOS
    // =========================================

    const conteudosPermitidos = {

        Pendente: conteudos.Pendente.filter(
            podeRevisarArtigo
        ),

        Aprovado: conteudos.Aprovado.filter(
            podeRevisarArtigo
        ),

        Rejeitado: conteudos.Rejeitado.filter(
            podeRevisarArtigo
        )

    };

    const contagens = {

        Pendente:
            conteudosPermitidos.Pendente.length,

        Aprovado:
            conteudosPermitidos.Aprovado.length,

        Rejeitado:
            conteudosPermitidos.Rejeitado.length

    };

    // =========================================
    // FORMATAÇÃO DE DATA
    // =========================================

    function formatarData(data) {

        if (!data) {
            return "Não informada";
        }

        const dataFormatada = new Date(data);

        if (isNaN(dataFormatada.getTime())) {
            return "Não informada";
        }

        return dataFormatada.toLocaleDateString(
            "pt-BR"
        );

    }

    // =========================================
    // PESQUISA
    // =========================================

    const listaFiltrada =
        conteudosPermitidos[abaAtiva].filter(item => {

            const texto =
                normalizarTexto(pesquisa);

            const titulo =
                normalizarTexto(item.titulo);

            const tema =
                normalizarTexto(item.tema);

            const autor =
                normalizarTexto(item.autor);

            return (
                titulo.includes(texto) ||
                tema.includes(texto) ||
                autor.includes(texto)
            );

        });

    // =========================================
    // PAGINAÇÃO
    // =========================================

    const totalPaginas = Math.max(
        1,
        Math.ceil(
            listaFiltrada.length / itensPorPagina
        )
    );

    const paginaAtual = Math.min(
        pagina,
        totalPaginas
    );

    const listaPaginada = listaFiltrada.slice(

        (paginaAtual - 1) * itensPorPagina,

        paginaAtual * itensPorPagina

    );

    function mudarAba(status) {

        setAbaAtiva(status);
        setPagina(1);
        setPesquisa("");

    }

    // =========================================
    // EXECUTAR AÇÕES DE REVISÃO
    // =========================================

    async function executarAcao(
        item,
        endpoint,
        verificarPermissao,
        mensagemSucesso,
        comentario
    ) {

        if (
            executandoAcaoRef.current ||
            !verificarPermissao(item)
        ) {

            return;

        }

        const artigoId = obterArtigoId(item);

        if (!artigoId) {

            alert(
                "Não foi possível identificar o artigo."
            );

            return;

        }

        try {

            executandoAcaoRef.current = true;

            setAcaoEmAndamento(artigoId);

            const opcoes = {
                method: "POST"
            };

            if (comentario !== undefined) {

                opcoes.body = JSON.stringify({
                    comentario
                });

            }

            const resposta = await requisicaoApi(
                `/api/Artigos/${artigoId}/${endpoint}`,
                opcoes
            );

            alert(
                resposta?.mensagem ||
                mensagemSucesso
            );

            await carregarConteudos();

        } catch (error) {

            console.error(
                "Erro ao executar ação de revisão:",
                error
            );

            alert(
                error.message ||
                "Não foi possível realizar a operação."
            );

        } finally {

            executandoAcaoRef.current = false;

            setAcaoEmAndamento(null);

        }

    }

    // =========================================
    // APROVAR ARTIGO
    // =========================================

    async function aprovarConteudo(item) {

        if (!podeAprovarArtigo(item)) return;

        const comentario = window.prompt(
            "Digite um comentário para o histórico da revisão (opcional):"
        );

        if (comentario === null) return;

        await executarAcao(

            item,

            "aprovar",

            podeAprovarArtigo,

            "Conteúdo aprovado com sucesso!",

            comentario.trim() || null

        );

    }

    // =========================================
    // REJEITAR ARTIGO
    // =========================================

    async function rejeitarConteudo(item) {

        if (!podeRejeitarArtigo(item)) return;

        const comentario = window.prompt(
            "Informe o motivo da rejeição:"
        );

        if (comentario === null) return;

        if (!comentario.trim()) {

            alert(
                "Informe o motivo da rejeição para continuar."
            );

            return;

        }

        await executarAcao(

            item,

            "rejeitar",

            podeRejeitarArtigo,

            "Conteúdo rejeitado.",

            comentario.trim()

        );

    }

    // =========================================
    // SOLICITAR AJUSTES
    // =========================================

    async function solicitarAjustes(item) {

        if (!podeSolicitarAjustes(item)) return;

        const comentario = window.prompt(
            "Descreva os ajustes que o autor precisa realizar:"
        );

        if (comentario === null) return;

        if (!comentario.trim()) {

            alert(
                "Descreva os ajustes necessários para continuar."
            );

            return;

        }

        await executarAcao(

            item,

            "solicitar-ajustes",

            podeSolicitarAjustes,

            "Ajustes solicitados ao autor.",

            comentario.trim()

        );

    }

    // =========================================
    // PUBLICAR ARTIGO
    // =========================================

    async function publicarConteudo(item) {

        if (!podePublicarArtigo(item)) return;

        const confirmar = window.confirm(
            "Deseja publicar este conteúdo? Ele ficará disponível conforme sua visibilidade."
        );

        if (!confirmar) return;

        await executarAcao(

            item,

            "publicar",

            podePublicarArtigo,

            "Conteúdo publicado com sucesso!"

        );

    }

    // =========================================
    // VISUALIZAR ARTIGO
    // =========================================

    function visualizarConteudo(item) {

        if (!podeRevisarArtigo(item)) return;

        const artigoId = obterArtigoId(item);

        if (!artigoId) return;

        navigate(
            `/conteudos/detalhes?id=${encodeURIComponent(artigoId)}`,
            {

                state: {

                    origem: "/conteudos/revisao",

                    conteudo: {

                        ...item,

                        id: artigoId,

                        artigoId,

                        temaId: obterTemaId(item),

                        data: formatarData(
                            item.dataCriacao
                        )

                    }

                }

            }
        );

    }

    // =========================================
    // BOTÕES DE AÇÕES
    // =========================================

    function botoesAcoes(item) {

        const ocupado =
            acaoEmAndamento !== null;

        return (

            <div className="revisao-acoes-status">

                {/* APROVAR */}

                {abaAtiva === "Pendente" &&
                    podeAprovarArtigo(item) && (

                    <button
                        type="button"
                        className="revisao-botao-aprovar"
                        title="Aprovar conteúdo"
                        aria-label="Aprovar conteúdo"
                        disabled={ocupado}

                        onClick={() =>
                            aprovarConteudo(item)
                        }
                    >

                        <Check
                            size={18}
                            strokeWidth={2.5}
                        />

                    </button>

                )}

                {/* SOLICITAR AJUSTES */}

                {abaAtiva === "Pendente" &&
                    podeSolicitarAjustes(item) && (

                    <button
                        type="button"
                        className="revisao-botao-ajustes"
                        title="Solicitar ajustes"
                        aria-label="Solicitar ajustes"
                        disabled={ocupado}

                        onClick={() =>
                            solicitarAjustes(item)
                        }
                    >

                        <Pencil
                            size={17}
                            strokeWidth={2}
                        />

                    </button>

                )}

                {/* REJEITAR */}

                {abaAtiva === "Pendente" &&
                    podeRejeitarArtigo(item) && (

                    <button
                        type="button"
                        className="revisao-botao-rejeitar"
                        title="Rejeitar conteúdo"
                        aria-label="Rejeitar conteúdo"
                        disabled={ocupado}

                        onClick={() =>
                            rejeitarConteudo(item)
                        }
                    >

                        <X
                            size={19}
                            strokeWidth={2.5}
                        />

                    </button>

                )}

                {/* PUBLICAR */}

                {abaAtiva === "Aprovado" &&
                    podePublicarArtigo(item) && (

                    <button
                        type="button"
                        className="revisao-botao-publicar"
                        title="Publicar conteúdo"
                        aria-label="Publicar conteúdo"
                        disabled={ocupado}

                        onClick={() =>
                            publicarConteudo(item)
                        }
                    >

                        <Send
                            size={18}
                            strokeWidth={2}
                        />

                    </button>

                )}

                {/* VISUALIZAR */}

                {podeRevisarArtigo(item) && (

                    <button
                        type="button"
                        className="revisao-botao-visualizar"
                        title="Visualizar conteúdo"
                        aria-label="Visualizar conteúdo"
                        disabled={ocupado}

                        onClick={() =>
                            visualizarConteudo(item)
                        }
                    >

                        <Eye
                            size={18}
                            strokeWidth={2}
                        />

                    </button>

                )}

            </div>

        );

    }

    // =========================================
    // ESTADO DA LISTAGEM
    // =========================================

    const carregandoLista =
        carregando ||
        carregandoPermissoes;

    const erroLista =
        erroPermissoes
            ? "Não foi possível carregar suas permissões."
            : erro;

    const mensagemLista =
        carregandoLista
            ? "Carregando conteúdos..."
            : erroLista
                ? erroLista
                : "Nenhum conteúdo encontrado.";

    // =========================================
    // RENDERIZAÇÃO
    //
    // Sidebar e Header são fornecidos
    // pelo LayoutSistema.
    // =========================================

    return (

        <div className="revisao-pagina">

            <main className="revisao-principal">

                <section className="revisao-conteudo">

                    <h1 className="revisao-titulo">

                        Conteúdos para revisão

                    </h1>

                    {/* CARREGANDO PERMISSÕES */}

                    {carregandoPermissoes ? (

                        <p role="status">

                            Carregando permissões...

                        </p>

                    ) : erroPermissoes ? (

                        <div
                            className="revisao-erro"
                            role="alert"
                        >

                            <p>
                                Não foi possível carregar
                                suas permissões.
                            </p>

                            <button
                                type="button"
                                onClick={atualizar}
                            >

                                Tentar novamente

                            </button>

                        </div>

                    ) : !podeRevisar ? (

                        <div
                            className="revisao-erro"
                            role="alert"
                        >

                            <h2>Acesso negado</h2>

                            <p>

                                Você não possui permissão
                                para revisar conteúdos.

                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/home")
                                }
                            >

                                Voltar ao início

                            </button>

                        </div>

                    ) : (

                        <>

                            {/* ABAS */}

                            <div className="revisao-abas">

                                {abas.map(aba => (

                                    <button
                                        key={aba.chave}
                                        type="button"

                                        className={
                                            abaAtiva === aba.chave
                                                ? "aba-revisao ativa"
                                                : "aba-revisao"
                                        }

                                        onClick={() =>
                                            mudarAba(aba.chave)
                                        }
                                    >

                                        {aba.titulo}{" "}

                                        ({contagens[aba.chave]})

                                    </button>

                                ))}

                            </div>

                            {/* PESQUISA */}

                            <div className="revisao-pesquisa">

                                <input
                                    type="search"

                                    placeholder="Buscar por título, tema ou autor..."

                                    aria-label="Pesquisar conteúdos para revisão"

                                    value={pesquisa}

                                    onChange={event =>
                                        alterarPesquisa(
                                            event.target.value
                                        )
                                    }
                                />

                            </div>

                            {/* ERRO DA API */}

                            {erro && (

                                <div
                                    className="revisao-erro"
                                    role="alert"
                                >

                                    <p>{erro}</p>

                                    <button
                                        type="button"
                                        onClick={carregarConteudos}
                                    >

                                        Tentar novamente

                                    </button>

                                </div>

                            )}

                            {/* TABELA DESKTOP */}

                            <div className="revisao-tabela-container">

                                <table className="revisao-tabela">

                                    <thead>

                                        <tr>

                                            <th>Título</th>

                                            <th>Tema</th>

                                            <th>Data de criação</th>

                                            <th>Autor</th>

                                            <th className="revisao-coluna-acoes">

                                                Ações

                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {carregandoLista ||
                                        erroLista ||
                                        listaPaginada.length === 0 ? (

                                            <tr>

                                                <td
                                                    colSpan={5}
                                                    className="revisao-vazio"
                                                >

                                                    {mensagemLista}

                                                </td>

                                            </tr>

                                        ) : (

                                            listaPaginada.map(item => (

                                                <tr
                                                    key={obterArtigoId(item)}
                                                >

                                                    <td>
                                                        {item.titulo}
                                                    </td>

                                                    <td>

                                                        <span className="revisao-etiqueta">

                                                            {item.tema ||
                                                                "Não informado"}

                                                        </span>

                                                    </td>

                                                    <td>

                                                        {formatarData(
                                                            item.dataCriacao
                                                        )}

                                                    </td>

                                                    <td>

                                                        {item.autor ||
                                                            "Não informado"}

                                                    </td>

                                                    <td className="revisao-coluna-acoes">

                                                        {botoesAcoes(item)}

                                                    </td>

                                                </tr>

                                            ))

                                        )}

                                    </tbody>

                                </table>

                            </div>

                            {/* CARTÕES MOBILE */}

                            <div className="revisao-cartoes">

                                {carregandoLista ||
                                erroLista ||
                                listaPaginada.length === 0 ? (

                                    <p className="revisao-vazio-mobile">

                                        {mensagemLista}

                                    </p>

                                ) : (

                                    listaPaginada.map(item => (

                                        <article
                                            key={obterArtigoId(item)}

                                            className="revisao-cartao"
                                        >

                                            <div className="cartao-campo cartao-titulo">

                                                <strong>Título</strong>

                                                <span>{item.titulo}</span>

                                            </div>

                                            <div className="cartao-campo cartao-data">

                                                <strong>

                                                    Data de criação

                                                </strong>

                                                <span>

                                                    {formatarData(
                                                        item.dataCriacao
                                                    )}

                                                </span>

                                            </div>

                                            <div className="cartao-campo cartao-tema">

                                                <strong>Tema</strong>

                                                <span className="revisao-etiqueta">

                                                    {item.tema ||
                                                        "Não informado"}

                                                </span>

                                            </div>

                                            <div className="cartao-campo cartao-autor">

                                                <strong>Autor</strong>

                                                <span>

                                                    {item.autor ||
                                                        "Não informado"}

                                                </span>

                                            </div>

                                            <div className="cartao-acoes">

                                                {botoesAcoes(item)}

                                            </div>

                                        </article>

                                    ))

                                )}

                            </div>

                            {/* PAGINAÇÃO */}

                            {!carregandoLista &&
                                !erroLista &&
                                listaFiltrada.length > 0 && (

                                <div className="revisao-paginacao">

                                    <button
                                        type="button"

                                        disabled={
                                            paginaAtual === 1
                                        }

                                        aria-label="Página anterior"

                                        onClick={() =>
                                            setPagina(
                                                paginaAtual - 1
                                            )
                                        }
                                    >

                                        {"<"}

                                    </button>

                                    {Array.from(

                                        { length: totalPaginas },

                                        (_, indice) =>
                                            indice + 1

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

export default ConteudoRevisao;