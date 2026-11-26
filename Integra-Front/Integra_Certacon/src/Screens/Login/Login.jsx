import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./Login.css";

import { realizarLogin } from "../../services/api";

import logoIntegra from "../../assets/Icones/LogoNome.png";
import iconeEscudo from "../../assets/Icones/EscudoLaranja.png";
import iconeDocumento from "../../assets/Icones/documentoLaranja.png";
import iconeGrupo from "../../assets/Icones/GrupoPessoasLaranja.png";

import LogoMobile from "../../assets/Icones/LogoMobile.png";
import EmailCinza from "../../assets/Icones/EmailCinza.png";
import ChaveSenha from "../../assets/Icones/ChaveSenha.png";
import ConsultarNFEmobile from "../../assets/Icones/ConsultarNFEmobile.png";

function Login() {

    const navigate = useNavigate();

    // =====================================
    // ESTADOS
    // =====================================

    const [cnpj, setCnpj] = useState("");
    const [senha, setSenha] = useState("");

    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(false);

    // =====================================
    // REALIZAR LOGIN
    // =====================================

    async function entrar(event) {

        event.preventDefault();

        setErro("");

        if (!cnpj.trim() || !senha.trim()) {

            setErro(
                "Informe seu e-mail ou CNPJ e sua senha."
            );

            return;

        }

        try {

            setCarregando(true);

            const dados = await realizarLogin(
                cnpj,
                senha
            );

            localStorage.setItem(
                "token",
                dados.token
            );

            localStorage.setItem(
                "usuario",
                JSON.stringify({
                    usuarioId: dados.usuarioId,
                    nome: dados.nome,
                    email: dados.email,
                    perfis: dados.perfis
                })
            );

            localStorage.setItem(
                "perfis",
                JSON.stringify(dados.perfis)
            );

            navigate("/home");

        } catch (error) {

            console.error(
                "Erro ao realizar login:",
                error
            );

            setErro(
                error.message ||
                "Não foi possível conectar ao servidor."
            );

        } finally {

            setCarregando(false);

        }

    }

    // =====================================
    // RECUPERAR SENHA
    // =====================================

    function recuperarSenha() {

        navigate("/esqueci-senha");

    }

    // =====================================
    // CRIAR CONTA
    // =====================================

    function criarConta() {

        navigate("/cadastro");

    }

    // =====================================
    // RENDERIZAÇÃO
    // =====================================

    return (

        <main className="login">

            {/* =================================
                LADO ESQUERDO - PAINEL ANIMADO
            ================================= */}

            <section className="login-apresentacao login-ambient">

                {/* =================================
                    FUNDO ANIMADO - AMBIENT WAVES
                ================================= */}

                <div
                    className="login-fundo-animado"
                    aria-hidden="true"
                >

                    {/* ILUMINAÇÃO AMBIENTE */}

                    <div className="login-luz-ambiente" />

                    {/* PRIMEIRA ONDA */}

                    <div className="login-onda login-onda-1" />

                    {/* SEGUNDA ONDA */}

                    <div className="login-onda login-onda-2" />

                    {/* TERCEIRA ONDA */}

                    <div className="login-onda login-onda-3" />

                    {/* QUARTA ONDA */}

                    <div className="login-onda login-onda-4" />

                    {/* TEXTURA TECNOLÓGICA */}

                    <div className="login-grade-tecnologica" />

                </div>

                {/* =================================
                    LOGOTIPO
                ================================= */}

                <div className="marca-integra">

                    <img
                        src={logoIntegra}
                        alt="Integra"
                        className="logo-integra"
                    />

                </div>

                {/* =================================
                    TEXTO DE APRESENTAÇÃO
                ================================= */}

                <div className="texto-apresentacao">

                    <h1>

                        Bem Vindo(a) ao

                        <span>
                            Integra 2026
                        </span>

                    </h1>

                    <p>

                        Acesse o sistema e tenha em mãos os
                        conteúdos tributários, notas fiscais e todas
                        as informações que você precisa, de forma
                        segura e organizada.

                    </p>

                </div>

                {/* =================================
                    VANTAGENS DO SISTEMA
                ================================= */}

                <div className="vantagens">

                    {/* CONTEÚDO CONFIÁVEL */}

                    <div className="vantagem">

                        <img
                            src={iconeEscudo}
                            alt=""
                        />

                        <span>

                            Conteúdo

                            <br />

                            confiável

                        </span>

                    </div>

                    {/* INFORMAÇÃO ATUALIZADA */}

                    <div className="vantagem">

                        <img
                            src={iconeDocumento}
                            alt=""
                        />

                        <span>

                            Informação

                            <br />

                            atualizada

                        </span>

                    </div>

                    {/* ACESSO POR PERFIL */}

                    <div className="vantagem">

                        <img
                            src={iconeGrupo}
                            alt=""
                        />

                        <span>

                            Acesso

                            <br />

                            por perfil

                        </span>

                    </div>

                </div>

            </section>

            {/* =================================
                LADO DIREITO - FORMULÁRIO
            ================================= */}

            <section className="login-formulario">

                <div className="formulario-conteudo">

                    {/* LOGO MOBILE */}

                    <div className="marca-mobile">

                        <img
                            src={LogoMobile}
                            alt="Integra"
                            className="logo-mobile"
                        />

                    </div>

                    {/* CABEÇALHO */}

                    <header className="formulario-cabecalho">

                        <h2>
                            Acesse sua conta
                        </h2>

                        <p>
                            Digite suas credenciais para continuar
                        </p>

                    </header>

                    {/* =================================
                        FORMULÁRIO DE LOGIN
                    ================================= */}

                    <form onSubmit={entrar}>

                        {/* IDENTIFICADOR */}

                        <div className="campo">

                            <label htmlFor="cnpj">

                                Identificador: Email/CNPJ

                            </label>

                            <div className="campo-input">

                                <img
                                    src={EmailCinza}
                                    alt=""
                                    className="campo-icone"
                                />

                                <input
                                    id="cnpj"
                                    type="text"
                                    placeholder="Digite o identificador"
                                    value={cnpj}
                                    onChange={event =>
                                        setCnpj(event.target.value)
                                    }
                                    autoComplete="username"
                                    required
                                />

                            </div>

                        </div>

                        {/* SENHA */}

                        <div className="campo campo-senha">

                            <label htmlFor="senha">
                                Senha *
                            </label>

                            <div className="campo-input">

                                <img
                                    src={ChaveSenha}
                                    alt=""
                                    className="campo-icone"
                                />

                                <input
                                    id="senha"
                                    type="password"
                                    placeholder="Digite a senha"
                                    value={senha}
                                    onChange={event =>
                                        setSenha(event.target.value)
                                    }
                                    autoComplete="current-password"
                                    required
                                />

                            </div>

                            {/* RECUPERAÇÃO DE SENHA */}

                            <button
                                type="button"
                                className="link-recuperar"
                                onClick={recuperarSenha}
                            >

                                Esqueceu sua senha?

                            </button>

                        </div>

                        {/* MENSAGEM DE ERRO */}

                        {erro && (

                            <p
                                className="login-erro"
                                role="alert"
                            >

                                {erro}

                            </p>

                        )}

                        {/* BOTÃO ENTRAR */}

                        <button
                            type="submit"
                            className="botao-entrar"
                            disabled={carregando}
                        >

                            {carregando
                                ? "Entrando..."
                                : "Entrar"
                            }

                        </button>

                    </form>

                    {/* =================================
                        DIVISOR
                    ================================= */}

                    <div className="divisor">

                        <span />

                        <small>ou</small>

                        <span />

                    </div>

                    {/* =================================
                        CRIAR CONTA
                    ================================= */}

                    <button
                        type="button"
                        className="link-criar-conta"
                        onClick={criarConta}
                    >

                        Criar uma conta

                    </button>

                    {/* =================================
                        CONSULTA NF-E SEM LOGIN
                    ================================= */}

                    <Link
                        to="/consultar-chave"
                        className="link-consultar-nfe"
                    >

                        <img
                            src={ConsultarNFEmobile}
                            alt=""
                        />

                        Consultar NF-e sem login

                    </Link>

                    {/* =================================
                        PORTAL PÚBLICO
                    ================================= */}

                    <Link
                        to="/portal"
                        className="link-consultar-nfe"
                    >

                        Explorar conteúdos públicos

                    </Link>

                </div>

            </section>

        </main>

    );

}

export default Login;