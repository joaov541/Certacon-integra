import Casa from "../../assets/Icones/Casa.png";
import LivroBranco from "../../assets/Icones/LivroBranco.png";
import DoisDocumentosBranco from "../../assets/Icones/DoisDocumentosBranco.png";
import ADDProfileBranco from "../../assets/Icones/ADDProfileBranco.png";
import PessoaBranca from "../../assets/Icones/PessoaBranca.png";


{/* FOOTER RESPONSIVO */}

<footer className="home-footer">

    <button type="button" className="home-footer-item home-footer-ativo">
        <img src={Casa} alt="" />
        <span>Início</span>
    </button>

    <button type="button" className="home-footer-item">
        <img src={LivroBranco} alt="" />
        <span>Conteúdos</span>
    </button>

    <button type="button" className="home-footer-item">
        <img src={DoisDocumentosBranco} alt="" />
        <span>Notas Fiscais</span>
    </button>

    <button type="button" className="home-footer-item">
        <img src={ADDProfileBranco} alt="" />
        <span>Clientes</span>
    </button>

    <button type="button" className="home-footer-item">
        <img src={PessoaBranca} alt="" />
        <span>Usuários</span>
    </button>

</footer>