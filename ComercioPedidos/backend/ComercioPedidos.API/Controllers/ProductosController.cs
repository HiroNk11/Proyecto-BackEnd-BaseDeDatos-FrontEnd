using ComercioPedidos.Application.Entitites;
using ComercioPedidos.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ComercioPedidos.API.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class ProductosController : ControllerBase
    {
        private readonly ComercioPedidosDbContext _context;

        public ProductosController(ComercioPedidosDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<Producto>>> GetProductos()
        {
            var productos = await _context.Productos.ToListAsync();

            return Ok(productos);
        }
        [HttpGet("{id}")]
        public async Task<ActionResult<Producto>> GetProducto(int id)
        {
            var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Id == id);

            if (producto == null)
            {
                return NotFound();
            }

            return Ok(producto);
        }
        [HttpPost]
        public async Task<ActionResult<Producto>> AddProduct(Producto producto)
        {
            _context.Productos.Add(producto);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetProducto),
                new { id = producto.Id },
                producto);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Producto>> UpdateProduct(int id, Producto pro)
        {
            var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Id == id);

            if (producto == null)
            {
                return NotFound();
            }
            producto.Nombre = pro.Nombre;
            producto.Descripcion = pro.Descripcion;
            producto.Activo = pro.Activo;
            producto.Stock  = pro.Stock;
            producto.Precio = pro.Precio;           
            await _context.SaveChangesAsync();
            return Ok(producto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Id == id);
            if (producto == null)
            {
                return NotFound();
            }
            _context.Productos.Remove(producto);
            await _context.SaveChangesAsync();
            return NoContent();

        }
    }

}
