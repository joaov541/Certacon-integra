import { useEffect } from "react";
import { useLocation, useOutletContext } from "react-router-dom";

export default function usePesquisaLayout(pesquisa, setPesquisa) {

    const location = useLocation();

    const contexto = useOutletContext();

    const setConfiguracao = contexto?.setConfiguracao;

    useEffect(() => {

        if (!setConfiguracao) return;

        setConfiguracao({
            rota: location.pathname,
            props: {
                pesquisa,
                setPesquisa
            }
        });

    }, [
        pesquisa,
        setPesquisa,
        location.pathname,
        setConfiguracao
    ]);

}