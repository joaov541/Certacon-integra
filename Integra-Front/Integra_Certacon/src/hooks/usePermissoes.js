import { useContext } from 'react';
import { PermissoesContext } from '../context/PermissoesContext';

export default function usePermissoes() {
  const contexto = useContext(PermissoesContext);
  if (!contexto) throw new Error('Use usePermissoes dentro de PermissoesProvider.');
  return contexto;
}
