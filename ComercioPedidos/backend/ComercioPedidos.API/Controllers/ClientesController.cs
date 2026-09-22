using ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.Entitites;
using ComercioPedidos.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace ComercioPedidos.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientesController : ControllerBase
    {
        private readonly IClienteService _clienteService;
        public ClientesController(IClienteService clienteService)
        {
            _clienteService = clienteService;
        }
        [HttpGet]
        public async Task<ActionResult<List<Cliente>>> GetClientes()
        {
            var clientes = await _clienteService.GetClientes();
            return Ok(clientes);
        }
        [HttpGet("{id}")]
        public async Task<ActionResult<Cliente>> GetCliente(int id)
        {
            var cliente = await _clienteService.GetClienteById(id);
            if (cliente == null)
            {
                return NotFound();
            }
            return Ok(cliente);
        }
        [HttpPost]
        public async Task<ActionResult<Cliente>> CreateCliente(CrearClienteDto cliente)
        {
            var createdCliente = await _clienteService.AddCliente(cliente);
            return CreatedAtAction(nameof(GetCliente), new { id = createdCliente.Id }, createdCliente);
        }
        [HttpPut("{id}")]
        public async Task<ActionResult<Cliente>> UpdateCliente(int id, ActualizarClienteDto cliente)
        {
            var updatedCliente = await _clienteService.UpdateCliente(id, cliente);
            if (updatedCliente == null)
            {
                return NotFound();
            }
            return Ok(updatedCliente);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCliente(int id)
        {
            var eliminado = await _clienteService.DeleteCliente(id);
            if (!eliminado)
            {
                return NotFound();
            }
            return NoContent();
        }
    }
}
