
import { useState } from "react";
import "./cadastro.css";

import PerfilLaranja from "../../assets/Icones/PerfilLaranja.png"
import logoIntegra from "../../assets/Icones/LogoNome.png";
import iconeEscudo from "../../assets/Icones/EscudoLaranja.png";
import iconeDocumento from "../../assets/Icones/documentoLaranja.png";
import iconeGrupo from "../../assets/Icones/GrupoPessoasLaranja.png";

export default function Cadastro() {
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

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
    };

    const handleCadastrar = (e) => {
        e.preventDefault();

        if (Object.values(dados).some((valor) => !valor.trim())) {
            alert("Preencha todos os campos para continuar.");
            return;
        }

        if (dados.senha !== dados.confirmarSenha) {
            alert("As senhas não coincidem.");
            return;
        }

        alert("Dados preenchidos! A integração com o cadastro da API ainda precisa ser configurada.");
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
                            <p>Documentos, XMLs, notas fiscais e conteúdos tributários</p>
                        </div>
                    </div>

                    <div className="cadastro-vantagem">
                        <div className="cadastro-icone">
                            <img src={iconeEscudo} alt="" />
                        </div>

                        <div>
                            <h3>Agilidade no seu dia a dia</h3>
                            <p>Encontre o que precisa de forma rápida e prática</p>
                        </div>
                    </div>

                    <div className="cadastro-vantagem">
                        <div className="cadastro-icone">
                            <img src={iconeGrupo} alt="" />
                        </div>

                        <div>
                            <h3>Atendimento eficiente</h3>
                            <p>Informações organizadas e atualizadas para você e seus clientes</p>
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
                             <img src={PerfilLaranja} alt="Ícone de perfil" />
                        </div>

                        <div>
                            <h2>Cadastro</h2>
                            <p>
                                Preencha todos os dados para criar sua conta no
                                Portal Tributário
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleCadastrar}>
                        <div className="cadastro-secao">
                            <div className="cadastro-titulo-secao">
                                <span className="cadastro-mini-icone">♟</span>
                                <h3>Dados pessoais</h3>
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
                                            onClick={() => setMostrarSenha(!mostrarSenha)}
                                            aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                                        >
                                            {mostrarSenha ? "Ocultar" : "Ver"}
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
                                            type={mostrarConfirmacao ? "text" : "password"}
                                            value={dados.confirmarSenha}
                                            onChange={atualizarCampo}
                                            placeholder="Confirme sua senha"
                                            autoComplete="new-password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setMostrarConfirmacao(!mostrarConfirmacao)
                                            }
                                            aria-label={
                                                mostrarConfirmacao
                                                    ? "Ocultar confirmação"
                                                    : "Mostrar confirmação"
                                            }
                                        >
                                            {mostrarConfirmacao ? "Ocultar" : "Ver"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="cadastro-secao cadastro-secao-empresa">
                            <div className="cadastro-titulo-secao">
                                <span className="cadastro-mini-icone">▤</span>
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
                                        placeholder="00.000.000/0001-00"
                                        inputMode="numeric"
                                        required
                                    />
                                </div>

                                <div className="cadastro-campo">
                                    <label htmlFor="razaoSocial">Razão social *</label>
                                    <input
                                        id="razaoSocial"
                                        name="razaoSocial"
                                        value={dados.razaoSocial}
                                        onChange={atualizarCampo}
                                        placeholder="Digite a razão social"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="cadastro-botao-submit">
                            <span>♙</span> Cadastrar
                        </button>
                    </form>
                </div>
            </section>
        </main>
    );
}
