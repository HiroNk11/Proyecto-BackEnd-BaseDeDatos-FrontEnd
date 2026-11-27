using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
namespace ComercioPedidos.Infrastructure.Data;
public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ComercioPedidosDbContext>
{
    public ComercioPedidosDbContext CreateDbContext(string[] args) => new(new DbContextOptionsBuilder<ComercioPedidosDbContext>()
        .UseSqlServer(Environment.GetEnvironmentVariable("ConnectionStrings__ComercioPedidos") ?? "Server=(localdb)\\MSSQLLocalDB;Database=ComercioPedidosDesign;Integrated Security=true;TrustServerCertificate=true").Options);
}
