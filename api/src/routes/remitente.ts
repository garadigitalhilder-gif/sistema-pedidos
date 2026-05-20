import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../db';

const router = Router();

// GET /api/remitente - Obtener la configuración actual o devolver valores predeterminados
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let config = await prisma.configuracionRemitente.findFirst();
    if (!config) {
      config = {
        id: 1,
        nombre: 'DETALLES PARA RECORDAR',
        cedula: '12345678-9',
        telefono: '300 123 4567',
        direccion: 'Av. Principal 456',
        ciudadOrigen: 'Medellín',
      };
    }
    res.json(config);
  } catch (error) {
    next(error);
  }
});

// PUT /api/remitente - Crear o actualizar los datos del remitente
router.put('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { nombre, cedula, telefono, direccion, ciudadOrigen } = req.body;

    if (!nombre || !cedula || !telefono || !direccion || !ciudadOrigen) {
      res.status(400).json({ error: 'Todos los campos son obligatorios' });
      return;
    }

    const existente = await prisma.configuracionRemitente.findFirst();

    let config;
    if (existente) {
      config = await prisma.configuracionRemitente.update({
        where: { id: existente.id },
        data: { nombre, cedula, telefono, direccion, ciudadOrigen },
      });
    } else {
      config = await prisma.configuracionRemitente.create({
        data: { nombre, cedula, telefono, direccion, ciudadOrigen },
      });
    }

    res.json(config);
  } catch (error) {
    next(error);
  }
});

export default router;
