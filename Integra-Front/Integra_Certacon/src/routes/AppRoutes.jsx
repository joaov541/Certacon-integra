import { Routes, Route, Navigate } from 'react-router-dom'

// Telas
import Cadastro from '../Screens/Cadastro/cadastro'
import ConteudoRevisao from '../Screens/ConteudosRevisao/conteudorevisao'
import ConteudoTributario from '../Screens/ConteudosTributarios/conteudoTributario'
import DetalheConteudo from '../Screens/DetalheConteudo/detalheconteudo'
import EditarPerfil from '../Screens/EditarPerfil/editarperfil'
import EnvioArquivoXML from '../Screens/EnvioArquivoXML/Envioaquivoxml'
import GerenciarClientes from '../Screens/GerenciarClientes/gerenciarclientes'
import HistoricoAcoes from '../Screens/HistoricoAcoes/Historicodeacoes'
import Home from '../Screens/Home/Home'
import Login from '../Screens/Login/Login'
import NotasFiscais from '../Screens/NotasFiscais/Notasfiscais'
import NovoConteudo from '../Screens/NovoConteudo/NovoConteudo'
import Usuario from '../Screens/Usuário/usuario'

function AppRoutes() {
  return (
    <Routes>

      {/* Rota inicial */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Acesso */}
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />

      {/* Principal */}
      <Route path="/home" element={<Home />} />

      {/* Conteúdos */}
      <Route path="/conteudos" element={<ConteudoTributario />} />
      <Route path="/conteudos/revisao" element={<ConteudoRevisao />} />
      <Route path="/conteudos/detalhes" element={<DetalheConteudo />} />
      <Route path="/conteudos/novo" element={<NovoConteudo />} />

      {/* Perfil e usuários */}
      <Route path="/perfil" element={<EditarPerfil />} />
      <Route path="/usuario" element={<Usuario />} />

      {/* Clientes */}
      <Route path="/clientes" element={<GerenciarClientes />} />

      {/* Fiscal */}
      <Route path="/enviar-xml" element={<EnvioArquivoXML />} />
      <Route path="/notas-fiscais" element={<NotasFiscais />} />

      {/* Histórico */}
      <Route path="/historico" element={<HistoricoAcoes />} />

      {/* Página não encontrada */}
      <Route path="*" element={<Navigate to="/login" />} />

    </Routes>
  )
}

export default AppRoutes