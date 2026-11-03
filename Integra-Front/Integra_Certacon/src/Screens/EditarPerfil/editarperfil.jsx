
import { useState } from "react";
import "./editarperfil.css";

import CasaBranca from "../../assets/Icones/CasaBranca.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
import LupaCinza from "../../assets/Icones/LupaCinza.png";
import SairBranco from "../../assets/Icones/SairBranco.png";
import LogoNome from "../../assets/Icones/LogoNome.png";

import Email from "../../assets/Icones/Email.png";
import Telefone from "../../assets/Icones/Telefone.png";
import CidadeEmpresa from "../../assets/Icones/CidadeEmpresa.png";
import Pessoa from "../../assets/Icones/Pessoa.png";

import ChaveSenha from "../../assets/Icones/ChaveSenha.png"
import TelefonePerfil from "../../assets/Icones/TelefonePerfil.png"
import SairCinza from "../../assets/Icones/SairCinza.png"
import EmailPerfil from "../../assets/Icones/EmailPerfil.png"
import EscudoCinzaPerfil from "../../assets/Icones/EscudoCinzaPerfil.png"
import EmpresaPerfil from "../../assets/Icones/EmpresaPerfil.png"
import FusoHorario from "../../assets/Icones/FusoHorario.png"
import Idioma from "../../assets/Icones/Idioma.png"
import PredioPerfil from "../../assets/Icones/PredioPerfil.png"

function EditarPerfil() {
    const [modoEdicao, setModoEdicao] = useState(false);

    const [perfil, setPerfil] = useState({
        nome: "João Silva",
        cargo: "Analista SPED Sênior",
        email: "JoaoSilva@gmail.com",
        telefone: "1199229-2013",
        departamento: "Fiscal",
        empresa: "Costa & Silva Consu",
    });

    const [pesquisa, setPesquisa] = useState("");

    function atualizarCampo(e) {
        const { name, value } = e.target;

        setPerfil((anterior) => ({
            ...anterior,
            [name]: value,
        }));
    }

    function salvarPerfil() {
        setModoEdicao(false);
        alert("Perfil atualizado com sucesso!");
    }

    return (
        <div className="pagina-perfil">

            <Sidebar />

            <main className="principal-perfil">

                <Header
                    pesquisa={pesquisa}
                    setPesquisa={setPesquisa}
                />

                <section className="conteudo-perfil">

                    <h1>Meu Perfil</h1>

                    <div className="area-perfil">

                        {/* CARTÃO PRINCIPAL */}
                        <div className="cartao-perfil">

                            <div className="foto-perfil">
                                <img src={Pessoa} alt="Foto do usuário" />
                            </div>

                            <div className="identificacao-perfil">

                                {modoEdicao ? (
                                    <>
                                        <input
                                            type="text"
                                            name="nome"
                                            value={perfil.nome}
                                            onChange={atualizarCampo}
                                            className="input-nome-perfil"
                                        />

                                        <input
                                            type="text"
                                            name="cargo"
                                            value={perfil.cargo}
                                            onChange={atualizarCampo}
                                            className="input-cargo-perfil"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <h2>{perfil.nome}</h2>
                                        <p>{perfil.cargo}</p>
                                    </>
                                )}

                            </div>

                            <div className="informacoes-perfil">

                                <div className="informacao-item">
                                    <img src={EmailPerfil} alt="" />

                                    <div>
                                        <span>Email Corporativo</span>

                                        {modoEdicao ? (
                                            <input
                                                type="email"
                                                name="email"
                                                value={perfil.email}
                                                onChange={atualizarCampo}
                                            />
                                        ) : (
                                            <p>{perfil.email}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="informacao-item">
                                    <img src={TelefonePerfil} alt="" />

                                    <div>
                                        <span>Telefone Corporativo</span>

                                        {modoEdicao ? (
                                            <input
                                                type="text"
                                                name="telefone"
                                                value={perfil.telefone}
                                                onChange={atualizarCampo}
                                            />
                                        ) : (
                                            <p>{perfil.telefone}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="informacao-item">
                                    <img src={PredioPerfil} alt="" />

                                    <div>
                                        <span>Departamento</span>

                                        {modoEdicao ? (
                                            <input
                                                type="text"
                                                name="departamento"
                                                value={perfil.departamento}
                                                onChange={atualizarCampo}
                                            />
                                        ) : (
                                            <p>{perfil.departamento}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="informacao-item">
                                    <img src={EmpresaPerfil} alt="" />

                                    <div>
                                        <span>Empresa Vinculada</span>

                                        {modoEdicao ? (
                                            <input
                                                type="text"
                                                name="empresa"
                                                value={perfil.empresa}
                                                onChange={atualizarCampo}
                                            />
                                        ) : (
                                            <p>{perfil.empresa}</p>
                                        )}
                                    </div>
                                </div>

                            </div>

                            <div className="acoes-perfil">

                                {modoEdicao ? (
                                    <>
                                        <button
                                            className="botao-salvar-perfil"
                                            onClick={salvarPerfil}
                                        >
                                            Salvar alterações
                                        </button>

                                        <button
                                            className="botao-cancelar-perfil"
                                            onClick={() => setModoEdicao(false)}
                                        >
                                            Cancelar
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className="botao-editar-perfil"
                                        onClick={() => setModoEdicao(true)}
                                    >
                                        Editar Perfil
                                    </button>
                                )}

                            </div>

                        </div>

                        {/* CARTÕES LATERAIS */}
                        <div className="configuracoes-perfil">

                            <div className="cartao-configuracao">

                                <h3>Segurança</h3>

                                <div className="configuracao-item">
                                    <span className="icone-configuracao">
                                        <img src={EscudoCinzaPerfil} alt="" />
                                    </span>

                                    <div>
                                        <span>MFA</span>
                                        <p>
                                            <strong>Ativo</strong>/inativo
                                        </p>
                                    </div>
                                </div>

                                <div className="configuracao-item">
                                    <span className="icone-configuracao">
                                        <img src={SairCinza} alt="" />
                                    </span>

                                    <div>
                                        <span>Último login</span>
                                        <p>24/12/2020&nbsp; 14:38:37</p>
                                    </div>
                                </div>

                                <div className="linha-configuracao"></div>

                                <button
                                    className="alterar-senha"
                                    onClick={() => alert("Configure aqui a alteração de senha.")}
                                >
                                    <img src={ChaveSenha} alt="" />
                                    Alterar Senha
                                </button>

                            </div>

                            <div className="cartao-configuracao cartao-preferencias">

                                <h3>Segurança</h3>

                                <div className="configuracao-item">
                                    <span className="icone-configuracao">
                                        <img src={Idioma} alt="" />
                                    </span>

                                    <div>
                                        <span>Idioma</span>
                                        <p>Português - BR</p>
                                    </div>
                                </div>

                                <div className="configuracao-item">
                                    <span className="icone-configuracao">
                                    <img src={FusoHorario} alt="" />
                                    </span>

                                    <div>
                                        <span>Fuso Horário</span>
                                        <p>BRT - Brasília</p>
                                    </div>
                                </div>

                            </div>

                        </div>

                    </div>

                </section>

            </main>

        </div>
    );
}

function Sidebar() {
    return (
        <aside className="menu-perfil">

            <div className="logo-perfil">
                <img src={LogoNome} alt="Integra" />
            </div>

            <nav className="navegacao-perfil">

                <a href="#" className="item-menu-perfil">
                    <img src={CasaBranca} alt="" />
                    <span>Início</span>
                </a>

                <a href="#" className="item-menu-perfil">
                    <img src={LivroBranco} alt="" />
                    <span>Conteúdos</span>
                </a>

                <a href="#" className="item-menu-perfil">
                    <img src={DoisDocumentosBranco} alt="" />
                    <span>Notas Fiscais</span>
                </a>

                <a href="#" className="item-menu-perfil">
                    <img src={ADDProfileBranco} alt="" />
                    <span>Clientes</span>
                </a>

                <a href="#" className="item-menu-perfil">
                    <img src={PessoaBranca} alt="" />
                    <span>Usuários</span>
                </a>

            </nav>

            <button
                className="sair-perfil"
                onClick={() => alert("Configure aqui a saída da conta.")}
            >
                <img src={SairBranco} alt="" />
                <span>Sair</span>
            </button>

        </aside>
    );
}

function Header({ pesquisa, setPesquisa }) {
    return (
        <header className="topo-perfil">

            <div className="pesquisa-topo-perfil">
                <img src={LupaCinza} alt="" />

                <input
                    type="text"
                    placeholder="Buscar ações..."
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                />
            </div>

            <div className="usuario-topo-perfil">

                <div className="avatar-topo-perfil">
                    JS
                </div>

                <div className="dados-usuario-perfil">
                    <strong>João Silva</strong>
                    <span>Administrador</span>
                </div>

            </div>

        </header>
    );
}

export default EditarPerfil;
