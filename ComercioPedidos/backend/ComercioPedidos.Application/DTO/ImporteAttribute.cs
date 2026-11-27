using System.ComponentModel.DataAnnotations;
namespace ComercioPedidos.Application.DTO;
public sealed class ImporteAttribute : ValidationAttribute
{
    public ImporteAttribute() : base("El importe debe tener como máximo dos decimales.") { }
    public override bool IsValid(object? value) => value is decimal amount && decimal.Round(amount, 2) == amount;
}
