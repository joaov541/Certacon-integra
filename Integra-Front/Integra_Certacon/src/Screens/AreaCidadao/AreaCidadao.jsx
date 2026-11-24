import { useState } from "react";
import { Link } from "react-router-dom";

import {
    Users,
    Receipt,
    Wallet,
    ShieldCheck,
    Landmark,
    ChevronDown,
    ArrowLeft,
    ArrowRight,
    ExternalLink,
    CheckCircle,
    Info,
    BookOpen,
    CalendarDays,
    HelpCircle
} from "lucide-react";

import usePermissoes from "../../hooks/usePermissoes";

import LogoNome from "../../assets/Icones/LogoNome.png";

import "./AreaCidadao.css";

// =========================================
// PERGUNTAS FREQUENTES
// =========================================

const perguntas = [
    {
        pergunta: "Por que pedir CPF na nota fiscal?",
        resposta:
            "Informar o CPF permite vincular o documento fiscal ao consumidor. Isso pode facilitar a consulta das compras e a participação em programas de cidadania fiscal, de acordo com as regras de cada estado."
    },
    {
        pergunta: "Sou obrigado a informar meu CPF em todas as compras?",
        resposta:
            "Não existe uma obrigação geral de informar o CPF em todas as compras. Entretanto, determinadas operações podem exigir a identificação do consumidor conforme a legislação aplicável."
    },
    {
        pergunta: "O que é cashback tributário?",
        resposta:
            "É um mecanismo da Reforma Tributária que devolve parte dos tributos sobre o consumo às famílias de baixa renda que atendam aos requisitos previstos na legislação."
    },
    {
        pergunta: "Quem poderá receber o cashback tributário?",
        resposta:
            "O benefício é destinado às famílias inscritas no CadÚnico, com renda familiar mensal por pessoa de até meio salário mínimo, observados os demais requisitos legais, incluindo residência no Brasil e regularidade do CPF."
    },
    {
        pergunta: "Quando começa a devolução dos tributos?",
        resposta:
            "A legislação prevê o início da devolução da CBS em janeiro de 2027 e do IBS em janeiro de 2029."
    },
    {
        pergunta: "Cashback tributário e Nota Fiscal Paulista são iguais?",
        resposta:
            "Não. A Nota Fiscal Paulista é um programa estadual de cidadania fiscal. O cashback da Reforma Tributária é um mecanismo de devolução de IBS e CBS destinado às famílias que atendam aos critérios legais."
    },
    {
        pergunta: "Colocar CPF na nota garante a devolução de impostos?",
        resposta:
            "Não. A identificação do consumidor é importante, mas a devolução depende dos critérios de elegibilidade, das operações abrangidas e das regras do programa correspondente."
    },
    {
        pergunta: "Preciso informar meu CPF ao IntegraCertacon?",
        resposta:
            "Não. A Área do Cidadão possui finalidade educativa e pode ser acessada sem cadastro, sem login e sem informar dados pessoais."
    }
];

// =========================================
// FONTES OFICIAIS
// =========================================

const fontes = [
    {
        titulo: "Ministério da Fazenda",
        descricao: "Informações sobre a Reforma Tributária do consumo.",
        url: "https://www.gov.br/fazenda/pt-br/acesso-a-informacao/acoes-e-programas/futuro-seguro/reforma-tributaria"
    },
    {
        titulo: "Câmara dos Deputados",
        descricao: "Informações sobre a regulamentação da Reforma Tributária.",
        url: "https://www.camara.leg.br/noticias/1127237-REGULAMENTACAO-DA-REFORMA-TRIBUTARIA-E-SANCIONADA%3B-CONHECA-A-NOVA-LEI"
    },
    {
        titulo: "Ministério do Desenvolvimento Social",
        descricao: "Informações sobre a devolução de tributos e o Cadastro Único.",
        url: "https://www.gov.br/mds/pt-br/noticias-e-conteudos/Noticias/2025/nova-politica-tributaria-vai-beneficiar-familias-inscritas-no-cadastro-unico/"
    },
    {
        titulo: "Secretaria da Fazenda de São Paulo",
        descricao: "Informações e serviços da Nota Fiscal Paulista.",
        url: "https://portal.fazenda.sp.gov.br/servicos/nfp"
    }
];

// =========================================
// COMPONENTE PRINCIPAL
// =========================================

export default function AreaCidadao() {

    const { autenticado } = usePermissoes();

    const [perguntaAberta, setPerguntaAberta] =
        useState(null);

    function alternarPergunta(index) {
        setPerguntaAberta(anterior =>
            anterior === index ? null : index
        );
    }

    return (

        <div
            className={`ac-pagina ${
                autenticado
                    ? "ac-autenticada"
                    : "ac-publica"
            }`}
        >

            {/* CABEÇALHO PÚBLICO */}

            {!autenticado && (

                <header className="ac-header">

                    <Link
                        to="/portal"
                        aria-label="Portal IntegraCertacon"
                    >
                        <img
                            src={LogoNome}
                            alt="IntegraCertacon"
                        />
                    </Link>

                    <nav aria-label="Navegação pública">

                        <Link to="/portal">
                            Conteúdos
                        </Link>

                        <Link to="/consultar-chave">
                            Consultar NF-e
                        </Link>

                        <Link to="/glossario">
                            Glossário Fiscal
                        </Link>

                        <Link
                            to="/area-cidadao"
                            className="ac-link-ativo"
                            aria-current="page"
                        >
                            Área do Cidadão
                        </Link>

                        <Link to="/login">
                            Entrar
                        </Link>

                        <Link
                            to="/cadastro"
                            className="ac-criar-conta"
                        >
                            Criar conta
                        </Link>

                    </nav>

                </header>

            )}

            <main className="ac-conteudo">

                {/* VOLTAR */}

                <Link
                    to={autenticado ? "/home" : "/portal"}
                    className="ac-voltar"
                >
                    <ArrowLeft size={17} />

                    Voltar ao início
                </Link>

                {/* APRESENTAÇÃO */}

                <section className="ac-hero">

                    <div className="ac-hero-texto">

                        <span className="ac-hero-tag">
                            CIDADANIA FISCAL
                        </span>

                        <h1>
                            Área do Cidadão
                        </h1>

                        <p>
                            Entenda seus direitos, conheça a importância
                            dos documentos fiscais e descubra como a
                            Reforma Tributária pode impactar seu dia a dia.
                        </p>

                        <div className="ac-hero-acoes">

                            <a href="#ac-cpf">
                                <Receipt size={18} />
                                CPF na nota
                            </a>

                            <a href="#ac-cashback">
                                <Wallet size={18} />
                                Cashback tributário
                            </a>

                        </div>

                    </div>

                    <div
                        className="ac-hero-icone"
                        aria-hidden="true"
                    >
                        <Users size={115} strokeWidth={1.3} />
                    </div>

                </section>

                {/* NAVEGAÇÃO RÁPIDA */}

                <section className="ac-atalhos">

                    <a href="#ac-cpf" className="ac-atalho">

                        <div className="ac-atalho-icone">
                            <Receipt size={25} />
                        </div>

                        <strong>CPF na nota</strong>

                        <span>Entenda sua importância</span>

                    </a>

                    <a href="#ac-cashback" className="ac-atalho">

                        <div className="ac-atalho-icone">
                            <Wallet size={25} />
                        </div>

                        <strong>Cashback tributário</strong>

                        <span>Conheça a devolução</span>

                    </a>

                    <a href="#ac-direitos" className="ac-atalho">

                        <div className="ac-atalho-icone">
                            <ShieldCheck size={25} />
                        </div>

                        <strong>Seus direitos</strong>

                        <span>Cidadania fiscal</span>

                    </a>

                    <a href="#ac-perguntas" className="ac-atalho">

                        <div className="ac-atalho-icone">
                            <HelpCircle size={25} />
                        </div>

                        <strong>Dúvidas frequentes</strong>

                        <span>Encontre respostas</span>

                    </a>

                </section>

                {/* CPF NA NOTA */}

                <section
                    id="ac-cpf"
                    className="ac-secao"
                >

                    <div className="ac-secao-cabecalho">

                        <div className="ac-secao-icone">
                            <Receipt size={27} />
                        </div>

                        <div>

                            <h2>Por que pedir CPF na nota?</h2>

                            <p>
                                Pequenas atitudes que fortalecem
                                a cidadania fiscal.
                            </p>

                        </div>

                    </div>

                    <div className="ac-texto">

                        <p>
                            Solicitar a nota fiscal ao realizar uma
                            compra é uma forma de registrar a operação
                            comercial e incentivar o cumprimento das
                            obrigações fiscais pelos estabelecimentos.
                        </p>

                        <p>
                            Ao informar o CPF, o documento fiscal
                            poderá ser associado ao consumidor,
                            facilitando a identificação das compras
                            e a participação em programas estaduais,
                            quando aplicáveis.
                        </p>

                    </div>

                    <div className="ac-beneficios-grid">

                        <article className="ac-beneficio">

                            <ShieldCheck size={28} />

                            <h3>Comprovação da compra</h3>

                            <p>
                                A nota fiscal ajuda a comprovar a
                                aquisição de produtos e serviços.
                            </p>

                        </article>

                        <article className="ac-beneficio">

                            <Landmark size={28} />

                            <h3>Cidadania fiscal</h3>

                            <p>
                                Solicitar o documento fiscal contribui
                                para a formalização das operações
                                comerciais.
                            </p>

                        </article>

                        <article className="ac-beneficio">

                            <Wallet size={28} />

                            <h3>Programas de benefícios</h3>

                            <p>
                                Alguns estados oferecem créditos,
                                sorteios ou outros benefícios,
                                conforme suas próprias regras.
                            </p>

                        </article>

                    </div>

                    <div className="ac-info">

                        <Info size={22} />

                        <p>
                            Em São Paulo, existe o programa Nota Fiscal
                            Paulista. A participação e os benefícios
                            dependem das regras estabelecidas pelo
                            programa estadual.
                        </p>

                    </div>

                </section>

                {/* CASHBACK TRIBUTÁRIO */}

                <section
                    id="ac-cashback"
                    className="ac-secao"
                >

                    <div className="ac-secao-cabecalho">

                        <div className="ac-secao-icone">
                            <Wallet size={27} />
                        </div>

                        <div>

                            <h2>O que é cashback tributário?</h2>

                            <p>
                                Conheça um dos mecanismos sociais
                                da Reforma Tributária.
                            </p>

                        </div>

                    </div>

                    <div className="ac-texto">

                        <p>
                            O cashback tributário é um mecanismo
                            que busca reduzir o impacto dos tributos
                            sobre o consumo no orçamento das
                            famílias de baixa renda.
                        </p>

                        <p>
                            Por meio dele, parte dos valores pagos
                            em IBS e CBS poderá ser devolvida às
                            famílias que atendam aos requisitos legais.
                        </p>

                    </div>

                    {/* ETAPAS ILUSTRATIVAS */}

                    <h3 className="ac-subtitulo">
                        Entenda como funciona
                    </h3>

                    <div className="ac-etapas">

                        <article className="ac-etapa">

                            <span className="ac-etapa-numero">
                                1
                            </span>

                            <Receipt size={28} />

                            <h4>Compra realizada</h4>

                            <p>
                                A família adquire produtos
                                ou serviços abrangidos.
                            </p>

                        </article>

                        <ArrowRight
                            className="ac-etapa-seta"
                            size={23}
                        />

                        <article className="ac-etapa">

                            <span className="ac-etapa-numero">
                                2
                            </span>

                            <Users size={28} />

                            <h4>Identificação</h4>

                            <p>
                                São considerados os dados da
                                família e os critérios legais.
                            </p>

                        </article>

                        <ArrowRight
                            className="ac-etapa-seta"
                            size={23}
                        />

                        <article className="ac-etapa">

                            <span className="ac-etapa-numero">
                                3
                            </span>

                            <Wallet size={28} />

                            <h4>Devolução</h4>

                            <p>
                                Parte dos tributos é devolvida
                                conforme as regras aplicáveis.
                            </p>

                        </article>

                    </div>

                    {/* REQUISITOS */}

                    <div className="ac-requisitos">

                        <h3>
                            Quem poderá receber?
                        </h3>

                        <ul>

                            <li>
                                <CheckCircle size={20} />
                                Família inscrita no Cadastro
                                Único (CadÚnico).
                            </li>

                            <li>
                                <CheckCircle size={20} />
                                Renda familiar mensal por pessoa
                                de até meio salário mínimo.
                            </li>

                            <li>
                                <CheckCircle size={20} />
                                Residência no território brasileiro.
                            </li>

                            <li>
                                <CheckCircle size={20} />
                                CPF regular, conforme os requisitos
                                previstos na legislação.
                            </li>

                        </ul>

                    </div>

                    {/* CRONOGRAMA */}

                    <h3 className="ac-subtitulo">
                        Quando começa?
                    </h3>

                    <div className="ac-cronograma">

                        <article>

                            <CalendarDays size={24} />

                            <strong>2027</strong>

                            <h4>CBS</h4>

                            <p>
                                Início previsto da devolução
                                da Contribuição sobre Bens
                                e Serviços, em janeiro.
                            </p>

                        </article>

                        <article>

                            <CalendarDays size={24} />

                            <strong>2029</strong>

                            <h4>IBS</h4>

                            <p>
                                Início previsto da devolução
                                do Imposto sobre Bens e
                                Serviços, em janeiro.
                            </p>

                        </article>

                    </div>

                    <div className="ac-info">

                        <Info size={22} />

                        <p>
                            Os valores e procedimentos de devolução
                            dependem da legislação e da regulamentação.
                            Informar o CPF na nota, por si só, não
                            garante o recebimento do benefício.
                        </p>

                    </div>

                </section>

                {/* COMPARAÇÃO */}

                <section className="ac-secao">

                    <div className="ac-secao-cabecalho">

                        <div className="ac-secao-icone">
                            <Landmark size={27} />
                        </div>

                        <div>

                            <h2>
                                Cashback ou Nota Fiscal Paulista?
                            </h2>

                            <p>
                                Conheça as diferenças entre
                                os dois mecanismos.
                            </p>

                        </div>

                    </div>

                    <div className="ac-comparacao-grid">

                        <article className="ac-comparacao">

                            <span className="ac-comparacao-tag">
                                REFORMA TRIBUTÁRIA
                            </span>

                            <h3>Cashback tributário</h3>

                            <dl>

                                <dt>Finalidade</dt>

                                <dd>
                                    Devolver parte dos tributos
                                    sobre o consumo.
                                </dd>

                                <dt>Público</dt>

                                <dd>
                                    Famílias que atendam aos
                                    critérios legais de baixa renda.
                                </dd>

                                <dt>Abrangência</dt>

                                <dd>Nacional.</dd>

                                <dt>Tributos</dt>

                                <dd>IBS e CBS.</dd>

                            </dl>

                        </article>

                        <article className="ac-comparacao">

                            <span className="ac-comparacao-tag">
                                PROGRAMA ESTADUAL
                            </span>

                            <h3>Nota Fiscal Paulista</h3>

                            <dl>

                                <dt>Finalidade</dt>

                                <dd>
                                    Incentivar a solicitação
                                    de documentos fiscais.
                                </dd>

                                <dt>Público</dt>

                                <dd>
                                    Participantes que atendam
                                    às regras do programa.
                                </dd>

                                <dt>Abrangência</dt>

                                <dd>Estado de São Paulo.</dd>

                                <dt>Benefícios</dt>

                                <dd>
                                    Créditos e sorteios,
                                    conforme as regras vigentes.
                                </dd>

                            </dl>

                        </article>

                    </div>

                </section>

                {/* DIREITOS DO CIDADÃO */}

                <section
                    id="ac-direitos"
                    className="ac-secao"
                >

                    <div className="ac-secao-cabecalho">

                        <div className="ac-secao-icone">
                            <ShieldCheck size={27} />
                        </div>

                        <div>

                            <h2>Seus direitos como cidadão</h2>

                            <p>
                                Informação é uma ferramenta
                                importante para o consumidor.
                            </p>

                        </div>

                    </div>

                    <ul className="ac-direitos-lista">

                        <li>
                            <CheckCircle size={22} />

                            <div>

                                <strong>
                                    Solicite o documento fiscal
                                </strong>

                                <p>
                                    Peça a nota fiscal referente
                                    às suas compras e serviços.
                                </p>

                            </div>

                        </li>

                        <li>
                            <CheckCircle size={22} />

                            <div>

                                <strong>
                                    Confira as informações
                                </strong>

                                <p>
                                    Verifique os produtos, valores
                                    e dados registrados no documento.
                                </p>

                            </div>

                        </li>

                        <li>
                            <CheckCircle size={22} />

                            <div>

                                <strong>
                                    Proteja seus dados pessoais
                                </strong>

                                <p>
                                    Informe seus dados somente
                                    quando necessário e utilize
                                    canais oficiais para consultas.
                                </p>

                            </div>

                        </li>

                        <li>
                            <CheckCircle size={22} />

                            <div>

                                <strong>
                                    Conheça os programas oficiais
                                </strong>

                                <p>
                                    Consulte os órgãos responsáveis
                                    para verificar requisitos,
                                    benefícios e procedimentos.
                                </p>

                            </div>

                        </li>

                    </ul>

                </section>

                {/* PERGUNTAS FREQUENTES */}

                <section
                    id="ac-perguntas"
                    className="ac-secao"
                >

                    <div className="ac-secao-cabecalho">

                        <div className="ac-secao-icone">
                            <HelpCircle size={27} />
                        </div>

                        <div>

                            <h2>Perguntas frequentes</h2>

                            <p>
                                Tire suas principais dúvidas
                                sobre cidadania fiscal.
                            </p>

                        </div>

                    </div>

                    <div className="ac-faq">

                        {perguntas.map((item, index) => {

                            const aberta =
                                perguntaAberta === index;

                            return (

                                <article
                                    key={index}
                                    className={`ac-faq-item ${
                                        aberta
                                            ? "ac-faq-aberto"
                                            : ""
                                    }`}
                                >

                                    <h3>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                alternarPergunta(index)
                                            }
                                            aria-expanded={aberta}
                                            aria-controls={`ac-resposta-${index}`}
                                        >

                                            <span>
                                                {item.pergunta}
                                            </span>

                                            <ChevronDown
                                                size={21}
                                                className={
                                                    aberta
                                                        ? "ac-seta-aberta"
                                                        : ""
                                                }
                                            />

                                        </button>

                                    </h3>

                                    <div
                                        id={`ac-resposta-${index}`}
                                        className="ac-faq-resposta"
                                        hidden={!aberta}
                                    >

                                        <p>
                                            {item.resposta}
                                        </p>

                                    </div>

                                </article>

                            );

                        })}

                    </div>

                </section>

                {/* FONTES OFICIAIS */}

                <section className="ac-secao">

                    <div className="ac-secao-cabecalho">

                        <div className="ac-secao-icone">
                            <BookOpen size={27} />
                        </div>

                        <div>

                            <h2>Fontes oficiais</h2>

                            <p>
                                Consulte informações diretamente
                                nos órgãos responsáveis.
                            </p>

                        </div>

                    </div>

                    <div className="ac-fontes">

                        {fontes.map(fonte => (

                            <a
                                key={fonte.url}
                                href={fonte.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ac-fonte"
                            >

                                <div>

                                    <strong>
                                        {fonte.titulo}
                                    </strong>

                                    <p>
                                        {fonte.descricao}
                                    </p>

                                </div>

                                <ExternalLink size={20} />

                            </a>

                        ))}

                    </div>

                </section>

                {/* FERRAMENTAS RELACIONADAS */}

                <section className="ac-relacionados">

                    <h2>Continue aprendendo</h2>

                    <p>
                        Explore outras ferramentas gratuitas
                        do IntegraCertacon.
                    </p>

                    <div className="ac-relacionados-grid">

                        <Link to="/glossario">

                            <BookOpen size={25} />

                            <div>

                                <strong>Glossário Fiscal</strong>

                                <span>
                                    Conheça os termos tributários.
                                </span>

                            </div>

                            <ArrowRight size={20} />

                        </Link>

                        <Link to="/consultar-chave">

                            <Receipt size={25} />

                            <div>

                                <strong>Consultar NF-e</strong>

                                <span>
                                    Verifique a estrutura da chave.
                                </span>

                            </div>

                            <ArrowRight size={20} />

                        </Link>

                    </div>

                </section>

                {/* AVISO LEGAL */}

                <div className="ac-aviso-final">

                    <Info size={20} />

                    <p>
                        Este conteúdo possui finalidade educativa.
                        O IntegraCertacon não realiza pagamentos,
                        consultas de elegibilidade ou concessão de
                        benefícios governamentais. Consulte sempre
                        a legislação vigente e os canais oficiais.
                        Conteúdo revisado em novembro de 2026.
                    </p>

                </div>

            </main>

            {/* RODAPÉ PÚBLICO */}

            {!autenticado && (

                <footer className="ac-footer">

                    IntegraCertacon · Cidadania Fiscal

                </footer>

            )}

        </div>

    );

}