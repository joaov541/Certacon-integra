import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { LayoutRecuperacao } from "../EsqueciSenha/EsqueciSenha";

import {
    validarTokenRecuperacao,
    redefinirSenha
} from "../../services/api";

import ChaveSenha from "../../assets/Icones/ChaveSenha.png";
import OlhoAberto from "../../assets/Icones/OlhoAberto.png";
import OlhoFechado from "../../assets/Icones/olhoFechado.png";

import "./RedefinirSenha.css";

function RedefinirSenha() {

    const [token] = useState(() => {

        const parametros = new URLSearchParams(
            window.location.hash.substring(1)
        );

        return parametros.get("token") || "";

    });

    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");

    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

    const [validando, setValidando] = useState(true);
    const [tokenValido, setTokenValido] = useState(false);

    const [carregando, setCarregando] = useState(false);
    const [concluido, setConcluido] = useState(false);
    const [erro, setErro] = useState("");

    const tamanhoValido =
        novaSenha.length >= 8 &&
        novaSenha.length <= 128 &&
        novaSenha.trim().length > 0;

    const senhasCoincidem =
        confirmarSenha.length > 0 &&
        novaSenha === confirmarSenha;

    // =====================================
    // VALIDAR TOKEN
    // =====================================

    useEffect(() => {

        const controller = new AbortController();

        async function validar() {

            if (!/^[a-fA-F0-9]{64}$/.test(token)) {

                setErro("O link de recuperação é inválido.");
                setValidando(false);

                return;
            }

            try {

                setValidando(true);
                setErro("");

                const dados = await validarTokenRecuperacao(
                    token,
                    controller.signal
                );

                setTokenValido(dados?.valido === true);

                if (dados?.valido !== true) {
                    setErro("O link de recuperação é inválido.");
                }

            } catch (error) {

                if (controller.signal.aborted) return;

                setTokenValido(false);

                setErro(
                    error.message ||
                    "Não foi possível validar o link."
                );

            } finally {

                if (!controller.signal.aborted) {
                    setValidando(false);
                }

            }

        }

        validar();

        return () => controller.abort();

    }, [token]);

    // =====================================
    // REDEFINIR SENHA
    // =====================================

    async function salvar(event) {

        event.preventDefault();

        if (carregando || !tokenValido) return;

        setErro("");

        if (!tamanhoValido) {

            setErro(
                "A senha deve possuir entre 8 e 128 caracteres."
            );

            return;
        }

        if (!senhasCoincidem) {

            setErro("As senhas informadas não coincidem.");

            return;
        }

        try {

            setCarregando(true);

            await redefinirSenha(
                token,
                novaSenha,
                confirmarSenha
            );

            setNovaSenha("");
            setConfirmarSenha("");

            setMostrarSenha(false);
            setMostrarConfirmacao(false);

            setTokenValido(false);

            // Remove o token da barra de endereço.

            window.history.replaceState(
                window.history.state,
                "",
                window.location.pathname +
                window.location.search
            );

            setConcluido(true);

        } catch (error) {

            setErro(
                error.message ||
                "Não foi possível redefinir sua senha."
            );

        } finally {

            setCarregando(false);

        }

    }

    return (

        <LayoutRecuperacao
            titulo={
                concluido
                    ? "Senha redefinida!"
                    : "Redefinir senha"
            }
            descricao={
                concluido
                    ? "O acesso à sua conta foi recuperado."
                    : "Crie uma nova senha para acessar sua conta com segurança."
            }
        >

            {/* VALIDANDO TOKEN */}

            {validando && (

                <div
                    className="recuperacao-validando"
                    role="status"
                >

                    <div className="recuperacao-spinner" />

                    <p>Validando link de recuperação...</p>

                </div>

            )}

            {/* TOKEN INVÁLIDO */}

            {!validando && !tokenValido && !concluido && (

                <div className="recuperacao-confirmacao">

                    <div className="recuperacao-alerta-icone">
                        !
                    </div>

                    <h3>Link indisponível</h3>

                    <p>
                        {erro ||
                            "O link expirou ou já foi utilizado."}
                    </p>

                    <p>
                        Solicite um novo link de recuperação
                        para continuar.
                    </p>

                    <Link
                        to="/esqueci-senha"
                        className="recuperacao-botao-secundario"
                    >
                        Solicitar novo link
                    </Link>

                </div>

            )}

            {/* FORMULÁRIO */}

            {!validando && tokenValido && !concluido && (

                <form onSubmit={salvar}>

                    {/* NOVA SENHA */}

                    <div className="campo">

                        <label htmlFor="nova-senha">
                            Nova senha
                        </label>

                        <div className="campo-input campo-senha-rec">

                            <img
                                src={ChaveSenha}
                                alt=""
                                className="campo-icone"
                            />

                            <input
                                id="nova-senha"
                                type={
                                    mostrarSenha
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Digite a nova senha"
                                value={novaSenha}
                                onChange={event =>
                                    setNovaSenha(event.target.value)
                                }
                                autoComplete="new-password"
                                minLength={8}
                                maxLength={128}
                                disabled={carregando}
                                required
                            />

                            <button
                                type="button"
                                className="recuperacao-olho"
                                aria-label={
                                    mostrarSenha
                                        ? "Ocultar nova senha"
                                        : "Mostrar nova senha"
                                }
                                aria-pressed={mostrarSenha}
                                onClick={() =>
                                    setMostrarSenha(valor => !valor)
                                }
                            >

                                <img
                                    src={
                                        mostrarSenha
                                            ? OlhoAberto
                                            : OlhoFechado
                                    }
                                    alt=""
                                />

                            </button>

                        </div>

                    </div>

                    {/* CONFIRMAR SENHA */}

                    <div className="campo">

                        <label htmlFor="confirmar-senha">
                            Confirmar nova senha
                        </label>

                        <div className="campo-input campo-senha-rec">

                            <img
                                src={ChaveSenha}
                                alt=""
                                className="campo-icone"
                            />

                            <input
                                id="confirmar-senha"
                                type={
                                    mostrarConfirmacao
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Confirme sua nova senha"
                                value={confirmarSenha}
                                onChange={event =>
                                    setConfirmarSenha(event.target.value)
                                }
                                autoComplete="new-password"
                                minLength={8}
                                maxLength={128}
                                disabled={carregando}
                                required
                            />

                            <button
                                type="button"
                                className="recuperacao-olho"
                                aria-label={
                                    mostrarConfirmacao
                                        ? "Ocultar confirmação"
                                        : "Mostrar confirmação"
                                }
                                aria-pressed={mostrarConfirmacao}
                                onClick={() =>
                                    setMostrarConfirmacao(valor => !valor)
                                }
                            >

                                <img
                                    src={
                                        mostrarConfirmacao
                                            ? OlhoAberto
                                            : OlhoFechado
                                    }
                                    alt=""
                                />

                            </button>

                        </div>

                    </div>

                    {/* REQUISITOS DA SENHA */}

                    <div className="recuperacao-requisitos">

                        <p
                            className={
                                tamanhoValido ? "valido" : ""
                            }
                        >
                            <span>
                                {tamanhoValido ? "✓" : "○"}
                            </span>

                            Entre 8 e 128 caracteres
                        </p>

                        <p
                            className={
                                senhasCoincidem ? "valido" : ""
                            }
                        >
                            <span>
                                {senhasCoincidem ? "✓" : "○"}
                            </span>

                            As senhas devem coincidir
                        </p>

                    </div>

                    {/* ERRO */}

                    {erro && (

                        <div
                            className="recuperacao-mensagem erro"
                            role="alert"
                        >
                            {erro}
                        </div>

                    )}

                    {/* SALVAR */}

                    <button
                        type="submit"
                        className="botao-entrar"
                        disabled={
                            carregando ||
                            !tamanhoValido ||
                            !senhasCoincidem
                        }
                    >
                        {carregando
                            ? "Redefinindo..."
                            : "Redefinir minha senha"}
                    </button>

                </form>

            )}

            {/* SUCESSO */}

            {concluido && (

                <div className="recuperacao-confirmacao">

                    <div className="recuperacao-check">
                        ✓
                    </div>

                    <h3>Senha alterada com sucesso!</h3>

                    <p>
                        Sua nova senha já está cadastrada.
                        Você pode acessar novamente sua conta
                        no IntegraCertacon.
                    </p>

                    <Link
                        to="/login"
                        className="recuperacao-botao-secundario"
                    >
                        Acessar minha conta
                    </Link>

                </div>

            )}

        </LayoutRecuperacao>

    );

}

export default RedefinirSenha;