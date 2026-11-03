import { useState } from "react";
import "./Notasfiscais.css";

import CasaBranca from "../../assets/Icones/CasaBranca.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
import LupaCinza from "../../assets/Icones/LupaCinza.png";
import SairBranco from "../../assets/Icones/SairBranco.png";
import Lixeira from "../../assets/Icones/Lixeira.png";
import LogoNome from "../../assets/Icones/LogoNome.png";
import Calendario from "../../assets/Icones/calendario.png";

const notasIniciais = [
  {
    id: 1,
    chave: "3523041234567800019555001000123451000123451",
    emissao: "14/04/2025",
    cliente: "Empresa ABC",
    valor: "R$1420,00",
    status: "Autenticada",
  },
  {
    id: 2,
    chave: "3523049876543200017155002000987651612309876",
    emissao: "14/04/2025",
    cliente: "Empresa ABC",
    valor: "R$600,00",
    status: "Autenticada",
  },
  {
    id: 3,
    chave: "3523049012345600018855003000123451890123456",
    emissao: "27/04/2025",
    cliente: "Cliente LDTA",
    valor: "R$2300,00",
    status: "Cancelada",
  },
  {
    id: 4,
    chave: "3523045556667700014455004000054321709012345",
    emissao: "14/04/2025",
    cliente: "Empresa ABC",
    valor: "R$673,00",
    status: "Autenticada",
  },
  {
    id: 5,
    chave: "3523041234567800019555001000123451000123452",
    emissao: "10/05/2025",
    cliente: "Empresa XYZ",
    valor: "R$890,00",
    status: "Autenticada",
  },
];

function NotasFiscais() {
  const [notas, setNotas] = useState(notasIniciais);
  const [pesquisa, setPesquisa] = useState("");
  const [cliente, setCliente] = useState("Todos");
  const [status, setStatus] = useState("Todos");
  const [dataInicio, setDataInicio] = useState("2026-04-04");
  const [dataFim, setDataFim] = useState("2026-10-15");
  const [buscaRealizada, setBuscaRealizada] = useState(false);
  const [pagina, setPagina] = useState(1);

  const itensPorPagina = 4;

  function excluirNota(id) {
    const confirmar = window.confirm(
      "Deseja realmente excluir esta nota fiscal?"
    );

    if (confirmar) {
      setNotas((lista) => lista.filter((nota) => nota.id !== id));
    }
  }

  const notasFiltradas = notas.filter((nota) => {
    const correspondePesquisa =
      nota.chave.toLowerCase().includes(pesquisa.toLowerCase()) ||
      nota.cliente.toLowerCase().includes(pesquisa.toLowerCase());

    const correspondeCliente =
      cliente === "Todos" || nota.cliente === cliente;

    const correspondeStatus =
      status === "Todos" || nota.status === status;

    const converterData = (data) => {
      const [dia, mes, ano] = data.split("/");
      return `${ano}-${mes}-${dia}`;
    };

    const dataNota = converterData(nota.emissao);

    const correspondeData =
      !buscaRealizada ||
      ((!dataInicio || dataNota >= dataInicio) &&
        (!dataFim || dataNota <= dataFim));

    return (
      correspondePesquisa &&
      correspondeCliente &&
      correspondeStatus &&
      correspondeData
    );
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(notasFiltradas.length / itensPorPagina)
  );

  const notasPagina = notasFiltradas.slice(
    (pagina - 1) * itensPorPagina,
    pagina * itensPorPagina
  );

  function buscarNotas() {
    setBuscaRealizada(true);
    setPagina(1);
  }

  return (
    <div className="pagina-notas">
      <Sidebar />

      <main className="principal-notas">
        <Header pesquisa={pesquisa} setPesquisa={setPesquisa} />

        <section className="conteudo-notas">
          <h1>Notas Fiscais</h1>

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
                <option value="Empresa ABC">Empresa ABC</option>
                <option value="Cliente LDTA">Cliente LDTA</option>
                <option value="Empresa XYZ">Empresa XYZ</option>
              </select>
            </div>

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
                <option value="Autenticada">Autenticada</option>
                <option value="Cancelada">Cancelada</option>
                <option value="Pendente">Pendente</option>
              </select>
            </div>

            <button
              className="botao-buscar-notas"
              onClick={buscarNotas}
            >
              Buscar
            </button>
          </div>

          <div className="tabela-notas-container">
            <table className="tabela-notas">
              <thead>
                <tr>
                  <th>Chave de acesso</th>
                  <th>Emissão</th>
                  <th>Cliente</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {notasPagina.length > 0 ? (
                  notasPagina.map((nota) => (
                    <tr key={nota.id}>
                      <td className="chave-nota">{nota.chave}</td>
                      <td>{nota.emissao}</td>
                      <td>{nota.cliente}</td>
                      <td>{nota.valor}</td>

                      <td>
                        <span
                          className={`status-nota ${
                            nota.status === "Autenticada"
                              ? "status-autenticada"
                              : nota.status === "Cancelada"
                              ? "status-cancelada"
                              : "status-pendente"
                          }`}
                        >
                          {nota.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="botao-excluir-nota"
                          title="Excluir nota fiscal"
                          onClick={() => excluirNota(nota.id)}
                        >
                          <img src={Lixeira} alt="Excluir" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="nenhuma-nota">
                      Nenhuma nota fiscal encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

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
            ).map((numero) => (
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
        </section>
      </main>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="menu-notas">
      <div className="logo-notas">
        <img src={LogoNome} alt="Integra" />
      </div>

      <nav className="navegacao-notas">
        <a href="#" className="item-menu-notas">
          <img src={CasaBranca} alt="" />
          <span>Início</span>
        </a>

        <a href="#" className="item-menu-notas">
          <img src={LivroBranco} alt="" />
          <span>Conteúdos</span>
        </a>

        <a
          href="#"
          className="item-menu-notas menu-notas-ativo"
        >
          <img src={DoisDocumentosBranco} alt="" />
          <span>Notas Fiscais</span>
        </a>

        <a href="#" className="item-menu-notas">
          <img src={ADDProfileBranco} alt="" />
          <span>Clientes</span>
        </a>

        <a href="#" className="item-menu-notas">
          <img src={PessoaBranca} alt="" />
          <span>Usuários</span>
        </a>
      </nav>

      <button
        className="sair-notas"
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
    <header className="topo-notas">
      <div className="pesquisa-topo-notas">
        <img src={LupaCinza} alt="" />

        <input
          type="text"
          placeholder="Buscar conteúdos, notas fiscais, etc..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
        />
      </div>

      <div className="usuario-topo-notas">
        <div className="foto-usuario-notas">JS</div>

        <div>
          <strong>João Silva</strong>
          <span>Analista SPED</span>
        </div>

        <span className="tres-pontos-notas">•••</span>
      </div>
    </header>
  );
}

export default NotasFiscais;