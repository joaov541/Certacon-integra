
CREATE DATABASE IntegraCertacon;

GO

USE IntegraCertacon;
GO

/* 1. USUARIO */
CREATE TABLE dbo.USUARIO (
    Usuario_Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_USUARIO_Id DEFAULT NEWID(),
    Nome NVARCHAR(150) NOT NULL,
    Email NVARCHAR(256) NOT NULL,
    SenhaHash NVARCHAR(MAX) NOT NULL,
    Ativo BIT NOT NULL CONSTRAINT DF_USUARIO_Ativo DEFAULT 1,
    DataCriacao DATETIME2(0) NOT NULL CONSTRAINT DF_USUARIO_DataCriacao DEFAULT SYSDATETIME(),
    CONSTRAINT PK_USUARIO PRIMARY KEY (Usuario_Id),
    CONSTRAINT UQ_USUARIO_Email UNIQUE (Email)
);
GO


/* 2. PERFIL */
CREATE TABLE dbo.PERFIL (
    Perfil_Id INT IDENTITY(1,1) NOT NULL,
    Nome NVARCHAR(100) NOT NULL,
    Descricao NVARCHAR(300) NULL,
    Ativo BIT NOT NULL CONSTRAINT DF_PERFIL_Ativo DEFAULT 1,
    CONSTRAINT PK_PERFIL PRIMARY KEY (Perfil_Id),
    CONSTRAINT UQ_PERFIL_Nome UNIQUE (Nome)
);
GO

/* 3. USUARIO_PERFIL: permite vários perfis por usuário */
CREATE TABLE dbo.USUARIO_PERFIL (
    Usuario_Id UNIQUEIDENTIFIER NOT NULL,
    Perfil_Id INT NOT NULL,
    DataAtribuicao DATETIME2(0) NOT NULL CONSTRAINT DF_USUARIO_PERFIL_Data DEFAULT SYSDATETIME(),
    Ativo BIT NOT NULL CONSTRAINT DF_USUARIO_PERFIL_Ativo DEFAULT 1,
    CONSTRAINT PK_USUARIO_PERFIL PRIMARY KEY (Usuario_Id, Perfil_Id),
    CONSTRAINT FK_USUARIO_PERFIL_USUARIO FOREIGN KEY (Usuario_Id) REFERENCES dbo.USUARIO(Usuario_Id),
    CONSTRAINT FK_USUARIO_PERFIL_PERFIL FOREIGN KEY (Perfil_Id) REFERENCES dbo.PERFIL(Perfil_Id)
);
GO

/* 4. CLIENTE */
CREATE TABLE dbo.CLIENTE (
    Cliente_Id INT IDENTITY(1,1) NOT NULL,
    RazaoSocial NVARCHAR(200) NOT NULL,
    NomeFantasia NVARCHAR(200) NULL,
    CNPJ NVARCHAR(14) NOT NULL,
    Ativo BIT NOT NULL CONSTRAINT DF_CLIENTE_Ativo DEFAULT 1,
    DataCadastro DATETIME2(0) NOT NULL CONSTRAINT DF_CLIENTE_DataCadastro DEFAULT SYSDATETIME(),
    CONSTRAINT PK_CLIENTE PRIMARY KEY (Cliente_Id),
    CONSTRAINT UQ_CLIENTE_CNPJ UNIQUE (CNPJ),
    CONSTRAINT CK_CLIENTE_CNPJ_Formato CHECK (
        LEN(CNPJ) = 14
        AND CNPJ COLLATE Latin1_General_100_BIN2 NOT LIKE '%[^0-9A-Z]%'
        AND LEFT(CNPJ, 12) COLLATE Latin1_General_100_BIN2 NOT LIKE '%[^0-9A-Z]%'
        AND RIGHT(CNPJ, 2) COLLATE Latin1_General_100_BIN2 NOT LIKE '%[^0-9]%'
    )
);
GO

/* 5. USUARIO_CLIENTE: vínculo e escopo de acesso */
CREATE TABLE dbo.USUARIO_CLIENTE (
    Usuario_Id UNIQUEIDENTIFIER NOT NULL,
    Cliente_Id INT NOT NULL,
    DataVinculo DATETIME2(0) NOT NULL CONSTRAINT DF_USUARIO_CLIENTE_Data DEFAULT SYSDATETIME(),
    Ativo BIT NOT NULL CONSTRAINT DF_USUARIO_CLIENTE_Ativo DEFAULT 1,
    CONSTRAINT PK_USUARIO_CLIENTE PRIMARY KEY (Usuario_Id, Cliente_Id),
    CONSTRAINT FK_USUARIO_CLIENTE_USUARIO FOREIGN KEY (Usuario_Id) REFERENCES dbo.USUARIO(Usuario_Id),
    CONSTRAINT FK_USUARIO_CLIENTE_CLIENTE FOREIGN KEY (Cliente_Id) REFERENCES dbo.CLIENTE(Cliente_Id)
);
GO

/* 6. TEMA */
CREATE TABLE dbo.TEMA (
    Tema_Id INT IDENTITY(1,1) NOT NULL,
    Nome NVARCHAR(120) NOT NULL,
    Descricao NVARCHAR(300) NULL,
    Ativo BIT NOT NULL CONSTRAINT DF_TEMA_Ativo DEFAULT 1,
    CONSTRAINT PK_TEMA PRIMARY KEY (Tema_Id),
    CONSTRAINT UQ_TEMA_Nome UNIQUE (Nome)
);
GO

/* 7. PERMISSAO */
CREATE TABLE dbo.PERMISSAO (
    Permissao_Id INT IDENTITY(1,1) NOT NULL,
    Codigo NVARCHAR(100) NOT NULL,
    Nome NVARCHAR(150) NOT NULL,
    Descricao NVARCHAR(300) NULL,
    CONSTRAINT PK_PERMISSAO PRIMARY KEY (Permissao_Id),
    CONSTRAINT UQ_PERMISSAO_Codigo UNIQUE (Codigo)
);
GO

/* 8. PERFIL_PERMISSAO: Tema_Id NULL significa permissão global */
CREATE TABLE dbo.PERFIL_PERMISSAO (
    PerfilPermissao_Id INT IDENTITY(1,1) NOT NULL,
    Perfil_Id INT NOT NULL,
    Permissao_Id INT NOT NULL,
    Tema_Id INT NULL,
    CONSTRAINT PK_PERFIL_PERMISSAO PRIMARY KEY (PerfilPermissao_Id),
    CONSTRAINT FK_PERFIL_PERMISSAO_PERFIL FOREIGN KEY (Perfil_Id) REFERENCES dbo.PERFIL(Perfil_Id),
    CONSTRAINT FK_PERFIL_PERMISSAO_PERMISSAO FOREIGN KEY (Permissao_Id) REFERENCES dbo.PERMISSAO(Permissao_Id),
    CONSTRAINT FK_PERFIL_PERMISSAO_TEMA FOREIGN KEY (Tema_Id) REFERENCES dbo.TEMA(Tema_Id)
);
GO

CREATE UNIQUE INDEX UX_PerfilPermissao_Global
ON dbo.PERFIL_PERMISSAO(Perfil_Id, Permissao_Id)
WHERE Tema_Id IS NULL;
GO
CREATE UNIQUE INDEX UX_PerfilPermissao_Tema
ON dbo.PERFIL_PERMISSAO(Perfil_Id, Permissao_Id, Tema_Id)
WHERE Tema_Id IS NOT NULL;
GO

/* 9. ARTIGO */
CREATE TABLE dbo.ARTIGO (
    Artigo_Id INT IDENTITY(1,1) NOT NULL,
    Titulo NVARCHAR(200) NOT NULL,
    Conteudo NVARCHAR(MAX) NOT NULL,
    Tema_Id INT NOT NULL,
    Usuario_Id UNIQUEIDENTIFIER NOT NULL,
    Revisor_Id UNIQUEIDENTIFIER NULL,
    Visibilidade NVARCHAR(20) NOT NULL CONSTRAINT DF_ARTIGO_Visibilidade DEFAULT 'PUBLICO',
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_ARTIGO_Status DEFAULT 'RASCUNHO',
    DataCriacao DATETIME2(0) NOT NULL CONSTRAINT DF_ARTIGO_DataCriacao DEFAULT SYSDATETIME(),
    DataAtualizacao DATETIME2(0) NULL,
    DataPublicacao DATETIME2(0) NULL,
    CONSTRAINT PK_ARTIGO PRIMARY KEY (Artigo_Id),
    CONSTRAINT FK_ARTIGO_TEMA FOREIGN KEY (Tema_Id) REFERENCES dbo.TEMA(Tema_Id),
    CONSTRAINT FK_ARTIGO_AUTOR FOREIGN KEY (Usuario_Id) REFERENCES dbo.USUARIO(Usuario_Id),
    CONSTRAINT FK_ARTIGO_REVISOR FOREIGN KEY (Revisor_Id) REFERENCES dbo.USUARIO(Usuario_Id),
    CONSTRAINT CK_ARTIGO_Visibilidade CHECK (Visibilidade IN ('PUBLICO', 'EXCLUSIVO')),
    CONSTRAINT CK_ARTIGO_Status CHECK (Status IN ('RASCUNHO', 'EM_REVISAO', 'APROVADO', 'REJEITADO', 'PUBLICADO', 'ARQUIVADO'))
);
GO


/* 10. REVISAO_ARTIGO: histórico das decisões de revisão */
CREATE TABLE dbo.REVISAO_ARTIGO (
    RevisaoArtigo_Id INT IDENTITY(1,1) NOT NULL,
    Artigo_Id INT NOT NULL,
    Usuario_Id UNIQUEIDENTIFIER NOT NULL,
    StatusAnterior NVARCHAR(20) NULL,
    StatusNovo NVARCHAR(30) NOT NULL,
    Comentario NVARCHAR(2000) NULL,
    DataRevisao DATETIME2(0) NOT NULL CONSTRAINT DF_REVISAO_ARTIGO_Data DEFAULT SYSDATETIME(),
    CONSTRAINT PK_REVISAO_ARTIGO PRIMARY KEY (RevisaoArtigo_Id),
    CONSTRAINT FK_REVISAO_ARTIGO_ARTIGO FOREIGN KEY (Artigo_Id) REFERENCES dbo.ARTIGO(Artigo_Id),
    CONSTRAINT FK_REVISAO_ARTIGO_USUARIO FOREIGN KEY (Usuario_Id) REFERENCES dbo.USUARIO(Usuario_Id),
    CONSTRAINT CK_REVISAO_ARTIGO_StatusAnterior CHECK (StatusAnterior IS NULL OR StatusAnterior IN ('RASCUNHO', 'EM_REVISAO', 'APROVADO', 'REJEITADO', 'PUBLICADO', 'ARQUIVADO')),
    CONSTRAINT CK_REVISAO_ARTIGO_StatusNovo CHECK (StatusNovo IN ('APROVADA', 'REJEITADA', 'AJUSTES_SOLICITADOS', 'RASCUNHO', 'EM_REVISAO', 'APROVADO', 'REJEITADO', 'PUBLICADO', 'ARQUIVADO'))
);
GO

/* 11. ARQUIVO_XML */
CREATE TABLE dbo.ARQUIVO_XML (
    ArquivoXml_Id INT IDENTITY(1,1) NOT NULL,
    Usuario_Id UNIQUEIDENTIFIER NOT NULL,
    NomeArquivo NVARCHAR(260) NOT NULL,
    CaminhoArquivo NVARCHAR(1000) NULL,
    HashArquivo NVARCHAR(128) NULL,
    ChaveAcesso NVARCHAR(44) NULL,
    StatusProcessamento NVARCHAR(20) NOT NULL CONSTRAINT DF_ARQUIVO_XML_Status DEFAULT 'PENDENTE',
    MensagemErro NVARCHAR(1000) NULL,
    DataEnvio DATETIME2(0) NOT NULL CONSTRAINT DF_ARQUIVO_XML_DataEnvio DEFAULT SYSDATETIME(),
    DataProcessamento DATETIME2(0) NULL,
    CONSTRAINT PK_ARQUIVO_XML PRIMARY KEY (ArquivoXml_Id),
    CONSTRAINT FK_ARQUIVO_XML_USUARIO FOREIGN KEY (Usuario_Id) REFERENCES dbo.USUARIO(Usuario_Id),
    CONSTRAINT CK_ARQUIVO_XML_Status CHECK (StatusProcessamento IN ('PENDENTE', 'PROCESSANDO', 'PROCESSADO', 'REJEITADO', 'ERRO')),
    CONSTRAINT CK_ARQUIVO_XML_ChaveAcesso CHECK (ChaveAcesso IS NULL OR (LEN(ChaveAcesso) = 44 AND ChaveAcesso NOT LIKE '%[^0-9]%'))
);
GO

/* 12. NOTA_FISCAL */
CREATE TABLE dbo.NOTA_FISCAL (
    NotaFiscal_Id INT IDENTITY(1,1) NOT NULL,
    ArquivoXml_Id INT NULL,
    Cliente_Id INT NOT NULL,
    ChaveAcesso NVARCHAR(44) NOT NULL,
    CNPJEmitente NVARCHAR(14) NOT NULL,
    CNPJDestinatario NVARCHAR(14) NOT NULL,
    Numero NVARCHAR(20) NULL,
    Serie NVARCHAR(10) NULL,
    DataEmissao DATETIME2(0) NULL,
    ValorTotal DECIMAL(18,2) NOT NULL CONSTRAINT DF_NOTA_FISCAL_Valor DEFAULT 0,
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_NOTA_FISCAL_Status DEFAULT 'VALIDADA',
    DataCadastro DATETIME2(0) NOT NULL CONSTRAINT DF_NOTA_FISCAL_DataCadastro DEFAULT SYSDATETIME(),
    CONSTRAINT PK_NOTA_FISCAL PRIMARY KEY (NotaFiscal_Id),
    CONSTRAINT UQ_NOTA_FISCAL_ChaveAcesso UNIQUE (ChaveAcesso),
    CONSTRAINT FK_NOTA_FISCAL_XML FOREIGN KEY (ArquivoXml_Id) REFERENCES dbo.ARQUIVO_XML(ArquivoXml_Id),
    CONSTRAINT FK_NOTA_FISCAL_CLIENTE FOREIGN KEY (Cliente_Id) REFERENCES dbo.CLIENTE(Cliente_Id),
    CONSTRAINT CK_NOTA_FISCAL_ChaveAcesso CHECK (LEN(ChaveAcesso) = 44 AND ChaveAcesso NOT LIKE '%[^0-9]%'),
    CONSTRAINT CK_NOTA_FISCAL_CNPJEmitente CHECK (
        LEN(CNPJEmitente) = 14
        AND CNPJEmitente COLLATE Latin1_General_100_BIN2 NOT LIKE '%[^0-9A-Z]%'
        AND RIGHT(CNPJEmitente, 2) COLLATE Latin1_General_100_BIN2 NOT LIKE '%[^0-9]%'
    ),
    CONSTRAINT CK_NOTA_FISCAL_CNPJDestinatario CHECK (
        LEN(CNPJDestinatario) = 14
        AND CNPJDestinatario COLLATE Latin1_General_100_BIN2 NOT LIKE '%[^0-9A-Z]%'
        AND RIGHT(CNPJDestinatario, 2) COLLATE Latin1_General_100_BIN2 NOT LIKE '%[^0-9]%'
    ),
    CONSTRAINT CK_NOTA_FISCAL_Valor CHECK (ValorTotal >= 0),
    CONSTRAINT CK_NOTA_FISCAL_Status CHECK (Status IN ('VALIDADA', 'CANCELADA', 'REJEITADA'))
);
GO

/* 13. ITEM_NOTA_FISCAL */
CREATE TABLE dbo.ITEM_NOTA_FISCAL (
    ItemNotaFiscal_Id INT IDENTITY(1,1) NOT NULL,
    NotaFiscal_Id INT NOT NULL,
    NumeroItem INT NOT NULL,
    CodigoProduto NVARCHAR(100) NULL,
    Descricao NVARCHAR(500) NOT NULL,
    Quantidade DECIMAL(18,4) NOT NULL,
    ValorUnitario DECIMAL(18,4) NOT NULL,
    ValorTotal DECIMAL(18,2) NOT NULL,
    CONSTRAINT PK_ITEM_NOTA_FISCAL PRIMARY KEY (ItemNotaFiscal_Id),
    CONSTRAINT FK_ITEM_NOTA_FISCAL_NOTA FOREIGN KEY (NotaFiscal_Id) REFERENCES dbo.NOTA_FISCAL(NotaFiscal_Id),
    CONSTRAINT UQ_ITEM_NOTA_FISCAL_Numero UNIQUE (NotaFiscal_Id, NumeroItem),
    CONSTRAINT CK_ITEM_NOTA_FISCAL_Numero CHECK (NumeroItem > 0),
    CONSTRAINT CK_ITEM_NOTA_FISCAL_Quantidade CHECK (Quantidade >= 0),
    CONSTRAINT CK_ITEM_NOTA_FISCAL_ValorUnitario CHECK (ValorUnitario >= 0),
    CONSTRAINT CK_ITEM_NOTA_FISCAL_ValorTotal CHECK (ValorTotal >= 0)
);
GO

/* 14. LOG_AUDITORIA */
CREATE TABLE dbo.LOG_AUDITORIA (
    LogAuditoria_Id BIGINT IDENTITY(1,1) NOT NULL,
    Usuario_Id UNIQUEIDENTIFIER NULL,
    Acao NVARCHAR(100) NOT NULL,
    Entidade NVARCHAR(100) NOT NULL,
    EntidadeId NVARCHAR(100) NULL,
    Detalhes NVARCHAR(MAX) NULL,
    EnderecoIP NVARCHAR(45) NULL,
    DataEvento DATETIME2(0) NOT NULL CONSTRAINT DF_LOG_AUDITORIA_Data DEFAULT SYSDATETIME(),
    CONSTRAINT PK_LOG_AUDITORIA PRIMARY KEY (LogAuditoria_Id),
    CONSTRAINT FK_LOG_AUDITORIA_USUARIO FOREIGN KEY (Usuario_Id) REFERENCES dbo.USUARIO(Usuario_Id)
);
GO

/* Índices para consultas comuns */
CREATE INDEX IX_USUARIO_PERFIL_Perfil ON dbo.USUARIO_PERFIL(Perfil_Id, Ativo);
CREATE INDEX IX_USUARIO_CLIENTE_Cliente ON dbo.USUARIO_CLIENTE(Cliente_Id, Ativo);
CREATE INDEX IX_ARTIGO_Tema_Status ON dbo.ARTIGO(Tema_Id, Status, Visibilidade);
CREATE INDEX IX_REVISAO_ARTIGO_Artigo_Data ON dbo.REVISAO_ARTIGO(Artigo_Id, DataRevisao DESC);
CREATE INDEX IX_ARQUIVO_XML_Usuario_Data ON dbo.ARQUIVO_XML(Usuario_Id, DataEnvio DESC);
CREATE INDEX IX_NOTA_FISCAL_Cliente_Data ON dbo.NOTA_FISCAL(Cliente_Id, DataEmissao DESC);
CREATE INDEX IX_LOG_AUDITORIA_Data ON dbo.LOG_AUDITORIA(DataEvento DESC);
GO


/* Dados iniciais: perfis */
INSERT INTO dbo.PERFIL (Nome, Descricao) VALUES
(N'Administrador', N'Administra clientes, usuários, perfis, temas e auditoria.'),
(N'Coordenador Fiscal', N'Coordena conteúdos e revisões fiscais.'),
(N'Analista SPED', N'Produz conteúdo e atua nos temas SPED.'),
(N'Analista de Documentos Fiscais', N'Atua em documentos fiscais eletrônicos.'),
(N'Analista de Reforma Tributaria', N'Atua em conteúdos de reforma tributária.'),
(N'Cliente', N'Consulta notas fiscais autorizadas para seu cliente.');
GO

/* Dados iniciais: temas */
INSERT INTO dbo.TEMA (Nome, Descricao) VALUES
(N'Reforma Tributaria', N'Conteúdos sobre reforma tributária.'),
(N'SPED EFD', N'Conteúdos sobre SPED EFD.'),
(N'EFD-Contribuicoes', N'Conteúdos sobre EFD-Contribuições.'),
(N'NF-e', N'Nota Fiscal eletrônica.'),
(N'NFP', N'Nota Fiscal de Produtor.'),
(N'XML', N'Arquivos e estruturas XML fiscais.');
GO

/* Dados iniciais: permissões */
INSERT INTO dbo.PERMISSAO (Codigo, Nome, Descricao) VALUES
(N'CONTEUDO_PUBLICO_LER', N'Ler conteúdo público', N'Permite consultar conteúdo público.'),
(N'CONTEUDO_EXCLUSIVO_LER', N'Ler conteúdo exclusivo', N'Permite consultar conteúdo exclusivo autorizado.'),
(N'ARTIGO_RASCUNHO_LER', N'Ler rascunhos', N'Permite consultar artigos em elaboração.'),
(N'ARTIGO_CRIAR', N'Criar artigo', N'Permite criar artigos.'),
(N'ARTIGO_EDITAR', N'Editar artigo', N'Permite editar artigos autorizados.'),
(N'ARTIGO_ENVIAR_REVISAO', N'Enviar para revisão', N'Permite encaminhar artigos para revisão.'),
(N'ARTIGO_APROVAR', N'Aprovar artigo', N'Permite aprovar artigos.'),
(N'ARTIGO_PUBLICAR', N'Publicar artigo', N'Permite publicar artigos aprovados.'),
(N'XML_ENVIAR', N'Enviar XML', N'Permite enviar arquivos XML fiscais.'),
(N'NOTA_FISCAL_LER_TODAS', N'Ler todas as notas', N'Permite consultar notas fiscais de todos os clientes, conforme autorização.'),
(N'NOTA_FISCAL_LER_PROPRIA', N'Ler notas do próprio cliente', N'Permite consultar notas do cliente vinculado.'),
(N'CLIENTE_GERENCIAR', N'Gerenciar clientes', N'Permite cadastrar e manter clientes.'),
(N'TEMA_GERENCIAR', N'Gerenciar temas', N'Permite gerenciar temas.'),
(N'USUARIO_PERFIL_GERENCIAR', N'Gerenciar usuários e perfis', N'Permite atribuir perfis a usuários.'),
(N'AUDITORIA_LER', N'Consultar auditoria', N'Permite consultar logs de auditoria.');
GO

/* Permissões globais básicas para todos os perfis cadastrados */
INSERT INTO dbo.PERFIL_PERMISSAO (Perfil_Id, Permissao_Id, Tema_Id)
SELECT p.Perfil_Id, pe.Permissao_Id, NULL
FROM dbo.PERFIL p
CROSS JOIN dbo.PERMISSAO pe
WHERE pe.Codigo IN ('CONTEUDO_PUBLICO_LER', 'CONTEUDO_EXCLUSIVO_LER');
GO

/* Administrador: gestão do sistema e auditoria */
INSERT INTO dbo.PERFIL_PERMISSAO (Perfil_Id, Permissao_Id, Tema_Id)
SELECT p.Perfil_Id, pe.Permissao_Id, NULL
FROM dbo.PERFIL p
CROSS JOIN dbo.PERMISSAO pe
WHERE p.Nome = N'Administrador'
  AND pe.Codigo IN ('CLIENTE_GERENCIAR', 'TEMA_GERENCIAR', 'USUARIO_PERFIL_GERENCIAR', 'AUDITORIA_LER');
GO

/* Coordenador Fiscal: fluxo completo de artigos, XML, notas e auditoria */
INSERT INTO dbo.PERFIL_PERMISSAO (Perfil_Id, Permissao_Id, Tema_Id)
SELECT p.Perfil_Id, pe.Permissao_Id, NULL
FROM dbo.PERFIL p
CROSS JOIN dbo.PERMISSAO pe
WHERE p.Nome = N'Coordenador Fiscal'
  AND pe.Codigo IN ('ARTIGO_RASCUNHO_LER', 'ARTIGO_CRIAR', 'ARTIGO_EDITAR', 'ARTIGO_ENVIAR_REVISAO', 'ARTIGO_APROVAR', 'ARTIGO_PUBLICAR', 'XML_ENVIAR', 'NOTA_FISCAL_LER_TODAS', 'AUDITORIA_LER');
GO


/* Analistas: enviar XML e consultar notas, além de permissões por tema */
INSERT INTO dbo.PERFIL_PERMISSAO (Perfil_Id, Permissao_Id, Tema_Id)
SELECT p.Perfil_Id, pe.Permissao_Id, NULL
FROM dbo.PERFIL p
CROSS JOIN dbo.PERMISSAO pe
WHERE p.Nome IN (N'Analista SPED', N'Analista de Documentos Fiscais', N'Analista de Reforma Tributaria')
  AND pe.Codigo IN ('XML_ENVIAR', 'NOTA_FISCAL_LER_TODAS');
GO

/* Analista SPED: SPED EFD e EFD-Contribuicoes */
INSERT INTO dbo.PERFIL_PERMISSAO (Perfil_Id, Permissao_Id, Tema_Id)
SELECT p.Perfil_Id, pe.Permissao_Id, t.Tema_Id
FROM dbo.PERFIL p
CROSS JOIN dbo.PERMISSAO pe
CROSS JOIN dbo.TEMA t
WHERE p.Nome = N'Analista SPED'
  AND pe.Codigo IN ('ARTIGO_RASCUNHO_LER', 'ARTIGO_CRIAR', 'ARTIGO_EDITAR', 'ARTIGO_ENVIAR_REVISAO')
  AND t.Nome IN (N'SPED EFD', N'EFD-Contribuicoes');
GO

/* Analista de Documentos Fiscais: NF-e, NFP e XML */
INSERT INTO dbo.PERFIL_PERMISSAO (Perfil_Id, Permissao_Id, Tema_Id)
SELECT p.Perfil_Id, pe.Permissao_Id, t.Tema_Id
FROM dbo.PERFIL p
CROSS JOIN dbo.PERMISSAO pe
CROSS JOIN dbo.TEMA t
WHERE p.Nome = N'Analista de Documentos Fiscais'
  AND pe.Codigo IN ('ARTIGO_RASCUNHO_LER', 'ARTIGO_CRIAR', 'ARTIGO_EDITAR', 'ARTIGO_ENVIAR_REVISAO')
  AND t.Nome IN (N'NF-e', N'NFP', N'XML');
GO

/* Analista de Reforma Tributaria: tema Reforma Tributaria */
INSERT INTO dbo.PERFIL_PERMISSAO (Perfil_Id, Permissao_Id, Tema_Id)
SELECT p.Perfil_Id, pe.Permissao_Id, t.Tema_Id
FROM dbo.PERFIL p
CROSS JOIN dbo.PERMISSAO pe
CROSS JOIN dbo.TEMA t
WHERE p.Nome = N'Analista de Reforma Tributaria'
  AND pe.Codigo IN ('ARTIGO_RASCUNHO_LER', 'ARTIGO_CRIAR', 'ARTIGO_EDITAR', 'ARTIGO_ENVIAR_REVISAO')
  AND t.Nome = N'Reforma Tributaria';
GO

/* Cliente: envia XML e consulta apenas notas próprias; a API deve validar o vínculo ativo */
INSERT INTO dbo.PERFIL_PERMISSAO (Perfil_Id, Permissao_Id, Tema_Id)
SELECT p.Perfil_Id, pe.Permissao_Id, NULL
FROM dbo.PERFIL p
CROSS JOIN dbo.PERMISSAO pe
WHERE p.Nome = N'Cliente'
  AND pe.Codigo IN ('XML_ENVIAR', 'NOTA_FISCAL_LER_PROPRIA');
GO

/* Verificação final: devem existir 14 tabelas principais */
SELECT COUNT(*) AS QuantidadeTabelasPrincipais
FROM sys.tables
WHERE name IN (
    'USUARIO', 'PERFIL', 'USUARIO_PERFIL', 'CLIENTE', 'USUARIO_CLIENTE',
    'TEMA', 'PERMISSAO', 'PERFIL_PERMISSAO', 'ARTIGO', 'REVISAO_ARTIGO',
    'ARQUIVO_XML', 'NOTA_FISCAL', 'ITEM_NOTA_FISCAL', 'LOG_AUDITORIA'
);
GO

SELECT * FROM dbo.USUARIO;