using ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.Entitites;
using ComercioPedidos.Application.Services;
using ComercioPedidos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using ComercioPedidos.Application.Exceptions;
using ComercioPedidos.Application.Enums;


namespace ComercioPedidos.Infrastructure.Services
{
    public class PedidoService : IPedidoService
    {
        private readonly ComercioPedidosDbContext _context;
        public PedidoService(ComercioPedidosDbContext context)
        {
            _context = context;
        }
        public async Task<IEnumerable<PedidoDto>> ObtenerPedidosAsync()
        {
            var pedidos = await _context.Pedidos
                .Include(p => p.Cliente)
                .Include(p => p.Detalles)
                .ThenInclude(d => d.Producto)
                .ToListAsync();
            return pedidos.Select(p => new PedidoDto
            {
                Id = p.Id,
                ClienteId = p.ClienteId,
                NombreCliente = $"{p.Cliente.Nombre} {p.Cliente.Apellido}",
                Fecha = p.Fecha,
                Estado = p.Estado.ToString(),
                Total = p.Total,
                Detalles = p.Detalles.Select(d => new DetallePedidoDto
                {
                    ProductoId = d.ProductoId,
                    NombreProducto = d.Producto.Nombre,
                    Cantidad = d.Cantidad,
                    PrecioUnitario = d.PrecioUnitario,
                    Subtotal = d.Cantidad * d.PrecioUnitario
                }).ToList()
            });
        }
        public async Task<PedidoDto?> ObtenerPedidoPorIdAsync(int id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Cliente)
                .Include(p => p.Detalles)
                .ThenInclude(d => d.Producto)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (pedido == null)
            {
                return null;
            }
            var pedidoDto = new PedidoDto
            {
                Id = pedido.Id,
                ClienteId = pedido.ClienteId,
                NombreCliente = $"{pedido.Cliente.Nombre} {pedido.Cliente.Apellido}",
                Fecha = pedido.Fecha,
                Estado = pedido.Estado.ToString(),
                Total = pedido.Total,
                Detalles = pedido.Detalles.Select(d => new DetallePedidoDto
                {
                    ProductoId = d.ProductoId,
                    NombreProducto = d.Producto.Nombre,
                    Cantidad = d.Cantidad,
                    PrecioUnitario = d.PrecioUnitario,
                    Subtotal = d.Cantidad * d.PrecioUnitario
                }).ToList()
            };

            return pedidoDto;
        }
        public async Task<int> CrearPedidoAsync(CrearPedidoDto crearPedidoDto)
        {
            var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Id == crearPedidoDto.ClienteId);
            if (cliente == null)
            {
                throw new Exception("El cliente no existe.");
            }
            var pedido = new Pedido
            {
                ClienteId = crearPedidoDto.ClienteId,
                Fecha = DateTime.UtcNow,
                Estado = EstadoPedido.Pendiente,
                Total = 0,
                Detalles = new List<DetallePedido>()
            };
          
            foreach (var detalleDto in crearPedidoDto.Detalles)
            {
                var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Id == detalleDto.ProductoId);

                if (producto == null)
                {
                    throw new Exception("El producto no existe.");
                }

                if(producto.Activo == false)
                {
                    throw new Exception($"El producto {producto.Nombre} no está activo.");
                }

                if (detalleDto.Cantidad > producto.Stock)
                {
                    throw new Exception($"Stock insuficiente para el producto {producto.Nombre}.");
                }
                var detalle = new DetallePedido
                {
                    ProductoId = producto.Id,
                    Cantidad = detalleDto.Cantidad,
                    PrecioUnitario = producto.Precio

                };
                var subtotal = producto.Precio * detalleDto.Cantidad;

                pedido.Total += subtotal;
                pedido.Detalles.Add(detalle);

              
                producto.Stock -= detalleDto.Cantidad;
            }
            await _context.Pedidos.AddAsync(pedido);
            await _context.SaveChangesAsync();
            return pedido.Id;
        }
        public async Task CancelarPedidoAsync(int id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Detalles)
                .ThenInclude(d => d.Producto)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null)
            {
                throw new NotFoundException("El pedido no existe.");
            }
            if (pedido.Estado != EstadoPedido.Pendiente && pedido.Estado != EstadoPedido.Confirmado)
            {
                throw new ReglaNegocioException(
                    $"No se puede cancelar un pedido con estado {pedido.Estado}."
                );
            }
            pedido.Estado = EstadoPedido.Cancelado;
            foreach (var detalle in pedido.Detalles)
            {
                if (detalle.Producto != null)
                {
                    detalle.Producto.Stock += detalle.Cantidad;
                }
            }
            await _context.SaveChangesAsync();
        }
        public async Task ConfirmarPedidoAsync(int id)
        {
            var pedido = await _context.Pedidos
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null)
            {
                throw new NotFoundException("El pedido no existe.");
            }

            if (pedido.Estado != EstadoPedido.Pendiente)
            {
                throw new ReglaNegocioException(
                    $"No se puede confirmar un pedido con estado {pedido.Estado}."
                );
            }

            pedido.Estado = EstadoPedido.Confirmado;

            await _context.SaveChangesAsync();
        }
        public async Task EntregarPedidoAsync(int id)
        {
            var pedido = await _context.Pedidos
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null)
            {
                throw new NotFoundException("El pedido no existe.");
            }

            if (pedido.Estado != EstadoPedido.Confirmado)
            {
                throw new ReglaNegocioException(
                    $"No se puede entregar un pedido con estado {pedido.Estado}."
                );
            }

            pedido.Estado = EstadoPedido.Entregado;

            await _context.SaveChangesAsync();
        }
    }
}
