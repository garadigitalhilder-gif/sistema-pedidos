import React, { useState } from 'react';
import ClientesPage from './components/ClientesPage';
import KanbanPage from './components/KanbanPage';
import GuiasPage from './components/GuiasPage';
import logo from './assets/logo.png';

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'kanban' | 'clientes' | 'guias'>('kanban');
  const [serverIp, setServerIp] = useState(() => {
    const savedUrl = localStorage.getItem('API_BASE_URL') || '';
    const match = savedUrl.match(/http:\/\/([^:]+)/);
    return match ? match[1] : '127.0.0.1';
  });
  const [showConfig, setShowConfig] = useState(false);

  const handleSaveIp = (): void => {
    if (serverIp.trim()) {
      localStorage.setItem('API_BASE_URL', `http://${serverIp.trim()}:3000/api`);
      alert('Configuración de conexión guardada con éxito.');
      window.location.reload();
    } else {
      localStorage.removeItem('API_BASE_URL');
      alert('Configuración restablecida por defecto (Localhost).');
      window.location.reload();
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', padding: '20px 14px' }}>
          <img src={logo} alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span className="sidebar-title" style={{ fontSize: '14px', fontWeight: '800', lineHeight: '1.2' }}>Detalles para Recordar</span>
            <span className="sidebar-subtitle" style={{ fontSize: '9px', marginTop: '2px' }}>Gestión de Pedidos</span>
          </div>
        </div>
        
        <nav className="sidebar-menu">
          <div
            className={`sidebar-item ${activeTab === 'kanban' ? 'active' : ''}`}
            onClick={() => setActiveTab('kanban')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
              <line x1="15" y1="3" x2="15" y2="21"></line>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="3" y1="15" x2="21" y2="15"></line>
            </svg>
            Programación
          </div>
          
          <div
            className={`sidebar-item ${activeTab === 'clientes' ? 'active' : ''}`}
            onClick={() => setActiveTab('clientes')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Clientes
          </div>
          
          <div
            className={`sidebar-item ${activeTab === 'guias' ? 'active' : ''}`}
            onClick={() => setActiveTab('guias')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Imprimir Guías
          </div>
        </nav>
        
        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #3b232c', paddingTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontSize: '11px', color: '#8b6e79' }}>Escritorio v1.0.0</span>
            <button 
              onClick={() => setShowConfig(!showConfig)}
              style={{
                background: 'none',
                border: 'none',
                color: '#d81b60',
                cursor: 'pointer',
                fontSize: '11px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              ⚙️ Conexión
            </button>
          </div>

          {showConfig && (
            <div style={{ width: '100%', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', color: '#cbd5e1' }}>IP del Servidor Master:</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="text"
                  placeholder="Ej: 100.80.90.120"
                  value={serverIp}
                  onChange={(e) => setServerIp(e.target.value)}
                  style={{
                    backgroundColor: '#160e11',
                    border: '1px solid #3b232c',
                    color: '#ffffff',
                    fontSize: '11px',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    flexGrow: 1,
                    minWidth: 0
                  }}
                />
                <button
                  onClick={handleSaveIp}
                  style={{
                    backgroundColor: '#d81b60',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '11px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Ok
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content View */}
      <main className="main-content">
        {activeTab === 'kanban' && <KanbanPage />}
        {activeTab === 'clientes' && <ClientesPage />}
        {activeTab === 'guias' && <GuiasPage onNavigate={setActiveTab} />}
      </main>
    </div>
  );
}

export default App;
