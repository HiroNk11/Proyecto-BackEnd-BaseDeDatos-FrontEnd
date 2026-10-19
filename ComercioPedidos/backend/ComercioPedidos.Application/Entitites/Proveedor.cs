using System;
using System.Collections.Generic;
using System.Text;

namespace ComercioPedidos.Application.Entitites
{
    public class Proveedor
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Cuit { get; set; }
        public string? Email { get; set; }
        public string? Telefono { get; set; }
        public string? Direccion { get; set; }
        public bool Activo { get; set; } = true;
    }
}
