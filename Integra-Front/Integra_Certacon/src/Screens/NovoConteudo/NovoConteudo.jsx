
import { useRef, useState } from "react";
import "./NovoConteudo.css";

import Casa from "../../assets/Icones/Casa.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";

import { NavLink, useNavigate } from "react-router-dom";
import HeaderMobile from "../../components/Header/header";

import LogoMobile from "../../assets/Icones/LogoMobile.png";
import logoIntegra from "../../assets/Icones/LogoNome.png";

import iconeCasa from "../../assets/Icones/CasaBranca.png";
import iconeLivro from "../../assets/Icones/LivroBranco.png";
import iconeNotas from "../../assets/Icones/DoisDocumentosBranco.png";
import iconeClientesBranco from "../../assets/Icones/ADDProfileBranco.png";
import iconePessoa from "../../assets/Icones/PessoaBranca.png";
import iconeSair from "../../assets/Icones/SairBranco.png";

import iconeLupa from "../../assets/Icones/LupaPesquisa.png";
import iconeUpload from "../../assets/Icones/UploadLaranja.png";

import B_EstiloTexto from "../../assets/Icones/B_EstiloTexto.png";
import I_EstiloTexto from "../../assets/Icones/I_EstiloTexto.png";
import U_EstiloTexto from "../../assets/Icones/U_EstiloTexto.png";

import TextosAlinhadosEsquerda from "../../assets/Icones/TextosAlinhadosEsquerda.png";
import TextoAlinhadoDireita from "../../assets/Icones/TextoAlinhadoDireita.png";
import TextoAlinhadoCentro from "../../assets/Icones/TextoAlinhadoCentro.png";

import ExpandirCinza from "../../assets/Icones/ExpandirCinza.png";

function NovoConteudo() {
  const navigate = useNavigate();

  const [titulo, setTitulo] = useState("");
  const [tema, setTema] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [arquivo, setArquivo] = useState(null);

  const areaTextoRef = useRef(null);
  const arquivoRef = useRef(null);

  function verificarArquivo(arquivoSelecionado) {
    if (!arquivoSelecionado) return;

    const extensaoValida = /\.(pdf|doc|docx)$/i.test(
      arquivoSelecionado.name
    );

    if (!extensaoValida) {
      alert("Selecione um arquivo PDF, DOC ou DOCX.");

      if (arquivoRef.current) {
        arquivoRef.current.value = "";
      }

      setArquivo(null);
      return;
    }

    if (arquivoSelecionado.size > 10 * 1024 * 1024) {
      alert("O arquivo deve ter no máximo 10 MB.");

      if (arquivoRef.current) {
        arquivoRef.current.value = "";
      }

      setArquivo(null);
      return;
    }

    setArquivo(arquivoSelecionado);
  }

  function escolherArquivo(event) {
    verificarArquivo(event.target.files[0]);
  }

  function soltarArquivo(event) {
    event.preventDefault();
    verificarArquivo(event.dataTransfer.files[0]);
  }

  function atualizarConteudo(event) {
    setConteudo(event.currentTarget.innerHTML);
  }

  function aplicarFormatacao(comando) {
    if (!areaTextoRef.current) return;

    areaTextoRef.current.focus();

    document.execCommand(comando, false, null);

    setConteudo(areaTextoRef.current.innerHTML);
  }

  function salvarRascunho() {
    console.log({
      titulo,
      tema,
      conteudo,
      arquivo: arquivo ? arquivo.name : null,
    });

    alert("Rascunho preparado! Os dados estão no console.");
  }

  function cancelar() {
    setTitulo("");
    setTema("");
    setConteudo("");
    setArquivo(null);

    if (areaTextoRef.current) {
      areaTextoRef.current.innerHTML = "";
    }

    if (arquivoRef.current) {
      arquivoRef.current.value = "";
    }
  }

  return (
    <div className="pagina-novo-conteudo">

      <Sidebar />

      <main className="principal-novo-conteudo">

        {/* HEADER DESKTOP E TABLET */}

        <div className="header-desktop">
          <HeaderDesktop />
        </div>

        {/* HEADER MOBILE */}

        <div className="header-mobile">
          <HeaderMobile />
        </div>

        <section className="area-novo-conteudo">

          <h1>Novo Conteúdo</h1>

          <div className="formulario-conteudo1">

            <div className="formulario-esquerda">

              <div className="campo-conteudo">

                <label htmlFor="titulo">Título</label>

                <input
                  id="titulo"
                  type="text"
                  placeholder="Digite o título do conteúdo"
                  value={titulo}
                  onChange={(event) => setTitulo(event.target.value)}
                />

              </div>

              <div className="campo-conteudo">

                <label htmlFor="tema">Tema</label>

                <div className="select-tema-container">

                  <select
                    id="tema"
                    value={tema}
                    onChange={(event) => setTema(event.target.value)}
                  >
                    <option value="">Selecione um tema</option>
                    <option value="Reforma Tributária">
                      Reforma Tributária
                    </option>
                    <option value="SPED">SPED</option>
                    <option value="Notas Fiscais">
                      Notas Fiscais
                    </option>
                    <option value="ICMS">ICMS</option>
                    <option value="PIS/COFINS">PIS/COFINS</option>
                    <option value="Fiscal">Fiscal</option>
                    <option value="Contábil">Contábil</option>
                    <option value="Tecnologia">Tecnologia</option>
                  </select>

                  <img
                    src={ExpandirCinza}
                    alt=""
                    className="icone-expandir-tema"
                  />

                </div>

              </div>

              <div className="campo-conteudo">

                <label htmlFor="editor-conteudo">Conteúdo</label>

                <div className="editor-conteudo">

                  <div className="barra-editor">

                    <button
                      type="button"
                      title="Negrito"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => aplicarFormatacao("bold")}
                    >
                      <img src={B_EstiloTexto} alt="" />
                    </button>

                    <button
                      type="button"
                      title="Itálico"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => aplicarFormatacao("italic")}
                    >
                      <img src={I_EstiloTexto} alt="" />
                    </button>

                    <button
                      type="button"
                      title="Sublinhado"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => aplicarFormatacao("underline")}
                    >
                      <img src={U_EstiloTexto} alt="" />
                    </button>

                    <button
                      type="button"
                      title="Alinhar à esquerda"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => aplicarFormatacao("justifyLeft")}
                    >
                      <img src={TextosAlinhadosEsquerda} alt="" />
                    </button>

                    <button
                      type="button"
                      title="Centralizar"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => aplicarFormatacao("justifyCenter")}
                    >
                      <img src={TextoAlinhadoCentro} alt="" />
                    </button>

                    <button
                      type="button"
                      title="Alinhar à direita"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => aplicarFormatacao("justifyRight")}
                    >
                      <img src={TextoAlinhadoDireita} alt="" />
                    </button>

                  </div>

                  <div
                    id="editor-conteudo"
                    ref={areaTextoRef}
                    className="area-texto"
                    contentEditable
                    suppressContentEditableWarning
                    data-placeholder="Digite o conteúdo aqui..."
                    onInput={atualizarConteudo}
                  />

                </div>

              </div>

            </div>

            <div className="area-arquivo">

              <label
                htmlFor="arquivo"
                className="caixa-upload"
                onDragOver={(event) => event.preventDefault()}
                onDrop={soltarArquivo}
              >

                <img
                  src={iconeUpload}
                  alt=""
                  className="icone-upload-imagem"
                />

                <p>Arraste e solte os arquivos aqui</p>

                <span>ou clique para selecionar</span>

                {arquivo ? (
                  <strong className="nome-arquivo">
                    {arquivo.name}
                  </strong>
                ) : (
                  <div className="informacoes-arquivo">
                    <span>Formatos aceitos: PDF, DOC, DOCX</span>
                    <span>Tamanho máximo: 10 MB</span>
                  </div>
                )}

              </label>

              <input
                ref={arquivoRef}
                id="arquivo"
                className="input-arquivo"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={escolherArquivo}
              />

            </div>

          </div>

          {/* BOTÕES */}

          <div className="botoes-conteudo">

            <button
              type="button"
              className="botao-voltar1"
              onClick={() => navigate(-1)}
            >
              Voltar
            </button>

            <button
              type="button"
              className="botao-cancelar"
              onClick={cancelar}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="botao-rascunho"
              onClick={salvarRascunho}
            >
              Salvar Rascunho
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

/* HEADER DESKTOP */

function HeaderDesktop() {
  return (
    <header className="topo-novo-conteudo">

      <div className="pesquisa-topo-novo">

        <img
          src={iconeLupa}
          alt=""
          className="icone-lupa-header"
        />

        <input
          type="search"
          placeholder="Buscar conteúdos, notas fiscais, etc..."
          aria-label="Buscar conteúdos"
        />

      </div>

      <div className="usuario-novo-conteudo">

        <NavLink
          to="/perfil"
          className="foto-usuario-novo"
          title="Acessar meu perfil"
        >
          JS
        </NavLink>

        <div className="dados-usuario-novo">
          <strong>João Silva</strong>
          <span>Analista SPED</span>
        </div>

      </div>

    </header>
  );
}

/* SIDEBAR */

function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="menu-novo-conteudo">

      <div className="logo-novo-conteudo">

        <img
          src={logoIntegra}
          alt="Integra"
          className="logo-desktop"
        />

        <img
          src={LogoMobile}
          alt="Integra"
          className="logo-mobile"
        />

      </div>

      <nav className="navegacao-novo-conteudo">

        <NavLink
          to="/home"
          className={({ isActive }) =>
            isActive ? "item-menu-novo menu-ativo-novo" : "item-menu-novo"
          }
        >
          <img src={iconeCasa} alt="" />
          Início
        </NavLink>

        <NavLink
          to="/conteudos"
          className={({ isActive }) =>
            isActive || window.location.pathname.startsWith("/conteudos")
              ? "item-menu-novo menu-ativo-novo"
              : "item-menu-novo"
          }
        >
          <img src={iconeLivro} alt="" />
          Conteúdos
        </NavLink>

        <NavLink
          to="/notas-fiscais"
          className={({ isActive }) =>
            isActive ? "item-menu-novo menu-ativo-novo" : "item-menu-novo"
          }
        >
          <img src={iconeNotas} alt="" />
          Notas Fiscais
        </NavLink>

        <NavLink
          to="/clientes"
          className={({ isActive }) =>
            isActive ? "item-menu-novo menu-ativo-novo" : "item-menu-novo"
          }
        >
          <img src={iconeClientesBranco} alt="" />
          Clientes
        </NavLink>

        <NavLink
          to="/usuario"
          className={({ isActive }) =>
            isActive ? "item-menu-novo menu-ativo-novo" : "item-menu-novo"
          }
        >
          <img src={iconePessoa} alt="" />
          Usuários
        </NavLink>

      </nav>

      <button
        type="button"
        className="sair-novo-conteudo"
        onClick={() => navigate("/login")}
      >
        <img src={iconeSair} alt="" />
        Sair
      </button>

    </aside>
  );
}

export default NovoConteudo;
