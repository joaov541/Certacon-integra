
const api = "https://localhost:7249";

// Função responsável por realizar o login
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
          "Erro ao consultar a API.";
    }

    return dados;
}

// Função para realizar requisições autenticadas
export async function requisicaoApi(caminho, opcoes = {}) {
    const token = localStorage.getItem("token");

    const cabecalhos = {
        ...opcoes.headers
    };

    if (token) {
        cabecalhos.Authorization = `Bearer ${token}`;
    }

    if (opcoes.body && !(opcoes.body instanceof FormData)) {
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
                : dados?.detail || dados?.title || "Erro ao consultar a API.";

        throw new Error(mensagem);
    }

    return dados;
}

export default api;
