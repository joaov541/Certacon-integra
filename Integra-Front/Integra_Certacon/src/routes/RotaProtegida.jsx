import { Navigate, Outlet, Link } from 'react-router-dom';
import usePermissoes from '../hooks/usePermissoes';

export default function RotaProtegida({ children, permissoes = [], aceitarQualquerTema = false }) {
  const { autenticado, carregando, erro, temPermissao, temAlgumaPermissao, atualizar } = usePermissoes();
  if (!autenticado) return <Navigate to="/login" replace />;
  if (carregando) return <p role="status">Carregando permissões...</p>;
  if (erro) return <div role="alert"><p>Não foi possível carregar suas permissões.</p><button onClick={atualizar}>Tentar novamente</button> <Link to="/login">Voltar ao login</Link></div>;
  const verificar = aceitarQualquerTema ? temAlgumaPermissao : temPermissao;
  if (permissoes.length && !permissoes.some(codigo => verificar(codigo))) return <div role="alert"><h2>Acesso negado</h2><p>Você não possui permissão para acessar esta página.</p><Link to="/home">Voltar ao início</Link></div>;
  return children ?? <Outlet />;
}
