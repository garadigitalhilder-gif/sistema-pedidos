"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
// Asegurarse de cargar las variables de entorno
dotenv_1.default.config();
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    throw new Error('La variable de entorno DATABASE_URL es requerida en .env');
}
const pool = new pg_1.Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
});
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});
exports.default = prisma;
