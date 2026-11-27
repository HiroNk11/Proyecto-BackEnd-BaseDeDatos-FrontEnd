using System.Net.Http.Json;
using System.Text.Json;
using ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.Entitites;
using ComercioPedidos.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace ComercioPedidos.IntegrationTests;

public sealed class FailureTests
{
    [Fact]
    public async Task UnexpectedErrorReturnsSanitizedProblemDetails()
    {
        using var factory = new ApiFactory();
        using var failure = factory.WithWebHostBuilder(builder => builder.ConfigureServices(services => services.AddScoped<IProductoService, FaultyProducts>()));
        using var client = failure.CreateClient(); client.DefaultRequestHeaders.Add("X-Test-Role", "Admin");
        var response = await client.GetAsync("/api/Productos");
        Assert.Equal(500, (int)response.StatusCode); Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var raw = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("fake-private-marker", raw); Assert.DoesNotContain("InvalidOperationException", raw); Assert.DoesNotContain("stackTrace", raw);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>(); Assert.True(problem.TryGetProperty("traceId", out _)); Assert.True(problem.TryGetProperty("mensaje", out _));
    }

    [Theory]
    [InlineData("http://localhost:5173", true)] [InlineData("https://untrusted.example", false)]
    public async Task CorsOnlyAllowsConfiguredOrigins(string origin, bool allowed)
    {
        using var factory = new ApiFactory(); using var client = factory.Client();
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/Productos");
        request.Headers.Add("Origin", origin); request.Headers.Add("Access-Control-Request-Method", "GET");
        request.Headers.Add("Access-Control-Request-Headers", "authorization");
        var response = await client.SendAsync(request);
        Assert.Equal(allowed, response.Headers.Contains("Access-Control-Allow-Origin"));
        if (allowed) Assert.Equal(origin, response.Headers.GetValues("Access-Control-Allow-Origin").Single());
    }

    private sealed class FaultyProducts : IProductoService
    {
        public Task<IEnumerable<Producto>> GetProductos() => throw new InvalidOperationException("fake-private-marker");
        public Task<Producto?> GetProductoById(int id) => throw new NotSupportedException();
        public Task<Producto> CrearProducto(CrearProductoDto dto) => throw new NotSupportedException();
        public Task<Producto?> ActualizarProducto(int id, ActualizarProductoDto dto) => throw new NotSupportedException();
        public Task<bool> EliminarProducto(int id) => throw new NotSupportedException();
    }
}
