
export function obterPerfis() {
    try {
        const usuario = JSON.parse(
            localStorage.getItem("usuario") || "{}"
        );

        const perfisSalvos = JSON.parse(
            localStorage.getItem("perfis") || "[]"
        );

        return Array.isArray(usuario.perfis)
            ? usuario.perfis
            : Array.isArray(perfisSalvos)
                ? perfisSalvos
                : [];
    } catch {
        return [];
    }
}

export function temPerfil(...perfisPermitidos) {
    const perfis = obterPerfis();

    return perfisPermitidos.some(perfil =>
        perfis.includes(perfil)
    );
}

export const PERFIS = {
    ADMIN: "Administrador",
    COORDENADOR: "Coordenador Fiscal",
    SPED: "Analista SPED",
    DOCUMENTOS: "Analista de Documentos Fiscais",
    REFORMA: "Analista de Reforma Tributária",
    CLIENTE: "Cliente"
};
