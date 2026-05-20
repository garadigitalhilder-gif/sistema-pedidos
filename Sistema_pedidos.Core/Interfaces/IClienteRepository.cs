using Sistema_pedidos.Core.Entities;

namespace Sistema_pedidos.Core.Interfaces;

public interface IClienteRepository
{
    Task<List<Cliente>> ObtenerTodosAsync();

    Task<Cliente?> ObtenerPorIdAsync(int id);

    Task CrearAsync(Cliente cliente);

    Task ActualizarAsync(Cliente cliente);

    Task EliminarAsync(int id);
}