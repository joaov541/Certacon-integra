
USE IntegraCertacon;
GO

DECLARE @UsuarioId UNIQUEIDENTIFIER;
DECLARE @PerfilId UNIQUEIDENTIFIER;

SELECT @UsuarioId = Usuario_Id
FROM dbo.USUARIO
WHERE Email = 'admin@integra.local';

SELECT @PerfilId = Perfil_Id
FROM dbo.PERFIL
WHERE Nome = 'Administrador';

IF @UsuarioId IS NOT NULL AND @PerfilId IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM dbo.USUARIO_PERFIL
        WHERE Usuario_Id = @UsuarioId
          AND Perfil_Id = @PerfilId
    )
    BEGIN
        INSERT INTO dbo.USUARIO_PERFIL
            (Usuario_Id, Perfil_Id)
        VALUES
            (@UsuarioId, @PerfilId);

        PRINT 'Perfil Administrador associado ao usuario.';
    END
    ELSE
    BEGIN
        PRINT 'O usuario ja possui esse perfil.';
    END
END
ELSE
BEGIN
    PRINT 'Usuario ou perfil nao encontrado.';
END;
GO









SELECT
    U.Nome AS Usuario,
    U.Email,
    P.Nome AS Perfil,
    UP.DataAtribuicao
FROM dbo.USUARIO_PERFIL UP
INNER JOIN dbo.USUARIO U
    ON U.Usuario_Id = UP.Usuario_Id
INNER JOIN dbo.PERFIL P
    ON P.Perfil_Id = UP.Perfil_Id;



    
SELECT
    Titulo,
    Visibilidade,
    Status,
    AutorUsuario_Id,
    Tema_Id
FROM dbo.ARTIGO
ORDER BY DataCriacao DESC;



SELECT Artigo_Id, Titulo, Status
FROM dbo.ARTIGO
WHERE Status = 'RASCUNHO';

USE IntegraCertacon;
GO

SELECT
    Artigo_Id,
    Titulo,
    Status,
    Visibilidade,
    DataAtualizacao,
    DataPublicacao
FROM dbo.ARTIGO
ORDER BY DataCriacao DESC;

SELECT
    Artigo_Id,
    Titulo,
    Status,
    DataPublicacao
FROM dbo.ARTIGO
WHERE Artigo_Id = 'E7576BC0-F189-4A4B-8708-225C7725EDC3';

SELECT
    u.Nome,
    u.Email,
    p.Nome AS Perfil
FROM dbo.USUARIO u
INNER JOIN dbo.USUARIO_PERFIL up
    ON up.Usuario_Id = u.Usuario_Id
INNER JOIN dbo.PERFIL p
    ON p.Perfil_Id = up.Perfil_Id
ORDER BY u.Nome;

SELECT *
FROM dbo.PERFIL;
GO


SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'PERFIL'
ORDER BY ORDINAL_POSITION;
GO


SELECT
    u.Nome,
    u.Email,
    p.Nome AS Perfil,
    u.Ativo
FROM dbo.USUARIO u
INNER JOIN dbo.USUARIO_PERFIL up
    ON up.Usuario_Id = u.Usuario_Id
INNER JOIN dbo.PERFIL p
    ON p.Perfil_Id = up.Perfil_Id
ORDER BY p.Nome;


SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'ARTIGO';


SELECT
    Artigo_Id,
    Titulo,
    Status,
    Visibilidade
FROM dbo.ARTIGO
WHERE Status = 'RASCUNHO';


USE IntegraCertacon;
GO

SELECT
    Artigo_Id,
    Titulo,
    Status,
    Visibilidade,
    DataCriacao
FROM dbo.ARTIGO
WHERE Status = 'RASCUNHO'
ORDER BY DataCriacao DESC;




SELECT
    Artigo_Id,
    Titulo,
    Status
FROM dbo.ARTIGO
WHERE Artigo_Id = '366D6CFD-71B5-42FB-B094-B160D7BF0BCE';



USE IntegraCertacon;
GO

SELECT
    Artigo_Id,
    Titulo,
    Status,
    DataAtualizacao
FROM dbo.ARTIGO
WHERE Artigo_Id = '366D6CFD-71B5-42FB-B094-B160D7BF0BCE';



SELECT
    Artigo_Id,
    Titulo,
    Status,
    DataPublicacao
FROM dbo.ARTIGO
WHERE Artigo_Id = '366D6CFD-71B5-42FB-B094-B160D7BF0BCE';


SELECT
    NotaFiscal_Id,
    Usuario_Id,
    Numero,
    Status,
    ValorTotal
FROM dbo.NOTA_FISCAL;





SELECT
    Usuario_Id,
    Nome,
    Email
FROM dbo.USUARIO
WHERE Email = 'cliente@integra.local';


DECLARE @UsuarioId UNIQUEIDENTIFIER =
    'D47E14EF-DF9E-4BFE-BB5D-48ED4FC9A5F4';

DECLARE @NotaFiscalId UNIQUEIDENTIFIER = NEWID();

INSERT INTO dbo.NOTA_FISCAL
(
    NotaFiscal_Id,
    Usuario_Id,
    Numero,
    Serie,
    ChaveAcesso,
    CNPJEmitente,
    CNPJDestinatario,
    DataEmissao,
    ValorTotal,
    Status,
    CaminhoArquivo,
    DataEnvio
)
VALUES
(
    @NotaFiscalId,
    @UsuarioId,
    '1001',
    '1',
    NULL,
    '12345678000195',
    '98765432000110',
    GETDATE(),
    150.00,
    'PROCESSADO',
    NULL,
    GETDATE()
);




SELECT
    name AS Restricao,
    definition AS ValoresPermitidos
FROM sys.check_constraints
WHERE name = 'CK_NOTA_FISCAL_Status';





USE IntegraCertacon;
GO

DECLARE @UsuarioId UNIQUEIDENTIFIER;
DECLARE @NotaFiscalId UNIQUEIDENTIFIER = NEWID();

SELECT @UsuarioId = Usuario_Id
FROM dbo.USUARIO
WHERE Email = 'cliente@integra.local';

IF @UsuarioId IS NULL
BEGIN
    PRINT 'Cliente nao encontrado.';
    RETURN;
END;

INSERT INTO dbo.NOTA_FISCAL
(
    NotaFiscal_Id,
    Usuario_Id,
    Numero,
    Serie,
    ChaveAcesso,
    CNPJEmitente,
    CNPJDestinatario,
    DataEmissao,
    ValorTotal,
    Status,
    CaminhoArquivo,
    DataEnvio
)
VALUES
(
    @NotaFiscalId,
    @UsuarioId,
    '1001',
    '1',
    NULL,
    '12345678000195',
    '98765432000110',
    GETDATE(),
    150.00,
    'IMPORTADA',
    NULL,
    GETDATE()
);

INSERT INTO dbo.ITEM_NOTA_FISCAL
(
    ItemNotaFiscal_Id,
    NotaFiscal_Id,
    NumeroItem,
    CodigoProduto,
    Descricao,
    NCM,
    CFOP,
    Quantidade,
    ValorUnitario,
    ValorTotal
)
VALUES
(
    NEWID(),
    @NotaFiscalId,
    1,
    'PROD001',
    'Produto de teste',
    '00000000',
    '5102',
    2,
    50.00,
    100.00
),
(
    NEWID(),
    @NotaFiscalId,
    2,
    'PROD002',
    'Material de escritorio',
    '00000000',
    '5102',
    1,
    50.00,
    50.00
);

SELECT
    @NotaFiscalId AS NotaFiscalId,
    @UsuarioId AS UsuarioId;
GO




USE IntegraCertacon;
GO

SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME LIKE '%Auditoria%';


SELECT TOP 10 *
FROM dbo.LOG_AUDITORIA
ORDER BY DataHora DESC;




USE IntegraCertacon;
GO

SELECT
    COLUMN_NAME,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'LOG_AUDITORIA'
ORDER BY ORDINAL_POSITION;



USE IntegraCertacon;
GO

SELECT TOP 10
    LogAuditoria_Id,
    Usuario_Id,
    Acao,
    TabelaAfetada,
    Registro_Id,
    EnderecoIP,
    Detalhes,
    DataHora
FROM dbo.LOG_AUDITORIA
WHERE Acao = 'ARTIGO_APROVADO'
ORDER BY DataHora DESC;



SELECT
    Artigo_Id,
    Titulo,
    Status
FROM dbo.ARTIGO
WHERE Status = 'APROVADO';



USE IntegraCertacon;
GO

SELECT TOP 10
    LogAuditoria_Id,
    Usuario_Id,
    Acao,
    TabelaAfetada,
    Registro_Id,
    EnderecoIP,
    Detalhes,
    DataHora
FROM dbo.LOG_AUDITORIA
WHERE Acao = 'ARTIGO_PUBLICADO'
ORDER BY DataHora DESC;





SELECT TOP 10
    LogAuditoria_Id,
    Usuario_Id,
    Acao,
    TabelaAfetada,
    Registro_Id,
    Detalhes,
    DataHora
FROM dbo.LOG_AUDITORIA
WHERE Acao = 'ARTIGO_REJEITADO'
ORDER BY DataHora DESC;




SELECT TOP 10 *
FROM dbo.LOG_AUDITORIA
WHERE Acao = 'ARTIGO_REJEITADO'
ORDER BY DataHora DESC;



SELECT TOP 10 *
FROM dbo.LOG_AUDITORIA
WHERE Acao = 'ARTIGO_AJUSTES_SOLICITADOS'
ORDER BY DataHora DESC;



USE IntegraCertacon;
GO

SELECT TOP 10
    NotaFiscal_Id,
    Usuario_Id,
    Numero,
    Serie,
    ChaveAcesso,
    Status,
    CaminhoArquivo,
    DataEnvio
FROM dbo.NOTA_FISCAL
ORDER BY DataEnvio DESC;


SELECT
    n.Numero,
    n.ChaveAcesso,
    COUNT(i.ItemNotaFiscal_Id) AS QuantidadeItens
FROM dbo.NOTA_FISCAL n
LEFT JOIN dbo.ITEM_NOTA_FISCAL i
    ON i.NotaFiscal_Id = n.NotaFiscal_Id
GROUP BY
    n.Numero,
    n.ChaveAcesso
ORDER BY n.Numero;




SELECT *
FROM dbo.NOTA_FISCAL
WHERE Numero = '1001';


SELECT *
FROM dbo.ITEM_NOTA_FISCAL
WHERE NotaFiscal_Id = '7BF73295-2975-4758-8C13-0F9B4159BB96';



SELECT
    NotaFiscal_Id,
    Numero,
    ChaveAcesso,
    ValorTotal,
    Status,
    CaminhoArquivo
FROM dbo.NOTA_FISCAL
WHERE NotaFiscal_Id =
    '3A4CE39C-4C2A-4F43-843A-A04FDFD0E7DB';



    SELECT *
FROM dbo.ITEM_NOTA_FISCAL
WHERE NotaFiscal_Id =
    '3A4CE39C-4C2A-4F43-843A-A04FDFD0E7DB';




    SELECT
    Numero,
    ChaveAcesso,
    CaminhoArquivo,
    Status
FROM dbo.NOTA_FISCAL
WHERE CaminhoArquivo IS NOT NULL;



SELECT *
FROM dbo.NOTA_FISCAL
ORDER BY DataEnvio DESC;


SELECT TOP 5
    Numero,
    ChaveAcesso,
    Status,
    DataEnvio
FROM dbo.NOTA_FISCAL
ORDER BY DataEnvio DESC;





USE IntegraCertacon;
GO

SELECT
    NotaFiscal_Id,
    Numero,
    ChaveAcesso,
    CaminhoArquivo
FROM dbo.NOTA_FISCAL
ORDER BY Numero;





USE IntegraCertacon;
GO

SELECT
    n.Numero,
    n.ChaveAcesso,
    i.*
FROM dbo.NOTA_FISCAL n
LEFT JOIN dbo.ITEM_NOTA_FISCAL i
    ON i.ItemNotaFiscal_Id = n.NotaFiscal_Id
ORDER BY n.Numero;




USE IntegraCertacon;
GO

SELECT
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('NOTA_FISCAL', 'ITEM_NOTA_FISCAL')
ORDER BY TABLE_NAME, ORDINAL_POSITION;




USE IntegraCertacon;
GO

SELECT
    n.Numero,
    n.ChaveAcesso,
    i.NumeroItem,
    i.CodigoProduto,
    i.Descricao,
    i.Quantidade,
    i.ValorUnitario,
    i.ValorTotal
FROM dbo.NOTA_FISCAL n
LEFT JOIN dbo.ITEM_NOTA_FISCAL i
    ON i.NotaFiscal_Id = n.NotaFiscal_Id
ORDER BY n.Numero, i.NumeroItem;





SELECT
    Numero,
    ChaveAcesso,
    CaminhoArquivo
FROM dbo.NOTA_FISCAL
WHERE CaminhoArquivo IS NOT NULL;




SELECT
    ChaveAcesso,
    COUNT(*) AS Quantidade
FROM dbo.NOTA_FISCAL
WHERE ChaveAcesso IS NOT NULL
GROUP BY ChaveAcesso
HAVING COUNT(*) > 1;




CREATE UNIQUE INDEX IX_NOTA_FISCAL_ChaveAcesso
ON dbo.NOTA_FISCAL (ChaveAcesso)
WHERE ChaveAcesso IS NOT NULL;
GO




SELECT
    Numero,
    ChaveAcesso,
    CaminhoArquivo,
    Status
FROM dbo.NOTA_FISCAL
WHERE ChaveAcesso =
    '35261012345678000195550010000000011000000011';



    SELECT
    n.Numero,
    i.NumeroItem,
    i.Descricao,
    i.Quantidade,
    i.ValorUnitario,
    i.ValorTotal
FROM dbo.NOTA_FISCAL n
INNER JOIN dbo.ITEM_NOTA_FISCAL i
    ON n.NotaFiscal_Id = i.NotaFiscal_Id
WHERE n.ChaveAcesso =
    '35261012345678000195550010000000011000000011';