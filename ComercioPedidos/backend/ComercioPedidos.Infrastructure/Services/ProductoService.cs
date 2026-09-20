using ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.Entitites;
using ComercioPedidos.Application.Services;
using ComercioPedidos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ComercioPedidos.Infrastructure.Services;

public class ProductoService : IProductoService
{
    private readonly ComercioPedidosDbContext _context;

    public ProductoService(ComercioPedidosDbContext context)
    {
        _context = context;
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
            Stock = productoDto.Stock,
            Activo = productoDto.Activo
        };
        _context.Productos.Add(producto);
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

        producto.Nombre = productoDto.Nombre;
        producto.Descripcion = productoDto.Descripcion;
        producto.Activo = productoDto.Activo;
        producto.Stock = productoDto.Stock;
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

        _context.Productos.Remove(producto);
        await _context.SaveChangesAsync();
        return true;
    }
}