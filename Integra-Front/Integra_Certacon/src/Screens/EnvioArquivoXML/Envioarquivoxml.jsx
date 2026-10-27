import "./Envioarquivoxml.css";

import logoIntegra from "../../assets/Icones/LogoNome.png";
import iconeCasa from "../../assets/Icones/Casa.png";
import iconeLivro from "../../assets/Icones/Livro.png";
import iconeNotas from "../../assets/Icones/DoisDocumentos.png";
import iconeClientesBranco from "../../assets/Icones/GrupoPessoasBranco.png";
import iconePessoa from "../../assets/Icones/Pessoa.png";
import iconeConfiguracao from "../../assets/Icones/Configuração.png";
import iconeSair from "../../assets/Icones/Sair.png";
import iconeLupa from "../../assets/Icones/LupaPesquisa.png";
import PerfilLaranja from "../../assets/Icones/PerfilLaranja.png";
import iconeUpload from "../../assets/Icones/Upload.png";
import iconeDocumento from "../../assets/Icones/documentoLaranja.png";
import iconeLixeira from "../../assets/Icones/Lixeira.png";

export default function EnvioArquivoXML() {
    return (
        <main className="xml">
            <aside className="xml-menu">
                <div className="xml-marca">
                    <img
                        src={logoIntegra}
                        alt="Portal Tributário"
                        className="xml-logo"
                    />
                </div>

                <nav className="xml-menu-lista">
                    <button type="button" className="xml-menu-item">
                        <img src={iconeCasa} alt="" />
                        <span>Início</span>
                    </button>

                    <button type="button" className="xml-menu-item">
                        <img src={iconeLivro} alt="" />
                        <span>Conteúdos</span>
                    </button>

                    <button type="button" className="xml-menu-item">
                        <img src={iconeNotas} alt="" />
                        <span>Notas Fiscais</span>
                    </button>

                    <button type="button" className="xml-menu-item">
                        <img src={iconeClientesBranco} alt="" />
                        <span>Clientes</span>
                    </button>

                    <button type="button" className="xml-menu-item">
                        <img src={iconePessoa} alt="" />
                        <span>Usuários</span>
                    </button>
                </nav>

                <button
                    type="button"
                    className="xml-menu-item xml-menu-configuracoes"
                >
                    <img src={iconeConfiguracao} alt="" />
                    <span>Configurações</span>
                </button>

                <button type="button" className="xml-menu-item">
                    <img src={iconeSair} alt="" />
                    <span>Sair</span>
                </button>
            </aside>

            <section className="xml-area">
                <header className="xml-topo">
                    <div className="xml-busca">
                        <img src={iconeLupa} alt="" />
                        <input
                            type="text"
                            placeholder="Buscar conteúdos, notas fiscais, etc..."
                        />
                    </div>

                    <div className="xml-usuario">
                        <div className="xml-usuario-foto">
                            <img src={PerfilLaranja} alt="Foto do usuário" />
                        </div>

                        <div>
                            <h3>João Silva</h3>
                            <p>Analista SPED</p>
                        </div>
                    </div>
                </header>

                <div className="xml-conteudo">
                    <div className="xml-envio">
                        <div>
                            <h1>Enviar arquivo XML</h1>

                            <button type="button" className="xml-botao-enviar-arquivo">
                                <img src={iconeUpload} alt="" />
                                Envie um arquivo XML
                            </button>
                        </div>

                        <div className="xml-soltar">
                            <h2>Ou solte seu documento aqui</h2>

                            <img src={iconeUpload} alt="" />

                            <p>
                                Tamanho Máximo de 10MB
                                <br />
                                Formato: XML
                            </p>
                        </div>
                    </div>

                    <div className="xml-lista">
                        <div className="xml-lista-cabecalho">Arquivos Enviados</div>

                        <div className="xml-arquivo">
                            <img src={iconeDocumento} alt="" className="xml-arquivo-icone" />
                            <span className="xml-arquivo-nome">nfe_123456.xml</span>
                            <span className="xml-arquivo-tamanho">2.4MB</span>
                            <span className="xml-tag xml-tag-verde">Validado</span>
                            <button type="button" className="xml-lixeira">
                                <img src={iconeLixeira} alt="Excluir arquivo" />
                            </button>
                        </div>

                        <div className="xml-arquivo">
                            <img src={iconeDocumento} alt="" className="xml-arquivo-icone" />
                            <span className="xml-arquivo-nome">nfe_987432.xml</span>
                            <span className="xml-arquivo-tamanho">1.8MB</span>
                            <span className="xml-tag xml-tag-laranja">Pendente</span>
                            <button type="button" className="xml-lixeira">
                                <img src={iconeLixeira} alt="Excluir arquivo" />
                            </button>
                        </div>

                        <div className="xml-arquivo">
                            <img src={iconeDocumento} alt="" className="xml-arquivo-icone" />
                            <span className="xml-arquivo-nome">nfe_987432.xml</span>
                            <span className="xml-arquivo-tamanho">1.8MB</span>
                            <span className="xml-tag xml-tag-laranja">Pendente</span>
                            <button type="button" className="xml-lixeira">
                                <img src={iconeLixeira} alt="Excluir arquivo" />
                            </button>
                        </div>

                        <div className="xml-arquivo">
                            <img src={iconeDocumento} alt="" className="xml-arquivo-icone" />
                            <span className="xml-arquivo-nome">nfe_987432.xml</span>
                            <span className="xml-arquivo-tamanho">1.8MB</span>
                            <span className="xml-tag xml-tag-laranja">Pendente</span>
                            <button type="button" className="xml-lixeira">
                                <img src={iconeLixeira} alt="Excluir arquivo" />
                            </button>
                        </div>

                        <div className="xml-arquivo">
                            <img src={iconeDocumento} alt="" className="xml-arquivo-icone" />
                            <span className="xml-arquivo-nome">nfe_987432.xml</span>
                            <span className="xml-arquivo-tamanho">1.8MB</span>
                            <span className="xml-tag xml-tag-laranja">Pendente</span>
                            <button type="button" className="xml-lixeira">
                                <img src={iconeLixeira} alt="Excluir arquivo" />
                            </button>
                        </div>

                        <div className="xml-arquivo">
                            <img src={iconeDocumento} alt="" className="xml-arquivo-icone" />
                            <span className="xml-arquivo-nome">nfe_987432.xml</span>
                            <span className="xml-arquivo-tamanho">1.8MB</span>
                            <span className="xml-tag xml-tag-laranja">Pendente</span>
                            <button type="button" className="xml-lixeira">
                                <img src={iconeLixeira} alt="Excluir arquivo" />
                            </button>
                        </div>
                    </div>

                    <button type="button" className="xml-botao-submit">
                        Enviar
                    </button>
                </div>
            </section>
        </main>
    );
}