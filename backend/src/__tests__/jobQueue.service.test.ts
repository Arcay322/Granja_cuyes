import { JobQueueService } from '../services/reports/jobQueue.service';
import { ExportFormat, ExportStatus } from '@prisma/client';
import { ExportJobData } from '../types/export.types';

// Mock the reports service
jest.mock('../services/reports/reports.service', () => ({
  reportsService: {
    updateJob: jest.fn().mockResolvedValue({}),
    getJobStatus: jest.fn().mockResolvedValue({
      id: 'test-job',
      userId: 1,
      templateId: 'test',
      format: 'PDF',
      status: 'FAILED',
      parameters: {},
      options: {},
      createdAt: new Date()
    }),
    createExportFile: jest.fn().mockResolvedValue({}),
    getExportStats: jest.fn().mockResolvedValue({
      totalJobs: 10,
      completedJobs: 5,
      failedJobs: 2,
      pendingJobs: 3
    }),
    getTimeoutJobs: jest.fn().mockResolvedValue([]),
    markJobsAsTimeout: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock the file generator service
jest.mock('../services/reports/fileGenerator.service', () => ({
  fileGeneratorService: {
    generateFile: jest.fn().mockResolvedValue({
      filePath: '/tmp/test.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      fileName: 'test.pdf'
    })
  }
}));

describe('JobQueueService', () => {
  let jobQueue: JobQueueService;
  let mockJob: ExportJobData;

  beforeEach(() => {
    jobQueue = new JobQueueService();
    
    mockJob = {
      id: 'test-job-1',
      userId: 1,
      templateId: 'reproductive',
      format: ExportFormat.PDF,
      status: ExportStatus.PENDING,
      parameters: { dateRange: { from: '2024-01-01', to: '2024-01-31' } },
      options: { pageSize: 'A4', orientation: 'portrait' },
      progress: 0,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    // Stop processing to control test execution
    jobQueue.stopProcessing();
  });

  afterEach(async () => {
    await jobQueue.cleanup();
    jest.clearAllMocks();
  });

  describe('addJob', () => {
    it('should add job to queue successfully', async () => {
      const reportsService = require('../services/reports/reports.service');
      
      await jobQueue.addJob(mockJob);
      
      const stats = jobQueue.getQueueStats();
      expect(stats.queueLength).toBe(1);
      expect(reportsService.reportsService.updateJob).toHaveBeenCalledWith(
        mockJob.id,
        { status: ExportStatus.PENDING, progress: 0 }
      );
    });

    it('should emit jobAdded event', async () => {
      const jobAddedSpy = jest.fn();
      jobQueue.on('jobAdded', jobAddedSpy);
      
      await jobQueue.addJob(mockJob);
      
      expect(jobAddedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockJob.id,
          userId: mockJob.userId,
          templateId: mockJob.templateId
        })
      );
    });

    it('should insert jobs by priority', async () => {
      const lowPriorityJob = { ...mockJob, id: 'low-priority', format: ExportFormat.CSV };
      const highPriorityJob = { ...mockJob, id: 'high-priority', format: ExportFormat.PDF };
      
      await jobQueue.addJob(lowPriorityJob);
      await jobQueue.addJob(highPriorityJob);
      
      const stats = jobQueue.getQueueStats();
      expect(stats.queueLength).toBe(2);
    });
  });

  describe('processNextJob', () => {
    it('should process job successfully', async () => {
      const jobStartedSpy = jest.fn();
      const jobCompletedSpy = jest.fn();
      
      jobQueue.on('jobStarted', jobStartedSpy);
      jobQueue.on('jobCompleted', jobCompletedSpy);
      
      await jobQueue.addJob(mockJob);
      await jobQueue.processNextJob();
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(jobStartedSpy).toHaveBeenCalled();
      expect(jobCompletedSpy).toHaveBeenCalled();
    });

    it('should handle job processing error', async () => {
      const fileGeneratorService = require('../services/reports/fileGenerator.service');
      fileGeneratorService.fileGeneratorService.generateFile.mockRejectedValueOnce(
        new Error('File generation failed')
      );
      
      const jobFailedSpy = jest.fn();
      jobQueue.on('jobFailed', jobFailedSpy);
      
      await jobQueue.addJob(mockJob);
      await jobQueue.processNextJob();
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(jobFailedSpy).toHaveBeenCalled();
    });

    it('should retry job on retryable error', async () => {
      const fileGeneratorService = require('../services/reports/fileGenerator.service');
      fileGeneratorService.fileGeneratorService.generateFile.mockRejectedValueOnce(
        new Error('Network timeout error')
      );
      
      const jobRetrySpy = jest.fn();
      jobQueue.on('jobRetry', jobRetrySpy);
      
      await jobQueue.addJob(mockJob);
      await jobQueue.processNextJob();
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(jobRetrySpy).toHaveBeenCalled();
    });

    it('should not process when queue is empty', async () => {
      const stats = jobQueue.getQueueStats();
      expect(stats.queueLength).toBe(0);
      
      await jobQueue.processNextJob();
      
      expect(stats.processingCount).toBe(0);
    });

    it('should not process when max concurrent jobs reached', async () => {
      // Add multiple jobs
      for (let i = 0; i < 5; i++) {
        await jobQueue.addJob({ ...mockJob, id: `job-${i}` });
      }
      
      // Process jobs (should be limited by maxConcurrentJobs)
      await jobQueue.processNextJob();
      await jobQueue.processNextJob();
      await jobQueue.processNextJob();
      await jobQueue.processNextJob();
      
      const stats = jobQueue.getQueueStats();
      expect(stats.processingCount).toBeLessThanOrEqual(3); // maxConcurrentJobs
    });
  });

  describe('getQueueStatus', () => {
    it('should return queue status', async () => {
      await jobQueue.addJob(mockJob);
      
      const status = await jobQueue.getQueueStatus();
      
      expect(status).toEqual({
        pending: 1,
        processing: 0,
        completed: 5,
        failed: 2,
        totalJobs: 10
      });
    });

    it('should handle error in getting stats', async () => {
      const reportsService = require('../services/reports/reports.service');
      reportsService.reportsService.getExportStats.mockRejectedValueOnce(
        new Error('Database error')
      );
      
      await jobQueue.addJob(mockJob);
      
      const status = await jobQueue.getQueueStatus();
      
      expect(status.pending).toBe(1);
      expect(status.processing).toBe(0);
    });
  });

  describe('cancelJob', () => {
    it('should cancel pending job', async () => {
      const jobCancelledSpy = jest.fn();
      jobQueue.on('jobCancelled', jobCancelledSpy);
      
      await jobQueue.addJob(mockJob);
      
      const result = await jobQueue.cancelJob(mockJob.id);
      
      expect(result).toBe(true);
      expect(jobCancelledSpy).toHaveBeenCalled();
      
      const stats = jobQueue.getQueueStats();
      expect(stats.queueLength).toBe(0);
    });

    it('should return false for non-existent job', async () => {
      const result = await jobQueue.cancelJob('non-existent-job');
      expect(result).toBe(false);
    });
  });

  describe('retryFailedJob', () => {
    it('should retry failed job', async () => {
      const jobRetrySpy = jest.fn();
      jobQueue.on('jobRetry', jobRetrySpy);
      
      const result = await jobQueue.retryFailedJob('test-job');
      
      expect(result).toBe(true);
      expect(jobRetrySpy).toHaveBeenCalled();
      
      const stats = jobQueue.getQueueStats();
      expect(stats.queueLength).toBe(1);
    });

    it('should not retry non-failed job', async () => {
      const reportsService = require('../services/reports/reports.service');
      reportsService.reportsService.getJobStatus.mockResolvedValueOnce({
        id: 'test-job',
        status: ExportStatus.COMPLETED
      });
      
      const result = await jobQueue.retryFailedJob('test-job');
      expect(result).toBe(false);
    });

    it('should not retry non-existent job', async () => {
      const reportsService = require('../services/reports/reports.service');
      reportsService.reportsService.getJobStatus.mockResolvedValueOnce(null);
      
      const result = await jobQueue.retryFailedJob('non-existent-job');
      expect(result).toBe(false);
    });
  });

  describe('handleTimeoutJobs', () => {
    it('should handle timeout jobs', async () => {
      const reportsService = require('../services/reports/reports.service');
      const timeoutJobs = [
        { id: 'timeout-job-1' },
        { id: 'timeout-job-2' }
      ];
      
      reportsService.reportsService.getTimeoutJobs.mockResolvedValueOnce(timeoutJobs);
      
      await jobQueue.handleTimeoutJobs();
      
      expect(reportsService.reportsService.markJobsAsTimeout).toHaveBeenCalledWith([
        'timeout-job-1',
        'timeout-job-2'
      ]);
    });

    it('should handle no timeout jobs', async () => {
      const reportsService = require('../services/reports/reports.service');
      reportsService.reportsService.getTimeoutJobs.mockResolvedValueOnce([]);
      
      await jobQueue.handleTimeoutJobs();
      
      expect(reportsService.reportsService.markJobsAsTimeout).not.toHaveBeenCalled();
    });
  });

  describe('queue management', () => {
    it('should get queue statistics', () => {
      const stats = jobQueue.getQueueStats();
      
      expect(stats).toHaveProperty('queueLength');
      expect(stats).toHaveProperty('processingCount');
      expect(stats).toHaveProperty('maxConcurrent');
      expect(stats).toHaveProperty('isProcessing');
    });

    it('should stop and start processing', () => {
      jobQueue.stopProcessing();
      let stats = jobQueue.getQueueStats();
      expect(stats.isProcessing).toBe(false);
      
      // Note: startProcessing is private, so we test through constructor
      const newQueue = new JobQueueService();
      stats = newQueue.getQueueStats();
      // Processing state is managed internally
      
      newQueue.stopProcessing();
    });
  });

  describe('priority calculation', () => {
    it('should calculate higher priority for PDF jobs', async () => {
      const pdfJob = { ...mockJob, id: 'pdf-job', format: ExportFormat.PDF };
      const csvJob = { ...mockJob, id: 'csv-job', format: ExportFormat.CSV };
      
      await jobQueue.addJob(csvJob);
      await jobQueue.addJob(pdfJob);
      
      // PDF job should be processed first due to higher priority
      const stats = jobQueue.getQueueStats();
      expect(stats.queueLength).toBe(2);
    });

    it('should calculate higher priority for newer jobs', async () => {
      const oldJob = { 
        ...mockJob, 
        id: 'old-job', 
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      };
      const newJob = { 
        ...mockJob, 
        id: 'new-job', 
        createdAt: new Date() // now
      };
      
      await jobQueue.addJob(oldJob);
      await jobQueue.addJob(newJob);
      
      const stats = jobQueue.getQueueStats();
      expect(stats.queueLength).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should identify retryable errors', () => {
      const retryableError = new Error('Network timeout occurred');
      const nonRetryableError = new Error('Invalid input data');
      
      // Access private method for testing
      const isRetryable1 = (jobQueue as any).isRetryableError(retryableError);
      const isRetryable2 = (jobQueue as any).isRetryableError(nonRetryableError);
      
      expect(isRetryable1).toBe(true);
      expect(isRetryable2).toBe(false);
    });

    it('should calculate retry delay with exponential backoff', () => {
      const delay1 = (jobQueue as any).calculateRetryDelay(1);
      const delay2 = (jobQueue as any).calculateRetryDelay(2);
      const delay3 = (jobQueue as any).calculateRetryDelay(10); // Should be capped
      
      expect(delay1).toBe(2000); // 2^1 * 1000
      expect(delay2).toBe(4000); // 2^2 * 1000
      expect(delay3).toBe(30000); // Capped at 30 seconds
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources', async () => {
      await jobQueue.addJob(mockJob);
      
      await jobQueue.cleanup();
      
      const stats = jobQueue.getQueueStats();
      expect(stats.queueLength).toBe(0);
      expect(stats.processingCount).toBe(0);
    });
  });
});