using Sistema_pedidos.Core.Enums;

namespace Sistema_pedidos.Core.Entities;

public class HistorialPedido
{
    public int Id { get; set; }

    public int PedidoId { get; set; }

    public Pedido Pedido { get; set; } = null!;

    public EstadoPedidoEnum EstadoAnterior { get; set; }

    public EstadoPedidoEnum EstadoNuevo { get; set; }

    public DateTime FechaCambio { get; set; } = DateTime.Now;

    public string Observacion { get; set; } = string.Empty;
}