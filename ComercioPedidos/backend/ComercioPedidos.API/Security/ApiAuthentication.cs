using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;

namespace ComercioPedidos.API.Security;

public static class ApiAuthentication
{
    public static IServiceCollection AddSecureAuthentication(this IServiceCollection services,
        IConfiguration configuration, IHostEnvironment environment)
    {
        var authority = configuration["Authentication:Authority"];
        var audience = configuration["Authentication:Audience"];
        var issuer = configuration["Authentication:Issuer"];
        var key = configuration["Authentication:SigningKey"];
        if (string.IsNullOrWhiteSpace(audience))
            throw new InvalidOperationException("Configurar Authentication:Audience.");
        if (!string.IsNullOrWhiteSpace(authority))
        {
            if (!Uri.TryCreate(authority, UriKind.Absolute, out var uri) ||
                uri.Scheme != Uri.UriSchemeHttps || !string.IsNullOrEmpty(uri.UserInfo) ||
                !string.IsNullOrEmpty(uri.Query) || !string.IsNullOrEmpty(uri.Fragment))
                throw new InvalidOperationException("Authentication:Authority requiere una URL HTTPS sin credenciales, query ni fragmento.");
        }
        else if (!environment.IsDevelopment() || string.IsNullOrWhiteSpace(issuer) ||
                 string.IsNullOrWhiteSpace(key) || Encoding.UTF8.GetByteCount(key) < 64)
        {
            throw new InvalidOperationException("Configurar Authority HTTPS. Solo en Development se admite Issuer y SigningKey de al menos 64 bytes.");
        }
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
        {
            options.MapInboundClaims = false;
            options.SaveToken = false;
            options.IncludeErrorDetails = false;
            options.RequireHttpsMetadata = true;
            options.Audience = audience;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true,
                ValidateIssuerSigningKey = true, RequireSignedTokens = true,
                RequireExpirationTime = true, ClockSkew = TimeSpan.FromSeconds(30),
                NameClaimType = "sub", RoleClaimType = configuration["Authentication:RoleClaimType"] ?? "role"
            };
            if (!string.IsNullOrWhiteSpace(authority))
            {
                options.Authority = authority;
                options.TokenValidationParameters.ValidAlgorithms = [SecurityAlgorithms.RsaSha256, SecurityAlgorithms.EcdsaSha256];
            }
            else
            {
                options.TokenValidationParameters.ValidIssuer = issuer;
                options.TokenValidationParameters.ValidAudience = audience;
                options.TokenValidationParameters.IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key!));
                options.TokenValidationParameters.ValidAlgorithms = [SecurityAlgorithms.HmacSha256];
            }
        });
        services.AddAuthorization(options =>
        {
            void Policy(string name, params string[] roles) => options.AddPolicy(name, policy => policy
                .RequireAuthenticatedUser().RequireRole(roles)
                .RequireAssertion(context => !string.IsNullOrWhiteSpace(context.User.FindFirst("sub")?.Value)));
            Policy("Lectura", "Administrador", "Operador", "Consulta");
            Policy("Escritura", "Administrador", "Operador");
            Policy("Administracion", "Administrador");
            options.FallbackPolicy = options.GetPolicy("Lectura");
        });
        return services;
    }
}
