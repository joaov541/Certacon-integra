
import { useEffect, useRef, useState } from "react";
import "./editarperfil.css";

import { NavLink, useNavigate } from "react-router-dom";
import { requisicaoApi } from "../../services/api";

import CasaBranca from "../../assets/Icones/CasaBranca.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
import SairBranco from "../../assets/Icones/SairBranco.png";

import Pessoa from "../../assets/Icones/Pessoa.png";
import ChaveSenha from "../../assets/Icones/ChaveSenha.png";
import TelefonePerfil from "../../assets/Icones/TelefonePerfil.png";
import SairCinza from "../../assets/Icones/SairCinza.png";
import EmailPerfil from "../../assets/Icones/EmailPerfil.png";
import EscudoCinzaPerfil from "../../assets/Icones/EscudoCinzaPerfil.png";
import EmpresaPerfil from "../../assets/Icones/EmpresaPerfil.png";
import FusoHorario from "../../assets/Icones/FusoHorario.png";
import Idioma from "../../assets/Icones/Idioma.png";
import PredioPerfil from "../../assets/Icones/PredioPerfil.png";

import Header from "../../components/Header/header";

const perfilInicial = {
    nome: "",
    cargo: "",
    email: "",
    telefone: "",
    departamento: "",
    empresa: "",
    cnpj: "",
};

function EditarPerfil() {
    const navigate = useNavigate();
    const inputFotoRef = useRef(null);
    const [fotoPerfil, setFotoPerfil] = useState(null);
    const [salvandoFoto, setSalvandoFoto] = useState(false);
    const [erroFoto, setErroFoto] = useState("");

    const [modoEdicao, setModoEdicao] = useState(false);
    const [perfil, setPerfil] = useState(perfilInicial);
    const [perfilOriginal, setPerfilOriginal] = useState(perfilInicial);

    const [pesquisa, setPesquisa] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);

    const [modalSenha, setModalSenha] = useState(false);
    const [salvandoSenha, setSalvandoSenha] = useState(false);

    const [senhas, setSenhas] = useState({
        senhaAtual: "",
        novaSenha: "",
        confirmarSenha: "",
    });

    // A imagem vem da API e fica associada ao GUID do usuário autenticado.
    useEffect(() => {
        let ativo = true;
        requisicaoApi("/api/FotoPerfil")
            .then(dados => { if (ativo) setFotoPerfil(dados?.foto || null); })
            .catch(erro => { if (ativo) setErroFoto(erro.message || "Não foi possível carregar a foto."); });
        return () => { ativo = false; };
    }, []);

    async function alterarFoto(event) {
        const arquivo = event.target.files?.[0];
        event.target.value = "";
        if (!arquivo) return;
        setErroFoto("");
        if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) {
            setErroFoto("Escolha uma imagem JPG, PNG ou WEBP.");
            return;
        }
        if (arquivo.size > 2 * 1024 * 1024) {
            setErroFoto("A foto deve ter no máximo 2 MB.");
            return;
        }
        const dados = new FormData();
        dados.append("arquivo", arquivo);
        try {
            setSalvandoFoto(true);
            const resposta = await requisicaoApi("/api/FotoPerfil", {
                method: "POST",
                body: dados
            });
            setFotoPerfil(resposta?.foto || null);
            // Permite que cabeçalhos compartilhados atualizem o avatar futuramente.
            window.dispatchEvent(new Event("foto-perfil-atualizada"));
        } catch (erro) {
            setErroFoto(erro.message || "Não foi possível salvar a foto.");
        } finally {
            setSalvandoFoto(false);
        }
    }

    async function removerFoto() {
        if (!window.confirm("Deseja remover sua foto de perfil?")) return;
        setErroFoto("");
        try {
            setSalvandoFoto(true);
            await requisicaoApi("/api/FotoPerfil", { method: "DELETE" });
            setFotoPerfil(null);
            window.dispatchEvent(new Event("foto-perfil-atualizada"));
        } catch (erro) {
            setErroFoto(erro.message || "Não foi possível remover a foto.");
        } finally {
            setSalvandoFoto(false);
        }
    }

    // Consulta os dados do usuário autenticado.
    useEffect(() => {
        async function carregarPerfil() {
            try {
                setCarregando(true);

                const dados = await requisicaoApi("/api/MeuPerfil");

                const perfis = Array.isArray(dados.perfis)
                    ? dados.perfis
                    : [];

                const ehCliente = perfis.includes("Cliente");

                const perfilRecebido = {
                    nome: dados.nome || "",
                    cargo: perfis.join(", ") || "Não informado",
                    email: dados.email || "",
                    telefone: dados.telefoneContato || "",
                    departamento: ehCliente
                        ? "Cliente"
                        : "Fiscal",
                    empresa: dados.razaoSocial || "Certacon",
                    cnpj: dados.cnpj || "",
                };

                setPerfil(perfilRecebido);
                setPerfilOriginal(perfilRecebido);

            } catch (erro) {
                console.error("Erro ao carregar perfil:", erro);

                alert(
                    erro.message ||
                    "Não foi possível carregar seu perfil."
                );

            } finally {
                setCarregando(false);
            }
        }

        carregarPerfil();
    }, []);

    // Atualiza os campos editáveis.
    function atualizarCampo(e) {
        const { name, value } = e.target;

        setPerfil((anterior) => ({
            ...anterior,
            [name]: value,
        }));
    }

    // Ativa o modo de edição.
    function editarPerfil() {
        setModoEdicao(true);
    }

    // Cancela alterações ainda não salvas.
    function cancelarEdicao() {
        setPerfil(perfilOriginal);
        setModoEdicao(false);
    }

    // Salva os dados pessoais na API.
    async function salvarPerfil() {
        if (!perfil.nome.trim() || !perfil.email.trim()) {
            alert("Preencha o nome e o e-mail.");
            return;
        }

        try {
            setSalvando(true);

            await requisicaoApi("/api/MeuPerfil", {
                method: "PUT",
                body: JSON.stringify({
                    nome: perfil.nome.trim(),
                    email: perfil.email.trim(),
                    telefoneContato: perfil.telefone.trim() || null,
                }),
            });

            const perfilAtualizado = {
                ...perfil,
                nome: perfil.nome.trim(),
                email: perfil.email.trim(),
                telefone: perfil.telefone.trim(),
            };

            setPerfil(perfilAtualizado);
            setPerfilOriginal(perfilAtualizado);

            // Atualiza dados locais utilizados em outras telas,
            // caso estejam armazenados no localStorage.
            const usuarioSalvo = localStorage.getItem("usuario");

            if (usuarioSalvo) {
                try {
                    const usuario = JSON.parse(usuarioSalvo);

                    localStorage.setItem(
                        "usuario",
                        JSON.stringify({
                            ...usuario,
                            nome: perfilAtualizado.nome,
                            email: perfilAtualizado.email,
                        })
                    );
                } catch {
                    // O perfil já foi atualizado na API.
                }
            }

            setModoEdicao(false);
            alert("Perfil atualizado com sucesso!");

        } catch (erro) {
            console.error("Erro ao salvar perfil:", erro);

            alert(
                erro.message ||
                "Não foi possível atualizar seu perfil."
            );

        } finally {
            setSalvando(false);
        }
    }

    // Atualiza os campos do formulário de senha.
    function atualizarSenha(e) {
        const { name, value } = e.target;

        setSenhas((anterior) => ({
            ...anterior,
            [name]: value,
        }));
    }

    function fecharModalSenha() {
        if (salvandoSenha) return;

        setModalSenha(false);

        setSenhas({
            senhaAtual: "",
            novaSenha: "",
            confirmarSenha: "",
        });
    }

    // Altera a senha usando o endpoint protegido.
    async function alterarSenha(e) {
        e.preventDefault();

        if (
            !senhas.senhaAtual ||
            !senhas.novaSenha ||
            !senhas.confirmarSenha
        ) {
            alert("Preencha todos os campos.");
            return;
        }

        if (senhas.novaSenha.length < 8) {
            alert("A nova senha deve ter pelo menos 8 caracteres.");
            return;
        }

        if (senhas.novaSenha !== senhas.confirmarSenha) {
            alert("A confirmação da senha não corresponde.");
            return;
        }

        if (senhas.senhaAtual === senhas.novaSenha) {
            alert("A nova senha deve ser diferente da atual.");
            return;
        }

        try {
            setSalvandoSenha(true);

            await requisicaoApi("/api/MeuPerfil/alterar-senha", {
                method: "PUT",
                body: JSON.stringify({
                    senhaAtual: senhas.senhaAtual,
                    novaSenha: senhas.novaSenha,
                }),
            });

            alert("Senha alterada com sucesso!");
            setModalSenha(false);

            setSenhas({
                senhaAtual: "",
                novaSenha: "",
                confirmarSenha: "",
            });

        } catch (erro) {
            console.error("Erro ao alterar senha:", erro);

            alert(
                erro.message ||
                "Não foi possível alterar a senha."
            );

        } finally {
            setSalvandoSenha(false);
        }
    }

    return (
        <div className="pagina-perfil">
            <Sidebar />

            <main className="principal-perfil">
                <Header
                    pesquisa={pesquisa}
                    setPesquisa={setPesquisa}
                />

                <section className="conteudo-perfil">
                    <NavLink to="/home" className="voltar-perfil">
                        ← Voltar
                    </NavLink>

                    <h1>Meu Perfil</h1>

                    {carregando ? (
                        <p>Carregando informações do perfil...</p>
                    ) : (
                        <div className="area-perfil">

                            {/* CARTÃO PRINCIPAL */}
                            <div className="cartao-perfil">

                                <div className="area-foto-edicao">
                                    <div className="foto-perfil1">
                                        <img src={fotoPerfil || Pessoa} alt="Foto do usuário" />
                                    </div>
                                    <input
                                        ref={inputFotoRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={alterarFoto}
                                        hidden
                                        aria-label="Selecionar foto de perfil"
                                    />
                                    <div className="acoes-foto-perfil">
                                        <button type="button"
                                            onClick={() => inputFotoRef.current?.click()}
                                            disabled={salvandoFoto}>
                                            {salvandoFoto ? "Salvando..." : fotoPerfil ? "Trocar foto" : "Adicionar foto"}
                                        </button>
                                        {fotoPerfil && (
                                            <button type="button" onClick={removerFoto} disabled={salvandoFoto}>
                                                Remover foto
                                            </button>
                                        )}
                                    </div>
                                    {erroFoto && <p className="erro-foto-perfil" role="alert">{erroFoto}</p>}
                                </div>

                                <div className="identificacao-perfil">
                                    {modoEdicao ? (
                                        <>
                                            <input
                                                type="text"
                                                name="nome"
                                                value={perfil.nome}
                                                onChange={atualizarCampo}
                                                className="input-nome-perfil"
                                                maxLength={150}
                                            />

                                            {/* Perfil de acesso não é editável */}
                                            <p>{perfil.cargo}</p>
                                        </>
                                    ) : (
                                        <>
                                            <h2>{perfil.nome}</h2>
                                            <p>{perfil.cargo}</p>
                                        </>
                                    )}
                                </div>

                                <div className="informacoes-perfil">

                                    <div className="informacao-item">
                                        <img src={EmailPerfil} alt="" />

                                        <div>
                                            <span>Email Corporativo</span>

                                            {modoEdicao ? (
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={perfil.email}
                                                    onChange={atualizarCampo}
                                                />
                                            ) : (
                                                <p>{perfil.email}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="informacao-item">
                                        <img src={TelefonePerfil} alt="" />

                                        <div>
                                            <span>Telefone de Contato</span>

                                            {modoEdicao ? (
                                                <input
                                                    type="tel"
                                                    name="telefone"
                                                    value={perfil.telefone}
                                                    onChange={atualizarCampo}
                                                />
                                            ) : (
                                                <p>
                                                    {perfil.telefone ||
                                                        "Não informado"}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="informacao-item">
                                        <img src={PredioPerfil} alt="" />

                                        <div>
                                            <span>Departamento</span>
                                            <p>{perfil.departamento}</p>
                                        </div>
                                    </div>

                                    <div className="informacao-item">
                                        <img src={EmpresaPerfil} alt="" />

                                        <div>
                                            <span>Empresa Vinculada</span>
                                            <p>{perfil.empresa}</p>
                                        </div>
                                    </div>

                                    {perfil.cnpj && (
                                        <div className="informacao-item">
                                            <img src={EmpresaPerfil} alt="" />

                                            <div>
                                                <span>CNPJ</span>
                                                <p>{perfil.cnpj}</p>
                                            </div>
                                        </div>
                                    )}

                                </div>

                                <div className="acoes-perfil">
                                    {modoEdicao ? (
                                        <>
                                            <button
                                                type="button"
                                                className="botao-salvar-perfil"
                                                onClick={salvarPerfil}
                                                disabled={salvando}
                                            >
                                                {salvando
                                                    ? "Salvando..."
                                                    : "Salvar alterações"}
                                            </button>

                                            <button
                                                type="button"
                                                className="botao-cancelar-perfil"
                                                onClick={cancelarEdicao}
                                                disabled={salvando}
                                            >
                                                Cancelar
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            className="botao-editar-perfil"
                                            onClick={editarPerfil}
                                        >
                                            Editar Perfil
                                        </button>
                                    )}
                                </div>

                            </div>

                            {/* CARTÕES LATERAIS */}
                            <div className="configuracoes-perfil">

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
                                            <img src={SairCinza} alt="" />
                                        </span>

                                        <div>
                                            <span>Último login</span>
                                            <p>Não disponível</p>
                                        </div>
                                    </div>

                                    <div className="linha-configuracao"></div>

                                    <button
                                        type="button"
                                        className="alterar-senha"
                                        onClick={() => setModalSenha(true)}
                                    >
                                        <img src={ChaveSenha} alt="" />
                                        Alterar Senha
                                    </button>
                                </div>

                                <div className="cartao-configuracao cartao-preferencias">
                                    <h3>Preferências</h3>

                                    <div className="configuracao-item">
                                        <span className="icone-configuracao">
                                            <img src={Idioma} alt="" />
                                        </span>

                                        <div>
                                            <span>Idioma</span>
                                            <p>Português - BR</p>
                                        </div>
                                    </div>

                                    <div className="configuracao-item">
                                        <span className="icone-configuracao">
                                            <img src={FusoHorario} alt="" />
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
                </section>
            </main>

            {/* MODAL DE ALTERAÇÃO DE SENHA */}
            {modalSenha && (
                <div
                    className="fundo-modal-senha"
                    onClick={fecharModalSenha}
                >
                    <form
                        className="modal-alterar-senha"
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={alterarSenha}
                    >
                        <h2>Alterar Senha</h2>

                        <label htmlFor="senhaAtual">
                            Senha atual
                        </label>
                        <input
                            id="senhaAtual"
                            type="password"
                            name="senhaAtual"
                            value={senhas.senhaAtual}
                            onChange={atualizarSenha}
                            autoComplete="current-password"
                            required
                        />

                        <label htmlFor="novaSenha">
                            Nova senha
                        </label>
                        <input
                            id="novaSenha"
                            type="password"
                            name="novaSenha"
                            value={senhas.novaSenha}
                            onChange={atualizarSenha}
                            autoComplete="new-password"
                            minLength={8}
                            required
                        />

                        <label htmlFor="confirmarSenha">
                            Confirmar nova senha
                        </label>
                        <input
                            id="confirmarSenha"
                            type="password"
                            name="confirmarSenha"
                            value={senhas.confirmarSenha}
                            onChange={atualizarSenha}
                            autoComplete="new-password"
                            minLength={8}
                            required
                        />

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

function Sidebar() {
    const navigate = useNavigate();

    // Os perfis são usados apenas para ajustar a interface.
    // A API continua sendo responsável pela autorização real.
    let perfis = [];
    try {
        const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
        const salvos = JSON.parse(localStorage.getItem("perfis") || "[]");
        const lista = Array.isArray(usuario.perfis) ? usuario.perfis : salvos;
        perfis = Array.isArray(lista) ? lista : [];
    } catch {
        perfis = [];
    }

    const ehAdministrador = perfis.includes("Administrador");
    const podeVerNotas = perfis.some(perfil => [
        "Coordenador Fiscal",
        "Analista SPED",
        "Analista de Documentos Fiscais",
        "Analista de Reforma Tributária",
        "Cliente"
    ].includes(perfil));

    function sair() {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        localStorage.removeItem("perfis");
        navigate("/login", { replace: true });
    }

    return (
        <aside className="menu-perfil">
            <nav className="navegacao-perfil">
                <NavLink to="/home" className="item-menu-perfil">
                    <img src={CasaBranca} alt="" />
                    <span>Início</span>
                </NavLink>
                <NavLink to="/conteudos" className="item-menu-perfil">
                    <img src={LivroBranco} alt="" />
                    <span>Conteúdos</span>
                </NavLink>
                {podeVerNotas && (
                    <NavLink to="/notas-fiscais" className="item-menu-perfil">
                        <img src={DoisDocumentosBranco} alt="" />
                        <span>Notas Fiscais</span>
                    </NavLink>
                )}
                {ehAdministrador && (
                    <>
                        <NavLink to="/clientes" className="item-menu-perfil">
                            <img src={ADDProfileBranco} alt="" />
                            <span>Clientes</span>
                        </NavLink>
                        <NavLink to="/usuario" className="item-menu-perfil">
                            <img src={PessoaBranca} alt="" />
                            <span>Usuários</span>
                        </NavLink>
                    </>
                )}
            </nav>
            <button type="button" className="sair-perfil" onClick={sair}>
                <img src={SairBranco} alt="" />
                <span>Sair</span>
            </button>
        </aside>
    );
}

export default EditarPerfil;
