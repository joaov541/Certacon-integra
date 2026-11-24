import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "./Home.css";

import { requisicaoApi } from "../../services/api";
import usePermissoes from "../../hooks/usePermissoes";

// COMPONENTES COMPARTILHADOS



// ÍCONES DO DASHBOARD

import iconeDocumento from "../../assets/Icones/ArquivoAcessoRapido.png";
import iconeExpandir from "../../assets/Icones/SetaAcessoRapido.png";
import iconeUpload from "../../assets/Icones/BaixarArqvAcssRapido.png";
import iconeGrupo from "../../assets/Icones/PessoaAcessoRapido.png";
import arquivoHome from "../../assets/Icones/ArquivoDashboard.png";
import DoisDocumentos from "../../assets/Icones/DoisDocumentos.png";
import TimeAcessoRapido from "../../assets/Icones/TimeAcessoRapido.png";

// ÍCONES TABLET E MOBILE

import AddClienteMobile from "../../assets/Icones/AddClienteMobile.png";
import NovoConteudoMobile from "../../assets/Icones/NovoConteudoMobile.png";
import HistoricoMobile from "../../assets/Icones/HistoricoMobile.png";
import ConsultarNFEmobile from "../../assets/Icones/ConsultarNFEmobile.png";
import EnviarXMLMobile from "../../assets/Icones/EnviarXMLMobile.png";

export default function Home() {

    const navigate = useNavigate();

    // =========================================
    // PERMISSÕES DINÂMICAS
    // =========================================

    const {
        temPermissao,
        temAlgumaPermissao,
        carregando: carregandoPermissoes,
        erro: erroPermissoes,
        atualizar
    } = usePermissoes();

    // =========================================
    // USUÁRIO AUTENTICADO
    // =========================================

    let usuario = {};

    try {
        usuario = JSON.parse(
            localStorage.getItem("usuario") || "{}"
        ) || {};
    } catch {
        usuario = {};
    }

    const nomeUsuario =
        usuario.nome?.trim().split(/\s+/)[0] || "usuário";

    const token = localStorage.getItem("token");

    // =========================================
    // CONTROLE DE ACESSOS
    // =========================================

    const podeGerenciarClientes =
        temPermissao("cliente.gerenciar");

    const podeCriar =
        temAlgumaPermissao("artigo.criar");

    const podeRevisar =
        temAlgumaPermissao("artigo.revisar");

    const podeVerNotas =
        temPermissao("nota.ler.todas") ||
        temPermissao("nota.ler.proprias");

    const podeEnviarXml =
        temPermissao("nota.importar");

    const podeVerHistorico =
        temPermissao("auditoria.ler");

    // A consulta de chave NF-e é pública.
    // Não necessita de uma permissão específica.

    // =========================================
    // ESTADOS DO DASHBOARD
    // =========================================

    const [artigos, setArtigos] = useState([]);
    const [notas, setNotas] = useState([]);
    const [pendentes, setPendentes] = useState([]);

    const [carregando, setCarregando] = useState(true);

    const [erroDashboard, setErroDashboard] =
        useState("");

    // =========================================
    // CARREGAMENTO DO DASHBOARD
    // =========================================

    useEffect(() => {

        let ativo = true;

        setErroDashboard("");

        if (!token || carregandoPermissoes || erroPermissoes) {

            setCarregando(
                Boolean(token && carregandoPermissoes)
            );

            setArtigos([]);
            setNotas([]);
            setPendentes([]);

            return;

        }

        async function carregarDashboard() {

            setCarregando(true);

            setArtigos([]);
            setNotas([]);
            setPendentes([]);

            const erros = [];
            const tarefas = [];

            // =====================================
            // CONTEÚDOS PUBLICADOS
            // =====================================

            tarefas.push(

                requisicaoApi("/api/Artigos")

                    .then(dados => {

                        if (!ativo) return;

                        setArtigos(
                            Array.isArray(dados)
                                ? dados
                                : []
                        );

                    })

                    .catch(error => {

                        if (!ativo) return;

                        console.error(
                            "Erro ao carregar conteúdos:",
                            error
                        );

                        erros.push(
                            "Não foi possível carregar os conteúdos."
                        );

                    })

            );

            // =====================================
            // NOTAS FISCAIS
            // =====================================

            if (podeVerNotas) {

                tarefas.push(

                    requisicaoApi("/api/NotasFiscais")

                        .then(dados => {

                            if (!ativo) return;

                            setNotas(
                                Array.isArray(dados)
                                    ? dados
                                    : []
                            );

                        })

                        .catch(error => {

                            if (!ativo) return;

                            console.error(
                                "Erro ao carregar notas fiscais:",
                                error
                            );

                            erros.push(
                                "Não foi possível carregar as notas fiscais."
                            );

                        })

                );

            }

            // =====================================
            // CONTEÚDOS EM REVISÃO
            // =====================================

            if (podeRevisar) {

                tarefas.push(

                    requisicaoApi(
                        "/api/Artigos/pendentes-revisao"
                    )

                        .then(dados => {

                            if (!ativo) return;

                            setPendentes(
                                Array.isArray(dados)
                                    ? dados
                                    : []
                            );

                        })

                        .catch(error => {

                            if (!ativo) return;

                            console.error(
                                "Erro ao carregar revisões:",
                                error
                            );

                            erros.push(
                                "Não foi possível carregar os conteúdos em revisão."
                            );

                        })

                );

            }

            await Promise.all(tarefas);

            if (!ativo) return;

            setErroDashboard(erros.join(" "));
            setCarregando(false);

        }

        carregarDashboard();

        return () => {
            ativo = false;
        };

    }, [
        token,
        carregandoPermissoes,
        erroPermissoes,
        podeVerNotas,
        podeRevisar
    ]);

    // =========================================
    // CONTEÚDOS MAIS RECENTES
    // =========================================

    const ultimosArtigos = [...artigos]

        .sort((a, b) => {

            return (
                new Date(b.dataPublicacao || 0) -
                new Date(a.dataPublicacao || 0)
            );

        })

        .slice(0, 3);

    // =========================================
    // FORMATAÇÃO DE DATAS
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
    // ABRIR DETALHES DO CONTEÚDO
    // =========================================

    function abrirConteudo(artigo) {

        navigate("/conteudos/detalhes", {

            state: {

                conteudo: {

                    ...artigo,

                    id: artigo.artigoId,

                    data: formatarData(
                        artigo.dataPublicacao
                    )

                }

            }

        });

    }

    // =========================================
    // NAVEGAÇÃO PELO TECLADO
    // =========================================

    function navegarComTeclado(event, acao) {

        if (
            event.key === "Enter" ||
            event.key === " "
        ) {

            event.preventDefault();

            acao();

        }

    }

    // =========================================
    // ACESSOS RÁPIDOS DINÂMICOS
    // =========================================

    const acessosRapidos = [

        {
            titulo: "Novo conteúdo",
            rota: "/conteudos/novo",
            iconeDesktop: iconeExpandir,
            iconeMobile: NovoConteudoMobile,
            permitido: podeCriar
        },

        {
            titulo: "Conteúdos em revisão",
            rota: "/conteudos/revisao",
            iconeDesktop: iconeDocumento,
            iconeMobile: NovoConteudoMobile,
            permitido: podeRevisar
        },

        {
            titulo: "Enviar XML",
            rota: "/enviar-xml",
            iconeDesktop: iconeUpload,
            iconeMobile: EnviarXMLMobile,
            permitido: podeEnviarXml
        },

        {
            titulo: "Consultar NF-e",
            rota: "/consultar-chave",
            iconeDesktop: iconeDocumento,
            iconeMobile: ConsultarNFEmobile,
            classeExtra: "docAcessoRapido",
            permitido: true
        },

        {
            titulo: "Consultar clientes",
            rota: "/clientes",
            iconeDesktop: iconeGrupo,
            iconeMobile: AddClienteMobile,
            permitido: podeGerenciarClientes
        },

        {
            titulo: "Histórico de ações",
            rota: "/historico",
            iconeDesktop: TimeAcessoRapido,
            iconeMobile: HistoricoMobile,
            permitido: podeVerHistorico
        }

    ].filter(item => item.permitido);

    // =========================================
    // CARDS DO DASHBOARD
    // =========================================

    const cardsResumo = [

        {
            titulo: "Conteúdos publicados",
            quantidade: artigos.length,
            rota: "/conteudos",
            etiqueta: "Publicados",
            classeEtiqueta: "",
            permitido: true
        },

        {
            titulo: "Notas Fiscais",
            quantidade: notas.length,
            rota: "/notas-fiscais",
            etiqueta: "Ativas",
            classeEtiqueta: "home-card-ativas",
            permitido: podeVerNotas
        },

        {
            titulo: "Conteúdos em revisão",
            quantidade: pendentes.length,
            rota: "/conteudos/revisao",
            etiqueta: "Atenção",
            classeEtiqueta: "home-card-atencao",
            permitido: podeRevisar
        }

    ].filter(item => item.permitido);

    // =========================================
    // RENDERIZAÇÃO
    // =========================================

    return (

        <main className="home">

            {/* =====================================
                SIDEBAR COMPARTILHADO

                Desktop, tablet e mobile.
                Permissões dinâmicas e logout.
            ===================================== */}

          
            {/* =====================================
                ÁREA PRINCIPAL
            ===================================== */}

            <section className="home-area">

                {/* HEADERS COMPARTILHADOS */}

               

                {/* =================================
                    CONTEÚDO PRINCIPAL
                ================================= */}

                <div className="home-conteudo">

                    {/* SAUDAÇÃO */}

                    <h1>
                        Olá, {nomeUsuario}!
                    </h1>

                    <p className="home-subtitulo">

                        Confira um resumo das principais
                        informações do sistema.

                    </p>

                    {/* CARREGAMENTO DAS PERMISSÕES */}

                    {carregandoPermissoes && (

                        <p role="status">

                            Carregando permissões de acesso...

                        </p>

                    )}

                    {/* ERRO DAS PERMISSÕES */}

                    {erroPermissoes && (

                        <div
                            className="home-erro"
                            role="alert"
                        >

                            <p>

                                Não foi possível carregar suas
                                permissões de acesso.

                            </p>

                            <button
                                type="button"
                                className="home-ver-todos"
                                onClick={atualizar}
                            >

                                Tentar novamente

                            </button>

                        </div>

                    )}

                    {/* ERRO DO DASHBOARD */}

                    {erroDashboard && (

                        <p
                            className="home-erro"
                            role="alert"
                        >

                            {erroDashboard}

                        </p>

                    )}

                    {/* =================================
                        CARDS DE RESUMO
                    ================================= */}

                    <div className="home-resumo">

                        {cardsResumo.map(card => (

                            <div
                                key={card.rota}
                                className="home-card"
                                role="link"
                                tabIndex={0}

                                onClick={() =>
                                    navigate(card.rota)
                                }

                                onKeyDown={event =>
                                    navegarComTeclado(
                                        event,
                                        () => navigate(card.rota)
                                    )
                                }

                                style={{
                                    cursor: "pointer"
                                }}
                            >

                                {/* ÍCONE */}

                                <div className="home-card-icone">

                                    <img
                                        src={arquivoHome}
                                        alt=""
                                    />

                                </div>

                                {/* INFORMAÇÕES */}

                                <div className="home-card-info">

                                    <p>
                                        {card.titulo}
                                    </p>

                                    <strong>

                                        {carregando ||
                                        carregandoPermissoes
                                            ? "..."
                                            : erroPermissoes
                                                ? "—"
                                                : card.quantidade}

                                    </strong>

                                </div>

                                {/* ETIQUETA */}

                                <span
                                    className={
                                        `home-card-crescimento ${card.classeEtiqueta}`
                                    }
                                >

                                    {card.etiqueta}

                                </span>

                            </div>

                        ))}

                    </div>

                    {/* =================================
                        LISTA E ACESSO RÁPIDO
                    ================================= */}

                    <div className="home-baixo">

                        {/* =================================
                            ÚLTIMAS ATUALIZAÇÕES
                        ================================= */}

                        <section className="home-lista">

                            {ultimosArtigos.length > 0 &&
                            !carregandoPermissoes &&
                            !erroPermissoes ? (

                                ultimosArtigos.map(
                                    (artigo, index) => (

                                        <div
                                            key={artigo.artigoId}
                                            className="home-lista-item"
                                            role="link"
                                            tabIndex={0}

                                            onClick={() =>
                                                abrirConteudo(artigo)
                                            }

                                            onKeyDown={event =>
                                                navegarComTeclado(
                                                    event,
                                                    () => abrirConteudo(artigo)
                                                )
                                            }

                                            style={{
                                                cursor: "pointer"
                                            }}
                                        >

                                            {/* ÍCONE DO CONTEÚDO */}

                                            <div
                                                className={`home-lista-icone ${
                                                    index === 0
                                                        ? "home-lista-icone-verde"
                                                        : index === 1
                                                            ? "home-lista-icone-vermelho"
                                                            : "home-lista-icone-azul"
                                                }`}
                                            >

                                                <img
                                                    src={DoisDocumentos}
                                                    alt=""
                                                />

                                            </div>

                                            {/* TEXTO DO CONTEÚDO */}

                                            <div className="home-lista-texto">

                                                <h3>
                                                    {artigo.titulo}
                                                </h3>

                                                <p>

                                                    Publicado em{" "}

                                                    {formatarData(
                                                        artigo.dataPublicacao
                                                    )}

                                                </p>

                                            </div>

                                            {/* TEMA */}

                                            <span
                                                className={`home-tag ${
                                                    index === 0
                                                        ? "home-tag-verde"
                                                        : "home-tag-roxo"
                                                }`}
                                            >

                                                {artigo.tema ||
                                                    "Conteúdo"}

                                            </span>

                                        </div>

                                    )
                                )

                            ) : (

                                <p className="home-lista-vazia">

                                    {carregando ||
                                    carregandoPermissoes
                                        ? "Carregando conteúdos..."
                                        : erroPermissoes
                                            ? "Não foi possível carregar os conteúdos."
                                            : "Nenhum conteúdo publicado encontrado."}

                                </p>

                            )}

                            {/* VER TODOS OS CONTEÚDOS */}

                            <button
                                type="button"
                                className="home-ver-todos"
                                onClick={() =>
                                    navigate("/conteudos")
                                }
                            >

                                Ver todos →

                            </button>

                        </section>

                        {/* =================================
                            ACESSO RÁPIDO
                        ================================= */}

                        <section className="home-acesso">

                            <h2>Acesso rápido</h2>

                            {acessosRapidos.map(item => (

                                <button
                                    key={item.rota}
                                    type="button"
                                    className="home-acesso-botao"

                                    onClick={() =>
                                        navigate(item.rota)
                                    }
                                >

                                    {/* ÍCONE DESKTOP */}

                                    <img
                                        src={item.iconeDesktop}
                                        alt=""
                                        className={
                                            `home-acesso-icone-desktop ${item.classeExtra || ""}`
                                        }
                                    />

                                    {/* ÍCONE MOBILE */}

                                    <img
                                        src={item.iconeMobile}
                                        alt=""
                                        className="home-acesso-icone-mobile"
                                    />

                                    {/* TÍTULO */}

                                    <span>
                                        {item.titulo}
                                    </span>

                                </button>

                            ))}

                        </section>

                    </div>

                </div>

            </section>

        </main>

    );

}