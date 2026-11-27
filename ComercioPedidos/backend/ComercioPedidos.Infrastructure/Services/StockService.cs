using ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.DTO.ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.Entitites;
using ComercioPedidos.Application.Enum;
using ComercioPedidos.Application.Exceptions;
using ComercioPedidos.Application.Services;
using ComercioPedidos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
namespace ComercioPedidos.Infrastructure.Services;

public sealed class StockService(ComercioPedidosDbContext context, ICurrentUser user) : IStockService
{
    private void Registrar(Producto producto, int delta, string motivo, int? pedidoId, ClaseMovimientoStock clase)
    {
        if (delta == 0 || string.IsNullOrWhiteSpace(motivo)) throw new ReglaNegocioException("La cantidad y el motivo son obligatorios.");
        var nuevo = (long)producto.Stock + delta;
        if (nuevo < 0) throw new ConflictoException("Stock insuficiente para completar la operación.");
        if (nuevo > int.MaxValue) throw new ReglaNegocioException("El stock excede el límite permitido.");
        context.MovimientosStock.Add(new MovimientoStock {
            Producto = producto, ProductoId = producto.Id, Fecha = DateTime.UtcNow,
            Tipo = delta > 0 ? TipoMovimientoStock.Entrada : TipoMovimientoStock.Salida,
            TipoMovimiento = clase, Cantidad = Math.Abs(delta), StockAnterior = producto.Stock,
            StockPosterior = (int)nuevo, PedidoId = pedidoId, Motivo = motivo.Trim(), UsuarioId = user.Id
        });
        producto.Stock = (int)nuevo;
    }
    public void RegistrarSalida(Producto producto, int cantidad, string motivo, int? pedidoId = null)
    {
        if (cantidad <= 0) throw new ReglaNegocioException("La cantidad debe ser mayor que cero.");
        Registrar(producto, -cantidad, motivo, pedidoId, pedidoId.HasValue ? ClaseMovimientoStock.ReservaPorPedido : ClaseMovimientoStock.AjusteManual);
    }
    public void RegistrarEntrada(Producto producto, int cantidad, string motivo, int? pedidoId = null)
    {
        if (cantidad <= 0) throw new ReglaNegocioException("La cantidad debe ser mayor que cero.");
        Registrar(producto, cantidad, motivo, pedidoId, pedidoId.HasValue ? ClaseMovimientoStock.LiberacionPorCancelacion : ClaseMovimientoStock.Ingreso);
    }
    public async Task AjustarAsync(int productoId, AjusteStockDto dto)
    {
        if (dto.TipoMovimiento is not ("Ingreso" or "AjusteManual") || dto.Cantidad is 0 or int.MinValue || dto.TipoMovimiento == "Ingreso" && dto.Cantidad < 0 || string.IsNullOrWhiteSpace(dto.Motivo) || dto.Motivo.Trim().Length is < 3 or > 250)
            throw new ReglaNegocioException("El ajuste requiere tipo, cantidad y motivo válidos.");
        var producto = await context.Productos.SingleOrDefaultAsync(p => p.Id == productoId) ?? throw new NotFoundException("El producto no existe.");
        if (dto.Version.HasValue && producto.Version != dto.Version) throw new ConflictoException("El inventario cambió. Actualizá antes de ajustar.");
        Registrar(producto, dto.Cantidad, dto.Motivo, null, dto.TipoMovimiento == "Ingreso" ? ClaseMovimientoStock.Ingreso : ClaseMovimientoStock.AjusteManual);
        await context.SaveChangesAsync(); // Producto + movimiento: una transacción EF.
    }
    public async Task RegistrarEntradaManualAsync(int productoId, int cantidad, string? motivo) => await AjustarAsync(productoId, new() { TipoMovimiento = "Ingreso", Cantidad = cantidad, Motivo = string.IsNullOrWhiteSpace(motivo) ? "Reposición manual (compatibilidad)" : motivo });
    public async Task RegistrarSalidaManualAsync(int productoId, int cantidad, string? motivo)
    {
        if (cantidad <= 0) throw new ReglaNegocioException("La cantidad debe ser mayor que cero.");
        await AjustarAsync(productoId, new() { TipoMovimiento = "AjusteManual", Cantidad = -cantidad, Motivo = string.IsNullOrWhiteSpace(motivo) ? "Salida manual (compatibilidad)" : motivo });
    }
    public Task<List<Producto>> StockBajoAsync() => context.Productos.AsNoTracking().Where(p => p.Activo && p.Stock <= p.StockMinimo).OrderBy(p => p.Stock).ThenBy(p => p.Id).ToListAsync();
    public async Task<ResultadoPaginado<MovimientoStockDto>> ObtenerMovimientosAsync(int? productoId, TipoMovimientoStock? tipo, DateTime? fechaDesde, DateTime? fechaHasta, int pagina = 1, int tamanioPagina = 10)
    {
        if (pagina <= 0 || tamanioPagina is < 1 or > 100 || (long)(pagina - 1) * tamanioPagina > int.MaxValue || productoId is <= 0 || tipo.HasValue && !System.Enum.IsDefined(tipo.Value)) throw new ReglaNegocioException("Los filtros o la paginación no son válidos.");
        if (fechaDesde > fechaHasta || fechaHasta?.Date == DateTime.MaxValue.Date) throw new ReglaNegocioException("El rango de fechas no es válido.");
        if (productoId.HasValue && !await context.Productos.AnyAsync(p => p.Id == productoId)) throw new NotFoundException("El producto no existe.");
        var query = context.MovimientosStock.AsNoTracking().Include(m => m.Producto).AsQueryable();
        if (productoId.HasValue) query = query.Where(m => m.ProductoId == productoId);
        if (tipo.HasValue) query = query.Where(m => m.Tipo == tipo);
        if (fechaDesde.HasValue) query = query.Where(m => m.Fecha >= fechaDesde.Value.Date);
        if (fechaHasta.HasValue) { var fin = fechaHasta.Value.Date.AddDays(1); query = query.Where(m => m.Fecha < fin); }
        var count = await query.CountAsync();
        var rows = await query.OrderByDescending(m => m.Fecha).ThenByDescending(m => m.Id).Skip((pagina-1)*tamanioPagina).Take(tamanioPagina).ToListAsync();
        return new() { Pagina = pagina, TamanioPagina = tamanioPagina, TotalRegistros = count, TotalPaginas = (int)Math.Ceiling((double)count/tamanioPagina), Items = rows.Select(m => new MovimientoStockDto {
            Id=m.Id, ProductoId=m.ProductoId, NombreProducto=m.Producto?.Nombre ?? "", Fecha=DateTime.SpecifyKind(m.Fecha,DateTimeKind.Utc), FechaUtc=DateTime.SpecifyKind(m.Fecha,DateTimeKind.Utc), Tipo=m.Tipo.ToString(), TipoMovimiento=m.TipoMovimiento.ToString(), Cantidad=m.Cantidad, StockAnterior=m.StockAnterior, StockPosterior=m.StockPosterior, StockNuevo=m.StockPosterior, Motivo=m.Motivo, PedidoId=m.PedidoId, UsuarioId=m.UsuarioId
        }).ToList() };
    }
}
