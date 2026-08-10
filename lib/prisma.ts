import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient({
  // Prisma 7 automatically reads DATABASE_URL from environment
  // No need to pass `url` or adapter
});

export { prisma };

