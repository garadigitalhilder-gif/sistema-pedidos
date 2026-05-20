using Microsoft.EntityFrameworkCore;
using Sistema_pedidos.Core.Entities;
using Sistema_pedidos.Core.Enums;
using Sistema_pedidos.Core.Interfaces;
using Sistema_pedidos.Infrastructure.Data;

namespace Sistema_pedidos.Infrastructure.Repositories;

public class PedidoRepository : IPedidoRepository
{
    private readonly AppDbContext _context;

    public PedidoRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Pedido>> ObtenerTodosAsync()
    {
        return await _context.Pedidos
            .Include(x => x.Cliente)
            .ToListAsync();
    }

    public async Task<List<Pedido>> ObtenerPendientesDelDiaAsync()
    {
        var hoy = DateTime.Today;

        return await _context.Pedidos
            .Include(x => x.Cliente)
            .Where(x =>
                x.FechaProgramada.Date == hoy &&
                x.Estado == EstadoPedidoEnum.Pendiente)
            .ToListAsync();
    }

    public async Task<Pedido?> ObtenerPorIdAsync(int id)
    {
        return await _context.Pedidos
            .Include(x => x.Cliente)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task CrearAsync(Pedido pedido)
    {
        await _context.Pedidos.AddAsync(pedido);

        await _context.SaveChangesAsync();
    }

    public async Task ActualizarAsync(Pedido pedido)
    {
        _context.Pedidos.Update(pedido);

        await _context.SaveChangesAsync();
    }

    public async Task EliminarAsync(int id)
    {
        var pedido = await _context.Pedidos.FindAsync(id);

        if (pedido is null)
            return;

        _context.Pedidos.Remove(pedido);

        await _context.SaveChangesAsync();
    }
}