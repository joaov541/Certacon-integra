USE IntegraCertacon;
GO

SELECT
    p.Nome AS Perfil,
    pe.Codigo AS Permissao,
    ISNULL(t.Nome, 'GERAL') AS Tema
FROM dbo.PERFIL_PERMISSAO pp

INNER JOIN dbo.PERFIL p
    ON p.Perfil_Id = pp.Perfil_Id

INNER JOIN dbo.PERMISSAO pe
    ON pe.Permissao_Id = pp.Permissao_Id

LEFT JOIN dbo.TEMA t
    ON t.Tema_Id = pp.Tema_Id

ORDER BY
    p.Nome,
    pe.Codigo,
    t.Nome;






    USE IntegraCertacon;
GO

SELECT
    n.NotaFiscal_Id,
    n.Numero,
    n.CNPJEmitente,
    n.CNPJDestinatario,
    n.ValorTotal,
    u.Nome AS UsuarioVinculado,
    u.CNPJ AS CNPJUsuario
FROM dbo.NOTA_FISCAL n
INNER JOIN dbo.USUARIO u
    ON n.Usuario_Id = u.Usuario_Id
ORDER BY n.CNPJDestinatario;

USE IntegraCertacon;
GO

SELECT
    u.Nome AS Usuario,
    u.Email,
    p.Nome AS Perfil,
    up.DataAtribuicao
FROM dbo.USUARIO u
INNER JOIN dbo.USUARIO_PERFIL up
    ON u.Usuario_Id = up.Usuario_Id
INNER JOIN dbo.PERFIL p
    ON up.Perfil_Id = p.Perfil_Id
WHERE u.Email = 'multiperfil@integra.local';






USE IntegraCertacon;
GO

SELECT
    Permissao_Id,
    Codigo,
    Nome
FROM dbo.PERMISSAO
WHERE Codigo IN (
    'artigo.ler.publico',
    'artigo.ler.exclusivo'
);





CREATE TABLE GLOSSARIO_FISCAL
(
    GlossarioFiscal_Id UNIQUEIDENTIFIER NOT NULL
        DEFAULT NEWSEQUENTIALID(),

    AutorUsuario_Id UNIQUEIDENTIFIER NOT NULL,

    Termo NVARCHAR(100) NOT NULL,

    Significado NVARCHAR(250) NOT NULL,

    Descricao NVARCHAR(MAX) NOT NULL,

    Ativo BIT NOT NULL DEFAULT 1,

    DataCriacao DATETIME2 NOT NULL
        DEFAULT SYSUTCDATETIME(),

    DataAtualizacao DATETIME2 NULL,

    CONSTRAINT PK_GLOSSARIO_FISCAL
        PRIMARY KEY (GlossarioFiscal_Id),

    CONSTRAINT UQ_GLOSSARIO_FISCAL_TERMO
        UNIQUE (Termo),

    CONSTRAINT FK_GLOSSARIO_FISCAL_USUARIO
        FOREIGN KEY (AutorUsuario_Id)
        REFERENCES USUARIO (Usuario_Id)
);




IF NOT EXISTS (
    SELECT 1
    FROM PERMISSAO
    WHERE Codigo = 'glossario.gerenciar'
)
BEGIN
    INSERT INTO PERMISSAO
    (
        Permissao_Id,
        Codigo,
        Nome,
        Descricao
    )
    VALUES
    (
        NEWID(),
        'glossario.gerenciar',
        'Gerenciar Glossário Fiscal',
        'Permite cadastrar, editar, ativar e desativar termos do glossário fiscal.'
    );
END;







SELECT
    P.Nome AS Perfil,
    PM.Codigo AS Permissao,
    PM.Nome AS NomePermissao,
    PP.Tema_Id
FROM PERFIL_PERMISSAO PP
INNER JOIN PERFIL P
    ON P.Perfil_Id = PP.Perfil_Id
INNER JOIN PERMISSAO PM
    ON PM.Permissao_Id = PP.Permissao_Id
WHERE PM.Codigo = 'glossario.gerenciar';




USE IntegraCertacon;
GO

DECLARE @AutorId UNIQUEIDENTIFIER;

SELECT TOP 1 @AutorId = U.Usuario_Id
FROM USUARIO U
INNER JOIN USUARIO_PERFIL UP
    ON UP.Usuario_Id = U.Usuario_Id
INNER JOIN PERFIL P
    ON P.Perfil_Id = UP.Perfil_Id
WHERE P.Nome = N'Coordenador Fiscal'
    AND U.Ativo = 1
    AND P.Ativo = 1
ORDER BY U.DataCriacao, U.Usuario_Id;


INSERT INTO GLOSSARIO_FISCAL
(
    GlossarioFiscal_Id,
    AutorUsuario_Id,
    Termo,
    Significado,
    Descricao,
    Ativo,
    DataCriacao
)
SELECT
    NEWID(),
    @AutorId,
    T.Termo,
    T.Significado,
    T.Descricao,
    1,
    SYSUTCDATETIME()
FROM
(
    VALUES

    (
        N'CFOP',
        N'Código Fiscal de Operações e Prestações',
        N'Código utilizado para identificar a natureza das operações de circulação de mercadorias e das prestações de serviços.'
    ),

    (
        N'CST',
        N'Código de Situação Tributária',
        N'Código que identifica o tratamento tributário aplicado a uma mercadoria, operação ou prestação de serviço.'
    ),

    (
        N'NCM',
        N'Nomenclatura Comum do Mercosul',
        N'Código de oito dígitos utilizado para classificar mercadorias e auxiliar na identificação de seu tratamento tributário.'
    ),

    (
        N'NF-e',
        N'Nota Fiscal Eletrônica',
        N'Documento fiscal digital utilizado para registrar operações, principalmente de circulação de mercadorias.'
    ),

    (
        N'NFC-e',
        N'Nota Fiscal de Consumidor Eletrônica',
        N'Documento fiscal eletrônico utilizado principalmente nas vendas realizadas ao consumidor final.'
    ),

    (
        N'NFS-e',
        N'Nota Fiscal de Serviço Eletrônica',
        N'Documento eletrônico que registra operações de prestação de serviços.'
    ),

    (
        N'XML',
        N'Extensible Markup Language',
        N'Formato estruturado de arquivo utilizado para representar e transmitir os dados dos documentos fiscais eletrônicos.'
    ),

    (
        N'DANFE',
        N'Documento Auxiliar da Nota Fiscal Eletrônica',
        N'Representação auxiliar da NF-e que facilita a consulta de seus dados e acompanha a circulação das mercadorias quando exigido.'
    ),

    (
        N'Chave de acesso',
        N'Identificador de Documento Fiscal Eletrônico',
        N'Sequência de 44 posições que identifica uma NF-e ou NFC-e e permite sua consulta nos sistemas autorizados.'
    ),

    (
        N'CNPJ',
        N'Cadastro Nacional da Pessoa Jurídica',
        N'Identificador cadastral de pessoas jurídicas e outras entidades perante a Receita Federal. Possui 14 posições nos formatos numérico e alfanumérico.'
    ),

    (
        N'CPF',
        N'Cadastro de Pessoas Físicas',
        N'Identificador cadastral utilizado pela Receita Federal para individualizar pessoas físicas.'
    ),

    (
        N'ICMS',
        N'Imposto sobre Circulação de Mercadorias e Serviços',
        N'Imposto estadual incidente sobre operações com mercadorias e determinadas prestações de transporte e comunicação.'
    ),

    (
        N'ISS',
        N'Imposto sobre Serviços',
        N'Imposto de competência municipal e do Distrito Federal incidente sobre os serviços definidos na legislação.'
    ),

    (
        N'IPI',
        N'Imposto sobre Produtos Industrializados',
        N'Imposto federal incidente sobre produtos industrializados nas hipóteses previstas na legislação.'
    ),

    (
        N'PIS',
        N'Programa de Integração Social',
        N'Programa relacionado à contribuição social conhecida como PIS, utilizada no financiamento de finalidades sociais previstas em lei.'
    ),

    (
        N'COFINS',
        N'Contribuição para o Financiamento da Seguridade Social',
        N'Contribuição federal destinada ao financiamento da seguridade social.'
    ),

    (
        N'IBS',
        N'Imposto sobre Bens e Serviços',
        N'Tributo sobre o consumo instituído pela Reforma Tributária, de competência compartilhada entre estados, municípios e Distrito Federal.'
    ),

    (
        N'CBS',
        N'Contribuição sobre Bens e Serviços',
        N'Contribuição federal sobre o consumo instituída pela Reforma Tributária.'
    ),

    (
        N'IS',
        N'Imposto Seletivo',
        N'Imposto federal incidente sobre determinados bens e serviços considerados prejudiciais à saúde ou ao meio ambiente, conforme a legislação.'
    ),

    (
        N'IVA',
        N'Imposto sobre Valor Agregado',
        N'Modelo de tributação do consumo que busca tributar o valor agregado nas etapas da cadeia econômica. No Brasil, IBS e CBS compõem o modelo de IVA dual.'
    ),

    (
        N'SPED',
        N'Sistema Público de Escrituração Digital',
        N'Sistema que integra e digitaliza informações relacionadas às escriturações contábeis e fiscais.'
    ),

    (
        N'EFD',
        N'Escrituração Fiscal Digital',
        N'Escrituração eletrônica utilizada para registrar informações fiscais exigidas pelas administrações tributárias.'
    ),

    (
        N'EFD-Contribuições',
        N'Escrituração Fiscal Digital das Contribuições',
        N'Módulo do SPED destinado à escrituração de informações relacionadas principalmente às contribuições PIS/Pasep e Cofins.'
    ),

    (
        N'ECD',
        N'Escrituração Contábil Digital',
        N'Módulo do SPED destinado à entrega eletrônica de livros e registros contábeis.'
    ),

    (
        N'ECF',
        N'Escrituração Contábil Fiscal',
        N'Obrigação acessória que reúne informações relacionadas principalmente à apuração do IRPJ e da CSLL.'
    ),

    (
        N'SEFAZ',
        N'Secretaria da Fazenda',
        N'Órgão da administração pública responsável por atividades como arrecadação, fiscalização e administração tributária, conforme sua competência.'
    ),

    (
        N'Alíquota',
        N'Percentual ou Valor Aplicado na Tributação',
        N'Percentual ou valor específico utilizado no cálculo de um tributo, conforme as regras aplicáveis.'
    ),

    (
        N'Base de cálculo',
        N'Grandeza Utilizada para Calcular um Tributo',
        N'Valor ou outra grandeza definida pela legislação sobre a qual se aplica a alíquota para determinar o tributo devido.'
    ),

    (
        N'Cashback tributário',
        N'Devolução Personalizada de Tributos',
        N'Mecanismo de devolução de parte dos tributos sobre o consumo às famílias de baixa renda que atendam aos critérios legais.'
    ),

    (
        N'Simples Nacional',
        N'Regime Especial Unificado de Arrecadação',
        N'Regime tributário destinado às microempresas e empresas de pequeno porte que atendam aos requisitos legais.'
    )

) AS T (Termo, Significado, Descricao)

WHERE NOT EXISTS
(
    SELECT 1
    FROM GLOSSARIO_FISCAL G
    WHERE UPPER(G.Termo) = UPPER(T.Termo)
);

PRINT 'Termos fiscais iniciais cadastrados com sucesso.';
GO

DECLARE @PerfilClienteId UNIQUEIDENTIFIER;

SELECT @PerfilClienteId = Perfil_Id
FROM dbo.PERFIL
WHERE Nome = N'Cliente'
  AND Ativo = 1;

IF @PerfilClienteId IS NULL
BEGIN
    THROW 50001, 'Perfil Cliente não encontrado ou inativo.', 1;
END;

INSERT INTO dbo.PERFIL_PERMISSAO
(
    PerfilPermissao_Id,
    Perfil_Id,
    Permissao_Id,
    Tema_Id
)
SELECT
    NEWID(),
    @PerfilClienteId,
    P.Permissao_Id,
    NULL
FROM dbo.PERMISSAO P
WHERE P.Codigo IN
(
    'favorito.gerenciar.proprios',
    'historico.leitura.gerenciar.proprio'
)
AND P.Ativo = 1
AND NOT EXISTS
(
    SELECT 1
    FROM dbo.PERFIL_PERMISSAO PP
    WHERE PP.Perfil_Id = @PerfilClienteId
      AND PP.Permissao_Id = P.Permissao_Id
      AND PP.Tema_Id IS NULL
);




IF NOT EXISTS
(
    SELECT 1
    FROM dbo.PERMISSAO
    WHERE Codigo = 'agenda.ler'
)
BEGIN

    INSERT INTO dbo.PERMISSAO
    (
        Permissao_Id,
        Codigo,
        Nome,
        Descricao
    )
    VALUES
    (
        NEWID(),
        'agenda.ler',
        N'Consultar Agenda Fiscal',
        N'Permite consultar o calendário e os prazos das obrigações fiscais.'
    );

END;


IF NOT EXISTS
(
    SELECT 1
    FROM dbo.PERMISSAO
    WHERE Codigo = 'agenda.gerenciar'
)
BEGIN

    INSERT INTO dbo.PERMISSAO
    (
        Permissao_Id,
        Codigo,
        Nome,
        Descricao
    )
    VALUES
    (
        NEWID(),
        'agenda.gerenciar',
        N'Gerenciar Agenda Fiscal',
        N'Permite cadastrar, editar, cancelar e reativar obrigações fiscais.'
    );

END;






INSERT INTO dbo.PERFIL_PERMISSAO
(
    PerfilPermissao_Id,
    Perfil_Id,
    Permissao_Id,
    Tema_Id
)
SELECT
    NEWID(),
    P.Perfil_Id,
    PM.Permissao_Id,
    NULL

FROM dbo.PERFIL P

CROSS JOIN dbo.PERMISSAO PM

WHERE P.Ativo = 1

  AND PM.Ativo = 1

  AND
  (
      (
          PM.Codigo = 'simulador.calcular'

          AND P.Nome IN
          (
              N'Administrador',
              N'Coordenador Fiscal',
              N'Analista SPED',
              N'Analista de Documentos Fiscais',
              N'Analista de Reforma Tributária',
              N'Cliente'
          )
      )

      OR

      (
          PM.Codigo = 'simulador.gerenciar'

          AND P.Nome = N'Coordenador Fiscal'
      )
  )

  AND NOT EXISTS
  (
      SELECT 1

      FROM dbo.PERFIL_PERMISSAO PP

      WHERE PP.Perfil_Id = P.Perfil_Id

        AND PP.Permissao_Id = PM.Permissao_Id

        AND PP.Tema_Id IS NULL
  );

















  SELECT
    P.Nome AS Perfil,
    PM.Codigo AS Permissao,
    PM.Nome AS NomePermissao,
    PM.Ativo,
    PP.Tema_Id

FROM dbo.PERFIL_PERMISSAO PP

INNER JOIN dbo.PERFIL P
    ON P.Perfil_Id = PP.Perfil_Id

INNER JOIN dbo.PERMISSAO PM
    ON PM.Permissao_Id = PP.Permissao_Id

WHERE PM.Codigo IN
(
    'simulador.calcular',
    'simulador.gerenciar'
)

ORDER BY P.Nome, PM.Codigo;