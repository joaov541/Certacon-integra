import { classeCorTema } from "../../utils/coresTemas";
import "../../styles/coresTemas.css";
import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./conteudoTributario.css";

import { requisicaoApi } from "../../services/api";

import CasaBranca from "../../assets/Icones/CasaBranca.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
import LupaCinza from "../../assets/Icones/LupaCinza.png";
import ExpandirText from "../../assets/Icones/ExpandirText.png";
import SairBranco from "../../assets/Icones/SairBranco.png";
import Lixeira from "../../assets/Icones/Lixeira.png";
import LogoNome from "../../assets/Icones/LogoNome.png";
import iconeConteudo from "../../assets/Icones/DoisDocumentos.png";

import Header from "../../components/Header/header";
import HeaderDesktop from "../../components/Header/headerDesktop";

// Perfis do usuário autenticado (apenas para exibição da interface).
// A autorização real continua sendo validada na API.
function obterPerfisLogados() {
    try {
        const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
        const armazenados = JSON.parse(localStorage.getItem("perfis") || "[]");
        return Array.isArray(usuario.perfis) && usuario.perfis.length > 0
            ? usuario.perfis
            : Array.isArray(armazenados) ? armazenados : [];
    } catch {
        return [];
    }
}

const PERFIS_FISCAIS = [
    "Coordenador Fiscal",
    "Analista SPED",
    "Analista de Documentos Fiscais",
    "Analista de Reforma Tributária",
    "Cliente"
];

function ConteudoTributario() {

    const navigate = useNavigate();

    // =========================================
    // ESTADOS
    // =========================================

    const [conteudos, setConteudos] = useState([]);
    const [meusConteudos, setMeusConteudos] = useState([]);

    const [abaSelecionada, setAbaSelecionada] = useState("publicados");

    const [pesquisa, setPesquisa] = useState("");
    const [temaSelecionado, setTemaSelecionado] = useState("Todos");
    const [ordem, setOrdem] = useState("recentes");

    const [carregando, setCarregando] = useState(true);
    const [carregandoMeus, setCarregandoMeus] = useState(false);

    const [erro, setErro] = useState("");
    const [erroMeus, setErroMeus] = useState("");

    const [enviandoRevisao, setEnviandoRevisao] = useState(null);

    // =========================================
    // DADOS E PERMISSÕES DO USUÁRIO
    // =========================================

    const perfis = obterPerfisLogados();

    // Administrador administra o portal; criação é função da equipe fiscal.
    const podeCriar = [
        "Coordenador Fiscal",
        "Analista SPED",
        "Analista de Documentos Fiscais",
        "Analista de Reforma Tributária"
    ].some(perfil => perfis.includes(perfil));

    // Arquivamento exibido somente a quem já tem a ação prevista na API.
    const podeArquivar = perfis.includes("Administrador") ||
        perfis.includes("Coordenador Fiscal");

    // A coluna Ações só existe quando há operações disponíveis nessa aba.
    const exibirAcoes = abaSelecionada === "meus" || podeArquivar;
    const totalColunas = 4 + (abaSelecionada === "meus" ? 1 : 0) + (exibirAcoes ? 1 : 0);

    // =========================================
    // CARREGAR CONTEÚDOS PUBLICADOS
    // =========================================

    async function carregarConteudos() {

        try {

            setCarregando(true);
            setErro("");

            const dados = await requisicaoApi("/api/Artigos");

            setConteudos(Array.isArray(dados) ? dados : []);

        } catch (error) {

            console.error("Erro ao carregar conteúdos:", error);

            setErro(
                error.message ||
                "Não foi possível carregar os conteúdos."
            );

        } finally {

            setCarregando(false);

        }
    }

    // =========================================
    // CARREGAR MEUS CONTEÚDOS
    // =========================================

    async function carregarMeusConteudos() {

        if (!podeCriar) return;

        try {

            setCarregandoMeus(true);
            setErroMeus("");

            const dados = await requisicaoApi(
                "/api/Artigos/meus-artigos"
            );

            setMeusConteudos(
                Array.isArray(dados) ? dados : []
            );

        } catch (error) {

            console.error("Erro ao carregar meus conteúdos:", error);

            setErroMeus(
                error.message ||
                "Não foi possível carregar seus conteúdos."
            );

        } finally {

            setCarregandoMeus(false);

        }
    }

    // =========================================
    // CARREGAR AS DUAS LISTAS
    // =========================================

    useEffect(() => {

        carregarConteudos();

        if (podeCriar) {
            carregarMeusConteudos();
        }

    }, []);

    // =========================================
    // FORMATAÇÃO DE DATA
    // =========================================

    function formatarData(data) {

        if (!data) {
            return "Data não informada";
        }

        const dataFormatada = new Date(data);

        if (isNaN(dataFormatada.getTime())) {
            return "Data não informada";
        }

        return dataFormatada.toLocaleDateString("pt-BR");

    }

    // =========================================
    // NORMALIZAR STATUS
    // =========================================

    function normalizarStatus(status) {

        return (status || "")
            .toString()
            .trim()
            .toUpperCase();

    }

    // =========================================
    // TEMAS DISPONÍVEIS PARA FILTRO
    // =========================================

    const listaAtual = abaSelecionada === "publicados"
        ? conteudos
        : meusConteudos;

    const temasDisponiveis = [
        ...new Set(
            listaAtual
                .map(conteudo => conteudo.tema)
                .filter(Boolean)
        )
    ];

    // =========================================
    // PESQUISA, FILTRO E ORDENAÇÃO
    // =========================================

    const listaFiltrada = listaAtual

        .filter((conteudo) => {

            const texto = pesquisa.toLowerCase();

            const titulo = (conteudo.titulo || "").toLowerCase();
            const tema = (conteudo.tema || "").toLowerCase();
            const resumo = (conteudo.resumo || "").toLowerCase();

            const encontrouTexto =
                titulo.includes(texto) ||
                tema.includes(texto) ||
                resumo.includes(texto);

            const encontrouTema =
                temaSelecionado === "Todos" ||
                conteudo.tema === temaSelecionado;

            return encontrouTexto && encontrouTema;

        })

        .sort((a, b) => {

            const dataA = new Date(
                abaSelecionada === "publicados"
                    ? a.dataPublicacao || 0
                    : a.dataCriacao || 0
            ).getTime();

            const dataB = new Date(
                abaSelecionada === "publicados"
                    ? b.dataPublicacao || 0
                    : b.dataCriacao || 0
            ).getTime();

            return ordem === "recentes"
                ? dataB - dataA
                : dataA - dataB;

        });

    // =========================================
    // COR DA ETIQUETA DO TEMA
    // =========================================

    function classeTema(tema) {

        const nomeTema = (tema || "").toLowerCase();

        if (nomeTema.includes("reforma")) {
            return "tema-reforma-tributaria";
        }

        if (
            nomeTema.includes("sped") ||
            nomeTema.includes("efd")
        ) {
            return "tema-sped";
        }

        if (
            nomeTema.includes("nota") ||
            nomeTema.includes("nf-e") ||
            nomeTema.includes("nfp") ||
            nomeTema.includes("xml")
        ) {
            return "tema-notas-fiscais";
        }

        if (nomeTema.includes("icms")) {
            return "tema-icms";
        }

        return "tema-padrao";

    }

    // =========================================
    // CLASSE DO STATUS
    // =========================================

    function classeStatus(status) {

        const statusNormalizado = normalizarStatus(status);

        switch (statusNormalizado) {

            case "RASCUNHO":
                return "status-rascunho";

            case "EM_REVISAO":
                return "status-em-revisao";

            case "APROVADO":
                return "status-aprovado";

            case "PUBLICADO":
                return "status-publicado";

            case "REJEITADO":
                return "status-rejeitado";

            case "ARQUIVADO":
                return "status-arquivado";

            default:
                return "status-padrao";

        }

    }

    // =========================================
    // TEXTO DO STATUS
    // =========================================

    function textoStatus(status) {

        const statusNormalizado = normalizarStatus(status);

        const nomes = {
            RASCUNHO: "Rascunho",
            EM_REVISAO: "Em revisão",
            APROVADO: "Aprovado",
            PUBLICADO: "Publicado",
            REJEITADO: "Rejeitado",
            ARQUIVADO: "Arquivado"
        };

        return nomes[statusNormalizado] || status || "Não informado";

    }

    // =========================================
    // ABRIR DETALHES
    // =========================================

    
function abrirDetalhes(conteudo) {
    navigate("/conteudos/detalhes", {
        state: {
            conteudo: {
                id: conteudo.artigoId,
                artigoId: conteudo.artigoId,

                titulo: conteudo.titulo,
                tema: conteudo.tema,

                data: formatarData(
                    conteudo.dataPublicacao ||
                    conteudo.dataCriacao
                ),

                dataPublicacao: conteudo.dataPublicacao,
                autor: conteudo.autor || "Não informado",

                resumo: conteudo.resumo,
                conteudo: conteudo.conteudo,

                visibilidade: conteudo.visibilidade,
                status: conteudo.status,

                // INFORMAÇÕES DO DOCUMENTO ANEXADO
                nomeArquivo: conteudo.nomeArquivo,
                tamanhoArquivo: conteudo.tamanhoArquivo,
                temArquivo: conteudo.temArquivo
            }
        }
    });
}


    // =========================================
    // EDITAR RASCUNHO
    // =========================================

    function editarConteudo(conteudo) {

        navigate(
            `/conteudos/editar/${conteudo.artigoId}`,
            {
                state: {
                    conteudo: {
                        artigoId: conteudo.artigoId,
                        temaId: conteudo.temaId,
                        titulo: conteudo.titulo,
                        conteudo: conteudo.conteudo
                    }
                }
            }
        );

    }

    // =========================================
    // ENVIAR ARTIGO PARA REVISÃO
    // =========================================

    async function enviarParaRevisao(id) {

        const confirmar = window.confirm(
            "Deseja enviar este conteúdo para revisão?"
        );

        if (!confirmar) return;

        try {

            setEnviandoRevisao(id);

            const resposta = await requisicaoApi(
                `/api/Artigos/${id}/enviar-revisao`,
                {
                    method: "POST"
                }
            );

            alert(
                resposta?.mensagem ||
                "Conteúdo enviado para revisão com sucesso!"
            );

            // Atualiza o status na tela sem precisar recarregar.
            setMeusConteudos(atuais =>

                atuais.map(conteudo =>

                    conteudo.artigoId === id

                        ? {
                            ...conteudo,
                            status: "EM_REVISAO"
                        }

                        : conteudo

                )

            );

        } catch (error) {

            console.error("Erro ao enviar para revisão:", error);

            alert(
                error.message ||
                "Não foi possível enviar o conteúdo para revisão."
            );

        } finally {

            setEnviandoRevisao(null);

        }

    }

    // =========================================
    // ARQUIVAR CONTEÚDO
    // =========================================

    async function excluirConteudo(id) {

        const confirmar = window.confirm(
            "Deseja realmente arquivar este conteúdo?"
        );

        if (!confirmar) return;

        try {

            await requisicaoApi(`/api/Artigos/${id}`, {
                method: "DELETE"
            });

            setConteudos(atuais =>
                atuais.filter(conteudo => conteudo.artigoId !== id)
            );

            setMeusConteudos(atuais =>
                atuais.filter(conteudo => conteudo.artigoId !== id)
            );

            alert("Conteúdo arquivado com sucesso!");

        } catch (error) {

            console.error("Erro ao arquivar conteúdo:", error);

            alert(
                error.message ||
                "Não foi possível arquivar este conteúdo."
            );

        }

    }

    // =========================================
    // SAIR DO SISTEMA
    // =========================================

    function sairSistema() {

        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        localStorage.removeItem("perfis");

        navigate("/login", { replace: true });

    }

    // =========================================
    // TELA
    // =========================================

    return (

        <div className="pagina-conteudos">

            <Sidebar sairSistema={sairSistema} />

            <main className="principal-conteudos">

                {/* HEADER DESKTOP */}

                <HeaderDesktop
                    pesquisa={pesquisa}
                    setPesquisa={setPesquisa}
                />

                {/* HEADER RESPONSIVO */}

                <Header
                    pesquisa={pesquisa}
                    setPesquisa={setPesquisa}
                />

                <section className="area-lista-conteudos">

                    {/* TÍTULO */}

                    <div className="titulo-conteudos">

                        <div>

                            <h1>Conteúdos Tributários</h1>

                            <p>
                                Explore conteúdos por tema, mantenha-se conectado
                            </p>

                        </div>

                        {podeCriar && (

                            <button
                                type="button"
                                className="adicionar-conteudo"
                                onClick={() => navigate("/conteudos/novo")}
                            >

                                <span className="adicionar-conteudo-texto">
                                    + Adicionar Conteúdo
                                </span>

                                <span className="adicionar-conteudo-mais">
                                    +
                                </span>

                            </button>

                        )}

                    </div>

                    {/* ABAS */}

                    <div className="abas-conteudos">

                        <button
                            type="button"
                            className={
                                abaSelecionada === "publicados"
                                    ? "aba-conteudos aba-conteudos-ativa"
                                    : "aba-conteudos"
                            }
                            onClick={() => {
                                setAbaSelecionada("publicados");
                                setTemaSelecionado("Todos");
                            }}
                        >
                            Todos os conteúdos
                        </button>

                        {podeCriar && (

                            <button
                                type="button"
                                className={
                                    abaSelecionada === "meus"
                                        ? "aba-conteudos aba-conteudos-ativa"
                                        : "aba-conteudos"
                                }
                                onClick={() => {
                                    setAbaSelecionada("meus");
                                    setTemaSelecionado("Todos");
                                }}
                            >
                                Meus conteúdos
                            </button>

                        )}

                    </div>

                    {/* FILTROS */}

                    <div className="filtros-conteudos">

                        <div className="pesquisa-lista-conteudos">

                            <img src={LupaCinza} alt="" />

                            <input
                                type="text"
                                placeholder="Buscar por título ou palavra-chave"
                                value={pesquisa}
                                onChange={(e) =>
                                    setPesquisa(e.target.value)
                                }
                            />

                        </div>

                        <div className="seletor-conteudos">

                            <select
                                value={temaSelecionado}
                                onChange={(e) =>
                                    setTemaSelecionado(e.target.value)
                                }
                            >

                                <option value="Todos">
                                    Todos os temas
                                </option>

                                {temasDisponiveis.map(tema => (

                                    <option key={tema} value={tema}>
                                        {tema}
                                    </option>

                                ))}

                            </select>

                            <img src={ExpandirText} alt="" />

                        </div>

                        <div className="seletor-conteudos">

                            <select
                                value={ordem}
                                onChange={(e) => setOrdem(e.target.value)}
                            >

                                <option value="recentes">
                                    Mais recentes
                                </option>

                                <option value="antigos">
                                    Mais antigos
                                </option>

                            </select>

                            <img src={ExpandirText} alt="" />

                        </div>

                    </div>

                    {/* TABELA */}
                    <div className="tabela-conteudos">
                        <table
                            className={
                                abaSelecionada === "publicados" && !podeArquivar
                                    ? "tabela-sem-acoes"
                                    : ""
                            }
                        >

                            <thead>

                                <tr>
                                    <th>Título</th>

                                    <th>Tema</th>

                                    <th>
                                        {abaSelecionada === "publicados"
                                            ? "Data de publicação"
                                            : "Data de criação"}
                                    </th>

                                    <th>Autor</th>

                                    {/* Status aparece apenas em Meus conteúdos */}
                                    {abaSelecionada === "meus" && (
                                        <th>Status</th>
                                    )}

                                    {/* Ações aparecem apenas para usuários autorizados */}
                                    {exibirAcoes && (
                                        <th className="coluna-acoes">
                                            Ações
                                        </th>
                                    )}
                                </tr>

                            </thead>

                            <tbody>

                                {(abaSelecionada === "publicados"
                                    ? carregando
                                    : carregandoMeus) ? (

                                    <tr>

                                        <td
                                            colSpan={totalColunas}
                                            className="sem-conteudos"
                                        >
                                            Carregando conteúdos...
                                        </td>

                                    </tr>

                                ) : (abaSelecionada === "publicados"
                                    ? erro
                                    : erroMeus) ? (

                                    <tr>

                                        <td
                                            colSpan={totalColunas}
                                            className="sem-conteudos"
                                        >
                                            {abaSelecionada === "publicados"
                                                ? erro
                                                : erroMeus}
                                        </td>

                                    </tr>

                                ) : listaFiltrada.length > 0 ? (

                                    listaFiltrada.map((conteudo) => {

                                        const status = normalizarStatus(
                                            conteudo.status
                                        );

                                        const ehRascunho =
                                            status === "RASCUNHO";

                                        return (

                                            <tr
                                                key={conteudo.artigoId}
                                                className="linha-conteudo-clicavel"
                                                onClick={() =>
                                                    abrirDetalhes(conteudo)
                                                }
                                            >

                                                <td className="celula-titulo">

                                                    <img
                                                        src={iconeConteudo}
                                                        alt=""
                                                        className="icone-card-conteudo"
                                                    />

                                                    <strong>
                                                        {conteudo.titulo}
                                                    </strong>

                                                </td>

                                                <td className="celula-tema">

                                                   <span
    className={`etiqueta-tema ${classeCorTema(conteudo.tema)}`}
>
    {conteudo.tema || "Sem tema"}
</span>

                                                </td>

                                                <td className="celula-data">

                                                    {formatarData(
                                                        abaSelecionada === "publicados"
                                                            ? conteudo.dataPublicacao
                                                            : conteudo.dataCriacao
                                                    )}

                                                </td>

                                                <td className="celula-autor">

                                                    {conteudo.autor || "Não informado"}

                                                </td>

                                                {abaSelecionada === "meus" && (

                                                    <td>

                                                        <span
                                                            className={`etiqueta-status-artigo ${classeStatus(status)}`}
                                                        >
                                                            {textoStatus(status)}
                                                        </span>

                                                    </td>

                                                )}

                                                {exibirAcoes && (
                                                    <td className="coluna-acoes">

                                                        <div className="acoes-artigo">

                                                            {/* EDITAR SOMENTE RASCUNHO */}

                                                            {abaSelecionada === "meus" &&
                                                                ehRascunho && (

                                                                    <button
                                                                        type="button"
                                                                        className="acao-editar-artigo"
                                                                        title="Editar rascunho"
                                                                        onClick={(event) => {

                                                                            event.stopPropagation();

                                                                            editarConteudo(conteudo);

                                                                        }}
                                                                    >
                                                                        Editar
                                                                    </button>

                                                                )}

                                                            {/* ENVIAR PARA REVISÃO SOMENTE RASCUNHO */}

                                                            {abaSelecionada === "meus" &&
                                                                ehRascunho && (

                                                                    <button
                                                                        type="button"
                                                                        className="acao-enviar-revisao"
                                                                        title="Enviar para revisão"
                                                                        disabled={
                                                                            enviandoRevisao === conteudo.artigoId
                                                                        }
                                                                        onClick={(event) => {

                                                                            event.stopPropagation();

                                                                            enviarParaRevisao(
                                                                                conteudo.artigoId
                                                                            );

                                                                        }}
                                                                    >
                                                                        {enviandoRevisao === conteudo.artigoId
                                                                            ? "Enviando..."
                                                                            : "Enviar"}
                                                                    </button>

                                                                )}

                                                            {/* ARQUIVAR */}

                                                            {abaSelecionada === "publicados" &&
                                                                podeArquivar && (

                                                                    <button
                                                                        type="button"
                                                                        className="excluir-conteudo"
                                                                        title="Arquivar conteúdo"
                                                                        onClick={(event) => {

                                                                            event.stopPropagation();

                                                                            excluirConteudo(
                                                                                conteudo.artigoId
                                                                            );

                                                                        }}
                                                                    >

                                                                        <img
                                                                            src={Lixeira}
                                                                            alt="Arquivar"
                                                                        />

                                                                    </button>

                                                                )}

                                                        </div>

                                                    </td>
                                                )}

                                            </tr>

                                        );

                                    })

                                ) : (

                                    <tr>

                                        <td
                                            colSpan={totalColunas}
                                            className="sem-conteudos"
                                        >

                                            {abaSelecionada === "meus"
                                                ? "Você ainda não possui conteúdos cadastrados."
                                                : "Nenhum conteúdo encontrado."}

                                        </td>

                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>

            </main>

            <FooterMobile />

        </div>

    );

}


// =========================================
// MENU LATERAL
// =========================================

function Sidebar({ sairSistema }) {

    const perfis = obterPerfisLogados();

    return (

        <aside className="menu-conteudos">

            <div className="logo-conteudos">
                <img src={LogoNome} alt="Integra" />
            </div>

            <nav className="navegacao-conteudos">

                <NavLink
                    to="/home"
                    className={({ isActive }) =>
                        isActive ? "item-menu menu-ativo" : "item-menu"
                    }
                >
                    <img src={CasaBranca} alt="" />
                    <span>Início</span>
                </NavLink>

                <NavLink
                    to="/conteudos"
                    className={({ isActive }) =>
                        isActive ? "item-menu menu-ativo" : "item-menu"
                    }
                >
                    <img src={LivroBranco} alt="" />
                    <span>Conteúdos</span>
                </NavLink>

                {PERFIS_FISCAIS.some(perfil => perfis.includes(perfil)) && (
                    <NavLink
                        to="/notas-fiscais"
                        className={({ isActive }) =>
                            isActive ? "item-menu menu-ativo" : "item-menu"
                        }
                    >
                        <img src={DoisDocumentosBranco} alt="" />
                        <span>Notas Fiscais</span>
                    </NavLink>
                )}

                {perfis.includes("Administrador") && (
                    <NavLink
                        to="/clientes"
                        className={({ isActive }) =>
                            isActive ? "item-menu menu-ativo" : "item-menu"
                        }
                    >
                        <img src={ADDProfileBranco} alt="" />
                        <span>Clientes</span>
                    </NavLink>
                )}

                {perfis.includes("Administrador") && (
                    <NavLink
                        to="/usuario"
                        className={({ isActive }) =>
                            isActive ? "item-menu menu-ativo" : "item-menu"
                        }
                    >
                        <img src={PessoaBranca} alt="" />
                        <span>Usuários</span>
                    </NavLink>
                )}

            </nav>

            <button
                type="button"
                className="sair-conteudos"
                onClick={sairSistema}
            >
                <img src={SairBranco} alt="" />
                <span>Sair</span>
            </button>

        </aside>

    );

}


// =========================================
// MENU MOBILE
// =========================================

function FooterMobile() {

    const perfis = obterPerfisLogados();

    return (

        <footer className="footer-conteudos-mobile">

            <NavLink
                to="/home"
                className={({ isActive }) =>
                    isActive ? "item-footer-mobile footer-ativo" : "item-footer-mobile"
                }
            >
                <img src={CasaBranca} alt="" />
                <span>Início</span>
            </NavLink>

            <NavLink
                to="/conteudos"
                className={({ isActive }) =>
                    isActive ? "item-footer-mobile footer-ativo" : "item-footer-mobile"
                }
            >
                <img src={LivroBranco} alt="" />
                <span>Conteúdos</span>
            </NavLink>

            {PERFIS_FISCAIS.some(perfil => perfis.includes(perfil)) && (
                <NavLink
                    to="/notas-fiscais"
                    className={({ isActive }) =>
                        isActive ? "item-footer-mobile footer-ativo" : "item-footer-mobile"
                    }
                >
                    <img src={DoisDocumentosBranco} alt="" />
                    <span>Notas Fiscais</span>
                </NavLink>
            )}

            {perfis.includes("Administrador") && (
                <NavLink
                    to="/clientes"
                    className={({ isActive }) =>
                        isActive ? "item-footer-mobile footer-ativo" : "item-footer-mobile"
                    }
                >
                    <img src={ADDProfileBranco} alt="" />
                    <span>Clientes</span>
                </NavLink>
            )}

            {perfis.includes("Administrador") && (
                <NavLink
                    to="/usuario"
                    className={({ isActive }) =>
                        isActive ? "item-footer-mobile footer-ativo" : "item-footer-mobile"
                    }
                >
                    <img src={PessoaBranca} alt="" />
                    <span>Usuários</span>
                </NavLink>
            )}

        </footer>

    );

}

export default ConteudoTributario;
