import { Link } from "react-router-dom";

import {
    Calculator,
    AlertCircle
} from "lucide-react";

import usePermissoes from "../../hooks/usePermissoes";

import CalculadoraReceita from "./CalculadoraReceita";

import "./SimuladorTributario.css";

export default function SimuladorTributario() {

    // =========================================
    // PERMISSÕES DO USUÁRIO
    // =========================================

    const {
        autenticado,
        temPermissao,
        carregando,
        erro
    } = usePermissoes();

    const token = localStorage.getItem("token");

    const podeCalcular =
        autenticado &&
        temPermissao("simulador.calcular");

    // =========================================
    // CARREGANDO PERMISSÕES
    // =========================================

    if (carregando) {

        return (

            <div className="st-pagina">

                <div className="st-carregando">

                    Verificando permissões...

                </div>

            </div>

        );

    }

    // =========================================
    // CONTROLE DE ACESSO
    // =========================================

    if (
        erro ||
        !autenticado ||
        !token ||
        !podeCalcular
    ) {

        return (

            <div className="st-pagina">

                <div className="st-vazio">

                    <AlertCircle size={44} />

                    <h2>Acesso indisponível</h2>

                    <p>

                        {erro

                            ? "Não foi possível verificar suas permissões."

                            : "Você não possui permissão para acessar o simulador tributário."

                        }

                    </p>

                    <Link
                        to="/home"
                        className="st-botao-principal"
                    >

                        Voltar ao início

                    </Link>

                </div>

            </div>

        );

    }

    // =========================================
    // CALCULADORA DA RECEITA FEDERAL
    // =========================================

    return (

        <div className="st-pagina">

            {/* CABEÇALHO */}

            <header className="st-cabecalho">

                <div className="st-titulo">

                    <div className="st-titulo-icone">

                        <Calculator size={30} />

                    </div>

                    <div>

                        <h1>

                            Simulador da Reforma Tributária

                        </h1>

                        <p>

                            Simule operações de IBS, CBS e
                            Imposto Seletivo utilizando a
                            calculadora da Receita Federal.

                        </p>

                    </div>

                </div>

            </header>

            {/* CALCULADORA */}

            <section className="st-painel">

                <div className="st-painel-conteudo">

                    <CalculadoraReceita
                        key={token}
                        token={token}
                    />

                </div>

            </section>

        </div>

    );

}