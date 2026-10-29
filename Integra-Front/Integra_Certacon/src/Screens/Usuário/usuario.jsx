
// import { useState } from "react";
// import "./usuario.css";

// import LogoImagem from "../../assets/Icones/LogoImagem.png";
// import LogoNome from "../../assets/Icones/LogoNome.png";

// import CasaBranca from "../../assets/Icones/CasaBranca.png";
// import LivroBranco from "../../assets/Icones/LivroBranco.png";
// import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
// import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
// import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
// import LupaCinza from "../../assets/Icones/LupaCinza.png";
// import SairBranco from "../../assets/Icones/SairBranco.png";

// import EditarQuadrado from "../../assets/Icones/EditarQuadrado.png";
// import Lixeira from "../../assets/Icones/Lixeira.png";

// function Usuario() {
//   const [busca, setBusca] = useState("");
//   const [pagina, setPagina] = useState(1);

//   const usuarios = [
//     {
//       id: 1,
//       nome: "NinaJurandi",
//       email: "Aningmail.com",
//       perfil: "ADM",
//       cnpj: "—",
//       status: "ativo",
//     },
//     {
//       id: 2,
//       nome: "Eduardo Oliveira",
//       email: "nopy@gmail.com",
//       perfil: "ADM",
//       cnpj: "—",
//       status: "ativo",
//     },
//     {
//       id: 3,
//       nome: "Guilherme Augusto",
//       emaze "Gui@gmail.com",
//       perfil: "ADM",
//       cnpj: "11-344-676-9102-23",
//       status: "ativo",
//     },
//     {
//       id: 4,
//       noSinba"No Almeida",
//       email: "sin@gmail.com",
//       perfil: "ADM",
//       cnpj: "—",
//       status: "ativo",
//     },
//     {
//       id: 5,
//       nome: "Coda Pereira",
//       email: "cod@gmail.com",
//       perfil: "ADM",
//       cnpj: "12-345-678-9101-11",
//       status: "desativado",
//     },
//   ];

//   const usuariosFiltrados = usuarios.filter((usuario) =>
//     `${usuario.nome} ${usuario.email} ${usuario.perfil} ${usuario.cnpj}`
//       .toLowerCase()
//       .includes(busca.toLowerCase())
//   );

//   const usuariosPorPagina = 5;
//   const totalPaginas = Math.max(
//     1,
//     Math.ceil(usuariosFiltrados.length / usuariosPorPagina)
//   );

//   const usuariosExibidos = usuariosFiltrados.slice(
//     (pagina - 1) * usuariosPorPagina,
//     pagina * usuariosPorPagina
//   );

//   function excluirUsuario(id) {
//     alert(`Aqui você poderá excluir o usuário ${id}.`);
//   }

//   return (
//     <div className="pagina-usuarios">
//       {/* Menu lateral */}
//       <aside className="menu-lateral">
//         <div className="logo">
//           <img src={LogoImagem} alt="Logo INTEGRA" />
//           <img src={LogoNome} alt="INTEGRA" />
//         </div>

//         <nav className="opcoes-menu">
//           <a href="#">
//             <img src={CasaBranca} alt="" />
//             <span>Início</span>
//           </a>

//           <a href="#">
//             <img src={LivroBranco} alt="" />
//             <span>Conteúdos</span>
//           </a>

//           <a href="#">
//             <img src={DoisDocumentosBranco} alt="" />
//             <span>Notas Fiscais</span>
//           </a>

//           <a href="#">
//             <img src={ADDProfileBranco} alt="" />
//             <span>Clientes</span>
//           </a>

//           <a href="#" className="menu-ativo">
//             <img src={PessoaBranca} alt="" />
//             <span>Usuários</span>
//           </a>
//         </nav>

//         <button
//           className="botao-sair"
//           onClick={() => alert("Saindo do sistema...")}
//         >
//           <img src={SairBranco} alt="" />
//           <span>Sair</span>
//         </button>
//       </aside>

//       {/* Área principal */}
//       <main className="conteudo-principal">
//         <header className="cabecalho">
//           <div className="pesquisa">
//             <img src={LupaCinza} alt="" />

//             <input
//               type="text"
//               placeholder="Buscar ações..."
//               value={busca}
//               onChange={(e) => {
//                 setBusca(e.target.value);
//                 setPagina(1);
//               }}
//             />
//           </div>

//           <div className="perfil-usuario">
//             <div className="foto-perfil">JS</div>

//             <div className="dados-usuario">
//               <strong>João Silva</strong>
//               <span>Administrador</span>
//             </div>

//             <span className="tres-pontos">•••</span>
//           </div>
//         </header>

//         {/* Lista de usuários */}
//         <section className="conteudo-usuarios">
//           <div className="titulo-usuarios">
//             <h1>Usuários</h1>

//             <button
//               className="botao-novo-usuario"
//               onClick={() => alert("Abrir cadastro de novo usuário.")}
//             >
//               + Novo Usuário
//             </button>
//           </div>

//           <div className="tabela-container">
//             <table className="tabela-usuarios">
//               <thead>
//                 <tr>
//                   <th>Nome</th>
//                   <th>E-mail</th>
//                   <th>Perfil</th>
//                   <th>Cliente CNPJ</th>
//                   <th>Status</th>
//                   <th>Ações</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {usuariosExibidos.map((usuario) => (
//                   <tr key={usuario.id}>
//                     <td>{usuario.nome}</td>
//                     <td>{usuario.email}</td>
//                     <td>{usuario.perfil}</td>
//                     <td>{usuario.cnpj}</td>

//                     <td>
//                       <span
//                         className={`status-usuario ${usuario.status}`}
//                       >
//                         {usuario.status}
//                       </span>
//                     </td>

//                     <td>
//                       <div className="acoes-usuario">
//                         <button
//                           aria-label={`Editar ${usuario.nome}`}
//                           onClick={() =>
//                             alert(`Editar usuário: ${usuario.nome}`)
//                           }
//                         >
//                           <img src={EditarQuadrado} alt="" />
//                         </button>

//                         <button
//                           aria-label={`Excluir ${usuario.nome}`}
//                           onClick={() => excluirUsuario(usuario.id)}
//                         >
//                           <img src={Lixeira} alt="" />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}

//                 {usuariosExibidos.length === 0 && (
//                   <tr>
//                     <td colSpan="6" className="nenhum-usuario">
//                       Nenhum usuário encontrado.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* Paginação */}
//           <div className="paginacao">
//             {Array.from(
//               { length: totalPaginas },
//               (_, indice) => indice + 1
//             ).map((numero) => (
//               <button
//                 key={numero}
//                 className={pagina === numero ? "pagina-ativa" : ""}
//                 onClick={() => setPagina(numero)}
//               >
//                 {numero}
//               </button>
//             ))}
//           </div>
//         </section>
//       </main>
//     </div>
//   );
// }

// export default Usuario;
