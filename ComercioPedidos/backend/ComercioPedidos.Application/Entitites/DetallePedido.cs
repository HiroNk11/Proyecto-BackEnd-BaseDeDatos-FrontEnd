

namespace ComercioPedidos.Application.Entitites
{
    public class DetallePedido
    {
        public int Id { get; set; }
        public int PedidoId { get; set; }
        public int ProductoId { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }

        public Pedido? Pedido { get; set; } // Propiedad de navegación hacia el pedido al que pertenece el detalle

        public Producto? Producto { get; set; } // Propiedad de navegación hacia el producto que se está detallando
    }
}
