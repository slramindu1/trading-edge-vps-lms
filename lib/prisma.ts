import { PrismaClient } from "../lib/generated/prisma";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient({
  // Prisma 7 automatically reads DATABASE_URL from environment
  // No need to pass `url` or adapter
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { prisma };

