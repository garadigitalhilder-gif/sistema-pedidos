using Sistema_pedidos.Core.Interfaces;
using Sistema_pedidos.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Sistema_pedidos.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(
            builder.Configuration.GetConnectionString("DefaultConnection")
        )
    ));

// REPOSITORIES
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();

builder.Services.AddScoped<IPedidoRepository, PedidoRepository>();

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();