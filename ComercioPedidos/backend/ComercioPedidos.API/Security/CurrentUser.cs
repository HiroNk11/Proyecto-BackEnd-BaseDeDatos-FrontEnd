using ComercioPedidos.Application.Services;
using System.Security.Claims;
namespace ComercioPedidos.API.Security;
public sealed class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public string Id => accessor.HttpContext?.User.FindFirstValue("sub")
        ?? accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "sistema";
}
