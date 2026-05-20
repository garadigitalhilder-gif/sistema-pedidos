using Sistema_pedidos.Core.Entities;

namespace Sistema_pedidos.Core.Interfaces;

public interface IPedidoRepository
{
    Task<List<Pedido>> ObtenerTodosAsync();

    Task<List<Pedido>> ObtenerPendientesDelDiaAsync();

    Task<Pedido?> ObtenerPorIdAsync(int id);

    Task CrearAsync(Pedido pedido);

    Task ActualizarAsync(Pedido pedido);

    Task EliminarAsync(int id);
}