using ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.Entitites;
using System;
using System.Collections.Generic;
using System.Text;

namespace ComercioPedidos.Application.Services
{
    public interface IProductoService // La interfaz solo define qué operaciones ofrece el servicio, no cómo las realiza:
    {
        Task<IEnumerable<Producto>> GetProductos();
        Task<Producto?> GetProductoById(int id);
        Task<Producto> CrearProducto(CrearProductoDto productoDto);
        Task<Producto?> ActualizarProducto(int id, ActualizarProductoDto productoDto);
        Task<bool> EliminarProducto(int id);

    }
}
