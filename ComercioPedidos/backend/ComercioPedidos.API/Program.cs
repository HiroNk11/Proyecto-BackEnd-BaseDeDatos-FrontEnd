using ComercioPedidos.API.Exceptions;
using ComercioPedidos.API.Security;
using ComercioPedidos.API.Validation;
using ComercioPedidos.Application.Services;
using ComercioPedidos.Infrastructure.Data;
using ComercioPedidos.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<ComercioPedidosDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("ComercioPedidos")));
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails(options => options.CustomizeProblemDetails = context =>
{
    context.ProblemDetails.Extensions.TryAdd("traceId", context.HttpContext.TraceIdentifier);
    context.ProblemDetails.Extensions.TryAdd("mensaje", context.ProblemDetails.Detail ?? context.ProblemDetails.Title ?? "La solicitud no pudo procesarse.");
});
builder.Services.AddScoped<IProductoService, ProductoService>();
builder.Services.AddScoped<IClienteService, ClienteService>();
builder.Services.AddScoped<IPedidoService, PedidoService>();
builder.Services.AddScoped<IStockService, StockService>();
builder.Services.AddControllers(options => options.Filters.Add<RequestValidationFilter>()).AddJsonOptions(options => options.JsonSerializerOptions.UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow);
builder.Services.Configure<ApiBehaviorOptions>(options => options.InvalidModelStateResponseFactory = context =>
{
    var problem = new ValidationProblemDetails(context.ModelState) { Status = 400, Title = "Solicitud inválida", Detail = "Revisá los campos enviados.", Type = "https://httpstatuses.io/400", Instance = context.HttpContext.Request.Path };
    foreach (var key in problem.Errors.Keys.ToArray())
        if (key.StartsWith('$') || context.ModelState[key]?.Errors.Any(e => e.Exception is not null) == true) problem.Errors[key] = ["El valor enviado no tiene un formato válido."];
    problem.Extensions["mensaje"] = problem.Detail; problem.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
    return new BadRequestObjectResult(problem) { ContentTypes = { "application/problem+json" } };
});
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.Authority = builder.Configuration["Authentication:Authority"];
    options.Audience = builder.Configuration["Authentication:Audience"];
    options.MapInboundClaims = false; options.RequireHttpsMetadata = true; options.IncludeErrorDetails = false;
    // Preserve options populated by dotnet user-jwts for local development.
    options.TokenValidationParameters.ValidateIssuer = true;
    options.TokenValidationParameters.ValidateAudience = true;
    options.TokenValidationParameters.ValidateLifetime = true;
    options.TokenValidationParameters.ValidateIssuerSigningKey = true;
    options.TokenValidationParameters.RequireSignedTokens = true;
    options.TokenValidationParameters.RequireExpirationTime = true;
    options.TokenValidationParameters.ClockSkew = TimeSpan.FromSeconds(30);
    options.TokenValidationParameters.RoleClaimType = "role";
    options.TokenValidationParameters.NameClaimType = "sub";
    if (!string.IsNullOrWhiteSpace(builder.Configuration["Authentication:Issuer"])) options.TokenValidationParameters.ValidIssuer = builder.Configuration["Authentication:Issuer"];
    options.Events = new JwtBearerEvents
    {
        OnChallenge = async context => { context.HandleResponse(); context.Response.StatusCode = 401; context.Response.Headers.WWWAuthenticate = "Bearer"; await context.Response.WriteAsJsonAsync(ApiProblems.Create(context.HttpContext, 401, "Se requiere un access token válido."), options: (System.Text.Json.JsonSerializerOptions?)null, contentType: "application/problem+json"); },
        OnForbidden = context => { context.Response.StatusCode = 403; return context.Response.WriteAsJsonAsync(ApiProblems.Create(context.HttpContext, 403, "No tenés permisos para realizar esta operación."), options: (System.Text.Json.JsonSerializerOptions?)null, contentType: "application/problem+json"); }
    };
});
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
    options.AddPolicy(Policies.Staff, policy => policy.RequireAuthenticatedUser().RequireRole("Admin", "Operador"));
    options.AddPolicy(Policies.Admin, policy => policy.RequireAuthenticatedUser().RequireRole("Admin"));
    options.AddPolicy(Policies.Orders, policy => policy.RequireAuthenticatedUser().RequireRole("Admin", "Operador", "Cliente"));
});
builder.Services.AddEndpointsApiExplorer(); builder.Services.AddSwaggerGen();
var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy => { if (origins.Length > 0) policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod(); }));
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 64 * 1024);
builder.Logging.AddFilter("Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddleware", LogLevel.None);
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore.Database.Command", LogLevel.None);
var app = builder.Build();
if (!app.Environment.IsEnvironment("Testing"))
{
    if (string.IsNullOrWhiteSpace(app.Configuration.GetConnectionString("ComercioPedidos"))) throw new InvalidOperationException("Configurá ConnectionStrings__ComercioPedidos fuera del repositorio.");
    var localJwt = app.Environment.IsDevelopment() && app.Configuration.GetSection("Authentication:Schemes:Bearer:SigningKeys").Exists();
    if (!localJwt && (!Uri.TryCreate(app.Configuration["Authentication:Authority"], UriKind.Absolute, out var authority) || authority.Scheme != "https" || string.IsNullOrWhiteSpace(app.Configuration["Authentication:Audience"]))) throw new InvalidOperationException("Configurá Authority/Audience OIDC o generá un JWT local con dotnet user-jwts en Development.");
    if (origins.Any(origin => !Uri.TryCreate(origin, UriKind.Absolute, out var uri) || uri.Scheme is not ("https" or "http") || uri.AbsolutePath != "/" || uri.Query.Length > 0 || uri.Fragment.Length > 0 || uri.UserInfo.Length > 0)) throw new InvalidOperationException("Cors:AllowedOrigins debe contener orígenes explícitos válidos.");
}
app.UseExceptionHandler();
app.UseStatusCodePages(async context => { var response = context.HttpContext.Response; await response.WriteAsJsonAsync(ApiProblems.Create(context.HttpContext, response.StatusCode, response.StatusCode == 404 ? "El recurso solicitado no existe." : "La solicitud no pudo procesarse."), options: (System.Text.Json.JsonSerializerOptions?)null, contentType: "application/problem+json"); });
if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Testing")) app.UseHttpsRedirection();
app.UseCors("Frontend"); app.UseAuthentication(); app.UseAuthorization();
if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }
app.MapControllers(); app.Run();
public partial class Program { }
