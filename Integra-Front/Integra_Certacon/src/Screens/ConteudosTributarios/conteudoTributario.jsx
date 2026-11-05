
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
import LogoNomeMobile from "../../assets/Icones/LogoNomeMobile.png";
import iconeConteudo from "../../assets/Icones/DoisDocumentos.png";

const dadosIniciais = [
  {
    id: 1,
    titulo: "Reforma tributária",
    tema: "Reforma Tributária",
    data: "09/10/2026",
    autor: "Maria de Oliveira",
  },
  {
    id: 2,
    titulo: "SPED Fiscal 2025",
    tema: "SPED",
    data: "12/09/2022",
    autor: "João da Silva",
  },
  {
    id: 3,
    titulo: "Atualização das Tabelas",
    tema: "Reforma Tributária",
    data: "08/08/2028",
    autor: "Lívia Frete",
  },
  {
    id: 4,
    titulo: "Validação Chave Acesso",
    tema: "Reforma Tributária",
    data: "05/08/2020",
    autor: "Hugo Xavier",
  },
  {
    id: 5,
    titulo: "PIS/Configurações",
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

  const listaFiltrada = conteudos
    .filter((conteudo) => {
      const texto = pesquisa.toLowerCase();

      const encontrouTexto =
        conteudo.titulo.toLowerCase().includes(texto) ||
        conteudo.tema.toLowerCase().includes(texto);

      const encontrouTema =
        temaSelecionado === "Todos" ||
        conteudo.tema === temaSelecionado;

      return encontrouTexto && encontrouTema;
    })
    .sort((a, b) => {
      const dataA = a.data.split("/").reverse().join("");
      const dataB = b.data.split("/").reverse().join("");

      return ordem === "recentes"
        ? dataB.localeCompare(dataA)
        : dataA.localeCompare(dataB);
    });

  function excluirConteudo(id) {
    const confirmar = window.confirm(
      "Deseja realmente excluir este conteúdo?"
    );

    if (confirmar) {
      setConteudos((atuais) =>
        atuais.filter((conteudo) => conteudo.id !== id)
      );
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
              <h1>Conteúdos Tributários</h1>

              <p>
                Explore conteúdos por tema, mantenha-se conectado
              </p>
            </div>

            <button
              type="button"
              className="adicionar-conteudo"
              aria-label="Adicionar conteúdo"
              onClick={() =>
                alert("Aqui você poderá abrir a tela de novo conteúdo.")
              }
            >
              <span className="adicionar-conteudo-texto">
                + Adicionar Conteúdo
              </span>

              <span className="adicionar-conteudo-mais">+</span>
            </button>
          </div>

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
                      <td className="celula-titulo">
                        <img
                          src={iconeConteudo}
                          alt=""
                          className="icone-card-conteudo"
                        />

                        <strong>{conteudo.titulo}</strong>
                      </td>

                      <td className="celula-tema">
                        <span
                          className={`etiqueta-tema ${
                            conteudo.tema === "SPED"
                              ? "tema-sped"
                              : conteudo.tema === "ICMS"
                                ? "tema-icms"
                                : conteudo.tema === "Notas Fiscais"
                                  ? "tema-notas-fiscais"
                                  : conteudo.tema === "Reforma Tributária"
                                    ? "tema-reforma-tributaria"
                                    : "tema-padrao"
                          }`}
                        >
                          {conteudo.tema}
                        </span>
                      </td>

                      <td className="celula-data">
                        {conteudo.data}
                      </td>

                      <td className="celula-autor">
                        {conteudo.autor}
                      </td>

                      <td className="coluna-acoes">
                        <button
                          type="button"
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

      <FooterMobile />
    </div>
  );
}

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
        type="button"
        className="sair-conteudos"
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
    <>
      {/* Cabeçalho desktop */}
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

      {/* Cabeçalho mobile */}
      <header className="home-header-mobile">
        <div className="home-header-superior-mobile">
          <img
            src={LogoNomeMobile}
            alt="Integra"
            className="home-logo-mobile"
          />

          <div className="usuario-mobile">
            <div className="foto-usuario-mobile">JS</div>

            <div className="dados-usuario-mobile">
              <strong>João Silva</strong>
              <span>Analista SPED</span>
            </div>
          </div>
        </div>

        <div className="home-busca-mobile">
          <img src={LupaCinza} alt="" />

          <input
            type="text"
            placeholder="Buscar conteúdos, notas fiscais, etc..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
          />
        </div>
      </header>
    </>
  );
}

function FooterMobile() {
  return (
    <footer className="footer-conteudos-mobile">
      <a href="#" className="item-footer-mobile">
        <img src={CasaBranca} alt="" />
        <span>Início</span>
      </a>

      <a href="#" className="item-footer-mobile footer-ativo">
        <img src={LivroBranco} alt="" />
        <span>Conteúdos</span>
      </a>

      <a href="#" className="item-footer-mobile">
        <img src={DoisDocumentosBranco} alt="" />
        <span>Notas Fiscais</span>
      </a>

      <a href="#" className="item-footer-mobile">
        <img src={ADDProfileBranco} alt="" />
        <span>Clientes</span>
      </a>

      <a href="#" className="item-footer-mobile">
        <img src={PessoaBranca} alt="" />
        <span>Usuários</span>
      </a>
    </footer>
  );
}

export default ConteudoTributario;
