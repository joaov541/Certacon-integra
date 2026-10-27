
import { useState } from "react";
import "./conteudoTributario.css";

import CasaBranca from "../../assets/Icones/CasaBranca.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
import LupaCinza from "../../assets/Icones/LupaCinza.png";
import ExpandirText from "../../assets/Icones/ExpandirText.png";
import SairBranco from "../../assets/Icones/SairBranco.png";
import Lixeira from "../../assets/Icones/Lixeira.png";
import LogoNome from "../../assets/Icones/LogoNome.png";

// Conteúdos iniciais
const dadosIniciais = [
  {
    id: 1,
    titulo: "Reforma Tributária",
    tema: "Reforma Tributária",
    data: "12/04/2025",
    autor: "Maria Oliveira",
  },
  {
    id: 2,
    titulo: "SPED fiscal 2025",
    tema: "SPED",
    data: "14/04/2025",
    autor: "Carlos Mendes",
  },
  {
    id: 3,
    titulo: "Notas Fiscais",
    tema: "Notas Fiscais",
    data: "26/04/2025",
    autor: "Ana Costa",
  },
  {
    id: 4,
    titulo: "ICMS",
    tema: "ICMS",
    data: "27/04/2025",
    autor: "Juliana Souza",
  },
  {
    id: 5,
    titulo: "PES/CONFINS",
    tema: "PES/CONFINS",
    data: "10/05/2025",
    autor: "Carlos Mendes",
  },
];

function ConteudoTributario() {
  const [conteudos, setConteudos] = useState(dadosIniciais);
  const [pesquisa, setPesquisa] = useState("");
  const [temaSelecionado, setTemaSelecionado] = useState("Todos");
  const [ordem, setOrdem] = useState("recentes");

  // Filtrar conteúdos
  let listaFiltrada = conteudos.filter((conteudo) => {
    const titulo = conteudo.titulo.toLowerCase();
    const tema = conteudo.tema.toLowerCase();
    const texto = pesquisa.toLowerCase();

    const encontrouTexto =
      titulo.includes(texto) || tema.includes(texto);

    const encontrouTema =
      temaSelecionado === "Todos" ||
      conteudo.tema === temaSelecionado;

    return encontrouTexto && encontrouTema;
  });

  // Ordenar pela data
  listaFiltrada.sort((a, b) => {
    const dataA = a.data.split("/").reverse().join("");
    const dataB = b.data.split("/").reverse().join("");

    if (ordem === "recentes") {
      return dataB.localeCompare(dataA);
    }

    return dataA.localeCompare(dataB);
  });

  // Excluir conteúdo
  function excluirConteudo(id) {
    const confirmar = window.confirm(
      "Deseja realmente excluir este conteúdo?"
    );

    if (confirmar) {
      const novaLista = conteudos.filter(
        (conteudo) => conteudo.id !== id
      );

      setConteudos(novaLista);
    }
  }

  return (
    <div className="pagina-conteudos">
      <Sidebar />

      <main className="principal-conteudos">
        <Header
          pesquisa={pesquisa}
          setPesquisa={setPesquisa}
        />

        <section className="area-lista-conteudos">
          <div className="titulo-conteudos">
            <div>
              <h1>Conteúdos tributários</h1>
              <p>
                Explore nossos conteúdos por tema, mantenha-se atualizado
              </p>
            </div>

            <button
              className="adicionar-conteudo"
              onClick={() =>
                alert("Aqui você poderá abrir a tela de novo conteúdo.")
              }
            >
              <span>+ Adicionar Conteúdo</span>
            </button>
          </div>

          {/* Pesquisa e filtros */}
          <div className="filtros-conteudos">
            <div className="pesquisa-lista-conteudos">
              <img src={LupaCinza} alt="" />

              <input
                type="text"
                placeholder="Buscar por título ou palavra-chave"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
              />
            </div>

            <div className="seletor-conteudos">
              <select
                value={temaSelecionado}
                onChange={(e) => setTemaSelecionado(e.target.value)}
              >
                <option value="Todos">Todos os temas</option>
                <option value="Reforma Tributária">
                  Reforma Tributária
                </option>
                <option value="SPED">SPED</option>
                <option value="Notas Fiscais">Notas Fiscais</option>
                <option value="ICMS">ICMS</option>
                <option value="PES/CONFINS">PES/CONFINS</option>
              </select>

              <img src={ExpandirText} alt="" />
            </div>

            <div className="seletor-conteudos">
              <select
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
              >
                <option value="recentes">Mais recentes</option>
                <option value="antigos">Mais antigos</option>
              </select>

              <img src={ExpandirText} alt="" />
            </div>
          </div>

          {/* Tabela de conteúdos */}
          <div className="tabela-conteudos">
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Tema</th>
                  <th>Data de publicação</th>
                  <th>Autor</th>
                  <th className="coluna-acoes">Ações</th>
                </tr>
              </thead>

              <tbody>
                {listaFiltrada.length > 0 ? (
                  listaFiltrada.map((conteudo) => (
                    <tr key={conteudo.id}>
                      <td>{conteudo.titulo}</td>

                      <td>
                        <span
                          className={
                            conteudo.tema === "SPED"
                              ? "etiqueta-tema tema-sped"
                              : conteudo.tema === "ICMS"
                              ? "etiqueta-tema tema-icms"
                              : conteudo.tema === "Notas Fiscais"
                              ? "etiqueta-tema tema-notas-fiscais"
                              : conteudo.tema === "Reforma Tributária"
                              ? "etiqueta-tema tema-reforma-tributaria"
                              : "etiqueta-tema tema-padrao"
                          }
                        >
                          {conteudo.tema}
                        </span>
                      </td>

                      <td>{conteudo.data}</td>
                      <td>{conteudo.autor}</td>

                      <td className="coluna-acoes">
                        <button
                          className="excluir-conteudo"
                          title="Excluir conteúdo"
                          onClick={() => excluirConteudo(conteudo.id)}
                        >
                          <img src={Lixeira} alt="Excluir" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="sem-conteudos">
                      Nenhum conteúdo encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

// Menu lateral
function Sidebar() {
  return (
    <aside className="menu-conteudos">
      <div className="logo-conteudos">
        <img src={LogoNome} alt="Integra" />
      </div>

      <nav className="navegacao-conteudos">
        <a href="#" className="item-menu">
          <img src={CasaBranca} alt="" />
          <span>Início</span>
        </a>

        <a href="#" className="item-menu menu-ativo">
          <img src={LivroBranco} alt="" />
          <span>Conteúdos</span>
        </a>

        <a href="#" className="item-menu">
          <img src={DoisDocumentosBranco} alt="" />
          <span>Notas Fiscais</span>
        </a>

        <a href="#" className="item-menu">
          <img src={ADDProfileBranco} alt="" />
          <span>Clientes</span>
        </a>

        <a href="#" className="item-menu">
          <img src={PessoaBranca} alt="" />
          <span>Usuários</span>
        </a>
      </nav>

      <button
        className="sair-conteudos"
        onClick={() => alert("Configure aqui a saída da conta.")}
      >
        <img src={SairBranco} alt="" />
        <span>Sair</span>
      </button>
    </aside>
  );
}

// Cabeçalho superior
function Header({ pesquisa, setPesquisa }) {
  return (
    <header className="topo-conteudos">
      <div className="pesquisa-topo-conteudos">
        <img src={LupaCinza} alt="" />

        <input
          type="text"
          placeholder="Buscar conteúdos, notas fiscais, etc..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
        />
      </div>

      <div className="usuario-conteudos">
        <div className="foto-usuario">JS</div>

        <div className="dados-usuario">
          <strong>João Silva</strong>
          <span>Analista SPED</span>
        </div>
      </div>
    </header>
  );
}

export default ConteudoTributario;
