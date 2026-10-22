
import { useState } from "react";
import "./Login.css";

import logoIntegra from "../../assets/Icones/LogoNome.png";
import iconeEscudo from "../../assets/Icones/EscudoLaranja.png";
import iconeDocumento from "../../assets/Icones/documentoLaranja.png";
import iconeGrupo from "../../assets/Icones/GrupoPessoasLaranja.png";

function Login() {
    const [cnpj, setCnpj] = useState("");
    const [senha, setSenha] = useState("");

    function entrar(event) {
        event.preventDefault();

        if (!cnpj.trim() || !senha.trim()) {
            alert("Preencha o CNPJ e a senha para continuar.");
            return;
        }

        alert("Login preenchido! A autenticação será conectada à API.");
    }

    function recuperarSenha() {
        alert("A recuperação de senha estará disponível em breve.");
    }

    function criarConta() {
        alert("A criação de conta estará disponível em breve.");
    }

    return (
        <main className="login">
            <section className="login-apresentacao">
                <div className="marca-integra">
                    <img
                        src={logoIntegra}
                        alt="Integra"
                        className="logo-integra"
                    />
                </div>

                <div className="texto-apresentacao">
                    <h1>
                        Bem-vindo(a) ao
                        <span>Integra 2026</span>
                    </h1>

                    <p>
                        Acesse o sistema e tenha em mãos os conteúdos
                        tributários, notas fiscais e todas as informações
                        que você precisa, de forma segura e organizada.
                    </p>
                </div>

                <div className="vantagens">
                    <div className="vantagem">
                        <img src={iconeEscudo} alt="" />
                        <span>
                            Conteúdo
                            <br />
                            confiável
                        </span>
                    </div>

                    <div className="vantagem">
                        <img src={iconeDocumento} alt="" />
                        <span>
                            Informação
                            <br />
                            atualizada
                        </span>
                    </div>

                    <div className="vantagem">
                        <img src={iconeGrupo} alt="" />
                        <span>
                            Acesso
                            <br />
                            por perfil
                        </span>
                    </div>
                </div>
            </section>

            <section className="login-formulario">
                <div className="formulario-conteudo">
                    <header className="formulario-cabecalho">
                        <h2>Acesse sua conta</h2>
                        <p>Digite suas credenciais para continuar</p>
                    </header>

                    <form onSubmit={entrar}>
                        <div className="campo">
                            <label htmlFor="cnpj">CNPJ *</label>

                            <input
                                id="cnpj"
                                type="text"
                                placeholder="Digite o CNPJ"
                                value={cnpj}
                                onChange={(event) =>
                                    setCnpj(event.target.value)
                                }
                                autoComplete="username"
                            />
                        </div>

                        <div className="campo campo-senha">
                            <label htmlFor="senha">Senha *</label>

                            <input
                                id="senha"
                                type="password"
                                placeholder="Digite a senha"
                                value={senha}
                                onChange={(event) =>
                                    setSenha(event.target.value)
                                }
                                autoComplete="current-password"
                            />

                            <button
                                type="button"
                                className="link-recuperar"
                                onClick={recuperarSenha}
                            >
                                Esqueceu sua senha?
                            </button>
                        </div>

                        <button
                            type="submit"
                            className="botao-entrar"
                        >
                            Entrar
                        </button>
                    </form>

                    <div className="divisor">
                        <span></span>
                        <small>ou</small>
                        <span></span>
                    </div>

                    <button
                        type="button"
                        className="link-criar-conta"
                        onClick={criarConta}
                    >
                        Criar uma conta
                    </button>
                </div>
            </section>
        </main>
    );
}

export default Login;
