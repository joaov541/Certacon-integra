
import "./Notasfiscais.css";
import { useState, useEffect, useRef } from "react";
import { requisicaoApi } from "../../services/api";

import CasaBranca from "../../assets/Icones/CasaBranca.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
import SairBranco from "../../assets/Icones/SairBranco.png";
import Lixeira from "../../assets/Icones/Lixeira.png";
import LogoNome from "../../assets/Icones/LogoNome.png";
import LogoNomeMobile from "../../assets/Icones/LogoNomeMobile.png";
import Calendario from "../../assets/Icones/calendario.png";

import Header from "../../components/Header/header";
import HeaderDesktop from "../../components/Header/headerDesktop";

import { Link, useNavigate } from "react-router-dom";

// Perfis do usuário autenticado (controle visual; API valida o JWT).
function obterPerfisUsuario() {
    try {
        const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
        const perfisSalvos = JSON.parse(localStorage.getItem("perfis") || "[]");
        return Array.isArray(usuario.perfis) && usuario.perfis.length
            ? usuario.perfis
            : Array.isArray(perfisSalvos) ? perfisSalvos : [];
    } catch {
        return [];
    }
}

function NotasFiscais() {

    const navigate = useNavigate();

    // REFERÊNCIA DO INPUT DE ARQUIVO
    const inputArquivoRef = useRef(null);

    // ESTADOS
    const [notas, setNotas] = useState([]);
    const [pesquisa, setPesquisa] = useState("");
    const [cliente, setCliente] = useState("Todos");
    const [status, setStatus] = useState("Todos");

    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");
    const [buscaRealizada, setBuscaRealizada] = useState(false);

    const [pagina, setPagina] = useState(1);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    // ESTADOS DA IMPORTAÇÃO XML
    const [importando, setImportando] = useState(false);
    const [mensagemImportacao, setMensagemImportacao] = useState("");
    const [erroImportacao, setErroImportacao] = useState("");

    const itensPorPagina = 4;

    // DADOS DO USUÁRIO LOGADO
    const perfis = obterPerfisUsuario();
    const podeExcluir = perfis.includes("Administrador");
    const podeImportarXml = perfis.some(perfil => [
        "Coordenador Fiscal",
        "Analista SPED",
        "Analista de Documentos Fiscais",
        "Analista de Reforma Tributária",
        "Cliente"
    ].includes(perfil));


    // =========================================
    // CARREGAR NOTAS DA API
    // =========================================

    async function carregarNotas() {

        try {
            setCarregando(true);
            setErro("");

            const dados = await requisicaoApi("/api/NotasFiscais");

            setNotas(Array.isArray(dados) ? dados : []);

        } catch (error) {

            console.error("Erro ao carregar notas:", error);

            setErro(
                error.message || "Não foi possível carregar as notas fiscais."
            );

        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarNotas();
    }, []);


    // =========================================
    // IMPORTAR XML
    // =========================================

    async function importarXml(event) {

        const arquivo = event.target.files?.[0];

        if (!arquivo) return;

        setMensagemImportacao("");
        setErroImportacao("");

        // VALIDAR EXTENSÃO
        if (!arquivo.name.toLowerCase().endsWith(".xml")) {

            setErroImportacao(
                "Selecione um arquivo com extensão .xml."
            );

            event.target.value = "";
            return;
        }

        // VALIDAR TAMANHO MÁXIMO DE 5 MB
        if (arquivo.size > 5_000_000) {

            setErroImportacao(
                "O arquivo XML deve ter no máximo 5 MB."
            );

            event.target.value = "";
            return;
        }

        // CRIAR FORMULÁRIO
        const formulario = new FormData();

        // O nome deve ser exatamente "arquivo"
        // conforme o parâmetro IFormFile do controller.
        formulario.append("arquivo", arquivo);

        try {

            setImportando(true);

            // ENVIAR XML PARA A API
            const resultado = await requisicaoApi(
                "/api/NotasFiscais/upload",
                {
                    method: "POST",
                    body: formulario
                }
            );

            // ATUALIZAR LISTAGEM
            const dados = await requisicaoApi("/api/NotasFiscais");

            setNotas(Array.isArray(dados) ? dados : []);

            setPagina(1);

            setMensagemImportacao(
                resultado?.mensagem ||
                "Nota fiscal importada com sucesso!"
            );

        } catch (error) {

            console.error("Erro ao importar XML:", error);

            setErroImportacao(
                error.message || "Não foi possível importar o XML."
            );

        } finally {

            setImportando(false);

            // LIMPAR INPUT PARA PERMITIR SELECIONAR O MESMO ARQUIVO
            event.target.value = "";
        }
    }


    // =========================================
    // FORMATAR DATA
    // =========================================

    function formatarData(data) {

        if (!data) return "Não informada";

        const partes = data.split("T")[0].split("-");

        if (partes.length !== 3) return "Não informada";

        const [ano, mes, dia] = partes;

        return `${dia}/${mes}/${ano}`;
    }


    // =========================================
    // FORMATAR VALOR
    // =========================================

    function formatarValor(valor) {

        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }


    // =========================================
    // TRADUZIR STATUS
    // =========================================

    function formatarStatus(status) {

        const situacao = (status || "").toUpperCase();

        const statusFormatados = {
            IMPORTADA: "Importada",
            PROCESSADO: "Processada",
            PENDENTE: "Pendente",
            PROCESSANDO: "Processando",
            ERRO: "Erro",
            ARQUIVADA: "Arquivada",
            CANCELADA: "Cancelada",
            AUTENTICADA: "Autenticada"
        };

        return statusFormatados[situacao] || status || "Não informado";
    }


    // =========================================
    // CLASSE VISUAL DO STATUS
    // =========================================

    function classeStatus(status) {

        const situacao = (status || "").toUpperCase();

        if (
            situacao === "IMPORTADA" ||
            situacao === "PROCESSADO" ||
            situacao === "AUTENTICADA"
        ) {
            return "status-autenticada";
        }

        if (
            situacao === "CANCELADA" ||
            situacao === "ARQUIVADA" ||
            situacao === "ERRO"
        ) {
            return "status-cancelada";
        }

        return "status-pendente";
    }


    // =========================================
    // CLIENTES DISPONÍVEIS
    // =========================================

    const clientesDisponiveis = [
        ...new Set(
            notas
                .map(nota => nota.cnpjdestinatario || nota.cnpjemitente)
                .filter(Boolean)
        )
    ];


    // =========================================
    // FILTRAR NOTAS
    // =========================================

    const notasFiltradas = notas.filter(nota => {

        const chave = (nota.chaveAcesso || "").toLowerCase();

        const nomeCliente = (
            nota.cnpjdestinatario || nota.cnpjemitente || ""
        ).toLowerCase();

        const textoPesquisa = pesquisa.toLowerCase();

        const correspondePesquisa =
            chave.includes(textoPesquisa) ||
            nomeCliente.includes(textoPesquisa);

        const clienteNota =
            nota.cnpjdestinatario || nota.cnpjemitente || "";

        const correspondeCliente =
            cliente === "Todos" || clienteNota === cliente;

        const correspondeStatus =
            status === "Todos" ||
            formatarStatus(nota.status) === status;

        const dataNota = nota.dataEmissao
            ? nota.dataEmissao.split("T")[0]
            : "";

        const correspondeData =
            !buscaRealizada ||
            (
                (!dataInicio || dataNota >= dataInicio) &&
                (!dataFim || dataNota <= dataFim)
            );

        return (
            correspondePesquisa &&
            correspondeCliente &&
            correspondeStatus &&
            correspondeData
        );
    });


    // =========================================
    // PAGINAÇÃO
    // =========================================

    const totalPaginas = Math.max(
        1,
        Math.ceil(notasFiltradas.length / itensPorPagina)
    );

    const notasPagina = notasFiltradas.slice(
        (pagina - 1) * itensPorPagina,
        pagina * itensPorPagina
    );


    // =========================================
    // BUSCAR POR PERÍODO
    // =========================================

    function buscarNotas() {

        setBuscaRealizada(true);
        setPagina(1);
    }


    // =========================================
    // ARQUIVAR NOTA
    // =========================================

    async function excluirNota(id) {

        const confirmar = window.confirm(
            "Deseja realmente arquivar esta nota fiscal?"
        );

        if (!confirmar) return;

        try {

            await requisicaoApi(`/api/NotasFiscais/${id}`, {
                method: "DELETE"
            });

            setNotas(lista =>
                lista.map(nota =>
                    nota.notaFiscalId === id
                        ? { ...nota, status: "ARQUIVADA" }
                        : nota
                )
            );

            alert("Nota fiscal arquivada com sucesso!");

        } catch (error) {

            console.error("Erro ao arquivar nota:", error);

            alert(
                error.message || "Não foi possível arquivar a nota."
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

        <div className="pagina-notas">

            <Sidebar sairSistema={sairSistema} />

            <main className="principal-notas">

                <HeaderDesktop
                    pesquisa={pesquisa}
                    setPesquisa={setPesquisa}
                />

                <Header
                    pesquisa={pesquisa}
                    setPesquisa={setPesquisa}
                />

                <section className="conteudo-notas">

                    <h1>Notas Fiscais</h1>


                    {/* IMPORTAÇÃO DE XML */}

                    {podeImportarXml && (
                    <div className="area-importacao-notas">

                        <input
                            type="file"
                            accept=".xml,application/xml,text/xml"
                            ref={inputArquivoRef}
                            onChange={importarXml}
                            hidden
                        />

                        <button
                            type="button"
                            className="botao-importar-xml"
                            onClick={() => inputArquivoRef.current?.click()}
                            disabled={importando}
                        >

                            {importando ? (
                                "Importando XML..."
                            ) : (
                                <>
                                    <span>+</span>
                                    Importar XML
                                </>
                            )}

                        </button>

                    </div>
                    )}


                    {/* MENSAGEM DE SUCESSO */}

                    {mensagemImportacao && (

                        <div className="mensagem-importacao sucesso">
                            {mensagemImportacao}
                        </div>

                    )}


                    {/* MENSAGEM DE ERRO */}

                    {erroImportacao && (

                        <div className="mensagem-importacao falha">
                            {erroImportacao}
                        </div>

                    )}


                    {/* FILTROS */}

                    <div className="filtros-notas">

                        <div className="filtro-periodo">

                            <label>Período</label>

                            <div className="campo-periodo">

                                <div className="campo-data-notas">

                                    <input
                                        type="date"
                                        value={dataInicio}
                                        onChange={(e) => setDataInicio(e.target.value)}
                                    />

                                    <img
                                        src={Calendario}
                                        alt="Selecionar data inicial"
                                        onClick={(e) =>
                                            e.currentTarget.previousElementSibling.showPicker?.()
                                        }
                                    />

                                </div>

                                <span>-</span>

                                <div className="campo-data-notas">

                                    <input
                                        type="date"
                                        value={dataFim}
                                        onChange={(e) => setDataFim(e.target.value)}
                                    />

                                    <img
                                        src={Calendario}
                                        alt="Selecionar data final"
                                        onClick={(e) =>
                                            e.currentTarget.previousElementSibling.showPicker?.()
                                        }
                                    />

                                </div>

                            </div>

                        </div>


                        {/* FILTRO CLIENTE */}

                        <div className="filtro-cliente">

                            <label>Cliente</label>

                            <select
                                value={cliente}
                                onChange={(e) => {
                                    setCliente(e.target.value);
                                    setPagina(1);
                                }}
                            >

                                <option value="Todos">Todos</option>

                                {clientesDisponiveis.map(cnpj => (

                                    <option key={cnpj} value={cnpj}>
                                        {cnpj}
                                    </option>

                                ))}

                            </select>

                        </div>


                        {/* FILTRO STATUS */}

                        <div className="filtro-status">

                            <label>Status</label>

                            <select
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value);
                                    setPagina(1);
                                }}
                            >

                                <option value="Todos">Todos</option>
                                <option value="Importada">Importada</option>
                                <option value="Processada">Processada</option>
                                <option value="Autenticada">Autenticada</option>
                                <option value="Processando">Processando</option>
                                <option value="Pendente">Pendente</option>
                                <option value="Erro">Erro</option>
                                <option value="Cancelada">Cancelada</option>
                                <option value="Arquivada">Arquivada</option>

                            </select>

                        </div>

                    </div>


                    {/* TABELA */}

                    <div className="tabela-notas-container">

                        <table className="tabela-notas">

                            <thead>

                                <tr>
                                    <th>Chave de acesso</th>
                                    <th>Emissão</th>
                                    <th>Cliente</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                    {podeExcluir && <th>Ações</th>}
                                </tr>

                            </thead>


                            <tbody>

                                {carregando ? (

                                    <tr>
                                        <td colSpan={podeExcluir ? 6 : 5} className="nenhuma-nota">
                                            Carregando notas fiscais...
                                        </td>
                                    </tr>

                                ) : erro ? (

                                    <tr>
                                        <td colSpan={podeExcluir ? 6 : 5} className="nenhuma-nota">
                                            {erro}
                                        </td>
                                    </tr>

                                ) : notasPagina.length > 0 ? (

                                    notasPagina.map(nota => (

                                        <tr key={nota.notaFiscalId}>

                                            <td className="chave-nota">
                                                {nota.chaveAcesso || "Não informada"}
                                            </td>

                                            <td>
                                                {formatarData(nota.dataEmissao)}
                                            </td>

                                            <td>
                                                {nota.cnpjdestinatario || nota.cnpjemitente || "Não informado"}
                                            </td>

                                            <td>
                                                {formatarValor(nota.valorTotal)}
                                            </td>

                                            <td>

                                                <span className={`status-nota ${classeStatus(nota.status)}`}>
                                                    {formatarStatus(nota.status)}
                                                </span>

                                            </td>

                                            {podeExcluir && (
                                                <td>
                                                    {nota.status !== "ARQUIVADA" && (
                                                        <button
                                                            type="button"
                                                            className="botao-excluir-nota"
                                                            title="Arquivar nota fiscal"
                                                            onClick={() => excluirNota(nota.notaFiscalId)}
                                                        >
                                                            <img src={Lixeira} alt="Arquivar" />
                                                        </button>
                                                    )}
                                                </td>
                                            )}

                                        </tr>

                                    ))

                                ) : (

                                    <tr>
                                        <td colSpan={podeExcluir ? 6 : 5} className="nenhuma-nota">
                                            Nenhuma nota fiscal encontrada.
                                        </td>
                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>


                    {/* PAGINAÇÃO */}

                    {!carregando && !erro && notasFiltradas.length > 0 && (

                        <div className="paginacao-notas">

                            <button
                                disabled={pagina === 1}
                                onClick={() => setPagina(pagina - 1)}
                            >
                                Anterior
                            </button>

                            {Array.from(
                                { length: totalPaginas },
                                (_, i) => i + 1
                            ).map(numero => (

                                <button
                                    key={numero}
                                    className={pagina === numero ? "pagina-ativa" : ""}
                                    onClick={() => setPagina(numero)}
                                >
                                    {numero}
                                </button>

                            ))}

                            <button
                                disabled={pagina === totalPaginas}
                                onClick={() => setPagina(pagina + 1)}
                            >
                                &gt;
                            </button>

                        </div>

                    )}

                </section>

            </main>

        </div>
    );
}


// =========================================
// MENU LATERAL
// =========================================

function Sidebar({ sairSistema }) {
    const ehAdministrador = obterPerfisUsuario().includes("Administrador");

    return (

        <aside className="menu-notas">

            <div className="logo-notas">

                <picture>

                    <source
                        media="(max-width: 650px)"
                        srcSet={LogoNomeMobile}
                    />

                    <img src={LogoNome} alt="Integra" />

                </picture>

            </div>


            <nav className="navegacao-notas">

                <Link to="/home" className="item-menu-notas">
                    <img src={CasaBranca} alt="" />
                    <span>Início</span>
                </Link>

                <Link to="/conteudos" className="item-menu-notas">
                    <img src={LivroBranco} alt="" />
                    <span>Conteúdos</span>
                </Link>

                <Link
                    to="/notas-fiscais"
                    className="item-menu-notas menu-notas-ativo"
                >
                    <img src={DoisDocumentosBranco} alt="" />
                    <span>Notas Fiscais</span>
                </Link>

                {ehAdministrador && (
                    <>
                        <Link to="/clientes" className="item-menu-notas">
                            <img src={ADDProfileBranco} alt="" />
                            <span>Clientes</span>
                        </Link>

                        <Link to="/usuario" className="item-menu-notas">
                            <img src={PessoaBranca} alt="" />
                            <span>Usuários</span>
                        </Link>
                    </>
                )}

            </nav>


            <button
                type="button"
                className="sair-notas"
                onClick={sairSistema}
            >
                <img src={SairBranco} alt="" />
                <span>Sair</span>
            </button>

        </aside>
    );
}

export default NotasFiscais;
