using ComercioPedidos.Application.Enum;
using System;
using System.Collections.Generic;
using System.Text;

namespace ComercioPedidos.Application.Entitites
{
    public class MovimientoStock
    {
        public int Id { get; set; }

        public int ProductoId { get; set; }

        public DateTime Fecha { get; set; }

        public TipoMovimientoStock Tipo { get; set; }

        public int Cantidad { get; set; }
        public ClaseMovimientoStock TipoMovimiento { get; set; }
        public string UsuarioId { get; set; } = "historico-desconocido";

        public int StockAnterior { get; set; }

        public int StockPosterior { get; set; }

        public string? Motivo { get; set; }

        public int? PedidoId { get; set; }

        [System.Text.Json.Serialization.JsonIgnore]
        public Producto? Producto { get; set; }
    }
}
