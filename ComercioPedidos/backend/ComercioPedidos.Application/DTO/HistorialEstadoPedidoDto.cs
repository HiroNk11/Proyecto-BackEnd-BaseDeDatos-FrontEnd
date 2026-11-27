namespace ComercioPedidos.Application.DTO;
public class HistorialEstadoPedidoDto
{
    public int Id { get; set; }
    public string? EstadoAnterior { get; set; }
    public string EstadoNuevo { get; set; } = string.Empty;
    public DateTime FechaUtc { get; set; }
    public string UsuarioId { get; set; } = string.Empty;
}
