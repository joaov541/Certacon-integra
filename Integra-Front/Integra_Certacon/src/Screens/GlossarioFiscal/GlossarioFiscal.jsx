import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";

import {
    Search,
    Plus,
    Pencil,
    BookOpen,
    Power,
    X,
    Check,
    ChevronLeft,
    ChevronRight,
    RefreshCw
} from "lucide-react";

import { requisicaoApi } from "../../services/api";

import usePermissoes from "../../hooks/usePermissoes";
import usePesquisaLayout from "../../hooks/usePesquisaLayout";

import LogoNome from "../../assets/Icones/LogoNome.png";

import "./GlossarioFiscal.css";

const API_GLOSSARIO = "/api/Glossario";

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const ITENS_POR_PAGINA = 6;

const formularioInicial = {
    termo: "",
    significado: "",
    descricao: ""
};

// =========================================
// NORMALIZAR PESQUISA
// =========================================

function normalizar(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

// =========================================
// COMPONENTE PRINCIPAL
// =========================================

export default function GlossarioFiscal() {
    const {
        autenticado,
        temPermissao
    } = usePermissoes();

    const token = localStorage.getItem("token");

    const podeGerenciar =
        autenticado &&
        temPermissao("glossario.gerenciar");

    // =========================================
    // ESTADOS
    // =========================================

    const [termos, setTermos] = useState([]);
    const [pesquisa, setPesquisa] = useState("");
    const [letraSelecionada, setLetraSelecionada] = useState("Todas");
    const [pagina, setPagina] = useState(1);

    const [modoGerenciamento, setModoGerenciamento] = useState(false);
    const [filtroStatus, setFiltroStatus] = useState("todos");

    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);

    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");

    const [erroFormulario, setErroFormulario] = useState("");
    const [erroConsulta, setErroConsulta] = useState("");

    const [formularioAberto, setFormularioAberto] = useState(false);
    const [termoEditando, setTermoEditando] = useState(null);
    const [formulario, setFormulario] = useState(formularioInicial);

    const [versao, setVersao] = useState(0);
    const [consultaCarregada, setConsultaCarregada] = useState(null);

    const operacaoRef = useRef(false);
    const montadoRef = useRef(false);
    const formularioRef = useRef(null);

    const gerenciando = podeGerenciar && modoGerenciamento;

    const chaveConsulta = `${token || "publico"}:${gerenciando}:${versao}`;

    const acessoRef = useRef({
        token,
        podeGerenciar
    });

    acessoRef.current = {
        token,
        podeGerenciar
    };

    // =========================================
    // CONTROLE DE MONTAGEM
    // =========================================

    useEffect(() => {
        montadoRef.current = true;

        return () => {
            montadoRef.current = false;
        };
    }, []);

    function acessoValido() {
        return (
            montadoRef.current &&
            acessoRef.current.podeGerenciar &&
            acessoRef.current.token === token &&
            localStorage.getItem("token") === token
        );
    }

    // =========================================
    // PESQUISA COMPARTILHADA
    // =========================================

    const alterarPesquisa = useCallback((valor) => {
        setPesquisa(valor);
        setPagina(1);
    }, []);

    usePesquisaLayout(pesquisa, alterarPesquisa);

    // =========================================
    // LIMPAR DADOS AO ALTERAR SESSÃO
    // =========================================

    useEffect(() => {
        setModoGerenciamento(false);
        setFormularioAberto(false);
        setTermoEditando(null);
        setFormulario(formularioInicial);
        setConsultaCarregada(null);
        setTermos([]);
        setMensagem("");
        setErro("");
        setErroFormulario("");
        setPagina(1);
        setPesquisa("");
        setLetraSelecionada("Todas");
        setFiltroStatus("todos");
    }, [token]);

    useEffect(() => {
        if (!podeGerenciar) {
            setModoGerenciamento(false);
            setFormularioAberto(false);
            setTermoEditando(null);
            setFormulario(formularioInicial);
        }
    }, [podeGerenciar]);

    // =========================================
    // CARREGAR TERMOS
    // =========================================

    useEffect(() => {
        let ativo = true;

        async function carregarTermos() {
            setCarregando(true);
            setErroConsulta("");
            setTermos([]);
            setConsultaCarregada(null);

            try {
                const endpoint = gerenciando
                    ? `${API_GLOSSARIO}/gerenciar`
                    : API_GLOSSARIO;

                const dados = await requisicaoApi(endpoint);

                if (
                    !ativo ||
                    localStorage.getItem("token") !== token
                ) {
                    return;
                }

                if (!Array.isArray(dados)) {
                    throw new Error(
                        "Resposta inesperada da API do glossário."
                    );
                }

                setTermos(dados);
                setConsultaCarregada(chaveConsulta);

            } catch (error) {
                if (ativo) {
                    setErroConsulta(
                        error.message ||
                        "Não foi possível carregar o glossário."
                    );
                }
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        carregarTermos();

        return () => {
            ativo = false;
        };
    }, [gerenciando, token, chaveConsulta]);

    function recarregarTermos() {
        setVersao(atual => atual + 1);
    }

    // =========================================
    // ALTERNAR MODO
    // =========================================

    function alterarModo(gerenciar) {
        if (operacaoRef.current) return;

        if (gerenciar && !podeGerenciar) return;

        setModoGerenciamento(gerenciar);
        setPagina(1);
        setFiltroStatus("todos");

        setFormularioAberto(false);
        setFormulario(formularioInicial);
        setTermoEditando(null);

        setErro("");
        setMensagem("");
        setErroFormulario("");
    }

    // =========================================
    // FILTROS
    // =========================================

    const termosDisponiveis =
        consultaCarregada === chaveConsulta
            ? termos
            : [];

    const termosFiltrados = termosDisponiveis
        .filter(item => {
            const texto = normalizar(
                `${item.termo} ${item.significado} ${item.descricao}`
            );

            const correspondePesquisa =
                texto.includes(normalizar(pesquisa));

            const correspondeLetra =
                letraSelecionada === "Todas" ||
                normalizar(item.termo).startsWith(
                    normalizar(letraSelecionada)
                );

            const correspondeStatus =
                !gerenciando ||
                filtroStatus === "todos" ||
                (
                    filtroStatus === "ativos" &&
                    item.ativo === true
                ) ||
                (
                    filtroStatus === "inativos" &&
                    item.ativo === false
                );

            return (
                correspondePesquisa &&
                correspondeLetra &&
                correspondeStatus
            );
        })
        .sort((a, b) =>
            a.termo.localeCompare(
                b.termo,
                "pt-BR",
                { sensitivity: "base" }
            )
        );

    const totalPaginas = Math.max(
        1,
        Math.ceil(termosFiltrados.length / ITENS_POR_PAGINA)
    );

    const paginaAtual = Math.min(pagina, totalPaginas);

    const termosPaginados = termosFiltrados.slice(
        (paginaAtual - 1) * ITENS_POR_PAGINA,
        paginaAtual * ITENS_POR_PAGINA
    );

    // =========================================
    // LIMPAR FILTROS
    // =========================================

    function limparFiltros() {
        setPesquisa("");
        setLetraSelecionada("Todas");
        setFiltroStatus("todos");
        setPagina(1);
    }

    // =========================================
    // ABRIR FORMULÁRIO DE CADASTRO
    // =========================================

    function abrirCadastro() {
        if (!podeGerenciar || operacaoRef.current) return;

        setTermoEditando(null);
        setFormulario(formularioInicial);
        setFormularioAberto(true);
        setErroFormulario("");
        setErro("");
        setMensagem("");
    }

    // =========================================
    // ABRIR FORMULÁRIO DE EDIÇÃO
    // =========================================

    function abrirEdicao(item) {
        if (!podeGerenciar || operacaoRef.current) return;

        setTermoEditando(item);

        setFormulario({
            termo: item.termo || "",
            significado: item.significado || "",
            descricao: item.descricao || ""
        });

        setFormularioAberto(true);
        setErroFormulario("");
        setErro("");
        setMensagem("");
    }

    useEffect(() => {
        if (formularioAberto) {
            formularioRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            formularioRef.current
                ?.querySelector("input")
                ?.focus({ preventScroll: true });
        }
    }, [formularioAberto, termoEditando]);

    // =========================================
    // FECHAR FORMULÁRIO
    // =========================================

    function fecharFormulario() {
        if (operacaoRef.current) return;

        setFormularioAberto(false);
        setTermoEditando(null);
        setFormulario(formularioInicial);
        setErroFormulario("");
    }

    // =========================================
    // ATUALIZAR FORMULÁRIO
    // =========================================

    function atualizarCampo(event) {
        const { name, value } = event.target;

        setFormulario(anterior => ({
            ...anterior,
            [name]: value
        }));

        setErroFormulario("");
    }

    // =========================================
    // CADASTRAR OU EDITAR TERMO
    // =========================================

    async function salvarTermo(event) {
        event.preventDefault();

        if (!acessoValido() || operacaoRef.current) return;

        const dados = {
            termo: formulario.termo.trim(),
            significado: formulario.significado.trim(),
            descricao: formulario.descricao.trim()
        };

        if (!dados.termo || !dados.significado || !dados.descricao) {
            setErroFormulario("Preencha todos os campos.");
            return;
        }

        if (
            dados.termo.length > 100 ||
            dados.significado.length > 250 ||
            dados.descricao.length > 5000
        ) {
            setErroFormulario(
                "Um ou mais campos ultrapassaram o limite permitido."
            );
            return;
        }

        const editando = Boolean(termoEditando);

        const endpoint = editando
            ? `${API_GLOSSARIO}/${termoEditando.glossarioFiscalId}`
            : API_GLOSSARIO;

        try {
            operacaoRef.current = true;
            setSalvando(true);
            setErroFormulario("");
            setMensagem("");
            setErro("");

            await requisicaoApi(endpoint, {
                method: editando ? "PUT" : "POST",
                body: JSON.stringify(dados)
            });

            if (!acessoValido()) return;

            setMensagem(
                editando
                    ? "Termo atualizado com sucesso!"
                    : "Termo cadastrado com sucesso!"
            );

            setFormularioAberto(false);
            setTermoEditando(null);
            setFormulario(formularioInicial);

            limparFiltros();
            recarregarTermos();

        } catch (error) {
            if (acessoValido()) {
                setErroFormulario(
                    error.message ||
                    "Não foi possível salvar o termo."
                );
            }
        } finally {
            operacaoRef.current = false;

            if (montadoRef.current) {
                setSalvando(false);
            }
        }
    }

    // =========================================
    // ATIVAR OU DESATIVAR
    // =========================================

    async function alterarStatus(item) {
        if (!acessoValido() || operacaoRef.current) return;

        const novoStatus = !item.ativo;

        const confirmar = window.confirm(
            novoStatus
                ? `Deseja ativar o termo "${item.termo}"?`
                : `Deseja desativar o termo "${item.termo}"?`
        );

        if (!confirmar) return;

        try {
            operacaoRef.current = true;
            setSalvando(true);
            setErro("");
            setMensagem("");

            await requisicaoApi(
                `${API_GLOSSARIO}/${item.glossarioFiscalId}/status`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        ativo: novoStatus
                    })
                }
            );

            if (!acessoValido()) return;

            setMensagem(
                novoStatus
                    ? "Termo ativado com sucesso!"
                    : "Termo desativado com sucesso!"
            );

            recarregarTermos();

        } catch (error) {
            if (acessoValido()) {
                setErro(
                    error.message ||
                    "Não foi possível alterar o status."
                );
            }
        } finally {
            operacaoRef.current = false;

            if (montadoRef.current) {
                setSalvando(false);
            }
        }
    }

    // =========================================
    // PAGINAÇÃO
    // =========================================

    const primeiraPagina = Math.max(
        1,
        Math.min(paginaAtual - 2, totalPaginas - 4)
    );

    const paginasVisiveis = Array.from(
        {
            length: Math.min(5, totalPaginas)
        },
        (_, index) => primeiraPagina + index
    );

    // =========================================
    // RENDERIZAÇÃO
    // =========================================

    return (
        <div
            className={`gl-pagina ${
                autenticado
                    ? "gl-autenticada"
                    : "gl-publica"
            }`}
        >

            {/* CABEÇALHO EXCLUSIVO PARA VISITANTES */}

            {!autenticado && (
                <header className="gl-topo-publico">
                    <Link to="/portal">
                        <img src={LogoNome} alt="IntegraCertacon" />
                    </Link>

                    <nav aria-label="Navegação pública">
                        <Link to="/portal">Conteúdos</Link>
                        <Link to="/consultar-chave">Consultar NF-e</Link>
                        <Link to="/login">Entrar</Link>
                        <Link to="/cadastro">Criar conta</Link>
                    </nav>
                </header>
            )}

            <main className="gl-conteudo">

                <Link
                    to={autenticado ? "/home" : "/portal"}
                    className="gl-voltar"
                >
                    ← Voltar ao início
                </Link>

                {/* TÍTULO */}

                <div className="gl-cabecalho">
                    <div className="gl-titulo-area">
                        <div className="gl-icone-titulo">
                            <BookOpen size={26} />
                        </div>

                        <div>
                            <h1>Glossário Fiscal</h1>

                            <p>
                                Conheça e compreenda os principais
                                termos do universo tributário.
                            </p>
                        </div>
                    </div>

                    {gerenciando && (
                        <button
                            type="button"
                            className="gl-botao-primario"
                            onClick={abrirCadastro}
                            disabled={salvando}
                        >
                            <Plus size={19} />
                            Novo termo
                        </button>
                    )}
                </div>

                {/* ABAS PARA USUÁRIOS AUTORIZADOS */}

                {podeGerenciar && (
                    <div className="gl-abas">
                        <button
                            type="button"
                            className={!gerenciando ? "gl-aba-ativa" : ""}
                            onClick={() => alterarModo(false)}
                            disabled={salvando}
                        >
                            Consultar termos
                        </button>

                        <button
                            type="button"
                            className={gerenciando ? "gl-aba-ativa" : ""}
                            onClick={() => alterarModo(true)}
                            disabled={salvando}
                        >
                            Gerenciar glossário
                        </button>
                    </div>
                )}

                {/* MENSAGENS */}

                {mensagem && (
                    <div className="gl-mensagem gl-sucesso" role="status">
                        <Check size={18} />
                        <span>{mensagem}</span>

                        <button
                            type="button"
                            onClick={() => setMensagem("")}
                            aria-label="Fechar mensagem"
                        >
                            <X size={17} />
                        </button>
                    </div>
                )}

                {erro && (
                    <div className="gl-mensagem gl-erro" role="alert">
                        {erro}
                    </div>
                )}

                {/* FORMULÁRIO ADMINISTRATIVO */}

                {gerenciando && formularioAberto && (
                    <section
                        ref={formularioRef}
                        className="gl-formulario"
                    >
                        <div className="gl-formulario-topo">
                            <h2>
                                {termoEditando
                                    ? "Editar termo fiscal"
                                    : "Cadastrar termo fiscal"}
                            </h2>

                            <button
                                type="button"
                                className="gl-fechar"
                                onClick={fecharFormulario}
                                disabled={salvando}
                                aria-label="Fechar formulário"
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <form onSubmit={salvarTermo}>

                            <div className="gl-form-grid">
                                <div className="gl-campo">
                                    <label htmlFor="gl-termo">
                                        Termo
                                    </label>

                                    <input
                                        id="gl-termo"
                                        name="termo"
                                        value={formulario.termo}
                                        onChange={atualizarCampo}
                                        placeholder="Ex.: CFOP"
                                        maxLength={100}
                                        disabled={salvando}
                                        required
                                    />
                                </div>

                                <div className="gl-campo">
                                    <label htmlFor="gl-significado">
                                        Significado
                                    </label>

                                    <input
                                        id="gl-significado"
                                        name="significado"
                                        value={formulario.significado}
                                        onChange={atualizarCampo}
                                        placeholder="Nome completo do termo"
                                        maxLength={250}
                                        disabled={salvando}
                                        required
                                    />
                                </div>

                                <div className="gl-campo gl-campo-completo">
                                    <label htmlFor="gl-descricao">
                                        Descrição
                                    </label>

                                    <textarea
                                        id="gl-descricao"
                                        name="descricao"
                                        value={formulario.descricao}
                                        onChange={atualizarCampo}
                                        placeholder="Explique o termo em linguagem simples..."
                                        maxLength={5000}
                                        disabled={salvando}
                                        rows={5}
                                        required
                                    />

                                    <small>
                                        {formulario.descricao.length}/5000
                                        caracteres
                                    </small>
                                </div>
                            </div>

                            {erroFormulario && (
                                <div
                                    className="gl-mensagem gl-erro"
                                    role="alert"
                                >
                                    {erroFormulario}
                                </div>
                            )}

                            <div className="gl-form-acoes">
                                <button
                                    type="button"
                                    className="gl-botao-secundario"
                                    onClick={fecharFormulario}
                                    disabled={salvando}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="gl-botao-primario"
                                    disabled={salvando}
                                >
                                    <Check size={18} />

                                    {salvando
                                        ? "Salvando..."
                                        : "Salvar termo"}
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                {/* PESQUISA */}

                <section className="gl-filtros">
                    <div className="gl-filtros-linha">

                        <div className="gl-pesquisa">
                            <Search size={20} />

                            <input
                                type="search"
                                value={pesquisa}
                                onChange={event =>
                                    alterarPesquisa(event.target.value)
                                }
                                placeholder="Pesquisar termo, significado ou descrição..."
                                aria-label="Pesquisar termos fiscais"
                            />

                            {pesquisa && (
                                <button
                                    type="button"
                                    onClick={() => alterarPesquisa("")}
                                    aria-label="Limpar pesquisa"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {gerenciando && (
                            <select
                                value={filtroStatus}
                                aria-label="Filtrar por status"
                                onChange={event => {
                                    setFiltroStatus(event.target.value);
                                    setPagina(1);
                                }}
                            >
                                <option value="todos">Todos os status</option>
                                <option value="ativos">Ativos</option>
                                <option value="inativos">Inativos</option>
                            </select>
                        )}

                        <button
                            type="button"
                            className="gl-botao-secundario"
                            onClick={limparFiltros}
                        >
                            Limpar filtros
                        </button>

                        <button
                            type="button"
                            className="gl-atualizar"
                            onClick={recarregarTermos}
                            disabled={carregando || salvando}
                            title="Atualizar glossário"
                            aria-label="Atualizar glossário"
                        >
                            <RefreshCw size={19} />
                        </button>
                    </div>

                    {/* FILTRO ALFABÉTICO */}

                    <div className="gl-alfabeto">
                        {["Todas", ...LETRAS].map(letra => (
                            <button
                                type="button"
                                key={letra}
                                aria-pressed={letraSelecionada === letra}
                                className={
                                    letraSelecionada === letra
                                        ? "gl-letra-ativa"
                                        : ""
                                }
                                onClick={() => {
                                    setLetraSelecionada(letra);
                                    setPagina(1);
                                }}
                            >
                                {letra}
                            </button>
                        ))}
                    </div>
                </section>

                {/* LISTAGEM */}

                {erroConsulta ? (
                    <div className="gl-estado-vazio" role="alert">
                        <BookOpen size={36} />
                        <h3>Não foi possível carregar os termos</h3>
                        <p>{erroConsulta}</p>

                        <button
                            type="button"
                            className="gl-botao-primario"
                            onClick={recarregarTermos}
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : carregando || consultaCarregada !== chaveConsulta ? (
                    <div className="gl-estado-vazio" role="status">
                        <div className="gl-spinner" />
                        <p>Carregando glossário fiscal...</p>
                    </div>
                ) : (
                    <>
                        <div className="gl-listagem-topo">
                            <h2>
                                {gerenciando
                                    ? "Termos cadastrados"
                                    : "Termos fiscais"}
                            </h2>

                            <span>
                                {termosFiltrados.length} termo(s)
                                encontrado(s)
                            </span>
                        </div>

                        {termosPaginados.length === 0 ? (
                            <div className="gl-estado-vazio">
                                <Search size={38} />
                                <h3>Nenhum termo encontrado</h3>

                                <p>
                                    Experimente pesquisar outra palavra
                                    ou limpar os filtros.
                                </p>

                                <button
                                    type="button"
                                    className="gl-botao-secundario"
                                    onClick={limparFiltros}
                                >
                                    Limpar filtros
                                </button>
                            </div>
                        ) : (
                            <div className="gl-grid-termos">

                                {termosPaginados.map(item => (
                                    <article
                                        key={item.glossarioFiscalId}
                                        className={`gl-card-termo ${
                                            gerenciando && !item.ativo
                                                ? "gl-card-inativo"
                                                : ""
                                        }`}
                                    >
                                        <div className="gl-card-topo">
                                            <div className="gl-sigla">
                                                {item.termo}
                                            </div>

                                            {gerenciando && (
                                                <span
                                                    className={`gl-status ${
                                                        item.ativo
                                                            ? "gl-status-ativo"
                                                            : "gl-status-inativo"
                                                    }`}
                                                >
                                                    {item.ativo
                                                        ? "Ativo"
                                                        : "Inativo"}
                                                </span>
                                            )}
                                        </div>

                                        <h3>{item.significado}</h3>

                                        <p>{item.descricao}</p>

                                        {gerenciando && (
                                            <div className="gl-card-rodape">
                                                <span className="gl-autor">
                                                    Autor: {item.autor || "Não informado"}
                                                </span>

                                                <div className="gl-card-acoes">
                                                    <button
                                                        type="button"
                                                        className="gl-editar"
                                                        onClick={() => abrirEdicao(item)}
                                                        disabled={salvando}
                                                        title="Editar termo"
                                                        aria-label={`Editar ${item.termo}`}
                                                    >
                                                        <Pencil size={17} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className={
                                                            item.ativo
                                                                ? "gl-desativar"
                                                                : "gl-ativar"
                                                        }
                                                        onClick={() => alterarStatus(item)}
                                                        disabled={salvando}
                                                        title={
                                                            item.ativo
                                                                ? "Desativar termo"
                                                                : "Ativar termo"
                                                        }
                                                        aria-label={
                                                            item.ativo
                                                                ? `Desativar ${item.termo}`
                                                                : `Ativar ${item.termo}`
                                                        }
                                                    >
                                                        <Power size={17} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </article>
                                ))}

                            </div>
                        )}

                        {/* PAGINAÇÃO */}

                        {totalPaginas > 1 && (
                            <nav
                                className="gl-paginacao"
                                aria-label="Paginação do glossário"
                            >
                                <button
                                    type="button"
                                    disabled={paginaAtual === 1}
                                    onClick={() => setPagina(paginaAtual - 1)}
                                    aria-label="Página anterior"
                                >
                                    <ChevronLeft size={19} />
                                </button>

                                {paginasVisiveis.map(numero => (
                                    <button
                                        type="button"
                                        key={numero}
                                        className={
                                            paginaAtual === numero
                                                ? "gl-pagina-ativa"
                                                : ""
                                        }
                                        aria-current={
                                            paginaAtual === numero
                                                ? "page"
                                                : undefined
                                        }
                                        onClick={() => setPagina(numero)}
                                    >
                                        {numero}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    disabled={paginaAtual === totalPaginas}
                                    onClick={() => setPagina(paginaAtual + 1)}
                                    aria-label="Próxima página"
                                >
                                    <ChevronRight size={19} />
                                </button>
                            </nav>
                        )}
                    </>
                )}

                <div className="gl-aviso">
                    <BookOpen size={19} />

                    <p>
                        Os termos apresentados possuem finalidade
                        informativa e educativa. Para aplicações
                        específicas, consulte a legislação vigente
                        ou um profissional especializado.
                    </p>
                </div>

            </main>
        </div>
    );
}