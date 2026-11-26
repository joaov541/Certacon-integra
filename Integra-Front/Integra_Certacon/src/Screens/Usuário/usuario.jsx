import {
    useEffect,
    useState,
    useCallback,
    useRef
} from "react";

import "./usuario.css";

import usePermissoes from "../../hooks/usePermissoes";
import usePesquisaLayout from "../../hooks/usePesquisaLayout";

import GerenciarTemas from "./GerenciarTemas";
import GerenciarPerfis from "./GerenciarPerfis";
import GerenciarPermissoes from "./GerenciarPermissoes";

import { requisicaoApi } from "../../services/api";

import EditarQuadrado from "../../assets/Icones/EditarQuadrado.png";
import LupaPesquisa from "../../assets/Icones/LupaPesquisa.png";
import Lixeira from "../../assets/Icones/Lixeira.png";

const USUARIOS_POR_PAGINA = 5;

const formularioInicial = {
    nome: "",
    email: "",
    perfis: [],
    senha: "",
    cliente: "",
    status: "ativo"
};

// =========================================
// FUNÇÕES AUXILIARES
// =========================================

function normalizarTexto(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function normalizarCnpj(valor) {
    return String(valor ?? "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase();
}

function formatarCnpj(cnpj) {
    if (!cnpj) return "—";

    const valor = normalizarCnpj(cnpj);

    if (valor.length !== 14) return cnpj;

    return valor.replace(
        /^([A-Z0-9]{2})([A-Z0-9]{3})([A-Z0-9]{3})([A-Z0-9]{4})(\d{2})$/,
        "$1.$2.$3/$4-$5"
    );
}

function mesmoId(a, b) {
    return Boolean(
        a &&
        b &&
        String(a).toLowerCase() ===
        String(b).toLowerCase()
    );
}

// =========================================
// COMPONENTE PRINCIPAL
// =========================================

function Usuario() {

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

    const podeUsuarios =
        autenticado &&
        temPermissao("usuario.gerenciar");

    const podeTemas =
        temPermissao("tema.gerenciar");

    const podePerfis =
        temPermissao("perfil.gerenciar");

    const podePermissoes =
        temPermissao("permissao.gerenciar");

    const acessoLiberado =
        podeUsuarios &&
        !carregandoPermissoes &&
        !erroPermissoes;

    // Preserva a proteção adicional
    // para atribuição de perfis.

    const podeAtribuirPerfis =
        acessoLiberado &&
        podePerfis &&
        podePermissoes;

    // =========================================
    // USUÁRIO AUTENTICADO
    // =========================================

    const token = localStorage.getItem("token");

    const meuId = (() => {

        try {

            return JSON.parse(
                localStorage.getItem("usuario") || "{}"
            ).usuarioId;

        } catch {

            return null;

        }

    })();

    // =========================================
    // ESTADOS
    // =========================================

    const [aba, setAba] = useState("usuarios");

    const [usuarios, setUsuarios] = useState([]);

    const [perfisBanco, setPerfisBanco] =
        useState([]);

    const [erroPerfis, setErroPerfis] =
        useState("");

    const [erroUsuarios, setErroUsuarios] =
        useState("");

    const [pesquisa, setPesquisa] = useState("");

    const [pagina, setPagina] = useState(1);

    const [modalAberto, setModalAberto] =
        useState(false);

    const [idEditando, setIdEditando] =
        useState(null);

    const [carregando, setCarregando] =
        useState(true);

    const [carregandoPerfis, setCarregandoPerfis] =
        useState(false);

    const [salvando, setSalvando] =
        useState(false);

    const [desativando, setDesativando] =
        useState(null);

    const [erroFormulario, setErroFormulario] =
        useState("");

    const [formulario, setFormulario] =
        useState({
            ...formularioInicial,
            perfis: []
        });

    // =========================================
    // REFERÊNCIAS
    // =========================================

    const operacaoRef = useRef(false);

    const consultaUsuariosRef = useRef(0);

    const consultaPerfisRef = useRef(0);

    const montadoRef = useRef(false);

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

            acessoRef.current &&

            localStorage.getItem("token") === token

        );

    }

    // =========================================
    // PESQUISA
    // =========================================

    const placeholderPesquisa = {

        usuarios: "Buscar usuários...",

        perfis: "Buscar perfis...",

        permissoes: "Buscar permissões...",

        temas: "Buscar temas..."

    }[aba];

    const alterarPesquisa = useCallback(valor => {

        setPesquisa(valor);

        setPagina(1);

    }, []);

    usePesquisaLayout(
        pesquisa,
        alterarPesquisa
    );

    // =========================================
    // ABAS AUTORIZADAS
    // =========================================

    const abasDisponiveis = [

        {
            id: "usuarios",
            nome: "Usuários",
            permitido: podeUsuarios
        },

        {
            id: "perfis",
            nome: "Perfis",
            permitido: podePerfis
        },

        {
            id: "permissoes",
            nome: "Permissões",
            permitido:
                podePerfis &&
                podePermissoes
        },

        {
            id: "temas",
            nome: "Temas",
            permitido: podeTemas
        }

    ].filter(item => item.permitido);

    // Se uma permissão for removida,
    // retorna para a aba de usuários.

    useEffect(() => {

        const abaPermitida =

            aba === "usuarios" ||

            (aba === "perfis" && podePerfis) ||

            (
                aba === "permissoes" &&
                podePerfis &&
                podePermissoes
            ) ||

            (aba === "temas" && podeTemas);

        if (!abaPermitida) {

            setAba("usuarios");

            setPesquisa("");

            setPagina(1);

        }

    }, [
        aba,
        podePerfis,
        podePermissoes,
        podeTemas
    ]);

    function mudarAba(novaAba) {

        if (

            operacaoRef.current ||

            !abasDisponiveis.some(
                item => item.id === novaAba
            )

        ) {

            return;

        }

        setAba(novaAba);

        setPesquisa("");

        setPagina(1);

        setModalAberto(false);

        setIdEditando(null);

        setErroFormulario("");

        setFormulario({
            ...formularioInicial,
            perfis: []
        });

    }

    // =========================================
    // CARREGAR PERFIS
    // =========================================

    const carregarPerfis = useCallback(async () => {

        const consulta =
            ++consultaPerfisRef.current;

        if (

            !acessoLiberado ||

            !podePerfis ||

            localStorage.getItem("token") !== token

        ) {

            setPerfisBanco([]);

            setCarregandoPerfis(false);

            return;

        }

        try {

            setCarregandoPerfis(true);

            setErroPerfis("");

            const resposta = await requisicaoApi(
                "/api/Perfis"
            );

            if (

                consulta !== consultaPerfisRef.current ||

                localStorage.getItem("token") !== token

            ) {

                return;

            }

            if (!Array.isArray(resposta)) {

                throw new Error(
                    "A API retornou uma lista de perfis inválida."
                );

            }

            setPerfisBanco(resposta);

        } catch (error) {

            if (
                consulta !== consultaPerfisRef.current
            ) {

                return;

            }

            setPerfisBanco([]);

            setErroPerfis(

                error.message ||

                "Não foi possível carregar os perfis."

            );

        } finally {

            if (
                consulta === consultaPerfisRef.current
            ) {

                setCarregandoPerfis(false);

            }

        }

    }, [
        acessoLiberado,
        podePerfis,
        token
    ]);

    useEffect(() => {

        if (aba === "usuarios") {

            carregarPerfis();

        }

        return () => {

            consultaPerfisRef.current++;

        };

    }, [
        aba,
        carregarPerfis
    ]);

    // =========================================
    // CARREGAR USUÁRIOS
    // =========================================

    const carregarUsuarios = useCallback(async () => {

        const consulta =
            ++consultaUsuariosRef.current;

        if (

            !acessoLiberado ||

            localStorage.getItem("token") !== token

        ) {

            setUsuarios([]);

            setCarregando(false);

            return;

        }

        try {

            setCarregando(true);

            setErroUsuarios("");

            const resposta = await requisicaoApi(
                "/api/Usuarios"
            );

            if (

                consulta !== consultaUsuariosRef.current ||

                localStorage.getItem("token") !== token ||

                !acessoRef.current

            ) {

                return;

            }

            if (!Array.isArray(resposta)) {

                throw new Error(

                    "A API retornou uma lista de usuários inválida."

                );

            }

            setUsuarios(resposta);

        } catch (error) {

            if (
                consulta !== consultaUsuariosRef.current
            ) {

                return;

            }

            console.error(
                "Erro ao carregar usuários:",
                error
            );

            setUsuarios([]);

            setErroUsuarios(

                error.message ||

                "Não foi possível carregar os usuários."

            );

        } finally {

            if (
                consulta === consultaUsuariosRef.current
            ) {

                setCarregando(false);

            }

        }

    }, [
        acessoLiberado,
        token
    ]);

    useEffect(() => {

        setUsuarios([]);

        setPagina(1);

        carregarUsuarios();

        return () => {

            consultaUsuariosRef.current++;

        };

    }, [carregarUsuarios]);

    // =========================================
    // LIMPAR DADOS AO ALTERAR SESSÃO
    // =========================================

    useEffect(() => {

        setModalAberto(false);

        setIdEditando(null);

        setPesquisa("");

        setPagina(1);

        setAba("usuarios");

        setErroFormulario("");

        setFormulario({

            ...formularioInicial,

            perfis: []

        });

    }, [
        token,
        acessoLiberado
    ]);

    // =========================================
    // PESQUISAR USUÁRIOS
    // =========================================

    const usuariosFiltrados = acessoLiberado

        ? usuarios.filter(usuario => {

            const texto =
                normalizarTexto(pesquisa);

            const cnpjPesquisa =
                normalizarCnpj(pesquisa);

            const perfis =
                Array.isArray(usuario.perfis)

                    ? usuario.perfis.join(" ")

                    : "";

            return (

                !texto ||

                normalizarTexto(
                    usuario.nome
                ).includes(texto) ||

                normalizarTexto(
                    usuario.email
                ).includes(texto) ||

                normalizarTexto(
                    perfis
                ).includes(texto) ||

                normalizarTexto(
                    formatarCnpj(usuario.cnpj)
                ).includes(texto) ||

                (

                    Boolean(cnpjPesquisa) &&

                    normalizarCnpj(
                        usuario.cnpj
                    ).includes(cnpjPesquisa)

                )

            );

        })

        : [];

    // =========================================
    // PAGINAÇÃO
    // =========================================

    const totalPaginas = Math.max(

        1,

        Math.ceil(

            usuariosFiltrados.length /

            USUARIOS_POR_PAGINA

        )

    );

    const paginaSegura =
        Math.min(pagina, totalPaginas);

    const inicio =
        (paginaSegura - 1) *
        USUARIOS_POR_PAGINA;

    const usuariosExibidos =
        usuariosFiltrados.slice(

            inicio,

            inicio + USUARIOS_POR_PAGINA

        );

    // =========================================
    // IDENTIFICAR PERFIS PROTEGIDOS
    // =========================================

    const editandoProprioUsuario = mesmoId(
        idEditando,
        meuId
    );

    const editandoCliente = formulario.perfis.some(

        perfil =>
            normalizarTexto(perfil) === "cliente"

    );

    const podeEditarPerfis =

        podeAtribuirPerfis &&

        !editandoProprioUsuario &&

        !editandoCliente;

    // =========================================
    // PERFIS DISPONÍVEIS
    // =========================================

    const perfisDisponiveis = [

        ...new Set([

            ...perfisBanco

                .filter(perfil =>

                    perfil.ativo &&

                    normalizarTexto(
                        perfil.nome
                    ) !== "cliente"

                )

                .map(perfil => perfil.nome),

            ...formulario.perfis

        ])

    ];

    // =========================================
    // ATUALIZAR FORMULÁRIO
    // =========================================

    function alterarCampo(campo, valor) {

        if (operacaoRef.current) return;

        setFormulario(atual => ({

            ...atual,

            [campo]: valor

        }));

        setErroFormulario("");

    }

    // =========================================
    // SELECIONAR PERFIL
    // =========================================

    function alterarPerfil(nomePerfil, selecionado) {

        if (

            !podeEditarPerfis ||

            operacaoRef.current

        ) {

            return;

        }

        if (

            selecionado &&

            !perfisBanco.some(
                perfil =>
                    perfil.nome === nomePerfil &&
                    perfil.ativo &&
                    normalizarTexto(
                        perfil.nome
                    ) !== "cliente"
            )

        ) {

            return;

        }

        setFormulario(atual => ({

            ...atual,

            perfis: selecionado

                ? [

                    ...new Set([
                        ...atual.perfis,
                        nomePerfil
                    ])

                ]

                : atual.perfis.filter(

                    perfil => perfil !== nomePerfil

                )

        }));

        setErroFormulario("");

    }

    // =========================================
    // NOVO COLABORADOR
    // =========================================

    function abrirNovoUsuario() {

        if (

            !podeAtribuirPerfis ||

            operacaoRef.current

        ) {

            return;

        }

        setIdEditando(null);

        setFormulario({

            ...formularioInicial,

            perfis: []

        });

        setErroFormulario("");

        setModalAberto(true);

        carregarPerfis();

    }

    // =========================================
    // EDITAR USUÁRIO
    // =========================================

    function abrirEdicao(usuario) {

        if (

            !acessoLiberado ||

            operacaoRef.current

        ) {

            return;

        }

        setFormulario({

            nome: usuario.nome || "",

            email: usuario.email || "",

            perfis: Array.isArray(usuario.perfis)

                ? [...usuario.perfis]

                : [],

            senha: "",

            cliente: usuario.cnpj || "",

            status: usuario.ativo

                ? "ativo"

                : "desativado"

        });

        setIdEditando(usuario.usuarioId);

        setErroFormulario("");

        setModalAberto(true);

        if (podePerfis) {

            carregarPerfis();

        }

    }

    // =========================================
    // FECHAR MODAL
    // =========================================

    function fecharModal() {

        if (operacaoRef.current) return;

        setModalAberto(false);

        setIdEditando(null);

        setErroFormulario("");

        setFormulario({

            ...formularioInicial,

            perfis: []

        });

    }

    // =========================================
    // SALVAR USUÁRIO
    // =========================================

    async function salvarUsuario(event) {

        event.preventDefault();

        if (

            !acessoLiberado ||

            operacaoRef.current

        ) {

            return;

        }

        setErroFormulario("");

        if (

            !formulario.nome.trim() ||

            !formulario.email.trim()

        ) {

            setErroFormulario(

                "Preencha o nome e o e-mail."

            );

            return;

        }

        if (

            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(

                formulario.email.trim()

            )

        ) {

            setErroFormulario(

                "Informe um e-mail válido."

            );

            return;

        }

        let dadosAtualizados = false;

        try {

            operacaoRef.current = true;

            setSalvando(true);

            // =================================
            // CADASTRAR COLABORADOR
            // =================================

            if (!idEditando) {

                if (!podeAtribuirPerfis) {

                    throw new Error(

                        "Você não possui permissão para atribuir perfis."

                    );

                }

                if (formulario.senha.length < 8) {

                    throw new Error(

                        "Informe uma senha com pelo menos 8 caracteres."

                    );

                }

                if (!formulario.perfis.length) {

                    throw new Error(

                        "Selecione pelo menos um perfil."

                    );

                }

                const perfisValidos =
                    formulario.perfis.every(nome =>

                        perfisBanco.some(perfil =>

                            perfil.nome === nome &&

                            perfil.ativo &&

                            normalizarTexto(
                                perfil.nome
                            ) !== "cliente"

                        )

                    );

                if (!perfisValidos) {

                    throw new Error(

                        "Selecione somente perfis ativos de colaboradores."

                    );

                }

                const resposta = await requisicaoApi(

                    "/api/Usuarios/cadastrar-colaborador",

                    {

                        method: "POST",

                        body: JSON.stringify({

                            nome:
                                formulario.nome.trim(),

                            email:
                                formulario.email.trim().toLowerCase(),

                            senha:
                                formulario.senha,

                            perfis:
                                formulario.perfis

                        })

                    }

                );

                if (!sessaoValida()) return;

                setModalAberto(false);

                setFormulario({

                    ...formularioInicial,

                    perfis: []

                });

                setPagina(1);

                await carregarUsuarios();

                alert(

                    resposta?.mensagem ||

                    "Colaborador cadastrado com sucesso!"

                );

                return;

            }

            // =================================
            // EDITAR USUÁRIO EXISTENTE
            // =================================

            const original = usuarios.find(

                usuario =>

                    mesmoId(
                        usuario.usuarioId,
                        idEditando
                    )

            );

            if (!original) {

                throw new Error(

                    "Usuário não encontrado."

                );

            }

            const perfisOriginais =
                original.perfis || [];

            const mudouPerfis =

                JSON.stringify(
                    [...formulario.perfis].sort()
                ) !==

                JSON.stringify(
                    [...perfisOriginais].sort()
                );

            // Impede alterações não autorizadas
            // nos perfis vinculados.

            if (

                mudouPerfis &&

                !podeEditarPerfis

            ) {

                throw new Error(

                    "Você não possui permissão para alterar estes perfis."

                );

            }

            if (

                mudouPerfis &&

                !formulario.perfis.length

            ) {

                throw new Error(

                    "Selecione pelo menos um perfil."

                );

            }

            const novosPerfis =
                formulario.perfis.filter(

                    perfil =>

                        !perfisOriginais.includes(perfil)

                );

            if (

                novosPerfis.some(nome =>

                    !perfisBanco.some(perfil =>

                        perfil.nome === nome &&

                        perfil.ativo &&

                        normalizarTexto(
                            perfil.nome
                        ) !== "cliente"

                    )

                )

            ) {

                throw new Error(

                    "Um dos novos perfis selecionados é inválido ou está inativo."

                );

            }

            const statusOriginal =
                original.ativo
                    ? "ativo"
                    : "desativado";

            if (

                editandoProprioUsuario &&

                formulario.status !== statusOriginal

            ) {

                throw new Error(

                    "Você não pode alterar o status da própria conta."

                );

            }

            // Preserva os dados empresariais
            // existentes no usuário.

            await requisicaoApi(

                `/api/Usuarios/${idEditando}`,

                {

                    method: "PUT",

                    body: JSON.stringify({

                        nome:
                            formulario.nome.trim(),

                        email:
                            formulario.email.trim().toLowerCase(),

                        cnpj:
                            original.cnpj,

                        razaoSocial:
                            original.razaoSocial,

                        telefoneContato:
                            original.telefoneContato,

                        ...(mudouPerfis

                            ? {
                                perfis:
                                    formulario.perfis
                            }

                            : {}

                        )

                    })

                }

            );

            dadosAtualizados = true;

            if (!sessaoValida()) return;

            // =================================
            // ALTERAR STATUS
            // =================================

            if (
                statusOriginal !== formulario.status
            ) {

                await requisicaoApi(

                    `/api/Usuarios/${idEditando}/status`,

                    {

                        method: "PATCH",

                        body: JSON.stringify({

                            ativo:

                                formulario.status === "ativo"

                        })

                    }

                );

            }

            if (!sessaoValida()) return;

            setModalAberto(false);

            setIdEditando(null);

            setFormulario({

                ...formularioInicial,

                perfis: []

            });

            await carregarUsuarios();

            alert(

                "Usuário atualizado com sucesso!"

            );

        } catch (error) {

            console.error(

                "Erro ao salvar usuário:",

                error

            );

            if (!sessaoValida()) return;

            if (dadosAtualizados) {

                setErroFormulario(

                    "Os dados do usuário foram atualizados, " +

                    "mas houve um erro ao alterar seu status. " +

                    (error.message || "")

                );

                await carregarUsuarios();

            } else {

                setErroFormulario(

                    error.message ||

                    "Não foi possível salvar o usuário."

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
    // DESATIVAR USUÁRIO
    // =========================================

    async function excluirUsuario(usuario) {

        if (

            !acessoLiberado ||

            operacaoRef.current ||

            !usuario.ativo ||

            mesmoId(usuario.usuarioId, meuId)

        ) {

            return;

        }

        const confirmar = window.confirm(

            "Deseja realmente desativar este usuário?"

        );

        if (!confirmar) return;

        try {

            operacaoRef.current = true;

            setDesativando(usuario.usuarioId);

            await requisicaoApi(

                `/api/Usuarios/${usuario.usuarioId}`,

                {

                    method: "DELETE"

                }

            );

            if (!sessaoValida()) return;

            alert(

                "Usuário desativado com sucesso!"

            );

            await carregarUsuarios();

        } catch (error) {

            console.error(

                "Erro ao desativar usuário:",

                error

            );

            if (sessaoValida()) {

                alert(

                    error.message ||

                    "Não foi possível desativar o usuário."

                );

            }

        } finally {

            operacaoRef.current = false;

            if (montadoRef.current) {

                setDesativando(null);

            }

        }

    }

    const ocupado =

        salvando ||

        desativando !== null;

    // =========================================
    // RENDERIZAÇÃO
    //
    // O Sidebar e os Headers são fornecidos
    // exclusivamente pelo LayoutSistema.
    // =========================================

    return (

        <div className="pagina-usuarios">

            <main className="principal-usuarios">

                <section className="conteudo-usuarios">

                    {carregandoPermissoes ? (

                        <p role="status">

                            Carregando permissões...

                        </p>

                    ) : erroPermissoes ? (

                        <div
                            className="usuario-aviso-erro"
                            role="alert"
                        >

                            <p>

                                Não foi possível carregar
                                suas permissões.

                            </p>

                            <button
                                type="button"

                                className="rbac-btn principal"

                                onClick={atualizar}
                            >

                                Tentar novamente

                            </button>

                        </div>

                    ) : !podeUsuarios ? (

                        <div
                            className="usuario-aviso-erro"

                            role="alert"
                        >

                            Você não possui permissão
                            para gerenciar usuários.

                        </div>

                    ) : (

                        <>

                            <header className="uw-cabecalho">
                                <span>ADMINISTRAÇÃO DO SISTEMA</span>
                                <h1>Gerenciamento de acessos</h1>
                                <p>Organize usuários, perfis, permissões e temas do portal.</p>
                            </header>

                            {/* ABAS DE GERENCIAMENTO */}

                            <div
                                className="rbac-abas"

                                aria-label="Gerenciamento de acessos"
                            >

                                {abasDisponiveis.map(item => (

                                    <button
                                        key={item.id}

                                        type="button"

                                        className={

                                            aba === item.id

                                                ? "ativa"

                                                : ""

                                        }

                                        aria-pressed={
                                            aba === item.id
                                        }

                                        disabled={ocupado}

                                        onClick={() =>
                                            mudarAba(item.id)
                                        }
                                    >

                                        {item.nome}

                                    </button>

                                ))}

                            </div>

                            {/* PESQUISA */}

                            <div className="pesquisa-usuarios">

                                <img
                                    src={LupaPesquisa}

                                    alt=""
                                />

                                <input
                                    type="search"

                                    placeholder={
                                        placeholderPesquisa
                                    }

                                    aria-label={
                                        placeholderPesquisa
                                    }

                                    value={pesquisa}

                                    onChange={event =>
                                        alterarPesquisa(
                                            event.target.value
                                        )
                                    }

                                    autoComplete="off"
                                />
                                {pesquisa && (
                                    <button type="button" className="uw-limpar" aria-label="Limpar pesquisa" onClick={() => alterarPesquisa("")}>×</button>
                                )}

                            </div>

                            {/* =================================
                                ABA PERFIS
                            ================================= */}

                            {aba === "perfis" &&
                                podePerfis && (

                                <GerenciarPerfis
                                    pesquisa={pesquisa}
                                />

                            )}

                            {/* =================================
                                ABA PERMISSÕES
                            ================================= */}

                            {aba === "permissoes" &&
                                podePerfis &&
                                podePermissoes && (

                                <GerenciarPermissoes
                                    pesquisa={pesquisa}
                                />

                            )}

                            {/* =================================
                                ABA TEMAS
                            ================================= */}

                            {aba === "temas" &&
                                podeTemas && (

                                <GerenciarTemas
                                    pesquisa={pesquisa}
                                />

                            )}

                            {/* =================================
                                ABA USUÁRIOS
                            ================================= */}

                            {aba === "usuarios" && (

                                <>

                                    <div className="cabecalho-usuarios">

                                        <h2>Usuários cadastrados</h2>

                                        {podeAtribuirPerfis && (

                                            <button
                                                type="button"

                                                className="botao-novo-usuario"

                                                disabled={ocupado}

                                                onClick={
                                                    abrirNovoUsuario
                                                }
                                            >

                                                Novo colaborador

                                            </button>

                                        )}

                                    </div>

                                    <section className="uw-indicadores" aria-label="Resumo de usuários" aria-busy={carregando}>
                                        {[
                                            ["Total de usuários", usuarios.length, "total"],
                                            ["Ativos", usuarios.filter(u => u.ativo).length, "ativo"],
                                            ["Desativados", usuarios.filter(u => !u.ativo).length, "inativo"]
                                        ].map(([titulo, quantidade, tipo]) => (
                                            <div key={tipo} className={`uw-indicador uw-${tipo}`}>
                                                <span>{titulo}</span>
                                                {carregando ? (
                                                    <span className="uw-skeleton" role="status" aria-label="Carregando" />
                                                ) : (
                                                    <strong>{erroUsuarios ? "—" : quantidade.toLocaleString("pt-BR")}</strong>
                                                )}
                                            </div>
                                        ))}
                                    </section>

                                    {/* ERROS */}

                                    {erroUsuarios && (

                                        <div
                                            className="usuario-aviso-erro"

                                            role="alert"
                                        >

                                            <p>

                                                {erroUsuarios}

                                            </p>

                                            <button
                                                type="button"

                                                className="rbac-btn principal"

                                                onClick={
                                                    carregarUsuarios
                                                }
                                            >

                                                Tentar novamente

                                            </button>

                                        </div>

                                    )}

                                    {/* TOTAL DE USUÁRIOS */}

                                    {!carregando &&
                                        !erroUsuarios && (

                                        <p className="total-usuarios">

                                            {usuariosFiltrados.length}

                                            {" "}

                                            {usuariosFiltrados.length === 1

                                                ? "usuário encontrado"

                                                : "usuários encontrados"}

                                        </p>

                                    )}

                                    {/* TABELA */}

                                    <div className="tabela-usuarios">

                                        <table>

                                            <thead>

                                                <tr>

                                                    <th>Nome</th>

                                                    <th>E-mail</th>

                                                    <th>Perfil</th>

                                                    <th>Cliente CNPJ</th>

                                                    <th>Status</th>

                                                    <th className="coluna-acoes-usuario">

                                                        Ações

                                                    </th>

                                                </tr>

                                            </thead>

                                            <tbody>

                                                {carregando ? (

                                                    <tr>

                                                        <td
                                                            colSpan={6}

                                                            className="nenhum-usuario"
                                                        >

                                                            Carregando usuários...

                                                        </td>

                                                    </tr>

                                                ) : erroUsuarios ? (

                                                    <tr>

                                                        <td
                                                            colSpan={6}

                                                            className="nenhum-usuario"
                                                        >

                                                            Não foi possível
                                                            carregar os usuários.

                                                        </td>

                                                    </tr>

                                                ) : usuariosExibidos.length > 0 ? (

                                                    usuariosExibidos.map((usuario, indice) => (

                                                        <tr key={usuario.usuarioId} className="uw-linha" style={{ "--uw-atraso": `${indice * 45}ms` }}>

                                                            {/* NOME */}

                                                            <td>

                                                                <div className="uw-identidade">
                                                                    <span className="uw-avatar" aria-hidden="true">
                                                                        {String(usuario.nome || "?").trim().split(/\s+/).slice(0, 2).map(parte => parte.charAt(0)).join("").toUpperCase() || "?"}
                                                                    </span>
                                                                    <strong>{usuario.nome}</strong>
                                                                </div>

                                                                {mesmoId(

                                                                    usuario.usuarioId,

                                                                    meuId

                                                                ) && (

                                                                    <small className="usuario-propria-conta">

                                                                        Você

                                                                    </small>

                                                                )}

                                                            </td>

                                                            {/* EMAIL */}

                                                            <td>

                                                                {usuario.email}

                                                            </td>

                                                            {/* PERFIS */}

                                                            <td>

                                                                {Array.isArray(usuario.perfis)

                                                                    ? usuario.perfis.join(", ")

                                                                    : "—"}

                                                            </td>

                                                            {/* CNPJ */}

                                                            <td className="cliente-cnpj">

                                                                {formatarCnpj(
                                                                    usuario.cnpj
                                                                )}

                                                            </td>

                                                            {/* STATUS */}

                                                            <td>

                                                                <span
                                                                    className={`status-usuario ${
                                                                        usuario.ativo
                                                                            ? "status-ativo"
                                                                            : "status-desativado"
                                                                    }`}
                                                                >

                                                                    {usuario.ativo

                                                                        ? "Ativo"

                                                                        : "Desativado"}

                                                                </span>

                                                            </td>

                                                            {/* AÇÕES */}

                                                            <td className="acoes-usuario">

                                                                <button
                                                                    type="button"

                                                                    title="Editar usuário"

                                                                    aria-label="Editar usuário"

                                                                    disabled={ocupado}

                                                                    onClick={() =>
                                                                        abrirEdicao(usuario)
                                                                    }
                                                                >

                                                                    <img
                                                                        src={EditarQuadrado}

                                                                        alt=""
                                                                    />

                                                                </button>

                                                                <button
                                                                    type="button"

                                                                    title="Desativar usuário"

                                                                    aria-label="Desativar usuário"

                                                                    disabled={

                                                                        ocupado ||

                                                                        !usuario.ativo ||

                                                                        mesmoId(

                                                                            usuario.usuarioId,

                                                                            meuId

                                                                        )

                                                                    }

                                                                    onClick={() =>
                                                                        excluirUsuario(usuario)
                                                                    }
                                                                >

                                                                    <img
                                                                        src={Lixeira}

                                                                        alt=""
                                                                    />

                                                                </button>

                                                            </td>

                                                        </tr>

                                                    ))

                                                ) : (

                                                    <tr>

                                                        <td
                                                            colSpan={6}

                                                            className="nenhum-usuario"
                                                        >

                                                            Nenhum usuário encontrado.

                                                        </td>

                                                    </tr>

                                                )}

                                            </tbody>

                                        </table>

                                    </div>

                                    {/* PAGINAÇÃO */}

                                    {!carregando &&
                                        !erroUsuarios &&
                                        usuariosFiltrados.length > 0 && (

                                        <div className="paginacao-usuarios">

                                            <button
                                                type="button"

                                                aria-label="Página anterior"

                                                disabled={
                                                    paginaSegura === 1
                                                }

                                                onClick={() =>
                                                    setPagina(
                                                        paginaSegura - 1
                                                    )
                                                }
                                            >

                                                {"<"}

                                            </button>

                                            {Array.from(

                                                { length: totalPaginas },

                                                (_, index) => index + 1

                                            ).map(numero => (

                                                <button
                                                    key={numero}

                                                    type="button"

                                                    className={

                                                        paginaSegura === numero

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

                                                aria-label="Próxima página"

                                                disabled={

                                                    paginaSegura === totalPaginas

                                                }

                                                onClick={() =>
                                                    setPagina(
                                                        paginaSegura + 1
                                                    )
                                                }
                                            >

                                                {">"}

                                            </button>

                                        </div>

                                    )}

                                </>

                            )}

                        </>

                    )}

                </section>

            </main>

            {/* =========================================
                MODAL DE CADASTRO E EDIÇÃO
            ========================================= */}

            {modalAberto &&
                acessoLiberado &&
                aba === "usuarios" && (

                <div
                    className="fundo-modal-usuario"

                    onClick={fecharModal}
                >

                    <form
                        className="modal-usuario"

                        role="dialog"

                        aria-modal="true"

                        aria-labelledby="titulo-modal-usuario"

                        onSubmit={salvarUsuario}

                        onClick={event =>
                            event.stopPropagation()
                        }
                    >

                        <h2 id="titulo-modal-usuario">

                            {idEditando

                                ? "Editar usuário"

                                : "Novo colaborador"}

                        </h2>

                        {/* ERRO DO FORMULÁRIO */}

                        {erroFormulario && (

                            <p
                                className="usuario-erro-formulario"

                                role="alert"
                            >

                                {erroFormulario}

                            </p>

                        )}

                        {/* NOME */}

                        <label htmlFor="usuario-nome">

                            Nome completo

                        </label>

                        <input
                            id="usuario-nome"

                            type="text"

                            placeholder="Digite o nome"

                            value={formulario.nome}

                            onChange={event =>

                                alterarCampo(

                                    "nome",

                                    event.target.value

                                )

                            }

                            disabled={salvando}

                            required
                        />

                        {/* E-MAIL */}

                        <label htmlFor="usuario-email">

                            E-mail

                        </label>

                        <input
                            id="usuario-email"

                            type="email"

                            placeholder="Digite o e-mail"

                            value={formulario.email}

                            onChange={event =>

                                alterarCampo(

                                    "email",

                                    event.target.value

                                )

                            }

                            disabled={salvando}

                            required
                        />

                        {/* SENHA INICIAL */}

                        {!idEditando && (

                            <>

                                <label htmlFor="usuario-senha">

                                    Senha inicial

                                </label>

                                <input
                                    id="usuario-senha"

                                    type="password"

                                    placeholder="Mínimo de 8 caracteres"

                                    autoComplete="new-password"

                                    minLength={8}

                                    required

                                    value={formulario.senha}

                                    onChange={event =>

                                        alterarCampo(

                                            "senha",

                                            event.target.value

                                        )

                                    }

                                    disabled={salvando}
                                />

                            </>

                        )}

                        {/* PERFIS VINCULADOS */}

                        <fieldset className="rbac-checks">

                            <legend>

                                Perfis vinculados

                            </legend>

                            {!podeEditarPerfis ? (

                                <>

                                    <p>

                                        {formulario.perfis.join(", ") ||

                                            "Sem perfil"}

                                    </p>

                                    {editandoProprioUsuario && (

                                        <small>

                                            Você não pode alterar
                                            os perfis da própria conta.

                                        </small>

                                    )}

                                    {editandoCliente && (

                                        <small>

                                            Os perfis de clientes
                                            estão protegidos.

                                        </small>

                                    )}

                                </>

                            ) : carregandoPerfis ? (

                                <p role="status">

                                    Carregando perfis...

                                </p>

                            ) : erroPerfis ? (

                                <div>

                                    <p
                                        className="rbac-erro"

                                        role="alert"
                                    >

                                        {erroPerfis}

                                    </p>

                                    <button
                                        type="button"

                                        className="rbac-btn"

                                        onClick={carregarPerfis}
                                    >

                                        Tentar novamente

                                    </button>

                                </div>

                            ) : perfisDisponiveis.length > 0 ? (

                                perfisDisponiveis.map(nomePerfil => (

                                    <label key={nomePerfil}>

                                        <input
                                            type="checkbox"

                                            checked={

                                                formulario.perfis.includes(
                                                    nomePerfil
                                                )

                                            }

                                            disabled={

                                                salvando ||

                                                (

                                                    !formulario.perfis.includes(
                                                        nomePerfil
                                                    ) &&

                                                    !perfisBanco.some(perfil =>

                                                        perfil.nome === nomePerfil &&

                                                        perfil.ativo

                                                    )

                                                )

                                            }

                                            onChange={event =>

                                                alterarPerfil(

                                                    nomePerfil,

                                                    event.target.checked

                                                )

                                            }
                                        />

                                        {nomePerfil}

                                    </label>

                                ))

                            ) : (

                                <p>

                                    Nenhum perfil ativo disponível.

                                </p>

                            )}

                        </fieldset>

                        {/* DADOS EXCLUSIVOS DA EDIÇÃO */}

                        {idEditando && (

                            <>

                                <label htmlFor="usuario-cnpj">

                                    Cliente CNPJ

                                </label>

                                <input
                                    id="usuario-cnpj"

                                    value={formatarCnpj(
                                        formulario.cliente
                                    )}

                                    readOnly
                                />

                                <label htmlFor="usuario-status">

                                    Status

                                </label>

                                <select
                                    id="usuario-status"

                                    disabled={

                                        salvando ||

                                        editandoProprioUsuario

                                    }

                                    value={formulario.status}

                                    onChange={event =>

                                        alterarCampo(

                                            "status",

                                            event.target.value

                                        )

                                    }
                                >

                                    <option value="ativo">

                                        Ativo

                                    </option>

                                    <option value="desativado">

                                        Desativado

                                    </option>

                                </select>

                            </>

                        )}

                        {/* BOTÕES DO MODAL */}

                        <div className="botoes-modal-usuario">

                            <button
                                type="button"

                                className="botao-cancelar-usuario"

                                disabled={salvando}

                                onClick={fecharModal}
                            >

                                Cancelar

                            </button>

                            <button
                                type="submit"

                                className="botao-salvar-usuario"

                                disabled={

                                    salvando ||

                                    (

                                        !idEditando &&

                                        (

                                            carregandoPerfis ||

                                            Boolean(erroPerfis) ||

                                            !podeAtribuirPerfis

                                        )

                                    )

                                }
                            >

                                {salvando

                                    ? "Salvando..."

                                    : "Salvar"}

                            </button>

                        </div>

                    </form>

                </div>

            )}

        </div>

    );

}

export default Usuario;