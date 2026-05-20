using Sistema_pedidos.Core.Enums;

namespace Sistema_pedidos.Core.Entities;

public class Pedido
{
    public int Id { get; set; }

    public int ClienteId { get; set; }

    public Cliente Cliente { get; set; } = null!;

    public string Descripcion { get; set; } = string.Empty;

    public DateTime FechaProgramada { get; set; }

    public TipoProgramacionEnum TipoProgramacion { get; set; }

    public EstadoPedidoEnum Estado { get; set; }

    public bool GeneradoEnPdf { get; set; } = false;

    public DateTime FechaCreacion { get; set; } = DateTime.Now;

    public ICollection<HistorialPedido> Historial { get; set; } = new List<HistorialPedido>();
}