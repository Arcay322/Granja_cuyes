import { JobLifecycleService } from '../services/reports/jobLifecycle.service';
import { ExportStatus, ExportFormat } from '@prisma/client';
import { CreateExportJobRequest, ExportJobData, JobWithFile } from '../types/export.types';

// Mock the dependencies
jest.mock('../services/reports/reports.service', () => ({
  reportsService: {
    createExportJob: jest.fn(),
    getJobStatus: jest.fn(),
    updateJob: jest.fn(),
    getJobHistory: jest.fn(),
    cleanupExpiredFiles: jest.fn(),
    getExportStats: jest.fn()
  }
}));

jest.mock('../services/reports/jobQueue.service', () => ({
  jobQueueService: {
    addJob: jest.fn(),
    cancelJob: jest.fn()
  }
}));

describe('JobLifecycleService', () => {
  let jobLifecycleService: JobLifecycleService;
  let mockJobData: ExportJobData;
  let mockJobRequest: CreateExportJobRequest;

  beforeEach(() => {
    jobLifecycleService = new JobLifecycleService();
    
    mockJobData = {
      id: 'job-1',
      userId: 1,
      templateId: 'reproductive',
      format: ExportFormat.PDF,
      status: ExportStatus.PENDING,
      parameters: { dateRange: { from: '2024-01-01', to: '2024-01-31' } },
      options: { 
        pageSize: 'A4', 
        orientation: 'portrait',
        includeCharts: true,
        includeImages: true,
        compression: false
      },
      progress: 0,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    mockJobRequest = {
      templateId: 'reproductive',
      format: ExportFormat.PDF,
      parameters: { dateRange: { from: '2024-01-01', to: '2024-01-31' } },
      options: { 
        pageSize: 'A4', 
        orientation: 'portrait',
        includeCharts: true,
        includeImages: true,
        compression: false
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createJob', () => {
    it('should create and queue job successfully', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      const jobQueueService = require('../services/reports/jobQueue.service').jobQueueService;
      
      reportsService.createExportJob.mockResolvedValue(mockJobData);
      reportsService.getJobHistory.mockResolvedValue([]); // No active jobs
      jobQueueService.addJob.mockResolvedValue(undefined);

      const result = await jobLifecycleService.createJob(1, mockJobRequest);

      expect(result).toEqual(mockJobData);
      expect(reportsService.createExportJob).toHaveBeenCalledWith(1, mockJobRequest);
      expect(jobQueueService.addJob).toHaveBeenCalledWith(mockJobData);
    });

    it('should validate job request and reject invalid data', async () => {
      const invalidRequest = {
        templateId: '',
        format: 'INVALID' as ExportFormat,
        parameters: { dateRange: { from: 'invalid-date', to: '2024-01-31' } }
      };

      await expect(jobLifecycleService.createJob(1, invalidRequest))
        .rejects.toThrow('Job validation failed');
    });

    it('should enforce user job limits', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      
      // Mock 10 active jobs (at limit)
      const activeJobs = Array.from({ length: 10 }, (_, i) => ({
        ...mockJobData,
        id: `job-${i}`,
        status: ExportStatus.PENDING,
        files: []
      }));
      
      reportsService.getJobHistory.mockResolvedValue(activeJobs);

      await expect(jobLifecycleService.createJob(1, mockJobRequest))
        .rejects.toThrow('User has reached maximum number of active jobs');
    });

    it('should create job with custom priority', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      const jobQueueService = require('../services/reports/jobQueue.service').jobQueueService;
      
      reportsService.createExportJob.mockResolvedValue(mockJobData);
      reportsService.getJobHistory.mockResolvedValue([]);
      jobQueueService.addJob.mockResolvedValue(undefined);

      await jobLifecycleService.createJob(1, mockJobRequest, { priority: 5 });

      expect(jobQueueService.addJob).toHaveBeenCalledWith(mockJobData);
    });
  });

  describe('transitionJobStatus', () => {
    it('should transition job status successfully', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      
      const currentJob: JobWithFile = {
        ...mockJobData,
        status: ExportStatus.PENDING,
        files: []
      };
      
      reportsService.getJobStatus.mockResolvedValue(currentJob);
      reportsService.updateJob.mockResolvedValue({ ...mockJobData, status: ExportStatus.PROCESSING });

      const result = await jobLifecycleService.transitionJobStatus('job-1', ExportStatus.PROCESSING);

      expect(result.success).toBe(true);
      expect(result.previousStatus).toBe(ExportStatus.PENDING);
      expect(result.newStatus).toBe(ExportStatus.PROCESSING);
      expect(reportsService.updateJob).toHaveBeenCalledWith('job-1', {
        status: ExportStatus.PROCESSING,
        startedAt: expect.any(Date)
      });
    });

    it('should reject invalid status transitions', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      
      const currentJob: JobWithFile = {
        ...mockJobData,
        status: ExportStatus.COMPLETED,
        files: []
      };
      
      reportsService.getJobStatus.mockResolvedValue(currentJob);

      const result = await jobLifecycleService.transitionJobStatus('job-1', ExportStatus.PENDING);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid status transition');
    });

    it('should handle non-existent job', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.getJobStatus.mockResolvedValue(null);

      await expect(jobLifecycleService.transitionJobStatus('non-existent', ExportStatus.PROCESSING))
        .rejects.toThrow('Job not found');
    });

    it('should add completion timestamp for terminal states', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      
      const currentJob: JobWithFile = {
        ...mockJobData,
        status: ExportStatus.PROCESSING,
        files: []
      };
      
      reportsService.getJobStatus.mockResolvedValue(currentJob);
      reportsService.updateJob.mockResolvedValue({ ...mockJobData, status: ExportStatus.COMPLETED });

      await jobLifecycleService.transitionJobStatus('job-1', ExportStatus.COMPLETED);

      expect(reportsService.updateJob).toHaveBeenCalledWith('job-1', {
        status: ExportStatus.COMPLETED,
        completedAt: expect.any(Date)
      });
    });
  });

  describe('cancelJob', () => {
    it('should cancel job successfully', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      const jobQueueService = require('../services/reports/jobQueue.service').jobQueueService;
      
      const currentJob: JobWithFile = {
        ...mockJobData,
        status: ExportStatus.PENDING,
        files: []
      };
      
      reportsService.getJobStatus.mockResolvedValue(currentJob);
      jobQueueService.cancelJob.mockResolvedValue(true);
      reportsService.updateJob.mockResolvedValue({ ...mockJobData, status: ExportStatus.FAILED });

      const result = await jobLifecycleService.cancelJob('job-1', 'User requested cancellation');

      expect(result).toBe(true);
      expect(jobQueueService.cancelJob).toHaveBeenCalledWith('job-1');
      expect(reportsService.updateJob).toHaveBeenCalledWith('job-1', {
        status: ExportStatus.FAILED,
        errorMessage: 'User requested cancellation',
        completedAt: expect.any(Date)
      });
    });

    it('should not cancel completed job', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      
      const currentJob: JobWithFile = {
        ...mockJobData,
        status: ExportStatus.COMPLETED,
        files: []
      };
      
      reportsService.getJobStatus.mockResolvedValue(currentJob);

      const result = await jobLifecycleService.cancelJob('job-1');

      expect(result).toBe(false);
    });

    it('should handle non-existent job', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.getJobStatus.mockResolvedValue(null);

      const result = await jobLifecycleService.cancelJob('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('retryJob', () => {
    it('should retry failed job successfully', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      const jobQueueService = require('../services/reports/jobQueue.service').jobQueueService;
      
      const failedJob: JobWithFile = {
        ...mockJobData,
        status: ExportStatus.FAILED,
        files: []
      };
      
      reportsService.getJobStatus.mockResolvedValue(failedJob);
      reportsService.updateJob.mockResolvedValue({ ...mockJobData, status: ExportStatus.PENDING });
      jobQueueService.addJob.mockResolvedValue(undefined);

      const result = await jobLifecycleService.retryJob('job-1');

      expect(result).toBe(true);
      expect(reportsService.updateJob).toHaveBeenCalledWith('job-1', {
        status: ExportStatus.PENDING,
        progress: 0,
        errorMessage: null,
        startedAt: null,
        completedAt: null
      });
      expect(jobQueueService.addJob).toHaveBeenCalledWith(failedJob);
    });

    it('should retry timed out job successfully', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      const jobQueueService = require('../services/reports/jobQueue.service').jobQueueService;
      
      const timeoutJob: JobWithFile = {
        ...mockJobData,
        status: ExportStatus.TIMEOUT,
        files: []
      };
      
      reportsService.getJobStatus.mockResolvedValue(timeoutJob);
      reportsService.updateJob.mockResolvedValue({ ...mockJobData, status: ExportStatus.PENDING });
      jobQueueService.addJob.mockResolvedValue(undefined);

      const result = await jobLifecycleService.retryJob('job-1');

      expect(result).toBe(true);
    });

    it('should not retry completed job', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      
      const completedJob: JobWithFile = {
        ...mockJobData,
        status: ExportStatus.COMPLETED,
        files: []
      };
      
      reportsService.getJobStatus.mockResolvedValue(completedJob);

      const result = await jobLifecycleService.retryJob('job-1');

      expect(result).toBe(false);
    });

    it('should handle non-existent job', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.getJobStatus.mockResolvedValue(null);

      const result = await jobLifecycleService.retryJob('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('updateJobProgress', () => {
    it('should update job progress successfully', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.updateJob.mockResolvedValue(mockJobData);

      await jobLifecycleService.updateJobProgress('job-1', 50, 'Processing data');

      expect(reportsService.updateJob).toHaveBeenCalledWith('job-1', {
        progress: 50,
        errorMessage: 'Processing data'
      });
    });

    it('should validate progress range', async () => {
      await expect(jobLifecycleService.updateJobProgress('job-1', -10))
        .rejects.toThrow('Invalid progress value: -10');

      await expect(jobLifecycleService.updateJobProgress('job-1', 150))
        .rejects.toThrow('Invalid progress value: 150');
    });

    it('should update progress without message', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.updateJob.mockResolvedValue(mockJobData);

      await jobLifecycleService.updateJobProgress('job-1', 75);

      expect(reportsService.updateJob).toHaveBeenCalledWith('job-1', {
        progress: 75
      });
    });
  });

  describe('getJobDetails', () => {
    it('should return job details', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      const jobWithFile: JobWithFile = {
        ...mockJobData,
        files: []
      };
      
      reportsService.getJobStatus.mockResolvedValue(jobWithFile);

      const result = await jobLifecycleService.getJobDetails('job-1');

      expect(result).toEqual(jobWithFile);
      expect(reportsService.getJobStatus).toHaveBeenCalledWith('job-1');
    });

    it('should return null for non-existent job', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.getJobStatus.mockResolvedValue(null);

      const result = await jobLifecycleService.getJobDetails('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getUserJobHistory', () => {
    it('should return user job history', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      const jobHistory = [
        { ...mockJobData, files: [] }
      ];
      
      reportsService.getJobHistory.mockResolvedValue(jobHistory);

      const result = await jobLifecycleService.getUserJobHistory(1);

      expect(result).toEqual(jobHistory);
      expect(reportsService.getJobHistory).toHaveBeenCalledWith(1, 50, 0);
    });

    it('should use custom limit and offset', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.getJobHistory.mockResolvedValue([]);

      await jobLifecycleService.getUserJobHistory(1, { limit: 10, offset: 20 });

      expect(reportsService.getJobHistory).toHaveBeenCalledWith(1, 10, 20);
    });
  });

  describe('cleanupCompletedJobs', () => {
    it('should cleanup completed jobs and files', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.cleanupExpiredFiles.mockResolvedValue({ cleanedCount: 5 });

      const result = await jobLifecycleService.cleanupCompletedJobs(48);

      expect(result).toEqual({
        cleanedJobs: 0,
        cleanedFiles: 5
      });
      expect(reportsService.cleanupExpiredFiles).toHaveBeenCalled();
    });
  });

  describe('handleJobTimeout', () => {
    it('should handle job timeout', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      
      const currentJob: JobWithFile = {
        ...mockJobData,
        status: ExportStatus.PROCESSING,
        files: []
      };
      
      reportsService.getJobStatus.mockResolvedValue(currentJob);
      reportsService.updateJob.mockResolvedValue({ ...mockJobData, status: ExportStatus.TIMEOUT });

      await jobLifecycleService.handleJobTimeout('job-1');

      expect(reportsService.updateJob).toHaveBeenCalledWith('job-1', {
        status: ExportStatus.TIMEOUT,
        errorMessage: 'Job timed out after exceeding maximum processing time',
        completedAt: expect.any(Date)
      });
    });
  });

  describe('getLifecycleStats', () => {
    it('should return lifecycle statistics', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      
      reportsService.getExportStats.mockResolvedValue({
        totalJobs: 100,
        completedJobs: 80,
        failedJobs: 15,
        timeoutJobs: 5,
        pendingJobs: 0,
        processingJobs: 0
      });

      const result = await jobLifecycleService.getLifecycleStats();

      expect(result).toEqual({
        averageProcessingTime: 0,
        successRate: 80,
        retryRate: 20,
        timeoutRate: 5
      });
    });

    it('should handle zero total jobs', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      
      reportsService.getExportStats.mockResolvedValue({
        totalJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        timeoutJobs: 0,
        pendingJobs: 0,
        processingJobs: 0
      });

      const result = await jobLifecycleService.getLifecycleStats();

      expect(result).toEqual({
        averageProcessingTime: 0,
        successRate: 0,
        retryRate: 0,
        timeoutRate: 0
      });
    });
  });

  describe('validation methods', () => {
    it('should validate valid job request', async () => {
      const result = await (jobLifecycleService as any).validateJobRequest(1, mockJobRequest);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid template ID', async () => {
      const invalidRequest = { ...mockJobRequest, templateId: 'invalid-template' };
      const result = await (jobLifecycleService as any).validateJobRequest(1, invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid template ID: invalid-template');
    });

    it('should reject invalid export format', async () => {
      const invalidRequest = { ...mockJobRequest, format: 'INVALID' as ExportFormat };
      const result = await (jobLifecycleService as any).validateJobRequest(1, invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid export format: INVALID');
    });

    it('should validate date range parameters', async () => {
      const invalidRequest = {
        ...mockJobRequest,
        parameters: { dateRange: { from: 'invalid-date', to: '2024-01-31' } }
      };
      const result = await (jobLifecycleService as any).validateJobRequest(1, invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid date format for dateRange.from');
    });

    it('should validate PDF options', async () => {
      const invalidRequest = {
        ...mockJobRequest,
        options: { pageSize: 'INVALID', orientation: 'invalid' }
      };
      const result = await (jobLifecycleService as any).validateJobRequest(1, invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid PDF page size: INVALID');
      expect(result.errors).toContain('Invalid PDF orientation: invalid');
    });
  });
});