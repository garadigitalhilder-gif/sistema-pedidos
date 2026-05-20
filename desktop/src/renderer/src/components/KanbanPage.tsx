import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api, Pedido, Cliente } from '../services/api';
import SearchInput from './SearchInput';

const NOM_DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function KanbanPage(): React.JSX.Element {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [alertas, setAlertas] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // States for client autocomplete
  const [clientSearch, setClientSearch] = useState('');
  const [showClientList, setShowClientList] = useState(false);
  const clientAutocompleteRef = useRef<HTMLDivElement>(null);

  // Click outside autocomplete to close suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        clientAutocompleteRef.current &&
        !clientAutocompleteRef.current.contains(event.target as Node)
      ) {
        setShowClientList(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navegación de Fecha
  const [fechaReferencia, setFechaReferencia] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [rangoSemana, setRangoSemana] = useState({ inicio: '', fin: '' });

  // Drag & Drop visual indicators
  const [draggedColumn, setDraggedColumn] = useState<number | null>(null);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [reschedulePedido, setReschedulePedido] = useState<Pedido | null>(null);

  // Nuevo Pedido Form State
  const [form, setForm] = useState({
    clienteId: '',
    descripcion: '',
    fechaEntrega: '',
    estado: 'PENDIENTE',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Reprogramar Form State
  const [nuevaFecha, setNuevaFecha] = useState('');

  // Obtener lunes y días de la semana actual
  const getMonday = (d: Date): Date => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const monday = getMonday(fechaReferencia);
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  useEffect(() => {
    fetchData(true);
  }, [fechaReferencia]);

  const fetchData = async (showLoading = false): Promise<void> => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      // Cargar Clientes para dropdowns
      const dataClientes = await api.getClientes();
      setClientes(dataClientes);

      // Cargar alertas pendientes vencidas
      const dataAlertas = await api.getAlertas();
      setAlertas(dataAlertas);

      // Cargar pedidos de la semana actual (usar formato local para evitar desajuste UTC)
      const pad = (n: number): string => n.toString().padStart(2, '0');
      const formatStr = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
      const dataSemana = await api.getPedidosSemana(formatStr);
      setPedidos(dataSemana.pedidos);
      setRangoSemana({
        inicio: new Date(dataSemana.rango.inicio).toLocaleDateString('es-CO'),
        fin: new Date(dataSemana.rango.fin).toLocaleDateString('es-CO'),
      });
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la API.');
    } finally {
      setLoading(false);
    }
  };

  const handleSemanaAnterior = (): void => {
    const prev = new Date(fechaReferencia);
    prev.setDate(fechaReferencia.getDate() - 7);
    setFechaReferencia(prev);
  };

  const handleSemanaSiguiente = (): void => {
    const next = new Date(fechaReferencia);
    next.setDate(fechaReferencia.getDate() + 7);
    setFechaReferencia(next);
  };

  const handleHoy = (): void => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    setFechaReferencia(hoy);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: number): void => {
    e.dataTransfer.setData('text/plain', id.toString());
  };

  const handleDragOver = (e: React.DragEvent, dayIndex: number): void => {
    e.preventDefault();
    setDraggedColumn(dayIndex);
  };

  const handleDragLeave = (): void => {
    setDraggedColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, dayIndex: number): Promise<void> => {
    e.preventDefault();
    setDraggedColumn(null);
    const idStr = e.dataTransfer.getData('text/plain');
    if (!idStr) return;

    const id = parseInt(idStr);
    const targetDate = diasSemana[dayIndex];
    const targetDateStr = targetDate.toISOString();

    try {
      await api.updatePedido(id, { fechaEntrega: targetDateStr });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al reprogramar el pedido.');
    }
  };

  // Crear Pedido
  // UX: fecha preseleccionada
  const handleOpenCreate = (dateValue?: string): void => {
    setForm({
      clienteId: '',
      descripcion: '',
      fechaEntrega: dateValue || '',
      estado: 'PENDIENTE',
    });
    setClientSearch('');
    setShowClientList(false);
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleSavePedido = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setFormError(null);

    if (!form.clienteId || !form.descripcion || !form.fechaEntrega) {
      setFormError('El cliente, descripción y fecha de entrega son requeridos.');
      return;
    }

    try {
      await api.createPedido({
        clienteId: parseInt(form.clienteId),
        descripcion: form.descripcion,
        fechaEntrega: new Date(form.fechaEntrega).toISOString(),
        estado: form.estado,
      });
      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar el pedido.');
    }
  };

  // Cambiar Estado
  const handleCambiarEstado = async (id: number, nuevoEstado: string): Promise<void> => {
    try {
      await api.updatePedido(id, { estado: nuevoEstado });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado.');
    }
  };

  // Eliminar Pedido
  const handleDeletePedido = async (id: number): Promise<void> => {
    if (confirm('¿Está seguro de eliminar este pedido?')) {
      try {
        await api.deletePedido(id);
        fetchData();
      } catch (err: any) {
        alert(err.message || 'Error al eliminar pedido.');
      }
    }
  };

  // Highlight matches in search
  const highlightText = (text: string, search: string): React.ReactNode => {
    if (!search.trim()) return text;
    const parts = text.split(
      new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi')
    );
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <span key={i} className="search-highlight">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Filter clients for the creation autocomplete dropdown
  const filteredSelectClientes = useMemo(() => {
    const term = clientSearch.toLowerCase().trim();
    // If a client is selected, and search matches exactly, show all clients on refocusing/focusing
    const selectedCliente = clientes.find(c => String(c.id) === form.clienteId);
    const selectedText = selectedCliente ? `${selectedCliente.nombre} ${selectedCliente.apellido} - C.C. ${selectedCliente.cedula}` : '';
    
    if (!term || term === selectedText.toLowerCase()) {
      return clientes;
    }
    
    return clientes.filter((c) => {
      return (
        c.nombre.toLowerCase().includes(term) ||
        c.apellido.toLowerCase().includes(term) ||
        c.cedula.toLowerCase().includes(term)
      );
    });
  }, [clientes, clientSearch, form.clienteId]);

  // UX: Banner de resumen semanal stats
  const summaryStats = useMemo(() => {
    const total = pedidos.length;
    const pendientes = pedidos.filter((p) => p.estado === 'PENDIENTE').length;
    const listos = pedidos.filter((p) => p.estado === 'LISTO').length;
    return { total, pendientes, listos };
  }, [pedidos]);

  const handleOpenReschedule = (pedido: Pedido): void => {
    setReschedulePedido(pedido);
    setNuevaFecha('');
    setShowRescheduleModal(true);
  };

  const handleSaveReschedule = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!reschedulePedido || !nuevaFecha) return;

    try {
      await api.updatePedido(reschedulePedido.id, {
        fechaEntrega: new Date(nuevaFecha).toISOString(),
      });
      setShowRescheduleModal(false);
      // Actualizar alertas del listado local
      const actualizadas = alertas.filter((a) => a.id !== reschedulePedido.id);
      setAlertas(actualizadas);
      if (actualizadas.length === 0) {
        setShowAlertsModal(false);
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al reprogramar.');
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Programación Semanal</h1>
          <p style={{ color: '#a37f8d', fontSize: '14px', marginTop: '4px' }}>
            Planifica tus entregas de Lunes a Domingo. Arrastra las tarjetas para reprogramar fechas.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenCreate()}>
          + Registrar Pedido
        </button>
      </div>

      {/* Alertas Banner */}
      {alertas.length > 0 && (
        <div className="alert-banner">
          <div className="alert-message">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div>
              <div className="alert-title">¡Atención! Pedidos Pendientes Atrasados</div>
              <div className="alert-desc">
                Tienes <strong>{alertas.length}</strong> pedido(s) sin entregar de fechas pasadas. Es obligatorio reprogramar su fecha de entrega.
              </div>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ backgroundColor: '#ffffff', color: '#b91c1c' }} onClick={() => setShowAlertsModal(true)}>
            Reprogramar Pedidos
          </button>
        </div>
      )}

      {error && (
        <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* UX: Barra de navegación temporal unificada */}
      <div className="kanban-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #3b232c', borderRadius: '30px', overflow: 'hidden', backgroundColor: '#1e1317', padding: '2px' }}>
          <button
            type="button"
            style={{ background: 'none', border: 'none', padding: '8px 16px', color: '#e2e8f0', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
            onClick={handleSemanaAnterior}
            title="Semana anterior"
          >
            ← Anterior
          </button>
          <button
            type="button"
            style={{ background: 'none', border: 'none', borderLeft: '1px solid #3b232c', padding: '8px 16px', color: '#e2e8f0', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
            onClick={handleHoy}
            title="Semana actual"
          >
            Hoy
          </button>
          <button
            type="button"
            style={{ background: 'none', border: 'none', borderLeft: '1px solid #3b232c', padding: '8px 16px', color: '#e2e8f0', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
            onClick={handleSemanaSiguiente}
            title="Semana siguiente"
          >
            Siguiente →
          </button>
          <div
            style={{
              position: 'relative',
              borderLeft: '1px solid #3b232c',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Ir a fecha específica"
          >
            <span style={{ fontSize: '15px' }} role="img" aria-label="Calendario">📅</span>
            <input
              type="date"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
              onChange={(e) => {
                if (e.target.value) {
                  setFechaReferencia(new Date(e.target.value + 'T12:00:00'));
                }
              }}
            />
          </div>
        </div>

        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>
          Semana del <span style={{ color: '#d81b60' }}>{rangoSemana.inicio}</span> al <span style={{ color: '#d81b60' }}>{rangoSemana.fin}</span>
        </div>

        {/* UX-MEJORA: SearchInput global */}
        <SearchInput
          placeholder="Buscar pedido..."
          value={searchTerm}
          onSearch={setSearchTerm}
          style={{ width: '250px' }}
        />
      </div>

      {/* UX: Banner de resumen semanal */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '38px',
          backgroundColor: '#1e1317',
          borderBottom: '1px solid #3b232c',
          borderTop: '1px solid #3b232c',
          fontSize: '13px',
          color: '#cbd5e1',
          margin: '0 -30px 10px -30px',
          padding: '0 30px',
        }}
      >
        {summaryStats.total === 0 ? (
          <span>Ningún pedido registrado esta semana — ¡empieza ahora!</span>
        ) : (
          <span>
            Esta semana: <strong>{summaryStats.total}</strong> pedido(s) en total |{' '}
            <strong style={{ color: '#f59e0b' }}>{summaryStats.pendientes}</strong> pendientes |{' '}
            <strong style={{ color: '#d81b60' }}>{summaryStats.listos}</strong> listos para entrega
          </span>
        )}
      </div>

      {/* Tablero Kanban */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px', color: '#94a3b8' }}>Cargando planificación...</div>
      ) : (
        <div className="kanban-board">
          {diasSemana.map((dia, idx) => {
            // Formato local YYYY-MM-DD para evitar desajustes de zona horaria UTC
            const pad = (n: number): string => n.toString().padStart(2, '0');
            const dateStr = `${dia.getFullYear()}-${pad(dia.getMonth() + 1)}-${pad(dia.getDate())}`;
            
            // Filter by date AND search term
            const pedidosDia = pedidos.filter((p) => {
              const f = new Date(p.fechaEntrega);
              const fStr = `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`;
              const matchesDate = fStr === dateStr;

              const term = searchTerm.toLowerCase().trim();
              const matchesSearch = !term ||
                p.descripcion.toLowerCase().includes(term) ||
                p.cliente.nombre.toLowerCase().includes(term) ||
                p.cliente.apellido.toLowerCase().includes(term) ||
                p.cliente.cedula.toLowerCase().includes(term) ||
                p.cliente.ciudad.toLowerCase().includes(term) ||
                String(p.id).includes(term);

              return matchesDate && matchesSearch;
            });
            const esHoy = new Date().toDateString() === dia.toDateString();

            return (
              <div
                key={idx}
                className={`kanban-column ${draggedColumn === idx ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, idx)}
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                {/* UX: Indicador del día actual accesible */}
                <div
                  className="kanban-column-header"
                  style={esHoy ? { borderTop: '4px solid #d81b60' } : {}}
                  aria-label={`${NOM_DIAS[idx]} ${dia.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}${esHoy ? ', hoy' : ''}`}
                >
                  <div className="kanban-column-title" style={esHoy ? { color: '#ec407a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' } : {}}>
                    {NOM_DIAS[idx]}
                    {esHoy && (
                      <span
                        style={{
                          backgroundColor: '#d81b60',
                          color: '#ffffff',
                          fontSize: '9px',
                          padding: '1px 5px',
                          borderRadius: '10px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                        }}
                      >
                        Hoy
                      </span>
                    )}
                  </div>
                  {/* UX: Contraste de texto (accesibilidad WCAG AA) */}
                  <div className="kanban-column-date" style={{ color: '#cbd5e1', fontWeight: '500' }}>
                    {dia.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="kanban-column-count" style={{ color: '#ffffff', backgroundColor: '#35252b', fontWeight: 'bold' }}>
                    {pedidosDia.length} Pedidos
                  </div>
                </div>

                {/* UX: Estado vacío ilustrado por columna */}
                <div className="kanban-cards" style={{ display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 }}>
                  {pedidosDia.length === 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexGrow: 1,
                        padding: '30px 10px',
                        textAlign: 'center',
                        color: '#cbd5e1',
                        gap: '12px'
                      }}
                    >
                      <svg
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#8b6e79"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ opacity: 0.7 }}
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                        <line x1="12" y1="14" x2="12" y2="18"></line>
                        <line x1="10" y1="16" x2="14" y2="16"></line>
                      </svg>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1' }}>Sin pedidos</div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleOpenCreate(dateStr)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          borderColor: '#d81b60',
                          color: '#fbcfe8',
                        }}
                      >
                        + Agregar
                      </button>
                    </div>
                  ) : (
                    pedidosDia.map((p) => (
                      <div
                        key={p.id}
                        className="kanban-card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, p.id)}
                      >
                        <div className="kanban-card-client">
                          {highlightText(`${p.cliente.nombre} ${p.cliente.apellido}`, searchTerm)}
                        </div>
                        <div className="kanban-card-desc">
                          {highlightText(p.descripcion, searchTerm)}
                        </div>

                        <div className="kanban-card-footer">
                          {/* Selector de Estado */}
                          <select
                            className="form-input"
                            style={{
                              padding: '2px 4px',
                              fontSize: '9.5px',
                              background: '#160e11',
                              border: '1px solid #3e2631',
                              width: '95px',
                              fontWeight: 'bold',
                              color:
                                p.estado === 'PENDIENTE'
                                  ? '#f59e0b'
                                  : p.estado === 'LISTO'
                                  ? '#d81b60'
                                  : '#10b981',
                            }}
                            value={p.estado}
                            onChange={(e) => handleCambiarEstado(p.id, e.target.value)}
                          >
                            <option value="PENDIENTE">PENDIENTE</option>
                            <option value="LISTO">LISTO</option>
                            <option value="ENTREGADO">ENTREGADO</option>
                          </select>

                          {/* Botón Eliminar */}
                          <button
                            className="btn-icon btn-icon-danger"
                            style={{ padding: '2px' }}
                            title="Eliminar Pedido"
                            onClick={() => handleDeletePedido(p.id)}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Registrar Pedido Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Registrar Nuevo Pedido</h2>
              <button className="btn-icon" onClick={() => setShowCreateModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSavePedido}>
              <div className="modal-body">
                {formError && (
                  <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '6px', fontSize: '13px' }}>
                    {formError}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group" ref={clientAutocompleteRef} style={{ position: 'relative' }}>
                    <label className="form-label">Cliente Asignado</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ width: '100%', paddingRight: '36px' }}
                        placeholder="Buscar por nombre o cédula..."
                        value={clientSearch}
                        onFocus={() => setShowClientList(true)}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          setShowClientList(true);
                          if (!e.target.value) {
                            setForm({ ...form, clienteId: '' });
                          }
                        }}
                      />
                      {clientSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setClientSearch('');
                            setForm({ ...form, clienteId: '' });
                            setShowClientList(true);
                          }}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#8b6e79',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {showClientList && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '64px',
                          left: 0,
                          right: 0,
                          backgroundColor: '#1e1317',
                          border: '1px solid #3b232c',
                          borderRadius: '8px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          zIndex: 1000,
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                        }}
                      >
                        {filteredSelectClientes.length === 0 ? (
                          <div style={{ padding: '12px', color: '#8b6e79', fontSize: '13px', textAlign: 'center' }}>
                            No se encontraron clientes
                          </div>
                        ) : (
                          filteredSelectClientes.map((c) => {
                            const isSelected = form.clienteId === String(c.id);
                            return (
                              <div
                                key={c.id}
                                onClick={() => {
                                  setForm({ ...form, clienteId: String(c.id) });
                                  setClientSearch(`${c.nombre} ${c.apellido} - C.C. ${c.cedula}`);
                                  setShowClientList(false);
                                }}
                                style={{
                                  padding: '10px 14px',
                                  cursor: 'pointer',
                                  fontSize: '13.5px',
                                  borderBottom: '1px solid #3b232c',
                                  color: '#ffffff',
                                  backgroundColor: isSelected ? '#d81b60' : 'transparent',
                                  transition: 'background-color 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.backgroundColor = '#2e1e24';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }
                                }}
                              >
                                <strong>{c.nombre} {c.apellido}</strong> - C.C. {c.cedula}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Descripción del Pedido (Detalles de envío)</label>
                    <textarea
                      className="form-input"
                      style={{ minHeight: '80px', fontFamily: 'inherit' }}
                      value={form.descripcion}
                      onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                      placeholder="Ej. Caja de zapatos talla 40, color negro..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fecha de Entrega (Obligatoria)</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.fechaEntrega}
                      onChange={(e) => setForm({ ...form, fechaEntrega: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estado Inicial</label>
                    <select
                      className="form-input"
                      value={form.estado}
                      onChange={(e) => setForm({ ...form, estado: e.target.value })}
                    >
                      <option value="PENDIENTE">PENDIENTE (En bodega / por preparar)</option>
                      <option value="LISTO">LISTO (Listo para ser despachado)</option>
                      <option value="ENTREGADO">ENTREGADO (Despachado / recibido)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Programar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alertas de Reprogramación Modal */}
      {showAlertsModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '700px' }}>
            <div className="modal-header" style={{ background: '#b91c1c' }}>
              <h2 className="modal-title" style={{ color: '#fff' }}>Pedidos Pendientes Atrasados</h2>
              <button className="btn-icon" style={{ color: '#fff' }} onClick={() => setShowAlertsModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '16px' }}>
                De acuerdo con la política del negocio, todo pedido "Pendiente" que no se haya despachado en su fecha programada debe ser reprogramado de forma obligatoria.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {alertas.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      background: '#1e1317',
                      border: '1px solid #3b232c',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#fff' }}>{a.cliente.nombre} {a.cliente.apellido}</strong>
                      <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold' }}>
                        Fecha vencida: {new Date(a.fechaEntrega).toLocaleDateString('es-CO')}
                      </div>
                      <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                        {a.descripcion}
                      </div>
                    </div>
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleOpenReschedule(a)}>
                      Reprogramar
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAlertsModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal: Cambiar Fecha de Pedido */}
      {showRescheduleModal && reschedulePedido && (
        <div className="modal-overlay" style={{ zIndex: 101 }}>
          <div className="modal-content" style={{ width: '450px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Reprogramar Pedido #{reschedulePedido.id}</h2>
              <button className="btn-icon" onClick={() => setShowRescheduleModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveReschedule}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nueva Fecha de Entrega</label>
                  <input
                    type="date"
                    className="form-input"
                    value={nuevaFecha}
                    min={new Date().toISOString().split('T')[0]} // No permitir fechas pasadas al reprogramar
                    onChange={(e) => setNuevaFecha(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRescheduleModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Actualizar Fecha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
