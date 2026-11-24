using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Models;

namespace ProjetoCertacon.Data;

public partial class IntegraCertaconContext : DbContext
{
    public IntegraCertaconContext(DbContextOptions<IntegraCertaconContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Artigo> Artigos { get; set; }

    public virtual DbSet<GlossarioFiscal> GlossarioFiscais { get; set; }

    public virtual DbSet<ItemNotaFiscal> ItemNotaFiscals { get; set; }

    public virtual DbSet<LogAuditorium> LogAuditoria { get; set; }

    public virtual DbSet<NotaFiscal> NotaFiscals { get; set; }

    public virtual DbSet<Perfil> Perfils { get; set; }

    public virtual DbSet<RevisaoArtigo> RevisaoArtigos { get; set; }

    public virtual DbSet<Tema> Temas { get; set; }

    public virtual DbSet<Usuario> Usuarios { get; set; }

    public virtual DbSet<UsuarioPerfil> UsuarioPerfils { get; set; }

    public virtual DbSet<FavoritoArtigo> FavoritoArtigos { get; set; }

    public virtual DbSet<HistoricoLeitura> HistoricoLeituras { get; set; }

    public virtual DbSet<ObrigacaoFiscal> ObrigacaoFiscais { get; set; }

    public virtual DbSet<CenarioTributario> CenarioTributarios { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        OnModelCreatingPartial(modelBuilder);
        modelBuilder.Entity<CenarioTributario>(entity =>
        {
            entity.HasKey(e => e.CenarioTributarioId)
                .HasName("PK_CENARIO_TRIBUTARIO");

            entity.ToTable("CENARIO_TRIBUTARIO", tabela =>
            {
                tabela.HasCheckConstraint(
                    "CK_CENARIO_TRIBUTARIO_NOME",
                    "LEN(LTRIM(RTRIM([Nome]))) > 0"
                );

                tabela.HasCheckConstraint(
                    "CK_CENARIO_TRIBUTARIO_ANO",
                    "[AnoReferencia] BETWEEN 2026 AND 2100"
                );

                tabela.HasCheckConstraint(
                    "CK_CENARIO_TRIBUTARIO_IBS_ESTADUAL",
                    "[AliquotaIBSEstadual] BETWEEN 0 AND 100"
                );

                tabela.HasCheckConstraint(
                    "CK_CENARIO_TRIBUTARIO_IBS_MUNICIPAL",
                    "[AliquotaIBSMunicipal] BETWEEN 0 AND 100"
                );

                tabela.HasCheckConstraint(
                    "CK_CENARIO_TRIBUTARIO_CBS",
                    "[AliquotaCBS] BETWEEN 0 AND 100"
                );
            });

            // =========================================
            // ÍNDICES
            // =========================================

            entity.HasIndex(
                e => new
                {
                    e.Nome,
                    e.AnoReferencia
                },
                "UQ_CENARIO_TRIBUTARIO_NOME_ANO"
            ).IsUnique();

            entity.HasIndex(
                e => new
                {
                    e.Ativo,
                    e.AnoReferencia
                },
                "IX_CENARIO_TRIBUTARIO_ATIVO_ANO"
            );

            // =========================================
            // PROPRIEDADES
            // =========================================

            entity.Property(e => e.CenarioTributarioId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("CenarioTributario_Id");

            entity.Property(e => e.AutorUsuarioId)
                .HasColumnName("AutorUsuario_Id");

            entity.Property(e => e.Nome)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(e => e.Descricao)
                .HasMaxLength(500);

            entity.Property(e => e.AnoReferencia)
                .IsRequired();

            entity.Property(e => e.AliquotaIBSEstadual)
                .HasPrecision(9, 6)
                .IsRequired();

            entity.Property(e => e.AliquotaIBSMunicipal)
                .HasPrecision(9, 6)
                .IsRequired();

            entity.Property(e => e.AliquotaCBS)
                .HasPrecision(9, 6)
                .IsRequired();

            entity.Property(e => e.Ativo)
                .HasDefaultValue(true);

            entity.Property(e => e.DataCriacao)
                .HasColumnType("datetime2")
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.Property(e => e.DataAtualizacao)
                .HasColumnType("datetime2");

            // =========================================
            // RELACIONAMENTO COM USUARIO
            // =========================================

            entity.HasOne(d => d.AutorUsuario)
                .WithMany(p => p.CenarioTributarios)
                .HasForeignKey(d => d.AutorUsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName(
                    "FK_CENARIO_TRIBUTARIO_USUARIO"
                );
        });

        OnModelCreatingPartial(modelBuilder);
        modelBuilder.Entity<ObrigacaoFiscal>(entity =>
        {
            entity.HasKey(e => e.ObrigacaoFiscalId)
                .HasName("PK_OBRIGACAO_FISCAL");

            entity.ToTable("OBRIGACAO_FISCAL", tabela =>
            {
                tabela.HasCheckConstraint(
                    "CK_OBRIGACAO_FISCAL_TITULO",
                    "LEN(LTRIM(RTRIM([Titulo]))) > 0"
                );

                tabela.HasCheckConstraint(
                    "CK_OBRIGACAO_FISCAL_DESCRICAO",
                    "LEN(LTRIM(RTRIM([Descricao]))) > 0"
                );

                tabela.HasCheckConstraint(
                    "CK_OBRIGACAO_FISCAL_COMPETENCIA",
                    "[Competencia] IS NULL OR DAY([Competencia]) = 1"
                );
            });

            // =========================================
            // ÍNDICES
            // =========================================

            entity.HasIndex(
                e => new
                {
                    e.Ativo,
                    e.DataVencimento
                },
                "IX_OBRIGACAO_FISCAL_ATIVO_VENCIMENTO"
            );

            entity.HasIndex(
                e => new
                {
                    e.TemaId,
                    e.DataVencimento
                },
                "IX_OBRIGACAO_FISCAL_TEMA_VENCIMENTO"
            );

            // =========================================
            // PROPRIEDADES
            // =========================================

            entity.Property(e => e.ObrigacaoFiscalId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("ObrigacaoFiscal_Id");

            entity.Property(e => e.AutorUsuarioId)
                .HasColumnName("AutorUsuario_Id");

            entity.Property(e => e.TemaId)
                .HasColumnName("Tema_Id");

            entity.Property(e => e.Titulo)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(e => e.Descricao)
                .HasColumnType("nvarchar(max)")
                .IsRequired();

            entity.Property(e => e.DataVencimento)
                .HasColumnType("date");

            entity.Property(e => e.Competencia)
                .HasColumnType("date");

            entity.Property(e => e.Ativo)
                .HasDefaultValue(true);

            entity.Property(e => e.DataCriacao)
                .HasColumnType("datetime2")
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.Property(e => e.DataAtualizacao)
                .HasColumnType("datetime2");

            // =========================================
            // RELACIONAMENTO COM USUARIO
            // =========================================

            entity.HasOne(d => d.AutorUsuario)
                .WithMany(p => p.ObrigacaoFiscais)
                .HasForeignKey(d => d.AutorUsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName(
                    "FK_OBRIGACAO_FISCAL_USUARIO"
                );

            // =========================================
            // RELACIONAMENTO COM TEMA
            // =========================================

            entity.HasOne(d => d.Tema)
                .WithMany(p => p.ObrigacaoFiscais)
                .HasForeignKey(d => d.TemaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName(
                    "FK_OBRIGACAO_FISCAL_TEMA"
                );
        });
        modelBuilder.Entity<FavoritoArtigo>(entity =>
        {
            entity.HasKey(e => e.FavoritoArtigoId)
                .HasName("PK_FAVORITO_ARTIGO");

            entity.ToTable("FAVORITO_ARTIGO");

            entity.HasIndex(
                e => new { e.UsuarioId, e.ArtigoId },
                "UQ_FAVORITO_ARTIGO")
                .IsUnique();

            entity.HasIndex(
                e => new { e.UsuarioId, e.DataCriacao },
                "IX_FAVORITO_ARTIGO_USUARIO_DATA")
                .IsDescending(false, true);

            entity.Property(e => e.FavoritoArtigoId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("FavoritoArtigo_Id");

            entity.Property(e => e.UsuarioId)
                .HasColumnName("Usuario_Id");

            entity.Property(e => e.ArtigoId)
                .HasColumnName("Artigo_Id");

            entity.Property(e => e.DataCriacao)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Usuario)
                .WithMany(p => p.FavoritoArtigos)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_FAVORITO_ARTIGO_USUARIO");

            entity.HasOne(d => d.Artigo)
                .WithMany(p => p.FavoritoArtigos)
                .HasForeignKey(d => d.ArtigoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_FAVORITO_ARTIGO_ARTIGO");
        });
        modelBuilder.Entity<HistoricoLeitura>(entity =>
        {
            entity.HasKey(e => e.HistoricoLeituraId)
                .HasName("PK_HISTORICO_LEITURA");

            entity.ToTable("HISTORICO_LEITURA", tabela =>
            {
                tabela.HasCheckConstraint(
                    "CK_HISTORICO_LEITURA_QUANTIDADE",
                    "[QuantidadeAcessos] >= 1");
            });

            entity.HasIndex(
                e => new { e.UsuarioId, e.ArtigoId },
                "UQ_HISTORICO_LEITURA")
                .IsUnique();

            entity.HasIndex(
                e => new { e.UsuarioId, e.DataUltimoAcesso },
                "IX_HISTORICO_LEITURA_USUARIO_DATA")
                .IsDescending(false, true);

            entity.Property(e => e.HistoricoLeituraId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("HistoricoLeitura_Id");

            entity.Property(e => e.UsuarioId)
                .HasColumnName("Usuario_Id");

            entity.Property(e => e.ArtigoId)
                .HasColumnName("Artigo_Id");

            entity.Property(e => e.DataPrimeiroAcesso)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.Property(e => e.DataUltimoAcesso)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.Property(e => e.QuantidadeAcessos)
                .HasDefaultValue(1);

            entity.HasOne(d => d.Usuario)
                .WithMany(p => p.HistoricoLeituras)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HISTORICO_LEITURA_USUARIO");

            entity.HasOne(d => d.Artigo)
                .WithMany(p => p.HistoricoLeituras)
                .HasForeignKey(d => d.ArtigoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HISTORICO_LEITURA_ARTIGO");
        });
        modelBuilder.Entity<Artigo>(entity =>
        {
            entity.ToTable("ARTIGO");

            entity.HasIndex(e => e.AutorUsuarioId, "IX_ARTIGO_AutorUsuario_Id");

            entity.HasIndex(e => e.TemaId, "IX_ARTIGO_Tema_Id");

            entity.Property(e => e.ArtigoId)
                .HasDefaultValueSql("(newid())", "DF_ARTIGO_Id")
                .HasColumnName("Artigo_Id");
            entity.Property(e => e.AutorUsuarioId).HasColumnName("AutorUsuario_Id");
            entity.Property(e => e.DataCriacao).HasDefaultValueSql("(sysdatetime())", "DF_ARTIGO_DataCriacao");
            entity.Property(e => e.Resumo).HasMaxLength(500);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("RASCUNHO", "DF_ARTIGO_Status");
            entity.Property(e => e.TemaId).HasColumnName("Tema_Id");
            entity.Property(e => e.Titulo).HasMaxLength(200);
            entity.Property(e => e.Visibilidade)
                .HasMaxLength(20)
                .HasDefaultValue("PUBLICO", "DF_ARTIGO_Visibilidade");

            entity.HasOne(d => d.AutorUsuario).WithMany(p => p.Artigos)
                .HasForeignKey(d => d.AutorUsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ARTIGO_USUARIO");

            entity.HasOne(d => d.Tema).WithMany(p => p.Artigos)
                .HasForeignKey(d => d.TemaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ARTIGO_TEMA");
        });

        modelBuilder.Entity<ItemNotaFiscal>(entity =>
        {
            entity.ToTable("ITEM_NOTA_FISCAL");

            entity.HasIndex(e => e.NotaFiscalId, "IX_ITEM_NOTA_FISCAL_NotaFiscal_Id");

            entity.HasIndex(e => new { e.NotaFiscalId, e.NumeroItem }, "UQ_ITEM_NOTA_FISCAL").IsUnique();

            entity.Property(e => e.ItemNotaFiscalId)
                .HasDefaultValueSql("(newid())", "DF_ITEM_NOTA_FISCAL_Id")
                .HasColumnName("ItemNotaFiscal_Id");
            entity.Property(e => e.Cfop)
                .HasMaxLength(10)
                .HasColumnName("CFOP");
            entity.Property(e => e.CodigoProduto).HasMaxLength(60);
            entity.Property(e => e.Descricao).HasMaxLength(300);
            entity.Property(e => e.Ncm)
                .HasMaxLength(10)
                .HasColumnName("NCM");
            entity.Property(e => e.NotaFiscalId).HasColumnName("NotaFiscal_Id");
            entity.Property(e => e.Quantidade).HasColumnType("decimal(18, 4)");
            entity.Property(e => e.ValorTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.ValorUnitario).HasColumnType("decimal(18, 4)");

            entity.HasOne(d => d.NotaFiscal).WithMany(p => p.ItemNotaFiscals)
                .HasForeignKey(d => d.NotaFiscalId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ITEM_NOTA_FISCAL_NOTA_FISCAL");
        });

        modelBuilder.Entity<LogAuditorium>(entity =>
        {
            entity.HasKey(e => e.LogAuditoriaId);

            entity.ToTable("LOG_AUDITORIA");

            entity.HasIndex(e => e.DataHora, "IX_LOG_AUDITORIA_DataHora");

            entity.HasIndex(e => e.UsuarioId, "IX_LOG_AUDITORIA_Usuario_Id");

            entity.Property(e => e.LogAuditoriaId)
                .HasDefaultValueSql("(newid())", "DF_LOG_AUDITORIA_Id")
                .HasColumnName("LogAuditoria_Id");
            entity.Property(e => e.Acao).HasMaxLength(100);
            entity.Property(e => e.DataHora).HasDefaultValueSql("(sysdatetime())", "DF_LOG_AUDITORIA_DataHora");
            entity.Property(e => e.EnderecoIp)
                .HasMaxLength(45)
                .HasColumnName("EnderecoIP");
            entity.Property(e => e.RegistroId).HasColumnName("Registro_Id");
            entity.Property(e => e.TabelaAfetada).HasMaxLength(100);
            entity.Property(e => e.UsuarioId).HasColumnName("Usuario_Id");

            entity.HasOne(d => d.Usuario).WithMany(p => p.LogAuditoria)
                .HasForeignKey(d => d.UsuarioId)
                .HasConstraintName("FK_LOG_AUDITORIA_USUARIO");
        });

        modelBuilder.Entity<NotaFiscal>(entity =>
        {
            entity.ToTable("NOTA_FISCAL");

            entity.HasIndex(e => e.UsuarioId, "IX_NOTA_FISCAL_Usuario_Id");

            entity.HasIndex(e => e.ChaveAcesso, "UQ_NOTA_FISCAL_ChaveAcesso").IsUnique();

            entity.Property(e => e.NotaFiscalId)
                .HasDefaultValueSql("(newid())", "DF_NOTA_FISCAL_Id")
                .HasColumnName("NotaFiscal_Id");
            entity.Property(e => e.CaminhoArquivo).HasMaxLength(500);
            entity.Property(e => e.ChaveAcesso).HasMaxLength(44);
            entity.Property(e => e.Cnpjdestinatario)
                .HasMaxLength(14)
                .HasColumnName("CNPJDestinatario");
            entity.Property(e => e.Cnpjemitente)
                .HasMaxLength(14)
                .HasColumnName("CNPJEmitente");
            entity.Property(e => e.DataEnvio).HasDefaultValueSql("(sysdatetime())", "DF_NOTA_FISCAL_DataEnvio");
            entity.Property(e => e.Numero).HasMaxLength(30);
            entity.Property(e => e.Serie).HasMaxLength(10);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("IMPORTADA", "DF_NOTA_FISCAL_Status");
            entity.Property(e => e.UsuarioId).HasColumnName("Usuario_Id");
            entity.Property(e => e.ValorTotal).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Usuario).WithMany(p => p.NotaFiscals)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_NOTA_FISCAL_USUARIO");
        });

        modelBuilder.Entity<Perfil>(entity =>
        {
            entity.ToTable("PERFIL");

            entity.HasIndex(e => e.Nome, "UQ_PERFIL_Nome").IsUnique();

            entity.Property(e => e.PerfilId)
                .HasDefaultValueSql("(newid())", "DF_PERFIL_Id")
                .HasColumnName("Perfil_Id");
            entity.Property(e => e.Ativo).HasDefaultValue(true, "DF_PERFIL_Ativo");
            entity.Property(e => e.DataCriacao).HasDefaultValueSql("(sysdatetime())", "DF_PERFIL_DataCriacao");
            entity.Property(e => e.Descricao).HasMaxLength(300);
            entity.Property(e => e.Nome).HasMaxLength(100);
        });

        modelBuilder.Entity<RevisaoArtigo>(entity =>
        {
            entity.ToTable("REVISAO_ARTIGO");

            entity.HasIndex(e => e.ArtigoId, "IX_REVISAO_ARTIGO_Artigo_Id");

            entity.Property(e => e.RevisaoArtigoId)
                .HasDefaultValueSql("(newid())", "DF_REVISAO_ARTIGO_Id")
                .HasColumnName("RevisaoArtigo_Id");
            entity.Property(e => e.ArtigoId).HasColumnName("Artigo_Id");
            entity.Property(e => e.DataRevisao).HasDefaultValueSql("(sysdatetime())", "DF_REVISAO_ARTIGO_Data");
            entity.Property(e => e.Status).HasMaxLength(30);
            entity.Property(e => e.StatusAnterior).HasMaxLength(30);
            entity.Property(e => e.StatusNovo).HasMaxLength(30);
            entity.Property(e => e.UsuarioId).HasColumnName("Usuario_Id");

            entity.HasOne(d => d.Artigo).WithMany(p => p.RevisaoArtigos)
                .HasForeignKey(d => d.ArtigoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_REVISAO_ARTIGO_ARTIGO");

            entity.HasOne(d => d.Usuario).WithMany(p => p.RevisaoArtigos)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_REVISAO_ARTIGO_USUARIO");
        });

        modelBuilder.Entity<Tema>(entity =>
        {
            entity.ToTable("TEMA");

            entity.HasIndex(e => e.Nome, "UQ_TEMA_Nome").IsUnique();

            entity.Property(e => e.TemaId)
                .HasDefaultValueSql("(newid())", "DF_TEMA_Id")
                .HasColumnName("Tema_Id");
            entity.Property(e => e.Ativo).HasDefaultValue(true, "DF_TEMA_Ativo");
            entity.Property(e => e.DataCriacao).HasDefaultValueSql("(sysdatetime())", "DF_TEMA_DataCriacao");
            entity.Property(e => e.Descricao).HasMaxLength(400);
            entity.Property(e => e.Nome).HasMaxLength(150);
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("USUARIO");

            entity.HasIndex(e => e.Email, "UQ_USUARIO_Email").IsUnique();

            entity.Property(e => e.UsuarioId)
                .HasDefaultValueSql("(newid())", "DF_USUARIO_Id")
                .HasColumnName("Usuario_Id");
            entity.Property(e => e.Ativo).HasDefaultValue(true, "DF_USUARIO_Ativo");
            entity.Property(e => e.Cnpj)
                .HasMaxLength(14)
                .HasColumnName("CNPJ");
            entity.Property(e => e.DataCriacao).HasDefaultValueSql("(sysdatetime())", "DF_USUARIO_DataCriacao");
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.Nome).HasMaxLength(150);
            entity.Property(e => e.RazaoSocial).HasMaxLength(200);
            entity.Property(e => e.SenhaHash).HasMaxLength(500);
            entity.Property(e => e.TelefoneContato).HasMaxLength(30);
        });

        modelBuilder.Entity<UsuarioPerfil>(entity =>
        {
            entity.ToTable("USUARIO_PERFIL");

            entity.HasIndex(e => new { e.UsuarioId, e.PerfilId }, "UQ_USUARIO_PERFIL").IsUnique();

            entity.Property(e => e.UsuarioPerfilId)
                .HasDefaultValueSql("(newid())", "DF_USUARIO_PERFIL_Id")
                .HasColumnName("UsuarioPerfil_Id");
            entity.Property(e => e.DataAtribuicao).HasDefaultValueSql("(sysdatetime())", "DF_USUARIO_PERFIL_Data");
            entity.Property(e => e.PerfilId).HasColumnName("Perfil_Id");
            entity.Property(e => e.UsuarioId).HasColumnName("Usuario_Id");

            entity.HasOne(d => d.Perfil).WithMany(p => p.UsuarioPerfils)
                .HasForeignKey(d => d.PerfilId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_USUARIO_PERFIL_PERFIL");

            entity.HasOne(d => d.Usuario).WithMany(p => p.UsuarioPerfils)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_USUARIO_PERFIL_USUARIO");
        });
        modelBuilder.Entity<GlossarioFiscal>(entity =>
        {
            entity.HasKey(e => e.GlossarioFiscalId)
                .HasName("PK_GLOSSARIO_FISCAL");

            entity.ToTable("GLOSSARIO_FISCAL");

            entity.HasIndex(e => e.Termo, "UQ_GLOSSARIO_FISCAL_TERMO")
                .IsUnique();

            entity.Property(e => e.GlossarioFiscalId)
                .HasDefaultValueSql("(newsequentialid())")
                .HasColumnName("GlossarioFiscal_Id");

            entity.Property(e => e.AutorUsuarioId)
                .HasColumnName("AutorUsuario_Id");

            entity.Property(e => e.Termo)
                .HasMaxLength(100);

            entity.Property(e => e.Significado)
                .HasMaxLength(250);

            entity.Property(e => e.Descricao)
                .HasColumnType("nvarchar(max)");

            entity.Property(e => e.Ativo)
                .HasDefaultValue(true);

            entity.Property(e => e.DataCriacao)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.AutorUsuario)
                .WithMany(p => p.GlossarioFiscais)
                .HasForeignKey(d => d.AutorUsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_GLOSSARIO_FISCAL_USUARIO");
        });
        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
