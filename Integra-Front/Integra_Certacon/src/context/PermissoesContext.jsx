import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { requisicaoApi } from '../services/api';

export const PermissoesContext = createContext(null);

export function PermissoesProvider({ children }) {
  const location = useLocation();
  const [sessao, setSessao] = useState(() => localStorage.getItem('token'));
  const token = localStorage.getItem('token');
  const [resultado, setResultado] = useState(null);
  const [versao, setVersao] = useState(0);
  const atualizar = useCallback(() => { setResultado(null); setVersao(v => v + 1); }, []);
  useEffect(() => {
    const sincronizar = () => setSessao(localStorage.getItem('token'));
    sincronizar();
    window.addEventListener('storage', sincronizar);
    window.addEventListener('sessao-alterada', sincronizar);
    return () => {
      window.removeEventListener('storage', sincronizar);
      window.removeEventListener('sessao-alterada', sincronizar);
    };
  }, [location.key]);
  useEffect(() => {
    let ativo = true;
    if (!sessao) { setResultado(null); return; }
    requisicaoApi('/api/MinhasPermissoes').then(dados => {
      if (!Array.isArray(dados)) throw new Error('Resposta de permissões inválida.');
      if (ativo) setResultado({ token: sessao, lista: dados, erro: null });
    }).catch(erro => {
      if (ativo) setResultado({ token: sessao, lista: [], erro: erro.message });
    });
    return () => { ativo = false; };
  }, [sessao, versao]);
  const atual = resultado?.token === token && sessao === token ? resultado : null;
  const permissoes = useMemo(() => atual?.lista ?? [], [atual]);
  const temPermissao = useCallback((codigo, temaId = null) => permissoes.some(p =>
    p.codigo === codigo && (p.temaId == null || (temaId != null && String(p.temaId).toLowerCase() === String(temaId).toLowerCase()))
  ), [permissoes]);
  const temAlgumaPermissao = useCallback((codigo) => permissoes.some(p => p.codigo === codigo), [permissoes]);
  const valor = { autenticado: Boolean(token), carregando: Boolean(token && !atual), erro: atual?.erro ?? null, permissoes, temPermissao, temAlgumaPermissao, atualizar };
  return <PermissoesContext.Provider value={valor}>{children}</PermissoesContext.Provider>;
}
