import { PrismaClient } from '@prisma/client';
import logger from './logger';

declare global {
  var __prisma: PrismaClient | undefined;
}

class PrismaService {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      // Use global variable in development to prevent multiple instances
      if (process.env.NODE_ENV === 'development' && global.__prisma) {
        PrismaService.instance = global.__prisma;
      } else {
        PrismaService.instance = new PrismaClient({
          log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
          datasources: {
            db: {
              url: process.env.DATABASE_URL,
            },
          },
        });

        // Store in global variable for development
        if (process.env.NODE_ENV === 'development') {
          global.__prisma = PrismaService.instance;
        }
      }

      // Connection established

      logger.info('Prisma Client initialized');
    }

    return PrismaService.instance;
  }

  public static async disconnect(): Promise<void> {
    if (PrismaService.instance) {
      await PrismaService.instance.$disconnect();
      logger.info('Prisma Client disconnected');
    }
  }

  public static async connect(): Promise<void> {
    const client = PrismaService.getInstance();
    try {
      await client.$connect();
      logger.info('Prisma Client connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  public static async healthCheck(): Promise<boolean> {
    try {
      const client = PrismaService.getInstance();
      await client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const prisma = PrismaService.getInstance();
export default PrismaService;

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await PrismaService.disconnect();
});

process.on('SIGINT', async () => {
  await PrismaService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await PrismaService.disconnect();
  process.exit(0);
});