"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
// GET /api/remitente - Obtener la configuración actual o devolver valores predeterminados
router.get('/', async (req, res, next) => {
    try {
        let config = await db_1.default.configuracionRemitente.findFirst();
        if (!config) {
            config = {
                id: 1,
                nombre: 'SISTEMA PEDIDOS FERACOBA',
                cedula: '12345678-9',
                telefono: '300 123 4567',
                direccion: 'Av. Principal 456',
                ciudadOrigen: 'Medellín',
            };
        }
        res.json(config);
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/remitente - Crear o actualizar los datos del remitente
router.put('/', async (req, res, next) => {
    try {
        const { nombre, cedula, telefono, direccion, ciudadOrigen } = req.body;
        if (!nombre || !cedula || !telefono || !direccion || !ciudadOrigen) {
            res.status(400).json({ error: 'Todos los campos son obligatorios' });
            return;
        }
        const existente = await db_1.default.configuracionRemitente.findFirst();
        let config;
        if (existente) {
            config = await db_1.default.configuracionRemitente.update({
                where: { id: existente.id },
                data: { nombre, cedula, telefono, direccion, ciudadOrigen },
            });
        }
        else {
            config = await db_1.default.configuracionRemitente.create({
                data: { nombre, cedula, telefono, direccion, ciudadOrigen },
            });
        }
        res.json(config);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
