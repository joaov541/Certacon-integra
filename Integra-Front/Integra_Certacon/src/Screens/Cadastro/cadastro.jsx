
import { useState } from "react";
import "./cadastro.css";

import PerfilLaranja from "../../assets/Icones/PerfilLaranja.png";
import logoIntegra from "../../assets/Icones/LogoNome.png";
import iconeEscudo from "../../assets/Icones/EscudoLaranja.png";
import iconeDocumento from "../../assets/Icones/documentoLaranja.png";
import iconeGrupo from "../../assets/Icones/GrupoPessoasLaranja.png";
import iconeDadosPessoais from "../../assets/Icones/Component 3.png";
import cidadeLaranja from "../../assets/Icones/cidadeLaranja.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import olhoAberto from "../../assets/Icones/OlhoAberto.png";
import olhoFechado from "../../assets/Icones/olhoFechado.png";

export default function Cadastro() {
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
    const [verificandoCnpj, setVerificandoCnpj] = useState(false);
    const [cnpjVerificado, setCnpjVerificado] = useState(false);

    const [dados, setDados] = useState({
        nome: "",
        email: "",
        telefone: "",
        senha: "",
        confirmarSenha: "",
        cnpj: "",
        razaoSocial: "",
    });

    const atualizarCampo = (e) => {
        const { name, value } = e.target;

        setDados((anterior) => ({
            ...anterior,
            [name]: value,
        }));

        if (name === "cnpj") {
            setCnpjVerificado(false);

            setDados((anterior) => ({
                ...anterior,
                cnpj: value,
                razaoSocial: "",
            }));
        }
    };

    const verificarCnpj = async () => {
        const cnpjLimpo = dados.cnpj
            .trim()
            .replace(/[^a-zA-Z0-9]/g, "")
            .toUpperCase();

        if (cnpjLimpo.length !== 14) {
            alert("Digite um CNPJ com 14 caracteres.");
            return;
        }

        setVerificandoCnpj(true);
        setCnpjVerificado(false);

        try {
            const resposta = await fetch(
                `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`
            );

            if (!resposta.ok) {
                throw new Error("Não foi possível consultar este CNPJ.");
            }

            const empresa = await resposta.json();

            if (!empresa.razao_social) {
                throw new Error(
                    "A consulta não retornou a razão social da empresa."
                );
            }

            setDados((anterior) => ({
                ...anterior,
                razaoSocial: empresa.razao_social,
            }));

            setCnpjVerificado(true);

            alert("CNPJ consultado com sucesso!");
        } catch (erro) {
            alert(
                "Não foi possível verificar esse CNPJ. Confira os dados e tente novamente. Se o CNPJ for alfanumérico, o serviço de consulta pode ainda não oferecer suporte a esse formato."
            );

            setDados((anterior) => ({
                ...anterior,
                razaoSocial: "",
            }));
        } finally {
            setVerificandoCnpj(false);
        }
    };

    const handleCadastrar = (e) => {
        e.preventDefault();

        const camposObrigatorios = { ...dados };
        delete camposObrigatorios.razaoSocial;

        if (
            Object.values(camposObrigatorios).some(
                (valor) => !valor.trim()
            )
        ) {
            alert("Preencha todos os campos para continuar.");
            return;
        }

        if (dados.senha !== dados.confirmarSenha) {
            alert("As senhas não coincidem.");
            return;
        }

        if (!cnpjVerificado || !dados.razaoSocial) {
            alert("Verifique o CNPJ antes de cadastrar.");
            return;
        }

        alert(
            "Dados preenchidos! A integração do cadastro com a API do sistema ainda precisa ser configurada."
        );
    };

    return (
        <main className="cadastro">
            <aside className="cadastro-apresentacao">
                <div className="cadastro-marca">
                    <img
                        src={logoIntegra}
                        alt="Portal Tributário"
                        className="cadastro-logo"
                    />
                </div>

                <div className="cadastro-texto">
                    <h1>
                        Organização e segurança
                        <br />
                        para suas informações
                        <br />
                        <span>tributárias</span>
                    </h1>
                </div>

                <div className="cadastro-vantagens">
                    <div className="cadastro-vantagem">
                        <div className="cadastro-icone">
                            <img src={iconeEscudo} alt="" />
                        </div>
                        <div>
                            <h3>Mais segurança</h3>
                            <p>Controle de acesso por perfil e CNPJ</p>
                        </div>
                    </div>

                    <div className="cadastro-vantagem">
                        <div className="cadastro-icone">
                            <img src={iconeDocumento} alt="" />
                        </div>
                        <div>
                            <h3>Tudo em um só lugar</h3>
                            <p>
                                Documentos, XMLs, notas fiscais e conteúdos
                                tributários
                            </p>
                        </div>
                    </div>

                    <div className="cadastro-vantagem">
                        <div className="cadastro-icone">
                            <img src={iconeEscudo} alt="" />
                        </div>
                        <div>
                            <h3>Agilidade no seu dia a dia</h3>
                            <p>
                                Encontre o que precisa de forma rápida e prática
                            </p>
                        </div>
                    </div>

                    <div className="cadastro-vantagem">
                        <div className="cadastro-icone">
                            <img src={iconeGrupo} alt="" />
                        </div>
                        <div>
                            <h3>Atendimento eficiente</h3>
                            <p>
                                Informações organizadas e atualizadas para você
                                e seus clientes
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            <section className="cadastro-area">
                <header className="cadastro-topo">
                    <span>Já tem uma conta?</span>

                    <button
                        type="button"
                        className="cadastro-botao-entrar"
                        onClick={() => window.history.back()}
                    >
                        Entrar
                    </button>
                </header>

                <div className="cadastro-cartao">
                    <div className="cadastro-cabecalho">
                        <div className="cadastro-avatar">
                            <img
                                src={PerfilLaranja}
                                alt="Ícone de perfil"
                            />
                        </div>

                        <div>
                            <h2>Criar sua conta</h2>
                            <p>
                                Preencha todos os dados para criar sua conta no
                                Portal Tributário
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleCadastrar}>
                        <div className="cadastro-secao">
                            <div className="cadastro-titulo-secao">
                                <img
                                    src={iconeDadosPessoais}
                                    alt=""
                                    className="cadastro-mini-icone"
                                />
                                <h3>Dados pessoais</h3>
                            </div>
                        </div>

                        <div className="cadastro-grade">
                            <div className="cadastro-campo">
                                <label htmlFor="nome">Nome Completo *</label>
                                <input
                                    id="nome"
                                    name="nome"
                                    value={dados.nome}
                                    onChange={atualizarCampo}
                                    placeholder="Digite seu nome completo"
                                    autoComplete="name"
                                    required
                                />
                            </div>

                            <div className="cadastro-campo">
                                <label htmlFor="email">E-mail *</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={dados.email}
                                    onChange={atualizarCampo}
                                    placeholder="exemplo@dominio.com"
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <div className="cadastro-campo">
                                <label htmlFor="telefone">Telefone *</label>
                                <input
                                    id="telefone"
                                    name="telefone"
                                    type="tel"
                                    value={dados.telefone}
                                    onChange={atualizarCampo}
                                    placeholder="(11) 91234-5678"
                                    autoComplete="tel"
                                    required
                                />
                            </div>

                            <div className="cadastro-campo">
                                <label htmlFor="senha">Senha *</label>
                                <div className="cadastro-input-senha">
                                    <input
                                        id="senha"
                                        name="senha"
                                        type={mostrarSenha ? "text" : "password"}
                                        value={dados.senha}
                                        onChange={atualizarCampo}
                                        placeholder="Digite sua senha"
                                        autoComplete="new-password"
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="cadastro-olho-senha"
                                        onClick={() =>
                                            setMostrarSenha(!mostrarSenha)
                                        }
                                        aria-label={
                                            mostrarSenha
                                                ? "Ocultar senha"
                                                : "Mostrar senha"
                                        }
                                    >
                                        <img
                                            src={
                                                mostrarSenha
                                                    ? olhoAberto
                                                    : olhoFechado
                                            }
                                            alt=""
                                        />
                                    </button>
                                </div>
                            </div>

                            <div className="cadastro-campo cadastro-campo-largo">
                                <label htmlFor="confirmarSenha">
                                    Confirmar senha *
                                </label>
                                <div className="cadastro-input-senha">
                                    <input
                                        id="confirmarSenha"
                                        name="confirmarSenha"
                                        type={
                                            mostrarConfirmacao
                                                ? "text"
                                                : "password"
                                        }
                                        value={dados.confirmarSenha}
                                        onChange={atualizarCampo}
                                        placeholder="Confirme sua senha"
                                        autoComplete="new-password"
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="cadastro-olho-senha"
                                        onClick={() =>
                                            setMostrarConfirmacao(
                                                !mostrarConfirmacao
                                            )
                                        }
                                        aria-label={
                                            mostrarConfirmacao
                                                ? "Ocultar confirmação"
                                                : "Mostrar confirmação"
                                        }
                                    >
                                        <img
                                            src={
                                                mostrarConfirmacao
                                                    ? olhoAberto
                                                    : olhoFechado
                                            }
                                            alt=""
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="cadastro-secao cadastro-secao-empresa">
                            <div className="cadastro-titulo-secao">
                                <span className="cadastro-mini-icone">
                                    <img src={cidadeLaranja} alt="" />
                                </span>
                                <h3>Dados da empresa</h3>
                            </div>

                            <div className="cadastro-grade">
                                <div className="cadastro-campo">
                                    <label htmlFor="cnpj">CNPJ *</label>
                                    <input
                                        id="cnpj"
                                        name="cnpj"
                                        value={dados.cnpj}
                                        onChange={atualizarCampo}
                                        placeholder="Digite o CNPJ da empresa"
                                        autoComplete="off"
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="cadastro-botao-verificar"
                                        onClick={verificarCnpj}
                                        disabled={verificandoCnpj}
                                    >
                                        {verificandoCnpj
                                            ? "Verificando..."
                                            : "Verificar CNPJ"}
                                    </button>

                                    {cnpjVerificado && (
                                        <p className="cadastro-cnpj-sucesso">
                                            CNPJ consultado com sucesso!
                                        </p>
                                    )}
                                </div>

                                <div className="cadastro-campo">
                                    <label htmlFor="razaoSocial">
                                        Razão social *
                                    </label>
                                    <input
                                        id="razaoSocial"
                                        name="razaoSocial"
                                        value={dados.razaoSocial}
                                        placeholder="Preenchida após verificar o CNPJ"
                                        readOnly
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="cadastro-botao-submit"
                        >
                            <img src={ADDProfileBranco} alt="" />
                            Cadastrar
                        </button>
                    </form>
                </div>
            </section>
        </main>
    );
}
