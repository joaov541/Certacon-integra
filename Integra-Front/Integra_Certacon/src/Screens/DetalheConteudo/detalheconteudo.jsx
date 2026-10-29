
import "./detalheconteudo.css";

import LogoImagem from "../../assets/Icones/LogoImagem.png";
import LogoNome from "../../assets/Icones/LogoNome.png";

import CasaBranca from "../../assets/Icones/CasaBranca.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
import LupaCinza from "../../assets/Icones/LupaCinza.png";
import SairBranco from "../../assets/Icones/SairBranco.png";

import calendario from "../../assets/Icones/calendario.png";
import Pessoa from "../../assets/Icones/Pessoa.png";
import TresPontos from "../../assets/Icones/TresPontos.png";
import EscudoLaranja from "../../assets/Icones/EscudoLaranja.png";
import Relogio from "../../assets/Icones/Relogio.png"
import ArquivoDetalhe from "../../assets/Icones/ArquivoDetalhe.png"

function DetalheRevisao() {
  const menuItems = [
    { label: "Início", icon: CasaBranca },
    { label: "Conteúdos", icon: LivroBranco, active: true },
    { label: "Notas Fiscais", icon: DoisDocumentosBranco },
    { label: "Clientes", icon: ADDProfileBranco },
    { label: "Usuários", icon: PessoaBranca },
  ];

  return (
    <div className="pagina-revisao">
      <aside className="menu-lateral">
        <div className="logo">
          <img src={LogoNome} alt="INTEGRA" />
        </div>

        <nav className="opcoes-menu">
          {menuItems.map((item) => (
            <a
              key={item.label}
              href="#"
              className={item.active ? "menu-ativo" : ""}
              onClick={(e) => {
                if (item.active) e.preventDefault();
              }}
            >
              <img src={item.icon} alt="" />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <button
          className="botao-sair"
          onClick={() => alert("Saindo do sistema...")}
        >
          <img src={SairBranco} alt="" />
          <span>Sair</span>
        </button>
      </aside>

      <main className="conteudo-principal">
        <header className="cabecalho">
          <div className="pesquisa">
            <img src={LupaCinza} alt="" />
            <input
              type="text"
              placeholder="Buscar conteúdos, notas fiscais, etc..."
            />
          </div>

          <div className="perfil-usuario">
            <div className="foto-perfil">JS</div>

            <div className="dados-usuario">
              <strong>João Silva</strong>
              <span>Analista SPED</span>
            </div>

            <button
              className="botao-perfil-opcoes"
              aria-label="Mais opções do perfil"
              onClick={() => alert("Opções do perfil")}
            >
              <img src={TresPontos} alt="" />
            </button>
          </div>
        </header>

        <section className="detalhe-revisao">
          <button
            className="botao-voltar"
            onClick={() => window.history.back()}
          >
            <span className="seta-voltar">←</span>
            <span>Voltar</span>
          </button>

          <div className="area-artigo">
            <article className="artigo">
              <h1>
                Reforma Tributária: Novas Regras do IBS e CBS
              </h1>

              <span className="categoria-artigo">
                Reforma Tributária
              </span>

              <div className="informacoes-artigo">
                <span>
                  <img src={Relogio} alt="" />
                  Publicado em 09/10/2026
                </span>

                <span>
                  <img src={Pessoa} alt="" />
                  Por Maria de Oliveira
                </span>

                <span className="versao-artigo">
                  ⓧ Versão 1.0
                </span>
              </div>

              <div className="texto-artigo">
                <p>
                  A Reforma Tributária do consumo no Brasil foi
                  oficializada pela Emenda Constitucional nº 132/2023
                  e tem como objetivo simplificar o sistema de
                  impostos do país, acabando com a cumulatividade
                  (efeito cascata) e reduzindo a burocracia.
                </p>

                <ul>
                  <li>
                    CBS (Contribuição sobre Bens e Serviços):
                    imposto de competência federal que substitui PIS,
                    Cofins e IPI.
                  </li>

                  <li>
                    IBS (Imposto sobre Bens e Serviços): imposto
                    compartilhado entre estados e municípios que
                    substitui o ICMS e o ISS.
                  </li>

                  <li>
                    IS (Imposto Seletivo): conhecido como "imposto do
                    pecado", incide sobre bens e serviços prejudiciais
                    à saúde ou ao meio ambiente.
                  </li>
                </ul>
              </div>

              <div className="topicos-artigo">
                <h2>Tópicos abordados</h2>

                <ul>
                  <li>O que muda com IBS e a CBS</li>
                  <li>Cronograma de implementação</li>
                  <li>Principais impactos para as empresas</li>
                </ul>
              </div>
            </article>

            <aside className="area-documentos">
              <h2>Documentos</h2>

              <div className="documento">
                <img
                  src={ArquivoDetalhe}
                  alt="Documento PDF"
                />

                <div className="informacao-documento">
                  <strong>reforma_Tributária.pdf</strong>
                  <span>2,4mb</span>
                </div>
              </div>

              <button
                className="botao-baixar"
                onClick={() =>
                  alert("Adicione o arquivo PDF para habilitar o download.")
                }
              >
                Baixar
              </button>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}

export default DetalheRevisao;
