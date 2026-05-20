using Sistema_pedidos.Core.Enums;

namespace Sistema_pedidos.Core.Entities;

public class Usuario
{
    public int Id { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string Correo { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public RolUsuarioEnum Rol { get; set; }
}