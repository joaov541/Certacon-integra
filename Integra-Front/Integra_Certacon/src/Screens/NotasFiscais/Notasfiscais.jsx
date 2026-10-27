import "./notasfiscais.css";

import logoIntegra from "../../assets/Icones/LogoNome.png";
import iconeCasa from "../../assets/Icones/Casa.png";
import iconeLivro from "../../assets/Icones/Livro.png";
import iconeNotas from "../../assets/Icones/DoisDocumentos.png";
import iconeClientesBranco from "../../assets/Icones/GrupoPessoasBranco.png";
import iconePessoa from "../../assets/Icones/Pessoa.png";
import iconeSair from "../../assets/Icones/Sair.png";
import iconeLupa from "../../assets/Icones/LupaPesquisa.png";
import PerfilLaranja from "../../assets/Icones/PerfilLaranja.png";
import iconeTresPontos from "../../assets/Icones/TresPontos.png";
import iconeCalendario from "../../assets/Icones/calendario.png";
import iconeLixeira from "../../assets/Icones/Lixeira.png";

export default function NotasFiscais() {
    return (
        <main className="notas">
            <aside className="notas-menu">
                <div className="notas-marca">
                    <img
                        src={logoIntegra}
                        alt="Portal Tributário"
                        className="notas-logo"
                    />
                </div>

                <nav className="notas-menu-lista">
                    <button type="button" className="notas-menu-item">
                        <img src={iconeCasa} alt="" />
                        <span>Início</span>
                    </button>

                    <button type="button" className="notas-menu-item">
                        <img src={iconeLivro} alt="" />
                        <span>Conteúdos</span>
                    </button>

                    <button
                        type="button"
                        className="notas-menu-item notas-menu-item-ativo"
                    >
                        <img src={iconeNotas} alt="" />
                        <span>Notas Fiscais</span>
                    </button>

                    <button type="button" className="notas-menu-item">
                        <img src={iconeClientesBranco} alt="" />
                        <span>Clientes</span>
                    </button>

                    <button type="button" className="notas-menu-item">
                        <img src={iconePessoa} alt="" />
                        <span>Usuários</span>
                    </button>
                </nav>

                <button
                    type="button"
                    className="notas-menu-item notas-menu-sair"
                >
                    <img src={iconeSair} alt="" />
                    <span>Sair</span>
                </button>
            </aside>

            <section className="notas-area">
                <header className="notas-topo">
                    <div className="notas-busca">
                        <img src={iconeLupa} alt="" />
                        <input
                            type="text"
                            placeholder="Buscar conteúdos, notas fiscais, etc..."
                        />
                    </div>

                    <div className="notas-usuario">
                        <div className="notas-usuario-foto">
                            <img src={PerfilLaranja} alt="Foto do usuário" />
                        </div>

                        <div>
                            <h3>João Silva</h3>
                            <p>Analista SPED</p>
                        </div>

                        <button type="button" className="notas-usuario-opcoes">
                            <img src={iconeTresPontos} alt="Mais opções" />
                        </button>
                    </div>
                </header>

                <div className="notas-conteudo">
                    <h1>Notas Fiscais</h1>

                    <div className="notas-filtros">
                        <div className="notas-campo notas-campo-periodo">
                            <label htmlFor="periodo">Período</label>

                            <div className="notas-input-icone">
                                <input
                                    id="periodo"
                                    type="text"
                                    defaultValue="04/04/2026 - 15/10/2026"
                                />
                                <img src={iconeCalendario} alt="Calendário" />
                            </div>
                        </div>

                        <div className="notas-campo notas-campo-cliente">
                            <label htmlFor="cliente">Cliente</label>

                            <div className="notas-select">
                                <select id="cliente">
                                    <option>Todos</option>
                                    <option>Empresa ABC</option>
                                    <option>Cliente LDTA</option>
                                </select>
                                <span>▼</span>
                            </div>
                        </div>

                        <div className="notas-campo notas-campo-status">
                            <label htmlFor="status">Status</label>

                            <div className="notas-select">
                                <select id="status">
                                    <option>Status</option>
                                    <option>Autenticada</option>
                                    <option>Cancelada</option>
                                </select>
                                <span>▼</span>
                            </div>
                        </div>

                        <button type="button" className="notas-botao-buscar">
                            Buscar
                        </button>
                    </div>

                    <div className="notas-tabela">
                        <div className="notas-linha notas-linha-cabecalho">
                            <span>Chave de acesso</span>
                            <span>Emissão</span>
                            <span>Cliente</span>
                            <span>Valor</span>
                            <span>Status</span>
                            <span>Ações</span>
                        </div>

                        <div className="notas-linha">
                            <span className="notas-chave">
                                35230412345678000195550010000123451000123451
                            </span>
                            <span>14/04/2025</span>
                            <span>Empresa ABC</span>
                            <span>R$ 1.420,00</span>
                            <span className="notas-tag notas-tag-verde">
                                Autenticada
                            </span>
                            <button type="button" className="notas-lixeira">
                                <img src={iconeLixeira} alt="Excluir nota" />
                            </button>
                        </div>

                        <div className="notas-linha">
                            <span className="notas-chave">
                                35230498765432000171550020000987651612309876
                            </span>
                            <span>14/04/2025</span>
                            <span>Empresa ABC</span>
                            <span>R$ 600,00</span>
                            <span className="notas-tag notas-tag-verde">
                                Autenticada
                            </span>
                            <button type="button" className="notas-lixeira">
                                <img src={iconeLixeira} alt="Excluir nota" />
                            </button>
                        </div>

                        <div className="notas-linha">
                            <span className="notas-chave">
                                35230490123456000188550030000123451890123456
                            </span>
                            <span>27/04/2025</span>
                            <span>Cliente LDTA</span>
                            <span>R$ 2.300,00</span>
                            <span className="notas-tag notas-tag-vermelho">
                                Cancelada
                            </span>
                            <button type="button" className="notas-lixeira">
                                <img src={iconeLixeira} alt="Excluir nota" />
                            </button>
                        </div>

                        <div className="notas-linha">
                            <span className="notas-chave">
                                35230455566677000144550040000543217090123457
                            </span>
                            <span>14/04/2025</span>
                            <span>Empresa ABC</span>
                            <span>R$ 673,00</span>
                            <span className="notas-tag notas-tag-verde">
                                Autenticada
                            </span>
                            <button type="button" className="notas-lixeira">
                                <img src={iconeLixeira} alt="Excluir nota" />
                            </button>
                        </div>
                    </div>

                    <div className="notas-paginacao">
                        <button
                            type="button"
                            className="notas-pagina notas-pagina-ativa"
                        >
                            1
                        </button>
                        <button type="button" className="notas-pagina">
                            2
                        </button>
                        <button type="button" className="notas-pagina">
                            3
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}