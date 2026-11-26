import { useEffect, useRef, useState } from "react";
import {
    NavLink,
    useNavigate,
    useLocation
} from "react-router-dom";

import {
    Wrench,
    ChevronDown,
    BookOpen,
    FileSearch,
    Users,
    Bookmark,
    CalendarDays,
    Calculator,
    Bot,
    X
} from "lucide-react";

import usePermissoes from "../../hooks/usePermissoes";

import "./Sidebar.css";

// =========================================
// ÍCONES
// =========================================

import LogoNome from "../../assets/Icones/LogoNome.png";
import CasaBranca from "../../assets/Icones/CasaBranca.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
import SairBranco from "../../assets/Icones/SairBranco.png";

// =========================================
// COMPONENTE PRINCIPAL
// =========================================

export default function Sidebar() {

    const navigate = useNavigate();
    const location = useLocation();

    const sidebarRef = useRef(null);
    const ferramentasRef = useRef(null);
    const listaRef = useRef(null);
    const indicadorRef = useRef(null);

    const [ferramentasAberto, setFerramentasAberto] =
        useState(false);

    const {
        autenticado,
        temPermissao
    } = usePermissoes();

    // =========================================
    // PERMISSÕES DINÂMICAS
    // =========================================

    const podeVerNotas =
        temPermissao("nota.ler.todas") ||
        temPermissao("nota.ler.proprias");

    const podeGerenciarClientes =
        temPermissao("cliente.gerenciar");

    const podeGerenciarUsuarios =
        temPermissao("usuario.gerenciar");

    // =========================================
    // ITENS PRINCIPAIS
    // =========================================

    const itensMenu = [
        {
            titulo: "Início",
            rota: autenticado ? "/home" : "/portal",
            icone: CasaBranca,
            permitido: true
        },
        {
            titulo: "Conteúdos",
            rota: autenticado ? "/conteudos" : "/portal",
            icone: LivroBranco,
            permitido: autenticado
        },
        {
            titulo: "Notas Fiscais",
            rota: "/notas-fiscais",
            icone: DoisDocumentosBranco,
            permitido: autenticado && podeVerNotas
        },
        {
            titulo: "Clientes",
            rota: "/clientes",
            icone: ADDProfileBranco,
            permitido: autenticado && podeGerenciarClientes
        },
        {
            titulo: "Usuários",
            rota: "/usuario",
            icone: PessoaBranca,
            permitido: autenticado && podeGerenciarUsuarios
        }

    ].filter(item => item.permitido);

    // =========================================
    // FERRAMENTAS FISCAIS
    // =========================================

    const ferramentas = [
        {
            titulo: "Consultar NF-e",
            rota: "/consultar-chave",
            Icone: FileSearch,
            permitido: true
        },
        {
            titulo: "Glossário Fiscal",
            rota: "/glossario",
            Icone: BookOpen,
            permitido: true
        },
        {
            titulo: "Área do Cidadão",
            rota: "/area-cidadao",
            Icone: Users,
            permitido: true
        },
        {
            titulo: "Minha Biblioteca",
            rota: "/minha-biblioteca",
            Icone: Bookmark,
            permitido:
                autenticado &&
                (
                    temPermissao("favorito.gerenciar.proprios") ||
                    temPermissao("historico.leitura.gerenciar.proprio")
                )
        },
        {
            titulo: "Agenda Fiscal",
            rota: "/agenda-fiscal",
            Icone: CalendarDays,
            permitido:
                autenticado &&
                (
                    temPermissao("agenda.ler") ||
                    temPermissao("agenda.gerenciar")
                )
        },
        {
            titulo: "Simulador Tributário",
            rota: "/simulador-tributario",
            Icone: Calculator,
            permitido:
                autenticado &&
                (
                    temPermissao("simulador.calcular") ||
                    temPermissao("simulador.gerenciar")
                )
        },
        {
            titulo: "Assistente Fiscal IA",
            rota: "/assistente-ia",
            Icone: Bot,
            permitido:
                autenticado &&
                (
                    temPermissao("ia.consultar") ||
                    temPermissao("ia.gerenciar.artigos")
                )
        }

    ].filter(item => item.permitido);

    // =========================================
    // IDENTIFICAR FERRAMENTA ATIVA
    // =========================================

    const ferramentaAtiva = ferramentas.some(item =>
        location.pathname === item.rota ||
        location.pathname.startsWith(`${item.rota}/`)
    );

    const rotasMenu = itensMenu
        .map(item => item.rota)
        .join("|");

    const rotasFerramentas = ferramentas
        .map(item => item.rota)
        .join("|");

    // =========================================
    // CONTROLAR MENU AO NAVEGAR
    // =========================================

    useEffect(() => {

        const mobile = window.matchMedia(
            "(max-width: 700px)"
        ).matches;

        setFerramentasAberto(
            ferramentaAtiva && !mobile
        );

    }, [location.pathname, ferramentaAtiva]);

    // =========================================
    // INDICADOR ATIVO DESLIZANTE
    // =========================================

    useEffect(() => {

        const lista = listaRef.current;
        const indicador = indicadorRef.current;

        if (!lista || !indicador) return;

        let frame = null;

        function atualizarIndicador() {

            frame = null;

            const itemAtivo = lista.querySelector(
                ".integra-sidebar-item.integra-sidebar-ativo"
            );

            if (!itemAtivo) {

                indicador.style.opacity = "0";

                return;

            }

            const mobile = window.matchMedia(
                "(max-width: 700px)"
            ).matches;

            const retanguloLista =
                lista.getBoundingClientRect();

            const retanguloItem =
                itemAtivo.getBoundingClientRect();

            if (mobile) {

                const largura = Math.min(
                    30,
                    retanguloItem.width * 0.45
                );

                const posicaoX =
                    retanguloItem.left -
                    retanguloLista.left +
                    lista.scrollLeft +
                    (retanguloItem.width - largura) / 2;

                indicador.style.width =
                    `${largura}px`;

                indicador.style.height = "3px";

                indicador.style.transform =
                    `translate3d(${posicaoX}px, 0, 0)`;

            } else {

                const altura = Math.max(
                    20,
                    retanguloItem.height - 16
                );

                const posicaoY =
                    retanguloItem.top -
                    retanguloLista.top +
                    lista.scrollTop +
                    8;

                indicador.style.width = "3px";

                indicador.style.height =
                    `${altura}px`;

                indicador.style.transform =
                    `translate3d(0, ${posicaoY}px, 0)`;

            }

            indicador.style.opacity = "1";

        }

        function agendarAtualizacao() {

            if (frame !== null) return;

            frame = requestAnimationFrame(
                atualizarIndicador
            );

        }

        atualizarIndicador();

        // Atualiza quando o tamanho do menu mudar.

        const observador =
            typeof ResizeObserver !== "undefined"

                ? new ResizeObserver(agendarAtualizacao)

                : null;

        observador?.observe(lista);

        lista.querySelectorAll(
            ".integra-sidebar-item, .integra-sidebar-grupo"
        ).forEach(elemento => {

            observador?.observe(elemento);

        });

        window.addEventListener(
            "resize",
            agendarAtualizacao
        );

        lista.addEventListener(
            "scroll",
            agendarAtualizacao,
            { passive: true }
        );

        return () => {

            observador?.disconnect();

            window.removeEventListener(
                "resize",
                agendarAtualizacao
            );

            lista.removeEventListener(
                "scroll",
                agendarAtualizacao
            );

            if (frame !== null) {

                cancelAnimationFrame(frame);

            }

        };

    }, [
        location.pathname,
        ferramentasAberto,
        rotasMenu,
        rotasFerramentas
    ]);

    // =========================================
    // FECHAR MENU MOBILE AO CLICAR FORA
    // =========================================

    useEffect(() => {

        if (!ferramentasAberto) return;

        function clicarFora(event) {

            const mobile = window.matchMedia(
                "(max-width: 700px)"
            ).matches;

            if (
                mobile &&
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target)
            ) {

                setFerramentasAberto(false);

            }

        }

        function pressionarTecla(event) {

            if (event.key === "Escape") {

                setFerramentasAberto(false);

                ferramentasRef.current?.focus();

            }

        }

        document.addEventListener(
            "pointerdown",
            clicarFora
        );

        document.addEventListener(
            "keydown",
            pressionarTecla
        );

        return () => {

            document.removeEventListener(
                "pointerdown",
                clicarFora
            );

            document.removeEventListener(
                "keydown",
                pressionarTecla
            );

        };

    }, [ferramentasAberto]);

    // =========================================
    // FECHAR MENU AO SELECIONAR LINK
    // =========================================

    function fecharFerramentasMobile() {

        if (
            window.matchMedia("(max-width: 700px)").matches
        ) {

            setFerramentasAberto(false);

        }

    }

    // =========================================
    // LOGOUT
    // =========================================

    function sairSistema() {

        setFerramentasAberto(false);

        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        localStorage.removeItem("perfis");

        window.dispatchEvent(
            new Event("sessao-alterada")
        );

        navigate("/login", {
            replace: true
        });

    }

    // =========================================
    // LINKS PRINCIPAIS
    // =========================================

    function renderizarLinks() {

        return itensMenu.map((item, indice) => (

            <NavLink
                key={item.rota}
                to={item.rota}
                end={
                    item.rota === "/home" ||
                    item.rota === "/portal"
                }
                onClick={fecharFerramentasMobile}
                className={({ isActive }) =>
                    isActive
                        ? "integra-sidebar-item integra-sidebar-ativo"
                        : "integra-sidebar-item"
                }
                style={{
                    "--sidebar-atraso": `${indice * 55}ms`
                }}
                title={item.titulo}
            >

                <img
                    src={item.icone}
                    alt=""
                />

                <span>

                    {item.titulo}

                </span>

            </NavLink>

        ));

    }

    // =========================================
    // RENDERIZAÇÃO
    // =========================================

    return (

        <aside
            ref={sidebarRef}
            className="integra-sidebar"
            aria-label="Menu principal"
        >

            {/* =================================
                LOGOTIPO
            ================================= */}

            <div className="integra-sidebar-marca">

                <NavLink
                    to={autenticado ? "/home" : "/portal"}
                    className="integra-sidebar-marca-link"
                    aria-label="Voltar ao início"
                >

                    <img
                        src={LogoNome}
                        alt="Integra"
                        className="integra-sidebar-logo"
                    />

                </NavLink>

            </div>

            <div
                className="integra-sidebar-divisor-marca"
                aria-hidden="true"
            />

            {/* =================================
                NAVEGAÇÃO PRINCIPAL
            ================================= */}

            <nav
                ref={listaRef}
                className="integra-sidebar-lista"
                aria-label="Navegação principal"
            >

                {/* INDICADOR DESLIZANTE */}

                <span
                    ref={indicadorRef}
                    className="integra-sidebar-indicador"
                    aria-hidden="true"
                />

                {/* IDENTIFICAÇÃO DO MENU */}

                <div className="integra-sidebar-categoria">

                    NAVEGAÇÃO PRINCIPAL

                </div>

                {/* LINKS PRINCIPAIS */}

                {renderizarLinks()}

                {/* =================================
                    FERRAMENTAS FISCAIS
                ================================= */}

                {ferramentas.length > 0 && (

                    <>

                        <div
                            className="integra-sidebar-divisor"
                            aria-hidden="true"
                        />

                        <div className="integra-sidebar-categoria">

                            RECURSOS E FERRAMENTAS

                        </div>

                        <div
                            className="integra-sidebar-grupo"
                            style={{
                                "--sidebar-atraso":
                                    `${itensMenu.length * 55}ms`
                            }}
                        >

                            <button
                                ref={ferramentasRef}
                                type="button"
                                className={`integra-sidebar-item integra-sidebar-ferramentas ${
                                    ferramentaAtiva
                                        ? "integra-sidebar-ativo"
                                        : ""
                                } ${
                                    ferramentasAberto
                                        ? "integra-ferramentas-aberto"
                                        : ""
                                }`}
                                onClick={() =>
                                    setFerramentasAberto(
                                        anterior => !anterior
                                    )
                                }
                                aria-expanded={ferramentasAberto}
                                aria-controls="integra-submenu-ferramentas"
                                aria-label="Ferramentas Fiscais"
                            >

                                <Wrench
                                    className="integra-sidebar-icone"
                                    aria-hidden="true"
                                />

                                <span className="integra-ferramentas-desktop">

                                    Ferramentas Fiscais

                                </span>

                                <span className="integra-ferramentas-mobile">

                                    Ferramentas

                                </span>

                                <ChevronDown
                                    className={`integra-sidebar-seta ${
                                        ferramentasAberto
                                            ? "integra-seta-aberta"
                                            : ""
                                    }`}
                                    aria-hidden="true"
                                />

                            </button>

                            {/* =================================
                                SUBMENU DE FERRAMENTAS
                            ================================= */}

                            <div
                                id="integra-submenu-ferramentas"
                                className="integra-sidebar-submenu"
                                hidden={!ferramentasAberto}
                            >

                                {/* CABEÇALHO MOBILE */}

                                <div className="integra-submenu-topo">

                                    <div className="integra-submenu-titulo">

                                        <Wrench
                                            size={18}
                                            aria-hidden="true"
                                        />

                                        <strong>

                                            Ferramentas Fiscais

                                        </strong>

                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {

                                            setFerramentasAberto(false);

                                            ferramentasRef.current?.focus();

                                        }}
                                        aria-label="Fechar ferramentas"
                                    >

                                        <X size={21} />

                                    </button>

                                </div>

                                {/* LINKS DAS FERRAMENTAS */}

                                {ferramentas.map((item, indice) => {

                                    const Icone = item.Icone;

                                    return (

                                        <NavLink
                                            key={item.rota}
                                            to={item.rota}
                                            onClick={fecharFerramentasMobile}
                                            className={({ isActive }) =>
                                                isActive
                                                    ? "integra-sidebar-subitem integra-subitem-ativo"
                                                    : "integra-sidebar-subitem"
                                            }
                                            style={{
                                                "--submenu-atraso":
                                                    `${indice * 35}ms`
                                            }}
                                            title={item.titulo}
                                        >

                                            <Icone
                                                size={22}
                                                aria-hidden="true"
                                            />

                                            <span>

                                                {item.titulo}

                                            </span>

                                            <span
                                                className="integra-subitem-ponto"
                                                aria-hidden="true"
                                            />

                                        </NavLink>

                                    );

                                })}

                            </div>

                        </div>

                    </>

                )}

            </nav>

            {/* =================================
                RODAPÉ DO SIDEBAR
            ================================= */}

            <div className="integra-sidebar-rodape">

                <div
                    className="integra-sidebar-divisor"
                    aria-hidden="true"
                />

                {/* SAIR OU ENTRAR */}

                {autenticado ? (

                    <button
                        type="button"
                        className="integra-sidebar-sair integra-sidebar-logout"
                        onClick={sairSistema}
                    >

                        <img
                            src={SairBranco}
                            alt=""
                        />

                        <span>Sair</span>

                    </button>

                ) : (

                    <button
                        type="button"
                        className="integra-sidebar-sair"
                        onClick={() => navigate("/login")}
                    >

                        <img
                            src={PessoaBranca}
                            alt=""
                        />

                        <span>Entrar</span>

                    </button>

                )}

                {/* IDENTIDADE INSTITUCIONAL */}

                <div className="integra-sidebar-assinatura">

                    <span
                        className="integra-sidebar-assinatura-ponto"
                        aria-hidden="true"
                    />

                    <span>

                        Integra · 2026

                    </span>

                </div>

            </div>

        </aside>

    );

}