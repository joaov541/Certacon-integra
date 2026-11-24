import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "../components/Sidebar/Sidebar";
import Header from "../components/Header/header";
import HeaderDesktop from "../components/Header/headerDesktop";

import "./LayoutSistema.css";

export default function LayoutSistema() {

    const location = useLocation();

    const [configuracao, setConfiguracao] = useState(null);

    const pesquisaPersonalizada =
        configuracao?.rota === location.pathname
            ? configuracao.props
            : {};

    useEffect(() => {

        setConfiguracao(atual =>
            atual?.rota === location.pathname
                ? atual
                : null
        );

    }, [location.pathname]);

    return (

        <div className="integra-layout">

            <Sidebar />

            <main className="integra-layout-principal">

                <div className="integra-layout-header-desktop">

                    <HeaderDesktop
                        {...pesquisaPersonalizada}
                    />

                </div>

                <div className="integra-layout-header-mobile">

                    <Header
                        {...pesquisaPersonalizada}
                    />

                </div>

                <div className="integra-layout-conteudo">

                    <Outlet
                        context={{ setConfiguracao }}
                    />

                </div>

            </main>

        </div>

    );

}