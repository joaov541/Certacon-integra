
// import "./HistoricoAcoes.css";

// import LogoImagem from "../../assets/Icones/LogoImagem.png";
// import LogoNome from "../../assets/Icones/LogoNome.png";
// import CasaBranca from "../../assets/Icones/CasaBranca.png";
// import LivroBranco from "../../assets/Icones/LivroBranco.png";
// import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
// import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
// import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
// import LupaCinza from "../../assets/Icones/LupaCinza.png";
// import SairBranco from "../../assets/Icones/SairBranco.png";
// import Configuracao from "../../assets/Icones/Configuração.png";

// function HistoricoAcoes() {
//   const acoes = [
//     ["12/04/2025 14:22", "Maria Oliveira", "Publicação", "Conteúdo publicado Tributado"],
//     ["14/04/2025 14:44", "Junior Santos", "Publicação", "Conteúdo publicado Tributado"],
//     ["26/04/2025 14:12", "Felipe Fontes", "Publicação", "Conteúdo publicado Tributado"],
//     ["27/04/2025 14:40", "James Marques", "Publicação", "Conteúdo publicado Tributado"],
//     ["01/05/2025 14:30", "Pablo Sousa", "Publicação", "Conteúdo publicado Tributado"],
//   ];

//   return (
//     <div className="pagina">
//       <aside className="menu-lateral">
//         <div className="logo">
//           <img src={LogoImagem} alt="Logo INTEGRA" />
//           <img src={LogoNome} alt="INTEGRA" />
//         </div>

//         <nav className="menu-itens">
//           <a href="#" className="menu-item">
//             <img src={CasaBranca} alt="" />
//             <p>Início</p>
//           </a>

//           <a href="#" className="menu-item">
//             <img src={LivroBranco} alt="" />
//             <p>Conteúdos</p>
//           </a>

//           <a href="#" className="menu-item">
//             <img src={DoisDocumentosBranco} alt="" />
//             <p>Notas Fiscais</p>
//           </a>

//           <a href="#" className="menu-item">
//             <img src={ADDProfileBranco} alt="" />
//             <p>Clientes</p>
//           </a>

//           <a href="#" className="menu-item">
//             <img src={PessoaBranca} alt="" />
//             <p>Usuários</p>
//           </a>
//         </nav>

//         <div className="menu-rodape">
//           <a href="#">
//             <img src={Configuracao} alt="" />
//             Configurações
//           </a>

//           <button onClick={() => alert("Saindo do sistema...")}>
//             <img src={SairBranco} alt="" />
//             Sair
//           </button>
//         </div>
//       </aside>

//       <main className="conteudo">
//         <header className="topo">
//           <div className="campo-busca">
//             <img src={LupaCinza} alt="" />
//             <input type="text" placeholder="Buscar ações..." />
//           </div>

//           <div className="usuario-logado">
//             <div className="foto-usuario">JS</div>

//             <div>
//               <strong>João Silva</strong>
//               <p>Administrador</p>
//             </div>

//             <span>•••</span>
//           </div>
//         </header>

//         <h1 className="titulo">Histórico de ações</h1>

//         <section className="filtros">
//           <div className="filtro">
//             <label>Período</label>
//             <input type="text" defaultValue="01/04/2025 - 30/04/2025" />
//           </div>

//           <div className="filtro">
//             <label>Usuário</label>
//             <select>
//               <option>Todos</option>
//               <option>Maria Oliveira</option>
//               <option>Junior Santos</option>
//               <option>Felipe Fontes</option>
//               <option>James Marques</option>
//               <option>Pablo Sousa</option>
//             </select>
//           </div>

//           <div className="filtro">
//             <label>Tipo de ação</label>
//             <select>
//               <option>Todas</option>
//               <option>Publicação</option>
//             </select>
//           </div>

//           <button className="botao-buscar" onClick={() => alert("Filtros aplicados.")}>
//             Buscar
//           </button>
//         </section>

//         <section className="tabela">
//           <div className="tabela-cabecalho">
//             <p>Data e hora</p>
//             <p>Usuário</p>
//             <p>Ação</p>
//             <p>Descrição</p>
//           </div>

//           {acoes.map((acao, indice) => (
//             <div className="tabela-linha" key={indice}>
//               <p>{acao[0]}</p>
//               <p>{acao[1]}</p>
//               <p>{acao[2]}</p>
//               <p>{acao[3]}</p>
//             </div>
//           ))}
//         </section>

//         <div className="paginacao">
//           <button className="pagina-ativa">1</button>
//           <button>2</button>
//           <button>3</button>
//         </div>
//       </main>
//     </div>
//   );
// }

// export default HistoricoAcoes;
