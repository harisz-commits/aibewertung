import { PrismaClient } from '@prisma/client';

// Lazy Prisma singleton. The client is only constructed when DATABASE_URL is
// set, so the DB-less snapshot deployment never touches Prisma at runtime.

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getDb(): PrismaClient {
  if (!isDbConfigured()) {
    throw new Error('DATABASE_URL is not set — DB features are unavailable.');
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}
