import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import clientesRouter from './routes/clientes';
import pedidosRouter from './routes/pedidos';
import guiasRouter from './routes/guias';
import remitenteRouter from './routes/remitente';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend compilado
const staticPath = path.join(__dirname, '../public');
app.use(express.static(staticPath));

// Registrar Rutas de la API
app.use('/api/clientes', clientesRouter);
app.use('/api/pedidos', pedidosRouter);
app.use('/api/guias', guiasRouter);
app.use('/api/remitente', remitenteRouter);

// Endpoint de prueba de salud de la API
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor de Pedidos ejecutándose correctamente',
    timestamp: new Date()
  });
});

// Comodín para SPA: cualquier ruta que no sea API sirve el index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  res.sendFile(path.join(staticPath, 'index.html'), (err) => {
    if (err) {
      // Si no existe el archivo (desarrollo o no compilado), continuar
      next();
    }
  });
});

// Middleware global de manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error de API]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`[Servidor] API REST escuchando en http://localhost:${PORT}`);
});
