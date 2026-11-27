using System;
using System.Collections.Generic;
using System.Text;
using System.ComponentModel.DataAnnotations;

namespace ComercioPedidos.Application.DTO
{
    public class CrearPedidoDto : IValidatableObject
    {
        [Range(1, int.MaxValue, ErrorMessage = "El cliente es obligatorio.")]
        public int ClienteId { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext context)
        {
            if (Detalles is not null && Detalles.Any(d => d is null))
                yield return new ValidationResult("El detalle no puede contener elementos nulos.", [nameof(Detalles)]);
        }
        [Required(ErrorMessage = "El detalle es obligatorio.")]
        [MaxLength(100)]
        [MinLength(1, ErrorMessage = "El pedido debe contener al menos un producto.")]
        public List<CrearDetallePedidoDto> Detalles { get; set; } = new List<CrearDetallePedidoDto>();
    }
}
