
import LogoIntegra from "../../assets/Icones/LogoNomeMobile.png";
import LupaPesquisa from "../../assets/Icones/LupaPesquisa.png";
import "./header.css";

function Header() {
  return (
    <header className="integra-header">

      <div className="header-superior">

        <img
          src={LogoIntegra}
          alt="Integra"
          className="header-logo"
        />

        <div className="header-usuario">

          <div className="header-foto">
            JS
          </div>

          <div className="header-dados">
            <strong>João Silva</strong>
            <span>Analista SPED</span>
          </div>

        </div>

      </div>

      <div className="header-pesquisa">

        <img src={LupaPesquisa} alt="" />

        <input
          type="search"
          placeholder="Buscar conteúdos, notas fiscais, etc..."
          aria-label="Buscar conteúdos"
        />

      </div>

    </header>
  );
}

export default Header;
