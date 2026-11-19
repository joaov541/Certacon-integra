import { useEffect, useRef, useState } from "react";
import "./Envioarquivoxml.css";

import { NavLink, useNavigate } from "react-router-dom";
import { requisicaoApi } from "../../services/api";

import CasaBranca from "../../assets/Icones/CasaBranca.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
import SairBranco from "../../assets/Icones/SairBranco.png";
import Lixeira from "../../assets/Icones/Lixeira.png";
import LogoNome from "../../assets/Icones/LogoNome.png";
import ArquivoDashboard from "../../assets/Icones/ArquivoDashboard.png";
import Upload from "../../assets/Icones/UploadBranco.png";
import UploadPreto from "../../assets/Icones/Upload.png";

import Header from "../../components/Header/header";
import HeaderDesktop from "../../components/Header/headerDesktop";

const API_UPLOAD = "/api/NotasFiscais/upload";
const API_NOTAS = "/api/NotasFiscais";
const LIMITE_ARQUIVO = 5_000_000;

function formatarTamanho(bytes) {
    if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
}

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

export default function EnvioArquivoXML() {
    const [carregandoArquivos, setCarregandoArquivos] = useState(true);
    const [arquivos, setArquivos] = useState([]);
    const [arrastando, setArrastando] = useState(false);
    const [mensagem, setMensagem] = useState("");
    const [tipoMensagem, setTipoMensagem] = useState("erro");
    const [pesquisa, setPesquisa] = useState("");
    const [enviando, setEnviando] = useState(false);

    const inputRef = useRef(null);
    const navigate = useNavigate();

    // =========================================
    // MENSAGENS
    // =========================================

    function mostrarMensagem(texto, tipo = "erro") {
        setMensagem(texto);
        setTipoMensagem(tipo);
    }

    // =========================================
    // SELECIONAR ARQUIVOS
    // =========================================

    // =========================================
    // CONSULTAR XMLs JÁ ENVIADOS
    // =========================================

    async function carregarArquivosEnviados() {
        try {
            setCarregandoArquivos(true);

            const notas = await requisicaoApi("/api/NotasFiscais");

            const arquivosEnviados = notas
                .filter((nota) => nota.possuiXml)
                .map((nota) => ({
                    id: nota.notaFiscalId,
                    nome: nota.nomeArquivo || `nfe_${nota.numero}.xml`,
                    tamanho: "—",
                    status: "Validado",
                    notaFiscalId: nota.notaFiscalId,
                    arquivoOriginal: null,
                    detalhe: "XML já importado e armazenado no sistema."
                }));

            setArquivos((atuais) => {
                // Mantém os arquivos selecionados que ainda não
                // foram enviados e substitui os registros salvos
                // pelos dados atualizados do banco.
                const locais = atuais.filter(
                    (arquivo) => !arquivo.notaFiscalId
                );

                return [...arquivosEnviados, ...locais];
            });
        } catch (erro) {
            console.error("Erro ao carregar XMLs:", erro);
            mostrarMensagem(
                erro.message || "Não foi possível consultar os XMLs enviados."
            );
        } finally {
            setCarregandoArquivos(false);
        }
    }
    useEffect(() => {
        carregarArquivosEnviados();
    }, []);



    function selecionarArquivos(lista) {
        if (enviando) return;

        setMensagem("");

        const selecionados = Array.from(lista || []);
        const validos = [];
        const erros = [];

        selecionados.forEach((arquivo) => {
            if (!arquivo.name.toLowerCase().endsWith(".xml")) {
                erros.push(`${arquivo.name}: formato inválido.`);
                return;
            }

            if (arquivo.size === 0) {
                erros.push(`${arquivo.name}: arquivo vazio.`);
                return;
            }

            if (arquivo.size > LIMITE_ARQUIVO) {
                erros.push(`${arquivo.name}: ultrapassa 5 MB.`);
                return;
            }

            validos.push({
                id: crypto.randomUUID(),
                nome: arquivo.name,
                tamanho: formatarTamanho(arquivo.size),
                arquivoOriginal: arquivo,
                notaFiscalId: null,
                status: "Pendente",
                detalhe: ""
            });
        });

        if (validos.length > 0) {
            setArquivos((atual) => [...atual, ...validos]);
        }

        if (erros.length > 0) {
            mostrarMensagem(erros.join(" "));
        }

        if (inputRef.current) {
            inputRef.current.value = "";
        }
    }

    // =========================================
    // ATUALIZAR UM ARQUIVO NA LISTA
    // =========================================

    function atualizarArquivo(id, alteracoes) {
        setArquivos((atual) =>
            atual.map((arquivo) =>
                arquivo.id === id
                    ? { ...arquivo, ...alteracoes }
                    : arquivo
            )
        );
    }

    // =========================================
    // ENVIAR XML PARA A API
    // =========================================

    async function enviarArquivos() {
        if (enviando) return;

        const pendentes = arquivos.filter(
            (arquivo) =>
                arquivo.status === "Pendente" ||
                arquivo.status === "Erro"
        );

        if (pendentes.length === 0) {
            mostrarMensagem("Não há arquivos pendentes para enviar.");
            return;
        }

        setEnviando(true);
        setMensagem("");

        let sucessos = 0;
        let falhas = 0;

        try {
            // Cada XML é importado individualmente,
            // pois a API recebe um IFormFile.
            for (const item of pendentes) {
                atualizarArquivo(item.id, {
                    status: "Enviando",
                    detalhe: ""
                });

                const formData = new FormData();

                // O nome "arquivo" corresponde ao
                // parâmetro IFormFile arquivo da API.
                formData.append(
                    "arquivo",
                    item.arquivoOriginal,
                    item.nome
                );

                try {
                    const resposta = await requisicaoApi(
                        API_UPLOAD,
                        {
                            method: "POST",
                            body: formData
                        }
                    );

                    atualizarArquivo(item.id, {
                        status: "Validado",
                        notaFiscalId:
                            resposta?.notaFiscalId ||
                            resposta?.NotaFiscalId ||
                            null,
                        arquivoOriginal: null,
                        detalhe:
                            resposta?.mensagem ||
                            "Nota fiscal importada com sucesso."
                    });

                    sucessos++;
                } catch (erro) {
                    console.error(
                        `Erro ao importar ${item.nome}:`,
                        erro
                    );

                    atualizarArquivo(item.id, {
                        status: "Erro",
                        detalhe:
                            erro.message ||
                            "Não foi possível importar o XML."
                    });

                    falhas++;
                }
            }
            if (sucessos > 0) {
                await carregarArquivosEnviados();
            }
            if (falhas === 0) {
                mostrarMensagem(
                    `${sucessos} arquivo(s) importado(s) com sucesso!`,
                    "sucesso"
                );
            } else {
                mostrarMensagem(
                    `${sucessos} arquivo(s) importado(s). ` +
                    `${falhas} arquivo(s) apresentaram erro.`
                );
            }
        } finally {
            setEnviando(false);
        }
    }

    // =========================================
    // REMOVER ARQUIVO
    // =========================================

    async function excluirArquivo(item) {
        if (enviando) return;

        // Arquivo ainda não importado:
        // remove somente da lista local.
        if (!item.notaFiscalId) {
            setArquivos((atual) =>
                atual.filter((arquivo) => arquivo.id !== item.id)
            );
            return;
        }

        // Arquivo já importado:
        // utiliza a rota que preserva a nota fiscal.
        const confirmar = window.confirm(
            "Deseja excluir o XML enviado? " +
            "O registro da nota fiscal será preservado."
        );

        if (!confirmar) return;

        try {
            await requisicaoApi(
                `${API_NOTAS}/${item.notaFiscalId}/xml`,
                {
                    method: "DELETE"
                }
            );

            setArquivos((atual) =>
                atual.filter((arquivo) => arquivo.id !== item.id)
            );

            mostrarMensagem(
                "Solicitação de exclusão do XML concluída. " +
                "A nota fiscal foi preservada.",
                "sucesso"
            );
        } catch (erro) {
            console.error("Erro ao excluir XML:", erro);

            mostrarMensagem(
                erro.message ||
                "Não foi possível excluir o XML."
            );
        }
    }

    // =========================================
    // FILTRAR ARQUIVOS
    // =========================================

    const arquivosFiltrados = arquivos.filter((arquivo) =>
        arquivo.nome
            .toLowerCase()
            .includes(pesquisa.toLowerCase())
    );

    const possuiPendentes = arquivos.some(
        (arquivo) =>
            arquivo.status === "Pendente" ||
            arquivo.status === "Erro"
    );

    // =========================================
    // TELA
    // =========================================

    return (
        <div className="xml-pagina">
            <Sidebar />

            <main className="xml-principal">
                <HeaderDesktop
                    pesquisa={pesquisa}
                    setPesquisa={setPesquisa}
                />

                <Header
                    pesquisa={pesquisa}
                    setPesquisa={setPesquisa}
                />

                <section className="xml-conteudo">
                    <button
                        type="button"
                        className="xml-botao-voltar"
                        onClick={() => navigate(-1)}
                        title="Voltar"
                    >
                        ← voltar
                    </button>

                    <h1>Enviar arquivo XML</h1>

                    <input
                        ref={inputRef}
                        className="xml-input-arquivo"
                        type="file"
                        accept=".xml,application/xml,text/xml"
                        multiple
                        disabled={enviando}
                        onChange={(e) =>
                            selecionarArquivos(e.target.files)
                        }
                    />

                    <div className="xml-area-superior">
                        <button
                            type="button"
                            className="xml-botao-selecionar"
                            disabled={enviando}
                            onClick={() => inputRef.current?.click()}
                        >
                            <img src={Upload} alt="" />
                            <span>Envie um arquivo XML</span>
                        </button>

                        <div
                            className={`xml-area-soltar ${arrastando ? "xml-arrastando" : ""
                                }`}
                            onDragOver={(e) => {
                                e.preventDefault();

                                if (!enviando) {
                                    setArrastando(true);
                                }
                            }}
                            onDragLeave={() => setArrastando(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setArrastando(false);

                                if (!enviando) {
                                    selecionarArquivos(
                                        e.dataTransfer.files
                                    );
                                }
                            }}
                            onClick={() => {
                                if (!enviando) {
                                    inputRef.current?.click();
                                }
                            }}
                            role="button"
                            tabIndex={enviando ? -1 : 0}
                            onKeyDown={(e) => {
                                if (
                                    !enviando &&
                                    (e.key === "Enter" || e.key === " ")
                                ) {
                                    e.preventDefault();
                                    inputRef.current?.click();
                                }
                            }}
                        >
                            <strong>
                                Ou solte seu documento aqui
                            </strong>

                            <img src={UploadPreto} alt="" />

                            <span>Tamanho Máximo de 5MB</span>
                            <span>Formato: XML</span>
                        </div>
                    </div>

                    {mensagem && (
                        <p
                            className={`xml-mensagem ${tipoMensagem === "sucesso"
                                ? "xml-mensagem-sucesso"
                                : ""
                                }`}
                            role="status"
                        >
                            {mensagem}
                        </p>
                    )}

                    <div className="xml-lista">
                        <div className="xml-lista-titulo">
                            Arquivos Enviados
                        </div>

                        {arquivosFiltrados.length > 0 ? (
                            arquivosFiltrados.map((item) => (
                                <div
                                    className="xml-arquivo"
                                    key={item.id}
                                >
                                    <div className="xml-arquivo-nome">
                                        <img
                                            src={ArquivoDashboard}
                                            alt=""
                                        />

                                        <span title={item.nome}>
                                            {item.nome}
                                        </span>
                                    </div>

                                    <span className="xml-arquivo-tamanho">
                                        {item.tamanho}
                                    </span>

                                    <span
                                        className={`xml-status ${item.status === "Validado"
                                            ? "xml-status-validado"
                                            : "xml-status-pendente"
                                            }`}
                                        title={item.detalhe}
                                    >
                                        {item.status}
                                    </span>

                                    <button
                                        type="button"
                                        className="xml-botao-excluir"
                                        title={
                                            item.notaFiscalId
                                                ? "Excluir XML, preservando a nota"
                                                : "Remover da lista"
                                        }
                                        disabled={enviando}
                                        onClick={() => excluirArquivo(item)}
                                    >
                                        <img
                                            src={Lixeira}
                                            alt="Excluir"
                                        />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="xml-lista-vazia">
                                {carregandoArquivos
                                    ? "Carregando arquivos enviados..."
                                    : "Nenhum arquivo encontrado."}
                            </p>
                        )}
                    </div>

                    <div className="xml-rodape">
                        <button
                            type="button"
                            className="xml-botao-enviar"
                            onClick={enviarArquivos}
                            disabled={enviando || !possuiPendentes}
                        >
                            {enviando ? "Enviando..." : "Enviar"}
                        </button>
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

function Sidebar() {
    const navigate = useNavigate();
    const ehAdministrador = obterPerfisUsuario().includes("Administrador");

    return (
        <aside className="xml-sidebar">
            <div className="xml-logo">
                <img src={LogoNome} alt="Integra" />
            </div>

            <nav className="xml-menu">
                <NavLink to="/home" className="xml-menu-item">
                    <img src={CasaBranca} alt="" />
                    <span>Início</span>
                </NavLink>

                <NavLink to="/conteudos" className="xml-menu-item">
                    <img src={LivroBranco} alt="" />
                    <span>Conteúdos</span>
                </NavLink>

                <NavLink
                    to="/notas-fiscais"
                    className={({ isActive }) =>
                        isActive
                            ? "xml-menu-item xml-menu-ativo"
                            : "xml-menu-item"
                    }
                >
                    <img src={DoisDocumentosBranco} alt="" />
                    <span>Notas Fiscais</span>
                </NavLink>

                {ehAdministrador && (
                    <>
                        <NavLink to="/clientes" className="xml-menu-item">
                            <img src={ADDProfileBranco} alt="" />
                            <span>Clientes</span>
                        </NavLink>

                        <NavLink to="/usuario" className="xml-menu-item">
                            <img src={PessoaBranca} alt="" />
                            <span>Usuários</span>
                        </NavLink>
                    </>
                )}
            </nav>

            <div className="xml-menu-inferior">
                <button
                    type="button"
                    className="xml-sair"
                    onClick={() => {
                        localStorage.removeItem("token");
                        localStorage.removeItem("usuario");
                        localStorage.removeItem("perfis");
                        navigate("/login", { replace: true });
                    }}
                >
                    <img src={SairBranco} alt="" />
                    <span>Sair</span>
                </button>
            </div>
        </aside>
    );
}

// =========================================
// MENU MOBILE
// =========================================

function FooterMobile() {
    const ehAdministrador = obterPerfisUsuario().includes("Administrador");
    return (
        <footer className="footer-conteudos-mobile">
            <NavLink
                to="/home"
                className={({ isActive }) =>
                    isActive
                        ? "item-footer-mobile footer-ativo"
                        : "item-footer-mobile"
                }
            >
                <img src={CasaBranca} alt="" />
                <span>Início</span>
            </NavLink>

            <NavLink
                to="/conteudos"
                className={({ isActive }) =>
                    isActive
                        ? "item-footer-mobile footer-ativo"
                        : "item-footer-mobile"
                }
            >
                <img src={LivroBranco} alt="" />
                <span>Conteúdos</span>
            </NavLink>

            <NavLink
                to="/notas-fiscais"
                className={({ isActive }) =>
                    isActive
                        ? "item-footer-mobile footer-ativo"
                        : "item-footer-mobile"
                }
            >
                <img src={DoisDocumentosBranco} alt="" />
                <span>Notas Fiscais</span>
            </NavLink>

            {ehAdministrador && (
                <>
                    <NavLink
                        to="/clientes"
                        className={({ isActive }) =>
                            isActive
                                ? "item-footer-mobile footer-ativo"
                                : "item-footer-mobile"
                        }
                    >
                        <img src={ADDProfileBranco} alt="" />
                        <span>Clientes</span>
                    </NavLink>

                    <NavLink
                        to="/usuario"
                        className={({ isActive }) =>
                            isActive
                                ? "item-footer-mobile footer-ativo"
                                : "item-footer-mobile"
                        }
                    >
                        <img src={PessoaBranca} alt="" />
                        <span>Usuários</span>
                    </NavLink>
                </>
            )}
        </footer>
    );
}
