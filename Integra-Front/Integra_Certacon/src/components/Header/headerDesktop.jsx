import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "./headerDesktop.css";

import { requisicaoApi } from "../../services/api";
import LupaPesquisa from "../../assets/Icones/LupaPesquisa.png";

function HeaderDesktop() {
  const [usuario, setUsuario] = useState(null);
  const [fotoPerfil, setFotoPerfil] = useState(null);

  useEffect(() => {
    let ativo = true;
    async function carregarUsuario() {
      try {
        const dados = await requisicaoApi("/api/MeuPerfil");
        if (ativo) setUsuario(dados);
      } catch (erro) {
        console.error("Erro ao carregar usuário do HeaderDesktop:", erro);
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
        console.error("Erro ao carregar foto no HeaderDesktop:", erro);
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
    <header className="integra-header-desktop">
      <div className="header-desktop-superior">
        <div className="header-desktop-pesquisa">
          <img src={LupaPesquisa} alt="" />
          <input type="search" placeholder="Buscar conteúdos, notas fiscais, etc..." />
        </div>
        <div className="header-desktop-usuario">
          <NavLink to="/perfil" className="header-desktop-foto" aria-label="Acessar meu perfil">
            {fotoPerfil ? (
              <img src={fotoPerfil} alt="Minha foto de perfil" className="header-desktop-foto-imagem" />
            ) : (
              iniciais
            )}
          </NavLink>
          <div className="header-desktop-dados">
            <strong>{nome}</strong>
            <span>{perfil}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeaderDesktop;
