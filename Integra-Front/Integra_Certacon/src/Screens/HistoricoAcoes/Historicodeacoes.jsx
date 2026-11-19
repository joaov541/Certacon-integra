import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Historicodeacoes.css";
import { requisicaoApi } from "../../services/api";

import CasaBranca from "../../assets/Icones/CasaBranca.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
import LupaCinza from "../../assets/Icones/LupaCinza.png";
import SairBranco from "../../assets/Icones/SairBranco.png";
import LogoNome from "../../assets/Icones/LogoNome.png";
import LogoNomeMobile from "../../assets/Icones/LogoNomeMobile.png";
import Calendario from "../../assets/Icones/calendario.png";
import ExpandirText from "../../assets/Icones/ExpandirText.png";

const ITENS_POR_PAGINA = 5;

function dataUtcParaBrasil(valor) {
    if (!valor) return "—";
    const comFuso = /(?:Z|[+-]\d{2}:\d{2})$/i.test(valor) ? valor : `${valor}Z`;
    const data = new Date(comFuso);
    if (Number.isNaN(data.getTime())) return "—";
    return new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    }).format(data);
}

// O serviço de auditoria grava UTC; datas do filtro são do horário de Brasília.
// Como São Paulo não usa horário de verão atualmente, a meia-noite é UTC-03.
function inicioBrasiliaEmUtc(data) {
    return data ? new Date(`${data}T00:00:00-03:00`).toISOString() : "";
}
function diaSeguinteBrasilEmUtc(data) {
    if (!data) return "";
    const proximo = new Date(`${data}T00:00:00-03:00`);
    proximo.setUTCDate(proximo.getUTCDate() + 1);
    return proximo.toISOString();
}

function Historicodeacoes() {
    const [acoes, setAcoes] = useState([]);
    const [perfis, setPerfis] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [perfilSelecionado, setPerfilSelecionado] = useState("");
    const [usuarioSelecionado, setUsuarioSelecionado] = useState("");
    const [tipoSelecionado, setTipoSelecionado] = useState("");
    const [pesquisa, setPesquisa] = useState("");
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [perfilCabecalho, setPerfilCabecalho] = useState(null);
    const [filtrosAplicados, setFiltrosAplicados] = useState({});

    useEffect(() => {
        async function iniciar() {
            try {
                const [opcoes, meuPerfil] = await Promise.all([
                    requisicaoApi("/api/Auditoria/filtros"),
                    requisicaoApi("/api/MeuPerfil")
                ]);
                setPerfis(opcoes.perfis || []);
                setUsuarios(opcoes.usuarios || []);
                setTipos(opcoes.acoes || []);
                setPerfilCabecalho(meuPerfil);
            } catch (e) {
                console.error("Erro ao carregar filtros de auditoria:", e);
                setErro(e.message || "Não foi possível carregar os filtros.");
            }
        }
        iniciar();
    }, []);

    useEffect(() => {
        let ativo = true;
        async function carregar() {
            setCarregando(true);
            setErro("");
            try {
                const parametros = new URLSearchParams({
                    pagina: String(paginaAtual),
                    tamanhoPagina: String(ITENS_POR_PAGINA)
                });
                if (filtrosAplicados.perfilId) parametros.set("perfilId", filtrosAplicados.perfilId);
                if (filtrosAplicados.usuarioId) parametros.set("usuarioId", filtrosAplicados.usuarioId);
                if (filtrosAplicados.acao) parametros.set("acao", filtrosAplicados.acao);
                if (filtrosAplicados.pesquisa) parametros.set("pesquisa", filtrosAplicados.pesquisa);
                if (filtrosAplicados.dataInicio) parametros.set("dataInicio", inicioBrasiliaEmUtc(filtrosAplicados.dataInicio));
                if (filtrosAplicados.dataFim) parametros.set("dataFim", diaSeguinteBrasilEmUtc(filtrosAplicados.dataFim));

                const resposta = await requisicaoApi(`/api/Auditoria?${parametros.toString()}`);
                if (!ativo) return;
                setAcoes(resposta.registros || []);
                setTotalPaginas(Math.max(1, resposta.totalPaginas || 1));
            } catch (e) {
                if (ativo) {
                    setErro(e.message || "Erro ao carregar histórico.");
                    setAcoes([]);
                }
            } finally {
                if (ativo) setCarregando(false);
            }
        }
        carregar();
        return () => { ativo = false; };
    }, [paginaAtual, filtrosAplicados]);

    const usuariosDoPerfil = usuarios
        .filter(u => !perfilSelecionado || u.perfilId === perfilSelecionado)
        .filter((usuario, indice, arr) =>
            arr.findIndex(outro => outro.usuarioId === usuario.usuarioId) === indice
        );

    function buscarAcoes() {
        if (dataInicio && dataFim && dataInicio > dataFim) {
            alert("A data inicial não pode ser maior que a final.");
            return;
        }
        setPaginaAtual(1);
        setFiltrosAplicados({
            perfilId: perfilSelecionado,
            usuarioId: usuarioSelecionado,
            acao: tipoSelecionado,
            pesquisa: pesquisa.trim(),
            dataInicio,
            dataFim
        });
    }

    return (
        <div className="pagina-historico">
            <Sidebar />
            <main className="principal-historico">
                <Header
                    pesquisa={pesquisa}
                    setPesquisa={setPesquisa}
                    dadosPerfil={perfilCabecalho}
                    onBuscar={buscarAcoes}
                />
                <section className="conteudo-historico">
                    <NavLink to="/home" className="voltar-historico">← Voltar</NavLink>
                    <h1>Histórico de ações</h1>

                    <div className="filtros-historico">
                        <div className="campo-filtro periodo-filtro">
                            <label>Período</label>
                            <div className="campos-periodo">
                                <div className="campo-data">
                                    <input type="date" value={dataInicio}
                                        onChange={e => setDataInicio(e.target.value)} />
                                    <img src={Calendario} alt="Calendário" />
                                </div>
                                <span>-</span>
                                <div className="campo-data">
                                    <input type="date" value={dataFim}
                                        onChange={e => setDataFim(e.target.value)} />
                                    <img src={Calendario} alt="Calendário" />
                                </div>
                            </div>
                        </div>

                        <div className="campo-filtro perfil-filtro">
                            <label>Perfil</label>
                            <div className="select-personalizado">
                                <select value={perfilSelecionado} onChange={e => {
                                    setPerfilSelecionado(e.target.value);
                                    setUsuarioSelecionado("");
                                }}>
                                    <option value="">Todos os perfis</option>
                                    {perfis.map(p => <option key={p.perfilId} value={p.perfilId}>{p.nome}</option>)}
                                </select>
                                <img src={ExpandirText} alt="Expandir opções" />
                            </div>
                        </div>

                        <div className="campo-filtro usuario-filtro">
                            <label>Usuário</label>
                            <div className="select-personalizado">
                                <select value={usuarioSelecionado}
                                    onChange={e => setUsuarioSelecionado(e.target.value)}>
                                    <option value="">Todos os usuários</option>
                                    {usuariosDoPerfil.map(u => (
                                        <option key={u.usuarioId} value={u.usuarioId}>{u.nome}</option>
                                    ))}
                                </select>
                                <img src={ExpandirText} alt="Expandir opções" />
                            </div>
                        </div>

                        <div className="campo-filtro tipo-filtro">
                            <label>Tipo de ação</label>
                            <div className="select-personalizado">
                                <select value={tipoSelecionado}
                                    onChange={e => setTipoSelecionado(e.target.value)}>
                                    <option value="">Todas</option>
                                    {tipos.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                                </select>
                                <img src={ExpandirText} alt="Expandir opções" />
                            </div>
                        </div>

                        <button type="button" className="botao-buscar-historico"
                            onClick={buscarAcoes} disabled={carregando}>Buscar</button>
                    </div>

                    <div className="tabela-historico">
                        <table>
                            <thead>
                                <tr><th>Data e hora</th><th>Usuário</th><th>Ação</th><th>Descrição</th></tr>
                            </thead>
                            <tbody>
                                {carregando ? (
                                    <tr><td colSpan="4" className="sem-acoes">Carregando histórico...</td></tr>
                                ) : erro ? (
                                    <tr><td colSpan="4" className="sem-acoes">{erro}</td></tr>
                                ) : acoes.length ? acoes.map(item => (
                                    <tr key={item.logAuditoriaId}>
                                        <td>{dataUtcParaBrasil(item.dataHora)}</td>
                                        <td>{item.usuarioNome || "Sistema"}</td>
                                        <td>{item.acao || "—"}</td>
                                        <td>{item.detalhes || item.tabelaAfetada || "Sem detalhes"}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" className="sem-acoes">Nenhuma ação encontrada.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="paginacao-historico">
                        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(numero => (
                            <button key={numero} type="button" onClick={() => setPaginaAtual(numero)}
                                disabled={carregando}
                                className={paginaAtual === numero ? "pagina-ativa" : ""}>
                                {numero}
                            </button>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}

function Sidebar() {
    const navigate = useNavigate();
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
        <aside className="menu-historico">
            <div className="logo-historico">
                <img src={LogoNome} alt="Integra" className="logo-desktop-historico" />
                <img src={LogoNomeMobile} alt="Integra" className="logo-mobile-historico" />
            </div>
            <nav className="navegacao-historico">
                <NavLink to="/home" className="item-menu-historico"><img src={CasaBranca} alt="" /><span>Início</span></NavLink>
                <NavLink to="/conteudos" className="item-menu-historico"><img src={LivroBranco} alt="" /><span>Conteúdos</span></NavLink>
                {podeVerNotas && (
                    <NavLink to="/notas-fiscais" className="item-menu-historico"><img src={DoisDocumentosBranco} alt="" /><span>Notas Fiscais</span></NavLink>
                )}
                {ehAdministrador && (
                    <>
                        <NavLink to="/clientes" className="item-menu-historico"><img src={ADDProfileBranco} alt="" /><span>Clientes</span></NavLink>
                        <NavLink to="/usuario" className="item-menu-historico"><img src={PessoaBranca} alt="" /><span>Usuários</span></NavLink>
                    </>
                )}
            </nav>
            <button type="button" className="sair-historico" onClick={sair}>
                <img src={SairBranco} alt="" /><span>Sair</span>
            </button>
        </aside>
    );
}

function Header({ pesquisa, setPesquisa, dadosPerfil, onBuscar }) {
    const nome = dadosPerfil?.nome || "Usuário";
    const perfis = Array.isArray(dadosPerfil?.perfis) ? dadosPerfil.perfis : [];
    const iniciais = nome.trim().split(/\s+/).slice(0, 2)
        .map(parte => parte[0]).join("").toUpperCase();
    return (
        <header className="topo-historico">
            <div className="pesquisa-topo-historico">
                <img src={LupaCinza} alt="" />
                <input type="search" placeholder="Buscar ações..." value={pesquisa}
                    onChange={e => setPesquisa(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") onBuscar(); }} />
            </div>
            <div className="usuario-topo-historico">
                <NavLink to="/perfil" className="avatar-historico" aria-label="Ir para o perfil">
                    {iniciais || "U"}
                </NavLink>
                <div className="dados-usuario-historico">
                    <strong>{nome}</strong><span>{perfis.join(", ") || "Usuário"}</span>
                </div>
            </div>
        </header>
    );
}

export default Historicodeacoes;
