"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const clientes_1 = __importDefault(require("./routes/clientes"));
const pedidos_1 = __importDefault(require("./routes/pedidos"));
const guias_1 = __importDefault(require("./routes/guias"));
const remitente_1 = __importDefault(require("./routes/remitente"));
const cronLimpieza_1 = require("./cronLimpieza");
// Cargar variables de entorno
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Servir archivos estáticos del frontend compilado
const staticPath = path_1.default.join(__dirname, '../public');
app.use(express_1.default.static(staticPath));
// Registrar Rutas de la API
app.use('/api/clientes', clientes_1.default);
app.use('/api/pedidos', pedidos_1.default);
app.use('/api/guias', guias_1.default);
app.use('/api/remitente', remitente_1.default);
// Endpoint de prueba de salud de la API
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Servidor de Pedidos ejecutándose correctamente',
        timestamp: new Date()
    });
});
// Comodín para SPA: cualquier ruta GET que no sea API sirve el index.html
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/health')) {
        res.sendFile(path_1.default.join(staticPath, 'index.html'), (err) => {
            if (err) {
                next();
            }
        });
    }
    else {
        next();
    }
});
// Middleware global de manejo de errores
app.use((err, req, res, next) => {
    console.error('[Error de API]', err);
    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor'
    });
});
// Arrancar servidor
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Servidor] API REST escuchando en todas las interfaces en el puerto ${PORT}`);
    // Iniciar la tarea en segundo plano de limpieza
    (0, cronLimpieza_1.inicializarCronLimpieza)();
});
