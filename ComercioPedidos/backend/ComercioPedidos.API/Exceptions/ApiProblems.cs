using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
namespace ComercioPedidos.API.Exceptions;
public static class ApiProblems
{
    public static ProblemDetails Create(HttpContext context, int status, string detail)
    {
        var title = status switch { 400 => "Solicitud inválida", 401 => "Autenticación requerida", 403 => "Acceso denegado", 404 => "Recurso no encontrado", 409 => "Conflicto", 413 => "Solicitud demasiado grande", 422 => "Regla de negocio no satisfecha", _ => "Error interno" };
        var problem = new ProblemDetails { Status = status, Title = title, Detail = detail, Type = $"https://httpstatuses.io/{status}", Instance = context.Request.Path };
        problem.Extensions["traceId"] = Activity.Current?.Id ?? context.TraceIdentifier;
        problem.Extensions["mensaje"] = detail;
        return problem;
    }
}
