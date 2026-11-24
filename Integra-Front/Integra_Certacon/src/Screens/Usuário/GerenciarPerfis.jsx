import { useEffect, useState } from 'react';
import { requisicaoApi } from '../../services/api';
import usePermissoes from '../../hooks/usePermissoes';

function normalizarBusca(valor) {
  return String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export default function GerenciarPerfis({ pesquisa = "" }){
 const {temPermissao, atualizar}=usePermissoes();
 const [lista,setLista]=useState([]), [id,setId]=useState(null), [nome,setNome]=useState(''), [descricao,setDescricao]=useState(''), [ocupado,setOcupado]=useState(false), [erro,setErro]=useState(''), [mensagem,setMensagem]=useState('');
 const filtrados = lista.filter(p => normalizarBusca([p.nome, p.descricao, p.ativo ? "ativo" : "inativo"].join(" ")).includes(normalizarBusca(pesquisa)));
 const reservado=p=>['Administrador','Cliente'].includes(p?.nome);
 const atual=lista.find(p=>p.perfilId===id);
 async function carregar(){setLista(await requisicaoApi('/api/Perfis'));}
 useEffect(()=>{carregar().catch(e=>setErro(e.message));},[]);
 function limpar(){setId(null);setNome('');setDescricao('');}
 async function salvar(e){e.preventDefault();setOcupado(true);setErro('');setMensagem('');try{const r=await requisicaoApi(id?`/api/Perfis/${id}`:'/api/Perfis',{method:id?'PUT':'POST',body:JSON.stringify({nome:nome.trim(),descricao:descricao.trim()})});limpar();await carregar();setMensagem(r.mensagem); }catch(e){setErro(e.message);}finally{setOcupado(false);}}
 async function status(p){if(!confirm(`${p.ativo?'Desativar':'Reativar'} ${p.nome}?`))return;setOcupado(true);setErro('');setMensagem('');try{const r=await requisicaoApi(`/api/Perfis/${p.perfilId}/status`,{method:'PATCH',body:JSON.stringify({ativo:!p.ativo})});await carregar();setMensagem(r.mensagem);atualizar();}catch(e){setErro(e.message);}finally{setOcupado(false);}}
 return <div className="rbac-painel"><h1>Gerenciar perfis</h1>{erro&&<p className="rbac-erro" role="alert">{erro}</p>}{mensagem&&<p role="status">{mensagem}</p>}<form className="rbac-form" onSubmit={salvar}><h2>{id?'Editar perfil':'Cadastrar novo perfil'}</h2><label>Nome<input required maxLength={100} value={nome} readOnly={reservado(atual)} onChange={e=>setNome(e.target.value)}/></label><label>Descrição<textarea maxLength={300} value={descricao} onChange={e=>setDescricao(e.target.value)}/></label><div className="rbac-acoes"><button className="rbac-btn principal" disabled={ocupado}>Salvar perfil</button><button className="rbac-btn" type="button" disabled={ocupado} onClick={limpar}>Cancelar</button></div></form><h2>Perfis cadastrados</h2>{filtrados.length === 0 && <p role="status">Nenhum perfil encontrado.</p>}{filtrados.map(p=><div className="rbac-linha" key={p.perfilId}><div><strong>{p.nome}</strong><p>{p.descricao}</p><p>{p.totalUsuarios} usuários · {p.totalPermissoes} vínculos</p><span className={`status-usuario ${p.ativo?'status-ativo':'status-desativado'}`}>{p.ativo?'ativo':'inativo'}</span></div><div className="rbac-acoes"><button className="rbac-btn" disabled={ocupado} onClick={()=>{setId(p.perfilId);setNome(p.nome);setDescricao(p.descricao||'');}}>Editar</button>{!reservado(p)&&temPermissao('permissao.gerenciar')&&<button className="rbac-btn" disabled={ocupado} onClick={()=>status(p)}>{p.ativo?'Desativar':'Reativar'}</button>}</div></div>)}</div>;
}
