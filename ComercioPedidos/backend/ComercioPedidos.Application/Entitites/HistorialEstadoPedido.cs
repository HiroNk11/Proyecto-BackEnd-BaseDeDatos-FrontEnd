using ComercioPedidos.Application.Enums;
using System.Text.Json.Serialization;
namespace ComercioPedidos.Application.Entitites;
public class HistorialEstadoPedido
{
    public int Id { get; set; }
    public int PedidoId { get; set; }
    public EstadoPedido? EstadoAnterior { get; set; }
    public EstadoPedido EstadoNuevo { get; set; }
    public DateTime FechaUtc { get; set; }
    public string UsuarioId { get; set; } = "historico-desconocido";
    [JsonIgnore] public Pedido? Pedido { get; set; }
}
