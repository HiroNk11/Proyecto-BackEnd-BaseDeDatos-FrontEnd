using ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.Entitites;
using System;
using System.Collections.Generic;
using System.Text;

namespace ComercioPedidos.Application.Services
{
    public interface IPedidoService
    {
        Task<int> CrearPedidoAsync(CrearPedidoDto crearPedidoDto);
        Task<IEnumerable<PedidoDto>> ObtenerPedidosAsync();
        Task<PedidoDto?> ObtenerPedidoPorIdAsync(int id);
        Task CancelarPedidoAsync(int id);
        Task ConfirmarPedidoAsync(int id);
        Task EntregarPedidoAsync(int id);
    }
}
