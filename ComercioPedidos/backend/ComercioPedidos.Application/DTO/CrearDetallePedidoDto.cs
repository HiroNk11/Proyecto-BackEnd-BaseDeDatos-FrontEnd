using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace ComercioPedidos.Application.DTO
{
    public class CrearDetallePedidoDto
    {
        [Range(1, int.MaxValue, ErrorMessage = "El producto es obligatorio.")]
        public int ProductoId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor que 0.")]
        public int Cantidad { get; set; }
    }
}
