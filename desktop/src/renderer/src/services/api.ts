const getApiUrl = (): string => {
  const savedUrl = localStorage.getItem('API_BASE_URL');
  if (savedUrl && savedUrl.trim()) {
    return savedUrl.trim();
  }
  // Por defecto, intentar conectar al servidor de producción en la nube (Render)
  return 'https://sistema-pedidos-api.onrender.com/api';
};

const BASE_URL = getApiUrl();

export interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  direccion: string;
  barrio: string;
  correo: string;
  ciudad: string;
  departamento: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pedido {
  id: number;
  clienteId: number;
  cliente: Cliente;
  descripcion: string;
  fechaEntrega: string;
  estado: 'PENDIENTE' | 'LISTO' | 'ENTREGADO';
  createdAt: string;
  updatedAt: string;
}

export interface ConfiguracionRemitente {
  id: number;
  nombre: string;
  cedula: string;
  telefono: string;
  direccion: string;
  ciudadOrigen: string;
}

export const api = {
  // Clientes CRUD
  async getClientes(): Promise<Cliente[]> {
    const res = await fetch(`${BASE_URL}/clientes`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al obtener clientes');
    }
    return res.json();
  },

  async createCliente(data: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cliente> {
    const res = await fetch(`${BASE_URL}/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al crear cliente');
    }
    return res.json();
  },

  async updateCliente(
    id: number,
    data: Partial<Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Cliente> {
    const res = await fetch(`${BASE_URL}/clientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar cliente');
    }
    return res.json();
  },

  async deleteCliente(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/clientes/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al eliminar cliente');
    }
  },

  // Pedidos & Kanban
  async getPedidos(): Promise<Pedido[]> {
    const res = await fetch(`${BASE_URL}/pedidos`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al obtener pedidos');
    }
    return res.json();
  },

  async getPedidosSemana(
    fecha?: string
  ): Promise<{ rango: { inicio: string; fin: string }; pedidos: Pedido[] }> {
    const url = fecha ? `${BASE_URL}/pedidos/semana?fecha=${fecha}` : `${BASE_URL}/pedidos/semana`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al obtener pedidos de la semana');
    }
    return res.json();
  },

  async getAlertas(): Promise<Pedido[]> {
    const res = await fetch(`${BASE_URL}/pedidos/alertas`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al obtener alertas');
    }
    return res.json();
  },

  async createPedido(data: {
    clienteId: number;
    descripcion: string;
    fechaEntrega: string;
    estado?: string;
  }): Promise<Pedido> {
    const res = await fetch(`${BASE_URL}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al crear pedido');
    }
    return res.json();
  },

  async updatePedido(
    id: number,
    data: { descripcion?: string; fechaEntrega?: string; estado?: string }
  ): Promise<Pedido> {
    const res = await fetch(`${BASE_URL}/pedidos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar pedido');
    }
    return res.json();
  },

  async deletePedido(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/pedidos/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al eliminar pedido');
    }
  },

  // Generación de Guías PDF
  async generarGuiasPdf(pedidoIds: number[], guiasPorPagina: 4 | 6 = 6): Promise<Blob> {
    const res = await fetch(`${BASE_URL}/guias/generar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedidoIds, guiasPorPagina }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al generar guías PDF');
    }
    return res.blob();
  },

  // Configuración del Remitente
  async getRemitente(): Promise<ConfiguracionRemitente> {
    const res = await fetch(`${BASE_URL}/remitente`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al obtener remitente');
    }
    return res.json();
  },

  async updateRemitente(data: Omit<ConfiguracionRemitente, 'id'>): Promise<ConfiguracionRemitente> {
    const res = await fetch(`${BASE_URL}/remitente`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar remitente');
    }
    return res.json();
  },
};
