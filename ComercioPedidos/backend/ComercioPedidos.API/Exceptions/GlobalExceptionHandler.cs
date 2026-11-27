using ComercioPedidos.Application.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
namespace ComercioPedidos.API.Exceptions;
public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is OperationCanceledException && context.RequestAborted.IsCancellationRequested) return true;
        var (status, detail) = exception switch
        {
            BadHttpRequestException e => (e.StatusCode, "El cuerpo de la solicitud no es válido o excede el límite permitido."),
            NotFoundException e => (404, e.Message), ConflictoException e => (409, e.Message),
            DbUpdateConcurrencyException => (409, "El recurso cambió durante la operación. Actualizá los datos antes de reintentar."),
            DbUpdateException { InnerException: SqlException { Number: 547 or 2601 or 2627 } } => (409, "La operación entra en conflicto con datos existentes."),
            SqlException { Number: 1205 } => (409, "Conflicto entre transacciones. Volvé a consultar antes de reintentar."),
            ReglaNegocioException e => (422, e.Message), OverflowException => (422, "El valor excede el límite permitido."),
            _ => (500, "Ocurrió un error inesperado. Usá el identificador de seguimiento para solicitar asistencia.")
        };
        // No registrar payloads, headers, mensajes de excepciones ni cadenas SQL.
        if (status == 500) logger.LogError("API failure {ErrorType}; trace {TraceId}", exception.GetType().Name, context.TraceIdentifier);
        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(ApiProblems.Create(context, status, detail), options: (System.Text.Json.JsonSerializerOptions?)null, contentType: "application/problem+json", cancellationToken: cancellationToken);
        return true;
    }
}
