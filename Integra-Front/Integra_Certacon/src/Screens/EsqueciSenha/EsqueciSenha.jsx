import { useState } from "react";
import { Link } from "react-router-dom";

import "../Login/Login.css";
import "./EsqueciSenha.css";

import { solicitarRecuperacaoSenha } from "../../services/api";

import logoIntegra from "../../assets/Icones/LogoNome.png";
import LogoMobile from "../../assets/Icones/LogoMobile.png";
import iconeEscudo from "../../assets/Icones/EscudoLaranja.png";
import iconeDocumento from "../../assets/Icones/documentoLaranja.png";
import iconeGrupo from "../../assets/Icones/GrupoPessoasLaranja.png";
import EmailCinza from "../../assets/Icones/EmailCinza.png";
import ChaveSenha from "../../assets/Icones/ChaveSenha.png";

// =========================================
// LAYOUT COMPARTILHADO
// =========================================

export function LayoutRecuperacao({
    titulo,
    descricao,
    children
}) {
    return (
        <main className="login recuperacao-pagina">

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
                        Sua segurança
                        <span>é nossa prioridade</span>
                    </h1>

                    <p>
                        Recupere o acesso à sua conta de forma
                        simples e segura, mantendo suas informações
                        protegidas.
                    </p>

                </div>

                <div className="vantagens">

                    <div className="vantagem">
                        <img src={iconeEscudo} alt="" />
                        <span>Segurança<br />dos dados</span>
                    </div>

                    <div className="vantagem">
                        <img src={iconeDocumento} alt="" />
                        <span>Informações<br />protegidas</span>
                    </div>

                    <div className="vantagem">
                        <img src={iconeGrupo} alt="" />
                        <span>Acesso<br />seguro</span>
                    </div>

                </div>

            </section>

            <section className="login-formulario">

                <div className="formulario-conteudo">

                    <div className="marca-mobile">

                        <img
                            src={LogoMobile}
                            alt="Integra"
                            className="logo-mobile"
                        />

                    </div>

                    <div className="recuperacao-icone">

                        <img src={ChaveSenha} alt="" />

                    </div>

                    <header className="formulario-cabecalho">

                        <h2>{titulo}</h2>

                        <p>{descricao}</p>

                    </header>

                    {children}

                    <Link
                        to="/login"
                        className="recuperacao-voltar"
                    >
                        ← Voltar para o login
                    </Link>

                </div>

            </section>

        </main>
    );
}

// =========================================
// TELA ESQUECI SENHA
// =========================================

function EsqueciSenha() {

    const [email, setEmail] = useState("");
    const [erro, setErro] = useState("");
    const [enviado, setEnviado] = useState(false);
    const [carregando, setCarregando] = useState(false);

    async function enviar(event) {

        event.preventDefault();

        if (carregando) return;

        setErro("");

        if (!email.trim()) {
            setErro("Informe seu e-mail cadastrado.");
            return;
        }

        try {

            setCarregando(true);

            await solicitarRecuperacaoSenha(email);

            setEnviado(true);

        } catch (error) {

            setErro(
                error.message ||
                "Não foi possível enviar a solicitação."
            );

        } finally {

            setCarregando(false);

        }
    }

    return (

        <LayoutRecuperacao
            titulo={
                enviado
                    ? "Confira seu e-mail"
                    : "Esqueceu sua senha?"
            }
            descricao={
                enviado
                    ? "Sua solicitação foi recebida."
                    : "Informe seu e-mail cadastrado para recuperar o acesso à sua conta."
            }
        >

            {!enviado ? (

                <form onSubmit={enviar}>

                    <div className="campo">

                        <label htmlFor="email-recuperacao">
                            E-mail cadastrado
                        </label>

                        <div className="campo-input">

                            <img
                                src={EmailCinza}
                                alt=""
                                className="campo-icone"
                            />

                            <input
                                id="email-recuperacao"
                                type="email"
                                placeholder="Digite seu e-mail"
                                value={email}
                                onChange={event =>
                                    setEmail(event.target.value)
                                }
                                autoComplete="email"
                                maxLength={254}
                                disabled={carregando}
                                required
                            />

                        </div>

                    </div>

                    {erro && (

                        <div
                            className="recuperacao-mensagem erro"
                            role="alert"
                        >
                            {erro}
                        </div>

                    )}

                    <button
                        type="submit"
                        className="botao-entrar"
                        disabled={carregando}
                    >
                        {carregando
                            ? "Enviando..."
                            : "Enviar link de recuperação"}
                    </button>

                    <div className="recuperacao-informacao">

                        O link de recuperação possui validade
                        de 15 minutos e só poderá ser utilizado
                        uma vez.

                    </div>

                </form>

            ) : (

                <div className="recuperacao-confirmacao">

                    <div className="recuperacao-check">
                        ✓
                    </div>

                    <h3>Solicitação recebida!</h3>

                    <p>
                        Se o e-mail informado estiver cadastrado,
                        você receberá as instruções para criar
                        uma nova senha.
                    </p>

                    <div className="recuperacao-email">
                        {email}
                    </div>

                    <p>
                        Verifique sua caixa de entrada e também
                        a pasta de spam ou lixo eletrônico.
                    </p>

                    <button
                        type="button"
                        className="recuperacao-botao-secundario"
                        onClick={() => {
                            setEnviado(false);
                            setErro("");
                        }}
                    >
                        Solicitar novamente
                    </button>

                </div>

            )}

        </LayoutRecuperacao>

    );
}

export default EsqueciSenha;