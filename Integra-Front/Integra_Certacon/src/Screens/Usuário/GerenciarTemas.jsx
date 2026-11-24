import { useEffect, useState } from "react";
import { requisicaoApi } from "../../services/api";
import usePermissoes from "../../hooks/usePermissoes";

const API = "/api/Temas";
const normalizar = (valor) => String(valor ?? "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export default function GerenciarTemas({ pesquisa = "" }) {
  const { temPermissao, atualizar } = usePermissoes();
  const autorizado = temPermissao("tema.gerenciar");
  const [temas, setTemas] = useState([]);
  const [id, setId] = useState(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function consultar() {
    const dados = await requisicaoApi(API);
    if (!Array.isArray(dados)) throw new Error("Resposta inválida ao listar temas.");
    return dados;
  }

  useEffect(() => {
    if (!autorizado) return;
    let ativo = true;
    setCarregando(true);
    consultar().then(dados => { if (ativo) setTemas(dados); })
      .catch(e => { if (ativo) setErro(e.message); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [autorizado]);

  function limpar() { setId(null); setNome(""); setDescricao(""); }

  async function salvar(e) {
    e.preventDefault();
    if (!autorizado || ocupado) return;
    setErro(""); setMensagem("");
    if (!nome.trim()) { setErro("Informe o nome do tema."); return; }
    setOcupado(true);
    try {
      const r = await requisicaoApi(id ? `${API}/${id}` : API, {
        method: id ? "PUT" : "POST",
        body: JSON.stringify({ nome: nome.trim(), descricao: descricao.trim() || null })
      });
      limpar();
      setMensagem(r?.mensagem || "Tema salvo com sucesso.");
      setTemas(await consultar());
    } catch (e) { setErro(e.message || "Não foi possível salvar ou atualizar a lista."); }
    finally { setOcupado(false); }
  }

  async function alterarStatus(tema) {
    if (!autorizado || ocupado) return;
    const ativo = !tema.ativo;
    if (!window.confirm(`${ativo ? "Reativar" : "Desativar"} o tema ${tema.nome}?` +
      (ativo ? "" : " As permissões específicas desse tema poderão ficar indisponíveis."))) return;
    setOcupado(true); setErro(""); setMensagem("");
    try {
      const r = await requisicaoApi(`${API}/${tema.temaId}/status`, {
        method: "PATCH", body: JSON.stringify({ ativo })
      });
      setMensagem(r?.mensagem || "Status atualizado.");
      setTemas(await consultar());
      await atualizar();
    } catch (e) { setErro(e.message || "Não foi possível atualizar o status ou a lista."); }
    finally { setOcupado(false); }
  }

  const termo = normalizar(pesquisa);
  const filtrados = temas.filter(t => {
    if (termo === "ativo" || termo === "inativo") return termo === (t.ativo ? "ativo" : "inativo");
    return normalizar([t.nome, t.descricao, t.ativo ? "ativo" : "inativo"].join(" ")).includes(termo);
  });

  if (!autorizado) return <p role="alert">Você não possui permissão para gerenciar temas.</p>;
  return (
    <div className="rbac-painel">
      <h1>Gerenciar temas</h1>
      {erro && <p className="rbac-erro" role="alert">{erro}</p>}
      {mensagem && <p role="status">{mensagem}</p>}
      <form className="rbac-form" onSubmit={salvar}>
        <h2>{id ? "Editar tema" : "Cadastrar novo tema"}</h2>
        <label>Nome<input required maxLength={150} value={nome} disabled={ocupado} onChange={e => setNome(e.target.value)} placeholder="Nome do tema tributário" /></label>
        <label>Descrição<textarea maxLength={400} rows={3} value={descricao} disabled={ocupado} onChange={e => setDescricao(e.target.value)} placeholder="Descrição do tema" /></label>
        <div className="rbac-acoes">
          <button className="rbac-btn principal" disabled={ocupado || carregando}>{ocupado ? "Aguarde..." : id ? "Salvar alterações" : "Salvar tema"}</button>
          <button className="rbac-btn" type="button" disabled={ocupado} onClick={() => { limpar(); setErro(""); setMensagem(""); }}>Cancelar</button>
        </div>
      </form>
      <h2>Temas cadastrados</h2>
      {carregando ? <p role="status">Carregando temas...</p> : filtrados.length === 0 ? <p role="status">Nenhum tema encontrado.</p> : filtrados.map(t => (
        <div className="rbac-linha" key={t.temaId}>
          <div><strong>{t.nome}</strong><p>{t.descricao || "Sem descrição"}</p><span className={`status-usuario ${t.ativo ? "status-ativo" : "status-desativado"}`}>{t.ativo ? "ativo" : "inativo"}</span></div>
          <div className="rbac-acoes">
            <button className="rbac-btn" type="button" disabled={ocupado} onClick={() => { setId(t.temaId); setNome(t.nome); setDescricao(t.descricao || ""); setErro(""); setMensagem(""); }}>Editar</button>
            <button className="rbac-btn" type="button" disabled={ocupado} onClick={() => alterarStatus(t)}>{t.ativo ? "Desativar" : "Reativar"}</button>
          </div>
        </div>
      ))}
    </div>
  );
}
