using ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.DTO.ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.Entitites;
using ComercioPedidos.Application.Enum;
using System;
using System.Collections.Generic;
using System.Text;

namespace ComercioPedidos.Application.Services
{
    public interface IStockService
    {
        void RegistrarSalida(
            Producto producto,
            int cantidad,
            string motivo,
            int? pedidoId = null
        );

        void RegistrarEntrada(
            Producto producto,
            int cantidad,
            string motivo,
            int? pedidoId = null
        );

        Task<ResultadoPaginado<MovimientoStockDto>>
    ObtenerMovimientosAsync(
        int? productoId,
        TipoMovimientoStock? tipo,
        DateTime? fechaDesde,
        DateTime? fechaHasta,
        int pagina = 1,
        int tamanioPagina = 10
    );
        Task RegistrarEntradaManualAsync(
            int productoId,
            int cantidad,
            string? motivo
        );

        Task RegistrarSalidaManualAsync(
    int productoId,
    int cantidad,
    string? motivo
);
    }

}
