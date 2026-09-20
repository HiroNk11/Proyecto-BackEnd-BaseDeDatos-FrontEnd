using System;
using System.Collections.Generic;
using System.Text;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ComercioPedidos.Application.DTO
{
    public class CrearProductoDto
    {
        [Required(ErrorMessage = "El nombre es obligatorio.")]
        [StringLength(100, MinimumLength = 3,ErrorMessage = "El nombre debe tener entre 3 y 100 caracteres.")]
        public string Nombre { get; set; } = string.Empty;
        [StringLength(250, ErrorMessage = "La descripción no puede superar los 250 caracteres.")]
        public string? Descripcion { get; set; } // Optional property, can be null

        [Required(ErrorMessage = "Precio is required.")] // Ensure that the price is provided
        [Range(0.01, double.MaxValue, ErrorMessage = "El precio debe ser mayor que 0.")] // Ensure that the price is greater than 0
        public decimal Precio { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "stock don't be negative")] // Ensure that the stock is a positive value, no don't need required because int always have a value
        public int Stock { get; set; } 
        public bool Activo { get; set; } // Optional property, can be true or false

    }
}
