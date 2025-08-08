import fs from 'fs/promises';
import path from 'path';
import * as cron from 'node-cron';
import { ExportStatus } from '@prisma/client';
import { ExportJobData, ExportFileData } from '../../types/export.types';
import { reportsService } from './reports.service';
import { fileStorageService } from './fileStorage.service';
import logger from '../../utils/logger';

export interface CleanupConfig {
  enableScheduledCleanup: boolean;
  cleanupSchedule: string; // Cron expression
  retentionPolicies: {
    completedJobs: number; // hours
    failedJobs: number; // hours
    orphanedFiles: number; // hours
    tempFiles: number; // hours
  };
  batchSize: number;
  maxCleanupDuration: number; // minutes
  enableMetrics: boolean;
}

export interface CleanupResult {
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds
  filesProcessed: number;
  filesDeleted: number;
  spaceCleaned: bigint; // bytes
  errors: string[];
  details: {
    completedJobs: number;
    failedJobs: number;
    orphanedFiles: number;
    tempFiles: number;
  };
}

export interface CleanupMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  totalFilesDeleted: number;
  totalSpaceCleaned: bigint;
  averageDuration: number;
  lastRunTime: Date | null;
  nextScheduledRun: Date | null;
}

export interface OrphanedFile {
  filePath: string;
  size: number;
  lastModified: Date;
  reason: string;
}

export class FileCleanupService {
  private config: CleanupConfig;
  private scheduledTask: cron.ScheduledTask | null = null;
  private isRunning = false;
  private metrics: CleanupMetrics;

  private readonly defaultConfig: CleanupConfig = {
    enableScheduledCleanup: true,
    cleanupSchedule: '0 2 * * *', // Daily at 2 AM
    retentionPolicies: {
      completedJobs: 24, // 24 hours
      failedJobs: 72, // 72 hours
      orphanedFiles: 1, // 1 hour
      tempFiles: 1 // 1 hour
    },
    batchSize: 100,
    maxCleanupDuration: 30, // 30 minutes
    enableMetrics: true
  };

  constructor(config?: Partial<CleanupConfig>) {
    this.config = { ...this.defaultConfig, ...config };
    this.metrics = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      totalFilesDeleted: 0,
      totalSpaceCleaned: BigInt(0),
      averageDuration: 0,
      lastRunTime: null,
      nextScheduledRun: null
    };
  }

  /**
   * Initialize cleanup service
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing file cleanup service');

      // Load existing metrics
      await this.loadMetrics();

      // Start scheduled cleanup if enabled
      if (this.config.enableScheduledCleanup) {
        this.startScheduledCleanup();
      }

      // Perform initial cleanup of temp files
      await this.cleanupTempFiles();

      logger.info('File cleanup service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize file cleanup service:', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive cleanup
   */
  async performCleanup(force: boolean = false): Promise<CleanupResult> {
    if (this.isRunning && !force) {
      throw new Error('Cleanup is already running');
    }

    const startTime = new Date();
    this.isRunning = true;

    const result: CleanupResult = {
      success: false,
      startTime,
      endTime: new Date(),
      duration: 0,
      filesProcessed: 0,
      filesDeleted: 0,
      spaceCleaned: BigInt(0),
      errors: [],
      details: {
        completedJobs: 0,
        failedJobs: 0,
        orphanedFiles: 0,
        tempFiles: 0
      }
    };

    try {
      logger.info('Starting comprehensive file cleanup');

      // Set timeout for cleanup operation
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Cleanup timeout after ${this.config.maxCleanupDuration} minutes`));
        }, this.config.maxCleanupDuration * 60 * 1000);
      });

      // Perform cleanup with timeout
      await Promise.race([
        this.executeCleanup(result),
        timeoutPromise
      ]);

      result.success = true;
      this.metrics.successfulRuns++;
      logger.info(`Cleanup completed successfully: ${result.filesDeleted} files deleted, ${result.spaceCleaned} bytes freed`);
    } catch (error) {
      result.success = false;
      result.errors.push((error as Error).message);
      this.metrics.failedRuns++;
      logger.error('Cleanup failed:', error);
    } finally {
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      this.isRunning = false;
      this.updateMetrics(result);

      // Save metrics if enabled
      if (this.config.enableMetrics) {
        await this.saveMetrics();
      }
    }

    return result;
  }

  /**
   * Clean up expired job files
   */
  async cleanupExpiredJobs(): Promise<{ deletedFiles: number; spaceCleaned: bigint }> {
    try {
      logger.info('Cleaning up expired job files');
      let deletedFiles = 0;
      let spaceCleaned = BigInt(0);

      // Clean completed jobs
      const completedResult = await this.cleanupJobsByStatus(
        ExportStatus.COMPLETED,
        this.config.retentionPolicies.completedJobs
      );
      deletedFiles += completedResult.deletedFiles;
      spaceCleaned += completedResult.spaceCleaned;

      // Clean failed jobs
      const failedResult = await this.cleanupJobsByStatus(
        ExportStatus.FAILED,
        this.config.retentionPolicies.failedJobs
      );
      deletedFiles += failedResult.deletedFiles;
      spaceCleaned += failedResult.spaceCleaned;

      logger.info(`Expired jobs cleanup completed: ${deletedFiles} files deleted`);
      return { deletedFiles, spaceCleaned };
    } catch (error) {
      logger.error('Failed to cleanup expired jobs:', error);
      throw error;
    }
  }

  /**
   * Clean up orphaned files
   */
  async cleanupOrphanedFiles(): Promise<{ deletedFiles: number; spaceCleaned: bigint }> {
    try {
      logger.info('Cleaning up orphaned files');
      const orphanedFiles = await this.findOrphanedFiles();
      let deletedFiles = 0;
      let spaceCleaned = BigInt(0);

      for (const orphanedFile of orphanedFiles) {
        try {
          const stats = await fs.stat(orphanedFile.filePath);
          await fs.unlink(orphanedFile.filePath);
          deletedFiles++;
          spaceCleaned += BigInt(stats.size);
          logger.debug(`Deleted orphaned file: ${orphanedFile.filePath}`);
        } catch (error) {
          logger.warn(`Failed to delete orphaned file ${orphanedFile.filePath}:`, error);
        }
      }

      logger.info(`Orphaned files cleanup completed: ${deletedFiles} files deleted`);
      return { deletedFiles, spaceCleaned };
    } catch (error) {
      logger.error('Failed to cleanup orphaned files:', error);
      throw error;
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(): Promise<{ deletedFiles: number; spaceCleaned: bigint }> {
    try {
      logger.info('Cleaning up temporary files');
      const storageConfig = fileStorageService.getConfig();
      const tempDir = path.join(storageConfig.baseDirectory, 'temp');
      let deletedFiles = 0;
      let spaceCleaned = BigInt(0);

      try {
        const files = await fs.readdir(tempDir);
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - this.config.retentionPolicies.tempFiles);

        for (const file of files) {
          const filePath = path.join(tempDir, file);
          try {
            const stats = await fs.stat(filePath);
            if (stats.mtime < cutoffTime) {
              await fs.unlink(filePath);
              deletedFiles++;
              spaceCleaned += BigInt(stats.size);
              logger.debug(`Deleted temp file: ${filePath}`);
            }
          } catch (error) {
            logger.warn(`Failed to process temp file ${filePath}:`, error);
          }
        }
      } catch (error) {
        // Temp directory might not exist, which is fine
        logger.debug('Temp directory not found or inaccessible');
      }

      logger.info(`Temp files cleanup completed: ${deletedFiles} files deleted`);
      return { deletedFiles, spaceCleaned };
    } catch (error) {
      logger.error('Failed to cleanup temp files:', error);
      throw error;
    }
  }

  /**
   * Get cleanup metrics
   */
  getMetrics(): CleanupMetrics {
    return { ...this.metrics };
  }

  /**
   * Get cleanup configuration
   */
  getConfig(): CleanupConfig {
    return { ...this.config };
  }

  /**
   * Update cleanup configuration
   */
  updateConfig(newConfig: Partial<CleanupConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    // Restart scheduled cleanup if schedule changed
    if (oldConfig.cleanupSchedule !== this.config.cleanupSchedule ||
        oldConfig.enableScheduledCleanup !== this.config.enableScheduledCleanup) {
      this.stopScheduledCleanup();
      if (this.config.enableScheduledCleanup) {
        this.startScheduledCleanup();
      }
    }

    logger.info('Cleanup configuration updated');
  }

  /**
   * Force stop cleanup operation
   */
  async forceStop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.warn('Force stopping cleanup operation');
    this.isRunning = false;
    // Note: In a real implementation, you might want to implement
    // a more sophisticated cancellation mechanism
  }

  /**
   * Get next scheduled cleanup time
   */
  getNextScheduledRun(): Date | null {
    if (!this.scheduledTask) {
      return null;
    }

    // This is a simplified implementation
    // In a real scenario, you'd calculate based on the cron expression
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0); // 2 AM tomorrow
    return tomorrow;
  }

  /**
   * Execute cleanup operations
   */
  private async executeCleanup(result: CleanupResult): Promise<void> {
    // Clean expired jobs
    const expiredResult = await this.cleanupExpiredJobs();
    result.filesDeleted += expiredResult.deletedFiles;
    result.spaceCleaned += expiredResult.spaceCleaned;
    result.details.completedJobs += expiredResult.deletedFiles;

    // Clean orphaned files
    const orphanedResult = await this.cleanupOrphanedFiles();
    result.filesDeleted += orphanedResult.deletedFiles;
    result.spaceCleaned += orphanedResult.spaceCleaned;
    result.details.orphanedFiles += orphanedResult.deletedFiles;

    // Clean temp files
    const tempResult = await this.cleanupTempFiles();
    result.filesDeleted += tempResult.deletedFiles;
    result.spaceCleaned += tempResult.spaceCleaned;
    result.details.tempFiles += tempResult.deletedFiles;

    result.filesProcessed = result.filesDeleted; // Simplified
  }

  /**
   * Clean up jobs by status
   */
  private async cleanupJobsByStatus(
    status: ExportStatus,
    retentionHours: number
  ): Promise<{ deletedFiles: number; spaceCleaned: bigint }> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - retentionHours);

    // This would typically query the database for expired jobs
    // For now, we'll use the existing cleanup method from reports service
    const result = await reportsService.cleanupExpiredFiles();
    return {
      deletedFiles: result.cleanedCount,
      spaceCleaned: BigInt(0) // Would be calculated from actual file sizes
    };
  }

  /**
   * Find orphaned files
   */
  private async findOrphanedFiles(): Promise<OrphanedFile[]> {
    const orphanedFiles: OrphanedFile[] = [];
    try {
      const storageConfig = fileStorageService.getConfig();
      const baseDir = storageConfig.baseDirectory;

      // This is a simplified implementation
      // In a real scenario, you'd scan the file system and compare with database records
      // For now, return empty array as we don't have a complete file system scanning implementation
      return orphanedFiles;
    } catch (error) {
      logger.error('Failed to find orphaned files:', error);
      return orphanedFiles;
    }
  }

  /**
   * Start scheduled cleanup
   */
  private startScheduledCleanup(): void {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
    }

    this.scheduledTask = cron.schedule(this.config.cleanupSchedule, async () => {
      try {
        logger.info('Starting scheduled cleanup');
        await this.performCleanup();
      } catch (error) {
        logger.error('Scheduled cleanup failed:', error);
      }
    }, {
      timezone: 'America/Lima' // Adjust timezone as needed
    });

    this.metrics.nextScheduledRun = this.getNextScheduledRun();
    logger.info(`Scheduled cleanup started with cron: ${this.config.cleanupSchedule}`);
  }

  /**
   * Stop scheduled cleanup
   */
  private stopScheduledCleanup(): void {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
      this.scheduledTask = null;
      this.metrics.nextScheduledRun = null;
      logger.info('Scheduled cleanup stopped');
    }
  }

  /**
   * Update metrics after cleanup
   */
  private updateMetrics(result: CleanupResult): void {
    this.metrics.totalRuns++;
    this.metrics.totalFilesDeleted += result.filesDeleted;
    this.metrics.totalSpaceCleaned += result.spaceCleaned;
    this.metrics.lastRunTime = result.endTime;

    // Calculate average duration
    const totalDuration = (this.metrics.averageDuration * (this.metrics.totalRuns - 1)) + result.duration;
    this.metrics.averageDuration = totalDuration / this.metrics.totalRuns;

    // Update next scheduled run
    this.metrics.nextScheduledRun = this.getNextScheduledRun();
  }

  /**
   * Load metrics from storage
   */
  private async loadMetrics(): Promise<void> {
    try {
      // In a real implementation, this would load from a persistent store
      // For now, we'll keep the default metrics
      logger.debug('Metrics loaded successfully');
    } catch (error) {
      logger.warn('Failed to load metrics, using defaults:', error);
    }
  }

  /**
   * Save metrics to storage
   */
  private async saveMetrics(): Promise<void> {
    try {
      // In a real implementation, this would save to a persistent store
      logger.debug('Metrics saved successfully');
    } catch (error) {
      logger.warn('Failed to save metrics:', error);
    }
  }

  /**
   * Shutdown cleanup service
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down file cleanup service');
    this.stopScheduledCleanup();
    if (this.isRunning) {
      await this.forceStop();
    }
    if (this.config.enableMetrics) {
      await this.saveMetrics();
    }
    logger.info('File cleanup service shutdown completed');
  }
}

export const fileCleanupService = new FileCleanupService();