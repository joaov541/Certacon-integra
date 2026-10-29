
import { useRef, useState } from "react";
import "./Envioarquivoxml.css";

import CasaBranca from "../../assets/Icones/CasaBranca.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
import LupaCinza from "../../assets/Icones/LupaCinza.png";
import SairBranco from "../../assets/Icones/SairBranco.png";
import Lixeira from "../../assets/Icones/Lixeira.png";
import LogoNome from "../../assets/Icones/LogoNome.png";
import ArquivoDashboard from "../../assets/Icones/ArquivoDashboard.png";
import Upload from "../../assets/Icones/UploadBranco.png";
import UploadPreto from "../../assets/Icones/Upload.png";


const arquivosIniciais = [
    { id: 1, nome: "nfe_123456.xml", tamanho: "2.4MB", status: "Validado" },
    { id: 2, nome: "nfe_987432.xml", tamanho: "1.8MB", status: "Pendente" },
    { id: 3, nome: "nfe_987432.xml", tamanho: "1.8MB", status: "Pendente" },
    { id: 4, nome: "nfe_987432.xml", tamanho: "1.8MB", status: "Pendente" },
    { id: 5, nome: "nfe_987432.xml", tamanho: "1.8MB", status: "Pendente" },
    { id: 6, nome: "nfe_987432.xml", tamanho: "1.8MB", status: "Pendente" },
];

export default function EnvioArquivoXML() {
    const [arquivos, setArquivos] = useState(arquivosIniciais);
    const [arrastando, setArrastando] = useState(false);
    const [mensagem, setMensagem] = useState("");
    const inputRef = useRef(null);

    function selecionarArquivos(lista) {
        setMensagem("");

        const novos = Array.from(lista);
        const validos = [];

        novos.forEach((arquivo) => {
            if (!arquivo.name.toLowerCase().endsWith(".xml")) {
                setMensagem("Selecione somente arquivos XML.");
                return;
            }

            if (arquivo.size > 10 * 1024 * 1024) {
                setMensagem(`O arquivo ${arquivo.name} ultrapassa 10 MB.`);
                return;
            }

            validos.push({
                id: `${Date.now()}-${Math.random()}`,
                nome: arquivo.name,
                tamanho:
                    arquivo.size >= 1024 * 1024
                        ? `${(arquivo.size / (1024 * 1024)).toFixed(1)}MB`
                        : `${Math.max(1, Math.round(arquivo.size / 1024))}KB`,
                status: "Pendente",
            });
        });

        if (validos.length) {
            setArquivos((atual) => [...atual, ...validos]);
        }

        if (inputRef.current) {
            inputRef.current.value = "";
        }
    }

    function excluirArquivo(id) {
        setArquivos((atual) => atual.filter((arquivo) => arquivo.id !== id));
    }

    function enviarArquivos() {
        if (!arquivos.some((arquivo) => arquivo.status === "Pendente")) {
            setMensagem("Não há arquivos pendentes para enviar.");
            return;
        }

        setArquivos((atual) =>
            atual.map((arquivo) =>
                arquivo.status === "Pendente"
                    ? { ...arquivo, status: "Validado" }
                    : arquivo
            )
        );

        setMensagem("Arquivos processados com sucesso.");
    }

    return (
        <div className="xml-pagina">
            <Sidebar />

            <main className="xml-principal">
                <Header />

                <section className="xml-conteudo">
                    <h1>Enviar arquivo XML</h1>

                    <input
                        ref={inputRef}
                        className="xml-input-arquivo"
                        type="file"
                        accept=".xml,application/xml,text/xml"
                        multiple
                        onChange={(e) => selecionarArquivos(e.target.files)}
                    />

                    <div className="xml-area-superior">
                        <button
                            className="xml-botao-selecionar"
                            onClick={() => inputRef.current?.click()}
                        >
                            <img src={Upload} alt="" />
                            <span>Envie um arquivo XML</span>
                        </button>

                        <div
                            className={`xml-area-soltar ${arrastando ? "xml-arrastando" : ""}`}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setArrastando(true);
                            }}
                            onDragLeave={() => setArrastando(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setArrastando(false);
                                selecionarArquivos(e.dataTransfer.files);
                            }}
                            onClick={() => inputRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    inputRef.current?.click();
                                }
                            }}
                        >
                            <strong>Ou solte seu documento aqui</strong>
                            <img src={UploadPreto} alt="" />
                            <span>Tamanho Máximo de 10MB</span>
                            <span>Formato: XML</span>
                        </div>
                    </div>

                    {mensagem && (
                        <p className="xml-mensagem" role="status">
                            {mensagem}
                        </p>
                    )}

                    <div className="xml-lista">
                        <div className="xml-lista-titulo">
                            Arquivos Enviados
                        </div>

                        {arquivos.length ? (
                            arquivos.map((arquivo) => (
                                <div className="xml-arquivo" key={arquivo.id}>
                                    <div className="xml-arquivo-nome">
                                        <img src={ArquivoDashboard} alt="" />
                                        <span title={arquivo.nome}>
                                            {arquivo.nome}
                                        </span>
                                    </div>

                                    <span className="xml-arquivo-tamanho">
                                        {arquivo.tamanho}
                                    </span>

                                    <span
                                        className={`xml-status ${
                                            arquivo.status === "Validado"
                                                ? "xml-status-validado"
                                                : "xml-status-pendente"
                                        }`}
                                    >
                                        {arquivo.status}
                                    </span>

                                    <button
                                        className="xml-botao-excluir"
                                        title="Excluir arquivo"
                                        onClick={() => excluirArquivo(arquivo.id)}
                                    >
                                        <img src={Lixeira} alt="Excluir" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="xml-lista-vazia">
                                Nenhum arquivo adicionado.
                            </p>
                        )}
                    </div>

                    <div className="xml-rodape">
                        <button
                            className="xml-botao-enviar"
                            onClick={enviarArquivos}
                            disabled={!arquivos.some(
                                (arquivo) => arquivo.status === "Pendente"
                            )}
                        >
                            Enviar
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}

function Sidebar() {
    return (
        <aside className="xml-sidebar">
            <div className="xml-logo">
                <img src={LogoNome} alt="Integra" />
            </div>

            <nav className="xml-menu">
                <a href="#" className="xml-menu-item">
                    <img src={CasaBranca} alt="" />
                    <span>Início</span>
                </a>

                <a href="#" className="xml-menu-item">
                    <img src={LivroBranco} alt="" />
                    <span>Conteúdos</span>
                </a>

                <a href="#" className="xml-menu-item xml-menu-ativo">
                    <img src={DoisDocumentosBranco} alt="" />
                    <span>Notas Fiscais</span>
                </a>

                <a href="#" className="xml-menu-item">
                    <img src={ADDProfileBranco} alt="" />
                    <span>Clientes</span>
                </a>

                <a href="#" className="xml-menu-item">
                    <img src={PessoaBranca} alt="" />
                    <span>Usuários</span>
                </a>
            </nav>

            <div className="xml-menu-inferior">

                <button
                    className="xml-sair"
                    onClick={() => alert("Configure aqui a saída da conta.")}
                >
                    <img src={SairBranco} alt="" />
                    <span>Sair</span>
                </button>
            </div>
        </aside>
    );
}

function Header() {
    const [pesquisa, setPesquisa] = useState("");

    return (
        <header className="xml-header">
            <div className="xml-busca">
                <img src={LupaCinza} alt="" />
                <input
                    type="text"
                    placeholder="Buscar conteúdos, notas fiscais, etc..."
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                />
            </div>

            <div className="xml-usuario">
                <div className="xml-avatar">JS</div>
                <div className="xml-dados-usuario">
                    <strong>João Silva</strong>
                    <span>Analista SPED</span>
                </div>
                <span className="xml-tres-pontos">···</span>
            </div>
        </header>
    );
}
