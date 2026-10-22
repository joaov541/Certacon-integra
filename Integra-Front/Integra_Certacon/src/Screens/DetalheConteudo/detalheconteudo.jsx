
// import "./detalheRevisao.css";

// import {
//   IoHomeOutline,
//   IoPeopleOutline,
//   IoDocumentTextOutline,
//   IoPersonOutline,
//   IoSearchOutline,
//   IoChevronBackOutline,
//   IoDownloadOutline,
//   IoCalendarOutline,
//   IoEyeOutline,
//   IoEllipsisVertical,
// } from "react-icons/io5";

// import LogoImagem from "../../assets/Icones/LogoImagem.png";
// import LogoNome from "../../assets/Icones/LogoNome.png";
// import EscudoLaranja from "../../assets/Icones/EscudoLaranja.png";
// import Livro from "../../assets/Icones/Livro.png";

// function DetalheRevisao() {
//   return (
//     <div className="pagina-revisao">

//       {/* Menu lateral */}
//       <aside className="menu-lateral">

//         <div className="logo">
//           <img src={LogoImagem} alt="Logo Integra" />
//           <img src={LogoNome} alt="Integra" />
//         </div>

//         <nav className="opcoes-menu">
//           <a href="#">
//             <IoHomeOutline />
//             <span>Início</span>
//           </a>

//           <a href="#">
//             <IoPeopleOutline />
//             <span>Organizações</span>
//           </a>

//           <a href="#">
//             <IoDocumentTextOutline />
//             <span>Portal Fiscal</span>
//           </a>

//           <a href="#">
//             <IoPersonOutline />
//             <span>Clientes</span>
//           </a>

//           <a href="#">
//             <IoPeopleOutline />
//             <span>Usuários</span>
//           </a>
//         </nav>

//         <button className="botao-sair">
//           Sair
//         </button>

//       </aside>

//       {/* Área principal */}
//       <main className="conteudo-principal">

//         {/* Cabeçalho */}
//         <header className="cabecalho">

//           <div className="pesquisa">
//             <IoSearchOutline />
//             <input
//               type="text"
//               placeholder="Buscar conteúdos, notas fiscais, etc..."
//             />
//           </div>

//           <div className="perfil-usuario">
//             <img src={LogoImagem} alt="Foto do usuário" />

//             <div>
//               <strong>João Silva</strong>
//               <span>Analista Fiscal</span>
//             </div>
//           </div>

//         </header>

//         {/* Conteúdo da página */}
//         <section className="detalhe-revisao">

//           <button
//             className="botao-voltar"
//             onClick={() => window.history.back()}
//           >
//             <IoChevronBackOutline />
//             Voltar
//           </button>

//           <div className="area-artigo">

//             {/* Informações do artigo */}
//             <div className="artigo">

//               <h1>
//                 Reforma Tributária: Novas Regras do IBS e CBS
//               </h1>

//               <span className="status-artigo">
//                 Revisão Pendente
//               </span>

//               <div className="informacoes-artigo">

//                 <span>
//                   <IoPersonOutline />
//                   Por Maria de Oliveira
//                 </span>

//                 <span>
//                   <IoCalendarOutline />
//                   16/10/2026
//                 </span>

//                 <span>
//                   <IoEyeOutline />
//                   Revisão
//                 </span>

//                 <button
//                   className="botao-opcoes"
//                   aria-label="Mais opções"
//                 >
//                   <IoEllipsisVertical />
//                 </button>

//               </div>

//               <div className="texto-artigo">

//                 <p>
//                   A Reforma Tributária traz mudanças importantes
//                   para o sistema de impostos no Brasil. Entre as
//                   principais alterações, estão a criação do
//                   Imposto sobre Bens e Serviços (IBS) e da
//                   Contribuição sobre Bens e Serviços (CBS).
//                 </p>

//                 <p>
//                   Essas mudanças buscam simplificar a cobrança
//                   de impostos, melhorar a transparência e
//                   facilitar o entendimento das obrigações fiscais
//                   das empresas.
//                 </p>

//                 <p>
//                   As empresas devem acompanhar as novas regras
//                   para se adaptar aos prazos e às mudanças
//                   previstas na legislação.
//                 </p>

//               </div>

//               <div className="topicos-artigo">

//                 <h2>Tópicos abordados</h2>

//                 <ul>
//                   <li>
//                     O que muda com o IBS e a CBS
//                   </li>

//                   <li>
//                     Cronograma de implementação
//                   </li>

//                   <li>
//                     Principais impactos para as empresas
//                   </li>
//                 </ul>

//               </div>

//             </div>

//             {/* Documentos do artigo */}
//             <aside className="area-documentos">

//               <h2>Documentos</h2>

//               <div className="documento">

//                 <img
//                   src={EscudoLaranja}
//                   alt=""
//                 />

//                 <div className="informacao-documento">
//                   <strong>Reforma_Tributaria.pdf</strong>
//                   <span>Arquivo PDF</span>
//                 </div>

//               </div>

//               <button
//                 className="botao-baixar"
//                 onClick={() => alert("Adicione o arquivo PDF para habilitar o download.")}
//               >
//                 <IoDownloadOutline />
//                 Baixar
//               </button>

//             </aside>

//           </div>

//         </section>

//       </main>

//     </div>
//   );
// }

// export default DetalheRevisao;
