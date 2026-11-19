import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import LogoIntegra from "../../assets/Icones/LogoNomeMobile.png";
import LupaPesquisa from "../../assets/Icones/LupaPesquisa.png";
import { requisicaoApi } from "../../services/api";
import "./header.css";

function Header() {
  const [usuario, setUsuario] = useState(null);
  const [fotoPerfil, setFotoPerfil] = useState(null);

  useEffect(() => {
    let ativo = true;
    async function carregarUsuario() {
      try {
        const dados = await requisicaoApi("/api/MeuPerfil");
        if (ativo) setUsuario(dados);
      } catch (erro) {
        console.error("Erro ao carregar usuário no Header:", erro);
      }
    }
    carregarUsuario();
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    let ativo = true;
    async function carregarFoto() {
      try {
        const dados = await requisicaoApi("/api/FotoPerfil");
        if (ativo) setFotoPerfil(dados?.foto || null);
      } catch (erro) {
        if (ativo) setFotoPerfil(null);
        console.error("Erro ao carregar foto no Header:", erro);
      }
    }
    carregarFoto();
    window.addEventListener("foto-perfil-atualizada", carregarFoto);
    return () => {
      ativo = false;
      window.removeEventListener("foto-perfil-atualizada", carregarFoto);
    };
  }, []);

  const nome = usuario?.nome || "Usuário";
  const perfil = Array.isArray(usuario?.perfis)
    ? usuario.perfis.join(", ") || "Sem perfil"
    : "Carregando...";
  const iniciais = nome.trim().split(/\s+/).slice(0, 2)
    .map((parte) => parte.charAt(0)).join("").toUpperCase();

  return (
    <header className="integra-header">
      <div className="header-superior">
        <img src={LogoIntegra} alt="Integra" className="header-logo" />
        <div className="header-usuario">
          <NavLink to="/perfil" className="header-foto" title="Acessar meu perfil">
            {fotoPerfil ? (
              <img src={fotoPerfil} alt="Minha foto de perfil" className="header-foto-imagem" />
            ) : (
              iniciais
            )}
          </NavLink>
          <div className="header-dados">
            <strong>{nome}</strong>
            <span>{perfil}</span>
          </div>
        </div>
      </div>
      <div className="header-pesquisa">
        <img src={LupaPesquisa} alt="" />
        <input type="search" placeholder="Buscar conteúdos, notas fiscais, etc..." aria-label="Buscar conteúdos" />
      </div>
    </header>
  );
}

export default Header;
