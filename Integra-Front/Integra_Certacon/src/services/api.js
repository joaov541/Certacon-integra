
const api = "https://localhost:7249";

// =========================================
// REALIZAR LOGIN
// =========================================

export async function realizarLogin(identificador, senha) {
    const resposta = await fetch(`${api}/api/Autenticacao/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            identificador: identificador.trim(),
            senha: senha
        })
    });

    const texto = await resposta.text();

    let dados;

    try {
        dados = texto ? JSON.parse(texto) : null;
    } catch {
        dados = texto;
    }

    if (!resposta.ok) {
        const mensagem =
            typeof dados === "string"
                ? dados
                : dados?.mensagem ||
                  dados?.detail ||
                  dados?.title ||
                  "Erro ao realizar login.";

        throw new Error(mensagem);
    }

    return dados;
}

// =========================================
// REQUISIÇÕES AUTENTICADAS
// =========================================

export async function requisicaoApi(caminho, opcoes = {}) {
    const token = localStorage.getItem("token");

    // Identifica quando o corpo contém arquivos.
    const ehFormData = opcoes.body instanceof FormData;

    const cabecalhos = {
        ...opcoes.headers
    };

    // Adiciona o JWT automaticamente.
    if (token) {
        cabecalhos.Authorization = `Bearer ${token}`;
    }

    // JSON recebe Content-Type application/json.
    // FormData deixa o navegador definir o Content-Type
    // e o boundary automaticamente.
    if (ehFormData) {
        delete cabecalhos["Content-Type"];
        delete cabecalhos["content-type"];
    } else if (opcoes.body) {
        cabecalhos["Content-Type"] = "application/json";
    }

    const resposta = await fetch(`${api}${caminho}`, {
        ...opcoes,
        headers: cabecalhos
    });

    const texto = await resposta.text();

    let dados;

    try {
        dados = texto ? JSON.parse(texto) : null;
    } catch {
        dados = texto;
    }

    if (!resposta.ok) {
        const mensagem =
            typeof dados === "string"
                ? dados
                : dados?.mensagem ||
                  dados?.detail ||
                  dados?.title ||
                  "Erro ao consultar a API.";

        throw new Error(mensagem);
    }

    return dados;
}

export default api;
