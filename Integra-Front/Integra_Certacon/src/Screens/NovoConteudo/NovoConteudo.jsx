
// import { useRef, useState } from "react";
// import "./NovoConteudo.css";

// function NovoConteudo() {
//     const [titulo, setTitulo] = useState("");
//     const [tema, setTema] = useState("");
//     const [conteudo, setConteudo] = useState("");
//     const [arquivo, setArquivo] = useState(null);

//     const areaTextoRef = useRef(null);
//     const arquivoRef = useRef(null);

//     // Escolher arquivo
//     function escolherArquivo(event) {
//         const arquivoSelecionado = event.target.files[0];
//         verificarArquivo(arquivoSelecionado);
//     }
    
//     // Verificar arquivo selecionado
//     function verificarArquivo(arquivoSelecionado) {
//         if (!arquivoSelecionado) {
//             return;
//         }

//         const extensaoValida = /\.(pdf|doc|docx)$/i.test(
//             arquivoSelecionado.name
//         );

//         if (!extensaoValida) {
//             alert("Selecione um arquivo PDF, DOC ou DOCX.");
//             if (arquivoRef.current) {
//                 arquivoRef.current.value = "";
//             }
//             setArquivo(null);
//             return;
//         }

//         if (arquivoSelecionado.size > 10 * 1024 * 1024) {
//             alert("O arquivo deve ter no máximo 10 MB.");

//             if (arquivoRef.current) {
//                 arquivoRef.current.value = "";
//             }

//             setArquivo(null);
//             return;
//         }

//         setArquivo(arquivoSelecionado);
//     }

//     // Arrastar arquivo para a caixa
//     function soltarArquivo(event) {
//         event.preventDefault();

//         const arquivoSelecionado = event.dataTransfer.files[0];
//         verificarArquivo(arquivoSelecionado);
//     }

//     // Atualizar o conteúdo do editor
//     function atualizarConteudo(event) {
//         setConteudo(event.currentTarget.innerHTML);
//     }

//     // Aplicar formatação no texto
//     function aplicarFormatacao(comando) {
//         if (areaTextoRef.current) {
//             areaTextoRef.current.focus();
//             document.execCommand(comando, false, null);
//             setConteudo(areaTextoRef.current.innerHTML);
//         }
//     }

//     // Salvar rascunho temporariamente
//     function salvarRascunho() {
//         console.log({
//             titulo,
//             tema,
//             conteudo,
//             arquivo: arquivo ? arquivo.name : null,
//         });

//         alert("Rascunho preparado! Os dados estão no console.");
//     }

//     // Limpar os campos
//     function cancelar() {
//         setTitulo("");
//         setTema("");
//         setConteudo("");
//         setArquivo(null);

//         if (areaTextoRef.current) {
//             areaTextoRef.current.innerHTML = "";
//         }

//         if (arquivoRef.current) {
//             arquivoRef.current.value = "";
//         }
//     }

//     return (
//         <div className="pagina-novo-conteudo">
//             <Sidebar />

//             <main className="principal-novo-conteudo">
//                 <Header />

//                 <section className="area-novo-conteudo">
//                     <h1>Novo Conteúdo</h1>

//                     <div className="formulario-conteudo">
//                         <div className="formulario-esquerda">
//                             <div className="campo-conteudo">
//                                 <label htmlFor="titulo">Título</label>

//                                 <input
//                                     id="titulo"
//                                     type="text"
//                                     placeholder="Digite o título do conteúdo"
//                                     value={titulo}
//                                     onChange={(event) =>
//                                         setTitulo(event.target.value)
//                                     }
//                                 />
//                             </div>

//                             <div className="campo-conteudo">
//                                 <label htmlFor="tema">Tema</label>

//                                 <select
//                                     id="tema"
//                                     value={tema}
//                                     onChange={(event) =>
//                                         setTema(event.target.value)
//                                     }
//                                 >
//                                     <option value="">
//                                         Selecione um tema
//                                     </option>
//                                     <option value="Reforma Tributária">
//                                         Reforma Tributária
//                                     </option>
//                                     <option value="SPED">SPED</option>
//                                     <option value="Notas Fiscais">
//                                         Notas Fiscais
//                                     </option>
//                                     <option value="ICMS">ICMS</option>
//                                     <option value="PIS/COFINS">
//                                         PIS/COFINS
//                                     </option>
//                                     <option value="Fiscal">Fiscal</option>
//                                     <option value="Contábil">Contábil</option>
//                                     <option value="Tecnologia">
//                                         Tecnologia
//                                     </option>
//                                 </select>
//                             </div>

//                             <div className="campo-conteudo">
//                                 <label>Conteúdo</label>

//                                 <div className="editor-conteudo">
//                                     <div className="barra-editor">
//                                         <button
//                                             type="button"
//                                             title="Negrito"
//                                             onMouseDown={(event) =>
//                                                 event.preventDefault()
//                                             }
//                                             onClick={() =>
//                                                 aplicarFormatacao("bold")
//                                             }
//                                         >
//                                             <b>B</b>
//                                         </button>

//                                         <button
//                                             type="button"
//                                             title="Itálico"
//                                             onMouseDown={(event) =>
//                                                 event.preventDefault()
//                                             }
//                                             onClick={() =>
//                                                 aplicarFormatacao("italic")
//                                             }
//                                         >
//                                             <i>I</i>
//                                         </button>

//                                         <button
//                                             type="button"
//                                             title="Sublinhado"
//                                             onMouseDown={(event) =>
//                                                 event.preventDefault()
//                                             }
//                                             onClick={() =>
//                                                 aplicarFormatacao("underline")
//                                             }
//                                         >
//                                             <u>U</u>
//                                         </button>

//                                         <button
//                                             type="button"
//                                             title="Alinhar à esquerda"
//                                             onMouseDown={(event) =>
//                                                 event.preventDefault()
//                                             }
//                                             onClick={() =>
//                                                 aplicarFormatacao("justifyLeft")
//                                             }
//                                         >
//                                             ☰
//                                         </button>

//                                         <button
//                                             type="button"
//                                             title="Centralizar"
//                                             onMouseDown={(event) =>
//                                                 event.preventDefault()
//                                             }
//                                             onClick={() =>
//                                                 aplicarFormatacao("justifyCenter")
//                                             }
//                                         >
//                                             ≡
//                                         </button>

//                                         <button
//                                             type="button"
//                                             title="Alinhar à direita"
//                                             onMouseDown={(event) =>
//                                                 event.preventDefault()
//                                             }
//                                             onClick={() =>
//                                                 aplicarFormatacao("justifyRight")
//                                             }
//                                         >
//                                             ☷
//                                         </button>
//                                     </div>

//                                     <div
//                                         ref={areaTextoRef}
//                                         className="area-texto"
//                                         contentEditable
//                                         suppressContentEditableWarning
//                                         data-placeholder="Digite o conteúdo aqui..."
//                                         onInput={atualizarConteudo}
//                                     />
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="area-arquivo">
//                             <label
//                                 htmlFor="arquivo"
//                                 className="caixa-upload"
//                                 onDragOver={(event) =>
//                                     event.preventDefault()
//                                 }
//                                 onDrop={soltarArquivo}
//                             >
//                                 <div className="icone-upload">↓</div>

//                                 <p>Arraste e solte os arquivos aqui</p>

//                                 <span>ou clique para selecionar</span>

//                                 {arquivo ? (
//                                     <strong className="nome-arquivo">
//                                         {arquivo.name}
//                                     </strong>
//                                 ) : (
//                                     <div className="informacoes-arquivo">
//                                         <span>
//                                             Formatos aceitos: PDF, DOC, DOCX
//                                         </span>
//                                         <span>Tamanho máximo: 10 MB</span>
//                                     </div>
//                                 )}
//                             </label>

//                             <input
//                                 ref={arquivoRef}
//                                 id="arquivo"
//                                 className="input-arquivo"
//                                 type="file"
//                                 accept=".pdf,.doc,.docx"
//                                 onChange={escolherArquivo}
//                             />
//                         </div>
//                     </div>

//                     <div className="botoes-conteudo">
//                         <button
//                             type="button"
//                             className="botao-cancelar"
//                             onClick={cancelar}
//                         >
//                             Cancelar
//                         </button>

//                         <button
//                             type="button"
//                             className="botao-rascunho"
//                             onClick={salvarRascunho}
//                         >
//                             Salvar Rascunho
//                         </button>
//                     </div>
//                 </section>
//             </main>
//         </div>
//     );
// }

// // Menu lateral
// function Sidebar() {
//     return (
//         <aside className="menu-novo-conteudo">
//             <div className="logo-novo-conteudo">
//                 <div className="simbolo-logo">✣</div>
//                 <span>INTEGRA</span>
//             </div>

//             <nav className="navegacao-novo-conteudo">
//                 <a href="#" className="item-menu-novo">
//                     <span>⌂</span>
//                     Início
//                 </a>

//                 <a
//                     href="#"
//                     className="item-menu-novo menu-ativo-novo"
//                 >
//                     <span>▣</span>
//                     Conteúdos
//                 </a>

//                 <a href="#" className="item-menu-novo">
//                     <span>▤</span>
//                     Notas Fiscais
//                 </a>

//                 <a href="#" className="item-menu-novo">
//                     <span>♙</span>
//                     Clientes
//                 </a>

//                 <a href="#" className="item-menu-novo">
//                     <span>♙</span>
//                     Usuários
//                 </a>
//             </nav>

//             <button
//                 type="button"
//                 className="sair-novo-conteudo"
//                 onClick={() => alert("Configure aqui a saída da conta.")}
//             >
//                 Sair
//             </button>
//         </aside>
//     );
// }

// // Cabeçalho superior
// function Header() {
//     return (
//         <header className="topo-novo-conteudo">
//             <div className="pesquisa-topo-novo">
//                 <span>⌕</span>
//                 <input
//                     type="text"
//                     placeholder="Buscar conteúdos, notas fiscais, etc..."
//                 />
//             </div>

//             <div className="usuario-novo-conteudo">
//                 <div className="foto-usuario-novo">JS</div>

//                 <div className="dados-usuario-novo">
//                     <strong>João Silva</strong>
//                     <span>Analista SPED</span>
//                 </div>

//                 <span className="opcoes-usuario-novo">•••</span>
//             </div>
//         </header>
//     );
// }

// export default NovoConteudo;
