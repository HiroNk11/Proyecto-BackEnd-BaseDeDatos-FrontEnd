using ComercioPedidos.Application.Exceptions;
using Microsoft.AspNetCore.Diagnostics;

namespace ComercioPedidos.API.Exceptions
{
    // Maneja excepciones globalmente para mantener los controllers limpios.
    public class GlobalExceptionHandler : IExceptionHandler // "Esta clase cumple el contrato necesario para actuar como manejador de excepciones."
    {
        public async ValueTask<bool> TryHandleAsync(
            HttpContext httpContext,
            Exception exception,
            CancellationToken cancellationToken)
        {
            if (exception is ReglaNegocioException reglaException)
            {
                httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;

                await httpContext.Response.WriteAsJsonAsync(
                    new
                    {
                        mensaje = reglaException.Message
                    },
                    cancellationToken);

                return true;
            }
            if (exception is NotFoundException notFoundException)
            {
                httpContext.Response.StatusCode = StatusCodes.Status404NotFound;

                await httpContext.Response.WriteAsJsonAsync(
                    new
                    {
                        mensaje = notFoundException.Message
                    },
                    cancellationToken);

                return true;
            }
            return false;
        }
    }
}