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

    const ehFormData = opcoes.body instanceof FormData;

    const cabecalhos = {
        ...opcoes.headers
    };

    // Adiciona o JWT automaticamente.

    if (token) {
        cabecalhos.Authorization = `Bearer ${token}`;
    }

    // Configuração para JSON e envio de arquivos.

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

// =========================================
// REQUISIÇÕES PÚBLICAS DE RECUPERAÇÃO
// =========================================

async function requisicaoRecuperacao(
    caminho,
    corpo,
    signal
) {

    const resposta = await fetch(`${api}${caminho}`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(corpo),

        credentials: "omit",

        cache: "no-store",

        signal

    });

    const dados = await resposta.json().catch(() => null);

    // Limite de requisições.

    if (resposta.status === 429) {

        throw new Error(
            "Muitas tentativas. Aguarde alguns minutos e tente novamente."
        );

    }

    // Tratamento de erros.

    if (!resposta.ok) {

        throw new Error(
            dados?.mensagem ||
            dados?.detail ||
            dados?.title ||
            "Não foi possível concluir a solicitação."
        );

    }

    return dados;
}

// =========================================
// SOLICITAR RECUPERAÇÃO DE SENHA
// =========================================

export async function solicitarRecuperacaoSenha(email) {

    return requisicaoRecuperacao(

        "/api/RecuperacaoSenha/solicitar",

        {
            email: email.trim()
        }

    );
}

// =========================================
// VALIDAR TOKEN DE RECUPERAÇÃO
// =========================================

export async function validarTokenRecuperacao(
    token,
    signal
) {

    return requisicaoRecuperacao(

        "/api/RecuperacaoSenha/validar",

        {
            token
        },

        signal

    );
}

// =========================================
// REDEFINIR SENHA
// =========================================

export async function redefinirSenha(
    token,
    novaSenha,
    confirmarSenha
) {

    return requisicaoRecuperacao(

        "/api/RecuperacaoSenha/redefinir",

        {
            token,
            novaSenha,
            confirmarSenha
        }

    );
}

// =========================================
// EXPORTAÇÃO DA URL BASE
// =========================================

export default api;