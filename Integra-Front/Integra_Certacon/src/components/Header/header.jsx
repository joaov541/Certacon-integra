import LogoNomeMobile from "../../assets/LogoNomeMobile.png";
import LupaCinza from "../../assets/Icones/LupaCinza.png";

{/* HEADER MOBILE */}

<header className="home-header-mobile">

    <img
        src={LogoNomeMobile}
        alt="Integra"
        className="home-logo-mobile"
    />

    <div className="home-busca-mobile">

        <img src={LupaCinza} alt="" />

        <input
            type="text"
            placeholder="Pesquisar..."
        />

    </div>

</header>