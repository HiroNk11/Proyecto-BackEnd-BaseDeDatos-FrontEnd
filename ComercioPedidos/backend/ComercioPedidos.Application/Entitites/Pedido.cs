using ComercioPedidos.Application.Enums;

namespace ComercioPedidos.Application.Entitites
{
    public class Pedido
    {
        public int Id { get; set; }
        public int ClienteId { get; set; }
        public DateTime Fecha { get; set; }
        public EstadoPedido Estado { get; set; }
        public decimal Total { get; set; }
        public Cliente? Cliente { get; set; }// Propiedad de navegación hacia el cliente que realizó el pedido
        public ICollection<DetallePedido> Detalles { get; set; }= new List<DetallePedido>(); // Propiedad de navegación hacia los detalles del pedido
    }
}
