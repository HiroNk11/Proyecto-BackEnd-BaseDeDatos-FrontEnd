using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using ComercioPedidos.Application.DTO;
using ComercioPedidos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ComercioPedidos.IntegrationTests;

public sealed class ApiTests
{
    private static async Task<int> CreateClient(HttpClient client, string name = "Cliente")
    {
        var response = await client.PostAsJsonAsync("/api/Clientes", new { nombre = name, apellido = "Demo", email = "demo@example.com", activo = true });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt32();
    }
    private static async Task<int> CreateProduct(HttpClient client, int stock = 5)
    {
        var response = await client.PostAsJsonAsync("/api/Productos", new { nombre = "Producto demo", precio = 10.25m, stock, activo = true });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt32();
    }
    private static Task<HttpResponseMessage> Order(HttpClient client, int customer, int product, int quantity = 2) => client.PostAsJsonAsync("/api/Pedidos", new { clienteId = customer, detalles = new[] { new { productoId = product, cantidad = quantity } } });
    private static async Task<JsonElement> Problem(HttpResponseMessage response, int status)
    {
        Assert.Equal(status, (int)response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(status, json.GetProperty("status").GetInt32()); Assert.True(json.TryGetProperty("traceId", out _)); Assert.True(json.TryGetProperty("mensaje", out _));
        return json;
    }

    [Theory]
    [InlineData("/api/Clientes")] [InlineData("/api/Productos")] [InlineData("/api/Pedidos")] [InlineData("/api/movimientos-stock")]
    public async Task AnonymousCannotReadSensitiveEndpoints(string path)
    {
        using var factory = new ApiFactory(); using var client = factory.Client(null);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync(path)).StatusCode);
    }
    [Theory]
    [InlineData("Cliente")] [InlineData("Unknown")]
    public async Task NonStaffCannotManageClientsOrStock(string role)
    {
        using var factory = new ApiFactory(); using var client = factory.Client(role, "1");
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/Clientes")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync("/api/movimientos-stock/entrada", new { productoId = 1, cantidad = 1 })).StatusCode);
    }

    [Fact]
    public async Task CreateConfirmDeliverAndCancelPreserveContractsAndStock()
    {
        using var factory = new ApiFactory(); using var client = factory.Client();
        var customer = await CreateClient(client); var product = await CreateProduct(client);
        var created = await Order(client, customer, product); Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var id = await created.Content.ReadFromJsonAsync<int>(); Assert.NotNull(created.Headers.Location);
        var order = await client.GetFromJsonAsync<PedidoDto>($"/api/Pedidos/{id}"); Assert.Equal(20.50m, order!.Total); Assert.Equal("Pendiente", order.Estado);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsync($"/api/Pedidos/{id}/confirmar", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsync($"/api/Pedidos/{id}/cancelar", null)).StatusCode);
        await Problem(await client.PutAsync($"/api/Pedidos/{id}/cancelar", null), 409);
        var current = await client.GetFromJsonAsync<JsonElement>($"/api/Productos/{product}"); Assert.Equal(5, current.GetProperty("stock").GetInt32());
        var other = await Order(client, customer, product, 1); var next = await other.Content.ReadFromJsonAsync<int>();
        await client.PutAsync($"/api/Pedidos/{next}/confirmar", null);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsync($"/api/Pedidos/{next}/entregar", null)).StatusCode);
        await Problem(await client.PutAsync($"/api/Pedidos/{next}/cancelar", null), 409);
    }

    [Fact]
    public async Task InsufficientStockRollsBackOrderAndMovement()
    {
        using var factory = new ApiFactory(); using var client = factory.Client(); var customer = await CreateClient(client); var product = await CreateProduct(client, 1);
        await Problem(await Order(client, customer, product, 2), 409);
        using var scope = factory.Services.CreateScope(); var db = scope.ServiceProvider.GetRequiredService<ComercioPedidosDbContext>();
        Assert.Empty(await db.Pedidos.ToListAsync()); Assert.Empty(await db.MovimientosStock.ToListAsync()); Assert.Equal(1, (await db.Productos.SingleAsync()).Stock);
    }

    [Theory]
    [InlineData("{\"clienteId\":1,\"detalles\":[null]}")]
    [InlineData("{\"clienteId\":1,\"detalles\":[]}")]
    [InlineData("{\"clienteId\":1,\"detalles\":[{\"productoId\":1,\"cantidad\":0}]}")]
    [InlineData("{\"clienteId\":1,\"detalles\":[{\"productoId\":1,\"cantidad\":1}],\"total\":0.01}")]
    public async Task RejectsInvalidNestedDtosAndOverposting(string payload)
    {
        using var factory = new ApiFactory(); using var client = factory.Client();
        await Problem(await client.PostAsync("/api/Pedidos", new StringContent(payload, Encoding.UTF8, "application/json")), 400);
    }

    [Fact]
    public async Task ClientCannotReadCreateOrCancelAnotherCustomersOrders()
    {
        using var factory = new ApiFactory(); using var staff = factory.Client();
        var own = await CreateClient(staff); var other = await CreateClient(staff, "Segundo"); var product = await CreateProduct(staff);
        var response = await Order(staff, other, product, 1); var id = await response.Content.ReadFromJsonAsync<int>();
        using var client = factory.Client("Cliente", own.ToString());
        await Problem(await client.GetAsync($"/api/Pedidos/{id}"), 404);
        await Problem(await client.PutAsync($"/api/Pedidos/{id}/cancelar", null), 404);
        Assert.Equal(HttpStatusCode.Forbidden, (await Order(client, other, product, 1)).StatusCode);
        var page = await client.GetFromJsonAsync<ResultadoPaginado<PedidoDto>>("/api/Pedidos"); Assert.Empty(page!.Items);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync($"/api/Pedidos?clienteId={other}")).StatusCode);
        var ownCreated = await Order(client, own, product, 1); Assert.Equal(HttpStatusCode.Created, ownCreated.StatusCode);
        var ownId = await ownCreated.Content.ReadFromJsonAsync<int>();
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync($"/api/Pedidos/{ownId}")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PutAsync($"/api/Pedidos/{ownId}/confirmar", null)).StatusCode);
    }

    [Theory]
    [InlineData(null)] [InlineData("0")] [InlineData("-1")] [InlineData("bad")]
    public async Task CustomerWithoutValidOwnershipClaimCannotListOrders(string? claim)
    {
        using var factory = new ApiFactory(); using var client = factory.Client("Cliente", claim);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/Pedidos")).StatusCode);
    }

    [Theory]
    [InlineData("/api/Pedidos?pagina=0")] [InlineData("/api/Pedidos?estado=99")] [InlineData("/api/Pedidos?fechaHasta=9999-12-31")]
    [InlineData("/api/movimientos-stock?productoId=0")] [InlineData("/api/movimientos-stock?tipo=99")] [InlineData("/api/Pedidos/0")]
    public async Task InvalidQueryAndRouteParametersProduce400(string path)
    {
        using var factory = new ApiFactory(); using var client = factory.Client(); await Problem(await client.GetAsync(path), 400);
    }

    [Fact]
    public async Task BusinessRuleAndNotFoundProduce422And404()
    {
        using var factory = new ApiFactory(); using var client = factory.Client(); var customer = await CreateClient(client); var product = await CreateProduct(client);
        await client.PutAsJsonAsync($"/api/Productos/{product}", new { nombre = "Producto demo", precio = 10.25m, stock = 5, activo = false });
        await Problem(await Order(client, customer, product), 422);
        await Problem(await client.GetAsync("/api/Pedidos/999"), 404);
    }

    [Fact]
    public async Task OptimisticConcurrencyRejectsStaleStockSnapshot()
    {
        using var factory = new ApiFactory(); using var client = factory.Client(); var id = await CreateProduct(client);
        using var one = factory.Services.CreateScope(); using var two = factory.Services.CreateScope();
        var a = one.ServiceProvider.GetRequiredService<ComercioPedidosDbContext>(); var b = two.ServiceProvider.GetRequiredService<ComercioPedidosDbContext>();
        var first = await a.Productos.FindAsync(id); var stale = await b.Productos.FindAsync(id);
        first!.Stock -= 2; await a.SaveChangesAsync(); stale!.Stock -= 4;
        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => b.SaveChangesAsync());
    }

    [Fact]
    public async Task ReferencedResourcesCannotBeDeletedAndDuplicateLinesRespectAggregateStock()
    {
        using var factory = new ApiFactory(); using var client = factory.Client();
        var customer = await CreateClient(client); var product = await CreateProduct(client, 3);
        var duplicate = await client.PostAsJsonAsync("/api/Pedidos", new { clienteId = customer, detalles = new[] { new { productoId = product, cantidad = 2 }, new { productoId = product, cantidad = 2 } } });
        await Problem(duplicate, 409);
        Assert.Equal(HttpStatusCode.Created, (await Order(client, customer, product, 1)).StatusCode);
        await Problem(await client.DeleteAsync($"/api/Clientes/{customer}"), 409);
        await Problem(await client.DeleteAsync($"/api/Productos/{product}"), 409);
        using var operatorClient = factory.Client("Operador");
        Assert.Equal(HttpStatusCode.Forbidden, (await operatorClient.DeleteAsync($"/api/Productos/{product}")).StatusCode);
    }
}
