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
        }
    }
}
