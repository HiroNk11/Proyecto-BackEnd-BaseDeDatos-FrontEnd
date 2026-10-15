using ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.DTO.ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.Entitites;
using ComercioPedidos.Application.Enum;
using ComercioPedidos.Application.Exceptions;
using ComercioPedidos.Application.Services;
using ComercioPedidos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace ComercioPedidos.Infrastructure.Services
{
    public class StockService : IStockService
    {
        private readonly ComercioPedidosDbContext _context;

        public StockService(
            ComercioPedidosDbContext context
        )
        {
            _context = context;
        }

        public void RegistrarSalida(
    Producto producto,
    int cantidad,
    string motivo,
    int? pedidoId = null
)
        {
            if (cantidad <= 0)
            {
                throw new ReglaNegocioException(
                    "La cantidad debe ser mayor que cero."
                );
            }

            if (producto.Stock < cantidad)
            {
                throw new ReglaNegocioException(
                    $"Stock insuficiente para el producto {producto.Nombre}."
                );
            }

            int stockAnterior = producto.Stock;

            producto.Stock -= cantidad;

            var movimiento = new MovimientoStock
            {
                ProductoId = producto.Id,
                Fecha = DateTime.UtcNow,
                Tipo = TipoMovimientoStock.Salida,
                Cantidad = cantidad,
                StockAnterior = stockAnterior,
                StockPosterior = producto.Stock,
                Motivo = motivo,
                PedidoId = pedidoId
            };
  
            _context.MovimientosStock.Add(
                movimiento
            );
        }

        public void RegistrarEntrada(
            Producto producto,
            int cantidad,
            string motivo,
            int? pedidoId = null
        )
        {
            if (cantidad <= 0)
            {
                throw new ReglaNegocioException(
                    "La cantidad debe ser mayor que cero."
                );
            }

            int stockAnterior = producto.Stock;

            producto.Stock += cantidad;

            var movimiento = new MovimientoStock
            {
                ProductoId = producto.Id,
                Fecha = DateTime.UtcNow,
                Tipo = TipoMovimientoStock.Entrada,
                Cantidad = cantidad,
                StockAnterior = stockAnterior,
                StockPosterior = producto.Stock,
                Motivo = motivo,
                PedidoId = pedidoId
            };

            _context.MovimientosStock.Add(
                movimiento
            );
        }
        public async Task<ResultadoPaginado<MovimientoStockDto>>
    ObtenerMovimientosAsync(
        int? productoId,
        TipoMovimientoStock? tipo,
        DateTime? fechaDesde,
        DateTime? fechaHasta,
        int pagina = 1,
        int tamanioPagina = 10
    )
        {
            if (pagina <= 0 || tamanioPagina <= 0)
            {
                throw new ReglaNegocioException(
                    "El número de página y el tamaño de página deben ser mayores que cero."
                );
            }

            if (tamanioPagina > 100)
            {
                throw new ReglaNegocioException(
                    "El tamaño de página no puede ser mayor a 100."
                );
            }

            if (
                fechaDesde.HasValue &&
                fechaHasta.HasValue &&
                fechaDesde.Value > fechaHasta.Value
            )
            {
                throw new ReglaNegocioException(
                    "La fecha desde no puede ser mayor que la fecha hasta."
                );
            }

            var query = _context.MovimientosStock
                .AsNoTracking()
                .Include(m => m.Producto)
                .AsQueryable();

            if (productoId.HasValue)
            {
                query = query.Where(
                    m => m.ProductoId == productoId.Value
                );
            }

            if (tipo.HasValue)
            {
                query = query.Where(
                    m => m.Tipo == tipo.Value
                );
            }

            if (fechaDesde.HasValue)
            {
                var inicioDia =
                    fechaDesde.Value.Date;

                query = query.Where(
                    m => m.Fecha >= inicioDia
                );
            }

            if (fechaHasta.HasValue)
            {
                var diaSiguiente =
                    fechaHasta.Value.Date.AddDays(1);

                query = query.Where(
                    m => m.Fecha < diaSiguiente
                );
            }

            var totalRegistros =
                await query.CountAsync();

            var movimientos = await query
                .OrderByDescending(m => m.Fecha)
                .ThenByDescending(m => m.Id)
                .Skip(
                    (pagina - 1) * tamanioPagina
                )
                .Take(tamanioPagina)
                .ToListAsync();

            var items = movimientos
                .Select(m => new MovimientoStockDto
                {
                    Id = m.Id,

                    ProductoId =
                        m.ProductoId,

                    NombreProducto =
                        m.Producto?.Nombre ?? "",

                    Fecha =
                        m.Fecha,

                    Tipo =
                        m.Tipo.ToString(),

                    Cantidad =
                        m.Cantidad,

                    StockAnterior =
                        m.StockAnterior,

                    StockPosterior =
                        m.StockPosterior,

                    Motivo =
                        m.Motivo,

                    PedidoId =
                        m.PedidoId
                })
                .ToList();

            return new ResultadoPaginado<
                MovimientoStockDto
            >
            {
                Items = items,

                Pagina = pagina,

                TamanioPagina =
                    tamanioPagina,

                TotalRegistros =
                    totalRegistros,

                TotalPaginas =
                    (int)Math.Ceiling(
                        (double)totalRegistros /
                        tamanioPagina
                    )
            };
        }
        public async Task RegistrarEntradaManualAsync(
    int productoId,
    int cantidad,
    string? motivo
)
        {
            if (cantidad <= 0)
            {
                throw new ReglaNegocioException(
                    "La cantidad debe ser mayor que cero."
                );
            }

            var producto = await _context.Productos
                .FirstOrDefaultAsync(
                    p => p.Id == productoId
                );

            if (producto == null)
            {
                throw new NotFoundException(
                    "Producto no encontrado."
                );
            }

            RegistrarEntrada(
                producto,
                cantidad,
                string.IsNullOrWhiteSpace(motivo)
                    ? "Reposición manual"
                    : motivo
            );

            await _context.SaveChangesAsync();
        }

        public async Task RegistrarSalidaManualAsync(
    int productoId,
    int cantidad,
    string? motivo
)
        {
            if (cantidad <= 0)
            {
                throw new ReglaNegocioException(
                    "La cantidad debe ser mayor que cero."
                );
            }

            var producto = await _context.Productos
                .FirstOrDefaultAsync(
                    p => p.Id == productoId
                );

            if (producto == null)
            {
                throw new NotFoundException(
                    "Producto no encontrado."
                );
            }

            RegistrarSalida(
                producto,
                cantidad,
                string.IsNullOrWhiteSpace(motivo)
                    ? "Salida manual"
                    : motivo
            );

            await _context.SaveChangesAsync();
        }
    }
}
