using System;
using System.Collections.Generic;
using System.Text;
using System.ComponentModel.DataAnnotations;

namespace ComercioPedidos.Application.DTO
{
    public class CrearPedidoDto
    {
        [Range(1, int.MaxValue, ErrorMessage = "El cliente es obligatorio.")]
        public int ClienteId { get; set; }

        [Required(ErrorMessage = "El detalle es obligatorio.")]
        [MinLength(1, ErrorMessage = "El pedido debe contener al menos un producto.")]
        public List<CrearDetallePedidoDto> Detalles { get; set; } = new List<CrearDetallePedidoDto>();
    }
}
