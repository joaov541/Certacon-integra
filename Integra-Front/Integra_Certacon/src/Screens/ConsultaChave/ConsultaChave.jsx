import {
    useState,
    useEffect,
    useRef
} from "react";

import { Link } from "react-router-dom";

import {
    ScanBarcode,
    ScanLine,
    Search,
    RotateCcw,
    CheckCircle2,
    AlertCircle,
    Info,
    ArrowLeft,
    ShieldCheck
} from "lucide-react";

import api from "../../services/api";

import usePermissoes from "../../hooks/usePermissoes";

import LogoNome from "../../assets/Icones/LogoNome.png";

import "./ConsultaChave.css";

// =========================================
// SCANNER DIGITAL
// =========================================

function ScannerDigital({ chave }) {

    const barras = Array.from(
        { length: 64 },
        (_, indice) => ({
            largura: [2, 4, 2, 6, 3, 2, 5][indice % 7],
            altura: indice % 5 === 0 ? 90 : 100
        })
    );

    return (

        <div
            className="cc-scanner-painel"
            role="status"
            aria-live="polite"
        >

            <div className="cc-scanner-cabecalho">

                <div className="cc-scanner-icone">

                    <ScanLine
                        size={24}
                        aria-hidden="true"
                    />

                </div>

                <div>

                    <h3>Analisando chave de acesso</h3>

                    <p>
                        Aguardando o resultado da validação estrutural.
                    </p>

                </div>

                <div
                    className="cc-scanner-status"
                    aria-hidden="true"
                >

                    <span />

                    Processando

                </div>

            </div>

            {/* ÁREA DO SCANNER */}

            <div
                className="cc-scanner-area"
                aria-hidden="true"
            >

                <div className="cc-scanner-canto superior-esquerdo" />
                <div className="cc-scanner-canto superior-direito" />
                <div className="cc-scanner-canto inferior-esquerdo" />
                <div className="cc-scanner-canto inferior-direito" />

                <div className="cc-scanner-barras">

                    {barras.map((barra, indice) => (

                        <span
                            key={indice}
                            style={{
                                width: `${barra.largura}px`,
                                height: `${barra.altura}%`
                            }}
                        />

                    ))}

                </div>

                <div className="cc-scanner-luz" />

                <div className="cc-scanner-linha" />

            </div>

            {/* CHAVE EM PROCESSAMENTO */}

            <div className="cc-scanner-chave">

                {chave}

            </div>

            {/* INDICADOR DE PROCESSAMENTO */}

            <div
                className="cc-scanner-progresso"
                aria-hidden="true"
            >

                <span />

            </div>

            <div className="cc-scanner-rodape">

                <span
                    className="cc-spinner"
                    aria-hidden="true"
                />

                <span>
                    Consultando a estrutura da chave...
                </span>

            </div>

        </div>

    );

}

// =========================================
// COMPONENTE PRINCIPAL
// =========================================

export default function ConsultaChave() {

    const { autenticado } = usePermissoes();

    const token = localStorage.getItem("token");

    // =====================================
    // ESTADOS
    // =====================================

    const [chave, setChave] = useState("");

    const [resultado, setResultado] =
        useState(null);

    const [erro, setErro] =
        useState("");

    const [carregando, setCarregando] =
        useState(false);

    const [saldo, setSaldo] =
        useState(null);

    // =====================================
    // REFERÊNCIAS
    // =====================================

    const consultaRef = useRef(null);

    const inputChaveRef = useRef(null);

    // =====================================
    // LIMPAR DADOS AO ALTERAR SESSÃO
    // =====================================

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

    // =====================================
    // CONSULTAR CHAVE DE ACESSO
    // =====================================

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

        // =================================
        // VALIDAR FORMATO
        //
        // 6 posições numéricas
        // 12 posições alfanuméricas
        // 26 posições numéricas
        //
        // Total: 44 posições
        // =================================

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

            // =============================
            // LIMITE DIÁRIO ATINGIDO
            // =============================

            if (resposta.status === 429) {

                setSaldo({
                    restante: 0,
                    ilimitado: false
                });

            }

            // =============================
            // ATUALIZAR SALDO
            // =============================

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

            // =============================
            // TRATAMENTO DE ERROS
            // =============================

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

            // =============================
            // VALIDAR RESPOSTA
            // =============================

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
                controller.signal.aborted ||
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

    // =====================================
    // ALTERAR CHAVE
    // =====================================

    function alterarChave(event) {

        const valor = event.target.value
            .toUpperCase()
            .replace(/\s/g, "");

        setChave(valor);

        setResultado(null);

        setErro("");

    }

    // =====================================
    // LIMPAR FORMULÁRIO
    // =====================================

    function limpar() {

        if (carregando) return;

        setChave("");

        setResultado(null);

        setErro("");

        // Preserva o saldo de consultas.

        inputChaveRef.current?.focus();

    }

    // =====================================
    // FORMATAR MODELO
    // =====================================

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

    // =====================================
    // PROGRESSO DO PREENCHIMENTO
    // =====================================

    const percentualPreenchimento = Math.min(
        (chave.length / 44) * 100,
        100
    );

    const formatoCompleto =
        /^[0-9]{6}[A-Z0-9]{12}[0-9]{26}$/
            .test(chave);

    // =====================================
    // CAMPOS DO RESULTADO
    // =====================================

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

    // =====================================
    // RENDERIZAÇÃO
    // =====================================

    return (

        <div
            className={`cc-pagina ${
                autenticado
                    ? "cc-autenticada"
                    : "cc-publica"
            }`}
        >

            {/* CABEÇALHO PÚBLICO */}

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

            {/* CONTEÚDO PRINCIPAL */}

            <main className="cc-main">

                {/* BOTÃO VOLTAR */}

                {autenticado && (

                    <Link
                        to="/home"
                        className="cc-voltar"
                    >

                        <ArrowLeft
                            size={16}
                            aria-hidden="true"
                        />

                        Voltar ao início

                    </Link>

                )}

                {/* CABEÇALHO DA FERRAMENTA */}

                <div className="cc-cabecalho-ferramenta">

                    <div
                        className="cc-icone-principal"
                        aria-hidden="true"
                    >

                        <ScanBarcode size={34} />

                        <span className="cc-icone-brilho" />

                    </div>

                    <div className="cc-cabecalho-texto">

                        <span className="cc-etiqueta">

                            FERRAMENTAS FISCAIS

                        </span>

                        <h1>
                            Consultar chave de acesso
                        </h1>

                        <p className="cc-sub">

                            Valide a estrutura da chave da NF-e
                            ou NFC-e e identifique os dados
                            do documento.

                        </p>

                    </div>

                </div>

                {/* FORMULÁRIO */}

                <form
                    className={`cc-card cc-formulario ${
                        carregando
                            ? "cc-formulario-processando"
                            : ""
                    }`}
                    onSubmit={consultar}
                    aria-busy={carregando}
                >

                    <label htmlFor="cc-chave">

                        Chave de acesso (44 posições)

                    </label>

                    {/* CAMPO DA CHAVE */}

                    <div
                        className={`cc-input-container ${
                            formatoCompleto
                                ? "cc-input-completo"
                                : ""
                        } ${
                            chave.length > 44
                                ? "cc-input-invalido"
                                : ""
                        }`}
                    >

                        <ScanBarcode
                            size={22}
                            className="cc-input-icone"
                            aria-hidden="true"
                        />

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

                        {formatoCompleto && (

                            <CheckCircle2
                                size={21}
                                className="cc-input-check"
                                aria-hidden="true"
                            />

                        )}

                    </div>

                    {/* BARRA DE PREENCHIMENTO */}

                    <div
                        className={`cc-preenchimento ${
                            chave.length > 44
                                ? "cc-preenchimento-invalido"
                                : formatoCompleto
                                    ? "cc-preenchimento-completo"
                                    : ""
                        }`}
                        aria-hidden="true"
                    >

                        <span
                            style={{
                                width: `${percentualPreenchimento}%`
                            }}
                        />

                    </div>

                    {/* CONTADOR E SALDO */}

                    <div
                        className="cc-info"
                        id="cc-informacoes"
                    >

                        <span
                            className={
                                chave.length > 44
                                    ? "cc-contador-invalido"
                                    : formatoCompleto
                                        ? "cc-contador-completo"
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

                    {/* BOTÕES */}

                    <div className="cc-acoes">

                        <button
                            type="submit"
                            className="cc-botao-consultar"
                            disabled={
                                carregando ||
                                !chave.trim()
                            }
                        >

                            {carregando ? (

                                <ScanLine
                                    size={18}
                                    aria-hidden="true"
                                />

                            ) : (

                                <Search
                                    size={18}
                                    aria-hidden="true"
                                />

                            )}

                            {carregando
                                ? "Analisando..."
                                : "Consultar chave"}

                        </button>

                        <button
                            type="button"
                            className="cc-botao-limpar"
                            disabled={carregando}
                            onClick={limpar}
                        >

                            <RotateCcw
                                size={16}
                                aria-hidden="true"
                            />

                            Limpar

                        </button>

                    </div>

                    {/* ERRO */}

                    {erro && (

                        <div
                            className="cc-erro cc-mensagem-erro"
                            role="alert"
                        >

                            <AlertCircle
                                size={20}
                                aria-hidden="true"
                            />

                            <span>
                                {erro}
                            </span>

                        </div>

                    )}

                </form>

                {/* SCANNER DIGITAL */}

                {carregando && (

                    <ScannerDigital chave={chave} />

                )}

                {/* RESULTADO DA CONSULTA */}

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

                                {resultado.valida ? (

                                    <CheckCircle2 size={26} />

                                ) : (

                                    <AlertCircle size={26} />

                                )}

                            </span>

                            <div>

                                <span className="cc-resultado-etiqueta">

                                    ANÁLISE CONCLUÍDA

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

                            <>

                                <div className="cc-dados-cabecalho">

                                    <ShieldCheck
                                        size={20}
                                        aria-hidden="true"
                                    />

                                    <h3>
                                        Dados identificados
                                    </h3>

                                </div>

                                <dl className="cc-dados">

                                    {campos.map(
                                        ([nome, valor], indice) => (

                                            <div
                                                key={nome}
                                                style={{
                                                    "--cc-atraso":
                                                        `${indice * 85}ms`
                                                }}
                                            >

                                                <dt>

                                                    {nome}

                                                </dt>

                                                <dd>

                                                    {valor ??
                                                        "Não informado"}

                                                </dd>

                                            </div>

                                        )
                                    )}

                                </dl>

                            </>

                        )}

                    </section>

                )}

                {/* AVISO SOBRE A CONSULTA */}

                <div className="cc-aviso">

                    <span
                        className="cc-aviso-icone"
                        aria-hidden="true"
                    >

                        <Info size={22} />

                    </span>

                    <p>

                        A consulta verifica a estrutura e os
                        dígitos da chave. Não consulta a SEFAZ
                        nem comprova a existência ou autorização
                        da nota fiscal.

                    </p>

                </div>

                {/* INFORMAÇÃO PARA VISITANTES */}

                {!autenticado && (

                    <div className="cc-acesso-publico">

                        <p>

                            Já possui uma conta no Integra?

                        </p>

                        <Link to="/login">

                            Acessar minha conta

                        </Link>

                    </div>

                )}

            </main>

            {/* RODAPÉ PÚBLICO */}

            {!autenticado && (

                <footer className="cc-footer">

                    <div className="cc-footer-conteudo">

                        <Link
                            to="/portal"
                            aria-label="Voltar ao portal Integra"
                        >

                            <img
                                src={LogoNome}
                                alt="Integra"
                            />

                        </Link>

                        <div className="cc-footer-texto">

                            <strong>
                                Integra
                            </strong>

                            <span>
                                Portal tributário
                            </span>

                        </div>

                    </div>

                </footer>

            )}

        </div>

    );

}