import {
    Routes,
    Route,
    Navigate,
    Outlet
} from "react-router-dom";

import EsqueciSenha from "../Screens/EsqueciSenha/EsqueciSenha";
import RedefinirSenha from "../Screens/RedefinirSenha/RedefinirSenha";
import RotaProtegida from "./RotaProtegida";
import LayoutSistema from "../layouts/LayoutSistema";
import usePermissoes from "../hooks/usePermissoes";

// =========================================
// TELAS
// =========================================

import SimuladorTributario from "../Screens/SimuladorTributario/SimuladorTributario";
import AgendaFiscal from "../Screens/AgendaFiscal/AgendaFiscal";
import MinhaBiblioteca from "../Screens/MinhaBiblioteca/MinhaBiblioteca";
import AreaCidadao from "../Screens/AreaCidadao/AreaCidadao";
import Cadastro from "../Screens/Cadastro/cadastro";
import ConteudoRevisao from "../Screens/ConteudosRevisao/conteudorevisao";
import ConteudoTributario from "../Screens/ConteudosTributarios/conteudoTributario";
import DetalheConteudo from "../Screens/DetalheConteudo/detalheconteudo";
import EditarPerfil from "../Screens/EditarPerfil/editarperfil";
import GerenciarClientes from "../Screens/GerenciarClientes/gerenciarclientes";
import HistoricoAcoes from "../Screens/HistoricoAcoes/Historicodeacoes";
import Home from "../Screens/Home/Home";
import Login from "../Screens/Login/Login";
import NotasFiscais from "../Screens/NotasFiscais/Notasfiscais";
import NovoConteudo from "../Screens/NovoConteudo/NovoConteudo";
import Usuario from "../Screens/Usuário/usuario";
import ConsultaChave from "../Screens/ConsultaChave/ConsultaChave";
import PortalPublico from "../Screens/PortalPublico/PortalPublico";
import GlossarioFiscal from "../Screens/GlossarioFiscal/GlossarioFiscal";
import AssistenteIA from "../Screens/AssistenteIA/AssistenteIA";

// =========================================
// LAYOUT OPCIONAL
// =========================================

function LayoutOpcional() {

    const { autenticado } = usePermissoes();

    if (autenticado) {

        return (
            <RotaProtegida>
                <LayoutSistema />
            </RotaProtegida>
        );

    }

    return <Outlet />;

}

// =========================================
// ROTAS
// =========================================

function AppRoutes() {

    return (

        <Routes>

            {/* =================================
                ROTAS PÚBLICAS
            ================================= */}

            <Route
                path="/"
                element={<PortalPublico />}
            />

            <Route
                path="/portal"
                element={<PortalPublico />}
            />

            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/cadastro"
                element={<Cadastro />}
            />

            <Route
                path="/esqueci-senha"
                element={<EsqueciSenha />}
            />

            <Route
                path="/redefinir-senha"
                element={<RedefinirSenha />}
            />

            {/* =================================
                ROTAS PÚBLICAS E AUTENTICADAS
            ================================= */}

            <Route element={<LayoutOpcional />}>

                <Route
                    path="/conteudos/detalhes"
                    element={<DetalheConteudo />}
                />

                <Route
                    path="/consultar-chave"
                    element={<ConsultaChave />}
                />

                <Route
                    path="/glossario"
                    element={<GlossarioFiscal />}
                />

                <Route
                    path="/area-cidadao"
                    element={<AreaCidadao />}
                />

            </Route>

            {/* =================================
                ROTAS PROTEGIDAS
            ================================= */}

            <Route element={<RotaProtegida />}>

                <Route element={<LayoutSistema />}>

                    {/* HOME */}

                    <Route
                        path="/home"
                        element={<Home />}
                    />

                    {/* CONTEÚDOS */}

                    <Route
                        path="/conteudos"
                        element={<ConteudoTributario />}
                    />

                    {/* PERFIL */}

                    <Route
                        path="/perfil"
                        element={<EditarPerfil />}
                    />

                    {/* =================================
                        INTELIGÊNCIA ARTIFICIAL
                    ================================= */}

                    <Route
                        element={
                            <RotaProtegida
                                permissoes={[
                                    "ia.consultar",
                                    "ia.gerenciar.artigos"
                                ]}
                            />
                        }
                    >

                        <Route
                            path="/assistente-ia"
                            element={<AssistenteIA />}
                        />

                    </Route>

                    {/* =================================
                        SIMULADOR DA REFORMA TRIBUTÁRIA
                    ================================= */}

                    <Route
                        element={
                            <RotaProtegida
                                permissoes={[
                                    "simulador.calcular",
                                    "simulador.gerenciar"
                                ]}
                            />
                        }
                    >

                        <Route
                            path="/simulador-tributario"
                            element={<SimuladorTributario />}
                        />

                    </Route>

                    {/* =================================
                        AGENDA FISCAL
                    ================================= */}

                    <Route
                        element={
                            <RotaProtegida
                                permissoes={[
                                    "agenda.ler",
                                    "agenda.gerenciar"
                                ]}
                            />
                        }
                    >

                        <Route
                            path="/agenda-fiscal"
                            element={<AgendaFiscal />}
                        />

                    </Route>

                    {/* =================================
                        MINHA BIBLIOTECA
                    ================================= */}

                    <Route
                        element={
                            <RotaProtegida
                                permissoes={[
                                    "favorito.gerenciar.proprios",
                                    "historico.leitura.gerenciar.proprio"
                                ]}
                            />
                        }
                    >

                        <Route
                            path="/minha-biblioteca"
                            element={<MinhaBiblioteca />}
                        />

                    </Route>

                    {/* =================================
                        CRIAR CONTEÚDO
                    ================================= */}

                    <Route
                        element={
                            <RotaProtegida
                                permissoes={["artigo.criar"]}
                                aceitarQualquerTema
                            />
                        }
                    >

                        <Route
                            path="/conteudos/novo"
                            element={<NovoConteudo />}
                        />

                    </Route>

                    {/* =================================
                        EDITAR CONTEÚDO
                    ================================= */}

                    <Route
                        element={
                            <RotaProtegida
                                permissoes={["artigo.editar"]}
                                aceitarQualquerTema
                            />
                        }
                    >

                        <Route
                            path="/conteudos/editar/:id"
                            element={<NovoConteudo />}
                        />

                    </Route>

                    {/* =================================
                        REVISAR CONTEÚDOS
                    ================================= */}

                    <Route
                        element={
                            <RotaProtegida
                                permissoes={["artigo.revisar"]}
                                aceitarQualquerTema
                            />
                        }
                    >

                        <Route
                            path="/conteudos/revisao"
                            element={<ConteudoRevisao />}
                        />

                    </Route>

                    {/* =================================
                        CENTRAL DE DOCUMENTOS FISCAIS

                        - Notas fiscais
                        - Arquivos XML
                        - Modal de importação
                    ================================= */}

                    <Route
                        element={
                            <RotaProtegida
                                permissoes={[
                                    "nota.ler.todas",
                                    "nota.ler.proprias"
                                ]}
                            />
                        }
                    >

                        <Route
                            path="/notas-fiscais"
                            element={<NotasFiscais />}
                        />

                        {/* REDIRECIONAMENTO DA ROTA ANTIGA */}

                        <Route
                            element={
                                <RotaProtegida
                                    permissoes={["nota.importar"]}
                                />
                            }
                        >

                            <Route
                                path="/enviar-xml"
                                element={
                                    <Navigate
                                        to="/notas-fiscais?importar=xml"
                                        replace
                                    />
                                }
                            />

                        </Route>

                    </Route>

                    {/* =================================
                        GERENCIAR CLIENTES
                    ================================= */}

                    <Route
                        element={
                            <RotaProtegida
                                permissoes={["cliente.gerenciar"]}
                            />
                        }
                    >

                        <Route
                            path="/clientes"
                            element={<GerenciarClientes />}
                        />

                    </Route>

                    {/* =================================
                        GERENCIAR USUÁRIOS
                    ================================= */}

                    <Route
                        element={
                            <RotaProtegida
                                permissoes={["usuario.gerenciar"]}
                            />
                        }
                    >

                        <Route
                            path="/usuario"
                            element={<Usuario />}
                        />

                    </Route>

                    {/* =================================
                        HISTÓRICO DE AÇÕES
                    ================================= */}

                    <Route
                        element={
                            <RotaProtegida
                                permissoes={["auditoria.ler"]}
                            />
                        }
                    >

                        <Route
                            path="/historico"
                            element={<HistoricoAcoes />}
                        />

                    </Route>

                </Route>

            </Route>

            {/* =================================
                ROTA NÃO ENCONTRADA
            ================================= */}

            <Route
                path="*"
                element={<Navigate to="/login" replace />}
            />

        </Routes>

    );

}

export default AppRoutes;