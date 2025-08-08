import { PrismaClient } from '@prisma/client';
import logger from './logger';

const prisma = new PrismaClient();

/**
 * Database connection utilities for export operations
 */
export class DatabaseUtils {
  private static instance: DatabaseUtils;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = prisma;
  }

  public static getInstance(): DatabaseUtils {
    if (!DatabaseUtils.instance) {
      DatabaseUtils.instance = new DatabaseUtils();
    }
    return DatabaseUtils.instance;
  }

  /**
   * Execute a database operation with retry logic
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error);
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retrying with exponential backoff
        await this.sleep(delay * Math.pow(2, attempt - 1));
      }
    }
    
    logger.error(`Database operation failed after ${maxRetries} attempts:`, lastError);
    throw lastError!;
  }

  /**
   * Execute multiple operations in a transaction
   */
  async withTransaction<T>(
    operations: (prisma: any) => Promise<T>
  ): Promise<T> {
    try {
      logger.debug('Starting database transaction');
      
      const result = await this.prisma.$transaction(async (tx) => {
        return await operations(tx);
      });
      
      logger.debug('Database transaction completed successfully');
      return result;
    } catch (error) {
      logger.error('Database transaction failed:', error);
      throw error;
    }
  }

  /**
   * Check database connection health
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database connection check failed:', error);
      return false;
    }
  }

  /**
   * Get database connection info
   */
  async getConnectionInfo(): Promise<{
    connected: boolean;
    version?: string;
    activeConnections?: number;
  }> {
    try {
      const versionResult = await this.prisma.$queryRaw<[{ version: string }]>`SELECT version()`;
      const version = versionResult[0]?.version;
      
      const connectionsResult = await this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'
      `;
      const activeConnections = Number(connectionsResult[0]?.count || 0);
      
      return {
        connected: true,
        version,
        activeConnections
      };
    } catch (error) {
      logger.error('Failed to get database connection info:', error);
      return { connected: false };
    }
  }

  /**
   * Clean up database connections
   */
  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      logger.info('Database connections closed');
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
    }
  }

  /**
   * Utility function to sleep for a given duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get Prisma client instance
   */
  getPrismaClient(): PrismaClient {
    return this.prisma;
  }
}

/**
 * Transaction helper for export operations
 */
export class ExportTransactionHelper {
  private db: DatabaseUtils;

  constructor() {
    this.db = DatabaseUtils.getInstance();
  }

  /**
   * Create export job with file record in a transaction
   */
  async createJobWithFile(
    jobData: any,
    fileData?: any
  ): Promise<{ job: any; file?: any }> {
    return await this.db.withTransaction(async (tx) => {
      const job = await tx.exportJob.create({
        data: jobData
      });

      let file;
      if (fileData) {
        file = await tx.exportFile.create({
          data: {
            ...fileData,
            jobId: job.id
          }
        });
      }

      return { job, file };
    });
  }

  /**
   * Update job status and create file record atomically
   */
  async completeJobWithFile(
    jobId: string,
    jobUpdate: any,
    fileData: any
  ): Promise<{ job: any; file: any }> {
    return await this.db.withTransaction(async (tx) => {
      const job = await tx.exportJob.update({
        where: { id: jobId },
        data: jobUpdate
      });

      const file = await tx.exportFile.create({
        data: {
          ...fileData,
          jobId
        }
      });

      return { job, file };
    });
  }

  /**
   * Cleanup expired jobs and files atomically
   */
  async cleanupExpiredData(expirationDate: Date): Promise<{
    deletedFiles: number;
    updatedJobs: number;
  }> {
    return await this.db.withTransaction(async (tx) => {
      // Get expired jobs with files
      const expiredJobs = await tx.exportJob.findMany({
        where: {
          expiresAt: { lt: expirationDate },
          status: 'COMPLETED'
        },
        include: { files: true }
      });

      let deletedFiles = 0;
      
      // Delete file records
      for (const job of expiredJobs) {
        const deleteResult = await tx.exportFile.deleteMany({
          where: { jobId: job.id }
        });
        deletedFiles += deleteResult.count;
      }

      // Update job status to indicate files are cleaned
      const updateResult = await tx.exportJob.updateMany({
        where: {
          id: { in: expiredJobs.map(job => job.id) }
        },
        data: {
          // Keep job record but mark as cleaned
          errorMessage: 'Files cleaned up due to expiration'
        }
      });

      return {
        deletedFiles,
        updatedJobs: updateResult.count
      };
    });
  }
}

/**
 * Error handling utilities for database operations
 */
export class DatabaseErrorHandler {
  static isConnectionError(error: any): boolean {
    return !!(error?.code === 'P1001' || 
           error?.code === 'P1002' || 
           error?.message?.includes('connection'));
  }

  static isConstraintError(error: any): boolean {
    return !!(error?.code === 'P2002' || 
           error?.code === 'P2003' || 
           error?.code === 'P2025');
  }

  static isTimeoutError(error: any): boolean {
    return !!(error?.code === 'P1008' || 
           error?.message?.includes('timeout'));
  }

  static getRetryableError(error: any): boolean {
    return this.isConnectionError(error) || 
           this.isTimeoutError(error);
  }

  static getUserFriendlyMessage(error: unknown): string {
    if (this.isConnectionError(error)) {
      return 'Database connection error. Please try again.';
    }
    
    if (this.isConstraintError(error)) {
      return 'Data validation error. Please check your input.';
    }
    
    if (this.isTimeoutError(error)) {
      return 'Operation timed out. Please try again.';
    }
    
    return 'An unexpected database error occurred.';
  }
}

// Export singleton instance
export const databaseUtils = DatabaseUtils.getInstance();
export const exportTransactionHelper = new ExportTransactionHelper();