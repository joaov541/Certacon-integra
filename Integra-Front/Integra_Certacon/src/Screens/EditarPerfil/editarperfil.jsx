import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import "./editarperfil.css";

import { requisicaoApi } from "../../services/api";
import usePermissoes from "../../hooks/usePermissoes";

import Pessoa from "../../assets/Icones/Pessoa.png";
import ChaveSenha from "../../assets/Icones/ChaveSenha.png";
import TelefonePerfil from "../../assets/Icones/TelefonePerfil.png";
import SairCinza from "../../assets/Icones/SairCinza.png";
import SairBranco from "../../assets/Icones/SairBranco.png";
import EmailPerfil from "../../assets/Icones/EmailPerfil.png";
import EscudoCinzaPerfil from "../../assets/Icones/EscudoCinzaPerfil.png";
import EmpresaPerfil from "../../assets/Icones/EmpresaPerfil.png";
import FusoHorario from "../../assets/Icones/FusoHorario.png";
import Idioma from "../../assets/Icones/Idioma.png";
import PredioPerfil from "../../assets/Icones/PredioPerfil.png";

// =========================================
// ESTADOS INICIAIS
// =========================================

const perfilInicial = {
    nome: "",
    cargo: "",
    email: "",
    telefone: "",
    departamento: "",
    empresa: "",
    cnpj: ""
};

const senhasIniciais = {
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: ""
};

// =========================================
// FORMATAR CNPJ
// =========================================

function formatarCnpj(valor) {

    const cnpj = String(valor || "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase();

    if (cnpj.length !== 14) {
        return valor || "Não informado";
    }

    return cnpj.replace(
        /^(.{2})(.{3})(.{3})(.{4})(.{2})$/,
        "$1.$2.$3/$4-$5"
    );

}

// =========================================
// COMPONENTE PRINCIPAL
// =========================================

function EditarPerfil() {

    const navigate = useNavigate();

    const { autenticado } = usePermissoes();

    const token = localStorage.getItem("token");

    // =========================================
    // REFERÊNCIAS
    // =========================================

    const inputFotoRef = useRef(null);

    const montadoRef = useRef(false);

    const operacaoRef = useRef(false);

    // =========================================
    // ESTADOS DA FOTO
    // =========================================

    const [fotoPerfil, setFotoPerfil] =
        useState(null);

    const [salvandoFoto, setSalvandoFoto] =
        useState(false);

    const [carregandoFoto, setCarregandoFoto] =
        useState(true);

    const [erroFoto, setErroFoto] =
        useState("");

    // =========================================
    // ESTADOS DO PERFIL
    // =========================================

    const [modoEdicao, setModoEdicao] =
        useState(false);

    const [perfil, setPerfil] =
        useState(perfilInicial);

    const [perfilOriginal, setPerfilOriginal] =
        useState(perfilInicial);

    const [carregando, setCarregando] =
        useState(true);

    const [salvando, setSalvando] =
        useState(false);

    const [erroPerfil, setErroPerfil] =
        useState("");

    const [mensagem, setMensagem] =
        useState("");

    const [tipoMensagem, setTipoMensagem] =
        useState("");

    const [versaoConsulta, setVersaoConsulta] =
        useState(0);

    // =========================================
    // ESTADOS DA SENHA
    // =========================================

    const [modalSenha, setModalSenha] =
        useState(false);

    const [salvandoSenha, setSalvandoSenha] =
        useState(false);

    const [erroSenha, setErroSenha] =
        useState("");

    const [senhas, setSenhas] =
        useState(senhasIniciais);

    const [mostrarSenha, setMostrarSenha] =
        useState(false);

    // =========================================
    // CONTROLE DO COMPONENTE
    // =========================================

    useEffect(() => {

        montadoRef.current = true;

        return () => {
            montadoRef.current = false;
        };

    }, []);

    function sessaoValida() {

        return (

            montadoRef.current &&

            autenticado &&

            localStorage.getItem("token") === token

        );

    }

    // =========================================
    // MENSAGENS
    // =========================================

    function mostrarMensagem(texto, tipo = "sucesso") {

        setMensagem(texto);
        setTipoMensagem(tipo);

    }

    // =========================================
    // LOGOUT MOBILE
    // =========================================

    function sairPerfilMobile() {

        if (operacaoRef.current) return;

        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        localStorage.removeItem("perfis");

        // Atualiza o contexto de autenticação.

        window.dispatchEvent(
            new Event("sessao-alterada")
        );

        navigate("/login", {
            replace: true
        });

    }

    // =========================================
    // CARREGAR PERFIL E FOTO
    // =========================================

    useEffect(() => {

        let ativo = true;

        setPerfil(perfilInicial);
        setPerfilOriginal(perfilInicial);
        setFotoPerfil(null);

        setErroPerfil("");
        setErroFoto("");
        setMensagem("");

        setModoEdicao(false);
        setModalSenha(false);
        setSenhas(senhasIniciais);

        if (!autenticado || !token) {

            setCarregando(false);
            setCarregandoFoto(false);

            return;

        }

        async function carregarPerfil() {

            try {

                setCarregando(true);

                const dados = await requisicaoApi(
                    "/api/MeuPerfil"
                );

                if (
                    !ativo ||
                    localStorage.getItem("token") !== token
                ) {

                    return;

                }

                const perfis = Array.isArray(dados.perfis)

                    ? dados.perfis

                    : [];

                const ehCliente = perfis.includes("Cliente");

                const perfilRecebido = {

                    nome:
                        dados.nome || "",

                    cargo:
                        perfis.join(", ") ||
                        "Não informado",

                    email:
                        dados.email || "",

                    telefone:
                        dados.telefoneContato || "",

                    departamento:

                        dados.departamento ||

                        (
                            ehCliente

                                ? "Cliente"

                                : "Fiscal"
                        ),

                    empresa:

                        dados.razaoSocial ||

                        (
                            ehCliente

                                ? "Não informada"

                                : "Certacon"
                        ),

                    cnpj:
                        dados.cnpj || ""

                };

                setPerfil(perfilRecebido);
                setPerfilOriginal(perfilRecebido);

            } catch (erro) {

                if (!ativo) return;

                console.error(
                    "Erro ao carregar perfil:",
                    erro
                );

                setErroPerfil(

                    erro.message ||

                    "Não foi possível carregar seu perfil."

                );

            } finally {

                if (ativo) {
                    setCarregando(false);
                }

            }

        }

        async function carregarFoto() {

            try {

                setCarregandoFoto(true);

                const dados = await requisicaoApi(
                    "/api/FotoPerfil"
                );

                if (
                    !ativo ||
                    localStorage.getItem("token") !== token
                ) {

                    return;

                }

                setFotoPerfil(
                    dados?.foto || null
                );

            } catch (erro) {

                if (!ativo) return;

                setErroFoto(

                    erro.message ||

                    "Não foi possível carregar a foto."

                );

            } finally {

                if (ativo) {
                    setCarregandoFoto(false);
                }

            }

        }

        carregarPerfil();
        carregarFoto();

        return () => {

            ativo = false;

        };

    }, [
        autenticado,
        token,
        versaoConsulta
    ]);

    // =========================================
    // ALTERAR FOTO
    // =========================================

    async function alterarFoto(event) {

        const arquivo =
            event.currentTarget.files?.[0];

        event.currentTarget.value = "";

        if (
            !arquivo ||
            !sessaoValida() ||
            operacaoRef.current
        ) {

            return;

        }

        setErroFoto("");
        setMensagem("");

        const formatosPermitidos = [

            "image/jpeg",

            "image/png",

            "image/webp"

        ];

        if (!formatosPermitidos.includes(arquivo.type)) {

            setErroFoto(

                "Escolha uma imagem JPG, PNG ou WEBP."

            );

            return;

        }

        if (arquivo.size === 0) {

            setErroFoto(
                "O arquivo selecionado está vazio."
            );

            return;

        }

        if (arquivo.size > 2 * 1024 * 1024) {

            setErroFoto(

                "A foto deve ter no máximo 2 MB."

            );

            return;

        }

        const dados = new FormData();

        dados.append(
            "arquivo",
            arquivo
        );

        try {

            operacaoRef.current = true;

            setSalvandoFoto(true);

            const resposta = await requisicaoApi(

                "/api/FotoPerfil",

                {
                    method: "POST",
                    body: dados
                }

            );

            if (!sessaoValida()) return;

            let novaFoto = resposta?.foto;

            // Caso a API não devolva a imagem,
            // consulta novamente a foto armazenada.

            if (!novaFoto) {

                const dadosFoto = await requisicaoApi(
                    "/api/FotoPerfil"
                );

                novaFoto = dadosFoto?.foto;

            }

            if (!sessaoValida()) return;

            setFotoPerfil(novaFoto || null);

            window.dispatchEvent(
                new Event("foto-perfil-atualizada")
            );

            mostrarMensagem(
                "Foto de perfil atualizada com sucesso!"
            );

        } catch (erro) {

            if (!sessaoValida()) return;

            setErroFoto(

                erro.message ||

                "Não foi possível salvar a foto."

            );

        } finally {

            operacaoRef.current = false;

            if (montadoRef.current) {
                setSalvandoFoto(false);
            }

        }

    }

    // =========================================
    // REMOVER FOTO
    // =========================================

    async function removerFoto() {

        if (

            !sessaoValida() ||

            !fotoPerfil ||

            operacaoRef.current

        ) {

            return;

        }

        const confirmar = window.confirm(

            "Deseja remover sua foto de perfil?"

        );

        if (!confirmar) return;

        setErroFoto("");
        setMensagem("");

        try {

            operacaoRef.current = true;

            setSalvandoFoto(true);

            await requisicaoApi(

                "/api/FotoPerfil",

                {
                    method: "DELETE"
                }

            );

            if (!sessaoValida()) return;

            setFotoPerfil(null);

            window.dispatchEvent(
                new Event("foto-perfil-atualizada")
            );

            mostrarMensagem(
                "Foto de perfil removida com sucesso!"
            );

        } catch (erro) {

            if (!sessaoValida()) return;

            setErroFoto(

                erro.message ||

                "Não foi possível remover a foto."

            );

        } finally {

            operacaoRef.current = false;

            if (montadoRef.current) {
                setSalvandoFoto(false);
            }

        }

    }

    // =========================================
    // ATUALIZAR CAMPOS EDITÁVEIS
    // =========================================

    function atualizarCampo(event) {

        const { name, value } = event.target;

        const camposPermitidos = [

            "nome",

            "email",

            "telefone"

        ];

        if (

            !modoEdicao ||

            operacaoRef.current ||

            !camposPermitidos.includes(name)

        ) {

            return;

        }

        setPerfil(anterior => ({

            ...anterior,

            [name]: value

        }));

    }

    // =========================================
    // ATIVAR EDIÇÃO
    // =========================================

    function editarPerfil() {

        if (

            !sessaoValida() ||

            operacaoRef.current ||

            carregando ||

            erroPerfil

        ) {

            return;

        }

        setMensagem("");

        setModoEdicao(true);

    }

    // =========================================
    // CANCELAR EDIÇÃO
    // =========================================

    function cancelarEdicao() {

        if (operacaoRef.current) return;

        setPerfil({

            ...perfilOriginal

        });

        setModoEdicao(false);

        setMensagem("");

    }

    // =========================================
    // SALVAR PERFIL
    // =========================================

    async function salvarPerfil() {

        if (

            !sessaoValida() ||

            !modoEdicao ||

            operacaoRef.current

        ) {

            return;

        }

        const nome = perfil.nome.trim();

        const email = perfil.email
            .trim()
            .toLowerCase();

        const telefone = perfil.telefone.trim();

        if (!nome || !email) {

            mostrarMensagem(

                "Preencha o nome e o e-mail.",

                "erro"

            );

            return;

        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

            mostrarMensagem(

                "Informe um e-mail válido.",

                "erro"

            );

            return;

        }

        try {

            operacaoRef.current = true;

            setSalvando(true);

            setMensagem("");

            await requisicaoApi(

                "/api/MeuPerfil",

                {

                    method: "PUT",

                    body: JSON.stringify({

                        nome,

                        email,

                        telefoneContato:
                            telefone || null

                    })

                }

            );

            if (!sessaoValida()) return;

            const perfilAtualizado = {

                ...perfil,

                nome,

                email,

                telefone

            };

            setPerfil(perfilAtualizado);

            setPerfilOriginal(perfilAtualizado);

            // =================================
            // ATUALIZAR DADOS LOCAIS
            // =================================

            try {

                const usuarioSalvo = JSON.parse(

                    localStorage.getItem("usuario") ||

                    "{}"

                );

                localStorage.setItem(

                    "usuario",

                    JSON.stringify({

                        ...usuarioSalvo,

                        nome,

                        email

                    })

                );

            } catch (erro) {

                console.warn(

                    "Não foi possível atualizar os dados locais.",

                    erro

                );

            }

            // Notifica os Headers compartilhados.

            window.dispatchEvent(
                new Event("perfil-atualizado")
            );

            setModoEdicao(false);

            mostrarMensagem(
                "Perfil atualizado com sucesso!"
            );

        } catch (erro) {

            if (!sessaoValida()) return;

            console.error(
                "Erro ao atualizar perfil:",
                erro
            );

            mostrarMensagem(

                erro.message ||

                "Não foi possível atualizar seu perfil.",

                "erro"

            );

        } finally {

            operacaoRef.current = false;

            if (montadoRef.current) {
                setSalvando(false);
            }

        }

    }

    // =========================================
    // ABRIR MODAL DE SENHA
    // =========================================

    function abrirModalSenha() {

        if (

            !sessaoValida() ||

            operacaoRef.current

        ) {

            return;

        }

        setSenhas(senhasIniciais);

        setErroSenha("");

        setMostrarSenha(false);

        setModalSenha(true);

    }

    // =========================================
    // ATUALIZAR SENHAS
    // =========================================

    function atualizarSenha(event) {

        if (operacaoRef.current) return;

        const { name, value } = event.target;

        setSenhas(anterior => ({

            ...anterior,

            [name]: value

        }));

        setErroSenha("");

    }

    // =========================================
    // FECHAR MODAL
    // =========================================

    function fecharModalSenha() {

        if (operacaoRef.current) return;

        setModalSenha(false);

        setSenhas(senhasIniciais);

        setErroSenha("");

        setMostrarSenha(false);

    }

    // =========================================
    // FECHAR MODAL COM ESC
    // =========================================

    useEffect(() => {

        if (!modalSenha) return;

        function pressionarTecla(event) {

            if (

                event.key === "Escape" &&

                !operacaoRef.current

            ) {

                setModalSenha(false);

                setSenhas(senhasIniciais);

                setErroSenha("");

                setMostrarSenha(false);

            }

        }

        window.addEventListener(
            "keydown",
            pressionarTecla
        );

        return () => {

            window.removeEventListener(
                "keydown",
                pressionarTecla
            );

        };

    }, [modalSenha]);

    // =========================================
    // ALTERAR SENHA
    // =========================================

    async function alterarSenha(event) {

        event.preventDefault();

        if (

            !sessaoValida() ||

            operacaoRef.current

        ) {

            return;

        }

        setErroSenha("");

        if (

            !senhas.senhaAtual ||

            !senhas.novaSenha ||

            !senhas.confirmarSenha

        ) {

            setErroSenha(
                "Preencha todos os campos."
            );

            return;

        }

        if (senhas.novaSenha.length < 8) {

            setErroSenha(

                "A nova senha deve ter pelo menos 8 caracteres."

            );

            return;

        }

        if (
            senhas.novaSenha !==
            senhas.confirmarSenha
        ) {

            setErroSenha(

                "A confirmação da senha não corresponde."

            );

            return;

        }

        if (
            senhas.senhaAtual ===
            senhas.novaSenha
        ) {

            setErroSenha(

                "A nova senha deve ser diferente da atual."

            );

            return;

        }

        try {

            operacaoRef.current = true;

            setSalvandoSenha(true);

            await requisicaoApi(

                "/api/MeuPerfil/alterar-senha",

                {

                    method: "PUT",

                    body: JSON.stringify({

                        senhaAtual:
                            senhas.senhaAtual,

                        novaSenha:
                            senhas.novaSenha

                    })

                }

            );

            if (!sessaoValida()) return;

            setModalSenha(false);

            setSenhas(senhasIniciais);

            setMostrarSenha(false);

            mostrarMensagem(
                "Senha alterada com sucesso!"
            );

        } catch (erro) {

            if (!sessaoValida()) return;

            console.error(
                "Erro ao alterar senha:",
                erro
            );

            setErroSenha(

                erro.message ||

                "Não foi possível alterar a senha."

            );

        } finally {

            operacaoRef.current = false;

            if (montadoRef.current) {
                setSalvandoSenha(false);
            }

        }

    }

    const ocupado =

        salvando ||

        salvandoFoto ||

        salvandoSenha;

    // =========================================
    // RENDERIZAÇÃO
    //
    // Sidebar e Headers são fornecidos
    // exclusivamente pelo LayoutSistema.
    // =========================================

    return (

        <div className="pagina-perfil">

            <main className="principal-perfil">

                <section className="conteudo-perfil">

                    <NavLink
                        to="/home"
                        className="voltar-perfil"
                    >

                        ← Voltar

                    </NavLink>

                    <h1>Meu Perfil</h1>

                    {/* MENSAGENS */}

                    {mensagem && (

                        <div
                            className={`mensagem-perfil ${
                                tipoMensagem === "erro"
                                    ? "erro"
                                    : "sucesso"
                            }`}

                            role={
                                tipoMensagem === "erro"
                                    ? "alert"
                                    : "status"
                            }
                        >

                            {mensagem}

                        </div>

                    )}

                    {/* CARREGAMENTO */}

                    {!autenticado ? (

                        <div className="mensagem-perfil erro">

                            Você precisa estar autenticado
                            para acessar seu perfil.

                        </div>

                    ) : carregando ? (

                        <p role="status">

                            Carregando informações do perfil...

                        </p>

                    ) : erroPerfil ? (

                        <div
                            className="mensagem-perfil erro"

                            role="alert"
                        >

                            <p>{erroPerfil}</p>

                            <button
                                type="button"

                                className="botao-tentar-perfil"

                                onClick={() =>

                                    setVersaoConsulta(
                                        atual => atual + 1
                                    )

                                }
                            >

                                Tentar novamente

                            </button>

                        </div>

                    ) : (

                        <div className="area-perfil">

                            {/* =================================
                                CARTÃO PRINCIPAL
                            ================================= */}

                            <div className="cartao-perfil">

                                {/* FOTO */}

                                <div className="area-foto-edicao">

                                    <div className="foto-perfil1">

                                        <img
                                            src={fotoPerfil || Pessoa}

                                            alt="Foto do usuário"

                                            className={
                                                fotoPerfil
                                                    ? "foto-personalizada"
                                                    : "foto-padrao"
                                            }
                                        />

                                    </div>

                                    <input
                                        ref={inputFotoRef}

                                        type="file"

                                        accept="image/jpeg,image/png,image/webp"

                                        onChange={alterarFoto}

                                        disabled={
                                            ocupado ||
                                            carregandoFoto
                                        }

                                        hidden

                                        aria-label="Selecionar foto de perfil"
                                    />

                                    <div className="acoes-foto-perfil">

                                        <button
                                            type="button"

                                            onClick={() =>

                                                inputFotoRef.current?.click()

                                            }

                                            disabled={
                                                ocupado ||
                                                carregandoFoto
                                            }
                                        >

                                            {carregandoFoto

                                                ? "Carregando foto..."

                                                : salvandoFoto

                                                    ? "Salvando..."

                                                    : fotoPerfil

                                                        ? "Trocar foto"

                                                        : "Adicionar foto"}

                                        </button>

                                        {fotoPerfil && (

                                            <button
                                                type="button"

                                                onClick={removerFoto}

                                                disabled={ocupado}
                                            >

                                                Remover foto

                                            </button>

                                        )}

                                    </div>

                                    <small className="limite-foto-perfil">

                                        JPG, PNG ou WEBP — até 2 MB

                                    </small>

                                    {erroFoto && (

                                        <p
                                            className="erro-foto-perfil"

                                            role="alert"
                                        >

                                            {erroFoto}

                                        </p>

                                    )}

                                </div>

                                {/* NOME E PERFIS */}

                                <div className="identificacao-perfil">

                                    {modoEdicao ? (

                                        <input
                                            type="text"

                                            name="nome"

                                            value={perfil.nome}

                                            onChange={atualizarCampo}

                                            className="input-nome-perfil"

                                            aria-label="Nome completo"

                                            maxLength={150}

                                            disabled={ocupado}
                                        />

                                    ) : (

                                        <h2>

                                            {perfil.nome}

                                        </h2>

                                    )}

                                    <p>

                                        {perfil.cargo}

                                    </p>

                                </div>

                                {/* INFORMAÇÕES PESSOAIS */}

                                <div className="informacoes-perfil">

                                    {/* EMAIL */}

                                    <div className="informacao-item">

                                        <img
                                            src={EmailPerfil}
                                            alt=""
                                        />

                                        <div>

                                            <span>

                                                E-mail Corporativo

                                            </span>

                                            {modoEdicao ? (

                                                <input
                                                    type="email"

                                                    name="email"

                                                    value={perfil.email}

                                                    onChange={atualizarCampo}

                                                    aria-label="E-mail"

                                                    disabled={ocupado}
                                                />

                                            ) : (

                                                <p>

                                                    {perfil.email ||
                                                        "Não informado"}

                                                </p>

                                            )}

                                        </div>

                                    </div>

                                    {/* TELEFONE */}

                                    <div className="informacao-item">

                                        <img
                                            src={TelefonePerfil}
                                            alt=""
                                        />

                                        <div>

                                            <span>

                                                Telefone de Contato

                                            </span>

                                            {modoEdicao ? (

                                                <input
                                                    type="tel"

                                                    name="telefone"

                                                    value={perfil.telefone}

                                                    onChange={atualizarCampo}

                                                    aria-label="Telefone de contato"

                                                    disabled={ocupado}
                                                />

                                            ) : (

                                                <p>

                                                    {perfil.telefone ||
                                                        "Não informado"}

                                                </p>

                                            )}

                                        </div>

                                    </div>

                                    {/* DEPARTAMENTO */}

                                    <div className="informacao-item">

                                        <img
                                            src={PredioPerfil}
                                            alt=""
                                        />

                                        <div>

                                            <span>

                                                Departamento

                                            </span>

                                            <p>

                                                {perfil.departamento}

                                            </p>

                                        </div>

                                    </div>

                                    {/* EMPRESA */}

                                    <div className="informacao-item">

                                        <img
                                            src={EmpresaPerfil}
                                            alt=""
                                        />

                                        <div>

                                            <span>

                                                Empresa Vinculada

                                            </span>

                                            <p>

                                                {perfil.empresa}

                                            </p>

                                        </div>

                                    </div>

                                    {/* CNPJ */}

                                    {perfil.cnpj && (

                                        <div className="informacao-item">

                                            <img
                                                src={EmpresaPerfil}
                                                alt=""
                                            />

                                            <div>

                                                <span>CNPJ</span>

                                                <p>

                                                    {formatarCnpj(
                                                        perfil.cnpj
                                                    )}

                                                </p>

                                            </div>

                                        </div>

                                    )}

                                </div>

                                {/* BOTÕES DE EDIÇÃO */}

                                <div className="acoes-perfil">

                                    {modoEdicao ? (

                                        <>

                                            <button
                                                type="button"

                                                className="botao-salvar-perfil"

                                                onClick={salvarPerfil}

                                                disabled={ocupado}
                                            >

                                                {salvando

                                                    ? "Salvando..."

                                                    : "Salvar alterações"}

                                            </button>

                                            <button
                                                type="button"

                                                className="botao-cancelar-perfil"

                                                onClick={cancelarEdicao}

                                                disabled={ocupado}
                                            >

                                                Cancelar

                                            </button>

                                        </>

                                    ) : (

                                        <button
                                            type="button"

                                            className="botao-editar-perfil"

                                            onClick={editarPerfil}

                                            disabled={ocupado}
                                        >

                                            Editar Perfil

                                        </button>

                                    )}

                                </div>

                            </div>

                            {/* =================================
                                CARTÕES LATERAIS
                            ================================= */}

                            <div className="configuracoes-perfil">

                                {/* SEGURANÇA */}

                                <div className="cartao-configuracao">

                                    <h3>Segurança</h3>

                                    <div className="configuracao-item">

                                        <span className="icone-configuracao">

                                            <img
                                                src={EscudoCinzaPerfil}
                                                alt=""
                                            />

                                        </span>

                                        <div>

                                            <span>MFA</span>

                                            <p>Não configurado</p>

                                        </div>

                                    </div>

                                    <div className="configuracao-item">

                                        <span className="icone-configuracao">

                                            <img
                                                src={SairCinza}
                                                alt=""
                                            />

                                        </span>

                                        <div>

                                            <span>Último login</span>

                                            <p>Não disponível</p>

                                        </div>

                                    </div>

                                    <div className="linha-configuracao" />

                                    <button
                                        type="button"

                                        className="alterar-senha"

                                        onClick={abrirModalSenha}

                                        disabled={ocupado}
                                    >

                                        <img
                                            src={ChaveSenha}
                                            alt=""
                                        />

                                        Alterar Senha

                                    </button>

                                </div>

                                {/* PREFERÊNCIAS */}

                                <div className="cartao-configuracao cartao-preferencias">

                                    <h3>Preferências</h3>

                                    <div className="configuracao-item">

                                        <span className="icone-configuracao">

                                            <img
                                                src={Idioma}
                                                alt=""
                                            />

                                        </span>

                                        <div>

                                            <span>Idioma</span>

                                            <p>Português - BR</p>

                                        </div>

                                    </div>

                                    <div className="configuracao-item">

                                        <span className="icone-configuracao">

                                            <img
                                                src={FusoHorario}
                                                alt=""
                                            />

                                        </span>

                                        <div>

                                            <span>Fuso Horário</span>

                                            <p>BRT - Brasília</p>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    )}

                    {/* LOGOUT EXCLUSIVO MOBILE */}

                    {autenticado && (

                        <button
                            type="button"

                            className="botao-sair-perfil-mobile"

                            onClick={sairPerfilMobile}

                            disabled={ocupado}
                        >

                            <img
                                src={SairBranco}
                                alt=""
                            />

                            <span>

                                Sair da conta

                            </span>

                        </button>

                    )}

                </section>

            </main>

            {/* =========================================
                MODAL DE ALTERAÇÃO DE SENHA
            ========================================= */}

            {modalSenha && autenticado && (

                <div
                    className="fundo-modal-senha"

                    onClick={fecharModalSenha}
                >

                    <form
                        className="modal-alterar-senha"

                        role="dialog"

                        aria-modal="true"

                        aria-labelledby="titulo-modal-senha"

                        onClick={event =>
                            event.stopPropagation()
                        }

                        onSubmit={alterarSenha}
                    >

                        <h2 id="titulo-modal-senha">

                            Alterar Senha

                        </h2>

                        <p className="descricao-modal-senha">

                            Informe sua senha atual e escolha
                            uma nova senha com pelo menos
                            8 caracteres.

                        </p>

                        {erroSenha && (

                            <p
                                className="erro-modal-senha"

                                role="alert"
                            >

                                {erroSenha}

                            </p>

                        )}

                        {/* SENHA ATUAL */}

                        <label htmlFor="senhaAtual">

                            Senha atual

                        </label>

                        <input
                            id="senhaAtual"

                            type={
                                mostrarSenha
                                    ? "text"
                                    : "password"
                            }

                            name="senhaAtual"

                            value={senhas.senhaAtual}

                            onChange={atualizarSenha}

                            autoComplete="current-password"

                            disabled={salvandoSenha}

                            autoFocus

                            required
                        />

                        {/* NOVA SENHA */}

                        <label htmlFor="novaSenha">

                            Nova senha

                        </label>

                        <input
                            id="novaSenha"

                            type={
                                mostrarSenha
                                    ? "text"
                                    : "password"
                            }

                            name="novaSenha"

                            value={senhas.novaSenha}

                            onChange={atualizarSenha}

                            autoComplete="new-password"

                            minLength={8}

                            disabled={salvandoSenha}

                            required
                        />

                        {/* CONFIRMAR SENHA */}

                        <label htmlFor="confirmarSenha">

                            Confirmar nova senha

                        </label>

                        <input
                            id="confirmarSenha"

                            type={
                                mostrarSenha
                                    ? "text"
                                    : "password"
                            }

                            name="confirmarSenha"

                            value={senhas.confirmarSenha}

                            onChange={atualizarSenha}

                            autoComplete="new-password"

                            minLength={8}

                            disabled={salvandoSenha}

                            required
                        />

                        {/* MOSTRAR SENHAS */}

                        <label className="mostrar-senha-perfil">

                            <input
                                type="checkbox"

                                checked={mostrarSenha}

                                onChange={event =>

                                    setMostrarSenha(
                                        event.target.checked
                                    )

                                }

                                disabled={salvandoSenha}
                            />

                            Mostrar senhas

                        </label>

                        {/* BOTÕES */}

                        <div className="botoes-modal-senha">

                            <button
                                type="button"

                                onClick={fecharModalSenha}

                                disabled={salvandoSenha}
                            >

                                Cancelar

                            </button>

                            <button
                                type="submit"

                                disabled={salvandoSenha}
                            >

                                {salvandoSenha

                                    ? "Salvando..."

                                    : "Salvar nova senha"}

                            </button>

                        </div>

                    </form>

                </div>

            )}

        </div>

    );

}

export default EditarPerfil;