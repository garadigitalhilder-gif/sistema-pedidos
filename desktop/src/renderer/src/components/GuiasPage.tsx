// UX-MEJORA: Pantalla Generación de Guías con controles reestructurados, EmptyState e indicadores
import React, { useState, useEffect, useMemo } from 'react';
import { api, Pedido, ConfiguracionRemitente } from '../services/api';
import SearchInput from './SearchInput';
import EmptyState from './EmptyState';

interface GuiasPageProps {
  onNavigate?: (tab: 'kanban' | 'clientes' | 'guias') => void;
}

export default function GuiasPage({ onNavigate }: GuiasPageProps): React.JSX.Element {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [guiasPorPagina, setGuiasPorPagina] = useState<4 | 6>(6);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de configuración de Remitente
  const [remitente, setRemitente] = useState<ConfiguracionRemitente | null>(null);
  const [showRemitenteForm, setShowRemitenteForm] = useState(false);
  const [savingRemitente, setSavingRemitente] = useState(false);

  useEffect(() => {
    fetchPedidosListos();
    fetchRemitente();
  }, []);

  const fetchPedidosListos = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPedidos();
      // Filtrar solo pedidos que están en estado "LISTO"
      const listos = data.filter((p) => p.estado === 'LISTO');
      setPedidos(listos);
      setSelectedIds([]);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la API.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRemitente = async (): Promise<void> => {
    try {
      const data = await api.getRemitente();
      setRemitente(data);
    } catch (err: any) {
      console.error('Error al cargar remitente:', err);
    }
  };

  // UX-MEJORA: Determinar si los datos del remitente están completamente configurados
  const isRemitenteConfigured = useMemo(() => {
    if (!remitente) return false;
    return !!(
      remitente.nombre?.trim() &&
      remitente.direccion?.trim() &&
      remitente.telefono?.trim() &&
      remitente.ciudadOrigen?.trim()
    );
  }, [remitente]);

  const handleToggleSelect = (id: number): void => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Filter ready orders dynamically
  const filteredPedidos = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return pedidos.filter((p) => {
      return (
        p.descripcion.toLowerCase().includes(term) ||
        p.cliente.nombre.toLowerCase().includes(term) ||
        p.cliente.apellido.toLowerCase().includes(term) ||
        p.cliente.cedula.toLowerCase().includes(term) ||
        p.cliente.ciudad.toLowerCase().includes(term) ||
        p.cliente.barrio.toLowerCase().includes(term) ||
        p.cliente.departamento.toLowerCase().includes(term) ||
        String(p.id).includes(term)
      );
    });
  }, [pedidos, searchTerm]);

  const handleSelectAll = (): void => {
    if (selectedIds.length === filteredPedidos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPedidos.map((p) => p.id));
    }
  };

  const handleGenerarPDF = async (): Promise<void> => {
    if (selectedIds.length === 0) return;

    try {
      setGenerating(true);
      const blob = await api.generarGuiasPdf(selectedIds, guiasPorPagina);
      const url = window.URL.createObjectURL(blob);

      // UX-MEJORA: Descarga directa del PDF para evitar problemas de protocolo blob en Electron/Windows
      const a = document.createElement('a');
      a.href = url;
      a.download = `guias_envio_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      // Liberar memoria del blob
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);

      // Preguntar si desea actualizar el estado a ENTREGADO
      if (
        confirm(
          '¿Desea cambiar el estado de los pedidos procesados a "ENTREGADO" (Despachados)?'
        )
      ) {
        for (const id of selectedIds) {
          await api.updatePedido(id, { estado: 'ENTREGADO' });
        }
        fetchPedidosListos();
      }
    } catch (err: any) {
      alert(err.message || 'Error al generar el PDF.');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateRemitente = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!remitente) return;
    try {
      setSavingRemitente(true);
      const updated = await api.updateRemitente({
        nombre: remitente.nombre,
        cedula: remitente.cedula,
        telefono: remitente.telefono,
        direccion: remitente.direccion,
        ciudadOrigen: remitente.ciudadOrigen,
      });
      setRemitente(updated);
      alert('Datos del remitente actualizados con éxito.');
      setShowRemitenteForm(false);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar remitente');
    } finally {
      setSavingRemitente(false);
    }
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
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Generación de Guías</h1>
          <p style={{ color: '#cbd5e1', fontSize: '14px', marginTop: '4px' }}>
            Selecciona los pedidos listos para generar e imprimir sus respectivas guías físicas en PDF.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '16px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px', color: '#cbd5e1' }}>
          Cargando pedidos listos...
        </div>
      ) : pedidos.length === 0 ? (
        /* UX-MEJORA: Estado vacío cuando no hay pedidos listos */
        <EmptyState
          icon="document"
          title="No hay pedidos listos para imprimir"
          description="Para generar guías, primero marca los pedidos como LISTO en tu programación semanal. Solo los pedidos en estado LISTO aparecen aquí."
          ctaLabel="Ir a Programación Semanal"
          ctaAction={() => onNavigate && onNavigate('kanban')}
        />
      ) : (
        <div className="guides-container">
          {/* UX-MEJORA: Fila 1 principal de controles */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px',
              borderBottom: '1px solid #3b232c',
              paddingBottom: '16px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="select-all-header"
                checked={filteredPedidos.length > 0 && selectedIds.length === filteredPedidos.length}
                onChange={handleSelectAll}
                disabled={filteredPedidos.length === 0}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label
                htmlFor="select-all-header"
                style={{
                  fontSize: '13px',
                  cursor: 'pointer',
                  color: '#cbd5e1',
                  fontWeight: '600',
                  userSelect: 'none'
                }}
              >
                Seleccionar todos los filtrados
              </label>
            </div>

            <SearchInput
              placeholder="Buscar por cliente, destino..."
              value={searchTerm}
              onSearch={setSearchTerm}
              style={{ width: '320px' }}
            />

            {/* UX-MEJORA: Botón Imprimir Guías deshabilitado cuando hay 0 seleccionados */}
            <button
              className="btn btn-primary"
              onClick={handleGenerarPDF}
              disabled={selectedIds.length === 0 || generating}
              style={{
                opacity: selectedIds.length === 0 || generating ? 0.45 : 1,
                cursor: selectedIds.length === 0 || generating ? 'not-allowed' : 'pointer',
                pointerEvents: selectedIds.length === 0 || generating ? 'none' : 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {generating ? (
                'Generando PDF...'
              ) : selectedIds.length === 0 ? (
                'Selecciona pedidos para imprimir'
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                  Imprimir Guías ({selectedIds.length})
                </>
              )}
            </button>
          </div>

          {/* UX-MEJORA: Fila 2 secundaria más pequeña y de menor contraste */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#cbd5e1',
              flexWrap: 'wrap'
            }}
          >
            <div className="selection-summary" style={{ color: '#cbd5e1', fontSize: '13px' }}>
              Pedidos Listos: <strong>{pedidos.length}</strong> | Filtrados: <strong>{filteredPedidos.length}</strong> | Seleccionados:{' '}
              <strong style={{ color: '#d81b60' }}>{selectedIds.length}</strong>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* UX-MEJORA: Botón Datos del Remitente con indicador de estado (verde/naranja) */}
              <button
                className="btn btn-secondary"
                onClick={() => setShowRemitenteForm(!showRemitenteForm)}
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  borderColor: '#3b232c',
                  fontSize: '12px',
                  padding: '6px 12px',
                  background: 'transparent'
                }}
                title={isRemitenteConfigured ? undefined : 'Configura los datos del remitente antes de imprimir'}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isRemitenteConfigured ? '#10b981' : '#f59e0b',
                    display: 'inline-block',
                  }}
                />
                Datos del Remitente
              </button>

              {/* UX-MEJORA: Maquetación selector con tooltip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Maquetación:
                  <span
                    className="help-tooltip-trigger"
                    style={{
                      cursor: 'help',
                      color: '#8b6e79',
                      backgroundColor: 'rgba(216, 27, 96, 0.1)',
                      border: '1px solid rgba(216, 27, 96, 0.3)',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      position: 'relative',
                    }}
                  >
                    ?
                    <span className="help-tooltip-content">
                      Cantidad de guías por hoja A4 impresa. 6 por hoja es el tamaño recomendado para guías de envío estándar.
                    </span>
                  </span>
                </span>
                <select
                  className="form-input"
                  style={{ padding: '4px 8px', fontSize: '12px', minWidth: '120px', backgroundColor: '#1e1317' }}
                  value={guiasPorPagina}
                  onChange={(e) => setGuiasPorPagina(parseInt(e.target.value) as 4 | 6)}
                >
                  <option value="6">6 por hoja (Recomendado)</option>
                  <option value="4">4 por hoja (Grande)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Formulario Remitente */}
          {showRemitenteForm && remitente && (
            <div className="card animate-fade-in" style={{ marginBottom: '20px', border: '1px solid #d81b60', backgroundColor: '#1e1317' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #3b232c', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 600 }}>Editar Datos del Remitente (Fijos para Guía)</h3>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#8b6e79', cursor: 'pointer', fontSize: '16px' }}
                  onClick={() => setShowRemitenteForm(false)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleUpdateRemitente}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '12px', color: '#cbd5e1' }}>Nombre o Razón Social</label>
                    <input
                      type="text"
                      className="form-input"
                      value={remitente.nombre}
                      onChange={(e) => setRemitente({ ...remitente, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '12px', color: '#cbd5e1' }}>Cédula / NIT</label>
                    <input
                      type="text"
                      className="form-input"
                      value={remitente.cedula}
                      onChange={(e) => setRemitente({ ...remitente, cedula: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '12px', color: '#cbd5e1' }}>Teléfono</label>
                    <input
                      type="text"
                      className="form-input"
                      value={remitente.telefono}
                      onChange={(e) => setRemitente({ ...remitente, telefono: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '12px', color: '#cbd5e1' }}>Dirección de Origen</label>
                    <input
                      type="text"
                      className="form-input"
                      value={remitente.direccion}
                      onChange={(e) => setRemitente({ ...remitente, direccion: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '12px', color: '#cbd5e1' }}>Ciudad de Origen</label>
                    <input
                      type="text"
                      className="form-input"
                      value={remitente.ciudadOrigen}
                      onChange={(e) => setRemitente({ ...remitente, ciudadOrigen: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowRemitenteForm(false)}
                    disabled={savingRemitente}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={savingRemitente}>
                    {savingRemitente ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tabla de Selección */}
          <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
            {filteredPedidos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#cbd5e1' }}>
                No se encontraron pedidos listos que coincidan con la búsqueda.
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none' }}>
                <table className="client-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>Selección</th>
                      <th>ID Pedido</th>
                      <th>Cliente</th>
                      <th>Destino (Ciudad/Barrio)</th>
                      <th>Descripción de Entrega</th>
                      <th>Fecha de Programación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPedidos.map((p) => {
                      const isChecked = selectedIds.includes(p.id);
                      return (
                        <tr
                          key={p.id}
                          onClick={() => handleToggleSelect(p.id)}
                          style={{ cursor: 'pointer', backgroundColor: isChecked ? 'rgba(216, 27, 96, 0.05)' : '' }}
                        >
                          <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelect(p.id)}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                          </td>
                          <td>
                            <strong>#{highlightText(String(p.id), searchTerm)}</strong>
                          </td>
                          <td>
                            <strong style={{ color: '#ffffff' }}>
                              {highlightText(p.cliente.nombre, searchTerm)} {highlightText(p.cliente.apellido, searchTerm)}
                            </strong>
                            <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                              C.C. {highlightText(p.cliente.cedula, searchTerm)}
                            </div>
                          </td>
                          <td>
                            {highlightText(p.cliente.ciudad, searchTerm)} ({highlightText(p.cliente.departamento, searchTerm)})
                            <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                              Barrio: {highlightText(p.cliente.barrio, searchTerm)}
                            </div>
                          </td>
                          <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#cbd5e1' }}>
                            {highlightText(p.descripcion, searchTerm)}
                          </td>
                          <td>
                            <strong style={{ color: '#ffffff' }}>{new Date(p.fechaEntrega).toLocaleDateString('es-CO')}</strong>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
