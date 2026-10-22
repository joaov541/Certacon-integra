
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
