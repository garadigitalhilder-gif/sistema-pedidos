"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
const dotenv_1 = __importDefault(require("dotenv"));
// Asegurarse de cargar las variables de entorno
dotenv_1.default.config();
const dbUrlString = process.env.DATABASE_URL;
if (!dbUrlString) {
    throw new Error('La variable de entorno DATABASE_URL es requerida en .env');
}
// Parsear la URL de conexión
const dbUrl = new URL(dbUrlString);
const poolConfig = {
    host: dbUrl.hostname || 'localhost',
    port: dbUrl.port ? parseInt(dbUrl.port) : 3306,
    user: dbUrl.username || 'root',
    password: decodeURIComponent(dbUrl.password || ''),
    database: dbUrl.pathname.replace(/^\//, ''),
    connectionLimit: 10,
};
const adapter = new adapter_mariadb_1.PrismaMariaDb(poolConfig);
const prisma = new client_1.PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});
exports.default = prisma;
