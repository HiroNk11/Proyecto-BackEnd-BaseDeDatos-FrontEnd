using ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.Entitites;
using ComercioPedidos.Application.Services;
using ComercioPedidos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using ComercioPedidos.Application.Exceptions;
using ComercioPedidos.Application.Enums;
using ComercioPedidos.Application.Rules;

namespace ComercioPedidos.Infrastructure.Services;

public sealed class PedidoService(ComercioPedidosDbContext context, IStockService stockService, ICurrentUser user) : IPedidoService
{
    public async Task<ResultadoPaginado<PedidoDto>> ObtenerPedidosAsync(EstadoPedido? estado, int? clienteId, DateTime? fechaDesde, DateTime? fechaHasta, int pagina = 1, int tamanioPagina = 10)
    {
        if (pagina <= 0 || tamanioPagina is < 1 or > 100 || (long)(pagina - 1) * tamanioPagina > int.MaxValue)
            throw new ReglaNegocioException("La paginación está fuera de rango.");
        if (estado.HasValue && !System.Enum.IsDefined(estado.Value) || clienteId is <= 0)
            throw new ReglaNegocioException("El filtro no es válido.");
        if (fechaDesde > fechaHasta || fechaHasta?.Date == DateTime.MaxValue.Date)
            throw new ReglaNegocioException("El rango de fechas no es válido.");
        var query = context.Pedidos.AsNoTracking().Include(p => p.Cliente).Include(p => p.Detalles).ThenInclude(d => d.Producto).AsQueryable();
        if (estado.HasValue) query = query.Where(p => p.Estado == estado.Value);
        if (clienteId.HasValue) query = query.Where(p => p.ClienteId == clienteId.Value);
        if (fechaDesde.HasValue) query = query.Where(p => p.Fecha >= fechaDesde.Value.Date);
        if (fechaHasta.HasValue) { var fin = fechaHasta.Value.Date.AddDays(1); query = query.Where(p => p.Fecha < fin); }
        var count = await query.CountAsync();
        var pedidos = await query.OrderByDescending(p => p.Fecha).ThenByDescending(p => p.Id).Skip((pagina - 1) * tamanioPagina).Take(tamanioPagina).ToListAsync();
        return new ResultadoPaginado<PedidoDto> { Items = pedidos.Select(Map), Pagina = pagina, TamanioPagina = tamanioPagina, TotalRegistros = count, TotalPaginas = (int)Math.Ceiling((double)count / tamanioPagina) };
    }

    public async Task<PedidoDto?> ObtenerPedidoPorIdAsync(int id)
    {
        var pedido = await context.Pedidos.AsNoTracking().Include(p => p.Historial).Include(p => p.Cliente).Include(p => p.Detalles).ThenInclude(d => d.Producto).SingleOrDefaultAsync(p => p.Id == id);
        return pedido is null ? null : Map(pedido);
    }

    public async Task<int> CrearPedidoAsync(CrearPedidoDto dto)
    {
        var detalles = PedidoRules.NormalizarDetalles(dto);
        await using var tx = await context.Database.BeginTransactionAsync();
        var cliente = await context.Clientes.SingleOrDefaultAsync(c => c.Id == dto.ClienteId)
            ?? throw new NotFoundException("El cliente no existe.");
        if (!cliente.Activo) throw new ReglaNegocioException("El cliente no está activo.");
        var pedido = new Pedido { ClienteId = dto.ClienteId, Fecha = DateTime.UtcNow, Estado = EstadoPedido.Pendiente };
        var productos = new List<(Producto Producto, int Cantidad)>();
        foreach (var item in detalles)
        {
            var producto = await context.Productos.SingleOrDefaultAsync(p => p.Id == item.ProductoId)
                ?? throw new NotFoundException("El producto no existe.");
            if (!producto.Activo) throw new ReglaNegocioException("El producto no está activo.");
            if (producto.Stock < item.Cantidad) throw new ConflictoException("Stock insuficiente para completar el pedido.");
            pedido.Total += PedidoRules.Subtotal(producto.Precio, item.Cantidad);
            if (pedido.Total > PedidoRules.ImporteMaximo) throw new ReglaNegocioException("El total del pedido excede el límite permitido.");
            pedido.Detalles.Add(new DetallePedido { ProductoId = producto.Id, Cantidad = item.Cantidad, PrecioUnitario = producto.Precio });
            productos.Add((producto, item.Cantidad));
        }
        pedido.Historial.Add(new() { EstadoNuevo = EstadoPedido.Pendiente, FechaUtc = DateTime.UtcNow, UsuarioId = user.Id });
        context.Pedidos.Add(pedido);
        await context.SaveChangesAsync();
        foreach (var (producto, cantidad) in productos) stockService.RegistrarSalida(producto, cantidad, "Venta", pedido.Id);
        await context.SaveChangesAsync();
        await tx.CommitAsync();
        return pedido.Id;
    }

    public Task PrepararPedidoAsync(int id) => CambiarEstadoAsync(id, EstadoPedido.EnPreparacion);
    public Task EnviarPedidoAsync(int id) => CambiarEstadoAsync(id, EstadoPedido.Enviado);
    public Task ConfirmarPedidoAsync(int id) => CambiarEstadoAsync(id, EstadoPedido.Confirmado);
    public Task EntregarPedidoAsync(int id) => CambiarEstadoAsync(id, EstadoPedido.Entregado);
    private async Task CambiarEstadoAsync(int id, EstadoPedido destino)
    {
        var pedido = await context.Pedidos.SingleOrDefaultAsync(p => p.Id == id) ?? throw new NotFoundException("El pedido no existe.");
        PedidoRules.ValidarTransicion(pedido.Estado, destino);
        RegistrarEstado(pedido, destino);
        await context.SaveChangesAsync();
    }

    public async Task CancelarPedidoAsync(int id)
    {
        await using var tx = await context.Database.BeginTransactionAsync();
        var pedido = await context.Pedidos.Include(p => p.Detalles).ThenInclude(d => d.Producto).SingleOrDefaultAsync(p => p.Id == id)
            ?? throw new NotFoundException("El pedido no existe.");
        PedidoRules.ValidarTransicion(pedido.Estado, EstadoPedido.Cancelado);
        RegistrarEstado(pedido, EstadoPedido.Cancelado);
        foreach (var detalle in pedido.Detalles.OrderBy(d => d.ProductoId))
            stockService.RegistrarEntrada(detalle.Producto ?? throw new NotFoundException("El producto del pedido no existe."), detalle.Cantidad, "Cancelación de pedido", pedido.Id);
        await context.SaveChangesAsync();
        await tx.CommitAsync();
    }

    private void RegistrarEstado(Pedido pedido, EstadoPedido destino)
    {
        pedido.Historial.Add(new() { EstadoAnterior = pedido.Estado, EstadoNuevo = destino, FechaUtc = DateTime.UtcNow, UsuarioId = user.Id });
        pedido.Estado = destino;
    }
    private static PedidoDto Map(Pedido p) => new()
    {
        Id = p.Id, ClienteId = p.ClienteId, NombreCliente = $"{p.Cliente?.Nombre} {p.Cliente?.Apellido}".Trim(), Fecha = p.Fecha, Estado = p.Estado.ToString(), Total = p.Total,
        Historial = p.Historial.OrderBy(h => h.FechaUtc).ThenBy(h => h.Id).Select(h => new HistorialEstadoPedidoDto { Id=h.Id, EstadoAnterior=h.EstadoAnterior?.ToString(), EstadoNuevo=h.EstadoNuevo.ToString(), FechaUtc=DateTime.SpecifyKind(h.FechaUtc, DateTimeKind.Utc), UsuarioId=h.UsuarioId }).ToList(),
        Detalles = p.Detalles.Select(d => new DetallePedidoDto { ProductoId = d.ProductoId, NombreProducto = d.Producto?.Nombre ?? string.Empty, Cantidad = d.Cantidad, PrecioUnitario = d.PrecioUnitario, Subtotal = d.Cantidad * d.PrecioUnitario }).ToList()
    };
}
