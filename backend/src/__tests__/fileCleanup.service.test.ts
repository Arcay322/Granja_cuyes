import { FileCleanupService, CleanupConfig } from '../services/reports/fileCleanup.service';
import { ExportStatus } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import cron from 'node-cron';

// Mock the dependencies
jest.mock('fs/promises');
jest.mock('node-cron');
jest.mock('../services/reports/reports.service', () => ({
  reportsService: {
    cleanupExpiredFiles: jest.fn()
  }
}));
jest.mock('../services/reports/fileStorage.service', () => ({
  fileStorageService: {
    getConfig: jest.fn()
  }
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockCron = cron as jest.Mocked<typeof cron>;

describe('FileCleanupService', () => {
  let fileCleanupService: FileCleanupService;
  let mockConfig: Partial<CleanupConfig>;

  beforeEach(() => {
    mockConfig = {
      enableScheduledCleanup: false, // Disable for most tests
      retentionPolicies: {
        completedJobs: 24,
        failedJobs: 72,
        orphanedFiles: 1,
        tempFiles: 1
      },
      batchSize: 10,
      maxCleanupDuration: 5 // 5 minutes for tests
    };

    fileCleanupService = new FileCleanupService(mockConfig);

    // Mock file storage config
    const fileStorageService = require('../services/reports/fileStorage.service').fileStorageService;
    fileStorageService.getConfig.mockReturnValue({
      baseDirectory: '/tmp/test-storage'
    });

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await fileCleanupService.shutdown();
  });

  describe('initialize', () => {
    it('should initialize successfully without scheduled cleanup', async () => {
      mockFs.readdir.mockResolvedValue([]);

      await fileCleanupService.initialize();

      expect(mockCron.schedule).not.toHaveBeenCalled();
    });

    it('should initialize with scheduled cleanup enabled', async () => {
      const configWithSchedule = {
        ...mockConfig,
        enableScheduledCleanup: true,
        cleanupSchedule: '0 2 * * *'
      };
      const serviceWithSchedule = new FileCleanupService(configWithSchedule);

      const mockTask = {
        stop: jest.fn()
      };
      mockCron.schedule.mockReturnValue(mockTask as any);
      mockFs.readdir.mockResolvedValue([]);

      await serviceWithSchedule.initialize();

      expect(mockCron.schedule).toHaveBeenCalledWith(
        '0 2 * * *',
        expect.any(Function),
        expect.any(Object)
      );

      await serviceWithSchedule.shutdown();
    });

    it('should handle initialization errors', async () => {
      // Mock a more severe error that would cause initialization to fail
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.cleanupExpiredFiles.mockRejectedValue(new Error('Critical initialization error'));
      
      // Mock loadMetrics to throw an error
      jest.spyOn(fileCleanupService as any, 'loadMetrics').mockRejectedValue(new Error('Failed to load metrics'));

      await expect(fileCleanupService.initialize()).rejects.toThrow();
    });
  });

  describe('performCleanup', () => {
    beforeEach(() => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.cleanupExpiredFiles.mockResolvedValue({ cleanedCount: 5 });
      mockFs.readdir.mockResolvedValue([]);
    });

    it('should perform comprehensive cleanup successfully', async () => {
      const result = await fileCleanupService.performCleanup();

      expect(result.success).toBe(true);
      expect(result.filesDeleted).toBeGreaterThanOrEqual(0);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should prevent concurrent cleanup runs', async () => {
      // Start first cleanup
      const firstCleanup = fileCleanupService.performCleanup();

      // Try to start second cleanup
      await expect(fileCleanupService.performCleanup()).rejects.toThrow('Cleanup is already running');

      // Wait for first cleanup to complete
      await firstCleanup;
    });

    it('should allow forced cleanup during running cleanup', async () => {
      // Start first cleanup
      const firstCleanup = fileCleanupService.performCleanup();

      // Force second cleanup
      const secondCleanup = fileCleanupService.performCleanup(true);

      // Both should complete
      const [result1, result2] = await Promise.all([firstCleanup, secondCleanup]);
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should handle cleanup timeout', async () => {
      // Mock a long-running operation
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.cleanupExpiredFiles.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10000)) // 10 seconds
      );

      const shortTimeoutService = new FileCleanupService({
        ...mockConfig,
        maxCleanupDuration: 0.01 // 0.01 minutes = 0.6 seconds
      });

      const result = await shortTimeoutService.performCleanup();

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('timeout');

      await shortTimeoutService.shutdown();
    });

    it('should handle cleanup errors gracefully', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.cleanupExpiredFiles.mockRejectedValue(new Error('Database error'));

      const result = await fileCleanupService.performCleanup();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Database error');
    });
  });

  describe('cleanupExpiredJobs', () => {
    it('should cleanup expired jobs successfully', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.cleanupExpiredFiles.mockResolvedValue({ cleanedCount: 10 });

      const result = await fileCleanupService.cleanupExpiredJobs();

      expect(result.deletedFiles).toBe(20); // Called twice (completed + failed)
      expect(result.spaceCleaned).toBe(BigInt(0));
      expect(reportsService.cleanupExpiredFiles).toHaveBeenCalledTimes(2);
    });

    it('should handle cleanup errors', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.cleanupExpiredFiles.mockRejectedValue(new Error('Cleanup failed'));

      await expect(fileCleanupService.cleanupExpiredJobs()).rejects.toThrow('Cleanup failed');
    });
  });

  describe('cleanupOrphanedFiles', () => {
    it('should cleanup orphaned files successfully', async () => {
      // Mock empty orphaned files (simplified implementation)
      const result = await fileCleanupService.cleanupOrphanedFiles();

      expect(result.deletedFiles).toBe(0);
      expect(result.spaceCleaned).toBe(BigInt(0));
    });

    it('should handle orphaned file cleanup errors', async () => {
      // The current implementation doesn't throw errors for orphaned files
      // but logs warnings. This test ensures it doesn't crash.
      const result = await fileCleanupService.cleanupOrphanedFiles();

      expect(result).toHaveProperty('deletedFiles');
      expect(result).toHaveProperty('spaceCleaned');
    });
  });

  describe('cleanupTempFiles', () => {
    it('should cleanup temp files successfully', async () => {
      const oldFile = 'old-temp-file.tmp';
      const newFile = 'new-temp-file.tmp';

      mockFs.readdir.mockResolvedValue([oldFile, newFile] as any);

      // Mock file stats - old file should be deleted
      mockFs.stat.mockImplementation((filePath) => {
        const fileName = path.basename(filePath as string);
        const oldDate = new Date();
        oldDate.setHours(oldDate.getHours() - 2); // 2 hours old
        const newDate = new Date(); // Current time

        return Promise.resolve({
          size: 1024,
          mtime: fileName === oldFile ? oldDate : newDate
        } as any);
      });

      mockFs.unlink.mockResolvedValue(undefined);

      const result = await fileCleanupService.cleanupTempFiles();

      expect(result.deletedFiles).toBe(1);
      expect(result.spaceCleaned).toBe(BigInt(1024));
      expect(mockFs.unlink).toHaveBeenCalledTimes(1);
    });

    it('should handle missing temp directory', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Directory not found'));

      const result = await fileCleanupService.cleanupTempFiles();

      expect(result.deletedFiles).toBe(0);
      expect(result.spaceCleaned).toBe(BigInt(0));
    });

    it('should handle individual file errors', async () => {
      mockFs.readdir.mockResolvedValue(['file1.tmp', 'file2.tmp'] as any);

      mockFs.stat.mockImplementation((filePath) => {
        const fileName = path.basename(filePath as string);
        if (fileName === 'file1.tmp') {
          return Promise.reject(new Error('File access error'));
        }
        const oldDate = new Date();
        oldDate.setHours(oldDate.getHours() - 2);
        return Promise.resolve({
          size: 1024,
          mtime: oldDate
        } as any);
      });

      mockFs.unlink.mockResolvedValue(undefined);

      const result = await fileCleanupService.cleanupTempFiles();

      expect(result.deletedFiles).toBe(1); // Only file2.tmp should be deleted
      expect(mockFs.unlink).toHaveBeenCalledTimes(1);
    });
  });

  describe('configuration management', () => {
    it('should return current configuration', () => {
      const config = fileCleanupService.getConfig();

      expect(config).toHaveProperty('enableScheduledCleanup');
      expect(config).toHaveProperty('retentionPolicies');
      expect(config).toHaveProperty('batchSize');
    });

    it('should update configuration', () => {
      const newConfig = {
        batchSize: 200,
        retentionPolicies: {
          completedJobs: 48,
          failedJobs: 96,
          orphanedFiles: 2,
          tempFiles: 2
        }
      };

      fileCleanupService.updateConfig(newConfig);
      const config = fileCleanupService.getConfig();

      expect(config.batchSize).toBe(200);
      expect(config.retentionPolicies.completedJobs).toBe(48);
    });

    it('should restart scheduled cleanup when schedule changes', async () => {
      const mockTask = {
        stop: jest.fn()
      };
      mockCron.schedule.mockReturnValue(mockTask as any);

      // Enable scheduled cleanup
      fileCleanupService.updateConfig({
        enableScheduledCleanup: true,
        cleanupSchedule: '0 3 * * *'
      });

      expect(mockCron.schedule).toHaveBeenCalledWith(
        '0 3 * * *',
        expect.any(Function),
        expect.any(Object)
      );

      // Change schedule
      fileCleanupService.updateConfig({
        cleanupSchedule: '0 4 * * *'
      });

      expect(mockTask.stop).toHaveBeenCalled();
      expect(mockCron.schedule).toHaveBeenCalledWith(
        '0 4 * * *',
        expect.any(Function),
        expect.any(Object)
      );
    });
  });

  describe('metrics', () => {
    it('should track cleanup metrics', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.cleanupExpiredFiles.mockResolvedValue({ cleanedCount: 5 });
      mockFs.readdir.mockResolvedValue([]);

      // Perform cleanup to generate metrics
      await fileCleanupService.performCleanup();

      const metrics = fileCleanupService.getMetrics();
      expect(metrics.totalRuns).toBe(1);
      expect(metrics.successfulRuns).toBe(1);
      expect(metrics.failedRuns).toBe(0);
      expect(metrics.totalFilesDeleted).toBeGreaterThanOrEqual(0);
      expect(metrics.lastRunTime).toBeInstanceOf(Date);
    });

    it('should track failed runs', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.cleanupExpiredFiles.mockRejectedValue(new Error('Cleanup error'));

      // Perform cleanup that will fail
      await fileCleanupService.performCleanup();

      const metrics = fileCleanupService.getMetrics();
      expect(metrics.totalRuns).toBe(1);
      expect(metrics.successfulRuns).toBe(0);
      expect(metrics.failedRuns).toBe(1);
    });

    it('should calculate average duration', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.cleanupExpiredFiles.mockResolvedValue({ cleanedCount: 1 });
      mockFs.readdir.mockResolvedValue([]);

      // Perform multiple cleanups
      await fileCleanupService.performCleanup();
      await fileCleanupService.performCleanup();

      const metrics = fileCleanupService.getMetrics();
      expect(metrics.totalRuns).toBe(2);
      expect(metrics.averageDuration).toBeGreaterThan(0);
    });
  });

  describe('scheduled cleanup', () => {
    it('should get next scheduled run time', () => {
      const nextRun = fileCleanupService.getNextScheduledRun();
      // Should be null when scheduled cleanup is disabled
      expect(nextRun).toBeNull();
    });

    it('should return next scheduled run when enabled', async () => {
      const mockTask = {
        stop: jest.fn()
      };
      mockCron.schedule.mockReturnValue(mockTask as any);

      fileCleanupService.updateConfig({
        enableScheduledCleanup: true,
        cleanupSchedule: '0 2 * * *'
      });

      const nextRun = fileCleanupService.getNextScheduledRun();
      expect(nextRun).toBeInstanceOf(Date);
    });
  });

  describe('force operations', () => {
    it('should force stop cleanup operation', async () => {
      // Start a long-running cleanup
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.cleanupExpiredFiles.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      const cleanupPromise = fileCleanupService.performCleanup();

      // Force stop
      await fileCleanupService.forceStop();

      // Cleanup should still complete but might be marked as stopped
      const result = await cleanupPromise;
      expect(result).toBeDefined();
    });
  });

  describe('shutdown', () => {
    it('should shutdown gracefully', async () => {
      const mockTask = {
        stop: jest.fn()
      };
      mockCron.schedule.mockReturnValue(mockTask as any);

      // Enable scheduled cleanup
      fileCleanupService.updateConfig({
        enableScheduledCleanup: true
      });

      await fileCleanupService.shutdown();

      expect(mockTask.stop).toHaveBeenCalled();
    });

    it('should shutdown while cleanup is running', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.cleanupExpiredFiles.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      // Start cleanup
      const cleanupPromise = fileCleanupService.performCleanup();

      // Shutdown while running
      await fileCleanupService.shutdown();

      // Cleanup should still complete
      const result = await cleanupPromise;
      expect(result).toBeDefined();
    });
  });
});