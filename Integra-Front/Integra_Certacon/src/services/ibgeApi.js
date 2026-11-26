const cache = new Map();
export async function listarMunicipios(uf, signal) {
    if (!/^[A-Z]{2}$/.test(uf)) throw new Error('UF inválida.');
    if (cache.has(uf)) return cache.get(uf);
    const controller = new AbortController();
    const cancelar = () => controller.abort();
    signal?.addEventListener('abort', cancelar, {once:true});
    if (signal?.aborted) cancelar();
    const timer = setTimeout(cancelar, 15000);
    try {
        const resposta = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`, {signal:controller.signal, credentials:'omit', redirect:'error', headers:{Accept:'application/json'}});
        if (!resposta.ok) throw new Error(`IBGE: HTTP ${resposta.status}`);
        const dados = await resposta.json();
        if (!Array.isArray(dados) || !dados.length || dados.some(m=>!/^\d{7}$/.test(String(m.id)) || typeof m.nome!=='string')) throw new Error('Resposta inválida do IBGE.');
        const lista = dados.map(({id,nome})=>({id,nome})).sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
        cache.set(uf,lista);
        return lista;
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', cancelar);
    }
}
