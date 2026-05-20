import { PrismaClient } from '@prisma/client';
declare const prisma: PrismaClient<{
    log: ("info" | "query" | "warn" | "error")[];
}, "info" | "query" | "warn" | "error", import("@prisma/client/runtime/client").DefaultArgs>;
export default prisma;
