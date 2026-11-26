const BASE = "/api-receita/calculadora";

// =========================================
// REQUISIÇÃO À RECEITA FEDERAL
// =========================================

async function requisicao(
    caminho,
    { body, signal } = {}
) {

    const resposta = await fetch(
        BASE + caminho,
        {
            method:
                body === undefined
                    ? "GET"
                    : "POST",

            headers: {
                Accept: "application/json",

                ...(body !== undefined
                    ? {
                        "Content-Type": "application/json"
                    }
                    : {})
            },

            credentials: "omit",

            redirect: "error",

            signal,

            ...(body !== undefined
                ? {
                    body: JSON.stringify(body)
                }
                : {})
        }
    );

    const dados = await resposta
        .json()
        .catch(() => null);

    // =====================================
    // TRATAMENTO DE ERROS
    // =====================================

    if (!resposta.ok || dados === null) {

        const erro = new Error(

            dados?.detail ||

            dados?.title ||

            `Resposta inválida ou indisponível (HTTP ${resposta.status}).`

        );

        erro.status = resposta.status;

        erro.dados = dados;

        throw erro;

    }

    return dados;

}

// =========================================
// CONSULTAR NCM — MERCADORIAS
// =========================================

export function consultarNcm(
    ncm,
    data,
    signal
) {

    if (!/^\d{8}$/.test(ncm)) {

        throw new Error(
            "Informe um NCM de 8 dígitos."
        );

    }

    const parametros = new URLSearchParams({
        ncm,
        data
    });

    return requisicao(

        `/dados-abertos/ncm?${parametros}`,

        {
            signal
        }

    );

}

// =========================================
// CONSULTAR NBS — SERVIÇOS
// =========================================

export function consultarNbs(
    nbs,
    data,
    signal
) {

    if (!/^\d{9}$/.test(nbs)) {

        throw new Error(
            "Informe uma NBS de 9 dígitos."
        );

    }

    const parametros = new URLSearchParams({
        nbs,
        data
    });

    return requisicao(

        `/dados-abertos/nbs?${parametros}`,

        {
            signal
        }

    );

}

// =========================================
// SITUAÇÕES TRIBUTÁRIAS — CST IBS E CBS
// =========================================

export async function consultarSituacoesTributarias(
    data,
    signal
) {

    const parametros = new URLSearchParams({
        data
    });

    const dados = await requisicao(

        `/dados-abertos/situacoes-tributarias/cbs-ibs?${parametros}`,

        {
            signal
        }

    );

    if (!Array.isArray(dados)) {

        throw new Error(
            "Resposta inválida na consulta de situações tributárias."
        );

    }

    return dados.filter(item =>

        /^\d{3}$/.test(item?.codigo) &&

        typeof item.descricao === "string"

    );

}

// =========================================
// CLASSIFICAÇÕES TRIBUTÁRIAS — IBS E CBS
// =========================================

export async function consultarClassificacoesTributarias(
    cst,
    data,
    signal
) {

    if (!/^\d{3}$/.test(cst)) {

        throw new Error(
            "Informe um CST válido."
        );

    }

    const parametros = new URLSearchParams({
        data
    });

    const dados = await requisicao(

        `/dados-abertos/classificacoes-tributarias/cbs-ibs/${encodeURIComponent(cst)}?${parametros}`,

        {
            signal
        }

    );

    if (!Array.isArray(dados)) {

        throw new Error(
            "Resposta inválida na consulta de classificações tributárias."
        );

    }

    return dados.filter(item =>

        /^\d{6}$/.test(item?.codigo) &&

        item.codigo.startsWith(cst) &&

        typeof item.descricao === "string"

    );

}

// =========================================
// SITUAÇÕES TRIBUTÁRIAS DO IMPOSTO SELETIVO
// =========================================

export async function consultarSituacoesIS(
    data,
    signal
) {

    const parametros = new URLSearchParams({
        data
    });

    const dados = await requisicao(

        `/dados-abertos/situacoes-tributarias/imposto-seletivo?${parametros}`,

        {
            signal
        }

    );

    if (!Array.isArray(dados)) {

        throw new Error(
            "Resposta inválida na consulta de CST do IS."
        );

    }

    return dados.filter(item =>

        typeof item?.codigo === "string" &&

        /^\d{3}$/.test(item.codigo) &&

        typeof item.descricao === "string"

    );

}

// =========================================
// CLASSIFICAÇÕES TRIBUTÁRIAS DO IS
// =========================================

export async function consultarClassificacoesIS(
    cst,
    data,
    signal
) {

    if (!/^\d{3}$/.test(cst)) {

        throw new Error(
            "Informe um CST válido para o IS."
        );

    }

    const parametros = new URLSearchParams({
        data
    });

    const dados = await requisicao(

        `/dados-abertos/classificacoes-tributarias/imposto-seletivo/${encodeURIComponent(cst)}?${parametros}`,

        {
            signal
        }

    );

    if (!Array.isArray(dados)) {

        throw new Error(
            "Resposta inválida na consulta de classificações do IS."
        );

    }

    return dados.filter(item =>

        typeof item?.codigo === "string" &&

        /^\d{6}$/.test(item.codigo) &&

        item.codigo.startsWith(cst) &&

        typeof item.descricao === "string"

    );

}

// =========================================
// CALCULAR TRIBUTOS — IBS, CBS E IS
// =========================================

export function calcularTributos(
    body,
    signal
) {

    // =====================================
    // VALIDAR ITENS DA OPERAÇÃO
    // =====================================

    if (
        !Array.isArray(body?.itens) ||
        !body.itens.length
    ) {

        throw new Error(
            "Informe pelo menos um item."
        );

    }

    // =====================================
    // VALIDAR NCM E NBS
    // =====================================

    for (const item of body.itens) {

        if (
            !item ||
            Boolean(item.ncm) === Boolean(item.nbs)
        ) {

            throw new Error(
                "Informe somente NCM ou NBS por item."
            );

        }

    }

    // =====================================
    // ENVIAR REQUISIÇÃO À RECEITA FEDERAL
    // =====================================

    return requisicao(

        "/regime-geral",

        {
            body,

            signal
        }

    );

}