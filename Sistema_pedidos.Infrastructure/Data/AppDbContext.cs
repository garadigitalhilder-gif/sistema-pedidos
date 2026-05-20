using Microsoft.EntityFrameworkCore;
using Sistema_pedidos.Core.Entities;

namespace Sistema_pedidos.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Cliente> Clientes => Set<Cliente>();

    public DbSet<Pedido> Pedidos => Set<Pedido>();

    public DbSet<Usuario> Usuarios => Set<Usuario>();

    public DbSet<ConfiguracionRemitente> ConfiguracionesRemitente => Set<ConfiguracionRemitente>();

    public DbSet<HistorialPedido> HistorialPedidos => Set<HistorialPedido>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigurarClientes(modelBuilder);

        ConfigurarPedidos(modelBuilder);

        ConfigurarUsuarios(modelBuilder);

        ConfigurarHistorialPedidos(modelBuilder);
    }

    private static void ConfigurarClientes(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Nombre)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(x => x.Apellido)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(x => x.Cedula)
                .IsRequired()
                .HasMaxLength(50);

            entity.HasIndex(x => x.Cedula)
                .IsUnique();
        });
    }

    private static void ConfigurarPedidos(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Pedido>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Descripcion)
                .HasMaxLength(500);

            entity.HasOne(x => x.Cliente)
                .WithMany(x => x.Pedidos)
                .HasForeignKey(x => x.ClienteId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigurarUsuarios(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Nombre)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(x => x.Correo)
                .IsRequired()
                .HasMaxLength(150);

            entity.HasIndex(x => x.Correo)
                .IsUnique();
        });
    }

    private static void ConfigurarHistorialPedidos(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<HistorialPedido>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.HasOne(x => x.Pedido)
                .WithMany(x => x.Historial)
                .HasForeignKey(x => x.PedidoId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}