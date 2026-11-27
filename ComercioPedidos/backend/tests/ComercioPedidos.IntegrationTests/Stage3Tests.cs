using System.Net.Http.Json;
using System.Text.Json;
using ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.Entitites;
using ComercioPedidos.Application.Services;
using ComercioPedidos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;

namespace ComercioPedidos.IntegrationTests;

public sealed class Stage3Tests
{
    private static async Task<int> Product(HttpClient client, int stock = 10, int minimum = 3)
    {
        var response = await client.PostAsJsonAsync("/api/productos", new { nombre = "Producto auditado", precio = 10, stock, stockMinimo = minimum, activo = true });
        Assert.Equal(201, (int)response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt32();
    }
    private static async Task<int> Order(HttpClient client, int product)
    {
        var customer = await client.PostAsJsonAsync("/api/clientes", new { nombre = "Cliente", apellido = "Demo", email = "demo@example.com", activo = true });
        var id = (await customer.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt32();
        var response = await client.PostAsJsonAsync("/api/pedidos", new { clienteId = id, detalles = new[] { new { productoId = product, cantidad = 2 } } });
        Assert.Equal(201, (int)response.StatusCode);
        return await response.Content.ReadFromJsonAsync<int>();
    }
    private static async Task Problem(HttpResponseMessage response, int status)
    {
        Assert.Equal(status, (int)response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(status, (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetInt32());
    }

    [Fact]
    public async Task CompleteLifecycleIncludesUtcHistoryActorAndDoesNotReserveTwice()
    {
        using var factory = new ApiFactory(); using var client = factory.Client("Operador");
        var product = await Product(client); var order = await Order(client, product);
        foreach (var action in new[] { "confirmar", "preparar", "enviar", "entregar" })
            Assert.Equal(204, (int)(await client.PutAsync($"/api/pedidos/{order}/{action}", null)).StatusCode);
        var detail = await client.GetFromJsonAsync<PedidoDto>($"/api/pedidos/{order}");
        Assert.Equal("Entregado", detail!.Estado);
        Assert.Equal(new[] { "Pendiente", "Confirmado", "EnPreparacion", "Enviado", "Entregado" }, detail.Historial.Select(h => h.EstadoNuevo));
        Assert.All(detail.Historial, h => { Assert.Equal("test-user", h.UsuarioId); Assert.Equal(DateTimeKind.Utc, h.FechaUtc.Kind); });
        await Problem(await client.PutAsync($"/api/pedidos/{order}/cancelar", null), 422);
        var current = await client.GetFromJsonAsync<Producto>($"/api/productos/{product}"); Assert.Equal(8, current!.Stock);
        var audit = await client.GetFromJsonAsync<JsonElement>($"/api/productos/{product}/movimientos-stock");
        Assert.Equal(2, audit.GetProperty("totalRegistros").GetInt32()); // initial + reservation
    }

    [Theory]
    [InlineData("Pendiente")] [InlineData("Confirmado")] [InlineData("EnPreparacion")] [InlineData("Enviado")]
    public async Task CancellationReturnsStockExactlyOnceAndLogsRelease(string state)
    {
        using var factory = new ApiFactory(); using var client = factory.Client();
        var product = await Product(client); var order = await Order(client, product);
        foreach (var (name, action) in new[] { ("Confirmado", "confirmar"), ("EnPreparacion", "preparar"), ("Enviado", "enviar") })
        {
            if (state == "Pendiente") break;
            Assert.Equal(204, (int)(await client.PutAsync($"/api/pedidos/{order}/{action}", null)).StatusCode);
            if (name == state) break;
        }
        Assert.Equal(204, (int)(await client.PutAsync($"/api/pedidos/{order}/cancelar", null)).StatusCode);
        await Problem(await client.PutAsync($"/api/pedidos/{order}/cancelar", null), 422);
        var current = await client.GetFromJsonAsync<Producto>($"/api/productos/{product}"); Assert.Equal(10, current!.Stock);
        var audit = await client.GetFromJsonAsync<JsonElement>($"/api/productos/{product}/movimientos-stock?tamanioPagina=1");
        Assert.Equal(3, audit.GetProperty("totalRegistros").GetInt32()); Assert.Equal(3, audit.GetProperty("totalPaginas").GetInt32());
        var release = audit.GetProperty("items")[0];
        Assert.Equal("LiberacionPorCancelacion", release.GetProperty("tipoMovimiento").GetString());
        Assert.Equal(8, release.GetProperty("stockAnterior").GetInt32()); Assert.Equal(10, release.GetProperty("stockNuevo").GetInt32());
        Assert.Equal(order, release.GetProperty("pedidoId").GetInt32()); Assert.Equal("test-user", release.GetProperty("usuarioId").GetString());
    }

    [Fact]
    public async Task AdjustmentsAreAuditedValidatedAndReportLowStockAtInclusiveThreshold()
    {
        using var factory = new ApiFactory(); using var client = factory.Client("Operador");
        var id = await Product(client, 4, 3);
        Assert.Equal(204, (int)(await client.PostAsJsonAsync($"/api/productos/{id}/ajustes-stock", new { tipoMovimiento = "AjusteManual", cantidad = -1, motivo = "Deterioro verificado" })).StatusCode);
        var low = await client.GetFromJsonAsync<List<Producto>>("/api/productos/stock-bajo"); Assert.Single(low!); Assert.Equal(3, low![0].Stock);
        var snapshot = low[0].Version;
        await Problem(await client.PostAsJsonAsync($"/api/productos/{id}/ajustes-stock", new { tipoMovimiento = "AjusteManual", cantidad = -4, motivo = "No debe permitir negativos" }), 409);
        await Problem(await client.PostAsJsonAsync($"/api/productos/{id}/ajustes-stock", new { tipoMovimiento = "Ingreso", cantidad = 1, motivo = "   " }), 400);
        Assert.Equal(204, (int)(await client.PostAsJsonAsync($"/api/productos/{id}/ajustes-stock", new { tipoMovimiento = "Ingreso", cantidad = 5, motivo = "Ingreso de proveedor", version = snapshot })).StatusCode);
        await Problem(await client.PostAsJsonAsync($"/api/productos/{id}/ajustes-stock", new { tipoMovimiento = "Ingreso", cantidad = 1, motivo = "Versión anterior", version = snapshot }), 409);
        Assert.Empty((await client.GetFromJsonAsync<List<Producto>>("/api/productos/stock-bajo"))!);
        var audit = await client.GetFromJsonAsync<JsonElement>($"/api/productos/{id}/movimientos-stock"); Assert.Equal(3, audit.GetProperty("totalRegistros").GetInt32());
        Assert.Equal(8, audit.GetProperty("items")[0].GetProperty("stockNuevo").GetInt32());
    }

    [Fact]
    public async Task LegacyProductUpdatesAlsoLeaveAuditAndPreserveThreshold()
    {
        using var factory = new ApiFactory(); using var client = factory.Client(); var id = await Product(client);
        Assert.Equal(200, (int)(await client.PutAsJsonAsync($"/api/productos/{id}", new { nombre = "Actualizado", precio = 12, stock = 6, activo = true })).StatusCode);
        var current = await client.GetFromJsonAsync<Producto>($"/api/productos/{id}"); Assert.Equal(3, current!.StockMinimo);
        var audit = await client.GetFromJsonAsync<JsonElement>($"/api/productos/{id}/movimientos-stock");
        Assert.Equal("AjusteManual", audit.GetProperty("items")[0].GetProperty("tipoMovimiento").GetString());
    }

    [Fact]
    public async Task AuditRowsCannotBeEditedAndInactiveProductsDoNotTriggerReplenishment()
    {
        using var factory = new ApiFactory(); using var client = factory.Client(); var id = await Product(client, 0, 5);
        Assert.Single((await client.GetFromJsonAsync<List<Producto>>("/api/productos/stock-bajo"))!);
        await client.PutAsJsonAsync($"/api/productos/{id}", new { nombre = "Inactivo", precio = 10, stock = 0, activo = false });
        Assert.Empty((await client.GetFromJsonAsync<List<Producto>>("/api/productos/stock-bajo"))!);
        await Problem(await client.PutAsJsonAsync($"/api/productos/{id}", new { nombre = "Inválido", precio = 10, stock = 0, stockMinimo = -1, activo = true }), 400);
        await client.PostAsJsonAsync($"/api/productos/{id}/ajustes-stock", new { tipoMovimiento = "Ingreso", cantidad = 1, motivo = "Primer ingreso" });
        using var scope = factory.Services.CreateScope(); var db = scope.ServiceProvider.GetRequiredService<ComercioPedidosDbContext>();
        var movement = await db.MovimientosStock.SingleAsync(); movement.Motivo = "Intento de reescritura";
        await Assert.ThrowsAsync<ComercioPedidos.Application.Exceptions.ReglaNegocioException>(() => db.SaveChangesAsync());
    }

    [Fact]
    public async Task InvalidTransitionsAndNewEndpointsRespectRoleAndOwnership()
    {
        using var factory = new ApiFactory(); using var admin = factory.Client(); var id = await Product(admin); var order = await Order(admin, id);
        await Problem(await admin.PutAsync($"/api/pedidos/{order}/preparar", null), 422);
        using var customer = factory.Client("Cliente", "999");
        foreach (var path in new[] { "/api/productos/stock-bajo", $"/api/productos/{id}/movimientos-stock" }) Assert.Equal(403, (int)(await customer.GetAsync(path)).StatusCode);
        Assert.Equal(403, (int)(await customer.PostAsJsonAsync($"/api/productos/{id}/ajustes-stock", new { tipoMovimiento = "Ingreso", cantidad = 1, motivo = "Intento indebido" })).StatusCode);
        Assert.Equal(403, (int)(await customer.PutAsync($"/api/pedidos/{order}/preparar", null)).StatusCode);
        await Problem(await customer.GetAsync($"/api/pedidos/{order}"), 404);
        using var anonymous = factory.Client(null);
        Assert.Equal(401, (int)(await anonymous.GetAsync("/api/productos/stock-bajo")).StatusCode);
    }

    [Fact]
    public async Task StaleWriteAfterStockReturnsToOriginalValueRollsBackAudit()
    {
        using var factory = new ApiFactory(); using var client = factory.Client(); var id = await Product(client);
        using var scope = factory.Services.CreateScope(); var stale = scope.ServiceProvider.GetRequiredService<ComercioPedidosDbContext>();
        var before = await stale.Productos.FindAsync(id);
        await client.PostAsJsonAsync($"/api/productos/{id}/ajustes-stock", new { tipoMovimiento = "AjusteManual", cantidad = -1, motivo = "Salida concurrente" });
        await client.PostAsJsonAsync($"/api/productos/{id}/ajustes-stock", new { tipoMovimiento = "Ingreso", cantidad = 1, motivo = "Reposición concurrente" });
        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => scope.ServiceProvider.GetRequiredService<IStockService>().AjustarAsync(id, new() { TipoMovimiento = "Ingreso", Cantidad = 2, Motivo = "No debe persistir" }));
        using var fresh = factory.Services.CreateScope(); var db = fresh.ServiceProvider.GetRequiredService<ComercioPedidosDbContext>();
        Assert.Equal(10, (await db.Productos.FindAsync(id))!.Stock); Assert.Equal(3, await db.MovimientosStock.CountAsync());
        stale.ChangeTracker.Clear();
        var orderId = await Order(client, id);
        var oldOrder = await stale.Pedidos.FindAsync(orderId);
        await client.PutAsync($"/api/pedidos/{orderId}/confirmar", null);
        oldOrder!.Estado = ComercioPedidos.Application.Enums.EstadoPedido.Cancelado;
        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => stale.SaveChangesAsync());
    }

    [SqlServerFact]
    public async Task MigrationUpgradesPreviousSchemaPreservesRowsAndIsRepeatable()
    {
        var database = $"ComercioMigrationTests_{Guid.NewGuid():N}";
        var connection = new Microsoft.Data.SqlClient.SqlConnectionStringBuilder { DataSource = Environment.GetEnvironmentVariable("COMERCIO_TEST_SQL_SERVER"), InitialCatalog = database, IntegratedSecurity = true, TrustServerCertificate = true }.ConnectionString;
        await using var db = new ComercioPedidosDbContext(new DbContextOptionsBuilder<ComercioPedidosDbContext>().UseSqlServer(connection).Options);
        try
        {
            await db.GetService<IMigrator>().MigrateAsync("20261019185854_AgregarProveedores");
            await db.Database.ExecuteSqlRawAsync("INSERT INTO Productos (Nombre,Precio,Stock,Activo) VALUES ('Existente',10,4,1); INSERT INTO MovimientosStock (ProductoId,Fecha,Tipo,Cantidad,StockAnterior,StockPosterior,Motivo) VALUES (1,SYSUTCDATETIME(),'Entrada',4,0,4,'Inicial'); INSERT INTO Clientes (Nombre,Apellido,Email,Activo) VALUES ('Previo','Demo','demo@example.com',1); INSERT INTO Pedidos (ClienteId,Fecha,Estado,Total) VALUES (1,SYSUTCDATETIME(),'Confirmado',10);");
            await db.Database.MigrateAsync(); await db.Database.MigrateAsync();
            Assert.False(db.Database.HasPendingModelChanges());
            Assert.Equal(4, (await db.Productos.SingleAsync()).Stock);
            Assert.Equal("historico-desconocido", (await db.MovimientosStock.SingleAsync()).UsuarioId);
            Assert.Equal("migracion-snapshot", (await db.HistorialEstadosPedidos.SingleAsync()).UsuarioId);
            Assert.Equal(4, (await db.Database.GetAppliedMigrationsAsync()).Count());
        }
        finally { await db.Database.EnsureDeletedAsync(); }
    }
}

public sealed class SqlServerFactAttribute : FactAttribute
{
    public SqlServerFactAttribute() { if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("COMERCIO_TEST_SQL_SERVER"))) Skip = "Requiere COMERCIO_TEST_SQL_SERVER para probar migraciones SQL Server."; }
}
