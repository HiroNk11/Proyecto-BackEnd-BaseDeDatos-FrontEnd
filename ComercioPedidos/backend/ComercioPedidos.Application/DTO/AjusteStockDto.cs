using System.ComponentModel.DataAnnotations;
namespace ComercioPedidos.Application.DTO;
public class AjusteStockDto : IValidatableObject
{
    [Required] public string TipoMovimiento { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    [Required(ErrorMessage = "El motivo es obligatorio.")]
    [StringLength(250, MinimumLength = 3, ErrorMessage = "El motivo debe tener entre 3 y 250 caracteres.")]
    public string Motivo { get; set; } = string.Empty;
    public Guid? Version { get; set; }
    public IEnumerable<ValidationResult> Validate(ValidationContext context)
    {
        if (TipoMovimiento is not ("Ingreso" or "AjusteManual")) yield return new("El tipo debe ser Ingreso o AjusteManual.", [nameof(TipoMovimiento)]);
        if (Cantidad == 0 || Cantidad == int.MinValue || TipoMovimiento == "Ingreso" && Cantidad < 0) yield return new("La cantidad debe ser distinta de cero y positiva para un ingreso.", [nameof(Cantidad)]);
        if (Motivo.Trim().Length < 3) yield return new("Ingresá un motivo de al menos 3 caracteres.", [nameof(Motivo)]);
    }
}
