
import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";
import "./gerenciarclientes.css";

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



const dadosIniciais = [
    {
        id: 1,
        razaoSocial: "Alfa Contabilidade Ltda",
        cnpj: "13.345.678/0001-90",
        vinculo: "Cliente",
        status: "Ativo",
    },
    {
        id: 2,
        razaoSocial: "Beta serviços fiscais",
        cnpj: "13.345.678/0001-90",
        vinculo: "Cliente",
        status: "Ativo",
    },
    {
        id: 3,
        razaoSocial: "Grupo Horizonte S.A.",
        cnpj: "13.345.678/0001-90",
        vinculo: "Cliente",
        status: "Ativo",
    },
    {
        id: 4,
        razaoSocial: "Delta Consultoria Ltda",
        cnpj: "13.345.678/0001-90",
        vinculo: "Cliente",
        status: "Ativo",
    },
];

function formatarCNPJ(valor) {
    return valor
        .replace(/\D/g, "")
        .slice(0, 14)
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
}

function validarCNPJ(cnpj) {
    const numeros = cnpj.replace(/\D/g, "");

    if (numeros.length !== 14 || /^(\d)\1+$/.test(numeros)) {
        return false;
    }

    const calcularDigito = (base, pesos) => {
        const soma = base
            .split("")
            .reduce((total, numero, indice) => {
                return total + Number(numero) * pesos[indice];
            }, 0);

        const resto = soma % 11;

        return resto < 2 ? 0 : 11 - resto;
    };

    const primeiroDigito = calcularDigito(
        numeros.slice(0, 12),
        [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    );

    const segundoDigito = calcularDigito(
        numeros.slice(0, 12) + primeiroDigito,
        [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    );

    return numeros.endsWith(`${primeiroDigito}${segundoDigito}`);
}

function GerenciarClientes() {
    const navigate = useNavigate();

    const [clientes, setClientes] = useState(dadosIniciais);

    const [cnpj, setCnpj] = useState("");
    const [status, setStatus] = useState("");
    const [razaoSocial, setRazaoSocial] = useState("");

    const [cnpjValidado, setCnpjValidado] = useState(false);
    const [mensagem, setMensagem] = useState("");

    const [pesquisa, setPesquisa] = useState("");
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [idEditando, setIdEditando] = useState(null);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    const itensPorPagina = 4;

    function handleCnpjChange(e) {
        setCnpj(formatarCNPJ(e.target.value));
        setCnpjValidado(false);
        setMensagem("");
    }

    function handleValidarCNPJ() {
        if (validarCNPJ(cnpj)) {
            setCnpjValidado(true);
            setMensagem("CNPJ validado com sucesso!");
        } else {
            setCnpjValidado(false);
            setMensagem("CNPJ inválido. Verifique os números.");
        }
    }

    function limparFormulario() {
        setCnpj("");
        setStatus("");
        setRazaoSocial("");
        setCnpjValidado(false);
        setMensagem("");
        setIdEditando(null);
        setMostrarFormulario(false);
    }

    function salvarCliente(e) {
        e.preventDefault();

        if (!cnpj || !status || !razaoSocial.trim()) {
            setMensagem("Preencha todos os campos.");
            return;
        }

        if (!cnpjValidado) {
            setMensagem("Valide o CNPJ antes de salvar.");
            return;
        }

        const clienteAtualizado = {
            id: idEditando || Date.now(),
            razaoSocial: razaoSocial.trim(),
            cnpj,
            vinculo: "Cliente",
            status,
        };

        if (idEditando) {
            setClientes((lista) =>
                lista.map((cliente) =>
                    cliente.id === idEditando ? clienteAtualizado : cliente
                )
            );
        } else {
            setClientes((lista) => [...lista, clienteAtualizado]);
        }

        limparFormulario();
        setPaginaAtual(1);
    }

    function editarCliente(cliente) {
        setMostrarFormulario(true);

        setIdEditando(cliente.id);
        setRazaoSocial(cliente.razaoSocial);
        setCnpj(cliente.cnpj);
        setStatus(cliente.status);
        setCnpjValidado(true);
        setMensagem("CNPJ já validado para este cadastro.");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    function excluirCliente(id) {
        const confirmar = window.confirm(
            "Tem certeza que deseja excluir este cliente?"
        );

        if (confirmar) {
            const novaLista = clientes.filter(
                (cliente) => cliente.id !== id
            );

            setClientes(novaLista);

            const totalPaginas = Math.max(
                1,
                Math.ceil(novaLista.length / itensPorPagina)
            );

            if (paginaAtual > totalPaginas) {
                setPaginaAtual(totalPaginas);
            }
        }
    }

    // Pesquisa por razão social ou CNPJ
    const clientesFiltrados = clientes.filter((cliente) => {
        const texto = pesquisa.toLowerCase();

        return (
            cliente.razaoSocial.toLowerCase().includes(texto) ||
            cliente.cnpj.toLowerCase().includes(texto)
        );
    });

    // Paginação
    const totalPaginas = Math.max(
        1,
        Math.ceil(clientesFiltrados.length / itensPorPagina)
    );

    const inicio = (paginaAtual - 1) * itensPorPagina;

    const clientesExibidos = clientesFiltrados.slice(
        inicio,
        inicio + itensPorPagina
    );

    return (
        <div className="pagina-gerenciar-clientes">

            <Sidebar />

            <main className="principal-gerenciar-clientes">
   <HeaderDesktop />
                <Header />

                <section className="conteudo-gerenciar-clientes">

                    <h1>Gerenciar Clientes</h1><div className="titulo-gerenciar-clientes">

                       

                        <button
                            type="button"
                            className="botao-criar-cliente"
                            onClick={() => {
                                limparFormulario();
                                setMostrarFormulario(true);
                            }}
                        >
                            + Criar cliente
                        </button>

                    </div>
                    {/* FORMULÁRIO DE CADASTRO */}
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

                            <div className="campo-cliente campo-cnpj">
                                <label>CNPJ</label>

                                <input
                                    type="text"
                                    value={cnpj}
                                    onChange={handleCnpjChange}
                                    placeholder="00.000.000/0000-00"
                                    maxLength={18}
                                />

                                <small>
                                    O CNPJ será validado antes de salvar
                                </small>
                            </div>

                            <div className="campo-cliente">
                                <label>Status</label>

                                <div className="select-com-seta">
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="" disabled hidden>
                                            EX: Ativo
                                        </option>

                                        <option value="Ativo">Ativo</option>
                                        <option value="Inativo">Inativo</option>
                                    </select>

                                    <img src={ExpandirCinza} alt="" />
                                </div>
                            </div>

                            <div className="campo-cliente campo-razao-social">
                                <label>Razão Social</label>

                                <input
                                    type="text"
                                    value={razaoSocial}
                                    onChange={(e) =>
                                        setRazaoSocial(e.target.value)
                                    }
                                    placeholder="Empresa exemplo Ltda."
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
                                >
                                    Validar CNPJ
                                </button>

                            </div>

                            <div className="botoes-formulario-cliente">

                                <button
                                    type="submit"
                                    className="botao-salvar-cliente"
                                >
                                    {idEditando
                                        ? "Atualizar cliente"
                                        : "Salvar cliente"}
                                </button>

                                <button
                                    type="button"
                                    className="botao-cancelar-cliente"
                                    onClick={limparFormulario}
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

                    {/* CARDS PARA MOBILE */}
                    <div className="clientes-cards-mobile">

                        {clientesExibidos.length > 0 ? (
                            clientesExibidos.map((cliente) => {
                                const cnpjValido = validarCNPJ(cliente.cnpj);

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
                                                className={`validacao-card ${cnpjValido
                                                        ? "cnpj-valido"
                                                        : "cnpj-invalido"
                                                    }`}
                                            >
                                                {cnpjValido
                                                    ? "CNPJ válido"
                                                    : "CNPJ inválido"}
                                            </span>

                                        </div>

                                        <div className="acoes-card-cliente">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    editarCliente(cliente)
                                                }
                                                title="Editar cliente"
                                            >
                                                <img
                                                    src={EditarQuadrado}
                                                    alt="Editar"
                                                />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    excluirCliente(cliente.id)
                                                }
                                                title="Excluir cliente"
                                            >
                                                <img
                                                    src={Lixeira}
                                                    alt="Excluir"
                                                />
                                            </button>

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

                    {/* TABELA PARA DESKTOP */}
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
                                {clientesExibidos.length > 0 ? (
                                    clientesExibidos.map((cliente) => (
                                        <tr key={cliente.id}>

                                            <td>{cliente.razaoSocial}</td>
                                            <td>{cliente.cnpj}</td>
                                            <td>{cliente.vinculo}</td>

                                            <td>
                                                <span
                                                    className={`status-cliente ${cliente.status === "Ativo"
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
                                                        title="Editar cliente"
                                                    >
                                                        <img
                                                            src={EditarQuadrado}
                                                            alt="Editar"
                                                        />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            excluirCliente(cliente.id)
                                                        }
                                                        title="Excluir cliente"
                                                    >
                                                        <img
                                                            src={Lixeira}
                                                            alt="Excluir"
                                                        />
                                                    </button>

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
                                    paginaAtual === pagina
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

/* MENU LATERAL */
function Sidebar() {
    const navigate = useNavigate();

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

                <Link to="/notas-fiscais" className="item-menu-clientes">
                    <img src={DoisDocumentosBranco} alt="" />
                    <span>Notas Fiscais</span>
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
                onClick={() => navigate("/login")}
            >
                <img src={SairBranco} alt="" />
                <span>Sair</span>
            </button>

        </aside>
    );
}

export default GerenciarClientes;
