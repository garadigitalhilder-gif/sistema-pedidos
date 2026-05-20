import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
declare const prisma: PrismaClient<{
    adapter: PrismaMariaDb;
    log: ("info" | "query" | "warn" | "error")[];
}, "info" | "query" | "warn" | "error", import("@prisma/client/runtime/client").DefaultArgs>;
export default prisma;
