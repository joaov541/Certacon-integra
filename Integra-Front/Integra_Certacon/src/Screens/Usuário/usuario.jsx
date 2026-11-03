
import { useState } from "react";
import "./usuario.css";

import CasaBranca from "../../assets/Icones/CasaBranca.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
import LupaCinza from "../../assets/Icones/LupaCinza.png";
import LogoNome from "../../assets/Icones/LogoNome.png";
import SairBranco from "../../assets/Icones/SairBranco.png";
import EditarQuadrado from "../../assets/Icones/EditarQuadrado.png";
import Lixeira from "../../assets/Icones/Lixeira.png";

const dadosIniciais = [
  {
    id: 1,
    nome: "Ana Jurandi",
    email: "Ana@gmail.com",
    perfil: "ADM",
    cliente: "—",
    status: "ativo",
  },
  {
    id: 2,
    nome: "Eduardo Oliveira",
    email: "Edu@gmail.com",
    perfil: "ADM",
    cliente: "—",
    status: "ativo",
  },
  {
    id: 3,
    nome: "Guilherme Augusto",
    email: "Gui@gmail.com",
    perfil: "ADM",
    cliente: "11-344-676-9102-23",
    status: "ativo",
  },
  {
    id: 4,
    nome: "Nicoly Almeida",
    email: "Nic@gmail.com",
    perfil: "ADM",
    cliente: "—",
    status: "ativo",
  },
  {
    id: 5,
    nome: "Vitor Pereira",
    email: "Vit@gmail.com",
    perfil: "ADM",
    cliente: "12-345-678-9101-11",
    status: "desativado",
  },
];

function Usuario() {
  const [usuarios, setUsuarios] = useState(dadosIniciais);
  const [pesquisa, setPesquisa] = useState("");
  const [pagina, setPagina] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [formulario, setFormulario] = useState({
    nome: "",
    email: "",
    perfil: "ADM",
    cliente: "",
    status: "ativo",
  });

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const texto = pesquisa.toLowerCase();

    return (
      usuario.nome.toLowerCase().includes(texto) ||
      usuario.email.toLowerCase().includes(texto) ||
      usuario.perfil.toLowerCase().includes(texto)
    );
  });

  const usuariosPorPagina = 5;
  const totalPaginas = Math.max(
    1,
    Math.ceil(usuariosFiltrados.length / usuariosPorPagina)
  );

  const inicio = (pagina - 1) * usuariosPorPagina;

  const usuariosExibidos = usuariosFiltrados.slice(
    inicio,
    inicio + usuariosPorPagina
  );

  function abrirCadastro() {
    setFormulario({
      nome: "",
      email: "",
      perfil: "ADM",
      cliente: "",
      status: "ativo",
    });

    setIdEditando(null);
    setModalAberto(true);
  }

  function abrirEdicao(usuario) {
    setFormulario({
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      cliente: usuario.cliente === "—" ? "" : usuario.cliente,
      status: usuario.status,
    });

    setIdEditando(usuario.id);
    setModalAberto(true);
  }

  function salvarUsuario(e) {
    e.preventDefault();

    if (!formulario.nome.trim() || !formulario.email.trim()) {
      alert("Preencha o nome e o e-mail.");
      return;
    }

    if (idEditando) {
      setUsuarios((lista) =>
        lista.map((usuario) =>
          usuario.id === idEditando
            ? {
                ...usuario,
                ...formulario,
                cliente: formulario.cliente.trim() || "—",
              }
            : usuario
        )
      );
    } else {
      const novoUsuario = {
        id: Date.now(),
        ...formulario,
        cliente: formulario.cliente.trim() || "—",
      };

      setUsuarios((lista) => [...lista, novoUsuario]);
      setPagina(Math.ceil((usuarios.length + 1) / usuariosPorPagina));
    }

    setModalAberto(false);
  }

  function excluirUsuario(id) {
    const confirmar = window.confirm(
      "Deseja realmente excluir este usuário?"
    );

    if (confirmar) {
      const novaLista = usuarios.filter((usuario) => usuario.id !== id);
      setUsuarios(novaLista);

      const quantidadeRestante = usuariosFiltrados.length - 1;

      if (
        quantidadeRestante <= (pagina - 1) * usuariosPorPagina &&
        pagina > 1
      ) {
        setPagina(pagina - 1);
      }
    }
  }

  return (
    <div className="pagina-usuarios">
      <Sidebar />

      <main className="principal-usuarios">
        <header className="topo-usuarios">
          <div className="pesquisa-usuarios">
            <img src={LupaCinza} alt="" />

            <input
              type="text"
              placeholder="Buscar ações..."
              value={pesquisa}
              onChange={(e) => {
                setPesquisa(e.target.value);
                setPagina(1);
              }}
            />
          </div>

          <div className="usuario-logado">
            <div className="avatar-administrador">JS</div>

            <div className="dados-administrador">
              <strong>João Silva</strong>
              <span>Administrador</span>
            </div>

            <span className="tres-pontos">•••</span>
          </div>
        </header>

        <section className="conteudo-usuarios">
          <div className="cabecalho-usuarios">
            <h1>Usuários</h1>

            <button
              className="botao-novo-usuario"
              onClick={abrirCadastro}
            >
              + Novo Usuário
            </button>
          </div>

          <div className="tabela-usuarios">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Cliente CNPJ</th>
                  <th>Status</th>
                  <th className="coluna-acoes-usuario">Ações</th>
                </tr>
              </thead>

              <tbody>
                {usuariosExibidos.length > 0 ? (
                  usuariosExibidos.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>{usuario.nome}</td>
                      <td>{usuario.email}</td>
                      <td>{usuario.perfil}</td>

                      <td className="cliente-cnpj">
                        {usuario.cliente}
                      </td>

                      <td>
                        <span
                          className={`status-usuario ${
                            usuario.status === "ativo"
                              ? "status-ativo"
                              : "status-desativado"
                          }`}
                        >
                          {usuario.status}
                        </span>
                      </td>

                      <td className="acoes-usuario">
                        <button
                          title="Editar usuário"
                          onClick={() => abrirEdicao(usuario)}
                        >
                          <img src={EditarQuadrado} alt="Editar" />
                        </button>

                        <button
                          title="Excluir usuário"
                          onClick={() => excluirUsuario(usuario.id)}
                        >
                          <img src={Lixeira} alt="Excluir" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="nenhum-usuario">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="paginacao-usuarios">
            {Array.from({ length: totalPaginas }, (_, index) => (
              <button
                key={index + 1}
                className={pagina === index + 1 ? "pagina-ativa" : ""}
                onClick={() => setPagina(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </section>
      </main>

      {modalAberto && (
        <div className="fundo-modal-usuario">
          <form className="modal-usuario" onSubmit={salvarUsuario}>
            <h2>
              {idEditando ? "Editar usuário" : "Novo usuário"}
            </h2>

            <label>Nome completo</label>
            <input
              type="text"
              placeholder="Digite o nome"
              value={formulario.nome}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  nome: e.target.value,
                })
              }
            />

            <label>E-mail</label>
            <input
              type="email"
              placeholder="Digite o e-mail"
              value={formulario.email}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  email: e.target.value,
                })
              }
            />

            <label>Perfil</label>
            <select
              value={formulario.perfil}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  perfil: e.target.value,
                })
              }
            >
              <option value="ADM">ADM</option>
              <option value="Analista">Analista</option>
              <option value="Cliente">Cliente</option>
            </select>

            <label>Cliente CNPJ</label>
            <input
              type="text"
              placeholder="Digite o CNPJ"
              value={formulario.cliente}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  cliente: e.target.value,
                })
              }
            />

            <label>Status</label>
            <select
              value={formulario.status}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  status: e.target.value,
                })
              }
            >
              <option value="ativo">Ativo</option>
              <option value="desativado">Desativado</option>
            </select>

            <div className="botoes-modal-usuario">
              <button
                type="button"
                className="botao-cancelar-usuario"
                onClick={() => setModalAberto(false)}
              >
                Cancelar
              </button>

              <button type="submit" className="botao-salvar-usuario">
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="menu-usuarios">
      <div className="logo-usuarios">
        <img src={LogoNome} alt="Integra" />
      </div>

      <nav className="navegacao-usuarios">
        <a href="#" className="item-menu-usuario">
          <img src={CasaBranca} alt="" />
          <span>Início</span>
        </a>

        <a href="#" className="item-menu-usuario">
          <img src={LivroBranco} alt="" />
          <span>Conteúdos</span>
        </a>

        <a href="#" className="item-menu-usuario">
          <img src={DoisDocumentosBranco} alt="" />
          <span>Notas Fiscais</span>
        </a>

        <a href="#" className="item-menu-usuario">
          <img src={ADDProfileBranco} alt="" />
          <span>Clientes</span>
        </a>

        <a href="#" className="item-menu-usuario menu-usuario-ativo">
          <img src={PessoaBranca} alt="" />
          <span>Usuários</span>
        </a>
      </nav>

      <button
        className="sair-usuarios"
        onClick={() => alert("Configure aqui a saída da conta.")}
      >
        <img src={SairBranco} alt="" />
        <span>Sair</span>
      </button>
    </aside>
  );
}

export default Usuario;
