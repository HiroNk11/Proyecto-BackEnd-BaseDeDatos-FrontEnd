using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;

namespace ComercioPedidos.IntegrationTests;

public sealed class JwtTests
{
    [Theory]
    [InlineData("valid", 200)] [InlineData("expired", 401)] [InlineData("issuer", 401)]
    [InlineData("audience", 401)] [InlineData("signature", 401)] [InlineData("role", 403)] [InlineData("missing", 401)]
    public async Task RealBearerValidatesSignatureIssuerAudienceExpiryAndRoles(string mode, int expected)
    {
        using var factory = new ApiFactory();
        var key = new SymmetricSecurityKey(RandomNumberGenerator.GetBytes(64));
        using var jwtFactory = factory.WithWebHostBuilder(builder => builder.ConfigureServices(services =>
        {
            services.PostConfigure<AuthenticationOptions>(options => { options.DefaultAuthenticateScheme = "Bearer"; options.DefaultChallengeScheme = "Bearer"; options.DefaultForbidScheme = "Bearer"; });
            services.PostConfigure<JwtBearerOptions>("Bearer", options =>
            {
                options.Authority = null; options.ConfigurationManager = null;
                options.Configuration = new OpenIdConnectConfiguration { Issuer = "test-issuer" };
                options.TokenValidationParameters.ValidIssuer = "test-issuer";
                options.TokenValidationParameters.ValidAudience = "test-api";
                options.TokenValidationParameters.IssuerSigningKey = key;
            });
        }));
        using var initializer = factory.Client();
        using var client = jwtFactory.CreateClient();
        var credentials = new SigningCredentials(mode == "signature" ? new SymmetricSecurityKey(RandomNumberGenerator.GetBytes(64)) : key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(mode == "issuer" ? "wrong-issuer" : "test-issuer", mode == "audience" ? "wrong-audience" : "test-api",
            [new Claim("sub", "test-user"), new Claim("role", mode == "role" ? "Cliente" : "Admin")],
            DateTime.UtcNow.AddMinutes(-20), mode == "expired" ? DateTime.UtcNow.AddMinutes(-10) : DateTime.UtcNow.AddMinutes(5), credentials);
        if (mode != "missing") client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", new JwtSecurityTokenHandler().WriteToken(token));
        else client.DefaultRequestHeaders.Add("X-Test-Role", "Admin"); // No bypass via a test-looking header.
        var response = await client.GetAsync("/api/Clientes");
        Assert.Equal(expected, (int)response.StatusCode);
        if (expected != 200)
        {
            Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
            var body = await response.Content.ReadAsStringAsync();
            Assert.DoesNotContain("test-issuer", body); Assert.DoesNotContain(new JwtSecurityTokenHandler().WriteToken(token), body);
            if (expected == 401) Assert.Contains(response.Headers.WwwAuthenticate, h => h.Scheme == "Bearer");
        }
    }
}
