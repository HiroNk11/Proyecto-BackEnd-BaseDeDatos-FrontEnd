using ComercioPedidos.Application.Entitites;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace ComercioPedidos.Infrastructure.Data
{
    public class ComercioPedidosDbContext : DbContext // representa a contexto de la base de datos
    {
        public ComercioPedidosDbContext(DbContextOptions<ComercioPedidosDbContext> options) //Acá recibiremos la configuración del contexto, entre ella la conexión a SQL Server.
            : base(options) // Le estamos pasando esa configuración a la clase DbContext de Entity Framework.
        {
        }
        public DbSet<Producto> Productos { get; set; } // Le estamos diciendo a Entity Framework: "Quiero trabajar con una colección de objetos Producto, que estará relacionada con una tabla de productos."
        public DbSet<Cliente> Clientes { get; set; }    // Le estamos diciendo a Entity Framework: "Quiero trabajar con una colección de objetos Cliente, que estará relacionada con una tabla de clientes."
        public DbSet<Pedido> Pedidos { get; set; }      // Le estamos diciendo a Entity Framework: "Quiero trabajar con una colección de objetos Pedido, que estará relacionada con una tabla de pedidos."
        public DbSet<DetallePedido> DetallesPedidos { get; set; } // Le estamos diciendo a Entity Framework: "Quiero trabajar con una colección de objetos DetallePedido, que estará relacionada con una tabla de detalles de pedidos."
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Producto>(entity =>
            {
                entity.HasKey(p => p.Id);

                entity.Property(p => p.Id)
                    .ValueGeneratedOnAdd();
            });

            modelBuilder.Entity<Cliente>(entity =>
            {
                entity.HasKey(c => c.Id);

                entity.Property(c => c.Id)
                    .ValueGeneratedOnAdd();
            });

            modelBuilder.Entity<Pedido>(entity =>
            {
                entity.HasKey(p => p.Id);
                entity.Property(p => p.Id)
                    .ValueGeneratedOnAdd();
                entity.HasOne(p => p.Cliente) // Configuramos la relación entre Pedido y Cliente
                .WithMany() // Un cliente puede tener muchos pedidos
                .HasForeignKey(p => p.ClienteId); // La clave foránea en Pedido que apunta a Cliente
                entity.Property(p => p.Estado)
                .HasConversion<string>();
            });

            modelBuilder.Entity<DetallePedido>(entity =>
            {
                entity.HasKey(d => d.Id);
                entity.Property(d => d.Id)
                    .ValueGeneratedOnAdd();
                entity.HasOne(d => d.Pedido) // Configuramos la relación entre DetallePedido y Pedido
                .WithMany(p => p.Detalles) // Un pedido puede tener muchos detalles
                .HasForeignKey(d => d.PedidoId); // La clave foránea en DetallePedido que apunta a Pedido
                entity.HasOne(d => d.Producto) // Configuramos la relación entre DetallePedido y Producto
                .WithMany() // Un producto puede estar en muchos detalles de pedidos
                .HasForeignKey(d => d.ProductoId); // La clave foránea en DetallePedido que apunta a Producto
            });
        }
    }
}
