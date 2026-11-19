
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

// Telas
import Cadastro from "../Screens/Cadastro/cadastro";
import ConteudoRevisao from "../Screens/ConteudosRevisao/conteudorevisao";
import ConteudoTributario from "../Screens/ConteudosTributarios/conteudoTributario";
import DetalheConteudo from "../Screens/DetalheConteudo/detalheconteudo";
import EditarPerfil from "../Screens/EditarPerfil/editarperfil";
import EnvioArquivoXML from "../Screens/EnvioArquivoXML/Envioaquivoxml";
import GerenciarClientes from "../Screens/GerenciarClientes/gerenciarclientes";
import HistoricoAcoes from "../Screens/HistoricoAcoes/Historicodeacoes";
import Home from "../Screens/Home/Home";
import Login from "../Screens/Login/Login";
import NotasFiscais from "../Screens/NotasFiscais/Notasfiscais";
import NovoConteudo from "../Screens/NovoConteudo/NovoConteudo";
import Usuario from "../Screens/Usuário/usuario";

// ==========================================
// PERFIS OFICIAIS DO PROJETO CERTACON
// ==========================================

const PERFIS = {
  ADMIN: "Administrador",
  COORDENADOR: "Coordenador Fiscal",
  SPED: "Analista SPED",
  DOCUMENTOS: "Analista de Documentos Fiscais",
  REFORMA: "Analista de Reforma Tributária",
  CLIENTE: "Cliente",
};

const ANALISTAS = [
  PERFIS.SPED,
  PERFIS.DOCUMENTOS,
  PERFIS.REFORMA,
];

const CRIADORES = [
  PERFIS.COORDENADOR,
  ...ANALISTAS,
];

const FISCAIS = [
  PERFIS.COORDENADOR,
  ...ANALISTAS,
  PERFIS.CLIENTE,
];

// ==========================================
// CONSULTAR PERFIS DO USUÁRIO
// ==========================================

function obterPerfis() {
  try {
    const usuario = JSON.parse(
      localStorage.getItem("usuario") || "{}"
    );

    const perfisSalvos = JSON.parse(
      localStorage.getItem("perfis") || "[]"
    );

    if (Array.isArray(usuario.perfis)) {
      return usuario.perfis;
    }

    if (Array.isArray(perfisSalvos)) {
      return perfisSalvos;
    }

    return [];
  } catch {
    return [];
  }
}

// ==========================================
// COMPONENTE DE PROTEÇÃO DE ROTAS
// ==========================================

function RotaProtegida({ perfisPermitidos = [] }) {
  const token = localStorage.getItem("token");

  // Sem login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const perfisUsuario = obterPerfis();

  // Se a rota não exige perfil específico,
  // basta estar autenticado.
  if (perfisPermitidos.length === 0) {
    return <Outlet />;
  }

  const autorizado = perfisPermitidos.some(
    (perfil) => perfisUsuario.includes(perfil)
  );

  if (!autorizado) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}

// ==========================================
// ROTAS
// ==========================================

function AppRoutes() {
  return (
    <Routes>

      {/* ROTA INICIAL */}
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      {/* ACESSO PÚBLICO */}
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />

      {/* CONTEÚDOS PÚBLICOS E EXCLUSIVOS
          A API deve filtrar conforme a autenticação.
      */}
      <Route
        path="/conteudos"
        element={<ConteudoTributario />}
      />

      <Route
        path="/conteudos/detalhes"
        element={<DetalheConteudo />}
      />

      {/* ROTAS PARA TODOS OS USUÁRIOS LOGADOS */}
      <Route element={<RotaProtegida />}>
        <Route path="/home" element={<Home />} />
        <Route path="/perfil" element={<EditarPerfil />} />
      </Route>

      {/* ADMINISTRADOR */}
      <Route
        element={
          <RotaProtegida
            perfisPermitidos={[PERFIS.ADMIN]}
          />
        }
      >
        <Route path="/usuario" element={<Usuario />} />
        <Route
          path="/clientes"
          element={<GerenciarClientes />}
        />
      </Route>

      {/* COORDENADOR E ANALISTAS
          Podem criar e editar conteúdos,
          respeitando os temas permitidos na API.
      */}
      <Route
        element={
          <RotaProtegida
            perfisPermitidos={CRIADORES}
          />
        }
      >
        <Route
          path="/conteudos/novo"
          element={<NovoConteudo />}
        />
        <Route
          path="/conteudos/editar/:id"
          element={<NovoConteudo />}
        />
      </Route>

      {/* REVISÃO DE CONTEÚDOS
          Somente Coordenador Fiscal.
      */}
      <Route
        element={
          <RotaProtegida
            perfisPermitidos={[PERFIS.COORDENADOR]}
          />
        }
      >
        <Route
          path="/conteudos/revisao"
          element={<ConteudoRevisao />}
        />
      </Route>

      {/* NOTAS FISCAIS E XML */}
      <Route
        element={
          <RotaProtegida
            perfisPermitidos={FISCAIS}
          />
        }
      >
        <Route
          path="/notas-fiscais"
          element={<NotasFiscais />}
        />
        <Route
          path="/enviar-xml"
          element={<EnvioArquivoXML />}
        />
      </Route>

      {/* HISTÓRICO DE AÇÕES
          Mantido para Administrador enquanto
          a autorização da API não for ampliada.
      */}
      <Route
        element={
          <RotaProtegida
            perfisPermitidos={[PERFIS.ADMIN]}
          />
        }
      >
        <Route
          path="/historico"
          element={<HistoricoAcoes />}
        />
      </Route>

      {/* PÁGINA NÃO ENCONTRADA */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />

    </Routes>
  );
}

export default AppRoutes;
