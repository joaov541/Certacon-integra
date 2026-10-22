
// import { useState } from "react";
// import "./conteudoTributario.css";

// import {
//   IoHomeOutline,
//   IoPeopleOutline,
//   IoDocumentTextOutline,
//   IoPersonOutline,
//   IoSearchOutline,
//   IoAddOutline,
//   IoTrashOutline,
//   IoLogOutOutline,
// } from "react-icons/io5";

// import LogoImagem from "../../assets/Icones/LogoImagem.png";
// import LogoNome from "../../assets/Icones/LogoNome.png";

// function ConteudoTributario() {
//   const [pesquisa, setPesquisa] = useState("");
//   const [area, setArea] = useState("Todas");
//   const [ordem, setOrdem] = useState("recentes");

//   const [conteudos, setConteudos] = useState([
//     {
//       id: 1,
//       titulo: "Reforma Tributária",
//       tema: "Legislação",
//       data: "16/10/2026",
//       autor: "Maria Oliveira",
//     },
//     {
//       id: 2,
//       titulo: "SPED fiscal 2025",
//       tema: "SPED",
//       data: "10/10/2026",
//       autor: "Carlos Mendes",
//     },
//     {
//       id: 3,
//       titulo: "IBS e CBS",
//       tema: "Tributos",
//       data: "05/10/2026",
//       autor: "Ana Souza",
//     },
//     {
//       id: 4,
//       titulo: "Novidades do Simples",
//       tema: "Simples Nacional",
//       data: "29/09/2026",
//       autor: "Carlos Mendes",
//     },
//   ]);

//   // Filtra os conteúdos pela pesquisa e pela área
//   const conteudosFiltrados = conteudos
//     .filter((conteudo) => {
//       const encontrouTexto = conteudo.titulo
//         .toLowerCase()
//         .includes(pesquisa.toLowerCase());

//       const encontrouArea =
//         area === "Todas" || conteudo.tema === area;

//       return encontrouTexto && encontrouArea;
//     })
//     .sort((a, b) => {
//       const dataA = a.data.split("/").reverse().join("");
//       const dataB = b.data.split("/").reverse().join("");

//       if (ordem === "recentes") {
//         return dataB.localeCompare(dataA);
//       }

//       return dataA.localeCompare(dataB);
//     });

//   // Remove um conteúdo da tabela
//   function excluirConteudo(id) {
//     const confirmar = window.confirm(
//       "Deseja realmente excluir este conteúdo?"
//     );

//     if (confirmar) {
//       setConteudos(
//         conteudos.filter((conteudo) => conteudo.id !== id)
//       );
//     }
//   }

//   return (
//     <div className="pagina-conteudos">

//       {/* Menu lateral */}
//       <aside className="menu-conteudos">

//         <div className="logo-conteudos">
//           <img src={LogoImagem} alt="Logo Integra" />
//           <img src={LogoNome} alt="Integra" />
//         </div>

//         <nav className="navegacao-conteudos">

//           <a href="#">
//             <IoHomeOutline />
//             <span>Início</span>
//           </a>

//           <a href="#" className="menu-ativo">
//             <IoDocumentTextOutline />
//             <span>Conteúdos</span>
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

//         <button
//           className="sair-conteudos"
//           onClick={() => alert("Configure aqui a saída da conta.")}
//         >
//           <IoLogOutOutline />
//           <span>Sair</span>
//         </button>

//       </aside>

//       {/* Conteúdo principal */}
//       <main className="principal-conteudos">

//         {/* Cabeçalho */}
//         <header className="topo-conteudos">

//           <div className="pesquisa-topo-conteudos">
//             <IoSearchOutline />

//             <input
//               type="text"
//               placeholder="Buscar conteúdos, notas fiscais, etc..."
//             />
//           </div>

//           <div className="usuario-conteudos">
//             <div className="foto-usuario">JS</div>

//             <div>
//               <strong>João Silva</strong>
//               <span>Analista Fiscal</span>
//             </div>
//           </div>

//         </header>

//         {/* Título e botão */}
//         <section className="area-lista-conteudos">

//           <div className="titulo-conteudos">

//             <div>
//               <h1>Conteúdos tributários</h1>

//               <p>
//                 Explore nossos conteúdos para ficar por dentro
//                 das novidades fiscais.
//               </p>
//             </div>

//             <button
//               className="adicionar-conteudo"
//               onClick={() =>
//                 alert("Aqui você poderá abrir a tela de novo conteúdo.")
//               }
//             >
//               <IoAddOutline />
//               Adicionar conteúdo
//             </button>

//           </div>

//           {/* Pesquisa e filtros */}
//           <div className="filtros-conteudos">

//             <div className="pesquisa-lista-conteudos">
//               <IoSearchOutline />

//               <input
//                 type="text"
//                 placeholder="Buscar por título ou palavra-chave..."
//                 value={pesquisa}
//                 onChange={(e) => setPesquisa(e.target.value)}
//               />
//             </div>

//             <select
//               value={area}
//               onChange={(e) => setArea(e.target.value)}
//             >
//               <option value="Todas">Todas as áreas</option>
//               <option value="Legislação">Legislação</option>
//               <option value="SPED">SPED</option>
//               <option value="Tributos">Tributos</option>
//               <option value="Simples Nacional">Simples Nacional</option>
//             </select>

//             <select
//               value={ordem}
//               onChange={(e) => setOrdem(e.target.value)}
//             >
//               <option value="recentes">Mais recentes</option>
//               <option value="antigos">Mais antigos</option>
//             </select>

//           </div>

//           {/* Tabela */}
//           <div className="tabela-conteudos">

//             <table>
//               <thead>
//                 <tr>
//                   <th>Título</th>
//                   <th>Tema</th>
//                   <th>Data de publicação</th>
//                   <th>Autor</th>
//                   <th>Ações</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {conteudosFiltrados.map((conteudo) => (
//                   <tr key={conteudo.id}>
//                     <td>{conteudo.titulo}</td>

//                     <td>
//                       <span
//                         className={
//                           "etiqueta-tema " +
//                           conteudo.tema
//                             .toLowerCase()
//                             .replaceAll(" ", "-")
//                         }
//                       >
//                         {conteudo.tema}
//                       </span>
//                     </td>

//                     <td>{conteudo.data}</td>

//                     <td>{conteudo.autor}</td>

//                     <td>
//                       <button
//                         className="excluir-conteudo"
//                         title="Excluir conteúdo"
//                         onClick={() =>
//                           excluirConteudo(conteudo.id)
//                         }
//                       >
//                         <IoTrashOutline />
//                       </button>
//                     </td>
//                   </tr>
//                 ))}

//                 {conteudosFiltrados.length === 0 && (
//                   <tr>
//                     <td colSpan="5" className="sem-conteudos">
//                       Nenhum conteúdo encontrado.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>

//           </div>

//         </section>

//       </main>

//     </div>
//   );
// }

// export default ConteudoTributario;
