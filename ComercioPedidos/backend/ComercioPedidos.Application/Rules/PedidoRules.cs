using ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.Enums;
using ComercioPedidos.Application.Exceptions;
namespace ComercioPedidos.Application.Rules;
public static class PedidoRules
{
    public const decimal ImporteMaximo = 9999999999999999.99m;
    public static IReadOnlyList<CrearDetallePedidoDto> NormalizarDetalles(CrearPedidoDto dto)
    {
        if (dto.ClienteId <= 0 || dto.Detalles is null || dto.Detalles.Count is < 1 or > 100 || dto.Detalles.Any(d => d is null || d.ProductoId <= 0 || d.Cantidad <= 0))
            throw new ReglaNegocioException("El pedido requiere un cliente y entre 1 y 100 detalles válidos.");
        try { return dto.Detalles.GroupBy(d => d.ProductoId).OrderBy(g => g.Key).Select(g => new CrearDetallePedidoDto { ProductoId = g.Key, Cantidad = g.Sum(d => d.Cantidad) }).ToList(); }
        catch (OverflowException) { throw new ReglaNegocioException("La cantidad total excede el límite permitido."); }
    }
    public static decimal Subtotal(decimal precio, int cantidad)
    {
        if (precio <= 0 || precio > ImporteMaximo || decimal.Round(precio, 2) != precio || cantidad <= 0) throw new ReglaNegocioException("Precio o cantidad inválidos.");
        var subtotal = precio * cantidad;
        if (subtotal > ImporteMaximo) throw new ReglaNegocioException("El importe excede el límite permitido.");
        return subtotal;
    }
    public static void ValidarTransicion(EstadoPedido actual, EstadoPedido destino)
    {
        var permitida = (actual, destino) switch { (EstadoPedido.Pendiente, EstadoPedido.Confirmado) => true, (EstadoPedido.Confirmado, EstadoPedido.Entregado) => true, // Compatibilidad del endpoint anterior.
            (EstadoPedido.Confirmado, EstadoPedido.EnPreparacion) => true,
            (EstadoPedido.EnPreparacion, EstadoPedido.Enviado) => true,
            (EstadoPedido.Enviado, EstadoPedido.Entregado) => true,
            (EstadoPedido.Pendiente or EstadoPedido.Confirmado or EstadoPedido.EnPreparacion or EstadoPedido.Enviado, EstadoPedido.Cancelado) => true, _ => false };
        if (!permitida) throw new ReglaNegocioException($"No se puede pasar de {actual} a {destino}.");
    }
}
