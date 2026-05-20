import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import dotenv from 'dotenv';

// Asegurarse de cargar las variables de entorno
dotenv.config();

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

const adapter = new PrismaMariaDb(poolConfig);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export default prisma;
