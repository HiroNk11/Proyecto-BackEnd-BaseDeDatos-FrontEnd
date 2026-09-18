using System;
using System.Collections.Generic;
using System.Text;

namespace ComercioPedidos.Application.Entitites
{
    public class Producto
    {
        public int Id { get; set; }

        public string Nombre { get; set; } = string.Empty; // en sql  no se permite nulos, en c# lo podemos representar de esta forma

        public string? Descripcion { get; set; } // se puede representar de esta forma los nulos permitidos, de esta forma representamos
        // de forma mas acertada la relacion tabla y clase entre sql server y c#

        public decimal Precio { get; set; }

        public int Stock { get; set; }

        public bool Activo { get; set; }
    }
}
