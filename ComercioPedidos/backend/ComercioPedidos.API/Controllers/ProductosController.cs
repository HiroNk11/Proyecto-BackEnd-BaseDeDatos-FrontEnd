using ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.Entitites;
using ComercioPedidos.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace ComercioPedidos.API.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class ProductosController : ControllerBase
    {
        private readonly IProductoService _productoService;

        public ProductosController(IProductoService productoService)
        {
            _productoService = productoService;
        }

        [HttpGet]
        public async Task<ActionResult<List<Producto>>> GetProductos()
        {
            var productos = await _productoService.GetProductos();

            return Ok(productos);
        }
        [HttpGet("{id}")]
        public async Task<ActionResult<Producto>> GetProducto(int id)
        {
            var producto = await _productoService.GetProductoById(id);

            if (producto == null)
            {
                return NotFound();
            }

            return Ok(producto);
        }
        [HttpPost]
        public async Task<ActionResult<Producto>> AddProduct(CrearProductoDto productoDto)
        {
            var producto = await _productoService.CrearProducto(productoDto);

            return CreatedAtAction(
                nameof(GetProducto),
                new { id = producto.Id },
                producto);
                                 
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Producto>> UpdateProduct(int id, ActualizarProductoDto productoDto)
        {
          var producto = await _productoService.ActualizarProducto(id, productoDto);

          if (producto == null)
          {
          return NotFound();
          }

          return Ok(producto);
         }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
         var eliminado = await _productoService.EliminarProducto(id);
         if (!eliminado)
         {
         return NotFound();
         }
         return NoContent();
        }
    }

}
