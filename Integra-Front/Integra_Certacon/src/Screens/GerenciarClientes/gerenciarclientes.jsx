import {
    useState,
    useEffect,
    useRef,
    useCallback
} from "react";

import "./gerenciarclientes.css";

import { requisicaoApi } from "../../services/api";

import usePermissoes from "../../hooks/usePermissoes";
import usePesquisaLayout from "../../hooks/usePesquisaLayout";

import LupaCinza from "../../assets/Icones/LupaCinza.png";
import EditarQuadrado from "../../assets/Icones/EditarQuadrado.png";
import Lixeira from "../../assets/Icones/Lixeira.png";
import ExpandirCinza from "../../assets/Icones/ExpandirCinza.png";

// =========================================
// ROTAS DA API
// =========================================

const API_CLIENTES = "/api/Clientes";
const API_CADASTRO_CLIENTES = "/api/CadastroClientes";

const ITENS_POR_PAGINA = 4;

// =========================================
// FUNÇÕES AUXILIARES DO CNPJ
// =========================================

function normalizarCNPJ(valor = "") {
    return String(valor ?? "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase();
}

function formatarCNPJ(valor = "") {
    const cnpj = normalizarCNPJ(valor).slice(0, 14);

    let formatado = cnpj.slice(0, 2);

    if (cnpj.length > 2) {
        formatado += "." + cnpj.slice(2, 5);
    }

    if (cnpj.length > 5) {
        formatado += "." + cnpj.slice(5, 8);
    }

    if (cnpj.length > 8) {
        formatado += "/" + cnpj.slice(8, 12);
    }

    if (cnpj.length > 12) {
        formatado += "-" + cnpj.slice(12, 14);
    }

    return formatado;
}

function calcularDigitoCNPJ(base, pesos) {
    const soma = base
        .split("")
        .reduce((total, caractere, indice) => {
            const valor = caractere.charCodeAt(0) - 48;

            return total + valor * pesos[indice];
        }, 0);

    const resto = soma % 11;

    return resto < 2 ? 0 : 11 - resto;
}

function validarCNPJ(valor) {
    const cnpj = normalizarCNPJ(valor);

    if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(cnpj)) {
        return false;
    }

    if (/^([A-Z0-9])\1+$/.test(cnpj)) {
        return false;
    }

    const primeiroDigito = calcularDigitoCNPJ(
        cnpj.substring(0, 12),
        [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    );

    const segundoDigito = calcularDigitoCNPJ(
        cnpj.substring(0, 12) + primeiroDigito,
        [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    );

    return (
        cnpj.substring(12) ===
        `${primeiroDigito}${segundoDigito}`
    );
}

function normalizarTexto(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

// =========================================
// COMPONENTE PRINCIPAL
// =========================================

function GerenciarClientes() {

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

    const podeGerenciar =
        autenticado &&
        temPermissao("cliente.gerenciar");

    const acessoLiberado =
        podeGerenciar &&
        !carregandoPermissoes &&
        !erroPermissoes;

    // =========================================
    // ESTADOS
    // =========================================

    const [clientes, setClientes] = useState([]);

    // DADOS DE ACESSO

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [telefone, setTelefone] = useState("");

    // DADOS DA EMPRESA

    const [cnpj, setCnpj] = useState("");
    const [razaoSocial, setRazaoSocial] = useState("");
    const [status, setStatus] = useState("Ativo");

    // VALIDAÇÃO DO CNPJ

    const [cnpjValidado, setCnpjValidado] =
        useState(false);

    const [verificandoCnpj, setVerificandoCnpj] =
        useState(false);

    // MENSAGENS

    const [mensagem, setMensagem] = useState("");
    const [tipoMensagem, setTipoMensagem] = useState("");
    const [erro, setErro] = useState("");

    // CARREGAMENTO

    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [alterandoStatus, setAlterandoStatus] = useState(null);

    // PESQUISA E PAGINAÇÃO

    const [pesquisa, setPesquisa] = useState("");
    const [paginaAtual, setPaginaAtual] = useState(1);

    // EDIÇÃO

    const [idEditando, setIdEditando] = useState(null);

    // =========================================
    // REFERÊNCIAS
    // =========================================

    const consultaCnpj = useRef(0);
    const consultaClientes = useRef(0);
    const operacaoRef = useRef(false);
    const formularioRef = useRef(null);

    const token = localStorage.getItem("token");

    const sessaoRef = useRef(token);
    sessaoRef.current = token;

    const acessoRef = useRef(acessoLiberado);
    acessoRef.current = acessoLiberado;

    const montadoRef = useRef(false);

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
            localStorage.getItem("token") === token &&
            acessoRef.current
        );
    }

    // =========================================
    // PESQUISA DO LAYOUT COMPARTILHADO
    // =========================================

    const alterarPesquisa = useCallback(valor => {
        setPesquisa(valor);
        setPaginaAtual(1);
    }, []);

    usePesquisaLayout(
        pesquisa,
        alterarPesquisa
    );

    // =========================================
    // MENSAGENS
    // =========================================

    function mostrarMensagem(texto, tipo = "erro") {
        setMensagem(texto);
        setTipoMensagem(tipo);
    }

    // =========================================
    // CARREGAR CLIENTES
    // =========================================

    const carregarClientes = useCallback(async () => {

        const consulta = ++consultaClientes.current;

        if (
            !acessoLiberado ||
            localStorage.getItem("token") !== token
        ) {
            setClientes([]);
            setCarregando(false);
            return;
        }

        try {
            setCarregando(true);
            setErro("");

            const resposta = await requisicaoApi(
                API_CLIENTES
            );

            if (
                consulta !== consultaClientes.current ||
                localStorage.getItem("token") !== token ||
                !acessoRef.current
            ) {
                return;
            }

            const lista = Array.isArray(resposta)
                ? resposta
                : resposta?.usuarios ??
                  resposta?.Usuarios ??
                  resposta?.clientes ??
                  resposta?.Clientes;

            if (!Array.isArray(lista)) {
                throw new Error(
                    "A API retornou uma lista de clientes inválida."
                );
            }

            const listaFormatada = lista

                .filter(usuario => {

                    const perfis =
                        usuario.perfis ??
                        usuario.Perfis;

                    // O endpoint /api/Clientes já deve
                    // retornar exclusivamente clientes.
                    //
                    // Se os perfis estiverem presentes,
                    // preservamos a verificação adicional.

                    if (!Array.isArray(perfis)) {
                        return true;
                    }

                    return perfis.some(perfil => {

                        const nomePerfil =
                            typeof perfil === "string"
                                ? perfil
                                : perfil.nome ??
                                  perfil.Nome ??
                                  "";

                        return (
                            normalizarTexto(nomePerfil) ===
                            "cliente"
                        );

                    });

                })

                .map(usuario => ({

                    id:
                        usuario.usuarioId ??
                        usuario.UsuarioId ??
                        usuario.id,

                    nome:
                        usuario.nome ??
                        usuario.Nome ??
                        "",

                    email:
                        usuario.email ??
                        usuario.Email ??
                        "",

                    razaoSocial:
                        usuario.razaoSocial ??
                        usuario.RazaoSocial ??
                        "",

                    cnpj: formatarCNPJ(
                        usuario.cnpj ??
                        usuario.Cnpj ??
                        ""
                    ),

                    telefone:
                        usuario.telefoneContato ??
                        usuario.TelefoneContato ??
                        "",

                    vinculo: "Cliente",

                    status:
                        usuario.ativo === false ||
                        usuario.Ativo === false
                            ? "Inativo"
                            : "Ativo"

                }))

                .filter(cliente => cliente.id);

            setClientes(listaFormatada);

        } catch (error) {

            if (
                consulta !== consultaClientes.current ||
                localStorage.getItem("token") !== token
            ) {
                return;
            }

            console.error(
                "Erro ao carregar clientes:",
                error
            );

            setClientes([]);

            setErro(
                error.message ||
                "Não foi possível carregar as empresas cadastradas."
            );

        } finally {

            if (consulta === consultaClientes.current) {
                setCarregando(false);
            }

        }

    }, [
        acessoLiberado,
        token
    ]);

    useEffect(() => {

        setClientes([]);
        setPaginaAtual(1);

        carregarClientes();

        return () => {
            consultaClientes.current++;
            consultaCnpj.current++;
        };

    }, [carregarClientes]);

    // =========================================
    // LIMPAR FORMULÁRIO
    // =========================================

    const limparFormulario = useCallback(() => {

        consultaCnpj.current++;

        setVerificandoCnpj(false);

        setNome("");
        setEmail("");
        setSenha("");
        setTelefone("");

        setCnpj("");
        setRazaoSocial("");
        setStatus("Ativo");

        setCnpjValidado(false);
        setMensagem("");
        setTipoMensagem("");

        setIdEditando(null);

    }, []);

    useEffect(() => {

        limparFormulario();
        setPesquisa("");

    }, [
        token,
        acessoLiberado,
        limparFormulario
    ]);

    // =========================================
    // ALTERAÇÃO DO CNPJ
    // =========================================

    function handleCnpjChange(event) {

        if (
            idEditando ||
            operacaoRef.current
        ) {
            return;
        }

        consultaCnpj.current++;

        setVerificandoCnpj(false);

        setCnpj(
            formatarCNPJ(event.target.value)
        );

        setCnpjValidado(false);
        setRazaoSocial("");

        setMensagem("");
        setTipoMensagem("");

    }

    // =========================================
    // VALIDAR E CONSULTAR CNPJ
    // =========================================

    async function handleValidarCNPJ() {

        if (
            !acessoLiberado ||
            idEditando ||
            verificandoCnpj ||
            operacaoRef.current
        ) {
            return;
        }

        const cnpjLimpo = normalizarCNPJ(cnpj);

        setCnpjValidado(false);
        setMensagem("");

        if (!validarCNPJ(cnpjLimpo)) {

            mostrarMensagem(
                "CNPJ inválido. Confira os caracteres e os dígitos verificadores."
            );

            return;

        }

        const consulta = ++consultaCnpj.current;

        setVerificandoCnpj(true);

        try {

            // VALIDAÇÃO PELA NOSSA API

            const validacao = await requisicaoApi(

                `${API_CLIENTES}/validar-cnpj?cnpj=${encodeURIComponent(cnpjLimpo)}`

            );

            if (
                consulta !== consultaCnpj.current ||
                !sessaoValida()
            ) {
                return;
            }

            const valido =
                validacao?.valido ??
                validacao?.Valido ??
                false;

            if (!valido) {

                mostrarMensagem(
                    validacao?.mensagem ||
                    "CNPJ inválido. Confira os dados informados."
                );

                return;

            }

            setCnpjValidado(true);

            mostrarMensagem(

                "CNPJ válido. Informe a razão social caso não seja encontrada.",

                "sucesso"

            );

            // =====================================
            // CONSULTA EXTERNA OPCIONAL
            //
            // A indisponibilidade da BrasilAPI
            // não impede o cadastro de CNPJs
            // matematicamente válidos.
            // =====================================

            try {

                const resposta = await fetch(

                    `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`,

                    {
                        signal: AbortSignal.timeout(8000)
                    }

                );

                if (!resposta.ok) {
                    return;
                }

                const empresa = await resposta.json();

                if (
                    consulta !== consultaCnpj.current ||
                    !sessaoValida()
                ) {
                    return;
                }

                if (empresa.razao_social) {

                    setRazaoSocial(
                        empresa.razao_social
                    );

                    mostrarMensagem(

                        "CNPJ consultado com sucesso!",

                        "sucesso"

                    );

                }

            } catch {

                // A consulta externa é opcional.
                // A validação feita pela API
                // continua sendo considerada.

            }

        } catch (error) {

            if (
                consulta === consultaCnpj.current &&
                sessaoValida()
            ) {

                mostrarMensagem(

                    error.message ||
                    "Não foi possível validar o CNPJ."

                );

            }

        } finally {

            if (consulta === consultaCnpj.current) {
                setVerificandoCnpj(false);
            }

        }

    }

    // =========================================
    // CADASTRAR OU EDITAR CLIENTE
    // =========================================

    async function salvarCliente(event) {

        event.preventDefault();

        if (
            !acessoLiberado ||
            verificandoCnpj ||
            operacaoRef.current
        ) {
            return;
        }

        setMensagem("");
        setTipoMensagem("");

        // CAMPOS OBRIGATÓRIOS

        if (
            !nome.trim() ||
            !email.trim() ||
            !cnpj.trim() ||
            !razaoSocial.trim()
        ) {

            mostrarMensagem(
                "Preencha todos os campos obrigatórios."
            );

            return;

        }

        // VALIDAR E-MAIL

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {

            mostrarMensagem(
                "Informe um e-mail válido."
            );

            return;

        }

        // SENHA OBRIGATÓRIA SOMENTE NO CADASTRO

        if (!idEditando && !senha.trim()) {

            mostrarMensagem(
                "Informe a senha inicial do cliente."
            );

            return;

        }

        if (!idEditando && senha.length < 8) {

            mostrarMensagem(
                "A senha inicial deve possuir pelo menos 8 caracteres."
            );

            return;

        }

        // VALIDAR CNPJ

        if (!validarCNPJ(cnpj)) {

            mostrarMensagem(
                "O CNPJ informado é inválido."
            );

            return;

        }

        if (!cnpjValidado) {

            mostrarMensagem(
                "Valide o CNPJ antes de salvar."
            );

            return;

        }

        try {

            operacaoRef.current = true;
            setSalvando(true);

            const dados = {

                nome: nome.trim(),

                email: email.trim().toLowerCase(),

                razaoSocial: razaoSocial.trim(),

                cnpj: normalizarCNPJ(cnpj),

                telefoneContato:
                    telefone.trim() || null

            };

            let resposta;

            if (idEditando) {

                // =================================
                // EDITAR CLIENTE
                // =================================

                resposta = await requisicaoApi(

                    `${API_CLIENTES}/${idEditando}`,

                    {
                        method: "PUT",

                        body: JSON.stringify({

                            ...dados,

                            ativo: status === "Ativo"

                        })
                    }

                );

            } else {

                // =================================
                // CADASTRAR CLIENTE
                //
                // A API atribui automaticamente
                // o perfil Cliente.
                // =================================

                resposta = await requisicaoApi(

                    API_CADASTRO_CLIENTES,

                    {
                        method: "POST",

                        body: JSON.stringify({

                            ...dados,

                            senha

                        })
                    }

                );

            }

            if (!sessaoValida()) {
                return;
            }

            const mensagemSucesso =

                resposta?.mensagem ||

                (
                    idEditando

                        ? "Cliente atualizado com sucesso!"

                        : "Cliente cadastrado com sucesso!"
                );

            limparFormulario();

            mostrarMensagem(
                mensagemSucesso,
                "sucesso"
            );

            setPaginaAtual(1);

            await carregarClientes();

        } catch (error) {

            console.error(
                "Erro ao salvar cliente:",
                error
            );

            if (sessaoValida()) {

                mostrarMensagem(

                    error.message ||
                    "Não foi possível salvar o cliente."

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
    // EDITAR CLIENTE
    // =========================================

    function editarCliente(cliente) {

        if (
            !acessoLiberado ||
            operacaoRef.current
        ) {
            return;
        }

        consultaCnpj.current++;

        setVerificandoCnpj(false);

        setIdEditando(cliente.id);

        setNome(cliente.nome);
        setEmail(cliente.email);
        setSenha("");
        setTelefone(cliente.telefone);

        setCnpj(cliente.cnpj);
        setRazaoSocial(cliente.razaoSocial);
        setStatus(cliente.status);

        // CNPJ permanece bloqueado na edição.

        setCnpjValidado(
            validarCNPJ(cliente.cnpj)
        );

        mostrarMensagem(

            "Cliente selecionado para edição.",

            "sucesso"

        );

        // O scroll agora pertence ao LayoutSistema,
        // e não necessariamente à janela.

        requestAnimationFrame(() => {

            formularioRef.current?.scrollIntoView({

                behavior: "smooth",

                block: "start"

            });

        });

    }

    // =========================================
    // DESATIVAR CLIENTE
    // =========================================

    async function excluirCliente(cliente) {

        if (
            !acessoLiberado ||
            operacaoRef.current ||
            cliente.status !== "Ativo"
        ) {
            return;
        }

        const confirmar = window.confirm(

            "Deseja realmente desativar esta empresa? " +

            "O histórico fiscal será preservado."

        );

        if (!confirmar) {
            return;
        }

        try {

            operacaoRef.current = true;

            setAlterandoStatus(cliente.id);

            await requisicaoApi(

                `${API_CLIENTES}/${cliente.id}/status`,

                {
                    method: "PATCH",

                    body: JSON.stringify({

                        ativo: false

                    })
                }

            );

            if (!sessaoValida()) {
                return;
            }

            if (idEditando === cliente.id) {
                setStatus("Inativo");
            }

            setClientes(atuais =>

                atuais.map(item =>

                    item.id === cliente.id

                        ? {
                            ...item,
                            status: "Inativo"
                        }

                        : item

                )

            );

            alert(
                "Empresa desativada com sucesso!"
            );

            setPaginaAtual(1);

            await carregarClientes();

        } catch (error) {

            console.error(
                "Erro ao desativar empresa:",
                error
            );

            if (sessaoValida()) {

                alert(

                    error.message ||
                    "Não foi possível desativar a empresa."

                );

            }

        } finally {

            operacaoRef.current = false;

            if (montadoRef.current) {
                setAlterandoStatus(null);
            }

        }

    }

    // =========================================
    // PESQUISA
    // =========================================

    const textoPesquisa = normalizarTexto(pesquisa);

    const cnpjPesquisa = normalizarCNPJ(pesquisa);

    const clientesFiltrados = acessoLiberado

        ? clientes.filter(cliente => {

            return (

                !textoPesquisa ||

                normalizarTexto(
                    cliente.nome
                ).includes(textoPesquisa) ||

                normalizarTexto(
                    cliente.email
                ).includes(textoPesquisa) ||

                normalizarTexto(
                    cliente.razaoSocial
                ).includes(textoPesquisa) ||

                normalizarTexto(
                    cliente.cnpj
                ).includes(textoPesquisa) ||

                normalizarTexto(
                    cliente.status
                ).includes(textoPesquisa) ||

                (
                    Boolean(cnpjPesquisa) &&

                    normalizarCNPJ(
                        cliente.cnpj
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
            clientesFiltrados.length / ITENS_POR_PAGINA
        )

    );

    const paginaSegura = Math.min(
        paginaAtual,
        totalPaginas
    );

    const inicio =
        (paginaSegura - 1) * ITENS_POR_PAGINA;

    const clientesExibidos = clientesFiltrados.slice(

        inicio,

        inicio + ITENS_POR_PAGINA

    );

    const ocupado =
        salvando ||
        alterandoStatus !== null;

    // =========================================
    // BOTÕES DE AÇÕES
    // =========================================

    function renderizarAcoes(cliente) {

        return (

            <>

                <button
                    type="button"

                    title="Editar empresa"

                    aria-label="Editar empresa"

                    disabled={ocupado}

                    onClick={() =>
                        editarCliente(cliente)
                    }
                >

                    <img
                        src={EditarQuadrado}
                        alt=""
                    />

                </button>

                {cliente.status === "Ativo" && (

                    <button
                        type="button"

                        title="Desativar empresa"

                        aria-label="Desativar empresa"

                        disabled={ocupado}

                        onClick={() =>
                            excluirCliente(cliente)
                        }
                    >

                        <img
                            src={Lixeira}
                            alt=""
                        />

                    </button>

                )}

            </>

        );

    }

    // =========================================
    // RENDERIZAÇÃO
    //
    // Sidebar e Headers são fornecidos
    // exclusivamente pelo LayoutSistema.
    // =========================================

    return (

        <div className="pagina-gerenciar-clientes">

            <main className="principal-gerenciar-clientes">

                <section className="conteudo-gerenciar-clientes">

                    <h1>Gerenciar Clientes</h1>

                    {/* CARREGANDO PERMISSÕES */}

                    {carregandoPermissoes ? (

                        <p role="status">

                            Carregando permissões...

                        </p>

                    ) : erroPermissoes ? (

                        <div
                            className="clientes-aviso erro"

                            role="alert"
                        >

                            <p>

                                Não foi possível carregar
                                suas permissões.

                            </p>

                            <button
                                type="button"

                                className="botao-validar-cnpj"

                                onClick={atualizar}
                            >

                                Tentar novamente

                            </button>

                        </div>

                    ) : !podeGerenciar ? (

                        <div
                            className="clientes-aviso erro"

                            role="alert"
                        >

                            Você não possui permissão
                            para gerenciar clientes.

                        </div>

                    ) : (

                        <>

                            {/* FORMULÁRIO */}

                            <form
                                ref={formularioRef}

                                className="formulario-cliente"

                                onSubmit={salvarCliente}
                            >

                                <h2>

                                    {idEditando

                                        ? "Editar cliente"

                                        : "Cadastrar clientes"}

                                </h2>

                                <div className="campos-cliente">

                                    {/* NOME */}

                                    <div className="campo-cliente">

                                        <label htmlFor="cliente-nome">

                                            Nome do responsável

                                        </label>

                                        <input
                                            id="cliente-nome"

                                            type="text"

                                            value={nome}

                                            onChange={event =>
                                                setNome(
                                                    event.target.value
                                                )
                                            }

                                            placeholder="Nome completo"

                                            disabled={ocupado}

                                            required
                                        />

                                    </div>

                                    {/* E-MAIL */}

                                    <div className="campo-cliente">

                                        <label htmlFor="cliente-email">

                                            E-mail de contato

                                        </label>

                                        <input
                                            id="cliente-email"

                                            type="email"

                                            value={email}

                                            onChange={event =>
                                                setEmail(
                                                    event.target.value
                                                )
                                            }

                                            placeholder="email@empresa.com.br"

                                            disabled={ocupado}

                                            required
                                        />

                                    </div>

                                    {/* TELEFONE */}

                                    <div className="campo-cliente">

                                        <label htmlFor="cliente-telefone">

                                            Telefone

                                        </label>

                                        <input
                                            id="cliente-telefone"

                                            type="tel"

                                            value={telefone}

                                            onChange={event =>
                                                setTelefone(
                                                    event.target.value
                                                )
                                            }

                                            placeholder="(00) 00000-0000"

                                            disabled={ocupado}
                                        />

                                    </div>

                                    {/* SENHA */}

                                    <div className="campo-cliente">

                                        <label htmlFor="cliente-senha">

                                            Senha inicial

                                        </label>

                                        <input
                                            id="cliente-senha"

                                            type="password"

                                            value={senha}

                                            onChange={event =>
                                                setSenha(
                                                    event.target.value
                                                )
                                            }

                                            placeholder={

                                                idEditando

                                                    ? "Não é necessário preencher"

                                                    : "Digite a senha inicial"

                                            }

                                            autoComplete="new-password"

                                            minLength={
                                                idEditando
                                                    ? undefined
                                                    : 8
                                            }

                                            required={!idEditando}

                                            disabled={
                                                Boolean(idEditando) ||
                                                ocupado
                                            }
                                        />

                                        {idEditando && (

                                            <small>

                                                A senha atual não será
                                                alterada nesta edição.

                                            </small>

                                        )}

                                    </div>

                                    {/* CNPJ */}

                                    <div className="campo-cliente campo-cnpj">

                                        <label htmlFor="cliente-cnpj">

                                            CNPJ

                                        </label>

                                        <input
                                            id="cliente-cnpj"

                                            type="text"

                                            value={cnpj}

                                            onChange={handleCnpjChange}

                                            disabled={

                                                Boolean(idEditando) ||

                                                verificandoCnpj ||

                                                ocupado

                                            }

                                            placeholder="00.AAA.000/0000-00"

                                            maxLength={18}

                                            autoCapitalize="characters"

                                            spellCheck={false}

                                            required
                                        />

                                        <small>

                                            O CNPJ será validado antes de salvar
                                            e não poderá ser alterado após
                                            o cadastro.

                                        </small>

                                    </div>

                                    {/* STATUS */}

                                    <div className="campo-cliente">

                                        <label htmlFor="cliente-status">

                                            Status

                                        </label>

                                        <div className="select-com-seta">

                                            <select
                                                id="cliente-status"

                                                value={status}

                                                onChange={event =>
                                                    setStatus(
                                                        event.target.value
                                                    )
                                                }

                                                disabled={
                                                    !idEditando ||
                                                    ocupado
                                                }
                                            >

                                                <option value="Ativo">

                                                    Ativo

                                                </option>

                                                <option value="Inativo">

                                                    Inativo

                                                </option>

                                            </select>

                                            <img
                                                src={ExpandirCinza}

                                                alt=""
                                            />

                                        </div>

                                        {!idEditando && (

                                            <small>

                                                Novos clientes são
                                                cadastrados como ativos.

                                            </small>

                                        )}

                                    </div>

                                    {/* RAZÃO SOCIAL */}

                                    <div className="campo-cliente campo-razao-social">

                                        <label htmlFor="cliente-razao-social">

                                            Razão Social

                                        </label>

                                        <input
                                            id="cliente-razao-social"

                                            type="text"

                                            value={razaoSocial}

                                            placeholder="Informe a razão social"

                                            onChange={event =>
                                                setRazaoSocial(
                                                    event.target.value
                                                )
                                            }

                                            disabled={
                                                verificandoCnpj ||
                                                ocupado
                                            }

                                            required
                                        />

                                    </div>

                                </div>

                                {/* RODAPÉ DO FORMULÁRIO */}

                                <div className="rodape-formulario-cliente">

                                    <div className="validacao-cnpj">

                                        {mensagem && (

                                            <span
                                                className={`mensagem-cliente ${
                                                    tipoMensagem === "sucesso"
                                                        ? "sucesso"
                                                        : "falha"
                                                }`}

                                                role={
                                                    tipoMensagem === "sucesso"
                                                        ? "status"
                                                        : "alert"
                                                }
                                            >

                                                {mensagem}

                                            </span>

                                        )}

                                        <button
                                            type="button"

                                            className="botao-validar-cnpj"

                                            onClick={handleValidarCNPJ}

                                            disabled={

                                                Boolean(idEditando) ||

                                                verificandoCnpj ||

                                                ocupado

                                            }
                                        >

                                            {verificandoCnpj

                                                ? "Verificando..."

                                                : "Validar CNPJ"}

                                        </button>

                                    </div>

                                    <div className="botoes-formulario-cliente">

                                        <button
                                            type="submit"

                                            className="botao-salvar-cliente"

                                            disabled={
                                                ocupado ||
                                                verificandoCnpj
                                            }
                                        >

                                            {salvando

                                                ? "Salvando..."

                                                : idEditando

                                                    ? "Atualizar cliente"

                                                    : "Salvar cliente"}

                                        </button>

                                        <button
                                            type="button"

                                            className="botao-cancelar-cliente"

                                            onClick={limparFormulario}

                                            disabled={ocupado}
                                        >

                                            Cancelar

                                        </button>

                                    </div>

                                </div>

                            </form>

                            {/* EMPRESAS CADASTRADAS */}

                            <h2 className="titulo-empresas-cadastradas">

                                Empresas Cadastradas

                            </h2>

                            {/* ERRO DA API */}

                            {erro && (

                                <div
                                    className="clientes-aviso erro"

                                    role="alert"
                                >

                                    <p>{erro}</p>

                                    <button
                                        type="button"

                                        className="botao-validar-cnpj"

                                        onClick={carregarClientes}

                                        disabled={ocupado}
                                    >

                                        Tentar novamente

                                    </button>

                                </div>

                            )}

                            {/* PESQUISA */}

                            <div className="pesquisa-clientes">

                                <img
                                    src={LupaCinza}
                                    alt=""
                                />

                                <input
                                    type="search"

                                    placeholder="Buscar por nome, razão social ou CNPJ"

                                    aria-label="Pesquisar clientes"

                                    value={pesquisa}

                                    onChange={event =>
                                        alterarPesquisa(
                                            event.target.value
                                        )
                                    }
                                />

                            </div>

                            {/* TOTAL DE CLIENTES */}

                            {!carregando && !erro && (

                                <p className="total-clientes">

                                    {clientesFiltrados.length}

                                    {" "}

                                    {clientesFiltrados.length === 1

                                        ? "empresa encontrada"

                                        : "empresas encontradas"}

                                </p>

                            )}

                            {/* CARDS MOBILE */}

                            <div className="clientes-cards-mobile">

                                {carregando ? (

                                    <p className="sem-clientes-mobile">

                                        Carregando empresas...

                                    </p>

                                ) : erro ? (

                                    <p className="sem-clientes-mobile">

                                        Não foi possível carregar as empresas.

                                    </p>

                                ) : clientesExibidos.length > 0 ? (

                                    clientesExibidos.map(cliente => {

                                        const cnpjValido =
                                            validarCNPJ(cliente.cnpj);

                                        return (

                                            <div
                                                key={cliente.id}

                                                className="card-cliente"
                                            >

                                                <div className="dados-card-cliente">

                                                    <strong>

                                                        {cliente.razaoSocial}

                                                    </strong>

                                                    <span>

                                                        {cliente.cnpj}

                                                    </span>

                                                    <span
                                                        className={`validacao-card ${
                                                            cnpjValido
                                                                ? "cnpj-valido"
                                                                : "cnpj-invalido"
                                                        }`}
                                                    >

                                                        {cnpjValido

                                                            ? "Dígitos válidos"

                                                            : "CNPJ inválido"}

                                                    </span>

                                                    <span>

                                                        Responsável: {cliente.nome}

                                                    </span>

                                                    <span>

                                                        Status: {cliente.status}

                                                    </span>

                                                </div>

                                                <div className="acoes-card-cliente">

                                                    {renderizarAcoes(cliente)}

                                                </div>

                                            </div>

                                        );

                                    })

                                ) : (

                                    <p className="sem-clientes-mobile">

                                        Nenhuma empresa encontrada.

                                    </p>

                                )}

                            </div>

                            {/* TABELA DESKTOP */}

                            <div className="tabela-clientes">

                                <table>

                                    <thead>

                                        <tr>

                                            <th>Razão Social</th>

                                            <th>CNPJ</th>

                                            <th>Vínculo</th>

                                            <th>Status</th>

                                            <th>Ações</th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {carregando ? (

                                            <tr>

                                                <td
                                                    colSpan={5}

                                                    className="sem-clientes"
                                                >

                                                    Carregando empresas...

                                                </td>

                                            </tr>

                                        ) : erro ? (

                                            <tr>

                                                <td
                                                    colSpan={5}

                                                    className="sem-clientes"
                                                >

                                                    Não foi possível carregar
                                                    as empresas.

                                                </td>

                                            </tr>

                                        ) : clientesExibidos.length > 0 ? (

                                            clientesExibidos.map(cliente => (

                                                <tr key={cliente.id}>

                                                    <td>

                                                        {cliente.razaoSocial}

                                                    </td>

                                                    <td>

                                                        {cliente.cnpj}

                                                    </td>

                                                    <td>

                                                        {cliente.vinculo}

                                                    </td>

                                                    <td>

                                                        <span
                                                            className={`status-cliente ${
                                                                cliente.status === "Ativo"

                                                                    ? "status-ativo"

                                                                    : "status-inativo"
                                                            }`}
                                                        >

                                                            {cliente.status}

                                                        </span>

                                                    </td>

                                                    <td>

                                                        <div className="acoes-cliente">

                                                            {renderizarAcoes(cliente)}

                                                        </div>

                                                    </td>

                                                </tr>

                                            ))

                                        ) : (

                                            <tr>

                                                <td
                                                    colSpan={5}

                                                    className="sem-clientes"
                                                >

                                                    Nenhuma empresa encontrada.

                                                </td>

                                            </tr>

                                        )}

                                    </tbody>

                                </table>

                            </div>

                            {/* PAGINAÇÃO */}

                            {!carregando &&
                                !erro &&
                                clientesFiltrados.length > 0 && (

                                <div className="paginacao-clientes">

                                    <button
                                        type="button"

                                        disabled={paginaSegura === 1}

                                        aria-label="Página anterior"

                                        onClick={() =>
                                            setPaginaAtual(
                                                paginaSegura - 1
                                            )
                                        }
                                    >

                                        {"<"}

                                    </button>

                                    {Array.from(

                                        { length: totalPaginas },

                                        (_, index) => index + 1

                                    ).map(pagina => (

                                        <button
                                            key={pagina}

                                            type="button"

                                            className={

                                                paginaSegura === pagina

                                                    ? "pagina-ativa"

                                                    : ""

                                            }

                                            onClick={() =>
                                                setPaginaAtual(pagina)
                                            }
                                        >

                                            {pagina}

                                        </button>

                                    ))}

                                    <button
                                        type="button"

                                        disabled={
                                            paginaSegura === totalPaginas
                                        }

                                        aria-label="Próxima página"

                                        onClick={() =>
                                            setPaginaAtual(
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

                </section>

            </main>

        </div>

    );

}

export default GerenciarClientes;