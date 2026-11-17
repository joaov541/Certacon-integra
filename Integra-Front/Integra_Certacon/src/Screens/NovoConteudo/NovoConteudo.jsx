
import { useEffect, useRef, useState } from "react";
import { requisicaoApi } from "../../services/api";
import "./NovoConteudo.css";

import {
  NavLink,
  useNavigate,
  useParams,
  useLocation
} from "react-router-dom";

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
  const { id } = useParams();
  const location = useLocation();

  // IDENTIFICA SE É CADASTRO OU EDIÇÃO
  const modoEdicao = Boolean(id);

  // ESTADOS DOS CAMPOS
  const [titulo, setTitulo] = useState("");
  const [tema, setTema] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [arquivo, setArquivo] = useState(null);

  // ESTADOS DOS TEMAS
  const [temas, setTemas] = useState([]);
  const [carregandoTemas, setCarregandoTemas] = useState(true);

  // ESTADOS DO ARTIGO
  const [carregandoArtigo, setCarregandoArtigo] = useState(modoEdicao);

  // ESTADO DO SALVAMENTO
  const [salvando, setSalvando] = useState(false);

  // REFERÊNCIAS
  const areaTextoRef = useRef(null);
  const arquivoRef = useRef(null);

  // =========================================
  // CARREGAR TEMAS DA API
  // =========================================

  useEffect(() => {

    async function carregarTemas() {

      try {

        setCarregandoTemas(true);

        const dados = await requisicaoApi("/api/Temas");

        setTemas(Array.isArray(dados) ? dados : []);

      } catch (erro) {

        console.error("Erro ao carregar temas:", erro);

        alert(
          erro.message || "Não foi possível carregar os temas."
        );

      } finally {

        setCarregandoTemas(false);

      }
    }

    carregarTemas();

  }, []);

  // =========================================
  // CARREGAR ARTIGO PARA EDIÇÃO
  // =========================================

  useEffect(() => {

    if (!modoEdicao) {
      setCarregandoArtigo(false);
      return;
    }

    async function carregarArtigo() {

      try {

        setCarregandoArtigo(true);

        // Primeiro tenta utilizar os dados enviados pela navegação.
        let artigo = location.state?.conteudo;

        // Se a página foi aberta diretamente ou atualizada,
        // consulta o artigo na API.
        if (!artigo) {

          artigo = await requisicaoApi(
            `/api/Artigos/${id}`
          );

        }

        // Compatibilidade com respostas em camelCase ou PascalCase.
        const artigoId = artigo.artigoId ?? artigo.ArtigoId;

        const tituloArtigo = artigo.titulo ?? artigo.Titulo;

        const temaArtigo = artigo.temaId ?? artigo.TemaId;

        const conteudoArtigo = artigo.conteudo ?? artigo.Conteudo;

        if (!artigoId) {
          throw new Error("Artigo não encontrado.");
        }

        setTitulo(tituloArtigo || "");
        setTema(temaArtigo || "");
        setConteudo(conteudoArtigo || "");

        // O editor contentEditable precisa receber o HTML diretamente.
        if (areaTextoRef.current) {

          areaTextoRef.current.innerHTML =
            conteudoArtigo || "";

        }

      } catch (erro) {

        console.error("Erro ao carregar artigo:", erro);

        alert(
          erro.message ||
          "Não foi possível carregar o artigo para edição."
        );

        navigate("/conteudos");

      } finally {

        setCarregandoArtigo(false);

      }
    }

    carregarArtigo();

  }, [id, modoEdicao, location.state, navigate]);

  // =========================================
  // VALIDAR ARQUIVO
  // =========================================

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

  // =========================================
  // SELECIONAR ARQUIVO
  // =========================================

  function escolherArquivo(event) {

    verificarArquivo(event.target.files[0]);

  }

  // =========================================
  // ARRASTAR E SOLTAR ARQUIVO
  // =========================================

  function soltarArquivo(event) {

    event.preventDefault();

    verificarArquivo(event.dataTransfer.files[0]);

  }

  // =========================================
  // ATUALIZAR CONTEÚDO
  // =========================================

  function atualizarConteudo(event) {

    setConteudo(event.currentTarget.innerHTML);

  }

  // =========================================
  // FORMATAÇÃO DO EDITOR
  // =========================================

  function aplicarFormatacao(comando) {

    if (!areaTextoRef.current) return;

    areaTextoRef.current.focus();

    document.execCommand(comando, false, null);

    setConteudo(areaTextoRef.current.innerHTML);

  }

  // =========================================
  // VALIDAR CAMPOS
  // =========================================

  function validarFormulario() {

    if (!titulo.trim()) {

      alert("Informe o título do conteúdo.");

      return false;
    }

    if (!tema) {

      alert("Selecione um tema.");

      return false;
    }

    const textoSemHtml = conteudo
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

    if (!textoSemHtml) {

      alert("Informe o conteúdo do artigo.");

      return false;
    }

    return true;
  }

  // =========================================
  // LIMPAR FORMULÁRIO
  // =========================================

  function limparFormulario() {

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

  
  // =========================================
  // SALVAR OU ATUALIZAR ARTIGO E ENVIAR ARQUIVO
  // =========================================

  async function salvarRascunho() {

    if (!validarFormulario()) {
      return;
    }

    try {

      setSalvando(true);

      const dadosArtigo = {
        temaId: tema,
        titulo: titulo.trim(),
        resumo: null,
        conteudo: conteudo,
        visibilidade: "PUBLICO"
      };

      let resposta;
      let artigoId = id;

      // 1. CRIAR OU ATUALIZAR O ARTIGO

      if (modoEdicao) {

        resposta = await requisicaoApi(
          `/api/Artigos/${id}`,
          {
            method: "PUT",
            body: JSON.stringify(dadosArtigo)
          }
        );

      } else {

        resposta = await requisicaoApi(
          "/api/Artigos",
          {
            method: "POST",
            body: JSON.stringify(dadosArtigo)
          }
        );

        // Recupera o ID retornado pela API.
        artigoId =
          resposta?.artigoId ??
          resposta?.ArtigoId ??
          resposta?.artigo?.artigoId ??
          resposta?.artigo?.ArtigoId ??
          resposta?.data?.artigoId ??
          resposta?.data?.ArtigoId;

      }

      // 2. VERIFICAR SE TEMOS O ID DO ARTIGO

      if (!artigoId) {

        throw new Error(
          "O artigo foi salvo, mas a API não retornou o ID necessário para enviar o documento. Verifique o retorno do POST /api/Artigos."
        );

      }

      // 3. ENVIAR O DOCUMENTO, SE FOI SELECIONADO

      if (arquivo) {

        const formularioArquivo = new FormData();

        formularioArquivo.append("arquivo", arquivo);

        await requisicaoApi(
          `/api/Artigos/${artigoId}/arquivo`,
          {
            method: "POST",
            body: formularioArquivo
          }
        );

      }

      // 4. INFORMAR O RESULTADO

      alert(
        arquivo
          ? modoEdicao
            ? "Conteúdo e documento atualizados com sucesso!"
            : "Rascunho e documento salvos com sucesso!"
          : modoEdicao
            ? "Conteúdo atualizado com sucesso!"
            : "Rascunho salvo com sucesso!"
      );

      navigate("/conteudos");

    } catch (erro) {

      console.error("Erro ao salvar artigo:", erro);

      alert(
        erro.message ||
        "Não foi possível salvar o conteúdo."
      );

    } finally {

      setSalvando(false);

    }
  }


  // =========================================
  // CANCELAR
  // =========================================

  function cancelar() {

    const confirmar = window.confirm(
      "Deseja realmente sair e descartar as alterações?"
    );

    if (!confirmar) return;

    navigate("/conteudos");

  }

  // =========================================
  // SAIR DO SISTEMA
  // =========================================

  function sairSistema() {

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("perfis");

    navigate("/login", { replace: true });

  }

  // =========================================
  // TELA
  // =========================================

  return (

    <div className="pagina-novo-conteudo">

      <Sidebar sairSistema={sairSistema} />

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

          <h1>
            {modoEdicao
              ? "Editar Conteúdo"
              : "Novo Conteúdo"}
          </h1>

          {carregandoArtigo ? (

            <p>Carregando dados do artigo...</p>

          ) : (

            <>

              <div className="formulario-conteudo1">

                <div className="formulario-esquerda">

                  {/* TÍTULO */}

                  <div className="campo-conteudo">

                    <label htmlFor="titulo">
                      Título
                    </label>

                    <input
                      id="titulo"
                      type="text"
                      placeholder="Digite o título do conteúdo"
                      value={titulo}
                      onChange={(event) =>
                        setTitulo(event.target.value)
                      }
                      disabled={salvando}
                    />

                  </div>

                  {/* TEMA */}

                  <div className="campo-conteudo">

                    <label htmlFor="tema">
                      Tema
                    </label>

                    <div className="select-tema-container">

                      <select
                        id="tema"
                        value={tema}
                        onChange={(event) =>
                          setTema(event.target.value)
                        }
                        disabled={carregandoTemas || salvando}
                      >

                        <option value="">

                          {carregandoTemas
                            ? "Carregando temas..."
                            : "Selecione um tema"}

                        </option>

                        {temas.map((item) => {

                          const idTema =
                            item.temaId ?? item.TemaId;

                          const nome =
                            item.nome ?? item.Nome;

                          return (

                            <option
                              key={idTema}
                              value={idTema}
                            >
                              {nome}
                            </option>

                          );

                        })}

                      </select>

                      <img
                        src={ExpandirCinza}
                        alt=""
                        className="icone-expandir-tema"
                      />

                    </div>

                  </div>

                  {/* EDITOR DE CONTEÚDO */}

                  <div className="campo-conteudo">

                    <label htmlFor="editor-conteudo">
                      Conteúdo
                    </label>

                    <div className="editor-conteudo">

                      <div className="barra-editor">

                        <button
                          type="button"
                          title="Negrito"
                          disabled={salvando}
                          onMouseDown={(event) =>
                            event.preventDefault()
                          }
                          onClick={() =>
                            aplicarFormatacao("bold")
                          }
                        >
                          <img
                            src={B_EstiloTexto}
                            alt=""
                          />
                        </button>

                        <button
                          type="button"
                          title="Itálico"
                          disabled={salvando}
                          onMouseDown={(event) =>
                            event.preventDefault()
                          }
                          onClick={() =>
                            aplicarFormatacao("italic")
                          }
                        >
                          <img
                            src={I_EstiloTexto}
                            alt=""
                          />
                        </button>

                        <button
                          type="button"
                          title="Sublinhado"
                          disabled={salvando}
                          onMouseDown={(event) =>
                            event.preventDefault()
                          }
                          onClick={() =>
                            aplicarFormatacao("underline")
                          }
                        >
                          <img
                            src={U_EstiloTexto}
                            alt=""
                          />
                        </button>

                        <button
                          type="button"
                          title="Alinhar à esquerda"
                          disabled={salvando}
                          onMouseDown={(event) =>
                            event.preventDefault()
                          }
                          onClick={() =>
                            aplicarFormatacao("justifyLeft")
                          }
                        >
                          <img
                            src={TextosAlinhadosEsquerda}
                            alt=""
                          />
                        </button>

                        <button
                          type="button"
                          title="Centralizar"
                          disabled={salvando}
                          onMouseDown={(event) =>
                            event.preventDefault()
                          }
                          onClick={() =>
                            aplicarFormatacao("justifyCenter")
                          }
                        >
                          <img
                            src={TextoAlinhadoCentro}
                            alt=""
                          />
                        </button>

                        <button
                          type="button"
                          title="Alinhar à direita"
                          disabled={salvando}
                          onMouseDown={(event) =>
                            event.preventDefault()
                          }
                          onClick={() =>
                            aplicarFormatacao("justifyRight")
                          }
                        >
                          <img
                            src={TextoAlinhadoDireita}
                            alt=""
                          />
                        </button>

                      </div>

                      <div
                        id="editor-conteudo"
                        ref={areaTextoRef}
                        className="area-texto"
                        contentEditable={!salvando}
                        suppressContentEditableWarning
                        data-placeholder="Digite o conteúdo aqui..."
                        onInput={atualizarConteudo}
                      />

                    </div>

                  </div>

                </div>

                {/* ÁREA DE ARQUIVO */}

                <div className="area-arquivo">

                  <label
                    htmlFor="arquivo"
                    className="caixa-upload"
                    onDragOver={(event) =>
                      event.preventDefault()
                    }
                    onDrop={soltarArquivo}
                  >

                    <img
                      src={iconeUpload}
                      alt=""
                      className="icone-upload-imagem"
                    />

                    <p>
                      Arraste e solte os arquivos aqui
                    </p>

                    <span>
                      ou clique para selecionar
                    </span>

                    {arquivo ? (

                      <strong className="nome-arquivo">
                        {arquivo.name}
                      </strong>

                    ) : (

                      <div className="informacoes-arquivo">

                        <span>
                          Formatos aceitos: PDF, DOC, DOCX
                        </span>

                        <span>
                          Tamanho máximo: 10 MB
                        </span>

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
                    disabled={salvando}
                  />

                </div>

              </div>

              {/* BOTÕES */}

              <div className="botoes-conteudo">

                <button
                  type="button"
                  className="botao-voltar1"
                  onClick={() => navigate(-1)}
                  disabled={salvando}
                >
                  Voltar
                </button>

                <button
                  type="button"
                  className="botao-cancelar"
                  onClick={cancelar}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="botao-rascunho"
                  onClick={salvarRascunho}
                  disabled={
                    salvando ||
                    carregandoTemas ||
                    carregandoArtigo
                  }
                >
                  {salvando
                    ? "Salvando..."
                    : modoEdicao
                      ? "Salvar Alterações"
                      : "Salvar Rascunho"}
                </button>

              </div>

            </>

          )}

        </section>

      </main>

    </div>

  );
}

/* =========================================
   HEADER DESKTOP
========================================= */

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

/* =========================================
   SIDEBAR
========================================= */

function Sidebar({ sairSistema }) {

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
            isActive
              ? "item-menu-novo menu-ativo-novo"
              : "item-menu-novo"
          }
        >
          <img src={iconeCasa} alt="" />
          Início
        </NavLink>

        <NavLink
          to="/conteudos"
          className={({ isActive }) =>
            isActive ||
              window.location.pathname.startsWith("/conteudos")
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
            isActive
              ? "item-menu-novo menu-ativo-novo"
              : "item-menu-novo"
          }
        >
          <img src={iconeNotas} alt="" />
          Notas Fiscais
        </NavLink>

        <NavLink
          to="/clientes"
          className={({ isActive }) =>
            isActive
              ? "item-menu-novo menu-ativo-novo"
              : "item-menu-novo"
          }
        >
          <img src={iconeClientesBranco} alt="" />
          Clientes
        </NavLink>

        <NavLink
          to="/usuario"
          className={({ isActive }) =>
            isActive
              ? "item-menu-novo menu-ativo-novo"
              : "item-menu-novo"
          }
        >
          <img src={iconePessoa} alt="" />
          Usuários
        </NavLink>

      </nav>

      <button
        type="button"
        className="sair-novo-conteudo"
        onClick={sairSistema}
      >
        <img src={iconeSair} alt="" />
        Sair
      </button>

    </aside>

  );

}

export default NovoConteudo;
