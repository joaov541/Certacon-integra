
import { useEffect, useState } from "react";
import "./usuario.css";

import { NavLink, useNavigate } from "react-router-dom";
import { requisicaoApi } from "../../services/api";

import Header from "../../components/Header/header";
import HeaderDesktop from "../../components/Header/headerDesktop";

import CasaBranca from "../../assets/Icones/CasaBranca.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";

import LogoNome from "../../assets/Icones/LogoNome.png";
import SairBranco from "../../assets/Icones/SairBranco.png";
import EditarQuadrado from "../../assets/Icones/EditarQuadrado.png";
import Lixeira from "../../assets/Icones/Lixeira.png";

function Usuario() {
  const navigate = useNavigate();

  // Lista de usuários recebida da API
  const [usuarios, setUsuarios] = useState([]);

  const [pesquisa, setPesquisa] = useState("");
  const [pagina, setPagina] = useState(1);

  const [modalAberto, setModalAberto] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [formulario, setFormulario] = useState({
    nome: "",
    email: "",
    perfil: "Administrador",
    cliente: "",
    status: "ativo",
  });

  const usuariosPorPagina = 5;

  // Perfis cadastrados no banco de dados
  const perfisDisponiveis = [
    "Administrador",
    "Coordenador Fiscal",
    "Analista SPED",
    "Analista de Documentos Fiscais",
    "Analista de Reforma Tributária",
    "Cliente",
  ];

  // Formata o CNPJ para exibição
  function formatarCnpj(cnpj) {
  if (!cnpj) return "—";

  const valor = String(cnpj)
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

  if (valor.length !== 14) return cnpj;

  return valor.replace(
    /^([A-Z0-9]{2})([A-Z0-9]{3})([A-Z0-9]{3})([A-Z0-9]{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

  // Busca os usuários cadastrados na API
  async function carregarUsuarios() {
    try {
      setCarregando(true);

      const resposta = await requisicaoApi("/api/Usuarios");

      setUsuarios(Array.isArray(resposta) ? resposta : []);

    } catch (erro) {
      console.error("Erro ao carregar usuários:", erro);

      alert(
        erro.message ||
        "Não foi possível carregar os usuários."
      );

    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  // Pesquisa por nome, e-mail, perfil ou CNPJ
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const texto = pesquisa.toLowerCase();

    const nome = usuario.nome || "";
    const email = usuario.email || "";
    const cnpj = usuario.cnpj || "";

    const perfis = Array.isArray(usuario.perfis)
      ? usuario.perfis.join(" ")
      : "";

    return (
      nome.toLowerCase().includes(texto) ||
      email.toLowerCase().includes(texto) ||
      cnpj.toLowerCase().includes(texto) ||
      perfis.toLowerCase().includes(texto)
    );
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(usuariosFiltrados.length / usuariosPorPagina)
  );

  const inicio = (pagina - 1) * usuariosPorPagina;

  const usuariosExibidos = usuariosFiltrados.slice(
    inicio,
    inicio + usuariosPorPagina
  );

  // Volta para a primeira página quando a pesquisa muda
  useEffect(() => {
    setPagina(1);
  }, [pesquisa]);

  // Abre o modal de edição
  function abrirEdicao(usuario) {
    const perfilUsuario =
      usuario.perfis?.[0] || "Cliente";

    setFormulario({
      nome: usuario.nome || "",
      email: usuario.email || "",
      perfil: perfilUsuario,
      cliente: usuario.cnpj || "",
      status: usuario.ativo ? "ativo" : "desativado",
    });

    setIdEditando(usuario.usuarioId);
    setModalAberto(true);
  }

  // Salva as alterações na API
  async function salvarUsuario(e) {
    e.preventDefault();

    if (!formulario.nome.trim() || !formulario.email.trim()) {
      alert("Preencha o nome e o e-mail.");
      return;
    }

    if (!idEditando) {
      alert("Não foi possível identificar o usuário.");
      return;
    }

    try {
      setSalvando(true);

      // Atualiza os dados pessoais e o perfil
      await requisicaoApi(`/api/Usuarios/${idEditando}`, {
        method: "PUT",
        body: JSON.stringify({
          nome: formulario.nome.trim(),
          email: formulario.email.trim(),
          cnpj: formulario.cliente
  .replace(/[^a-zA-Z0-9]/g, "")
  .toUpperCase() || null,
          perfil: formulario.perfil,
        }),
      });

      // Localiza os dados atuais do usuário
      const usuarioAtual = usuarios.find(
        (usuario) => usuario.usuarioId === idEditando
      );

      const statusAtual = usuarioAtual?.ativo
        ? "ativo"
        : "desativado";

      // Atualiza o status somente se houve alteração
      if (statusAtual !== formulario.status) {
        await requisicaoApi(
          `/api/Usuarios/${idEditando}/status`,
          {
            method: "PATCH",
            body: JSON.stringify({
              ativo: formulario.status === "ativo",
            }),
          }
        );
      }

      alert("Usuário atualizado com sucesso!");

      setModalAberto(false);

      // Atualiza a tabela com os dados do banco
      await carregarUsuarios();

    } catch (erro) {
      console.error("Erro ao atualizar usuário:", erro);

      alert(
        erro.message ||
        "Não foi possível atualizar o usuário."
      );

    } finally {
      setSalvando(false);
    }
  }

  // Exclui logicamente o usuário
  async function excluirUsuario(id) {
    const confirmar = window.confirm(
      "Deseja realmente desativar este usuário?"
    );

    if (!confirmar) return;

    try {
      await requisicaoApi(`/api/Usuarios/${id}`, {
        method: "DELETE",
      });

      alert("Usuário desativado com sucesso!");

      await carregarUsuarios();

    } catch (erro) {
      console.error("Erro ao desativar usuário:", erro);

      alert(
        erro.message ||
        "Não foi possível desativar o usuário."
      );
    }
  }

  return (
    <div className="pagina-usuarios">
      <Sidebar />

      <main className="principal-usuarios">
        <HeaderDesktop />
        <Header />

        <section className="conteudo-usuarios">
          <div className="cabecalho-usuarios">
            <h1>Usuários</h1>

            {/*
            <button
              className="botao-novo-usuario"
              onClick={abrirCadastro}
            >
              + Novo Usuário
            </button>
            */}
          </div>

          {/* Pesquisa de usuários */}
          <div className="pesquisa-usuarios">
            <input
              type="text"
              placeholder="Pesquisar usuário..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />
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
                {carregando ? (
                  <tr>
                    <td colSpan="6" className="nenhum-usuario">
                      Carregando usuários...
                    </td>
                  </tr>
                ) : usuariosExibidos.length > 0 ? (
                  usuariosExibidos.map((usuario) => {
                    const perfil = Array.isArray(usuario.perfis)
                      ? usuario.perfis.join(", ")
                      : "—";

                    return (
                      <tr key={usuario.usuarioId}>
                        <td>{usuario.nome}</td>

                        <td>{usuario.email}</td>

                        <td>{perfil}</td>

                        <td className="cliente-cnpj">
                          {formatarCnpj(usuario.cnpj)}
                        </td>

                        <td>
                          <span
                            className={`status-usuario ${
                              usuario.ativo
                                ? "status-ativo"
                                : "status-desativado"
                            }`}
                          >
                            {usuario.ativo ? "ativo" : "desativado"}
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
                            title="Desativar usuário"
                            onClick={() =>
                              excluirUsuario(usuario.usuarioId)
                            }
                            disabled={!usuario.ativo}
                          >
                            <img src={Lixeira} alt="Desativar" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
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

          {/* Paginação */}
          <div className="paginacao-usuarios">
            {Array.from(
              { length: totalPaginas },
              (_, index) => (
                <button
                  key={index + 1}
                  className={
                    pagina === index + 1
                      ? "pagina-ativa"
                      : ""
                  }
                  onClick={() => setPagina(index + 1)}
                >
                  {index + 1}
                </button>
              )
            )}
          </div>
        </section>
      </main>

      {/* Modal de edição */}
      {modalAberto && (
        <div className="fundo-modal-usuario">
          <form
            className="modal-usuario"
            onSubmit={salvarUsuario}
          >
            <h2>Editar usuário</h2>

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
              {perfisDisponiveis.map((perfil) => (
                <option key={perfil} value={perfil}>
                  {perfil}
                </option>
              ))}
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
                disabled={salvando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="botao-salvar-usuario"
                disabled={salvando}
              >
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Sidebar() {
  const navigate = useNavigate();

  function sair() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("perfis");

    navigate("/login", { replace: true });
  }

  return (
    <aside className="menu-usuarios">

      <div className="logo-menu-usuarios">
        <img src={LogoNome} alt="Integra" />
      </div>

      <nav className="navegacao-usuarios">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            isActive
              ? "item-menu-usuario menu-usuario-ativo"
              : "item-menu-usuario"
          }
        >
          <img src={CasaBranca} alt="" />
          <span>Início</span>
        </NavLink>

        <NavLink
          to="/conteudos"
          className={({ isActive }) =>
            isActive
              ? "item-menu-usuario menu-usuario-ativo"
              : "item-menu-usuario"
          }
        >
          <img src={LivroBranco} alt="" />
          <span>Conteúdos</span>
        </NavLink>



        <NavLink
          to="/clientes"
          className={({ isActive }) =>
            isActive
              ? "item-menu-usuario menu-usuario-ativo"
              : "item-menu-usuario"
          }
        >
          <img src={ADDProfileBranco} alt="" />
          <span>Clientes</span>
        </NavLink>

        <NavLink
          to="/usuario"
          className={({ isActive }) =>
            isActive
              ? "item-menu-usuario menu-usuario-ativo"
              : "item-menu-usuario"
          }
        >
          <img src={PessoaBranca} alt="" />
          <span>Usuários</span>
        </NavLink>
      </nav>

      <button
        className="sair-usuarios"
        onClick={sair}
      >
        <img src={SairBranco} alt="" />
        <span>Sair</span>
      </button>
    </aside>
  );
}

export default Usuario;
