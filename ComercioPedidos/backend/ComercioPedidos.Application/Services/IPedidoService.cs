using ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.Enums;

namespace ComercioPedidos.Application.Services
{
    public interface IPedidoService
    {
        Task<int> CrearPedidoAsync(CrearPedidoDto crearPedidoDto);
        Task<ResultadoPaginado<PedidoDto>> ObtenerPedidosAsync(
        EstadoPedido? estado,
        int? clienteId,
        DateTime? fechaDesde,
        DateTime? fechaHasta,
        int pagina = 1,
        int tamanioPagina = 10);
        Task<PedidoDto?> ObtenerPedidoPorIdAsync(int id);
        Task CancelarPedidoAsync(int id);
        Task ConfirmarPedidoAsync(int id);
        Task EntregarPedidoAsync(int id);
    }
}
