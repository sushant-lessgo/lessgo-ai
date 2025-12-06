// lib/devPrisma.ts
// Separate Prisma client for dev database (DEV_DATABASE_URL)
import { PrismaClient } from '@prisma/client';

const globalForDevPrisma = globalThis as unknown as {
  devPrisma: PrismaClient | undefined;
};

// Only create dev Prisma client if DEV_DATABASE_URL exists
export const getDevPrisma = (): PrismaClient | null => {
  if (!process.env.DEV_DATABASE_URL) {
    return null;
  }

  if (!globalForDevPrisma.devPrisma) {
    globalForDevPrisma.devPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DEV_DATABASE_URL,
        },
      },
    });
  }

  return globalForDevPrisma.devPrisma;
};

// Cleanup function for safe disconnection
export const disconnectDevPrisma = async (): Promise<void> => {
  if (globalForDevPrisma.devPrisma) {
    await globalForDevPrisma.devPrisma.$disconnect();
    globalForDevPrisma.devPrisma = undefined;
  }
};
