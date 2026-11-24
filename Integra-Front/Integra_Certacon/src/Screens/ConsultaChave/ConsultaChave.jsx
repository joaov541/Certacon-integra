import {
    useState,
    useEffect,
    useRef
} from "react";

import { Link } from "react-router-dom";

import api from "../../services/api";

import usePermissoes from "../../hooks/usePermissoes";

import LogoNome from "../../assets/Icones/LogoNome.png";

import "./ConsultaChave.css";

// =========================================
// COMPONENTE PRINCIPAL
// =========================================

export default function ConsultaChave() {

    const { autenticado } = usePermissoes();

    const token = localStorage.getItem("token");

    // =========================================
    // ESTADOS
    // =========================================

    const [chave, setChave] = useState("");

    const [resultado, setResultado] =
        useState(null);

    const [erro, setErro] =
        useState("");

    const [carregando, setCarregando] =
        useState(false);

    const [saldo, setSaldo] =
        useState(null);

    // =========================================
    // REFERÊNCIAS
    // =========================================

    const consultaRef = useRef(null);

    const inputChaveRef = useRef(null);

    // =========================================
    // LIMPAR DADOS AO ALTERAR SESSÃO
    // =========================================

    useEffect(() => {

        setChave("");

        setResultado(null);

        setErro("");

        setSaldo(null);

        setCarregando(false);

        return () => {

            consultaRef.current?.abort();

            consultaRef.current = null;

        };

    }, [token]);

    // =========================================
    // CONSULTAR CHAVE DE ACESSO
    // =========================================

    async function consultar(event) {

        event.preventDefault();

        if (
            carregando ||
            consultaRef.current
        ) {

            return;

        }

        setResultado(null);

        setErro("");

        const chaveNormalizada = chave

            .trim()

            .toUpperCase()

            .replace(/\s/g, "");

        // =====================================
        // VALIDAR FORMATO
        //
        // 6 posições numéricas
        // 12 posições alfanuméricas
        // 26 posições numéricas
        //
        // Total: 44 posições
        // =====================================

        const formatoValido =

            /^[0-9]{6}[A-Z0-9]{12}[0-9]{26}$/

                .test(chaveNormalizada);

        if (!formatoValido) {

            setErro(

                "Informe uma chave de 44 posições no formato aceito pelo sistema."

            );

            return;

        }

        const controller =
            new AbortController();

        consultaRef.current = controller;

        setCarregando(true);

        try {

            const resposta = await fetch(

                `${api}/api/Chaves/${encodeURIComponent(chaveNormalizada)}`,

                {

                    method: "GET",

                    headers: token

                        ? {

                            Authorization: `Bearer ${token}`

                        }

                        : {},

                    cache: "no-store",

                    signal: controller.signal

                }

            );

            // Impede que uma consulta antiga
            // atualize os dados de outra sessão.

            if (

                controller.signal.aborted ||

                localStorage.getItem("token") !== token

            ) {

                return;

            }

            const texto = await resposta.text();

            let dados;

            try {

                dados = JSON.parse(texto);

            } catch {

                dados = null;

            }

            if (

                controller.signal.aborted ||

                localStorage.getItem("token") !== token

            ) {

                return;

            }

            // =================================
            // LIMITE DIÁRIO ATINGIDO
            // =================================

            if (resposta.status === 429) {

                setSaldo({

                    restante: 0,

                    ilimitado: false

                });

            }

            // =================================
            // ATUALIZAR SALDO INFORMADO PELA API
            // =================================

            if (

                typeof dados?.consultasIlimitadas === "boolean"

            ) {

                setSaldo({

                    restante:
                        dados.consultasRestantes ?? null,

                    ilimitado:
                        dados.consultasIlimitadas

                });

            }

            // =================================
            // TRATAMENTO DE ERROS
            // =================================

            if (!resposta.ok) {

                throw new Error(

                    dados?.mensagem ||

                    (

                        resposta.status === 401 ||

                        resposta.status === 403

                            ? "Sessão inválida ou acesso bloqueado. Entre novamente."

                            : resposta.status === 429

                                ? "Você atingiu o limite diário de consultas."

                                : `Não foi possível consultar a chave (${resposta.status}).`

                    )

                );

            }

            // =================================
            // VALIDAR RESPOSTA
            // =================================

            if (
                typeof dados?.valida !== "boolean"
            ) {

                throw new Error(

                    "Resposta inesperada da API."

                );

            }

            setResultado(dados);

        } catch (error) {

            if (

                error.name === "AbortError" ||

                localStorage.getItem("token") !== token

            ) {

                return;

            }

            console.error(

                "Erro ao consultar chave:",

                error

            );

            setErro(

                error.message ||

                "Falha na comunicação com a API."

            );

        } finally {

            if (consultaRef.current === controller) {

                consultaRef.current = null;

                setCarregando(false);

            }

        }

    }

    // =========================================
    // ALTERAR CHAVE
    // =========================================

    function alterarChave(event) {

        const valor = event.target.value

            .toUpperCase()

            .replace(/\s/g, "");

        setChave(valor);

        setResultado(null);

        setErro("");

    }

    // =========================================
    // LIMPAR FORMULÁRIO
    // =========================================

    function limpar() {

        if (carregando) return;

        setChave("");

        setResultado(null);

        setErro("");

        // O saldo não é apagado.
        // Continua representando a última
        // informação recebida da API.

        inputChaveRef.current?.focus();

    }

    // =========================================
    // FORMATAR MODELO DA NOTA
    // =========================================

    function formatarModelo(modelo) {

        switch (String(modelo)) {

            case "55":

                return "55 — NF-e";

            case "65":

                return "65 — NFC-e";

            default:

                return modelo || "Não informado";

        }

    }

    // =========================================
    // CAMPOS DO RESULTADO
    // =========================================

    const campos = resultado?.valida

        ? [

            [

                "UF",

                `${resultado.uf} (${resultado.codigoUf})`

            ],

            [

                "Emissão (mês/ano)",

                `${String(resultado.mes).padStart(2, "0")}/${resultado.ano}`

            ],

            [

                "CNPJ do emitente",

                resultado.cnpjFormatado ||

                resultado.cnpj

            ],

            [

                "Modelo",

                formatarModelo(resultado.modelo)

            ],

            [

                "Série",

                resultado.serie

            ],

            [

                "Número da nota",

                resultado.numero

            ],

            [

                "Dígito verificador",

                resultado.digitoVerificador

            ]

        ]

        : [];

    // =========================================
    // RENDERIZAÇÃO
    // =========================================

    return (

        <div
            className={`cc-pagina ${
                autenticado
                    ? "cc-autenticada"
                    : "cc-publica"
            }`}
        >

            {/* =================================
                CABEÇALHO PÚBLICO

                Somente visitantes visualizam
                este cabeçalho.

                Usuários autenticados utilizam
                o LayoutSistema.
            ================================= */}

            {!autenticado && (

                <header className="cc-topo">

                    <Link to="/portal">

                        <img
                            src={LogoNome}

                            alt="Integra"
                        />

                    </Link>

                    <nav aria-label="Navegação pública">

                        <Link to="/portal">

                            Conteúdos

                        </Link>

                        <Link to="/login">

                            Entrar

                        </Link>

                        <Link to="/cadastro">

                            Criar conta

                        </Link>

                    </nav>

                </header>

            )}

            {/* =================================
                CONTEÚDO PRINCIPAL
            ================================= */}

            <main className="cc-main">

                {/* BOTÃO VOLTAR */}

                {autenticado && (

                    <Link
                        to="/home"

                        className="cc-voltar"
                    >

                        ← Voltar ao início

                    </Link>

                )}

                {/* TÍTULO */}

                <h1>

                    Consultar chave de acesso

                </h1>

                <p className="cc-sub">

                    Valide a estrutura da chave da NF-e
                    ou NFC-e e identifique os dados
                    do documento.

                </p>

                {/* =================================
                    FORMULÁRIO
                ================================= */}

                <form
                    className="cc-card"

                    onSubmit={consultar}
                >

                    <label htmlFor="cc-chave">

                        Chave de acesso (44 posições)

                    </label>

                    <input
                        ref={inputChaveRef}

                        id="cc-chave"

                        type="text"

                        value={chave}

                        disabled={carregando}

                        onChange={alterarChave}

                        placeholder="Digite ou cole a chave de acesso"

                        autoComplete="off"

                        autoCapitalize="characters"

                        spellCheck={false}

                        aria-invalid={
                            chave.length > 44
                        }

                        aria-describedby="cc-informacoes"

                        required
                    />

                    {/* =================================
                        CONTADOR E SALDO DE CONSULTAS
                    ================================= */}

                    <div
                        className="cc-info"

                        id="cc-informacoes"
                    >

                        <span
                            className={
                                chave.length > 44

                                    ? "cc-contador-invalido"

                                    : ""
                            }
                        >

                            {chave.length}/44 posições

                        </span>

                        <span aria-live="polite">

                            {saldo?.ilimitado

                                ? "Consultas ilimitadas"

                                : saldo?.restante != null

                                    ? `Consultas restantes hoje: ${saldo.restante}`

                                    : "Limite diário para visitantes e demais perfis; clientes ativos têm consultas ilimitadas."

                            }

                        </span>

                    </div>

                    {/* =================================
                        BOTÕES
                    ================================= */}

                    <div className="cc-acoes">

                        <button
                            type="submit"

                            className="cc-botao-consultar"

                            disabled={
                                carregando ||
                                !chave.trim()
                            }
                        >

                            {carregando

                                ? "Consultando..."

                                : "Consultar chave"}

                        </button>

                        <button
                            type="button"

                            className="cc-botao-limpar"

                            disabled={carregando}

                            onClick={limpar}
                        >

                            Limpar

                        </button>

                    </div>

                    {/* =================================
                        MENSAGEM DE ERRO
                    ================================= */}

                    {erro && (

                        <p
                            className="cc-erro cc-mensagem-erro"

                            role="alert"
                        >

                            {erro}

                        </p>

                    )}

                </form>

                {/* =================================
                    CARREGAMENTO
                ================================= */}

                {carregando && (

                    <div
                        className="cc-carregamento"

                        role="status"
                    >

                        <span
                            className="cc-spinner"

                            aria-hidden="true"
                        />

                        Consultando a estrutura da chave...

                    </div>

                )}

                {/* =================================
                    RESULTADO DA CONSULTA
                ================================= */}

                {resultado && (

                    <section
                        className={`cc-card cc-resultado ${
                            resultado.valida

                                ? "cc-resultado-valido"

                                : "cc-resultado-invalido"
                        }`}

                        aria-live="polite"
                    >

                        <div className="cc-resultado-titulo">

                            <span
                                className="cc-resultado-icone"

                                aria-hidden="true"
                            >

                                {resultado.valida
                                    ? "✓"
                                    : "!"}

                            </span>

                            <h2
                                className={
                                    resultado.valida

                                        ? "cc-valida"

                                        : "cc-erro"
                                }
                            >

                                {resultado.valida

                                    ? "Chave estruturalmente válida"

                                    : "Chave inválida"}

                            </h2>

                        </div>

                        <p className="cc-resultado-mensagem">

                            {resultado.mensagem}

                        </p>

                        {/* CHAVE CONSULTADA */}

                        <div className="cc-chave-consultada">

                            <span>

                                Chave consultada

                            </span>

                            <strong>

                                {resultado.chave || chave}

                            </strong>

                        </div>

                        {/* DADOS IDENTIFICADOS */}

                        {resultado.valida && (

                            <dl className="cc-dados">

                                {campos.map(([nome, valor]) => (

                                    <div key={nome}>

                                        <dt>

                                            {nome}

                                        </dt>

                                        <dd>

                                            {valor ?? "Não informado"}

                                        </dd>

                                    </div>

                                ))}

                            </dl>

                        )}

                    </section>

                )}

                {/* =================================
                    AVISO SOBRE A CONSULTA
                ================================= */}

                <div className="cc-aviso">

                    <span
                        className="cc-aviso-icone"

                        aria-hidden="true"
                    >

                        i

                    </span>

                    <p>

                        A consulta verifica a estrutura e os
                        dígitos da chave. Não consulta a SEFAZ
                        nem comprova a existência ou autorização
                        da nota fiscal.

                    </p>

                </div>

                {/* =================================
                    INFORMAÇÃO PARA VISITANTES
                ================================= */}

                {!autenticado && (

                    <div className="cc-acesso-publico">

                        <p>

                            Já possui uma conta no IntegraCertacon?

                        </p>

                        <Link to="/login">

                            Acessar minha conta

                        </Link>

                    </div>

                )}

            </main>

        </div>

    );

}