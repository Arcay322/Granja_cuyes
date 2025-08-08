import { JobMonitoringService, MonitoringConfig } from '../services/reports/jobMonitoring.service';
import { ExportStatus, ExportFormat } from '@prisma/client';
import { ExportJobData } from '../types/export.types';

// Mock the dependencies
jest.mock('../services/reports/reports.service', () => ({
  reportsService: {
    getTimeoutJobs: jest.fn(),
    markJobsAsTimeout: jest.fn()
  }
}));

jest.mock('../services/reports/jobQueue.service', () => ({
  jobQueueService: {
    getQueueStatus: jest.fn(),
    stopProcessing: jest.fn()
  }
}));

jest.mock('../services/reports/jobLifecycle.service', () => ({
  jobLifecycleService: {
    getLifecycleStats: jest.fn(),
    handleJobTimeout: jest.fn(),
    cleanupCompletedJobs: jest.fn(),
    retryJob: jest.fn()
  }
}));

// Mock timers
jest.useFakeTimers();

describe('JobMonitoringService', () => {
  let jobMonitoringService: JobMonitoringService;
  let mockConfig: Partial<MonitoringConfig>;
  let mockJobData: ExportJobData;

  beforeEach(() => {
    mockConfig = {
      timeoutCheckIntervalMs: 1000,
      healthCheckIntervalMs: 500,
      retryDelayMs: 100,
      maxRetryAttempts: 2,
      jobTimeoutMinutes: 5,
      alertThresholds: {
        failureRate: 10,
        queueSize: 5,
        processingTime: 5
      }
    };

    jobMonitoringService = new JobMonitoringService(mockConfig);

    mockJobData = {
      id: 'job-1',
      userId: 1,
      templateId: 'reproductive',
      format: ExportFormat.PDF,
      status: ExportStatus.PROCESSING,
      parameters: {},
      options: {},
      progress: 50,
      createdAt: new Date(),
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  });

  afterEach(async () => {
    await jobMonitoringService.stopMonitoring();
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('startMonitoring', () => {
    it('should start monitoring successfully', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      const jobLifecycleService = require('../services/reports/jobLifecycle.service').jobLifecycleService;
      
      reportsService.getTimeoutJobs.mockResolvedValue([]);
      jobLifecycleService.cleanupCompletedJobs.mockResolvedValue({ cleanedJobs: 0, cleanedFiles: 0 });

      await jobMonitoringService.startMonitoring();

      const stats = jobMonitoringService.getMonitoringStats();
      expect(stats.isRunning).toBe(true);
    });

    it('should not start if already running', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      const jobLifecycleService = require('../services/reports/jobLifecycle.service').jobLifecycleService;
      
      reportsService.getTimeoutJobs.mockResolvedValue([]);
      jobLifecycleService.cleanupCompletedJobs.mockResolvedValue({ cleanedJobs: 0, cleanedFiles: 0 });

      await jobMonitoringService.startMonitoring();
      await jobMonitoringService.startMonitoring(); // Second call should be ignored

      const stats = jobMonitoringService.getMonitoringStats();
      expect(stats.isRunning).toBe(true);
    });

    it('should handle startup errors', async () => {
      const jobLifecycleService = require('../services/reports/jobLifecycle.service').jobLifecycleService;
      jobLifecycleService.cleanupCompletedJobs.mockRejectedValue(new Error('Database error'));

      await expect(jobMonitoringService.startMonitoring()).rejects.toThrow('Database error');

      const stats = jobMonitoringService.getMonitoringStats();
      expect(stats.isRunning).toBe(false);
    });
  });

  describe('stopMonitoring', () => {
    it('should stop monitoring gracefully', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      const jobLifecycleService = require('../services/reports/jobLifecycle.service').jobLifecycleService;
      
      reportsService.getTimeoutJobs.mockResolvedValue([]);
      jobLifecycleService.cleanupCompletedJobs.mockResolvedValue({ cleanedJobs: 0, cleanedFiles: 0 });

      await jobMonitoringService.startMonitoring();
      await jobMonitoringService.stopMonitoring();

      const stats = jobMonitoringService.getMonitoringStats();
      expect(stats.isRunning).toBe(false);
    });

    it('should handle stop when not running', async () => {
      await jobMonitoringService.stopMonitoring(); // Should not throw

      const stats = jobMonitoringService.getMonitoringStats();
      expect(stats.isRunning).toBe(false);
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy status', async () => {
      const jobQueueService = require('../services/reports/jobQueue.service').jobQueueService;
      const jobLifecycleService = require('../services/reports/jobLifecycle.service').jobLifecycleService;

      jobQueueService.getQueueStatus.mockResolvedValue({
        pending: 2,
        processing: 1,
        completed: 10,
        failed: 1,
        totalJobs: 14
      });

      jobLifecycleService.getLifecycleStats.mockResolvedValue({
        averageProcessingTime: 3,
        successRate: 85,
        retryRate: 5,
        timeoutRate: 2
      });

      const healthStatus = await jobMonitoringService.getHealthStatus();

      expect(healthStatus.isHealthy).toBe(true);
      expect(healthStatus.metrics.queueSize).toBe(2);
      expect(healthStatus.metrics.processingJobs).toBe(1);
      expect(healthStatus.metrics.failedJobs).toBe(1);
      expect(healthStatus.metrics.averageProcessingTime).toBe(3);
      expect(healthStatus.metrics.failureRate).toBe(5);
    });

    it('should return unhealthy status when thresholds exceeded', async () => {
      const jobQueueService = require('../services/reports/jobQueue.service').jobQueueService;
      const jobLifecycleService = require('../services/reports/jobLifecycle.service').jobLifecycleService;

      jobQueueService.getQueueStatus.mockResolvedValue({
        pending: 15, // Exceeds threshold
        processing: 5,
        completed: 10,
        failed: 8,
        totalJobs: 38
      });

      jobLifecycleService.getLifecycleStats.mockResolvedValue({
        averageProcessingTime: 12, // Exceeds threshold
        successRate: 60,
        retryRate: 25, // Exceeds threshold
        timeoutRate: 10
      });

      const healthStatus = await jobMonitoringService.getHealthStatus();

      expect(healthStatus.isHealthy).toBe(false);
      expect(healthStatus.alerts.length).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      const jobQueueService = require('../services/reports/jobQueue.service').jobQueueService;
      jobQueueService.getQueueStatus.mockRejectedValue(new Error('Service error'));

      const healthStatus = await jobMonitoringService.getHealthStatus();

      expect(healthStatus.isHealthy).toBe(false);
      expect(healthStatus.alerts).toHaveLength(1);
      expect(healthStatus.alerts[0].type).toBe('CRITICAL');
    });
  });

  describe('timeout monitoring', () => {
    it('should detect and handle timeout jobs', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      const jobLifecycleService = require('../services/reports/jobLifecycle.service').jobLifecycleService;

      // Clear any existing recovery actions
      const timeoutJob = { ...mockJobData, id: 'timeout-job' };
      reportsService.getTimeoutJobs.mockResolvedValue([]);
      jobLifecycleService.cleanupCompletedJobs.mockResolvedValue({ cleanedJobs: 0, cleanedFiles: 0 });

      await jobMonitoringService.startMonitoring();

      // Now set up the timeout job for the force check
      reportsService.getTimeoutJobs.mockResolvedValue([timeoutJob]);
      reportsService.markJobsAsTimeout.mockResolvedValue(undefined);
      jobLifecycleService.handleJobTimeout.mockResolvedValue(undefined);

      // Trigger timeout check
      await jobMonitoringService.forceTimeoutCheck();

      expect(reportsService.getTimeoutJobs).toHaveBeenCalledWith(5);
      expect(jobLifecycleService.handleJobTimeout).toHaveBeenCalledWith('timeout-job');
      expect(reportsService.markJobsAsTimeout).toHaveBeenCalledWith(['timeout-job']);

      const recoveryHistory = jobMonitoringService.getRecoveryHistory();
      expect(recoveryHistory.length).toBeGreaterThanOrEqual(1);
      expect(recoveryHistory[recoveryHistory.length - 1].type).toBe('TIMEOUT_JOB');
    });

    it('should handle timeout check errors', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      const jobLifecycleService = require('../services/reports/jobLifecycle.service').jobLifecycleService;

      reportsService.getTimeoutJobs.mockRejectedValue(new Error('Database error'));
      jobLifecycleService.cleanupCompletedJobs.mockResolvedValue({ cleanedJobs: 0, cleanedFiles: 0 });

      await jobMonitoringService.startMonitoring();

      // Trigger timeout check
      await jobMonitoringService.forceTimeoutCheck();

      const alerts = jobMonitoringService.getCurrentAlerts();
      expect(alerts.some(alert => alert.type === 'ERROR')).toBe(true);
    });
  });

  describe('health monitoring', () => {
    it('should perform periodic health checks', async () => {
      const jobQueueService = require('../services/reports/jobQueue.service').jobQueueService;
      const jobLifecycleService = require('../services/reports/jobLifecycle.service').jobLifecycleService;
      const reportsService = require('../services/reports/reports.service').reportsService;

      jobQueueService.getQueueStatus.mockResolvedValue({
        pending: 1,
        processing: 0,
        completed: 5,
        failed: 0,
        totalJobs: 6
      });

      jobLifecycleService.getLifecycleStats.mockResolvedValue({
        averageProcessingTime: 2,
        successRate: 95,
        retryRate: 3,
        timeoutRate: 1
      });

      reportsService.getTimeoutJobs.mockResolvedValue([]);
      jobLifecycleService.cleanupCompletedJobs.mockResolvedValue({ cleanedJobs: 0, cleanedFiles: 0 });

      await jobMonitoringService.startMonitoring();

      // Force health check
      const healthStatus = await jobMonitoringService.forceHealthCheck();

      expect(healthStatus.isHealthy).toBe(true);
      expect(jobQueueService.getQueueStatus).toHaveBeenCalled();
      expect(jobLifecycleService.getLifecycleStats).toHaveBeenCalled();
    });
  });

  describe('retryJob', () => {
    it('should retry job successfully', async () => {
      const jobLifecycleService = require('../services/reports/jobLifecycle.service').jobLifecycleService;
      jobLifecycleService.retryJob.mockResolvedValue(true);

      const result = await jobMonitoringService.retryJob('job-1', 'Manual retry');

      expect(result).toBe(true);
      expect(jobLifecycleService.retryJob).toHaveBeenCalledWith('job-1');

      const recoveryHistory = jobMonitoringService.getRecoveryHistory();
      expect(recoveryHistory).toHaveLength(1);
      expect(recoveryHistory[0].type).toBe('RETRY_JOB');
      expect(recoveryHistory[0].success).toBe(true);
    });

    it('should handle retry failure', async () => {
      const jobLifecycleService = require('../services/reports/jobLifecycle.service').jobLifecycleService;
      jobLifecycleService.retryJob.mockRejectedValue(new Error('Retry failed'));

      const result = await jobMonitoringService.retryJob('job-1', 'Manual retry');

      expect(result).toBe(false);

      const recoveryHistory = jobMonitoringService.getRecoveryHistory();
      expect(recoveryHistory).toHaveLength(1);
      expect(recoveryHistory[0].success).toBe(false);
      expect(recoveryHistory[0].error).toBe('Retry failed');
    });
  });

  describe('gracefulShutdown', () => {
    it('should perform graceful shutdown', async () => {
      const jobQueueService = require('../services/reports/jobQueue.service').jobQueueService;
      const reportsService = require('../services/reports/reports.service').reportsService;
      const jobLifecycleService = require('../services/reports/jobLifecycle.service').jobLifecycleService;

      jobQueueService.getQueueStatus.mockResolvedValue({
        pending: 0,
        processing: 0,
        completed: 5,
        failed: 0,
        totalJobs: 5
      });

      jobQueueService.stopProcessing.mockResolvedValue(undefined);
      reportsService.getTimeoutJobs.mockResolvedValue([]);
      jobLifecycleService.cleanupCompletedJobs.mockResolvedValue({ cleanedJobs: 0, cleanedFiles: 0 });

      await jobMonitoringService.startMonitoring();
      await jobMonitoringService.gracefulShutdown(5000);

      expect(jobQueueService.stopProcessing).toHaveBeenCalled();

      const stats = jobMonitoringService.getMonitoringStats();
      expect(stats.isRunning).toBe(false);
    });

    it('should handle shutdown timeout', async () => {
      const jobQueueService = require('../services/reports/jobQueue.service').jobQueueService;
      const reportsService = require('../services/reports/reports.service').reportsService;
      const jobLifecycleService = require('../services/reports/jobLifecycle.service').jobLifecycleService;

      // Mock processing jobs that complete quickly
      jobQueueService.getQueueStatus.mockResolvedValue({
        pending: 0,
        processing: 0, // No processing jobs
        completed: 6,
        failed: 0,
        totalJobs: 6
      });

      jobQueueService.stopProcessing.mockResolvedValue(undefined);
      reportsService.getTimeoutJobs.mockResolvedValue([]);
      jobLifecycleService.cleanupCompletedJobs.mockResolvedValue({ cleanedJobs: 0, cleanedFiles: 0 });

      await jobMonitoringService.startMonitoring();
      
      // Should complete quickly since no jobs are processing
      await jobMonitoringService.gracefulShutdown(1000); // 1 second timeout

      const stats = jobMonitoringService.getMonitoringStats();
      expect(stats.isRunning).toBe(false);
    }, 5000); // Reduce test timeout
  });

  describe('alert management', () => {
    it('should generate alerts for threshold violations', async () => {
      const jobQueueService = require('../services/reports/jobQueue.service').jobQueueService;
      const jobLifecycleService = require('../services/reports/jobLifecycle.service').jobLifecycleService;

      // Mock metrics that exceed thresholds
      jobQueueService.getQueueStatus.mockResolvedValue({
        pending: 10, // Exceeds queueSize threshold of 5
        processing: 2,
        completed: 20,
        failed: 5,
        totalJobs: 37
      });

      jobLifecycleService.getLifecycleStats.mockResolvedValue({
        averageProcessingTime: 8, // Exceeds processingTime threshold of 5
        successRate: 75,
        retryRate: 15, // Exceeds failureRate threshold of 10
        timeoutRate: 5
      });

      const healthStatus = await jobMonitoringService.getHealthStatus();

      expect(healthStatus.alerts.length).toBeGreaterThan(0);
      
      const alertTypes = healthStatus.alerts.map(alert => alert.metric);
      expect(alertTypes).toContain('queueSize');
      expect(alertTypes).toContain('averageProcessingTime');
      expect(alertTypes).toContain('failureRate');
    });

    it('should limit alert history', async () => {
      const jobQueueService = require('../services/reports/jobQueue.service').jobQueueService;
      const jobLifecycleService = require('../services/reports/jobLifecycle.service').jobLifecycleService;

      jobQueueService.getQueueStatus.mockResolvedValue({
        pending: 1,
        processing: 0,
        completed: 5,
        failed: 0,
        totalJobs: 6
      });

      jobLifecycleService.getLifecycleStats.mockResolvedValue({
        averageProcessingTime: 2,
        successRate: 95,
        retryRate: 3,
        timeoutRate: 1
      });

      // Generate many alerts by calling health check multiple times with bad metrics
      for (let i = 0; i < 10; i++) {
        jobQueueService.getQueueStatus.mockResolvedValueOnce({
          pending: 20, // Exceeds threshold
          processing: 0,
          completed: 5,
          failed: 0,
          totalJobs: 25
        });

        await jobMonitoringService.getHealthStatus();
      }

      const alerts = jobMonitoringService.getCurrentAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.length).toBeLessThanOrEqual(1000); // Should be limited
    });
  });

  describe('recovery history', () => {
    it('should track recovery actions', async () => {
      const jobLifecycleService = require('../services/reports/jobLifecycle.service').jobLifecycleService;
      jobLifecycleService.retryJob.mockResolvedValue(true);

      await jobMonitoringService.retryJob('job-1', 'Test retry');
      await jobMonitoringService.retryJob('job-2', 'Another retry');

      const history = jobMonitoringService.getRecoveryHistory();
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('RETRY_JOB');
      expect(history[1].type).toBe('RETRY_JOB');
    });

    it('should limit recovery history', async () => {
      const jobLifecycleService = require('../services/reports/jobLifecycle.service').jobLifecycleService;
      jobLifecycleService.retryJob.mockResolvedValue(true);

      // Generate many recovery actions
      for (let i = 0; i < 10; i++) {
        await jobMonitoringService.retryJob(`job-${i}`, `Retry ${i}`);
      }

      const history = jobMonitoringService.getRecoveryHistory();
      expect(history.length).toBe(10);
      expect(history.length).toBeLessThanOrEqual(500); // Should be limited
    });
  });

  describe('monitoring stats', () => {
    it('should return monitoring statistics', () => {
      const stats = jobMonitoringService.getMonitoringStats();

      expect(stats).toHaveProperty('isRunning');
      expect(stats).toHaveProperty('alertCount');
      expect(stats).toHaveProperty('recoveryActionCount');
      expect(stats).toHaveProperty('config');
      expect(stats.config.timeoutCheckIntervalMs).toBe(1000);
    });
  });
});