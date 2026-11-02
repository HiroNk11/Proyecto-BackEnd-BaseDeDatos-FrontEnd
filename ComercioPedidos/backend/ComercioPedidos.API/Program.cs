using ComercioPedidos.API.Exceptions;
using ComercioPedidos.Application.Services;
using ComercioPedidos.Infrastructure.Data;
using ComercioPedidos.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using ComercioPedidos.API.Security;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSecureAuthentication(builder.Configuration, builder.Environment);
if (builder.Environment.IsDevelopment())
{
    var urls = builder.Configuration["urls"] ?? "http://localhost:5272";
    if (builder.Configuration.GetSection("Kestrel:Endpoints").GetChildren().Any() ||
        urls.Split(';', StringSplitOptions.RemoveEmptyEntries).Any(url =>
            !Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
            uri.Scheme is not ("http" or "https") ||
            !(uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
              System.Net.IPAddress.TryParse(uri.Host, out var ip) && System.Net.IPAddress.IsLoopback(ip))))
        throw new InvalidOperationException("Development solo admite URLs de loopback, sin endpoints Kestrel adicionales.");
    builder.WebHost.UseUrls(urls);
}
builder.WebHost.ConfigureKestrel(options =>
{
    options.AddServerHeader = false;
    options.Limits.MaxRequestBodySize = 64 * 1024;
});
if (!builder.Environment.IsDevelopment())
{
    if (string.IsNullOrWhiteSpace(builder.Configuration["AllowedHosts"]) || builder.Configuration["AllowedHosts"]!.Contains('*'))
        throw new InvalidOperationException("Configurar AllowedHosts explicitos en produccion.");
    var sql = new Microsoft.Data.SqlClient.SqlConnectionStringBuilder(builder.Configuration.GetConnectionString("ComercioPedidos"));
    if (sql.TrustServerCertificate || sql.Encrypt.ToString() is "False" or "Optional")
        throw new InvalidOperationException("SQL de produccion requiere cifrado y validacion de certificado.");
}
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 120, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});

// Base de datos
builder.Services.AddDbContext<ComercioPedidosDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("ComercioPedidos")));

// Manejo global de excepciones
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Servicios
builder.Services.AddScoped<IProductoService, ProductoService>();
builder.Services.AddScoped<IClienteService, ClienteService>();
builder.Services.AddScoped<IPedidoService, PedidoService>();
builder.Services.AddScoped<IStockService, StockService>();
// Controllers
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.OpenApiSecurityScheme
    { Type = Microsoft.OpenApi.SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT" });
    options.AddSecurityRequirement(document => new Microsoft.OpenApi.OpenApiSecurityRequirement
    { [new Microsoft.OpenApi.OpenApiSecuritySchemeReference("Bearer", document)] = new List<string>() });
});

string[] origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ??
    (builder.Environment.IsDevelopment() ? ["http://localhost:5173"] : []);
if (origins.Any(origin => origin.Contains('*') ||
    !Uri.TryCreate(origin, UriKind.Absolute, out var uri) ||
    uri.Scheme is not ("http" or "https") || !string.IsNullOrEmpty(uri.UserInfo) ||
    uri.AbsolutePath != "/" || !string.IsNullOrEmpty(uri.Query) || !string.IsNullOrEmpty(uri.Fragment) ||
    !builder.Environment.IsDevelopment() && uri.Scheme != Uri.UriSchemeHttps))
    throw new InvalidOperationException("Configurar origenes CORS explicitos; produccion requiere HTTPS.");
builder.Services.AddCors(options => // Configuración de CORS
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
var app = builder.Build();
app.Use(async (context, next) =>
{
    context.Response.Headers.XContentTypeOptions = "nosniff";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    context.Response.Headers.CacheControl = "no-store";
    if (!app.Environment.IsDevelopment() && !context.Request.IsHttps)
    {
        await Results.Problem(statusCode: 400, title: "Se requiere HTTPS.").ExecuteAsync(context);
        return;
    }
    await next();
});
// Manejo global de excepciones
app.UseExceptionHandler();
app.UseCors("Frontend"); // Aplicar la política de CORS
// Swagger solo en desarrollo
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Permitir HTTP para pruebas móviles en desarrollo.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
    app.UseHsts();
}
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

////Program.cs

//1. Crear aplicación
//        ↓
//2. Configurar base de datos
//        ↓
//3. Configurar excepciones
//        ↓
//4. Registrar nuestros Services
//        ↓
//5. Registrar Controllers
//        ↓
//6. Configurar Swagger
//        ↓
//7. Construir aplicación
//        ↓
//8. Configurar middleware
//        ↓
//9. Mapear Controllers
//        ↓
//10. Ejecutar
