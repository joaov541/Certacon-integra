
export function classeCorTema(tema = "") {
    const nome = String(tema)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

    if (nome.includes("reforma tributaria")) {
        return "tema-cor-reforma";
    }

    if (nome.includes("efd-contribuicoes")) {
        return "tema-cor-contribuicoes";
    }

    if (nome.includes("sped")) {
        return "tema-cor-sped";
    }

    if (nome === "nf-e" || nome === "nfe") {
        return "tema-cor-nfe";
    }

    if (nome === "nfp") {
        return "tema-cor-nfp";
    }

    if (nome === "xml") {
        return "tema-cor-xml";
    }

    return "tema-cor-padrao";
}
