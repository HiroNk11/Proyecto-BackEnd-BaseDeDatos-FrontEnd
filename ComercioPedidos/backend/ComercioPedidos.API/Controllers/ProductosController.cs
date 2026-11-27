using Microsoft.AspNetCore.Authorization;
using ComercioPedidos.API.Security;
using ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.Entitites;
using ComercioPedidos.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace ComercioPedidos.API.Controllers
{

    [Authorize(Policy = Policies.Orders)]
    [ApiController]
    [Route("api/[controller]")]
    public class ProductosController : ControllerBase
    {
        private readonly IProductoService _productoService;

        private readonly IStockService _stockService;
        public ProductosController(IProductoService productoService, IStockService stockService)
        {
            _productoService = productoService; _stockService = stockService;
        }

        [HttpGet]
        public async Task<ActionResult<List<Producto>>> GetProductos()
        {
            var productos = await _productoService.GetProductos();

            return Ok(productos);
        }
        [Authorize(Policy = Policies.Staff)]
        [HttpGet("stock-bajo")]
        public async Task<IActionResult> StockBajo() => Ok(await _stockService.StockBajoAsync());
        [Authorize(Policy = Policies.Staff)]
        [HttpPost("{id}/ajustes-stock")]
        public async Task<IActionResult> AjustarStock(int id, AjusteStockDto dto) { await _stockService.AjustarAsync(id, dto); return NoContent(); }
        [Authorize(Policy = Policies.Staff)]
        [HttpGet("{id}/movimientos-stock")]
        public async Task<IActionResult> HistorialStock(int id, int pagina = 1, int tamanioPagina = 10) => Ok(await _stockService.ObtenerMovimientosAsync(id, null, null, null, pagina, tamanioPagina));
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
        [Authorize(Policy = Policies.Staff)]
        [HttpPost]
        public async Task<ActionResult<Producto>> AddProduct(CrearProductoDto productoDto)
        {
            var producto = await _productoService.CrearProducto(productoDto);

            return CreatedAtAction(
                nameof(GetProducto),
                new { id = producto.Id },
                producto);
                                 
        }

        [Authorize(Policy = Policies.Staff)]
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

        [Authorize(Policy = Policies.Admin)]
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
