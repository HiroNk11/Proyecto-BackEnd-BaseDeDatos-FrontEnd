using System.Security.Claims;
using System.Text.Encodings.Web;
using ComercioPedidos.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ComercioPedidos.IntegrationTests;

public sealed class ApiFactory : WebApplicationFactory<Program>
{
    private readonly string file = Path.Combine(Path.GetTempPath(), $"comercio-tests-{Guid.NewGuid():N}.db");
    private readonly string? sqlServer = Environment.GetEnvironmentVariable("COMERCIO_TEST_SQL_SERVER");
    private readonly string database = $"ComercioTests_{Guid.NewGuid():N}";
    private bool cleanedUp;
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<ComercioPedidosDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<ComercioPedidosDbContext>>();
            services.AddDbContext<ComercioPedidosDbContext>(options =>
            {
                if (string.IsNullOrWhiteSpace(sqlServer)) options.UseSqlite($"Data Source={file}");
                else options.UseSqlServer(new Microsoft.Data.SqlClient.SqlConnectionStringBuilder { DataSource = sqlServer, InitialCatalog = database, IntegratedSecurity = true, TrustServerCertificate = true }.ConnectionString);
            });
            services.AddAuthentication(options => { options.DefaultAuthenticateScheme = "Test"; options.DefaultChallengeScheme = "Test"; options.DefaultForbidScheme = "Test"; })
                .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>("Test", _ => { });
        });
    }
    public HttpClient Client(string? role = "Admin", string? clienteId = null)
    {
        var client = CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), AllowAutoRedirect = false });
        if (role is not null) client.DefaultRequestHeaders.Add("X-Test-Role", role);
        if (clienteId is not null) client.DefaultRequestHeaders.Add("X-Test-Cliente", clienteId);
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ComercioPedidosDbContext>();
        if (string.IsNullOrWhiteSpace(sqlServer)) db.Database.EnsureCreated(); else db.Database.Migrate();
        return client;
    }
    protected override void Dispose(bool disposing)
    {
        if (disposing && !cleanedUp)
        {
            cleanedUp = true;
            if (!string.IsNullOrWhiteSpace(sqlServer))
            {
                using var scope = Services.CreateScope();
                scope.ServiceProvider.GetRequiredService<ComercioPedidosDbContext>().Database.EnsureDeleted();
            }
        }
        base.Dispose(disposing);
        if (disposing) { Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools(); if (File.Exists(file)) File.Delete(file); }
    }
}

// Scheme exists only in the test assembly and is never registered by the production app.
public sealed class TestAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("X-Test-Role", out var role)) return Task.FromResult(AuthenticateResult.NoResult());
        var claims = new List<Claim> { new("sub", "test-user"), new("role", role.ToString()) };
        foreach (var id in Request.Headers["X-Test-Cliente"]) if (id is not null) claims.Add(new("cliente_id", id));
        var identity = new ClaimsIdentity(claims, Scheme.Name, "sub", "role");
        return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), Scheme.Name)));
    }
}
