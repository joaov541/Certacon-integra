
// import { useState } from "react";
// import "./editarperfil.css";

// import LogoImagem from "../../assets/Icones/LogoImagem.png";
// import LogoNome from "../../assets/Icones/LogoNome.png";
// import CasaBranca from "../../assets/Icones/CasaBranca.png";
// import LivroBranco from "../../assets/Icones/LivroBranco.png";
// import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
// import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
// import PessoaBranca from "../../assets/Icones/PessoaBranca.png";
// import LupaCinza from "../../assets/Icones/LupaCinza.png";
// import SairBranco from "../../assets/Icones/SairBranco.png";
// import Pessoa from "../../assets/Icones/Pessoa.png";
// import CadeadoAberto from "../../assets/Icones/CadeadoAberto.png";
// import calendario from "../../assets/Icones/calendario.png";

// function EditarPerfil() {
//   const [editando, setEditando] = useState(false);

//   const [nome, setNome] = useState("João Silva");
//   const [cargo, setCargo] = useState("Analista SPED");
//   const [email, setEmail] = useState("joao.silva@gmail.com");
//   const [departamento, setDepartamento] = useState("Fiscal");
//   const [telefone, setTelefone] = useState("1192029-2013");

//   function salvarPerfil(event) {
//     event.preventDefault();
//     setEditando(false);
//     alert("Perfil atualizado com sucesso!");
//   }

//   return (
//     <div className="pagina-perfil">
//       <aside className="menu-lateral">
//         <div className="logo">
//           <img src={LogoImagem} alt="Logo Integra" />
//           <img src={LogoNome} alt="Integra" />
//         </div>

//         <nav className="menu-itens">
//           <a href="#"><img src={CasaBranca} alt="" />Início</a>
//           <a href="#"><img src={LivroBranco} alt="" />Conteúdos</a>
//           <a href="#"><img src={DoisDocumentosBranco} alt="" />Notas Fiscais</a>
//           <a href="#"><img src={ADDProfileBranco} alt="" />Clientes</a>
//           <a href="#"><img src={PessoaBranca} alt="" />Usuários</a>
//         </nav>

//         <button className="botao-sair" onClick={() => alert("Saindo do sistema...")}>
//           <img src={SairBranco} alt="" />
//           Sair
//         </button>
//       </aside>

//       <main className="conteudo-perfil">
//         <header className="topo-perfil">
//           <div className="campo-pesquisa">
//             <img src={LupaCinza} alt="" />
//             <input type="text" placeholder="Buscar ações..." />
//           </div>

//           <div className="usuario-logado">
//             <span>JS</span>
//             <div>
//               <strong>João Silva</strong>
//               <small>Administrador</small>
//             </div>
//           </div>
//         </header>

//         <h1>Meu Perfil</h1>

//         <div className="area-perfil">
//           <section className="cartao-perfil">
//             <div className="foto-grande">
//               <img src={Pessoa} alt="Foto do perfil" />
//             </div>

//             {editando ? (
//               <form className="formulario-perfil" onSubmit={salvarPerfil}>
//                 <label>Nome</label>
//                 <input value={nome} onChange={(e) => setNome(e.target.value)} required />

//                 <label>Cargo</label>
//                 <input value={cargo} onChange={(e) => setCargo(e.target.value)} required />

//                 <label>E-mail corporativo</label>
//                 <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

//                 <label>Departamento</label>
//                 <input value={departamento} onChange={(e) => setDepartamento(e.target.value)} required />

//                 <label>Telefone corporativo</label>
//                 <input value={telefone} onChange={(e) => setTelefone(e.target.value)} required />

//                 <div className="botoes-formulario">
//                   <button type="submit">Salvar</button>
//                   <button type="button" onClick={() => setEditando(false)}>Cancelar</button>
//                 </div>
//               </form>
//                 ): ( <>
//                 <h2>{nome}</h2>
//                 <p className="cargo-perfil">{cargo}</p>

//                 <div className="dados-perfil">
//                   <div>
//                     <strong>E-mail Corporativo</strong>
//                     <p>{email}</p>
//                   </div>

//                   <div>
//                     <strong>Telefone Corporativo</strong>
//                     <p>{telefone}</p>
//                   </div>

//                   <div>
//                     <strong>Departamento</strong>
//                     <p>{departamento}</p>
//                   </div>

//                   <div>
//                     <strong>Empresa Vinculada</strong>
//                     <p>Conta & Silva Consultoria</p>
//                   </div>
//                 </div>

//                 <button className="botao-editar" onClick={() => setEditando(true)}>
//                   Editar Perfil
//                 </button>
//               </>
//             )}
//           </section>

//           <aside className="informacoes-seguranca">
//             <section className="cartao-seguranca">
//               <h3>Segurança</h3>
//               <div className="item-seguranca">
//                 <img src={CadeadoAberto} alt="" />
//                 <div>
//                   <strong>MFA</strong>
//                   <p>Ativo / Inativo</p>
//                 </div>
//               </div>
//               <div className="item-seguranca">
//                 <img src={calendario} alt="" />
//                 <div>
//                   <strong>Último login</strong>
//                   <p>24/12/2026 14:38:37</p>
//                 </div>
//               </div>
//               <button onClick={() => alert("Função de alteração de senha ainda não configurada.")}>
//                 Alterar Senha
//               </button>
//             </section>

//             <section className="cartao-seguranca">
//               <h3>Preferências</h3>
//               <div className="item-seguranca">
//                 <img src={PessoaBranca} alt="" />
//                 <div>
//                   <strong>Idioma</strong>
//                   <p>Português - BR</p>
//                 </div>
//               </div>
//               <div className="item-seguranca">
//                 <img src={calendario} alt="" />
//                 <div>
//                   <strong>Fuso Horário</strong>
//                   <p>BRT - Brasília</p>
//                 </div>
//               </div>
//             </section>
//           </aside>
//         </div>
//       </main>
//     </div>
//   );
// }

// export default EditarPerfil;
