
USE IntegraCertacon;
GO

DECLARE @TemaId UNIQUEIDENTIFIER;
DECLARE @UsuarioId UNIQUEIDENTIFIER;

SELECT TOP 1 @TemaId = Tema_Id
FROM dbo.TEMA
ORDER BY Nome;

SELECT TOP 1 @UsuarioId = Usuario_Id
FROM dbo.USUARIO
ORDER BY DataCriacao;

IF @TemaId IS NULL OR @UsuarioId IS NULL
BEGIN
    PRINT 'Cadastre pelo menos um tema e um usuario antes de continuar.';
END
ELSE
BEGIN
    INSERT INTO dbo.ARTIGO
    (
        Tema_Id,
        AutorUsuario_Id,
        Titulo,
        Resumo,
        Conteudo,
        Visibilidade,
        Status,
        DataPublicacao
    )
    VALUES
    (
        @TemaId,
        @UsuarioId,
        'Artigo publico de teste',
        'Teste de conteudo publico.',
        'Este artigo pode ser consultado por visitantes e usuarios autenticados.',
        'PUBLICO',
        'PUBLICADO',
        SYSDATETIME()
    ),
    (
        @TemaId,
        @UsuarioId,
        'Artigo exclusivo de teste',
        'Teste de conteudo exclusivo.',
        'Este artigo pode ser consultado apenas por usuarios autenticados.',
        'EXCLUSIVO',
        'PUBLICADO',
        SYSDATETIME()
    ),
    (
        @TemaId,
        @UsuarioId,
        'Artigo em rascunho',
        'Teste de artigo ainda nao publicado.',
        'Este conteudo ainda esta em preparacao.',
        'PUBLICO',
        'RASCUNHO',
        NULL
    );

    PRINT 'Artigos de teste cadastrados.';
END;
GO




SELECT
    Titulo,
    Visibilidade,
    Status,
    DataPublicacao
FROM dbo.ARTIGO
ORDER BY DataCriacao DESC;




SELECT
    Artigo_Id,
    Titulo,
    Visibilidade,
    Status,
    AutorUsuario_Id
FROM dbo.ARTIGO;



SELECT
    Artigo_Id,
    Titulo,
    Visibilidade,
    Status,
    Tema_Id,
    AutorUsuario_Id
FROM dbo.ARTIGO
WHERE Visibilidade = 'EXCLUSIVO';



USE IntegraCertacon;
GO

EXEC sp_help 'dbo.USUARIO_PERFIL';
GO

EXEC sp_help 'dbo.PERFIL';
GO

EXEC sp_help 'dbo.USUARIO';
GO



SELECT *
FROM dbo.PERFIL;

SELECT *
FROM dbo.USUARIO;

SELECT *
FROM dbo.USUARIO_PERFIL;
