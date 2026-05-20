import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

// Registrar Rutas
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
