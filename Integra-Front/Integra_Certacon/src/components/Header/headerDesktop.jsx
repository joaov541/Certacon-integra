
import { NavLink } from "react-router-dom";
import "./headerDesktop.css";

import LupaPesquisa from "../../assets/Icones/LupaPesquisa.png";

function HeaderDesktop() {
    return (
        <header className="integra-header-desktop">

            <div className="header-desktop-superior">

                <div className="header-desktop-pesquisa">
                    <img src={LupaPesquisa} alt="" />

                    <input
                        type="search"
                        placeholder="Buscar conteúdos, notas fiscais, etc..."
                    />
                </div>

                <div className="header-desktop-usuario">

                    <NavLink
                        to="/perfil"
                        className="header-desktop-foto"
                    >
                        JS
                    </NavLink>

                    <div className="header-desktop-dados">
                        <strong>João Silva</strong>
                        <span>Analista SPED</span>
                    </div>

                </div>

            </div>

        </header>
    );
}

export default HeaderDesktop;
