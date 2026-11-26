import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
    Check,
    CheckCircle2,
    ShieldCheck,
    UserRound,
    Building2,
    LockKeyhole,
    AlertCircle,
    LoaderCircle,
    ArrowRight
} from "lucide-react";

import "./cadastro.css";

import { requisicaoApi } from "../../services/api";

import PerfilLaranja from "../../assets/Icones/PerfilLaranja.png";
import iconeEscudo from "../../assets/Icones/EscudoBranco.png";
import iconeDocumento from "../../assets/Icones/quadroEstatistica.png";
import quadroEnergia from "../../assets/Icones/quadroEnergia.png";
import iconeGrupo from "../../assets/Icones/GrupoBranco.png";
import iconeDadosPessoais from "../../assets/Icones/Component 3.png";
import cidadeLaranja from "../../assets/Icones/cidadeLaranja.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import olhoAberto from "../../assets/Icones/OlhoAberto.png";
import olhoFechado from "../../assets/Icones/olhoFechado.png";
import TelefoneCinza from "../../assets/Icones/TelefoneCinza.png";
import PessoaCinza from "../../assets/Icones/PessoaCinza.png";
import EmailCinza from "../../assets/Icones/EmailCinza.png";
import CadeadoCinza from "../../assets/Icones/CadeadoCinza.png";
import prime_book from "../../assets/Icones/prime_book.png";

// =========================================
// FUNÇÕES AUXILIARES
// =========================================

function normalizarCnpj(valor) {

    return valor
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase();

}

function formatarCnpj(valor) {

    let cnpj = normalizarCnpj(valor);

    cnpj =
        cnpj.slice(0, 12) +
        cnpj.slice(12).replace(/\D/g, "").slice(0, 2);

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

// =========================================
// FUNDO DIGITAL ORBIT
// =========================================

function FundoDigital() {

    return (

        <div
            className="cadastro-fundo-digital"
            aria-hidden="true"
        >

            <div className="cadastro-luz-digital" />

            <div className="cadastro-grade-digital" />

            <div className="cadastro-orbitas">

                <div className="cadastro-orbita cadastro-orbita-1">

                    <span className="cadastro-particula" />

                </div>

                <div className="cadastro-orbita cadastro-orbita-2">

                    <span className="cadastro-particula" />

                    <span className="cadastro-particula-secundaria" />

                </div>

                <div className="cadastro-orbita cadastro-orbita-3">

                    <span className="cadastro-particula" />

                </div>

                <div className="cadastro-orbita cadastro-orbita-4">

                    <span className="cadastro-particula" />

                </div>

                <div className="cadastro-nucleo">

                    <ShieldCheck
                        size={43}
                        strokeWidth={1.3}
                    />

                </div>

            </div>

            <div className="cadastro-pontos-digitais">

                {Array.from({ length: 12 }, (_, indice) => (

                    <span
                        key={indice}
                        style={{
                            "--ponto-x": `${(indice * 37 + 9) % 95}%`,
                            "--ponto-y": `${(indice * 23 + 12) % 95}%`,
                            "--ponto-atraso": `${indice * -0.7}s`
                        }}
                    />

                ))}

            </div>

        </div>

    );

}

// =========================================
// PROGRESSO INTELIGENTE DO CADASTRO
// =========================================

function ProgressoCadastro({
    progresso,
    dadosPessoaisCompletos,
    segurancaCompleta,
    empresaCompleta
}) {

    const etapas = [

        {
            titulo: "Dados pessoais",
            descricao: "Nome, e-mail e telefone",
            completa: dadosPessoaisCompletos,
            Icone: UserRound
        },

        {
            titulo: "Segurança",
            descricao: "Senha e confirmação",
            completa: segurancaCompleta,
            Icone: LockKeyhole
        },

        {
            titulo: "Dados da empresa",
            descricao: "CNPJ e razão social",
            completa: empresaCompleta,
            Icone: Building2
        }

    ];

    return (

        <section
            className={`cadastro-progresso-painel ${
                progresso === 100
                    ? "cadastro-progresso-completo"
                    : ""
            }`}
        >

            <div className="cadastro-progresso-topo">

                <div>

                    <h3>
                        Progresso do cadastro
                    </h3>

                    <p>

                        {progresso === 100

                            ? "Tudo preenchido! Revise seus dados e finalize."

                            : "Sua conta está tomando forma."

                        }

                    </p>

                </div>

                <div className="cadastro-progresso-percentual">

                    {progresso}

                    <small>%</small>

                </div>

            </div>

            {/* BARRA DE PROGRESSO */}

            <div
                className="cadastro-progresso-barra"
                role="progressbar"
                aria-label="Progresso do preenchimento"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progresso}
            >

                <span
                    style={{
                        width: `${progresso}%`
                    }}
                />

            </div>

            {/* ETAPAS DO CADASTRO */}

            <div className="cadastro-progresso-etapas">

                {etapas.map((etapa, indice) => {

                    const Icone = etapa.Icone;

                    return (

                        <div
                            key={etapa.titulo}
                            className={`cadastro-progresso-etapa ${
                                etapa.completa
                                    ? "cadastro-etapa-concluida"
                                    : ""
                            }`}
                        >

                            <div className="cadastro-etapa-icone">

                                {etapa.completa ? (

                                    <Check
                                        size={19}
                                        strokeWidth={2.5}
                                        aria-hidden="true"
                                    />

                                ) : (

                                    <Icone
                                        size={19}
                                        aria-hidden="true"
                                    />

                                )}

                            </div>

                            <div className="cadastro-etapa-texto">

                                <strong>

                                    {etapa.titulo}

                                </strong>

                                <small>

                                    {etapa.completa

                                        ? "Preenchido"

                                        : etapa.descricao

                                    }

                                </small>

                            </div>

                            {indice < etapas.length - 1 && (

                                <ArrowRight
                                    size={15}
                                    className="cadastro-etapa-seta"
                                    aria-hidden="true"
                                />

                            )}

                        </div>

                    );

                })}

            </div>

        </section>

    );

}

// =========================================
// COMPONENTE PRINCIPAL
// =========================================

export default function Cadastro() {

    const navigate = useNavigate();

    // =====================================
    // ESTADOS
    // =====================================

    const [cadastrando, setCadastrando] = useState(false);

    const [mostrarSenha, setMostrarSenha] = useState(false);

    const [mostrarConfirmacao, setMostrarConfirmacao] =
        useState(false);

    const [verificandoCnpj, setVerificandoCnpj] =
        useState(false);

    const [cnpjVerificado, setCnpjVerificado] =
        useState(false);

    const [erro, setErro] = useState("");

    const [erroCnpj, setErroCnpj] = useState("");

    const consultaCnpjRef = useRef(null);

    const [dados, setDados] = useState({

        nome: "",
        email: "",
        telefone: "",
        senha: "",
        confirmarSenha: "",
        cnpj: "",
        razaoSocial: ""

    });

    // =====================================
    // CANCELAR CONSULTA AO SAIR DA TELA
    // =====================================

    useEffect(() => {

        return () => {

            consultaCnpjRef.current?.abort();

            consultaCnpjRef.current = null;

        };

    }, []);

    // =====================================
    // REQUISITOS DO PREENCHIMENTO
    // =====================================

    const nomePreenchido =
        dados.nome.trim().length > 0;

    const emailValido =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            dados.email.trim()
        );

    const telefonePreenchido =
        dados.telefone.trim().length > 0;

    const senhaValida =
        dados.senha.length >= 8 &&
        dados.senha.trim().length > 0;

    const senhasCoincidem =
        dados.confirmarSenha.length > 0 &&
        dados.senha === dados.confirmarSenha;

    const empresaCompleta =
        cnpjVerificado &&
        dados.razaoSocial.trim().length > 0;

    const dadosPessoaisCompletos =
        nomePreenchido &&
        emailValido &&
        telefonePreenchido;

    const segurancaCompleta =
        senhaValida &&
        senhasCoincidem;

    // =====================================
    // CALCULAR PROGRESSO REAL
    // =====================================

    const requisitos = [

        nomePreenchido,
        emailValido,
        telefonePreenchido,
        senhaValida,
        senhasCoincidem,
        empresaCompleta

    ];

    const progresso = Math.round(

        requisitos.filter(Boolean).length /
        requisitos.length * 100

    );

    // =====================================
    // ATUALIZAR CAMPOS
    // =====================================

    function atualizarCampo(event) {

        const { name, value } = event.target;

        setErro("");

        if (name === "cnpj") {

            // Cancela consultas anteriores para impedir
            // que uma resposta antiga altere a empresa.

            consultaCnpjRef.current?.abort();

            consultaCnpjRef.current = null;

            setVerificandoCnpj(false);

            setErroCnpj("");

            setDados(anterior => ({

                ...anterior,

                cnpj: formatarCnpj(value),

                razaoSocial: ""

            }));

            setCnpjVerificado(false);

            return;

        }

        setDados(anterior => ({

            ...anterior,

            [name]: value

        }));

    }

    // =====================================
    // CONSULTAR CNPJ NA BRASILAPI
    // =====================================

    async function verificarCnpj() {

        if (verificandoCnpj || cadastrando) return;

        setErroCnpj("");

        setErro("");

        const cnpjLimpo = normalizarCnpj(dados.cnpj);

        const formatoValido =
            /^[A-Z0-9]{12}[0-9]{2}$/.test(cnpjLimpo);

        if (!formatoValido) {

            setErroCnpj(

                "Digite um CNPJ válido com 14 posições. " +
                "As duas últimas devem ser números."

            );

            return;

        }

        consultaCnpjRef.current?.abort();

        const controller = new AbortController();

        consultaCnpjRef.current = controller;

        setVerificandoCnpj(true);

        setCnpjVerificado(false);

        setDados(anterior => ({

            ...anterior,

            razaoSocial: ""

        }));

        try {

            const resposta = await fetch(

                `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`,

                {
                    signal: controller.signal
                }

            );

            if (!resposta.ok) {

                throw new Error(

                    "Não foi possível consultar este CNPJ."

                );

            }

            const empresa = await resposta.json();

            if (
                controller.signal.aborted ||
                consultaCnpjRef.current !== controller
            ) {

                return;

            }

            if (!empresa.razao_social?.trim()) {

                throw new Error(

                    "A consulta não retornou a razão social."

                );

            }

            setDados(anterior => {

                if (
                    normalizarCnpj(anterior.cnpj) !== cnpjLimpo
                ) {

                    return anterior;

                }

                return {

                    ...anterior,

                    razaoSocial: empresa.razao_social

                };

            });

            setCnpjVerificado(true);

        } catch (error) {

            if (
                controller.signal.aborted ||
                error.name === "AbortError" ||
                consultaCnpjRef.current !== controller
            ) {

                return;

            }

            console.error(

                "Erro ao consultar CNPJ:",

                error

            );

            setErroCnpj(

                "Não foi possível verificar esse CNPJ. " +
                "Confira os dados e tente novamente."

            );

            setDados(anterior => ({

                ...anterior,

                razaoSocial: ""

            }));

            setCnpjVerificado(false);

        } finally {

            if (consultaCnpjRef.current === controller) {

                consultaCnpjRef.current = null;

                setVerificandoCnpj(false);

            }

        }

    }

    // =====================================
    // FINALIZAR CADASTRO
    // =====================================

    async function handleCadastrar(event) {

        event.preventDefault();

        if (cadastrando || verificandoCnpj) return;

        setErro("");

        const camposObrigatorios = { ...dados };

        delete camposObrigatorios.razaoSocial;

        if (

            Object.values(camposObrigatorios).some(

                valor => !valor.trim()

            )

        ) {

            setErro(

                "Preencha todos os campos para continuar."

            );

            return;

        }

        if (!emailValido) {

            setErro(

                "Informe um endereço de e-mail válido."

            );

            return;

        }

        if (!senhaValida) {

            setErro(

                "A senha deve possuir pelo menos 8 caracteres."

            );

            return;

        }

        if (!senhasCoincidem) {

            setErro(

                "As senhas não coincidem."

            );

            return;

        }

        if (!empresaCompleta) {

            setErro(

                "Verifique o CNPJ antes de cadastrar."

            );

            return;

        }

        try {

            setCadastrando(true);

            const resposta = await requisicaoApi(

                "/api/Autenticacao/cadastro",

                {

                    method: "POST",

                    body: JSON.stringify({

                        nome: dados.nome,

                        email: dados.email,

                        senha: dados.senha,

                        razaoSocial: dados.razaoSocial,

                        cnpj: normalizarCnpj(dados.cnpj),

                        telefoneContato: dados.telefone

                    })

                }

            );

            alert(

                resposta?.mensagem ||

                "Cadastro realizado com sucesso!"

            );

            navigate("/login");

        } catch (error) {

            console.error(

                "Erro ao cadastrar empresa:",

                error

            );

            setErro(

                error.message ||

                "Não foi possível realizar o cadastro."

            );

        } finally {

            setCadastrando(false);

        }

    }

    // =====================================
    // RENDERIZAÇÃO
    // =====================================

    return (

        <main className="cadastro">

            {/* =================================
                PAINEL AZUL - DIGITAL ORBIT
            ================================= */}

            <aside className="cadastro-apresentacao">

                <FundoDigital />

                {/* MARCA */}

                <div className="cadastro-marca">

                    <img
                        src={prime_book}
                        alt="Livro do Portal Tributário"
                        className="cadastro-logo"
                    />

                    <div className="cadastro-marca-texto">

                        <h2>
                            Portal Tributário
                        </h2>

                        <p>
                            Centralizado
                        </p>

                    </div>

                </div>

                {/* TEXTO DE APRESENTAÇÃO */}

                <div className="cadastro-texto">

                    <span className="cadastro-etiqueta">

                        <span />

                        BEM-VINDO AO INTEGRA

                    </span>

                    <h1>

                        Organização e segurança

                        <br />

                        para suas informações

                        <br />

                        <span>
                            tributárias
                        </span>

                    </h1>

                </div>

                {/* =================================
                    VANTAGENS - GLASS CARDS
                ================================= */}

                <div className="cadastro-vantagens">

                    <div className="cadastro-vantagem">

                        <div className="cadastro-icone">

                            <img
                                src={iconeEscudo}
                                alt=""
                            />

                        </div>

                        <div>

                            <h3>
                                Mais segurança
                            </h3>

                            <p>

                                Controle de acesso por perfil e CNPJ

                            </p>

                        </div>

                    </div>

                    <div className="cadastro-vantagem">

                        <div className="cadastro-icone">

                            <img
                                src={iconeDocumento}
                                alt=""
                            />

                        </div>

                        <div>

                            <h3>
                                Tudo em um só lugar
                            </h3>

                            <p>

                                Documentos, XMLs, notas fiscais
                                e conteúdos tributários

                            </p>

                        </div>

                    </div>

                    <div className="cadastro-vantagem">

                        <div className="cadastro-icone">

                            <img
                                src={quadroEnergia}
                                alt=""
                            />

                        </div>

                        <div>

                            <h3>
                                Agilidade no seu dia a dia
                            </h3>

                            <p>

                                Encontre o que precisa de forma
                                rápida e prática

                            </p>

                        </div>

                    </div>

                    <div className="cadastro-vantagem">

                        <div className="cadastro-icone">

                            <img
                                src={iconeGrupo}
                                alt=""
                            />

                        </div>

                        <div>

                            <h3>
                                Atendimento eficiente
                            </h3>

                            <p>

                                Informações organizadas e atualizadas
                                para você e seus clientes

                            </p>

                        </div>

                    </div>

                </div>

                {/* RODAPÉ DO PAINEL */}

                <div className="cadastro-painel-rodape">

                    <span className="cadastro-status-digital" />

                    <span>

                        Integra · Portal Tributário

                    </span>

                </div>

            </aside>

            {/* =================================
                ÁREA DO FORMULÁRIO
            ================================= */}

            <section className="cadastro-area">

                <header className="cadastro-topo">

                    <span>

                        Já tem uma conta?

                    </span>

                    <button
                        type="button"
                        className="cadastro-botao-entrar"
                        onClick={() => navigate("/login")}
                        disabled={cadastrando}
                    >

                        Entrar

                        <ArrowRight
                            size={14}
                            aria-hidden="true"
                        />

                    </button>

                </header>

                <div className="cadastro-cartao">

                    {/* CABEÇALHO DO CADASTRO */}

                    <div className="cadastro-cabecalho">

                        <div className="cadastro-avatar">

                            <img
                                src={PerfilLaranja}
                                alt=""
                            />

                        </div>

                        <div>

                            <h2>
                                Criar sua conta
                            </h2>

                            <p>

                                Preencha todos os dados para criar
                                sua conta no Portal Tributário

                            </p>

                        </div>

                    </div>

                    {/* PROGRESSO INTELIGENTE */}

                    <ProgressoCadastro
                        progresso={progresso}
                        dadosPessoaisCompletos={
                            dadosPessoaisCompletos
                        }
                        segurancaCompleta={
                            segurancaCompleta
                        }
                        empresaCompleta={
                            empresaCompleta
                        }
                    />

                    <form onSubmit={handleCadastrar}>

                        {/* =================================
                            DADOS PESSOAIS
                        ================================= */}

                        <div className="cadastro-secao">

                            <div className="cadastro-titulo-secao">

                                <img
                                    src={iconeDadosPessoais}
                                    alt=""
                                    className="cadastro-mini-icone"
                                />

                                <h3>

                                    Dados pessoais

                                </h3>

                                {dadosPessoaisCompletos && (

                                    <CheckCircle2
                                        size={20}
                                        className="cadastro-secao-check"
                                        aria-label="Dados pessoais preenchidos"
                                    />

                                )}

                            </div>

                        </div>

                        <div className="cadastro-grade">

                            {/* NOME */}

                            <div className="cadastro-campo">

                                <label htmlFor="nome">

                                    Nome Completo *

                                </label>

                                <div
                                    className={`cadastro-input-icone ${
                                        nomePreenchido
                                            ? "cadastro-input-preenchido"
                                            : ""
                                    }`}
                                >

                                    <img
                                        src={PessoaCinza}
                                        alt=""
                                    />

                                    <input
                                        id="nome"
                                        name="nome"
                                        value={dados.nome}
                                        onChange={atualizarCampo}
                                        placeholder="Digite seu nome completo"
                                        autoComplete="name"
                                        disabled={cadastrando}
                                        required
                                    />

                                    {nomePreenchido && (

                                        <Check
                                            size={17}
                                            className="cadastro-check-campo"
                                            aria-hidden="true"
                                        />

                                    )}

                                </div>

                            </div>

                            {/* E-MAIL */}

                            <div className="cadastro-campo">

                                <label htmlFor="email">

                                    E-mail *

                                </label>

                                <div
                                    className={`cadastro-input-icone ${
                                        emailValido
                                            ? "cadastro-input-preenchido"
                                            : ""
                                    }`}
                                >

                                    <img
                                        src={EmailCinza}
                                        alt=""
                                    />

                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={dados.email}
                                        onChange={atualizarCampo}
                                        placeholder="exemplo@dominio.com"
                                        autoComplete="email"
                                        disabled={cadastrando}
                                        required
                                    />

                                    {emailValido && (

                                        <Check
                                            size={17}
                                            className="cadastro-check-campo"
                                            aria-hidden="true"
                                        />

                                    )}

                                </div>

                            </div>

                            {/* TELEFONE */}

                            <div className="cadastro-campo">

                                <label htmlFor="telefone">

                                    Telefone *

                                </label>

                                <div
                                    className={`cadastro-input-icone ${
                                        telefonePreenchido
                                            ? "cadastro-input-preenchido"
                                            : ""
                                    }`}
                                >

                                    <img
                                        src={TelefoneCinza}
                                        alt=""
                                    />

                                    <input
                                        id="telefone"
                                        name="telefone"
                                        type="tel"
                                        value={dados.telefone}
                                        onChange={atualizarCampo}
                                        placeholder="(11) 91234-5678"
                                        autoComplete="tel"
                                        disabled={cadastrando}
                                        required
                                    />

                                    {telefonePreenchido && (

                                        <Check
                                            size={17}
                                            className="cadastro-check-campo"
                                            aria-hidden="true"
                                        />

                                    )}

                                </div>

                            </div>

                            {/* SENHA */}

                            <div className="cadastro-campo">

                                <label htmlFor="senha">

                                    Senha *

                                </label>

                                <div
                                    className={`cadastro-input-senha ${
                                        senhaValida
                                            ? "cadastro-input-preenchido"
                                            : ""
                                    }`}
                                >

                                    <img
                                        src={CadeadoCinza}
                                        alt=""
                                        className="cadastro-icone-input"
                                    />

                                    <input
                                        id="senha"
                                        name="senha"
                                        type={
                                            mostrarSenha
                                                ? "text"
                                                : "password"
                                        }
                                        value={dados.senha}
                                        onChange={atualizarCampo}
                                        placeholder="Digite sua senha"
                                        autoComplete="new-password"
                                        aria-describedby="cadastro-requisito-senha"
                                        minLength={8}
                                        disabled={cadastrando}
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="cadastro-olho-senha"
                                        onClick={() =>
                                            setMostrarSenha(anterior => !anterior)
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

                                {/* REQUISITO DA SENHA */}

                                <div
                                    id="cadastro-requisito-senha"
                                    className={`cadastro-requisito-senha ${
                                        senhaValida
                                            ? "cadastro-requisito-ok"
                                            : ""
                                    }`}
                                >

                                    {senhaValida ? (

                                        <CheckCircle2 size={14} />

                                    ) : (

                                        <LockKeyhole size={14} />

                                    )}

                                    <span>

                                        Mínimo de 8 caracteres

                                    </span>

                                </div>

                            </div>

                            {/* CONFIRMAR SENHA */}

                            <div className="cadastro-campo cadastro-campo-largo">

                                <label htmlFor="confirmarSenha">

                                    Confirmar senha *

                                </label>

                                <div
                                    className={`cadastro-input-senha ${
                                        senhasCoincidem
                                            ? "cadastro-input-preenchido"
                                            : ""
                                    } ${
                                        dados.confirmarSenha &&
                                        !senhasCoincidem
                                            ? "cadastro-input-invalido"
                                            : ""
                                    }`}
                                >

                                    <img
                                        src={CadeadoCinza}
                                        alt=""
                                        className="cadastro-icone-input"
                                    />

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
                                        aria-describedby="cadastro-confirmacao-feedback"
                                        aria-invalid={
                                            Boolean(dados.confirmarSenha) &&
                                            !senhasCoincidem
                                        }
                                        disabled={cadastrando}
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="cadastro-olho-senha"
                                        onClick={() =>
                                            setMostrarConfirmacao(
                                                anterior => !anterior
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

                                {/* FEEDBACK DA CONFIRMAÇÃO */}

                                <div
                                    id="cadastro-confirmacao-feedback"
                                    aria-live="polite"
                                >

                                    {dados.confirmarSenha && (

                                        <div
                                            className={`cadastro-feedback-senha ${
                                                senhasCoincidem

                                                    ? "cadastro-feedback-ok"

                                                    : "cadastro-feedback-erro"
                                            }`}
                                        >

                                            {senhasCoincidem ? (

                                                <CheckCircle2 size={15} />

                                            ) : (

                                                <AlertCircle size={15} />

                                            )}

                                            <span>

                                                {senhasCoincidem

                                                    ? "As senhas coincidem"

                                                    : "As senhas ainda não coincidem"

                                                }

                                            </span>

                                        </div>

                                    )}

                                </div>

                            </div>

                        </div>

                        {/* =================================
                            DADOS DA EMPRESA
                        ================================= */}

                        <div className="cadastro-secao cadastro-secao-empresa">

                            <div className="cadastro-titulo-secao">

                                <span className="cadastro-mini-icone">

                                    <img
                                        src={cidadeLaranja}
                                        alt=""
                                    />

                                </span>

                                <h3>

                                    Dados da empresa

                                </h3>

                                {empresaCompleta && (

                                    <CheckCircle2
                                        size={20}
                                        className="cadastro-secao-check"
                                        aria-label="Dados da empresa preenchidos"
                                    />

                                )}

                            </div>

                            <div className="cadastro-grade">

                                {/* CNPJ */}

                                <div className="cadastro-campo">

                                    <label htmlFor="cnpj">

                                        CNPJ *

                                    </label>

                                    <input
                                        id="cnpj"
                                        name="cnpj"
                                        type="text"
                                        value={dados.cnpj}
                                        onChange={atualizarCampo}
                                        placeholder="00.AAA.000/0000-00"
                                        autoComplete="off"
                                        maxLength={18}
                                        inputMode="text"
                                        className={
                                            cnpjVerificado
                                                ? "cadastro-cnpj-verificado"
                                                : ""
                                        }
                                        disabled={cadastrando}
                                        required
                                    />

                                    <button
                                        type="button"
                                        className={`cadastro-botao-verificar ${
                                            cnpjVerificado
                                                ? "cadastro-verificacao-ok"
                                                : ""
                                        }`}
                                        onClick={verificarCnpj}
                                        disabled={
                                            verificandoCnpj ||
                                            cadastrando
                                        }
                                    >

                                        {verificandoCnpj ? (

                                            <LoaderCircle
                                                size={17}
                                                className="cadastro-spinner"
                                            />

                                        ) : cnpjVerificado ? (

                                            <CheckCircle2 size={17} />

                                        ) : (

                                            <Building2 size={17} />

                                        )}

                                        {verificandoCnpj

                                            ? "Verificando..."

                                            : cnpjVerificado

                                                ? "CNPJ consultado"

                                                : "Verificar CNPJ"

                                        }

                                    </button>

                                    {/* MENSAGEM DE SUCESSO */}

                                    {cnpjVerificado && (

                                        <p
                                            className="cadastro-cnpj-sucesso"
                                            role="status"
                                        >

                                            <CheckCircle2 size={16} />

                                            CNPJ consultado com sucesso!

                                        </p>

                                    )}

                                    {/* ERRO DA CONSULTA */}

                                    {erroCnpj && (

                                        <p
                                            className="cadastro-cnpj-erro"
                                            role="alert"
                                        >

                                            <AlertCircle size={16} />

                                            {erroCnpj}

                                        </p>

                                    )}

                                </div>

                                {/* RAZÃO SOCIAL */}

                                <div className="cadastro-campo">

                                    <label htmlFor="razaoSocial">

                                        Razão social *

                                    </label>

                                    <div
                                        className={`cadastro-razao-container ${
                                            cnpjVerificado
                                                ? "cadastro-razao-verificada"
                                                : ""
                                        } ${
                                            verificandoCnpj
                                                ? "cadastro-razao-carregando"
                                                : ""
                                        }`}
                                    >

                                        <input
                                            id="razaoSocial"
                                            name="razaoSocial"
                                            value={dados.razaoSocial}
                                            placeholder="Preenchida após verificar o CNPJ"
                                            readOnly
                                            required
                                        />

                                        {cnpjVerificado && (

                                            <CheckCircle2
                                                size={19}
                                                className="cadastro-razao-check"
                                                aria-hidden="true"
                                            />

                                        )}

                                    </div>

                                    {cnpjVerificado && (

                                        <span className="cadastro-razao-info">

                                            <ShieldCheck size={14} />

                                            Razão social obtida na consulta

                                        </span>

                                    )}

                                </div>

                            </div>

                        </div>

                        {/* =================================
                            MENSAGEM DE ERRO
                        ================================= */}

                        {erro && (

                            <div
                                className="cadastro-mensagem-erro"
                                role="alert"
                            >

                                <AlertCircle size={21} />

                                <span>
                                    {erro}
                                </span>

                            </div>

                        )}

                        {/* =================================
                            BOTÃO FINALIZAR CADASTRO
                        ================================= */}

                        <button
                            type="submit"
                            className={`cadastro-botao-submit ${
                                progresso === 100
                                    ? "cadastro-submit-pronto"
                                    : ""
                            }`}
                            disabled={
                                cadastrando ||
                                verificandoCnpj
                            }
                        >

                            {cadastrando ? (

                                <LoaderCircle
                                    size={20}
                                    className="cadastro-spinner"
                                />

                            ) : (

                                <img
                                    src={ADDProfileBranco}
                                    alt=""
                                />

                            )}

                            {cadastrando

                                ? "Cadastrando..."

                                : "Cadastrar"

                            }

                            {!cadastrando && (

                                <ArrowRight
                                    size={17}
                                    className="cadastro-submit-seta"
                                    aria-hidden="true"
                                />

                            )}

                        </button>

                        {/* AVISO DE SEGURANÇA */}

                        <div className="cadastro-seguranca-final">

                            <ShieldCheck
                                size={15}
                                aria-hidden="true"
                            />

                            <span>

                                Cadastro de acesso ao Portal Tributário

                            </span>

                        </div>

                    </form>

                </div>

            </section>

        </main>

    );

}