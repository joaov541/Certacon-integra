
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./gerenciarclientes.css";

import { requisicaoApi } from "../../services/api";

import Header from "../../components/Header/header";
import HeaderDesktop from "../../components/Header/headerDesktop";

import CasaBranca from "../../assets/Icones/CasaBranca.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
import LupaCinza from "../../assets/Icones/LupaCinza.png";
import SairBranco from "../../assets/Icones/SairBranco.png";
import LogoNome from "../../assets/Icones/LogoNome.png";
import EditarQuadrado from "../../assets/Icones/EditarQuadrado.png";
import Lixeira from "../../assets/Icones/Lixeira.png";
import ExpandirCinza from "../../assets/Icones/ExpandirCinza.png";

// Rotas da API
const API_USUARIOS = "/api/Usuarios";
const API_CADASTRO_CLIENTES = "/api/CadastroClientes";

// =====================================================
// FUNÇÕES AUXILIARES DO CNPJ
// =====================================================

function normalizarCNPJ(valor = "") {
    return String(valor)
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .slice(0, 14);
}

function formatarCNPJ(valor = "") {
    const cnpj = normalizarCNPJ(valor);

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

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

function GerenciarClientes() {
    // Dados dos clientes
    const [clientes, setClientes] = useState([]);

    // Dados de acesso
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [telefone, setTelefone] = useState("");

    // Dados da empresa
    const [cnpj, setCnpj] = useState("");
    const [razaoSocial, setRazaoSocial] = useState("");
    const [status, setStatus] = useState("Ativo");

    // Validação do CNPJ
    const [cnpjValidado, setCnpjValidado] = useState(false);
    const [verificandoCnpj, setVerificandoCnpj] = useState(false);

    // Mensagens
    const [mensagem, setMensagem] = useState("");
    const [erro, setErro] = useState("");

    // Carregamento
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);

    // Pesquisa e paginação
    const [pesquisa, setPesquisa] = useState("");
    const [paginaAtual, setPaginaAtual] = useState(1);

    // Edição
    const [idEditando, setIdEditando] = useState(null);

    const itensPorPagina = 4;

    // =====================================================
    // CARREGAR CLIENTES
    // =====================================================

    async function carregarClientes() {
        try {
            setCarregando(true);
            setErro("");

            const resposta = await requisicaoApi(API_USUARIOS);

            const lista = Array.isArray(resposta)
                ? resposta
                : resposta?.usuarios ||
                  resposta?.Usuarios ||
                  [];

            if (!Array.isArray(lista)) {
                throw new Error(
                    "A API retornou uma lista de usuários inválida."
                );
            }

            const listaFormatada = lista
                .filter((usuario) => {
                    const perfis =
                        usuario.perfis ||
                        usuario.Perfis ||
                        [];

                    return (
                        Array.isArray(perfis) &&
                        perfis.some(
                            (perfil) =>
                                String(perfil).trim().toLowerCase() === "cliente"
                        )
                    );
                })
                .map((usuario) => ({
                    id: usuario.usuarioId || usuario.UsuarioId,

                    nome:
                        usuario.nome ||
                        usuario.Nome ||
                        "",

                    email:
                        usuario.email ||
                        usuario.Email ||
                        "",

                    razaoSocial:
                        usuario.razaoSocial ||
                        usuario.RazaoSocial ||
                        "",

                    cnpj: formatarCNPJ(
                        usuario.cnpj ||
                        usuario.Cnpj ||
                        ""
                    ),

                    telefone:
                        usuario.telefoneContato ||
                        usuario.TelefoneContato ||
                        "",

                    vinculo: "Cliente",

                    status:
                        usuario.ativo === false ||
                        usuario.Ativo === false
                            ? "Inativo"
                            : "Ativo",
                }));

            setClientes(listaFormatada);

        } catch (erro) {
            console.error("Erro ao carregar clientes:", erro);

            setErro(
                erro.message ||
                "Não foi possível carregar as empresas cadastradas."
            );

        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarClientes();
    }, []);

    // =====================================================
    // ALTERAÇÃO DO CNPJ
    // =====================================================

    function handleCnpjChange(e) {
        setCnpj(formatarCNPJ(e.target.value));

        setCnpjValidado(false);
        setRazaoSocial("");
        setMensagem("");
    }

    // =====================================================
    // VALIDAR E CONSULTAR CNPJ
    // =====================================================

    async function handleValidarCNPJ() {
        const cnpjLimpo = normalizarCNPJ(cnpj);

        if (!validarCNPJ(cnpjLimpo)) {
            setCnpjValidado(false);
            setRazaoSocial("");

            setMensagem(
                "CNPJ inválido. Confira os dados informados."
            );

            return;
        }

        try {
            setVerificandoCnpj(true);
            setCnpjValidado(false);
            setMensagem("");

            const resposta = await fetch(
                `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`
            );

            if (!resposta.ok) {
                throw new Error(
                    "Não foi possível consultar este CNPJ."
                );
            }

            const empresa = await resposta.json();

            if (!empresa.razao_social) {
                throw new Error(
                    "A consulta não retornou a razão social."
                );
            }

            setRazaoSocial(empresa.razao_social);
            setCnpjValidado(true);

            setMensagem("CNPJ consultado com sucesso!");

        } catch (erro) {
            console.error("Erro ao consultar CNPJ:", erro);

            setRazaoSocial("");
            setCnpjValidado(false);

            setMensagem(
                erro.message ||
                "Não foi possível verificar o CNPJ."
            );

        } finally {
            setVerificandoCnpj(false);
        }
    }

    // =====================================================
    // LIMPAR FORMULÁRIO
    // =====================================================

    function limparFormulario() {
        setNome("");
        setEmail("");
        setSenha("");
        setTelefone("");

        setCnpj("");
        setRazaoSocial("");
        setStatus("Ativo");

        setCnpjValidado(false);
        setMensagem("");

        setIdEditando(null);
    }

    // =====================================================
    // CADASTRAR OU EDITAR CLIENTE
    // =====================================================

    async function salvarCliente(e) {
        e.preventDefault();

        setMensagem("");
        setErro("");

        if (
            !nome.trim() ||
            !email.trim() ||
            !cnpj.trim() ||
            !razaoSocial.trim()
        ) {
            setMensagem(
                "Preencha todos os campos obrigatórios."
            );
            return;
        }

        // Senha obrigatória somente no cadastro
        if (!idEditando && !senha.trim()) {
            setMensagem(
                "Informe a senha inicial do cliente."
            );
            return;
        }

        if (!idEditando && senha.length < 8) {
            setMensagem(
                "A senha inicial deve possuir pelo menos 8 caracteres."
            );
            return;
        }

        if (!validarCNPJ(cnpj)) {
            setMensagem("O CNPJ informado é inválido.");
            return;
        }

        if (!cnpjValidado) {
            setMensagem(
                "Consulte o CNPJ antes de salvar."
            );
            return;
        }

        try {
            setSalvando(true);

            // Dados compartilhados entre cadastro e edição
            const dados = {
                nome: nome.trim(),
                email: email.trim().toLowerCase(),
                razaoSocial: razaoSocial.trim(),
                cnpj: normalizarCNPJ(cnpj),
                telefoneContato: telefone.trim() || null,
            };

            let resposta;

            if (idEditando) {
                // =========================================
                // EDITAR CLIENTE
                // =========================================

                resposta = await requisicaoApi(
                    `${API_USUARIOS}/${idEditando}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(dados),
                    }
                );

                // Atualiza o status separadamente
                await requisicaoApi(
                    `${API_USUARIOS}/${idEditando}/status`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            ativo: status === "Ativo",
                        }),
                    }
                );

            } else {
                // =========================================
                // CADASTRAR CLIENTE
                // =========================================

                resposta = await requisicaoApi(
                    API_CADASTRO_CLIENTES,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            ...dados,
                            senha: senha,
                        }),
                    }
                );
            }

            alert(
                resposta?.mensagem ||
                (
                    idEditando
                        ? "Cliente atualizado com sucesso!"
                        : "Cliente cadastrado com sucesso!"
                )
            );

            limparFormulario();

            setPaginaAtual(1);

            await carregarClientes();

        } catch (erro) {
            console.error("Erro ao salvar cliente:", erro);

            setMensagem(
                erro.message ||
                "Não foi possível salvar o cliente."
            );

        } finally {
            setSalvando(false);
        }
    }

    // =====================================================
    // EDITAR CLIENTE
    // =====================================================

    function editarCliente(cliente) {
        setIdEditando(cliente.id);

        setNome(cliente.nome);
        setEmail(cliente.email);
        setSenha("");
        setTelefone(cliente.telefone);

        setCnpj(cliente.cnpj);
        setRazaoSocial(cliente.razaoSocial);
        setStatus(cliente.status);

        // O CNPJ já está cadastrado
        setCnpjValidado(true);

        setMensagem(
            "Cliente selecionado para edição."
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    // =====================================================
    // DESATIVAR CLIENTE
    // =====================================================

    async function excluirCliente(id) {
        const confirmar = window.confirm(
            "Deseja realmente desativar esta empresa? " +
            "O histórico fiscal será preservado."
        );

        if (!confirmar) return;

        try {
            await requisicaoApi(
                `${API_USUARIOS}/${id}/status`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        ativo: false,
                    }),
                }
            );

            alert("Empresa desativada com sucesso!");

            setPaginaAtual(1);

            await carregarClientes();

        } catch (erro) {
            console.error(
                "Erro ao desativar empresa:",
                erro
            );

            alert(
                erro.message ||
                "Não foi possível desativar a empresa."
            );
        }
    }

    // =====================================================
    // PESQUISA
    // =====================================================

    const textoPesquisa = pesquisa.trim().toLowerCase();

    const clientesFiltrados = clientes.filter((cliente) => {
        return (
            cliente.nome.toLowerCase().includes(textoPesquisa) ||
            cliente.email.toLowerCase().includes(textoPesquisa) ||
            cliente.razaoSocial.toLowerCase().includes(textoPesquisa) ||
            cliente.cnpj.toLowerCase().includes(textoPesquisa)
        );
    });

    // =====================================================
    // PAGINAÇÃO
    // =====================================================

    const totalPaginas = Math.max(
        1,
        Math.ceil(
            clientesFiltrados.length / itensPorPagina
        )
    );

    const paginaSegura = Math.min(
        paginaAtual,
        totalPaginas
    );

    const inicio = (paginaSegura - 1) * itensPorPagina;

    const clientesExibidos = clientesFiltrados.slice(
        inicio,
        inicio + itensPorPagina
    );

    // =====================================================
    // TELA
    // =====================================================

    return (
        <div className="pagina-gerenciar-clientes">

            <Sidebar />

            <main className="principal-gerenciar-clientes">

                <HeaderDesktop />
                <Header />

                <section className="conteudo-gerenciar-clientes">

                    <h1>Gerenciar Clientes</h1>

                    <div className="titulo-gerenciar-clientes"></div>

                    {/* FORMULÁRIO */}

                    <form
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
                                <label>Nome do responsável</label>

                                <input
                                    type="text"
                                    value={nome}
                                    onChange={(e) =>
                                        setNome(e.target.value)
                                    }
                                    placeholder="Nome completo"
                                    required
                                />
                            </div>

                            {/* EMAIL */}

                            <div className="campo-cliente">
                                <label>E-mail de acesso</label>

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    placeholder="email@empresa.com.br"
                                    required
                                />
                            </div>

                            {/* TELEFONE */}

                            <div className="campo-cliente">
                                <label>Telefone</label>

                                <input
                                    type="tel"
                                    value={telefone}
                                    onChange={(e) =>
                                        setTelefone(e.target.value)
                                    }
                                    placeholder="(00) 00000-0000"
                                />
                            </div>

                            {/* SENHA */}

                            <div className="campo-cliente">
                                <label>Senha inicial</label>

                                <input
                                    type="password"
                                    value={senha}
                                    onChange={(e) =>
                                        setSenha(e.target.value)
                                    }
                                    placeholder={
                                        idEditando
                                            ? "Não é necessário preencher"
                                            : "Digite a senha inicial"
                                    }
                                    required={!idEditando}
                                    disabled={!!idEditando}
                                />

                                {idEditando && (
                                    <small>
                                        A senha atual não será alterada nesta edição.
                                    </small>
                                )}
                            </div>

                            {/* CNPJ */}

                            <div className="campo-cliente campo-cnpj">
                                <label>CNPJ</label>

                                <input
                                    type="text"
                                    value={cnpj}
                                    onChange={handleCnpjChange}
                                    placeholder="00.AAA.000/0000-00"
                                    maxLength={18}
                                    required
                                />

                                <small>
                                    O CNPJ será consultado antes de salvar.
                                </small>
                            </div>

                            {/* STATUS */}

                            <div className="campo-cliente">
                                <label>Status</label>

                                <div className="select-com-seta">

                                    <select
                                        value={status}
                                        onChange={(e) =>
                                            setStatus(e.target.value)
                                        }
                                        disabled={!idEditando}
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
                                        Novos clientes são cadastrados como ativos.
                                    </small>
                                )}
                            </div>

                            {/* RAZÃO SOCIAL */}

                            <div className="campo-cliente campo-razao-social">
                                <label>Razão Social</label>

                                <input
                                    type="text"
                                    value={razaoSocial}
                                    placeholder="Preenchida após consultar o CNPJ"
                                    readOnly
                                    required
                                />
                            </div>

                        </div>

                        {/* RODAPÉ DO FORMULÁRIO */}

                        <div className="rodape-formulario-cliente">

                            <div className="validacao-cnpj">

                                {mensagem && (
                                    <span
                                        className={
                                            cnpjValidado
                                                ? "mensagem-cliente sucesso"
                                                : "mensagem-cliente"
                                        }
                                    >
                                        {mensagem}
                                    </span>
                                )}

                                <button
                                    type="button"
                                    className="botao-validar-cnpj"
                                    onClick={handleValidarCNPJ}
                                    disabled={verificandoCnpj || salvando}
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
                                    disabled={salvando || verificandoCnpj}
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
                                    disabled={salvando}
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

                    {erro && (
                        <p className="mensagem-cliente">
                            {erro}
                        </p>
                    )}

                    {/* PESQUISA */}

                    <div className="pesquisa-clientes">

                        <img src={LupaCinza} alt="" />

                        <input
                            type="text"
                            placeholder="Buscar por nome ou CNPJ"
                            value={pesquisa}
                            onChange={(e) => {
                                setPesquisa(e.target.value);
                                setPaginaAtual(1);
                            }}
                        />

                    </div>

                    {/* CARDS MOBILE */}

                    <div className="clientes-cards-mobile">

                        {carregando ? (
                            <p>Carregando empresas...</p>
                        ) : clientesExibidos.length > 0 ? (

                            clientesExibidos.map((cliente) => {

                                const cnpjValido = validarCNPJ(
                                    cliente.cnpj
                                );

                                return (
                                    <div
                                        className="card-cliente"
                                        key={cliente.id}
                                    >

                                        <div className="dados-card-cliente">

                                            <strong>
                                                {cliente.razaoSocial}
                                            </strong>

                                            <span>{cliente.cnpj}</span>

                                            <span
                                                className={`validacao-card ${
                                                    cnpjValido
                                                        ? "cnpj-valido"
                                                        : "cnpj-invalido"
                                                }`}
                                            >
                                                {cnpjValido
                                                    ? "CNPJ válido"
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

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    editarCliente(cliente)
                                                }
                                                title="Editar empresa"
                                            >
                                                <img
                                                    src={EditarQuadrado}
                                                    alt="Editar"
                                                />
                                            </button>

                                            {cliente.status === "Ativo" && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        excluirCliente(cliente.id)
                                                    }
                                                    title="Desativar empresa"
                                                >
                                                    <img
                                                        src={Lixeira}
                                                        alt="Desativar"
                                                    />
                                                </button>
                                            )}

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
                                            colSpan="5"
                                            className="sem-clientes"
                                        >
                                            Carregando empresas...
                                        </td>
                                    </tr>

                                ) : clientesExibidos.length > 0 ? (

                                    clientesExibidos.map((cliente) => (

                                        <tr key={cliente.id}>

                                            <td>{cliente.razaoSocial}</td>

                                            <td>{cliente.cnpj}</td>

                                            <td>{cliente.vinculo}</td>

                                            <td>
                                                <span
                                                    className={`status-cliente ${
                                                        cliente.status === "Ativo"
                                                            ? "status-ativo"
                                                            : "status-inativo"
                                                    }`}
                                                >
                                                    {cliente.status.toLowerCase()}
                                                </span>
                                            </td>

                                            <td>

                                                <div className="acoes-cliente">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            editarCliente(cliente)
                                                        }
                                                        title="Editar empresa"
                                                    >
                                                        <img
                                                            src={EditarQuadrado}
                                                            alt="Editar"
                                                        />
                                                    </button>

                                                    {cliente.status === "Ativo" && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                excluirCliente(cliente.id)
                                                            }
                                                            title="Desativar empresa"
                                                        >
                                                            <img
                                                                src={Lixeira}
                                                                alt="Desativar"
                                                            />
                                                        </button>
                                                    )}

                                                </div>

                                            </td>

                                        </tr>

                                    ))

                                ) : (

                                    <tr>
                                        <td
                                            colSpan="5"
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

                    <div className="paginacao-clientes">

                        {Array.from(
                            { length: totalPaginas },
                            (_, index) => index + 1
                        ).map((pagina) => (

                            <button
                                key={pagina}
                                type="button"
                                className={
                                    paginaSegura === pagina
                                        ? "pagina-ativa"
                                        : ""
                                }
                                onClick={() => setPaginaAtual(pagina)}
                            >
                                {pagina}
                            </button>

                        ))}

                    </div>

                </section>

            </main>

        </div>
    );
}

// =====================================================
// MENU LATERAL
// =====================================================

function Sidebar() {
    const navigate = useNavigate();

    function sairSistema() {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        localStorage.removeItem("perfis");
        navigate("/login", { replace: true });
    }

    return (
        <aside className="menu-gerenciar-clientes">

            <div className="logo-gerenciar-clientes">
                <img src={LogoNome} alt="Integra" />
            </div>

            <nav className="navegacao-gerenciar-clientes">

                <Link to="/home" className="item-menu-clientes">
                    <img src={CasaBranca} alt="" />
                    <span>Início</span>
                </Link>

                <Link to="/conteudos" className="item-menu-clientes">
                    <img src={LivroBranco} alt="" />
                    <span>Conteúdos</span>
                </Link>



                <Link to="/clientes" className="item-menu-clientes ativo">
                    <img src={ADDProfileBranco} alt="" />
                    <span>Clientes</span>
                </Link>

                <Link to="/usuario" className="item-menu-clientes">
                    <img src={PessoaBranca} alt="" />
                    <span>Usuários</span>
                </Link>

            </nav>

            <button
                className="sair-gerenciar-clientes"
                onClick={sairSistema}
            >
                <img src={SairBranco} alt="" />
                <span>Sair</span>
            </button>

        </aside>
    );
}

export default GerenciarClientes;
