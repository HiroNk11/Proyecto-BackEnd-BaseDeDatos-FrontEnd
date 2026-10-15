using System.ComponentModel.DataAnnotations;

namespace ComercioPedidos.Application.DTO
{
    public class RegistrarSalidaStockDto
    {
        [Required]
        public int ProductoId { get; set; }

        [Range(
            1,
            int.MaxValue,
            ErrorMessage = "La cantidad debe ser mayor que cero."
        )]
        public int Cantidad { get; set; }

        [StringLength(250)]
        public string? Motivo { get; set; }
    }
}