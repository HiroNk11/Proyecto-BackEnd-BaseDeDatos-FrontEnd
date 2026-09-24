using ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.Entitites;
using ComercioPedidos.Application.Enums;
using ComercioPedidos.Application.Exceptions;
using ComercioPedidos.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace ComercioPedidos.API.Controllers
{
    [ApiController] // This attribute indicates that the class is an API controller. It enables features like automatic model validation and binding of request data to action parameters.
    [Route("api/[controller]")] // This attribute defines the base route for the controller. The [controller] token will be replaced with the name of the controller, which is "Pedidos" in this case.
    public class PedidosController : ControllerBase
    {
        private readonly IPedidoService _pedidoService;
        public PedidosController(IPedidoService pedidoService)
        {
            _pedidoService = pedidoService;
        }
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PedidoDto>>> GetPedidos(
         EstadoPedido? estado
        ,int? clienteId
        ,DateTime? fechaDesde
        ,DateTime? fechaHasta
        ,int pagina = 1
        ,int tamanioPagina = 10)
        {
         var pedidos = await _pedidoService.ObtenerPedidosAsync(
             estado
             , clienteId
             , fechaDesde
             , fechaHasta
             , pagina
             , tamanioPagina);
         return Ok(pedidos);
        }
        [HttpGet("{id}")]
        public async Task<ActionResult<PedidoDto>> GetPedido(int id)
        {
          var pedido = await _pedidoService.ObtenerPedidoPorIdAsync(id);

            if (pedido == null)
            {
                return NotFound();
            }

            return Ok(pedido);
        }
        [HttpPost]
        public async Task<ActionResult<int>> CrearPedido(CrearPedidoDto pedido)
        {
            var pedidoId = await _pedidoService.CrearPedidoAsync(pedido);

            return CreatedAtAction(
                nameof(GetPedido),
                new { id = pedidoId },
                pedidoId
            );
        }

        [HttpPut("{id}/cancelar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CancelarPedido(int id)
        {
            await _pedidoService.CancelarPedidoAsync(id);

            return NoContent();
        }

        [HttpPut("{id}/confirmar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ConfirmarPedido(int id)
        {
            await _pedidoService.ConfirmarPedidoAsync(id);

            return NoContent();
        }

        [HttpPut("{id}/entregar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> EntregarPedido(int id)
        {
            await _pedidoService.EntregarPedidoAsync(id);

            return NoContent();
        }
    }
}
