// ============================================================
// EcoTurismo.API/Data/EcoTurismoDbContext.cs
// ============================================================

using Microsoft.EntityFrameworkCore;
using EcoTurismo.API.Models;

namespace EcoTurismo.API.Data;

public class EcoTurismoDbContext : DbContext
{
    public EcoTurismoDbContext(DbContextOptions<EcoTurismoDbContext> options)
        : base(options) { }

    public DbSet<Municipio> Municipios => Set<Municipio>();
    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<Atrativo> Atrativos => Set<Atrativo>();
    public DbSet<Reserva> Reservas => Set<Reserva>();
    public DbSet<Validacao> Validacoes => Set<Validacao>();
    public DbSet<Quiosque> Quiosques => Set<Quiosque>();
    public DbSet<Banner> Banners => Set<Banner>();
    public DbSet<ConfiguracaoSistema> Configuracoes => Set<ConfiguracaoSistema>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Unique constraints
        modelBuilder.Entity<ConfiguracaoSistema>()
            .HasIndex(c => c.Chave)
            .IsUnique();

        modelBuilder.Entity<Profile>()
            .HasIndex(p => p.Email)
            .IsUnique();

        // Índices
        modelBuilder.Entity<Reserva>()
            .HasIndex(r => r.Token);

        modelBuilder.Entity<Reserva>()
            .HasIndex(r => r.AtrativoId);

        modelBuilder.Entity<Quiosque>()
            .HasIndex(q => q.AtrativoId);

        // Auto-update de updated_at (via SaveChanges override)
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(ct);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            var prop = entry.Properties.FirstOrDefault(p => p.Metadata.Name == "UpdatedAt");
            if (prop != null)
                prop.CurrentValue = DateTimeOffset.UtcNow;
        }
    }
}
