using System;
using System.Collections.Generic;
using System.Text;

namespace ComercioPedidos.Application.DTO
{
    namespace ComercioPedidos.Application.DTO
    {
        public class MovimientoStockDto
        {
            public int Id { get; set; }

            public int ProductoId { get; set; }

            public string NombreProducto { get; set; }
                = string.Empty;

            public DateTime Fecha { get; set; }

            public string Tipo { get; set; }
                = string.Empty;

            public int Cantidad { get; set; }

            public int StockAnterior { get; set; }

            public int StockPosterior { get; set; }

            public string? Motivo { get; set; }

            public int? PedidoId { get; set; }
        }
    }
}
