using Microsoft.EntityFrameworkCore;
using Sistema_pedidos.Core.Entities;
using Sistema_pedidos.Core.Interfaces;
using Sistema_pedidos.Infrastructure.Data;

namespace Sistema_pedidos.Infrastructure.Repositories;

public class ClienteRepository : IClienteRepository
{
    private readonly AppDbContext _context;

    public ClienteRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Cliente>> ObtenerTodosAsync()
    {
        return await _context.Clientes.ToListAsync();
    }

    public async Task<Cliente?> ObtenerPorIdAsync(int id)
    {
        return await _context.Clientes.FindAsync(id);
    }

    public async Task CrearAsync(Cliente cliente)
    {
        await _context.Clientes.AddAsync(cliente);

        await _context.SaveChangesAsync();
    }

    public async Task ActualizarAsync(Cliente cliente)
    {
        _context.Clientes.Update(cliente);

        await _context.SaveChangesAsync();
    }

    public async Task EliminarAsync(int id)
    {
        var cliente = await _context.Clientes.FindAsync(id);

        if (cliente is null)
            return;

        _context.Clientes.Remove(cliente);

        await _context.SaveChangesAsync();
    }
}