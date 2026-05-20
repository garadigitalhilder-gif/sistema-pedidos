namespace Sistema_pedidos.Core.Entities;

public class ConfiguracionRemitente
{
    public int Id { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string Cedula { get; set; } = string.Empty;

    public string Telefono { get; set; } = string.Empty;

    public string Direccion { get; set; } = string.Empty;

    public string CiudadOrigen { get; set; } = string.Empty;
}