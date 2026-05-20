"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
// 1. Obtener todos los clientes activos
router.get('/', async (req, res, next) => {
    try {
        const clientes = await db_1.default.cliente.findMany({
            where: { deletedAt: null },
            orderBy: { nombre: 'asc' },
        });
        res.json(clientes);
    }
    catch (error) {
        next(error);
    }
});
// 2. Obtener detalle de un cliente por ID
router.get('/:id', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'ID inválido' });
            return;
        }
        const cliente = await db_1.default.cliente.findFirst({
            where: { id, deletedAt: null },
        });
        if (!cliente) {
            res.status(404).json({ error: 'Cliente no encontrado' });
            return;
        }
        res.json(cliente);
    }
    catch (error) {
        next(error);
    }
});
// 3. Crear un cliente
router.post('/', async (req, res, next) => {
    try {
        const { nombre, apellido, cedula, telefono, direccion, barrio, correo, ciudad, departamento, } = req.body;
        // Validación básica de campos
        if (!nombre ||
            !apellido ||
            !cedula ||
            !telefono ||
            !direccion ||
            !barrio ||
            !correo ||
            !ciudad ||
            !departamento) {
            res.status(400).json({ error: 'Todos los campos son obligatorios' });
            return;
        }
        // Verificar si ya existe un cliente con esa cédula
        const existente = await db_1.default.cliente.findFirst({
            where: { cedula },
        });
        if (existente) {
            if (existente.deletedAt !== null) {
                // Reactivar cliente si estaba eliminado lógicamente
                const reactivado = await db_1.default.cliente.update({
                    where: { id: existente.id },
                    data: {
                        nombre,
                        apellido,
                        telefono,
                        direccion,
                        barrio,
                        correo,
                        ciudad,
                        departamento,
                        deletedAt: null,
                    },
                });
                res.status(200).json(reactivado);
                return;
            }
            res.status(400).json({ error: 'Ya existe un cliente activo con esta cédula' });
            return;
        }
        const nuevoCliente = await db_1.default.cliente.create({
            data: {
                nombre,
                apellido,
                cedula,
                telefono,
                direccion,
                barrio,
                correo,
                ciudad,
                departamento,
            },
        });
        res.status(201).json(nuevoCliente);
    }
    catch (error) {
        next(error);
    }
});
// 4. Actualizar un cliente
router.put('/:id', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'ID inválido' });
            return;
        }
        const { nombre, apellido, cedula, telefono, direccion, barrio, correo, ciudad, departamento, } = req.body;
        if (!nombre ||
            !apellido ||
            !cedula ||
            !telefono ||
            !direccion ||
            !barrio ||
            !correo ||
            !ciudad ||
            !departamento) {
            res.status(400).json({ error: 'Todos los campos son obligatorios' });
            return;
        }
        // Verificar existencia del cliente
        const existente = await db_1.default.cliente.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existente) {
            res.status(404).json({ error: 'Cliente no encontrado' });
            return;
        }
        // Si cambió la cédula, validar que no choque con otra cédula activa
        if (cedula !== existente.cedula) {
            const cedulaExistente = await db_1.default.cliente.findFirst({
                where: { cedula, deletedAt: null },
            });
            if (cedulaExistente) {
                res.status(400).json({ error: 'La cédula ya está registrada para otro cliente' });
                return;
            }
        }
        const clienteActualizado = await db_1.default.cliente.update({
            where: { id },
            data: {
                nombre,
                apellido,
                cedula,
                telefono,
                direccion,
                barrio,
                correo,
                ciudad,
                departamento,
            },
        });
        res.json(clienteActualizado);
    }
    catch (error) {
        next(error);
    }
});
// 5. Eliminar un cliente (Soft Delete)
router.delete('/:id', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'ID inválido' });
            return;
        }
        const existente = await db_1.default.cliente.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existente) {
            res.status(404).json({ error: 'Cliente no encontrado o ya eliminado' });
            return;
        }
        // Soft delete
        await db_1.default.cliente.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        res.json({ message: 'Cliente eliminado correctamente (soft delete)' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
