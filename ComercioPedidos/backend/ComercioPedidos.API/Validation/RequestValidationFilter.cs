using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using ComercioPedidos.API.Exceptions;
namespace ComercioPedidos.API.Validation;
public sealed class RequestValidationFilter : IActionFilter
{
    public void OnActionExecuted(ActionExecutedContext context) { }
    public void OnActionExecuting(ActionExecutingContext context)
    {
        foreach (var (key, value) in context.ActionArguments)
        {
            var invalid = value switch
            {
                int number when key is "id" or "clienteId" or "productoId" => number <= 0,
                int number when key == "pagina" => number <= 0,
                int number when key == "tamanioPagina" => number is < 1 or > 100,
                Enum number => !Enum.IsDefined(number.GetType(), number),
                DateTime date => date.Date == DateTime.MaxValue.Date,
                _ => false
            };
            if (!invalid) continue;
            context.Result = new ObjectResult(ApiProblems.Create(context.HttpContext, 400, $"El parámetro {key} no es válido.")) { StatusCode = 400, ContentTypes = { "application/problem+json" } };
            break;
        }
    }
}
