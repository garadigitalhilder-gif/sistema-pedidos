"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const router = (0, express_1.Router)();
// POST /api/guias/generar
// Body: { pedidoIds: number[], guiasPorPagina?: 4 | 6 }
router.post('/generar', async (req, res, next) => {
    try {
        const { pedidoIds, guiasPorPagina } = req.body;
        const perPage = guiasPorPagina === 4 ? 4 : 6;
        if (!pedidoIds || !Array.isArray(pedidoIds) || pedidoIds.length === 0) {
            res.status(400).json({ error: 'La lista de IDs de pedidos es requerida' });
            return;
        }
        // Buscar pedidos con sus clientes
        const pedidos = await db_1.default.pedido.findMany({
            where: {
                id: { in: pedidoIds.map((id) => parseInt(id.toString())) },
                deletedAt: null,
            },
            include: { cliente: true },
        });
        if (pedidos.length === 0) {
            res.status(404).json({ error: 'No se encontraron pedidos válidos con los IDs proporcionados' });
            return;
        }
        // Dividir los pedidos en páginas
        const paginatedPedidos = [];
        for (let i = 0; i < pedidos.length; i += perPage) {
            paginatedPedidos.push(pedidos.slice(i, i + perPage));
        }
        // Renderizar HTML con estilos basados en CSS Grid para tamaño carta (8.5in x 11in)
        let htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Guías de Envío</title>
      <style>
        @page {
          size: letter;
          margin: 0;
        }
        body {
          margin: 0;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          -webkit-print-color-adjust: exact;
          background: white;
        }
        .page {
          width: 8.5in;
          height: 11in;
          box-sizing: border-box;
          padding: 0.4in;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.3in;
          page-break-after: always;
        }
        /* Para 6 guías por página */
        .page.six-guides {
          grid-template-rows: 1fr 1fr 1fr;
        }
        /* Para 4 guías por página */
        .page.four-guides {
          grid-template-rows: 1fr 1fr;
        }
        .guide {
          border: 2px dashed #333;
          border-radius: 8px;
          padding: 15px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
          font-size: 11px;
          line-height: 1.4;
          background: #fafafa;
        }
        .header-title {
          font-weight: bold;
          font-size: 13px;
          border-bottom: 2px solid #333;
          padding-bottom: 4px;
          margin-bottom: 8px;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .section {
          margin-bottom: 8px;
        }
        .section-title {
          font-weight: bold;
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          border-bottom: 1px solid #ddd;
          margin-bottom: 4px;
        }
        .field {
          margin-bottom: 2px;
        }
        .field-label {
          font-weight: bold;
          color: #222;
        }
        .desc-box {
          background: #eeeeee;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 6px;
          font-size: 10px;
          font-family: monospace;
          white-space: pre-wrap;
          max-height: 50px;
          overflow-y: hidden;
        }
        .footer-guide {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #333;
          padding-top: 6px;
          margin-top: 8px;
          font-size: 9px;
        }
        .barcode-placeholder {
          font-weight: bold;
          background: #000;
          color: #fff;
          padding: 2px 6px;
          border-radius: 2px;
          font-size: 10px;
          letter-spacing: 2px;
        }
      </style>
    </head>
    <body>
    `;
        // Obtener datos del remitente desde base de datos (con fallback)
        const configRemitente = await db_1.default.configuracionRemitente.findFirst();
        const remitente = {
            nombre: configRemitente?.nombre || "DETALLES PARA RECORDAR",
            direccion: configRemitente?.direccion || "Av. Principal 456",
            ciudad: configRemitente?.ciudadOrigen || "Medellín",
            telefono: configRemitente?.telefono || "300 123 4567",
        };
        paginatedPedidos.forEach((pageGroup) => {
            const pageClass = perPage === 6 ? 'six-guides' : 'four-guides';
            htmlContent += `<div class="page ${pageClass}">`;
            pageGroup.forEach((pedido) => {
                const c = pedido.cliente;
                htmlContent += `
          <div class="guide">
            <div>
              <div class="header-title">Guía de Envío</div>
              
              <!-- Remitente -->
              <div class="section">
                <div class="section-title">Remitente</div>
                <div class="field"><span class="field-label">Nombre:</span> ${remitente.nombre}</div>
                <div class="field"><span class="field-label">Origen:</span> ${remitente.ciudad}</div>
                <div class="field"><span class="field-label">Tel:</span> ${remitente.telefono}</div>
              </div>

              <!-- Destinatario -->
              <div class="section">
                <div class="section-title">Destinatario</div>
                <div class="field"><span class="field-label">Nombre:</span> ${c.nombre} ${c.apellido}</div>
                <div class="field"><span class="field-label">Cédula:</span> ${c.cedula}</div>
                <div class="field"><span class="field-label">Dir:</span> ${c.direccion}</div>
                <div class="field"><span class="field-label">Barrio:</span> ${c.barrio}</div>
                <div class="field"><span class="field-label">Destino:</span> ${c.ciudad} - ${c.departamento}</div>
                <div class="field"><span class="field-label">Tel:</span> ${c.telefono}</div>
              </div>
            </div>

            <div>
              <!-- Contenido del pedido -->
              <div class="section">
                <div class="section-title">Detalle Pedido</div>
                <div class="desc-box">${pedido.descripcion}</div>
              </div>

              <!-- Footer de la Guía -->
              <div class="footer-guide" style="justify-content: flex-end;">
                <div class="barcode-placeholder">PED-${pedido.id}</div>
              </div>
            </div>
          </div>
        `;
            });
            // Rellenar espacios vacíos en la última página si es necesario para mantener la estructura
            if (pageGroup.length < perPage) {
                const emptySpaces = perPage - pageGroup.length;
                for (let j = 0; j < emptySpaces; j++) {
                    htmlContent += `<div class="guide" style="visibility: hidden;"></div>`;
                }
            }
            htmlContent += `</div>`;
        });
        htmlContent += `
    </body>
    </html>
    `;
        // Generar PDF con Puppeteer (usando Microsoft Edge instalado localmente)
        const browser = await puppeteer_1.default.launch({
            executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'load' });
        const pdfBuffer = await page.pdf({
            format: 'letter',
            printBackground: true,
        });
        await browser.close();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=guias.pdf');
        res.end(pdfBuffer);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
