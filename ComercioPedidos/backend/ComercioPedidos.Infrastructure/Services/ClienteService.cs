using ComercioPedidos.Application.DTO;
using ComercioPedidos.Application.Entitites;
using ComercioPedidos.Application.Services;
using ComercioPedidos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ComercioPedidos.Infrastructure.Services
{
    public class ClienteService : IClienteService
    {
        private readonly ComercioPedidosDbContext _context;
        public ClienteService(ComercioPedidosDbContext context)
        {
            _context = context;
        }
        public async Task<IEnumerable<Cliente>> GetClientes()
        {
            return await _context.Clientes.ToListAsync();
        }

        public async Task<Cliente?> GetClienteById(int id)
        {
            return await _context.Clientes
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<Cliente> AddCliente(CrearClienteDto clienteDto)
        {
            var client = new Cliente
            {
                Nombre = clienteDto.Nombre,
                Apellido = clienteDto.Apellido,
                Email = clienteDto.Email,
                Telefono = clienteDto.Telefono,
                Direccion = clienteDto.Direccion,
                Activo = clienteDto.Activo
            };
            await _context.Clientes.AddAsync(client);
            await _context.SaveChangesAsync();
            return client;
        }

        public async Task<Cliente?> UpdateCliente(int id, ActualizarClienteDto clienteDto)
        {
            var client = await _context.Clientes.FindAsync(id);
            if (client == null)
            {
                return null;
            }
            client.Nombre = clienteDto.Nombre;
            client.Apellido = clienteDto.Apellido;
            client.Email = clienteDto.Email;
            client.Direccion = clienteDto.Direccion;
            client.Telefono = clienteDto.Telefono;
            client.Activo = clienteDto.Activo;

            await _context.SaveChangesAsync();
            return client;
        }

        public async Task<bool> DeleteCliente(int id)
        {
            var client = await _context.Clientes.FindAsync(id);
            if (client == null)
            {
                return false;
            }
            _context.Clientes.Remove(client);
            await _context.SaveChangesAsync();
            return true;
        }   
    }
}
