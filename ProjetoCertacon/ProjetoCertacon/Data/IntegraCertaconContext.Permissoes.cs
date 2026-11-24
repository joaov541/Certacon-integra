using Microsoft.EntityFrameworkCore;
using ProjetoCertacon.Models;

namespace ProjetoCertacon.Data;

public partial class IntegraCertaconContext
{
    public virtual DbSet<Permissao> Permissoes { get; set; }

    public virtual DbSet<PerfilPermissao> PerfilPermissoes { get; set; }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder)
    {
        // =========================================
        // TABELA PERMISSAO
        // =========================================

        modelBuilder.Entity<Permissao>(entity =>
        {
            entity.HasKey(e => e.PermissaoId)
                .HasName("PK_PERMISSAO");

            entity.ToTable("PERMISSAO", "dbo");

            entity.HasAlternateKey(e => e.Codigo)
                .HasName("UQ_PERMISSAO_Codigo");

            entity.Property(e => e.PermissaoId)
                .HasColumnName("Permissao_Id")
                .HasDefaultValueSql(
                    "(newid())",
                    "DF_PERMISSAO_Id");

            entity.Property(e => e.Codigo)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(e => e.Nome)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(e => e.Descricao)
                .HasMaxLength(300);

            entity.Property(e => e.Ativo)
                .HasDefaultValue(
                    true,
                    "DF_PERMISSAO_Ativo");

            entity.Property(e => e.DataCriacao)
                .HasDefaultValueSql(
                    "(sysdatetime())",
                    "DF_PERMISSAO_DataCriacao");
        });

        // =========================================
        // TABELA PERFIL_PERMISSAO
        // =========================================

        modelBuilder.Entity<PerfilPermissao>(entity =>
        {
            entity.HasKey(e => e.PerfilPermissaoId)
                .HasName("PK_PERFIL_PERMISSAO");

            entity.ToTable("PERFIL_PERMISSAO", "dbo");

            entity.HasIndex(e => new
            {
                e.PerfilId,
                e.PermissaoId,
                e.TemaId
            }, "UQ_PERFIL_PERMISSAO")
            .IsUnique()
            .HasFilter(null);

            entity.Property(e => e.PerfilPermissaoId)
                .HasColumnName("PerfilPermissao_Id")
                .HasDefaultValueSql(
                    "(newid())",
                    "DF_PERFIL_PERMISSAO_Id");

            entity.Property(e => e.PerfilId)
                .HasColumnName("Perfil_Id");

            entity.Property(e => e.PermissaoId)
                .HasColumnName("Permissao_Id");

            entity.Property(e => e.TemaId)
                .HasColumnName("Tema_Id");

            entity.Property(e => e.DataAtribuicao)
                .HasDefaultValueSql(
                    "(sysdatetime())",
                    "DF_PERFIL_PERMISSAO_Data");

            // Relacionamento com PERFIL
            entity.HasOne(d => d.Perfil)
                .WithMany(p => p.PerfilPermissoes)
                .HasForeignKey(d => d.PerfilId)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName(
                    "FK_PERFIL_PERMISSAO_PERFIL");

            // Relacionamento com PERMISSAO
            entity.HasOne(d => d.Permissao)
                .WithMany(p => p.PerfilPermissoes)
                .HasForeignKey(d => d.PermissaoId)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName(
                    "FK_PERFIL_PERMISSAO_PERMISSAO");

            // Relacionamento opcional com TEMA
            entity.HasOne(d => d.Tema)
                .WithMany(p => p.PerfilPermissoes)
                .HasForeignKey(d => d.TemaId)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName(
                    "FK_PERFIL_PERMISSAO_TEMA");
        });
    }
}