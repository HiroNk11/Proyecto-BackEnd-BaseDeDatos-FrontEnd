using ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.Enum;
using ComercioPedidos.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace ComercioPedidos.API.Controllers
{
    [ApiController]
    [Route("api/movimientos-stock")]
    public class MovimientosStockController : ControllerBase
    {
        private readonly IStockService _stockService;

        public MovimientosStockController(
            IStockService stockService
        )
        {
            _stockService = stockService;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerMovimientos(
            [FromQuery] int? productoId,
            [FromQuery] TipoMovimientoStock? tipo,
            [FromQuery] DateTime? fechaDesde,
            [FromQuery] DateTime? fechaHasta,
            [FromQuery] int pagina = 1,
            [FromQuery] int tamanioPagina = 10
        )
        {
            var resultado =
                await _stockService
                    .ObtenerMovimientosAsync(
                        productoId,
                        tipo,
                        fechaDesde,
                        fechaHasta,
                        pagina,
                        tamanioPagina
                    );

            return Ok(resultado);
        }

        [HttpPost("entrada")]
        public async Task<IActionResult> RegistrarEntrada(
    [FromBody] RegistrarEntradaStockDto dto
)
        {
            await _stockService.RegistrarEntradaManualAsync(
                dto.ProductoId,
                dto.Cantidad,
                dto.Motivo
            );

            return NoContent();
        }

        [HttpPost("salida")]
        public async Task<IActionResult> RegistrarSalida(
    [FromBody] RegistrarSalidaStockDto dto
)
        {
            await _stockService.RegistrarSalidaManualAsync(
                dto.ProductoId,
                dto.Cantidad,
                dto.Motivo
            );

            return NoContent();
        }
    }


}