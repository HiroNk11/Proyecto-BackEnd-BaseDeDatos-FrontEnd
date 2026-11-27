using ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.Entitites;
using ComercioPedidos.Application.Services;
using ComercioPedidos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ComercioPedidos.Infrastructure.Services;

public class ProductoService : IProductoService
{
    private readonly ComercioPedidosDbContext _context;

    private readonly IStockService _stock;
    public ProductoService(ComercioPedidosDbContext context, IStockService stock)
    {
        _context = context; _stock = stock;
    }
    public async Task<IEnumerable<Producto>> GetProductos()
    {
        return await _context.Productos.ToListAsync();
    }
    public async Task<Producto?> GetProductoById(int id)
    {
        return await _context.Productos.FirstOrDefaultAsync(p => p.Id == id);
    }
    public async Task<Producto> CrearProducto(CrearProductoDto productoDto)
    {
        var producto = new Producto
        {
            Nombre = productoDto.Nombre,
            Descripcion = productoDto.Descripcion,
            Precio = productoDto.Precio,
            Stock = 0,
            StockMinimo = productoDto.StockMinimo,
            Activo = productoDto.Activo
        };
        _context.Productos.Add(producto);
        if (productoDto.Stock > 0) _stock.RegistrarEntrada(producto, productoDto.Stock, productoDto.MotivoStock ?? "Stock inicial del producto");
        await _context.SaveChangesAsync();
        return producto;
    }
    public async Task<Producto?> ActualizarProducto(int id, ActualizarProductoDto productoDto)
    {
        var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Id == id);

        if (producto == null)
        {
            return null;
        }

        if (productoDto.Version.HasValue && producto.Version != productoDto.Version) throw new ComercioPedidos.Application.Exceptions.ConflictoException("El producto cambió. Actualizá antes de guardar.");
        producto.Nombre = productoDto.Nombre;
        producto.Descripcion = productoDto.Descripcion;
        producto.Activo = productoDto.Activo;
        var delta = (long)productoDto.Stock - producto.Stock;
        if (delta > 0) _stock.RegistrarEntrada(producto, (int)delta, productoDto.MotivoStock ?? "Actualización de producto (compatibilidad)");
        if (delta < 0) _stock.RegistrarSalida(producto, (int)-delta, productoDto.MotivoStock ?? "Actualización de producto (compatibilidad)");
        if (productoDto.StockMinimo.HasValue) producto.StockMinimo = productoDto.StockMinimo.Value;
        producto.Precio = productoDto.Precio;

        await _context.SaveChangesAsync();
        return producto;
    }
    public async Task<bool> EliminarProducto(int id)
    {
        var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Id == id);

        if (producto == null)
        {
            return false;
        }
        if (await _context.DetallesPedidos.AnyAsync(d => d.ProductoId == id) ||
            await _context.MovimientosStock.AnyAsync(m => m.ProductoId == id))
            throw new ComercioPedidos.Application.Exceptions.ConflictoException("No se puede eliminar un producto con historial.");

        _context.Productos.Remove(producto);
        await _context.SaveChangesAsync();
        return true;
    }
}
