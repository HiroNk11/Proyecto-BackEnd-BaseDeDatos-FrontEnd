using ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.Entitites;
using System;
using System.Collections.Generic;
using System.Text;

namespace ComercioPedidos.Application.Services
{
    public interface IClienteService // La interfaz solo define qué operaciones ofrece el servicio, no cómo las realiza:
    {
        Task<IEnumerable<Cliente>> GetClientes();
        Task<Cliente?> GetClienteById(int id);
        Task<Cliente> AddCliente(CrearClienteDto clienteDto);
        Task<Cliente?> UpdateCliente(int id, ActualizarClienteDto clienteDto);
        Task<bool> DeleteCliente(int id);

    }
}
