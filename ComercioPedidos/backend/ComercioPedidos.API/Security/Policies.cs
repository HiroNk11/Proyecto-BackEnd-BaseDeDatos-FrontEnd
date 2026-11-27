using System.Globalization;
using System.Security.Claims;
namespace ComercioPedidos.API.Security;
public static class Policies
{
    public const string Staff = "Staff", Admin = "Admin", Orders = "Orders";
    public static bool IsStaff(ClaimsPrincipal user) => user.IsInRole("Admin") || user.IsInRole("Operador");
    public static int? ClienteId(ClaimsPrincipal user)
    {
        var values = user.FindAll("cliente_id").Select(c => c.Value).ToArray();
        return values.Length == 1 && int.TryParse(values[0], NumberStyles.None, CultureInfo.InvariantCulture, out var id) && id > 0 ? id : null;
    }
    public static bool Owns(ClaimsPrincipal user, int clienteId) => IsStaff(user) || user.IsInRole("Cliente") && ClienteId(user) == clienteId;
}
