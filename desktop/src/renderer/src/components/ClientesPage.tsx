// UX-MEJORA: Pantalla Clientes con búsqueda avanzada, ordenamiento, avatares, filtros de ciudad dinámicos y ConfirmDialog
import React, { useState, useEffect, useMemo } from 'react';
import { api, Cliente } from '../services/api';
import SearchInput from './SearchInput';
import ConfirmDialog from './ConfirmDialog';

const AVATAR_COLORS = [
  '#d81b60', // Rosa/Acento
  '#2563eb', // Azul
  '#7c3aed', // Púrpura
  '#059669', // Esmeralda
  '#ca8a04', // Amarillo/Ámbar
  '#ea580c', // Naranja
];

export default function ClientesPage(): React.JSX.Element {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('TODAS');

  // UX-MEJORA: Ordenamiento
  const [sortField, setSortField] = useState<'nombre' | 'telefono' | 'ciudad' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  // UX-MEJORA: Fila expandible (Acordeón inline)
  const [expandedClientId, setExpandedClientId] = useState<number | null>(null);

  // UX-MEJORA: ConfirmDialog de eliminación
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Cliente | null>(null);

  // Modal State para Editar/Crear
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Form State
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    telefono: '',
    direccion: '',
    barrio: '',
    correo: '',
    ciudad: '',
    departamento: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await api.getClientes();
      setClientes(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la API.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = (): void => {
    setForm({
      nombre: '',
      apellido: '',
      cedula: '',
      telefono: '',
      direccion: '',
      barrio: '',
      correo: '',
      ciudad: '',
      departamento: '',
    });
    setIsEditing(false);
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (c: Cliente): void => {
    setForm({
      nombre: c.nombre,
      apellido: c.apellido,
      cedula: c.cedula,
      telefono: c.telefono,
      direccion: c.direccion,
      barrio: c.barrio,
      correo: c.correo,
      ciudad: c.ciudad,
      departamento: c.departamento,
    });
    setCurrentId(c.id);
    setIsEditing(true);
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setFormError(null);

    // Validaciones
    if (Object.values(form).some((val) => !val.trim())) {
      setFormError('Todos los campos son obligatorios.');
      return;
    }

    try {
      if (isEditing && currentId !== null) {
        await api.updateCliente(currentId, form);
      } else {
        await api.createCliente(form);
      }
      setShowModal(false);
      fetchClientes();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar el cliente.');
    }
  };

  // UX-MEJORA: ConfirmDialog handlers
  const handleOpenConfirmDelete = (c: Cliente): void => {
    setClientToDelete(c);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (clientToDelete) {
      try {
        await api.deleteCliente(clientToDelete.id);
        setIsDeleteOpen(false);
        setClientToDelete(null);
        // Si estaba expandido, cerrarlo
        if (expandedClientId === clientToDelete.id) {
          setExpandedClientId(null);
        }
        fetchClientes();
      } catch (err: any) {
        alert(err.message || 'Error al eliminar el cliente.');
      }
    }
  };

  const handleCancelDelete = (): void => {
    setIsDeleteOpen(false);
    setClientToDelete(null);
  };

  // UX-MEJORA: Filtros de ciudad dinámicos
  const cityChips = useMemo(() => {
    const counts: { [key: string]: number } = {};
    clientes.forEach((c) => {
      if (c.ciudad && c.ciudad.trim()) {
        const cityNormalized = c.ciudad.trim().toUpperCase();
        counts[cityNormalized] = (counts[cityNormalized] || 0) + 1;
      }
    });

    const sortedCities = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

    // Ocultar si solo hay 1 ciudad o ninguna registrada
    if (sortedCities.length <= 1) {
      return { cities: [], hasOthers: false, allCities: sortedCities };
    }

    const showCities = sortedCities.slice(0, 4);
    const hasOthers = sortedCities.length > 4;

    return {
      cities: showCities,
      hasOthers,
      allCities: sortedCities
    };
  }, [clientes]);

  // UX-MEJORA: Ordenamiento dinámico sobre los clientes filtrados
  const sortedAndFilteredClientes = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    // 1. Filtrado
    const filtered = clientes.filter((c) => {
      const matchesText =
        c.nombre.toLowerCase().includes(term) ||
        c.apellido.toLowerCase().includes(term) ||
        c.cedula.toLowerCase().includes(term) ||
        c.telefono.toLowerCase().includes(term) ||
        c.direccion.toLowerCase().includes(term) ||
        c.barrio.toLowerCase().includes(term) ||
        c.ciudad.toLowerCase().includes(term) ||
        c.departamento.toLowerCase().includes(term) ||
        c.correo.toLowerCase().includes(term);

      let matchesCity = true;
      if (selectedCity !== 'TODAS') {
        if (selectedCity === 'OTROS') {
          matchesCity = !cityChips.cities.includes(c.ciudad.trim().toUpperCase());
        } else {
          matchesCity = c.ciudad.trim().toUpperCase() === selectedCity;
        }
      }

      return matchesText && matchesCity;
    });

    // 2. Ordenamiento
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let valA = '';
        let valB = '';

        if (sortField === 'nombre') {
          valA = `${a.nombre} ${a.apellido}`.toLowerCase();
          valB = `${b.nombre} ${b.apellido}`.toLowerCase();
        } else if (sortField === 'telefono') {
          valA = a.telefono.toLowerCase();
          valB = b.telefono.toLowerCase();
        } else if (sortField === 'ciudad') {
          valA = `${a.ciudad} ${a.departamento}`.toLowerCase();
          valB = `${b.ciudad} ${b.departamento}`.toLowerCase();
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [clientes, searchTerm, selectedCity, sortField, sortDirection, cityChips]);

  // UX-MEJORA: Avatar iniciales generador determinista
  const getInitials = (nombre: string, apellido: string): string => {
    const n = nombre.trim().charAt(0) || '';
    const a = apellido.trim().charAt(0) || '';
    return (n + a).toUpperCase();
  };

  const getAvatarBg = (nombre: string, apellido: string): string => {
    const fullName = `${nombre} ${apellido}`;
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  };

  // UX-MEJORA: Manejo de clics de ordenamiento
  const handleSort = (field: 'nombre' | 'telefono' | 'ciudad'): void => {
    if (sortField !== field) {
      setSortField(field);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortField(null);
      setSortDirection(null);
    }
  };

  const renderSortIndicator = (field: 'nombre' | 'telefono' | 'ciudad'): string => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  // Text highlighting helper
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

  return (
    <div className="page-container animate-fade-in" style={{ position: 'relative' }}>
      {/* UX-MEJORA: ConfirmDialog global */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="¿Eliminar cliente?"
        message={`Vas a eliminar a ${clientToDelete ? `${clientToDelete.nombre} ${clientToDelete.apellido}` : ''}. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar cliente"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p style={{ color: '#cbd5e1', fontSize: '14px', marginTop: '4px' }}>
            Gestiona el directorio de tus clientes y sus direcciones de entrega.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>+</span> Nuevo Cliente
        </button>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* UX-MEJORA: Reemplazar por SearchInput global */}
          <SearchInput
            placeholder="Buscar por cédula, nombre, barrio o ciudad..."
            value={searchTerm}
            onSearch={setSearchTerm}
            style={{ flexGrow: 1, maxWidth: '400px' }}
          />

          {/* UX-MEJORA: Filtros de ciudad generados dinámicamente */}
          {cityChips.cities.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#cbd5e1' }}>Filtro rápido:</span>
              <button
                className={`btn ${selectedCity === 'TODAS' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '12px', background: selectedCity === 'TODAS' ? '' : 'transparent', borderColor: '#3b232c' }}
                onClick={() => setSelectedCity('TODAS')}
              >
                Todos
              </button>
              {cityChips.cities.map((city) => (
                <button
                  key={city}
                  className={`btn ${selectedCity === city ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '12px', textTransform: 'capitalize', background: selectedCity === city ? '' : 'transparent', borderColor: '#3b232c' }}
                  onClick={() => setSelectedCity(city)}
                >
                  {city.toLowerCase()}
                </button>
              ))}
              {cityChips.hasOthers && (
                <button
                  className={`btn ${selectedCity === 'OTROS' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '12px', background: selectedCity === 'OTROS' ? '' : 'transparent', borderColor: '#3b232c' }}
                  onClick={() => setSelectedCity('OTROS')}
                >
                  Otros
                </button>
              )}
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <strong>Error:</strong> {error}
            <button className="btn btn-secondary" style={{ marginLeft: '12px', padding: '4px 8px', fontSize: '12px' }} onClick={fetchClientes}>
              Reintentar
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#cbd5e1' }}>Cargando clientes...</div>
        ) : sortedAndFilteredClientes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#cbd5e1' }}>
            No se encontraron clientes registrados para los criterios seleccionados.
          </div>
        ) : (
          /* UX-MEJORA: Ancho de columnas fijas y table-layout: fixed */
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="client-table" style={{ width: '100%', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th
                    style={{ width: '25%', cursor: 'pointer', userSelect: 'none', color: '#ffffff' }}
                    onClick={() => handleSort('nombre')}
                  >
                    Nombre Completo{renderSortIndicator('nombre')}
                  </th>
                  <th
                    style={{ width: '15%', cursor: 'pointer', userSelect: 'none', color: '#ffffff' }}
                    onClick={() => handleSort('telefono')}
                  >
                    Teléfono{renderSortIndicator('telefono')}
                  </th>
                  <th style={{ width: '28%', color: '#ffffff' }}>Dirección / Barrio</th>
                  <th
                    style={{ width: '18%', cursor: 'pointer', userSelect: 'none', color: '#ffffff' }}
                    onClick={() => handleSort('ciudad')}
                  >
                    Ciudad / Dpto{renderSortIndicator('ciudad')}
                  </th>
                  <th style={{ width: '14%', textAlign: 'right', color: '#ffffff' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFilteredClientes.map((c) => {
                  const isExpanded = expandedClientId === c.id;
                  const avatarBg = getAvatarBg(c.nombre, c.apellido);
                  const initials = getInitials(c.nombre, c.apellido);

                  return (
                    <React.Fragment key={c.id}>
                      {/* UX-MEJORA: Fila clickeable */}
                      <tr
                        onClick={() => setExpandedClientId(isExpanded ? null : c.id)}
                        style={{ cursor: 'pointer', backgroundColor: isExpanded ? 'rgba(216, 27, 96, 0.04)' : '' }}
                      >
                        {/* UX-MEJORA: Avatar de iniciales en la columna de nombre */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: avatarBg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#ffffff',
                                flexShrink: 0,
                                userSelect: 'none'
                              }}
                            >
                              {initials}
                            </div>
                            <strong style={{ color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {highlightText(c.nombre, searchTerm)} {highlightText(c.apellido, searchTerm)}
                            </strong>
                          </div>
                        </td>
                        <td style={{ color: '#cbd5e1' }}>{highlightText(c.telefono, searchTerm)}</td>
                        <td style={{ color: '#cbd5e1' }}>
                          {highlightText(c.direccion, searchTerm)}
                          <div style={{ fontSize: '11px', color: '#cbd5e1', opacity: 0.8 }}>
                            Barrio: {highlightText(c.barrio, searchTerm)}
                          </div>
                        </td>
                        <td style={{ color: '#cbd5e1' }}>
                          {highlightText(c.ciudad, searchTerm)}
                          <div style={{ fontSize: '11px', color: '#cbd5e1', opacity: 0.8 }}>
                            {highlightText(c.departamento, searchTerm)}
                          </div>
                        </td>
                        <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right' }}>
                          <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                            <button
                              className="btn-icon"
                              title="Editar"
                              onClick={() => handleOpenEdit(c)}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path>
                              </svg>
                            </button>
                            <button
                              className="btn-icon btn-icon-danger"
                              title="Eliminar"
                              onClick={() => handleOpenConfirmDelete(c)}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* UX-MEJORA: Panel de detalle expandido debajo de la fila */}
                      {isExpanded && (
                        <tr style={{ backgroundColor: 'rgba(216, 27, 96, 0.02)' }}>
                          <td colSpan={5} style={{ padding: '20px 24px', borderTop: 'none' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                              <div>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#d81b60', fontWeight: 'bold' }}>Datos de Contacto</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#cbd5e1' }}>
                                  <div><strong>Nombre completo:</strong> {c.nombre} {c.apellido}</div>
                                  <div><strong>Cédula:</strong> {c.cedula}</div>
                                  <div><strong>Teléfono:</strong> {c.telefono}</div>
                                  <div><strong>Correo electrónico:</strong> {c.correo}</div>
                                </div>
                              </div>
                              <div>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#d81b60', fontWeight: 'bold' }}>Dirección de Envío</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#cbd5e1' }}>
                                  <div><strong>Dirección:</strong> {c.direccion}</div>
                                  <div><strong>Barrio:</strong> {c.barrio}</div>
                                  <div><strong>Ubicación:</strong> {c.ciudad}, {c.departamento}</div>
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid #3b232c', paddingTop: '12px' }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px', background: 'transparent', borderColor: '#3b232c' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(c);
                                }}
                              >
                                Editar Cliente
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger"
                                style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenConfirmDelete(c);
                                }}
                              >
                                Eliminar Cliente
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button
                className="btn-icon"
                onClick={() => setShowModal(false)}
                style={{ fontSize: '18px', fontWeight: 'bold' }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {formError && (
                  <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '6px', fontSize: '13px' }}>
                    {formError}
                  </div>
                )}
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Nombre</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      placeholder="Ej. Juan"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Apellido</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.apellido}
                      onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                      placeholder="Ej. Perez"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cédula</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.cedula}
                      onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                      placeholder="Ej. 10987654"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.telefono}
                      onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                      placeholder="Ej. 300998877"
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label className="form-label">Correo Electrónico</label>
                    <input
                      type="email"
                      className="form-input"
                      value={form.correo}
                      onChange={(e) => setForm({ ...form, correo: e.target.value })}
                      placeholder="Ej. juan.perez@correo.com"
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label className="form-label">Dirección de Entrega</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.direccion}
                      onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                      placeholder="Calle, número, apartamento..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Barrio</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.barrio}
                      onChange={(e) => setForm({ ...form, barrio: e.target.value })}
                      placeholder="Ej. Poblado"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ciudad</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.ciudad}
                      onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                      placeholder="Ej. Medellín"
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label className="form-label">Departamento</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.departamento}
                      onChange={(e) => setForm({ ...form, departamento: e.target.value })}
                      placeholder="Ej. Antioquia"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
