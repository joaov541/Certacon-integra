import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    Calculator,
    Landmark,
    Info,
    Search,
    FileText,
    Plus,
    Trash2,
    ChevronDown
} from "lucide-react";

import {
    calcularTributos,
    consultarNcm,
    consultarNbs,
    consultarSituacoesTributarias,
    consultarClassificacoesTributarias,
    consultarSituacoesIS,
    consultarClassificacoesIS
} from "../../services/receitaFederalApi";

import {
    listarMunicipios
} from "../../services/ibgeApi";

import "./CalculadoraReceita.css";

// =========================================
// CONSTANTES
// =========================================

const EXEMPLO = {
    tipo: "mercadoria",
    nbs: "",
    data: "2026-01-01",
    uf: "RS",
    municipio: "4314902",
    ncm: "84253110",
    cst: "000",
    classificacao: "000001",
    base: "10000",
    quantidade: "1",
    unidade: "UN",
    cbs: "",
    ibsEstadual: "",
    ibsMunicipal: "",
    cstIS: "",
    classificacaoIS: "",
    adValorem: "",
    adRem: ""
};

const EXEMPLO_SERVICO = {
    ...EXEMPLO,
    tipo: "servico",
    uf: "SP",
    municipio: "3548807",
    ncm: "",
    nbs: "122011200"
};

// Cenário fictício validado no ambiente piloto.
const EXEMPLO_IS = {
    ...EXEMPLO,
    data: "2027-01-01",
    uf: "SP",
    municipio: "3548807",
    ncm: "24021000",
    base: "1000",
    unidade: "VN",
    cbs: "8.8",
    ibsEstadual: "0.05",
    ibsMunicipal: "0.05",
    cstIS: "000",
    classificacaoIS: "000001",
    adValorem: "13",
    adRem: "21.3"
};

function lerAliquota(valor, nome, limite = 100) {
    if (!/^\d+(?:\.\d{1,6})?$/.test(valor) ||
        !Number.isFinite(Number(valor)) || Number(valor) > limite) {
        throw new Error(`Informe ${nome} entre 0 e ${limite}, com até seis casas decimais.`);
    }
    return Number(valor);
}

const UFS = [
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO"
];

// =========================================
// FUNÇÕES AUXILIARES
// =========================================

function moeda(valor) {

    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

}

function percentual(valor) {

    return Number(valor).toLocaleString("pt-BR", {
        maximumFractionDigits: 6
    }) + "%";

}

function numero(valor, nome) {

    if (
        valor == null ||
        valor === "" ||
        !Number.isFinite(Number(valor))
    ) {

        throw new Error(
            `Resposta sem valor válido para ${nome}.`
        );

    }

    return Number(valor);

}

function useConsultaFiscal(chave, consultar) {
    const [estado, setEstado] = useState({ chave: "", lista: [], erro: "", pronto: false });
    const [tentativa, setTentativa] = useState(0);
    const consultaRef = useRef(consultar);
    useEffect(() => {
        consultaRef.current = consultar;
    }, [consultar]);

    useEffect(() => {
        if (!chave) return;

        const controller = new AbortController();
        let ativo = true;
        const timer = setTimeout(() => controller.abort(), 20000);

        setEstado({ chave, lista: [], erro: "", pronto: false });

        async function carregar() {
            try {
                const lista = await consultaRef.current(controller.signal);
                if (controller.signal.aborted) {
                    throw new DOMException("Tempo excedido", "AbortError");
                }
                if (ativo) setEstado({ chave, lista, erro: "", pronto: true });
            } catch (error) {
                if (ativo) setEstado({
                    chave,
                    lista: [],
                    pronto: false,
                    erro: error.name === "AbortError"
                        ? "Tempo de resposta excedido."
                        : error.message || "Falha na consulta."
                });
            } finally {
                clearTimeout(timer);
            }
        }

        carregar();
        return () => {
            ativo = false;
            clearTimeout(timer);
            controller.abort();
        };
    }, [chave, tentativa]);

    const atual = estado.chave === chave && Boolean(chave);
    return {
        lista: atual && estado.pronto ? estado.lista : [],
        erro: atual ? estado.erro : "",
        pronto: atual && estado.pronto,
        carregando: Boolean(chave) && (!atual || (!estado.pronto && !estado.erro)),
        tentar: () => {
            setEstado({ chave, lista: [], erro: "", pronto: false });
            setTentativa(v => v + 1);
        }
    };
}

function classificacaoCompativel(item, tipo) {
    const codigo = tipo === "servico" ? "NBS" : "NCM";
    const documento = tipo === "servico" ? 91 : 55;
    const nomenclatura = String(item.nomenclatura || "").trim().toUpperCase();
    return [codigo, "NBS OU NCM", "NCM OU NBS"].includes(nomenclatura) &&
        Array.isArray(item.tiposDfeClassificacao) &&
        item.tiposDfeClassificacao.some(doc => Number(doc.tipo) === documento);
}

// =========================================
// ITENS E RESULTADOS DA OPERAÇÃO
// =========================================

function criarItem(exemplo = {}) {
    return {
        ncm: exemplo.ncm ?? "",
        nbs: exemplo.nbs ?? "",
        cst: exemplo.cst ?? "000",
        classificacao: exemplo.classificacao ?? "",
        base: exemplo.base ?? "",
        quantidade: exemplo.quantidade ?? "1",
        unidade: exemplo.unidade ?? "UN",
        cbs: exemplo.cbs ?? "",
        ibsEstadual: exemplo.ibsEstadual ?? "",
        ibsMunicipal: exemplo.ibsMunicipal ?? "",
        cstIS: exemplo.cstIS ?? "",
        classificacaoIS: exemplo.classificacaoIS ?? "",
        adValorem: exemplo.adValorem ?? "",
        adRem: exemplo.adRem ?? "",
        id: crypto.randomUUID(),
        info: null
    };
}

function compativelIS(item, tipo) {
    return [tipo === "servico" ? "NBS" : "NCM", "NBS OU NCM", "NCM OU NBS"]
        .includes(String(item.nomenclatura || "").trim().toUpperCase());
}

function lerResultado(dados, enviados) {
    const objetos = dados?.objetos;
    const totais = dados?.total?.tribCalc;
    const total = totais?.IBSCBSTot;

    if (!Array.isArray(objetos) || objetos.length !== enviados.length || !total) {
        throw new Error("Resposta incompleta da operação tributária.");
    }

    const centavos = (valor, nome) => Math.round(numero(valor, nome) * 100);
    const soma = (...valores) => valores.reduce((a, b) => a + Math.round(b * 100), 0) / 100;

    const itens = enviados.map(enviado => {
        const encontrados = objetos.filter(obj => Number(obj.nObj) === enviado.numero);
        if (encontrados.length !== 1) {
            throw new Error(`Resultado ausente ou duplicado para o item ${enviado.numero}.`);
        }
        const objeto = encontrados[0];
        const grupo = objeto.tribCalc?.IBSCBS;
        const g = grupo?.gIBSCBS;
        const is = objeto.tribCalc?.IS;
        if (!g || Boolean(is) !== Boolean(enviado.impostoSeletivo)) {
            throw new Error(`Resposta tributária inesperada para o item ${enviado.numero}.`);
        }
        const tributos = [
            { nome: "CBS", valor: numero(g.gCBS?.vCBS, "CBS"), detalhe: percentual(numero(g.gCBS?.pCBS, "alíquota CBS")) },
            { nome: "IBS estadual", valor: numero(g.gIBSUF?.vIBSUF, "IBS estadual"), detalhe: percentual(numero(g.gIBSUF?.pIBSUF, "alíquota estadual")) },
            { nome: "IBS municipal", valor: numero(g.gIBSMun?.vIBSMun, "IBS municipal"), detalhe: percentual(numero(g.gIBSMun?.pIBSMun, "alíquota municipal")) }
        ];
        if (centavos(g.vIBS, "IBS") !== Math.round(soma(tributos[1].valor, tributos[2].valor) * 100)) {
            throw new Error(`IBS inconsistente no item ${enviado.numero}.`);
        }
        if (is) {
            tributos.push({
                nome: "Imposto Seletivo",
                valor: numero(is.vIS, "IS"),
                detalhe: [
                    is.pIS != null ? `Ad valorem: ${percentual(numero(is.pIS, "Ad valorem"))}` : "",
                    is.adRemIS != null ? `Ad rem: ${numero(is.adRemIS, "Ad rem").toLocaleString("pt-BR")} por ${is.uTrib || "unidade"}` : ""
                ].filter(Boolean).join(" · ")
            });
        }
        return {
            numero: enviado.numero,
            codigo: enviado.ncm || enviado.nbs,
            base: numero(g.vBC, "base IBS/CBS"),
            baseIS: is ? numero(is.vBCIS, "base IS") : null,
            tributos,
            total: soma(...tributos.map(t => t.valor)),
            memoria: { ...grupo.memoriaCalculo, is: is?.memoriaCalculo },
            simulado: objeto.calculoSimulado
        };
    });

    const tributos = [
        { nome: "CBS", valor: numero(total.gCBS?.vCBS, "CBS total") },
        { nome: "IBS estadual", valor: numero(total.gIBS?.gIBSUF?.vIBSUF, "IBS estadual total") },
        { nome: "IBS municipal", valor: numero(total.gIBS?.gIBSMun?.vIBSMun, "IBS municipal total") }
    ];
    if (enviados.some(i => i.impostoSeletivo)) {
        tributos.push({ nome: "Imposto Seletivo", valor: numero(totais.ISTot?.vIS, "IS total") });
    } else if (totais.ISTot && numero(totais.ISTot.vIS, "IS total") !== 0) {
        throw new Error("A API retornou IS não previsto na operação.");
    }
    const base = numero(total.vBCIBSCBS, "base consolidada");
    const ibsTotal = numero(total.gIBS?.vIBS, "IBS total");
    const totalTributos = soma(tributos[0].valor, ibsTotal, tributos[3]?.valor ?? 0);
    const divergencia = Math.round(soma(tributos[1].valor, tributos[2].valor) * 100) !== Math.round(ibsTotal * 100)
        || Math.round(soma(...itens.map(i => i.total)) * 100) !== Math.round(totalTributos * 100)
        || Math.round(soma(...itens.map(i => i.base)) * 100) !== Math.round(base * 100)
        || tributos.some(t => Math.round(soma(...itens.map(i => i.tributos.find(v => v.nome === t.nome)?.valor ?? 0)) * 100) !== Math.round(t.valor * 100));
    return { itens, tributos, base, total: totalTributos, divergencia };
}

function Campo({ titulo, valor, alterar, tipo = "text", ...props }) {
    return (
        <label className="st-campo">
            <span>{titulo}</span>
            <input type={tipo} value={valor} onChange={e => alterar(e.target.value)} {...props} />
        </label>
    );
}

function Seletor({ titulo, valor, alterar, consulta, opcoes = consulta.lista, largo = false }) {
    return (
        <div className={largo ? "rf-largo" : ""}>
            <label className="st-campo">
                <span>{titulo}</span>
                <select required value={opcoes.some(i => String(i.codigo) === valor) ? valor : ""}
                    disabled={!consulta.pronto} onChange={e => alterar(e.target.value)}>
                    <option value="">{consulta.carregando ? "Carregando..." : consulta.erro ? "Consulta indisponível" : "Selecione"}</option>
                    {opcoes.map(i => <option key={i.codigo} value={i.codigo}>{i.codigo} — {i.descricao}</option>)}
                </select>
            </label>
            {consulta.pronto && !opcoes.length && <p role="status">Nenhuma opção compatível.</p>}
            {consulta.erro && (
                <div className="st-erro" role="alert">
                    <p>{consulta.erro}</p>
                    <button type="button" className="st-botao-secundario" onClick={consulta.tentar}>Tentar novamente</button>
                </div>
            )}
        </div>
    );
}

function EditorItem({ item, indice, geral, situacoes, situacoesIS, alterar, consultar, remover, podeRemover, ocupado }) {
    const servico = geral.tipo === "servico";
    const codigo = servico ? "nbs" : "ncm";
    const nome = codigo.toUpperCase();
    const futuro = geral.data >= "2027-01-01";
    const temIS = futuro && item.info?.tributadoPeloImpostoSeletivo === true;
    const cstValido = situacoes.pronto && situacoes.lista.some(i => i.codigo === item.cst);
    const classificacoes = useConsultaFiscal(cstValido ? `${geral.data}:${item.cst}` : "",
        signal => consultarClassificacoesTributarias(item.cst, geral.data, signal));
    const opcoes = classificacoes.lista.filter(i => classificacaoCompativel(i, geral.tipo));
    const selecionada = opcoes.find(i => i.codigo === item.classificacao);
    const classificacoesIS = useConsultaFiscal(temIS && item.cstIS === "000" && situacoesIS.pronto && situacoesIS.lista.some(i => i.codigo === "000") ? `${geral.data}:000` : "",
        signal => consultarClassificacoesIS("000", geral.data, signal));
    const opcoesIS = classificacoesIS.lista.filter(i => compativelIS(i, geral.tipo));
    const campo = (chave, valor) => alterar(item.id, chave, valor);
    const [expandido, setExpandido] = useState(indice === 0);
    return (
        <section className="rf-item">
            <div className="rf-item-cabecalho">
                <button type="button" className="rf-item-toggle" aria-expanded={expandido} aria-controls={`rf-item-${item.id}`} onClick={() => setExpandido(v => !v)}>
                    <span className="rf-item-icone"><FileText size={20}/></span>
                    <span className="rf-item-identidade"><strong>Item {indice + 1}</strong><small>{nome}: {item[codigo] || "não informado"}</small></span>
                    <span className="rf-item-valor">{item.base && Number.isFinite(Number(item.base)) ? moeda(item.base) : "—"}</span>
                    <ChevronDown size={18} className={expandido ? "rf-chevron aberto" : "rf-chevron"}/>
                </button>
                <button type="button" className="st-botao-icone st-botao-perigo" disabled={!podeRemover || ocupado} onClick={() => remover(item.id)} aria-label={`Remover item ${indice + 1}`}><Trash2 size={17}/></button>
            </div>
            <div id={`rf-item-${item.id}`} className="rf-campos rf-item-corpo" hidden={!expandido}>
                <Campo titulo={nome} valor={item[codigo]} alterar={v => campo(codigo, v.replace(/\D/g, ""))} required inputMode="numeric" pattern={servico ? "[0-9]{9}" : "[0-9]{8}"} maxLength={servico ? 9 : 8} />
                <button type="button" className="st-botao-secundario rf-consultar" disabled={ocupado} onClick={() => consultar(item.id)}><Search size={16}/> Consultar {nome}</button>
                {item.info && <div className="rf-largo rf-ncm"><strong>{item.info.subitem || item.info.item || item.info.posicao || "Código encontrado"}</strong><p>Imposto Seletivo: {item.info.tributadoPeloImpostoSeletivo === true ? "Sim" : item.info.tributadoPeloImpostoSeletivo === false ? "Não" : "Não informado"}</p></div>}
                <Seletor largo titulo="Situação tributária (CST)" valor={item.cst} alterar={v => campo("cst", v)} consulta={situacoes}/>
                <Seletor largo titulo="Classificação tributária" valor={item.classificacao} alterar={v => campo("classificacao", v)} consulta={classificacoes} opcoes={opcoes}/>
                {selecionada && <div className="rf-largo rf-ncm"><strong>{selecionada.descricao}</strong><p>Tratamento: {selecionada.descricaoTratamentoTributario || "Não informado"}</p><p>Tipo de alíquota: {selecionada.tipoAliquota || "Não informado"}</p><p>Confira o enquadramento fiscal. Compatibilidade documental não garante aplicação legal.</p></div>}
                <Campo titulo={temIS ? "Base de cálculo do IS (R$)" : "Base de cálculo (R$)"} tipo="number" min="0.01" step="0.01" required valor={item.base} alterar={v => campo("base", v)}/>
                <Campo titulo="Quantidade" tipo="number" min="0.0001" step="any" required valor={item.quantidade} alterar={v => campo("quantidade", v)}/>
                <Campo titulo="Unidade" required maxLength={6} valor={item.unidade} alterar={v => campo("unidade", v.toUpperCase())}/>
                {futuro && <>
                    <div className="rf-largo rf-ncm"><strong>Alíquotas nominais — simulação</strong><p>Informe valores hipotéticos. Não são alíquotas legais definitivas.</p></div>
                    {[["cbs", "CBS (%)"], ["ibsEstadual", "IBS estadual (%)"], ["ibsMunicipal", "IBS municipal (%)"]].map(([chave, titulo]) => <Campo key={chave} titulo={titulo} tipo="number" min="0" max="100" step="any" required valor={item[chave]} alterar={v => campo(chave, v)}/>)}
                </>}
                {temIS && <>
                    <div className="rf-largo rf-ncm"><strong>Imposto Seletivo</strong><p>Somente CST 000 com cálculo. A base de IBS/CBS será derivada pela API neste cenário. Unidade indicada: {item.info.unidade || "não informada"}.</p></div>
                    <Seletor largo titulo="CST do IS" valor={item.cstIS} alterar={v => campo("cstIS", v)} consulta={situacoesIS} opcoes={situacoesIS.lista.filter(i => i.codigo === "000")}/>
                    <Seletor largo titulo="Classificação do IS" valor={item.classificacaoIS} alterar={v => campo("classificacaoIS", v)} consulta={classificacoesIS} opcoes={opcoesIS}/>
                    {item.info.temAliquotaAdValorem === true && <Campo titulo="Ad Valorem (%)" tipo="number" min="0" max="100" step="any" required valor={item.adValorem} alterar={v => campo("adValorem", v)}/>}
                    {item.info.temAliquotaAdRem === true && <Campo titulo="Ad Rem (por unidade)" tipo="number" min="0" step="any" required valor={item.adRem} alterar={v => campo("adRem", v)}/>}
                </>}
            </div>
        </section>
    );
}

function CardsTributos({ tributos }) {
    return <div className="st-resultados-grid">{tributos.map(t => (
        <div className="st-tributo" key={t.nome}>
            <p>{t.nome}{t.detalhe ? ` · ${t.detalhe}` : ""}</p>
            <strong>{moeda(t.valor)}</strong>
        </div>
    ))}</div>;
}

// =========================================
// COMPONENTE PRINCIPAL
// =========================================

export default function CalculadoraReceita({ token }) {
    const [geral, setGeral] = useState({ data: EXEMPLO.data, uf: EXEMPLO.uf, municipio: EXEMPLO.municipio, tipo: EXEMPLO.tipo });
    const [itens, setItens] = useState(() => [criarItem(EXEMPLO)]);
    const [resultado, setResultado] = useState(null);
    const [erro, setErro] = useState("");
    const [ocupado, setOcupado] = useState("");
    const operacao = useRef(null);
    const dataValida = /^202[67]-\d{2}-\d{2}$/.test(geral.data) && geral.data >= "2026-01-01" && geral.data <= "2027-12-31";
    const futuro = dataValida && geral.data >= "2027-01-01";
    const municipios = useConsultaFiscal(geral.uf, signal => listarMunicipios(geral.uf, signal));
    const situacoes = useConsultaFiscal(dataValida ? geral.data : "", signal => consultarSituacoesTributarias(geral.data, signal));
    const situacoesIS = useConsultaFiscal(futuro && itens.some(i => i.info?.tributadoPeloImpostoSeletivo === true) ? geral.data : "", signal => consultarSituacoesIS(geral.data, signal));
    const municipioValido = municipios.pronto && municipios.lista.some(m => String(m.id) === geral.municipio);

    useEffect(() => () => {
        operacao.current?.abort();
        operacao.current = null;
    }, []);

    function limparResultado() {
        setResultado(null);
        setErro("");
    }

    function alterarGeral(campo, valor) {
        if (operacao.current || geral[campo] === valor) return;
        setGeral(a => ({ ...a, [campo]: valor, ...(campo === "uf" ? { municipio: "" } : {}) }));
        if (campo === "tipo" || campo === "data") {
            setItens(lista => lista.map(i => ({
                ...i,
                ...(campo === "tipo" ? { ncm: "", nbs: "", unidade: "UN" } : {}),
                ...(campo === "data" ? { cst: "" } : {}),
                classificacao: "", info: null, cstIS: "", classificacaoIS: "", adValorem: "", adRem: ""
            })));
        }
        limparResultado();
    }

    function alterarItem(id, campo, valor) {
        if (operacao.current) return;
        setItens(lista => lista.map(i => i.id !== id ? i : ({
            ...i, [campo]: valor,
            ...(campo === "cst" ? { classificacao: "" } : {}),
            ...(campo === "cstIS" ? { classificacaoIS: "" } : {}),
            ...(["ncm", "nbs"].includes(campo) ? { info: null, cstIS: "", classificacaoIS: "", adValorem: "", adRem: "" } : {})
        })));
        limparResultado();
    }

    async function executar(tipo, tarefa) {
        if (operacao.current || !token || localStorage.getItem("token") !== token) return;
        const controller = new AbortController();
        operacao.current = controller;
        setOcupado(tipo);
        setErro("");
        const timer = setTimeout(() => controller.abort(), 90000);
        const atual = () => operacao.current === controller && localStorage.getItem("token") === token;
        try {
            const retorno = await tarefa(controller.signal);
            if (!atual()) return;
            if (controller.signal.aborted) throw new DOMException("Tempo excedido", "AbortError");
            retorno?.();
        } catch (e) {
            if (atual()) setErro(e.name === "AbortError" ? "Tempo de resposta excedido. Tente novamente." : e.message || "Falha na consulta.");
        } finally {
            clearTimeout(timer);
            if (operacao.current === controller) {
                operacao.current = null;
                if (localStorage.getItem("token") === token) setOcupado("");
            }
        }
    }

    function consultar(id) {
        const item = itens.find(i => i.id === id);
        const servico = geral.tipo === "servico";
        if (!item || !dataValida || !(servico ? /^\d{9}$/.test(item.nbs) : /^\d{8}$/.test(item.ncm))) {
            setErro("Informe uma data válida e um código NCM/NBS completo.");
            return;
        }
        executar("consulta", async signal => {
            const info = await (servico ? consultarNbs(item.nbs, geral.data, signal) : consultarNcm(item.ncm, geral.data, signal));
            if (typeof info?.tributadoPeloImpostoSeletivo !== "boolean") throw new Error("A incidência do IS não foi informada.");
            return () => {
                setResultado(null);
                setItens(lista => lista.map(i => i.id !== id ? i : ({
                    ...i, info,
                    ...(futuro && info.tributadoPeloImpostoSeletivo ? {
                        cstIS: i.cstIS || "000",
                        unidade: info.unidade || i.unidade,
                        adValorem: i.adValorem || (info.aliquotaAdValorem == null ? "" : String(info.aliquotaAdValorem)),
                        adRem: i.adRem || (info.aliquotaAdRem == null ? "" : String(info.aliquotaAdRem))
                    } : { cstIS: "", classificacaoIS: "", adValorem: "", adRem: "" })
                })));
            };
        });
    }

    function carregarExemplo(tipo) {
        if (operacao.current) return;
        const exemplo = tipo === "servico" ? EXEMPLO_SERVICO : tipo === "is" || tipo === "multiplo" ? EXEMPLO_IS : EXEMPLO;
        setGeral({ data: exemplo.data, uf: exemplo.uf, municipio: exemplo.municipio, tipo: exemplo.tipo });
        setItens(tipo === "multiplo" ? [
            criarItem({ ...EXEMPLO, cbs: "8.8", ibsEstadual: "0.05", ibsMunicipal: "0.05" }),
            criarItem(EXEMPLO_IS)
        ] : [criarItem(exemplo)]);
        limparResultado();
    }

    function calcular(event) {
        event.preventDefault();
        if (operacao.current) return;
        limparResultado();
        if (!dataValida || !municipioValido || !situacoes.pronto) {
            setErro("Confira a data, o município e o carregamento das situações tributárias.");
            return;
        }
        executar("calculo", async signal => {
            const servico = geral.tipo === "servico";
            const preparados = [];
            const cache = new Map();
            async function obter(chave, tarefa) {
                if (!cache.has(chave)) cache.set(chave, await tarefa());
                return cache.get(chave);
            }
            for (let index = 0; index < itens.length; index++) {
                const i = itens[index];
                try {
                    const codigo = servico ? i.nbs : i.ncm;
                    if (!(servico ? /^\d{9}$/.test(codigo) : /^\d{8}$/.test(codigo))) throw new Error("Código NCM/NBS inválido.");
                    if (!situacoes.lista.some(s => s.codigo === i.cst)) throw new Error("Selecione um CST válido.");
                    const classes = await obter(`cbs:${i.cst}`, () => consultarClassificacoesTributarias(i.cst, geral.data, signal));
                    if (!classes.some(c => c.codigo === i.classificacao && classificacaoCompativel(c, geral.tipo))) throw new Error("Classificação incompatível com CST, data ou documento.");
                    const base = Number(i.base);
                    const quantidade = Number(i.quantidade);
                    const unidade = i.unidade.trim().toUpperCase();
                    if (!/^\d+(?:\.\d{1,2})?$/.test(i.base) || !Number.isFinite(base) || base <= 0 || !Number.isFinite(quantidade) || quantidade < 0.0001 || !unidade || unidade.length > 6) throw new Error("Confira base, quantidade e unidade.");
                    if (futuro && !i.info) throw new Error("Consulte o código antes de calcular em 2027.");
                    const info = await obter(`codigo:${codigo}`, () => servico ? consultarNbs(codigo, geral.data, signal) : consultarNcm(codigo, geral.data, signal));
                    if (typeof info?.tributadoPeloImpostoSeletivo !== "boolean") throw new Error("Incidência do IS não confirmada.");
                    const temIS = info.tributadoPeloImpostoSeletivo;
                    if (temIS && !futuro) throw new Error("IS não habilitado nesta versão para 2026.");
                    if (futuro && ["tributadoPeloImpostoSeletivo", "unidade", "temAliquotaAdValorem", "temAliquotaAdRem"].some(k => info[k] !== i.info[k])) throw new Error("Dados do código mudaram; consulte novamente.");
                    const aliquotasNominais = futuro ? {
                        cbs: lerAliquota(i.cbs, "CBS"),
                        ibsEstadual: lerAliquota(i.ibsEstadual, "IBS estadual"),
                        ibsMunicipal: lerAliquota(i.ibsMunicipal, "IBS municipal")
                    } : null;
                    let impostoSeletivo;
                    if (temIS) {
                        if (i.cstIS !== "000" || !situacoesIS.pronto || !situacoesIS.lista.some(s => s.codigo === i.cstIS)) throw new Error("Selecione o CST 000 do IS.");
                        const classesIS = await obter("is:000", () => consultarClassificacoesIS("000", geral.data, signal));
                        if (!classesIS.some(c => c.codigo === i.classificacaoIS && compativelIS(c, geral.tipo))) throw new Error("Classificação do IS inválida.");
                        if (info.unidade && unidade !== info.unidade) throw new Error(`Utilize a unidade tributável ${info.unidade}.`);
                        aliquotasNominais.impostoSeletivo = {
                            adValorem: info.temAliquotaAdValorem === true ? lerAliquota(i.adValorem, "Ad valorem") : 0,
                            adRem: info.temAliquotaAdRem === true ? lerAliquota(i.adRem, "Ad rem", 999999999) : 0
                        };
                        impostoSeletivo = { cst: i.cstIS, cClassTrib: i.classificacaoIS, baseCalculo: base, quantidade, unidade, impostoInformado: 0 };
                    }
                    preparados.push({
                        numero: index + 1,
                        ...(servico ? { nbs: codigo } : { ncm: codigo }),
                        cst: i.cst, cClassTrib: i.classificacao, quantidade, unidade,
                        ...(impostoSeletivo ? { impostoSeletivo } : { baseCalculo: base }),
                        ...(aliquotasNominais ? { aliquotasNominais } : {})
                    });
                } catch (e) {
                    if (e.name === "AbortError") throw e;
                    throw new Error(`Item ${index + 1}: ${e.message}`);
                }
            }
            if (signal.aborted || localStorage.getItem("token") !== token) throw new DOMException("Cancelado", "AbortError");
            const resposta = await calcularTributos({
                id: crypto.randomUUID().replaceAll("-", ""),
                versao: "0.0.1", dhFatoGerador: geral.data + "T09:50:05-03:00",
                municipio: Number(geral.municipio), uf: geral.uf, tpDoc: servico ? 91 : 55,
                itens: preparados
            }, signal);
            const normalizado = lerResultado(resposta, preparados);
            return () => setResultado(normalizado);
        });
    }

    return (
        <div className="rf-calculadora">
            <div className="st-aviso"><Info size={21}/><div><strong>Receita Federal — ambiente piloto</strong><p>Mercadorias (NF-e) ou serviços (NFS-e), em 2026 e 2027. IS somente em 2027, CST 000. Utilize dados fictícios; não substitui apuração oficial.</p></div></div>
            <div className="rf-grid">
                <section className="st-card">
                    <div className="st-card-titulo"><Landmark size={24}/><div><h2>Calculadora Receita Federal</h2><p>Dados gerais e itens da operação.</p></div></div>
                    <form className="st-formulario" onSubmit={calcular} onInvalidCapture={e => {
                        const painel = e.target.closest(".rf-item-corpo[hidden]");
                        if (painel) {
                            e.preventDefault();
                            const botao = painel.parentElement.querySelector(".rf-item-toggle");
                            if (botao?.getAttribute("aria-expanded") === "false") {
                                botao.setAttribute("aria-expanded", "true");
                                botao.click();
                            }
                        }
                    }}>
                        <fieldset disabled={!!ocupado} className="rf-campos">
                            <Campo titulo="Data do fato gerador" tipo="date" required min="2026-01-01" max="2027-12-31" valor={geral.data} alterar={v => alterarGeral("data", v)}/>
                            <label className="st-campo"><span>UF</span><select value={geral.uf} onChange={e => alterarGeral("uf", e.target.value)}>{UFS.map(uf => <option key={uf}>{uf}</option>)}</select></label>
                            <label className="st-campo"><span>Município</span><select required disabled={!municipios.pronto} value={municipioValido ? geral.municipio : ""} onChange={e => alterarGeral("municipio", e.target.value)}><option value="">{municipios.carregando ? "Carregando municípios..." : "Selecione"}</option>{municipios.lista.map(m => <option key={m.id} value={String(m.id)}>{m.nome}</option>)}</select>{municipioValido && <small>Código IBGE: {geral.municipio}</small>}</label>
                            {municipios.erro && <div className="rf-largo st-erro" role="alert"><p>{municipios.erro}</p><button type="button" className="st-botao-secundario" onClick={municipios.tentar}>Tentar novamente</button></div>}
                            <label className="st-campo rf-largo"><span>Tipo de operação</span><select value={geral.tipo} onChange={e => alterarGeral("tipo", e.target.value)}><option value="mercadoria">Mercadoria — NF-e (55)</option><option value="servico">Serviço — NFS-e (91)</option></select></label>
                            <div className="rf-largo st-formulario rf-lista-itens">
                                <div className="rf-lista-titulo"><h3>Itens da operação</h3><span>{itens.length} {itens.length === 1 ? "item" : "itens"}</span></div>
                                {itens.map((item, indice) => <EditorItem key={item.id} item={item} indice={indice} geral={geral} situacoes={situacoes} situacoesIS={situacoesIS} alterar={alterarItem} consultar={consultar} ocupado={!!ocupado} podeRemover={itens.length > 1} remover={id => { setItens(lista => lista.filter(i => i.id !== id)); limparResultado(); }}/>) }
                                <button type="button" className="st-botao-secundario rf-adicionar" disabled={itens.length >= 20} onClick={() => { setItens(lista => [...lista, criarItem()]); limparResultado(); }}><Plus size={18}/> Adicionar item</button>
                                <small>Limite local desta versão: 20 itens por operação.</small>
                            </div>
                        </fieldset>
                        {erro && <div className="st-erro" role="alert">{erro}</div>}
                        {ocupado && <p role="status">{ocupado === "calculo" ? "Validando itens e calculando tributos..." : "Consultando código..."}</p>}
                        <button type="submit" className="st-botao-calcular" disabled={!!ocupado || !municipioValido || !dataValida || !situacoes.pronto}><Calculator size={19}/> {ocupado === "calculo" ? "Calculando..." : "Calcular tributos"}</button>
                        <div className="rf-exemplos"><h3>Exemplos de teste</h3><div className="rf-exemplos-grid">
                        {[["mercadoria", "Carregar exemplo de mercadoria"], ["servico", "Carregar exemplo de serviço"], ["is", "Carregar exemplo de IS — 2027"], ["multiplo", "Carregar exemplo de múltiplos itens — 2027"]].map(([tipo, texto]) => <button key={tipo} type="button" disabled={!!ocupado} className="st-botao-secundario" onClick={() => carregarExemplo(tipo)}>{texto}</button>)}
                        </div></div>
                        <small>O exemplo de educação utiliza tributação integral apenas para teste técnico. Confira o enquadramento real.</small>
                    </form>
                </section>
                <section className="st-card rf-painel-resultado" aria-live="polite">
                    <div className="st-card-titulo"><FileText size={24}/><div><h2>Resultado tributário</h2><p>Valores retornados pela API externa.</p></div></div>
                    {!resultado ? <div className="st-resultado-vazio"><Calculator size={48}/><h3>{ocupado === "calculo" ? "Calculando tributos" : "Aguardando cálculo"}</h3><p>Preencha os itens e clique em calcular.</p></div> : <>
                        <div className="st-resultado-base"><span>Base consolidada de IBS e CBS</span><strong>{moeda(resultado.base)}</strong></div>
                        <CardsTributos tributos={resultado.tributos}/>
                        <div className="st-total"><div className="st-total-principal"><span>Total IS + IBS + CBS</span><strong>{moeda(resultado.total)}</strong></div></div>
                        <p className="st-resultado-aviso">{geral.data >= "2027-01-01" || resultado.itens.some(i => i.simulado === true) ? "Simulação com alíquotas informadas ou dados simulados." : resultado.itens.every(i => i.simulado === false) ? "A API não sinalizou cálculo simulado." : "Indicador de simulação não informado."} Ambiente piloto, sem validade fiscal.</p>
                        {resultado.divergencia && <div className="st-erro" role="alert">Os totais da API divergem da soma dos itens. Confira o retorno antes de utilizar os valores.</div>}
                        <div className="rf-memoria"><h3>Resultados por item</h3>{resultado.itens.map(i => <details key={i.numero} open={resultado.itens.length === 1} className="rf-ncm rf-resultado-item">
                            <summary><strong>Item {i.numero} — {i.codigo} · {moeda(i.total)}</strong></summary>
                            <p>Base IBS/CBS: {moeda(i.base)}</p>{i.baseIS !== null && <p>Base IS: {moeda(i.baseIS)}</p>}
                            <CardsTributos tributos={i.tributos}/>
                            <p>{i.simulado === true ? "Cálculo simulado" : i.simulado === false ? "Sem sinalização de simulação pela API" : "Simulação não informada"}</p>
                            <div className="rf-memoria"><h3>Memória de cálculo</h3>{[["cbs", "CBS"], ["ibsUF", "IBS estadual"], ["ibsMun", "IBS municipal"], ["is", "Imposto Seletivo"]].map(([chave, nome]) => typeof i.memoria[chave] === "string" && <div key={chave}><strong>{nome}</strong><p>{i.memoria[chave]}</p></div>)}</div>
                        </details>)}</div>
                    </>}
                </section>
            </div>
        </div>
    );
}
