import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
    BookOpen,
    Receipt,
    ClipboardCheck,
    ArrowUpRight,
    ChevronRight,
    ArrowRight,
    RefreshCw,
    CalendarDays,
    AlertCircle,
    FileText,
    LayoutDashboard
} from "lucide-react";

import "./Home.css";

import { requisicaoApi } from "../../services/api";
import usePermissoes from "../../hooks/usePermissoes";

// ÍCONES DESKTOP

import iconeDocumento from "../../assets/Icones/ArquivoAcessoRapido.png";
import iconeExpandir from "../../assets/Icones/SetaAcessoRapido.png";
import iconeUpload from "../../assets/Icones/BaixarArqvAcssRapido.png";
import iconeGrupo from "../../assets/Icones/PessoaAcessoRapido.png";
import DoisDocumentos from "../../assets/Icones/DoisDocumentos.png";
import TimeAcessoRapido from "../../assets/Icones/TimeAcessoRapido.png";

// ÍCONES MOBILE

import AddClienteMobile from "../../assets/Icones/AddClienteMobile.png";
import NovoConteudoMobile from "../../assets/Icones/NovoConteudoMobile.png";
import HistoricoMobile from "../../assets/Icones/HistoricoMobile.png";
import ConsultarNFEmobile from "../../assets/Icones/ConsultarNFEmobile.png";
import EnviarXMLMobile from "../../assets/Icones/EnviarXMLMobile.png";

// =========================================
// SKELETON - CONTADOR
// =========================================

function SkeletonContador() {

    return (
        <span
            className="home-skeleton home-skeleton-contador"
            aria-hidden="true"
        />
    );

}

// =========================================
// SKELETON - LISTAGEM DE CONTEÚDOS
// =========================================

function SkeletonConteudo() {

    return (

        <div
            className="home-skeleton-listagem"
            aria-hidden="true"
        >

            {Array.from({ length: 3 }, (_, indice) => (

                <div
                    className="home-skeleton-item"
                    key={indice}
                >

                    <div className="home-skeleton home-skeleton-icone" />

                    <div className="home-skeleton-textos">

                        <span className="home-skeleton home-skeleton-titulo" />

                        <span className="home-skeleton home-skeleton-subtitulo" />

                    </div>

                    <span className="home-skeleton home-skeleton-tag" />

                </div>

            ))}

        </div>

    );

}

// =========================================
// CARD DE RESUMO
// =========================================

function CardResumo({
    card,
    carregando,
    indisponivel,
    aoClicar
}) {

    const Icone = card.icone;

    return (

        <button
            type="button"
            className={`home-card home-card-${card.tipo}`}
            onClick={aoClicar}
            aria-busy={carregando}
        >

            {/* CABEÇALHO DO CARD */}

            <div className="home-card-topo">

                <div className="home-card-icone">

                    <Icone
                        size={25}
                        strokeWidth={1.8}
                        aria-hidden="true"
                    />

                </div>

                <ArrowUpRight
                    size={19}
                    className="home-card-seta"
                    aria-hidden="true"
                />

            </div>

            {/* INFORMAÇÕES */}

            <div className="home-card-info">

                <p>{card.titulo}</p>

                {carregando ? (

                    <SkeletonContador />

                ) : (

                    <strong
                        key={`${card.tipo}-${indisponivel}-${card.quantidade}`}
                        className="home-contador"
                    >

                        {indisponivel
                            ? "—"
                            : card.quantidade.toLocaleString("pt-BR")}

                    </strong>

                )}

            </div>

            {/* RODAPÉ DO CARD */}

            <div className="home-card-rodape">

                <span
                    className={
                        `home-card-crescimento ${card.classeEtiqueta}`
                    }
                >

                    <span className="home-card-ponto" />

                    {indisponivel
                        ? "Indisponível"
                        : card.etiqueta}

                </span>

                <span className="home-card-detalhes">

                    Ver detalhes

                </span>

            </div>

        </button>

    );

}

// =========================================
// COMPONENTE PRINCIPAL
// =========================================

export default function Home() {

    const navigate = useNavigate();

    // =====================================
    // PERMISSÕES DINÂMICAS
    // =====================================

    const {
        temPermissao,
        temAlgumaPermissao,
        carregando: carregandoPermissoes,
        erro: erroPermissoes,
        atualizar
    } = usePermissoes();

    // =====================================
    // USUÁRIO AUTENTICADO
    // =====================================

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

    // =====================================
    // CONTROLE DE ACESSOS
    // =====================================

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

    // =====================================
    // ESTADOS DO DASHBOARD
    // =====================================

    const [artigos, setArtigos] = useState([]);
    const [notas, setNotas] = useState([]);
    const [pendentes, setPendentes] = useState([]);

    const [carregando, setCarregando] =
        useState(true);

    const [erroDashboard, setErroDashboard] =
        useState("");

    const [falhas, setFalhas] = useState({
        artigos: false,
        notas: false,
        pendentes: false
    });

    const [versaoConsulta, setVersaoConsulta] =
        useState(0);

    const [ultimaAtualizacao, setUltimaAtualizacao] =
        useState(null);

    // =====================================
    // CARREGAR DADOS DO DASHBOARD
    // =====================================

    useEffect(() => {

        let ativo = true;

        setErroDashboard("");

        setFalhas({
            artigos: false,
            notas: false,
            pendentes: false
        });

        setUltimaAtualizacao(null);

        setArtigos([]);
        setNotas([]);
        setPendentes([]);

        if (
            !token ||
            carregandoPermissoes ||
            erroPermissoes
        ) {

            setCarregando(
                Boolean(token && carregandoPermissoes)
            );

            return;

        }

        async function carregarDashboard() {

            setCarregando(true);

            const erros = [];

            const falhasConsulta = {
                artigos: false,
                notas: false,
                pendentes: false
            };

            const tarefas = [];

            // =================================
            // CONTEÚDOS PUBLICADOS
            // =================================

            tarefas.push(

                requisicaoApi("/api/Artigos")

                    .then(dados => {

                        if (!ativo) return;

                        if (!Array.isArray(dados)) {

                            throw new Error(
                                "Formato de resposta inesperado."
                            );

                        }

                        setArtigos(dados);

                    })

                    .catch(error => {

                        if (!ativo) return;

                        console.error(
                            "Erro ao carregar conteúdos:",
                            error
                        );

                        falhasConsulta.artigos = true;

                        erros.push(
                            "Não foi possível carregar os conteúdos."
                        );

                    })

            );

            // =================================
            // NOTAS FISCAIS
            // =================================

            if (podeVerNotas) {

                tarefas.push(

                    requisicaoApi("/api/NotasFiscais")

                        .then(dados => {

                            if (!ativo) return;

                            if (!Array.isArray(dados)) {

                                throw new Error(
                                    "Formato de resposta inesperado."
                                );

                            }

                            setNotas(dados);

                        })

                        .catch(error => {

                            if (!ativo) return;

                            console.error(
                                "Erro ao carregar notas fiscais:",
                                error
                            );

                            falhasConsulta.notas = true;

                            erros.push(
                                "Não foi possível carregar as notas fiscais."
                            );

                        })

                );

            }

            // =================================
            // CONTEÚDOS EM REVISÃO
            // =================================

            if (podeRevisar) {

                tarefas.push(

                    requisicaoApi(
                        "/api/Artigos/pendentes-revisao"
                    )

                        .then(dados => {

                            if (!ativo) return;

                            if (!Array.isArray(dados)) {

                                throw new Error(
                                    "Formato de resposta inesperado."
                                );

                            }

                            setPendentes(dados);

                        })

                        .catch(error => {

                            if (!ativo) return;

                            console.error(
                                "Erro ao carregar revisões:",
                                error
                            );

                            falhasConsulta.pendentes = true;

                            erros.push(
                                "Não foi possível carregar os conteúdos em revisão."
                            );

                        })

                );

            }

            await Promise.all(tarefas);

            if (!ativo) return;

            setFalhas(falhasConsulta);

            setErroDashboard(erros.join(" "));

            if (erros.length === 0) {

                setUltimaAtualizacao(new Date());

            }

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
        podeRevisar,
        versaoConsulta
    ]);

    // =====================================
    // ATUALIZAR DASHBOARD
    // =====================================

    function atualizarDashboard() {

        if (
            !token ||
            carregando ||
            carregandoPermissoes ||
            erroPermissoes
        ) {

            return;

        }

        setCarregando(true);

        setVersaoConsulta(
            anterior => anterior + 1
        );

    }

    // =====================================
    // CONTEÚDOS MAIS RECENTES
    // =====================================

    const ultimosArtigos = [...artigos]

        .sort((a, b) => {

            return (

                new Date(b.dataPublicacao || 0) -
                new Date(a.dataPublicacao || 0)

            );

        })

        .slice(0, 3);

    // =====================================
    // FORMATAÇÃO DE DATAS
    // =====================================

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

    const dataHoje = new Intl.DateTimeFormat(
        "pt-BR",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    ).format(new Date());

    // =====================================
    // ABRIR DETALHES DO CONTEÚDO
    // =====================================

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

    // =====================================
    // ACESSOS RÁPIDOS DINÂMICOS
    // =====================================

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
            rota: "/notas-fiscais?importar=xml",
            iconeDesktop: iconeUpload,
            iconeMobile: EnviarXMLMobile,
            permitido: podeEnviarXml && podeVerNotas && !carregandoPermissoes && !erroPermissoes
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

    // =====================================
    // CARDS DO DASHBOARD
    // =====================================

    const cardsResumo = [

        {
            titulo: "Conteúdos publicados",
            quantidade: artigos.length,
            rota: "/conteudos",
            etiqueta: "Publicados",
            classeEtiqueta: "home-card-publicados",
            tipo: "conteudos",
            chave: "artigos",
            icone: BookOpen,
            permitido: true
        },

        {
            titulo: "Notas Fiscais",
            quantidade: notas.length,
            rota: "/notas-fiscais",
            etiqueta: "Registros",
            classeEtiqueta: "home-card-ativas",
            tipo: "notas",
            chave: "notas",
            icone: Receipt,
            permitido: podeVerNotas
        },

        {
            titulo: "Conteúdos em revisão",
            quantidade: pendentes.length,
            rota: "/conteudos/revisao",
            etiqueta: pendentes.length > 0
                ? "Pendentes"
                : "Em revisão",
            classeEtiqueta: pendentes.length > 0
                ? "home-card-atencao"
                : "home-card-neutro",
            tipo: "revisao",
            chave: "pendentes",
            icone: ClipboardCheck,
            permitido: podeRevisar
        }

    ].filter(item => item.permitido);

    const carregandoDados =
        carregando || carregandoPermissoes;

    // =====================================
    // RENDERIZAÇÃO
    // =====================================

    return (

        <main className="home">

            {/* O menu e os headers continuam
                no LayoutSistema compartilhado. */}

            <section className="home-area">

                <div className="home-conteudo">

                    {/* =================================
                        CABEÇALHO DO DASHBOARD
                    ================================= */}

                    <header className="home-boas-vindas">

                        <div className="home-saudacao">

                            <span className="home-identificacao">

                                <LayoutDashboard
                                    size={14}
                                    aria-hidden="true"
                                />

                                VISÃO GERAL DO PORTAL

                            </span>

                            <h1>

                                Olá, {nomeUsuario}!

                            </h1>

                            <p className="home-subtitulo">

                                Confira um resumo das principais
                                informações do sistema.

                            </p>

                            <span
                                className="home-linha-destaque"
                                aria-hidden="true"
                            />

                        </div>

                        <div className="home-cabecalho-acoes">

                            <div className="home-data">

                                <CalendarDays
                                    size={17}
                                    aria-hidden="true"
                                />

                                <span>{dataHoje}</span>

                            </div>

                            <button
                                type="button"
                                className="home-atualizar"
                                onClick={atualizarDashboard}
                                disabled={
                                    carregandoDados ||
                                    Boolean(erroPermissoes) ||
                                    !token
                                }
                            >

                                <RefreshCw
                                    size={16}
                                    className={
                                        carregandoDados
                                            ? "home-icone-carregando"
                                            : ""
                                    }
                                    aria-hidden="true"
                                />

                                {carregandoDados

                                    ? "Atualizando..."

                                    : "Atualizar dados"

                                }

                            </button>

                        </div>

                    </header>

                    {/* =================================
                        INFORMAÇÕES DO DASHBOARD
                    ================================= */}

                    <div className="home-status-dashboard">

                        {carregandoDados ? (

                            <span role="status">

                                <span className="home-status-ponto home-status-carregando" />

                                {carregandoPermissoes

                                    ? "Carregando permissões..."

                                    : "Carregando informações..."

                                }

                            </span>

                        ) : erroPermissoes ? (

                            <span>

                                <span className="home-status-ponto home-status-atencao" />

                                Permissões indisponíveis

                            </span>

                        ) : ultimaAtualizacao ? (

                            <span role="status">

                                <span className="home-status-ponto home-status-ok" />

                                Última atualização às{" "}

                                {ultimaAtualizacao.toLocaleTimeString(
                                    "pt-BR",
                                    {
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    }
                                )}

                            </span>

                        ) : erroDashboard ? (

                            <span>

                                <span className="home-status-ponto home-status-atencao" />

                                Algumas informações estão indisponíveis

                            </span>

                        ) : null}

                    </div>

                    {/* =================================
                        ERRO DAS PERMISSÕES
                    ================================= */}

                    {erroPermissoes && (

                        <div
                            className="home-erro"
                            role="alert"
                        >

                            <AlertCircle size={20} />

                            <div>

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

                        </div>

                    )}

                    {/* ERRO DO DASHBOARD */}

                    {erroDashboard && (

                        <div
                            className="home-erro"
                            role="alert"
                        >

                            <AlertCircle size={20} />

                            <p>{erroDashboard}</p>

                        </div>

                    )}

                    {/* =================================
                        CARDS DE RESUMO
                    ================================= */}

                    <section
                        className="home-resumo"
                        aria-label="Indicadores do dashboard"
                    >

                        {cardsResumo.map(card => (

                            <CardResumo
                                key={card.rota}
                                card={card}
                                carregando={carregandoDados}
                                indisponivel={
                                    Boolean(erroPermissoes) ||
                                    Boolean(falhas[card.chave]) ||
                                    !token
                                }
                                aoClicar={() =>
                                    navigate(card.rota)
                                }
                            />

                        ))}

                    </section>

                    {/* =================================
                        ÁREA INFERIOR
                    ================================= */}

                    <div className="home-baixo">

                        {/* =================================
                            ÚLTIMAS ATUALIZAÇÕES
                        ================================= */}

                        <section
                            className="home-lista"
                            aria-busy={carregandoDados}
                        >

                            <div className="home-secao-cabecalho">

                                <div>

                                    <h2>

                                        Últimas atualizações

                                    </h2>

                                    <p>

                                        Conteúdos publicados recentemente

                                    </p>

                                </div>

                                <div className="home-secao-icone">

                                    <FileText
                                        size={21}
                                        strokeWidth={1.8}
                                        aria-hidden="true"
                                    />

                                </div>

                            </div>

                            {/* CARREGAMENTO */}

                            {carregandoDados ? (

                                <SkeletonConteudo />

                            ) : erroPermissoes || falhas.artigos || !token ? (

                                <div className="home-estado-vazio">

                                    <AlertCircle
                                        size={32}
                                        strokeWidth={1.5}
                                        aria-hidden="true"
                                    />

                                    <h3>

                                        Conteúdos indisponíveis

                                    </h3>

                                    <p>

                                        Não foi possível carregar
                                        as últimas publicações.

                                    </p>

                                </div>

                            ) : ultimosArtigos.length > 0 ? (

                                <div className="home-lista-itens">

                                    {ultimosArtigos.map(
                                        (artigo, index) => (

                                            <button
                                                key={artigo.artigoId}
                                                type="button"
                                                className="home-lista-item"
                                                onClick={() =>
                                                    abrirConteudo(artigo)
                                                }
                                            >

                                                {/* ÍCONE */}

                                                <div
                                                    className={
                                                        `home-lista-icone home-lista-icone-${index + 1}`
                                                    }
                                                >

                                                    <img
                                                        src={DoisDocumentos}
                                                        alt=""
                                                    />

                                                </div>

                                                {/* CONTEÚDO */}

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

                                                    <span className="home-tag">

                                                        {artigo.tema ||
                                                            "Conteúdo"}

                                                    </span>

                                                </div>

                                                <ChevronRight
                                                    size={18}
                                                    className="home-lista-seta"
                                                    aria-hidden="true"
                                                />

                                            </button>

                                        )
                                    )}

                                </div>

                            ) : (

                                <div className="home-estado-vazio">

                                    <BookOpen
                                        size={36}
                                        strokeWidth={1.5}
                                        aria-hidden="true"
                                    />

                                    <h3>

                                        Nenhum conteúdo publicado

                                    </h3>

                                    <p>

                                        As próximas publicações
                                        aparecerão aqui.

                                    </p>

                                </div>

                            )}

                            {/* VER TODOS OS CONTEÚDOS */}

                            <button
                                type="button"
                                className="home-ver-todos"
                                onClick={() =>
                                    navigate("/conteudos")
                                }
                            >

                                Ver todos os conteúdos

                                <ArrowRight
                                    size={16}
                                    aria-hidden="true"
                                />

                            </button>

                        </section>

                        {/* =================================
                            ACESSO RÁPIDO
                        ================================= */}

                        <section className="home-acesso">

                            <div className="home-secao-cabecalho">

                                <div>

                                    <h2>Acesso rápido</h2>

                                    <p>

                                        Suas principais ferramentas

                                    </p>

                                </div>

                                <div className="home-secao-icone">

                                    <LayoutDashboard
                                        size={21}
                                        strokeWidth={1.8}
                                        aria-hidden="true"
                                    />

                                </div>

                            </div>

                            <div className="home-acesso-grid">

                                {acessosRapidos.map(item => (

                                    <button
                                        key={item.rota}
                                        type="button"
                                        className="home-acesso-botao"
                                        onClick={() =>
                                            navigate(item.rota)
                                        }
                                    >

                                        {/* ÍCONES */}

                                        <div className="home-acesso-icone">

                                            <img
                                                src={item.iconeDesktop}
                                                alt=""
                                                className={
                                                    `home-acesso-icone-desktop ${item.classeExtra || ""}`
                                                }
                                            />

                                            <img
                                                src={item.iconeMobile}
                                                alt=""
                                                className="home-acesso-icone-mobile"
                                            />

                                        </div>

                                        {/* TÍTULO */}

                                        <span>

                                            {item.titulo}

                                        </span>

                                        <ChevronRight
                                            size={16}
                                            className="home-acesso-seta"
                                            aria-hidden="true"
                                        />

                                    </button>

                                ))}

                            </div>

                        </section>

                    </div>

                    {/* =================================
                        RODAPÉ DISCRETO DO DASHBOARD
                    ================================= */}

                    <div className="home-rodape">

                        <span>

                            Integra

                        </span>

                        <span className="home-rodape-separador" />

                        <span>

                            Portal Tributário

                        </span>

                    </div>

                </div>

            </section>

        </main>

    );

}