import {
    useEffect,
    useState,
    useCallback
} from "react";

import { NavLink } from "react-router-dom";

import "./Historicodeacoes.css";

import { requisicaoApi } from "../../services/api";

import usePermissoes from "../../hooks/usePermissoes";
import usePesquisaLayout from "../../hooks/usePesquisaLayout";

import LupaCinza from "../../assets/Icones/LupaCinza.png";
import Calendario from "../../assets/Icones/calendario.png";
import ExpandirText from "../../assets/Icones/ExpandirText.png";

const ITENS_POR_PAGINA = 5;

// =========================================
// FORMATAÇÃO DE DATA E HORA
// =========================================

function dataUtcParaBrasil(valor) {
    if (!valor) return "—";

    const texto = String(valor);

    const comFuso =
        /(?:Z|[+-]\d{2}:\d{2})$/i.test(texto)
            ? texto
            : `${texto}Z`;

    const data = new Date(comFuso);

    if (Number.isNaN(data.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(data);
}

// =========================================
// CONVERSÃO DOS FILTROS PARA UTC
// =========================================

// Preserva o padrão atual do sistema:
// horário de Brasília (UTC-03).

function inicioBrasiliaEmUtc(data) {
    return data
        ? new Date(`${data}T00:00:00-03:00`).toISOString()
        : "";
}

function diaSeguinteBrasilEmUtc(data) {
    if (!data) return "";

    const proximo = new Date(
        `${data}T00:00:00-03:00`
    );

    proximo.setUTCDate(
        proximo.getUTCDate() + 1
    );

    return proximo.toISOString();
}

// =========================================
// COMPONENTE PRINCIPAL
// =========================================

function Historicodeacoes() {

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

    const podeVisualizarHistorico =
        autenticado &&
        temPermissao("auditoria.ler");

    const acessoLiberado =
        podeVisualizarHistorico &&
        !carregandoPermissoes &&
        !erroPermissoes;

    const token = localStorage.getItem("token");

    // =========================================
    // ESTADOS DA LISTAGEM
    // =========================================

    const [acoes, setAcoes] = useState([]);

    const [perfis, setPerfis] = useState([]);

    const [usuarios, setUsuarios] = useState([]);

    const [tipos, setTipos] = useState([]);

    // =========================================
    // ESTADOS DOS FILTROS
    // =========================================

    const [perfilSelecionado, setPerfilSelecionado] =
        useState("");

    const [usuarioSelecionado, setUsuarioSelecionado] =
        useState("");

    const [tipoSelecionado, setTipoSelecionado] =
        useState("");

    const [pesquisa, setPesquisa] = useState("");

    const [dataInicio, setDataInicio] = useState("");

    const [dataFim, setDataFim] = useState("");

    const [filtrosAplicados, setFiltrosAplicados] =
        useState({});

    // =========================================
    // PAGINAÇÃO
    // =========================================

    const [paginaAtual, setPaginaAtual] =
        useState(1);

    const [totalPaginas, setTotalPaginas] =
        useState(1);

    // =========================================
    // CARREGAMENTO E ERROS
    // =========================================

    const [carregando, setCarregando] =
        useState(true);

    const [carregandoFiltros, setCarregandoFiltros] =
        useState(true);

    const [erro, setErro] = useState("");

    const [erroFiltros, setErroFiltros] =
        useState("");

    const [erroPeriodo, setErroPeriodo] =
        useState("");

    const [versaoConsulta, setVersaoConsulta] =
        useState(0);

    const [versaoFiltros, setVersaoFiltros] =
        useState(0);

    // =========================================
    // PESQUISA DO LAYOUT COMPARTILHADO
    // =========================================

    const alterarPesquisa = useCallback(valor => {
        setPesquisa(valor);
    }, []);

    usePesquisaLayout(
        pesquisa,
        alterarPesquisa
    );

    // =========================================
    // LIMPAR DADOS AO ALTERAR A SESSÃO
    // =========================================

    useEffect(() => {

        setAcoes([]);
        setPerfis([]);
        setUsuarios([]);
        setTipos([]);

        setPerfilSelecionado("");
        setUsuarioSelecionado("");
        setTipoSelecionado("");

        setPesquisa("");
        setDataInicio("");
        setDataFim("");

        setPaginaAtual(1);
        setTotalPaginas(1);

        setFiltrosAplicados({});

        setErro("");
        setErroFiltros("");
        setErroPeriodo("");

    }, [token, acessoLiberado]);

    // =========================================
    // CARREGAR OPÇÕES DOS FILTROS
    // =========================================

    useEffect(() => {

        let ativo = true;

        if (!acessoLiberado) {

            setPerfis([]);
            setUsuarios([]);
            setTipos([]);
            setCarregandoFiltros(false);

            return;

        }

        async function carregarFiltros() {

            try {

                setCarregandoFiltros(true);
                setErroFiltros("");

                const opcoes = await requisicaoApi(
                    "/api/Auditoria/filtros"
                );

                if (
                    !ativo ||
                    localStorage.getItem("token") !== token
                ) {
                    return;
                }

                setPerfis(
                    Array.isArray(opcoes?.perfis)
                        ? opcoes.perfis
                        : []
                );

                setUsuarios(
                    Array.isArray(opcoes?.usuarios)
                        ? opcoes.usuarios
                        : []
                );

                setTipos(
                    Array.isArray(opcoes?.acoes)
                        ? opcoes.acoes
                        : []
                );

            } catch (error) {

                if (!ativo) return;

                console.error(
                    "Erro ao carregar filtros de auditoria:",
                    error
                );

                setErroFiltros(
                    error.message ||
                    "Não foi possível carregar os filtros."
                );

            } finally {

                if (ativo) {
                    setCarregandoFiltros(false);
                }

            }

        }

        carregarFiltros();

        return () => {
            ativo = false;
        };

    }, [
        acessoLiberado,
        token,
        versaoFiltros
    ]);

    // =========================================
    // CARREGAR HISTÓRICO PELA API
    // =========================================

    useEffect(() => {

        let ativo = true;

        if (!acessoLiberado) {

            setAcoes([]);
            setCarregando(false);

            return;

        }

        async function carregarHistorico() {

            try {

                setCarregando(true);
                setErro("");
                setAcoes([]);

                const parametros = new URLSearchParams({

                    pagina: String(paginaAtual),

                    tamanhoPagina: String(
                        ITENS_POR_PAGINA
                    )

                });

                // FILTRO POR PERFIL

                if (filtrosAplicados.perfilId) {

                    parametros.set(
                        "perfilId",
                        filtrosAplicados.perfilId
                    );

                }

                // FILTRO POR USUÁRIO

                if (filtrosAplicados.usuarioId) {

                    parametros.set(
                        "usuarioId",
                        filtrosAplicados.usuarioId
                    );

                }

                // FILTRO POR TIPO DE AÇÃO

                if (filtrosAplicados.acao) {

                    parametros.set(
                        "acao",
                        filtrosAplicados.acao
                    );

                }

                // PESQUISA TEXTUAL

                if (filtrosAplicados.pesquisa) {

                    parametros.set(
                        "pesquisa",
                        filtrosAplicados.pesquisa
                    );

                }

                // DATA INICIAL

                if (filtrosAplicados.dataInicio) {

                    parametros.set(
                        "dataInicio",

                        inicioBrasiliaEmUtc(
                            filtrosAplicados.dataInicio
                        )
                    );

                }

                // DATA FINAL

                if (filtrosAplicados.dataFim) {

                    parametros.set(
                        "dataFim",

                        diaSeguinteBrasilEmUtc(
                            filtrosAplicados.dataFim
                        )
                    );

                }

                // CONSULTAR API

                const resposta = await requisicaoApi(
                    `/api/Auditoria?${parametros.toString()}`
                );

                if (
                    !ativo ||
                    localStorage.getItem("token") !== token
                ) {
                    return;
                }

                if (!Array.isArray(resposta?.registros)) {

                    throw new Error(
                        "A API retornou uma listagem de auditoria inválida."
                    );

                }

                const paginas = Math.max(
                    1,
                    Number(resposta.totalPaginas) || 1
                );

                setTotalPaginas(paginas);

                // Corrige a página caso o total
                // de registros tenha diminuído.

                if (paginaAtual > paginas) {

                    setPaginaAtual(paginas);

                    return;

                }

                setAcoes(resposta.registros);

            } catch (error) {

                if (!ativo) return;

                console.error(
                    "Erro ao carregar histórico:",
                    error
                );

                setAcoes([]);

                setErro(
                    error.message ||
                    "Não foi possível carregar o histórico."
                );

            } finally {

                if (ativo) {
                    setCarregando(false);
                }

            }

        }

        carregarHistorico();

        return () => {
            ativo = false;
        };

    }, [
        acessoLiberado,
        token,
        paginaAtual,
        filtrosAplicados,
        versaoConsulta
    ]);

    // =========================================
    // FILTRAR USUÁRIOS PELO PERFIL
    // =========================================

    const usuariosDoPerfil = usuarios

        .filter(usuario => {

            if (!perfilSelecionado) {
                return true;
            }

            // Preserva o formato original da API.

            return (

                String(usuario.perfilId || "")
                    .toLowerCase() ===

                String(perfilSelecionado)
                    .toLowerCase()

            );

        })

        .filter((usuario, indice, lista) =>

            lista.findIndex(outro =>

                String(outro.usuarioId).toLowerCase() ===

                String(usuario.usuarioId).toLowerCase()

            ) === indice

        );

    // =========================================
    // APLICAR FILTROS
    // =========================================

    function buscarAcoes(event) {

        event?.preventDefault();

        if (!acessoLiberado) return;

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

        setPaginaAtual(1);

        setFiltrosAplicados({

            perfilId: perfilSelecionado,

            usuarioId: usuarioSelecionado,

            acao: tipoSelecionado,

            pesquisa: pesquisa.trim(),

            dataInicio,

            dataFim

        });

    }

    // =========================================
    // LIMPAR FILTROS
    // =========================================

    function limparFiltros() {

        if (!acessoLiberado) return;

        setPerfilSelecionado("");
        setUsuarioSelecionado("");
        setTipoSelecionado("");

        setPesquisa("");

        setDataInicio("");
        setDataFim("");

        setErroPeriodo("");

        setPaginaAtual(1);

        setFiltrosAplicados({});

    }

    // =========================================
    // ATUALIZAR HISTÓRICO
    // =========================================

    function atualizarHistorico() {

        if (!acessoLiberado) return;

        setVersaoConsulta(
            atual => atual + 1
        );

    }

    // =========================================
    // PAGINAÇÃO COM LIMITE DE BOTÕES
    // =========================================

    const primeiraPaginaVisivel = Math.max(

        1,

        Math.min(
            paginaAtual - 2,
            totalPaginas - 4
        )

    );

    const paginasVisiveis = Array.from(

        {
            length: Math.min(
                5,
                totalPaginas
            )
        },

        (_, indice) =>
            primeiraPaginaVisivel + indice

    );

    const carregandoLista =
        carregando ||
        carregandoPermissoes;

    // =========================================
    // RENDERIZAÇÃO
    //
    // Sidebar e Headers são fornecidos
    // exclusivamente pelo LayoutSistema.
    // =========================================

    return (

        <div className="pagina-historico">

            <main className="principal-historico">

                <section className="conteudo-historico">

                    <NavLink
                        to="/home"

                        className="voltar-historico"
                    >

                        ← Voltar

                    </NavLink>

                    {/* CABEÇALHO DA PÁGINA */}

                    <div className="cabecalho-historico">

                        <h1>Histórico de ações</h1>

                        {acessoLiberado && (

                            <button
                                type="button"

                                className="botao-atualizar-historico"

                                onClick={atualizarHistorico}

                                disabled={carregando}
                            >

                                {carregando

                                    ? "Atualizando..."

                                    : "↻ Atualizar"}

                            </button>

                        )}

                    </div>

                    {/* CARREGANDO PERMISSÕES */}

                    {carregandoPermissoes ? (

                        <p role="status">

                            Carregando permissões...

                        </p>

                    ) : erroPermissoes ? (

                        <div
                            className="historico-aviso erro"

                            role="alert"
                        >

                            <p>

                                Não foi possível carregar
                                suas permissões.

                            </p>

                            <button
                                type="button"

                                className="botao-buscar-historico"

                                onClick={atualizar}
                            >

                                Tentar novamente

                            </button>

                        </div>

                    ) : !podeVisualizarHistorico ? (

                        <div
                            className="historico-aviso erro"

                            role="alert"
                        >

                            <strong>

                                Acesso negado

                            </strong>

                            <p>

                                Você não possui permissão
                                para visualizar o histórico
                                de ações.

                            </p>

                        </div>

                    ) : (

                        <>

                            {/* ERRO DOS FILTROS */}

                            {erroFiltros && (

                                <div
                                    className="historico-aviso erro"

                                    role="alert"
                                >

                                    <p>

                                        {erroFiltros}

                                    </p>

                                    <button
                                        type="button"

                                        className="botao-buscar-historico"

                                        disabled={carregandoFiltros}

                                        onClick={() =>

                                            setVersaoFiltros(
                                                atual => atual + 1
                                            )

                                        }
                                    >

                                        Tentar novamente

                                    </button>

                                </div>

                            )}

                            {/* FORMULÁRIO DE PESQUISA */}

                            <form onSubmit={buscarAcoes}>

                                <div className="pesquisa-historico">

                                    <img
                                        src={LupaCinza}
                                        alt=""
                                    />

                                    <input
                                        type="search"

                                        placeholder="Buscar ações, usuários ou descrições..."

                                        aria-label="Pesquisar registros de auditoria"

                                        value={pesquisa}

                                        onChange={event =>

                                            alterarPesquisa(
                                                event.target.value
                                            )

                                        }
                                    />

                                </div>

                                {/* FILTROS */}

                                <div className="filtros-historico">

                                    {/* PERÍODO */}

                                    <div className="campo-filtro periodo-filtro">

                                        <label>

                                            Período

                                        </label>

                                        <div className="campos-periodo">

                                            <div className="campo-data">

                                                <input
                                                    type="date"

                                                    aria-label="Data inicial"

                                                    value={dataInicio}

                                                    onChange={event => {

                                                        setDataInicio(
                                                            event.target.value
                                                        );

                                                        setErroPeriodo("");

                                                    }}
                                                />

                                                <img
                                                    src={Calendario}
                                                    alt=""
                                                />

                                            </div>

                                            <span>-</span>

                                            <div className="campo-data">

                                                <input
                                                    type="date"

                                                    aria-label="Data final"

                                                    min={
                                                        dataInicio ||
                                                        undefined
                                                    }

                                                    value={dataFim}

                                                    onChange={event => {

                                                        setDataFim(
                                                            event.target.value
                                                        );

                                                        setErroPeriodo("");

                                                    }}
                                                />

                                                <img
                                                    src={Calendario}
                                                    alt=""
                                                />

                                            </div>

                                        </div>

                                    </div>

                                    {/* PERFIL */}

                                    <div className="campo-filtro perfil-filtro">

                                        <label htmlFor="historico-perfil">

                                            Perfil

                                        </label>

                                        <div className="select-personalizado">

                                            <select
                                                id="historico-perfil"

                                                value={perfilSelecionado}

                                                disabled={
                                                    carregandoFiltros
                                                }

                                                onChange={event => {

                                                    setPerfilSelecionado(
                                                        event.target.value
                                                    );

                                                    setUsuarioSelecionado("");

                                                }}
                                            >

                                                <option value="">

                                                    Todos os perfis

                                                </option>

                                                {perfis.map(perfil => (

                                                    <option
                                                        key={perfil.perfilId}

                                                        value={perfil.perfilId}
                                                    >

                                                        {perfil.nome}

                                                    </option>

                                                ))}

                                            </select>

                                            <img
                                                src={ExpandirText}
                                                alt=""
                                            />

                                        </div>

                                    </div>

                                    {/* USUÁRIO */}

                                    <div className="campo-filtro usuario-filtro">

                                        <label htmlFor="historico-usuario">

                                            Usuário

                                        </label>

                                        <div className="select-personalizado">

                                            <select
                                                id="historico-usuario"

                                                value={usuarioSelecionado}

                                                disabled={
                                                    carregandoFiltros
                                                }

                                                onChange={event =>

                                                    setUsuarioSelecionado(
                                                        event.target.value
                                                    )

                                                }
                                            >

                                                <option value="">

                                                    Todos os usuários

                                                </option>

                                                {usuariosDoPerfil.map(usuario => (

                                                    <option
                                                        key={usuario.usuarioId}

                                                        value={usuario.usuarioId}
                                                    >

                                                        {usuario.nome}

                                                    </option>

                                                ))}

                                            </select>

                                            <img
                                                src={ExpandirText}
                                                alt=""
                                            />

                                        </div>

                                    </div>

                                    {/* TIPO DE AÇÃO */}

                                    <div className="campo-filtro tipo-filtro">

                                        <label htmlFor="historico-acao">

                                            Tipo de ação

                                        </label>

                                        <div className="select-personalizado">

                                            <select
                                                id="historico-acao"

                                                value={tipoSelecionado}

                                                disabled={
                                                    carregandoFiltros
                                                }

                                                onChange={event =>

                                                    setTipoSelecionado(
                                                        event.target.value
                                                    )

                                                }
                                            >

                                                <option value="">

                                                    Todas

                                                </option>

                                                {tipos.map(tipo => (

                                                    <option
                                                        key={tipo}

                                                        value={tipo}
                                                    >

                                                        {tipo}

                                                    </option>

                                                ))}

                                            </select>

                                            <img
                                                src={ExpandirText}
                                                alt=""
                                            />

                                        </div>

                                    </div>

                                    {/* BOTÕES */}

                                    <div className="botoes-filtros-historico">

                                        <button
                                            type="submit"

                                            className="botao-buscar-historico"

                                            disabled={carregando}
                                        >

                                            Buscar

                                        </button>

                                        <button
                                            type="button"

                                            className="botao-limpar-historico"

                                            onClick={limparFiltros}

                                            disabled={carregando}
                                        >

                                            Limpar

                                        </button>

                                    </div>

                                </div>

                            </form>

                            {/* ERRO DE PERÍODO */}

                            {erroPeriodo && (

                                <div
                                    className="historico-aviso erro"

                                    role="alert"
                                >

                                    {erroPeriodo}

                                </div>

                            )}

                            {/* ERRO DA API */}

                            {erro && (

                                <div
                                    className="historico-aviso erro"

                                    role="alert"
                                >

                                    <p>{erro}</p>

                                    <button
                                        type="button"

                                        className="botao-buscar-historico"

                                        onClick={atualizarHistorico}
                                    >

                                        Tentar novamente

                                    </button>

                                </div>

                            )}

                            {/* INFORMAÇÕES DA LISTAGEM */}

                            {!carregandoLista && !erro && (

                                <div className="historico-informacoes-lista">

                                    <span>

                                        Registros de auditoria

                                    </span>

                                    <span>

                                        Horário de Brasília

                                    </span>

                                </div>

                            )}

                            {/* TABELA DE HISTÓRICO */}

                            <div className="tabela-historico">

                                <table>

                                    <thead>

                                        <tr>

                                            <th>Data e hora</th>

                                            <th>Usuário</th>

                                            <th>Ação</th>

                                            <th>Descrição</th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {carregandoLista ? (

                                            <tr>

                                                <td
                                                    colSpan={4}

                                                    className="sem-acoes"
                                                >

                                                    Carregando histórico...

                                                </td>

                                            </tr>

                                        ) : erro ? (

                                            <tr>

                                                <td
                                                    colSpan={4}

                                                    className="sem-acoes"
                                                >

                                                    Não foi possível
                                                    carregar o histórico.

                                                </td>

                                            </tr>

                                        ) : acoes.length > 0 ? (

                                            acoes.map(item => (

                                                <tr key={item.logAuditoriaId}>

                                                    {/* DATA E HORA */}

                                                    <td>

                                                        {dataUtcParaBrasil(
                                                            item.dataHora
                                                        )}

                                                    </td>

                                                    {/* USUÁRIO */}

                                                    <td>

                                                        {item.usuarioNome ||
                                                            "Sistema"}

                                                    </td>

                                                    {/* AÇÃO */}

                                                    <td>

                                                        <span className="historico-tipo-acao">

                                                            {item.acao || "—"}

                                                        </span>

                                                    </td>

                                                    {/* DESCRIÇÃO */}

                                                    <td>

                                                        {item.detalhes ||

                                                            item.tabelaAfetada ||

                                                            "Sem detalhes"}

                                                    </td>

                                                </tr>

                                            ))

                                        ) : (

                                            <tr>

                                                <td
                                                    colSpan={4}

                                                    className="sem-acoes"
                                                >

                                                    Nenhuma ação encontrada.

                                                </td>

                                            </tr>

                                        )}

                                    </tbody>

                                </table>

                            </div>

                            {/* PAGINAÇÃO */}

                            {!carregandoLista &&
                                !erro &&
                                acoes.length > 0 && (

                                <div className="rodape-historico">

                                    <span className="historico-info-pagina">

                                        Página {paginaAtual} de {totalPaginas}

                                    </span>

                                    <div className="paginacao-historico">

                                        <button
                                            type="button"

                                            aria-label="Página anterior"

                                            disabled={
                                                paginaAtual === 1
                                            }

                                            onClick={() =>

                                                setPaginaAtual(
                                                    paginaAtual - 1
                                                )

                                            }
                                        >

                                            {"<"}

                                        </button>

                                        {paginasVisiveis.map(numero => (

                                            <button
                                                key={numero}

                                                type="button"

                                                aria-current={
                                                    paginaAtual === numero
                                                        ? "page"
                                                        : undefined
                                                }

                                                className={

                                                    paginaAtual === numero

                                                        ? "pagina-ativa"

                                                        : ""

                                                }

                                                onClick={() =>
                                                    setPaginaAtual(numero)
                                                }
                                            >

                                                {numero}

                                            </button>

                                        ))}

                                        <button
                                            type="button"

                                            aria-label="Próxima página"

                                            disabled={
                                                paginaAtual === totalPaginas
                                            }

                                            onClick={() =>

                                                setPaginaAtual(
                                                    paginaAtual + 1
                                                )

                                            }
                                        >

                                            {">"}

                                        </button>

                                    </div>

                                </div>

                            )}

                        </>

                    )}

                </section>

            </main>

        </div>

    );

}

export default Historicodeacoes;