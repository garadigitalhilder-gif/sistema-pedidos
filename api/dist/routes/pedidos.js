"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
const mapPedidoToApi = (p) => {
    let estadoStr = 'PENDIENTE';
    if (p.estado === 1)
        estadoStr = 'LISTO';
    if (p.estado === 2)
        estadoStr = 'ENTREGADO';
    return {
        id: p.id,
        clienteId: p.clienteId,
        cliente: p.cliente,
        descripcion: p.descripcion,
        fechaEntrega: p.fechaEntrega,
        estado: estadoStr,
        tipoProgramacion: p.tipoProgramacion,
        generadoEnPdf: p.generadoEnPdf,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        deletedAt: p.deletedAt,
    };
};
// 1. Obtener todos los pedidos activos
router.get('/', async (req, res, next) => {
    try {
        const pedidos = await db_1.default.pedido.findMany({
            where: { deletedAt: null },
            include: { cliente: true },
            orderBy: { fechaEntrega: 'asc' },
        });
        res.json(pedidos.map(mapPedidoToApi));
    }
    catch (error) {
        next(error);
    }
});
// 2. Obtener pedidos agrupados por la semana de una fecha específica
router.get('/semana', async (req, res, next) => {
    try {
        const fechaParam = req.query.fecha;
        // IMPORTANTE: new Date("YYYY-MM-DD") se interpreta como medianoche UTC, lo cual en
        // zonas horarias negativas (ej: Colombia UTC-5) retrocede al día anterior local.
        // Forzamos parseo como mediodía local para evitar desplazamiento de día.
        const date = fechaParam ? new Date(fechaParam + 'T12:00:00') : new Date();
        if (isNaN(date.getTime())) {
            res.status(400).json({ error: 'Fecha de consulta inválida' });
            return;
        }
        // Calcular inicio (lunes) y fin (domingo) de la semana
        const startOfWeek = new Date(date);
        const day = startOfWeek.getDay();
        // Ajustar para que Lunes sea día 1 (en JS, Domingo es 0, Lunes es 1...)
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        const pedidos = await db_1.default.pedido.findMany({
            where: {
                deletedAt: null,
                fechaEntrega: {
                    gte: startOfWeek,
                    lte: endOfWeek,
                },
            },
            include: { cliente: true },
            orderBy: { fechaEntrega: 'asc' },
        });
        res.json({
            rango: {
                inicio: startOfWeek,
                fin: endOfWeek,
            },
            pedidos: pedidos.map(mapPedidoToApi),
        });
    }
    catch (error) {
        next(error);
    }
});
// 3. Obtener alertas de pedidos atrasados (Pedidos en PENDIENTE [0] con fecha de entrega anterior a hoy)
router.get('/alertas', async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const alertas = await db_1.default.pedido.findMany({
            where: {
                deletedAt: null,
                estado: 0, // 0 = PENDIENTE en BD
                fechaEntrega: {
                    lt: today,
                },
            },
            include: { cliente: true },
            orderBy: { fechaEntrega: 'asc' },
        });
        res.json(alertas.map(mapPedidoToApi));
    }
    catch (error) {
        next(error);
    }
});
// 4. Crear un pedido
router.post('/', async (req, res, next) => {
    try {
        const { clienteId, descripcion, fechaEntrega, estado } = req.body;
        if (!clienteId || !descripcion || !fechaEntrega) {
            res.status(400).json({ error: 'El cliente, la descripción y la fecha de entrega son obligatorios' });
            return;
        }
        const dateEntrega = new Date(fechaEntrega);
        if (isNaN(dateEntrega.getTime())) {
            res.status(400).json({ error: 'Fecha de entrega inválida' });
            return;
        }
        // Validar existencia de cliente
        const cliente = await db_1.default.cliente.findFirst({
            where: { id: parseInt(clienteId), deletedAt: null },
        });
        if (!cliente) {
            res.status(404).json({ error: 'Cliente no encontrado' });
            return;
        }
        let estadoNum = 0;
        if (estado === 'LISTO')
            estadoNum = 1;
        if (estado === 'ENTREGADO')
            estadoNum = 2;
        const nuevoPedido = await db_1.default.pedido.create({
            data: {
                clienteId: parseInt(clienteId),
                descripcion,
                fechaEntrega: dateEntrega,
                estado: estadoNum,
            },
            include: { cliente: true },
        });
        res.status(201).json(mapPedidoToApi(nuevoPedido));
    }
    catch (error) {
        next(error);
    }
});
// 5. Actualizar un pedido (reprogramación, descripción o cambio de estado)
router.put('/:id', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'ID de pedido inválido' });
            return;
        }
        const { descripcion, fechaEntrega, estado } = req.body;
        const existente = await db_1.default.pedido.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existente) {
            res.status(404).json({ error: 'Pedido no encontrado' });
            return;
        }
        const updateData = {};
        if (descripcion !== undefined)
            updateData.descripcion = descripcion;
        if (fechaEntrega !== undefined) {
            const dateEntrega = new Date(fechaEntrega);
            if (isNaN(dateEntrega.getTime())) {
                res.status(400).json({ error: 'Fecha de entrega inválida' });
                return;
            }
            updateData.fechaEntrega = dateEntrega;
        }
        if (estado !== undefined) {
            let estadoNum = 0;
            if (estado === 'LISTO')
                estadoNum = 1;
            if (estado === 'ENTREGADO')
                estadoNum = 2;
            updateData.estado = estadoNum;
        }
        const pedidoActualizado = await db_1.default.pedido.update({
            where: { id },
            data: updateData,
            include: { cliente: true },
        });
        res.json(mapPedidoToApi(pedidoActualizado));
    }
    catch (error) {
        next(error);
    }
});
// 6. Eliminar un pedido (Soft Delete)
router.delete('/:id', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'ID de pedido inválido' });
            return;
        }
        const existente = await db_1.default.pedido.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existente) {
            res.status(404).json({ error: 'Pedido no encontrado o ya eliminado' });
            return;
        }
        await db_1.default.pedido.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        res.json({ message: 'Pedido eliminado correctamente (soft delete)' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
