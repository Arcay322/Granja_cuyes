import { ExportStatus, ExportFormat } from '@prisma/client';
import { 
  ExportJobData, 
  CreateExportJobRequest, 
  ExportJobUpdate,
  JobWithFile 
} from '../../types/export.types';
import { reportsService } from './reports.service';
import { jobQueueService } from './jobQueue.service';
import logger from '../../utils/logger';

export interface JobCreationOptions {
  priority?: number;
  maxRetries?: number;
  timeoutMinutes?: number;
}

export interface JobValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface JobTransitionResult {
  success: boolean;
  previousStatus: ExportStatus;
  newStatus: ExportStatus;
  message?: string;
}

export class JobLifecycleService {
  private readonly defaultTimeoutMinutes = 10;
  private readonly maxJobsPerUser = 10;
  private readonly allowedTransitions: Record<ExportStatus, ExportStatus[]> = {
    [ExportStatus.PENDING]: [ExportStatus.PROCESSING, ExportStatus.FAILED],
    [ExportStatus.PROCESSING]: [ExportStatus.COMPLETED, ExportStatus.FAILED, ExportStatus.TIMEOUT],
    [ExportStatus.COMPLETED]: [], // Terminal state
    [ExportStatus.FAILED]: [ExportStatus.PENDING], // Can retry
    [ExportStatus.TIMEOUT]: [ExportStatus.PENDING] // Can retry
  };

  /**
   * Create and queue a new export job
   */
  async createJob(
    userId: number,
    request: CreateExportJobRequest,
    options: JobCreationOptions = {}
  ): Promise<ExportJobData> {
    try {
      logger.info(`Creating job for user ${userId}, template ${request.templateId}`);

      // Validate request
      const validation = await this.validateJobRequest(userId, request);
      if (!validation.isValid) {
        throw new Error(`Job validation failed: ${validation.errors.join(', ')}`);
      }

      // Check user job limits
      await this.enforceUserJobLimits(userId);

      // Create job in database
      const job = await reportsService.createExportJob(userId, request);

      // Add to processing queue
      await jobQueueService.addJob(job);

      logger.info(`Job created and queued: ${job.id}`);
      return job;
    } catch (error) {
      logger.error(`Failed to create job for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Transition job to new status with validation
   */
  async transitionJobStatus(
    jobId: string,
    newStatus: ExportStatus,
    update: Partial<ExportJobUpdate> = {}
  ): Promise<JobTransitionResult> {
    try {
      logger.info(`Transitioning job ${jobId} to status ${newStatus}`);

      // Get current job status
      const currentJob = await reportsService.getJobStatus(jobId);
      if (!currentJob) {
        throw new Error(`Job not found: ${jobId}`);
      }

      const previousStatus = currentJob.status;

      // Validate transition
      const isValidTransition = this.isValidStatusTransition(previousStatus, newStatus);
      if (!isValidTransition) {
        const message = `Invalid status transition from ${previousStatus} to ${newStatus}`;
        logger.warn(message);
        return {
          success: false,
          previousStatus,
          newStatus,
          message
        };
      }

      // Prepare update data
      const updateData: ExportJobUpdate = {
        status: newStatus,
        ...update
      };

      // Add timestamps based on status
      switch (newStatus) {
        case ExportStatus.PROCESSING:
          if (!updateData.startedAt) {
            updateData.startedAt = new Date();
          }
          break;
        case ExportStatus.COMPLETED:
        case ExportStatus.FAILED:
        case ExportStatus.TIMEOUT:
          if (!updateData.completedAt) {
            updateData.completedAt = new Date();
          }
          break;
      }

      // Update job in database
      await reportsService.updateJob(jobId, updateData);

      logger.info(`Job ${jobId} transitioned from ${previousStatus} to ${newStatus}`);
      return {
        success: true,
        previousStatus,
        newStatus
      };
    } catch (error) {
      logger.error(`Failed to transition job ${jobId} to ${newStatus}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string, reason?: string): Promise<boolean> {
    try {
      logger.info(`Cancelling job: ${jobId}`);

      const currentJob = await reportsService.getJobStatus(jobId);
      if (!currentJob) {
        logger.warn(`Job not found for cancellation: ${jobId}`);
        return false;
      }

      // Check if job can be cancelled
      if (currentJob.status === ExportStatus.COMPLETED) {
        logger.warn(`Cannot cancel completed job: ${jobId}`);
        return false;
      }

      // Try to cancel from queue first
      const cancelledFromQueue = await jobQueueService.cancelJob(jobId);

      // Update job status
      const errorMessage = reason || 'Job cancelled by user';
      await this.transitionJobStatus(jobId, ExportStatus.FAILED, {
        errorMessage,
        completedAt: new Date()
      });

      logger.info(`Job cancelled: ${jobId} (from queue: ${cancelledFromQueue})`);
      return true;
    } catch (error) {
      logger.error(`Failed to cancel job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    try {
      logger.info(`Retrying job: ${jobId}`);

      const currentJob = await reportsService.getJobStatus(jobId);
      if (!currentJob) {
        logger.warn(`Job not found for retry: ${jobId}`);
        return false;
      }

      // Check if job can be retried
      if (currentJob.status !== ExportStatus.FAILED && currentJob.status !== ExportStatus.TIMEOUT) {
        logger.warn(`Cannot retry job in status ${currentJob.status}: ${jobId}`);
        return false;
      }

      // Reset job status
      await this.transitionJobStatus(jobId, ExportStatus.PENDING, {
        progress: 0,
        errorMessage: null,
        startedAt: null,
        completedAt: null
      });

      // Add back to queue
      await jobQueueService.addJob(currentJob);

      logger.info(`Job queued for retry: ${jobId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to retry job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Update job progress
   */
  async updateJobProgress(jobId: string, progress: number, message?: string): Promise<void> {
    try {
      if (progress < 0 || progress > 100) {
        throw new Error(`Invalid progress value: ${progress}. Must be between 0 and 100`);
      }

      const updateData: Partial<ExportJobUpdate> = { progress };
      if (message) {
        updateData.errorMessage = message;
      }

      await reportsService.updateJob(jobId, updateData);
      logger.debug(`Job progress updated: ${jobId} - ${progress}%`);
    } catch (error) {
      logger.error(`Failed to update job progress ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Get detailed job information
   */
  async getJobDetails(jobId: string): Promise<JobWithFile | null> {
    try {
      return await reportsService.getJobStatus(jobId);
    } catch (error) {
      logger.error(`Failed to get job details ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's job history with filtering
   */
  async getUserJobHistory(
    userId: number,
    options: {
      status?: ExportStatus;
      format?: ExportFormat;
      templateId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<JobWithFile[]> {
    try {
      // For now, use the basic method from reportsService
      // TODO: Enhance with filtering when needed
      return await reportsService.getJobHistory(
        userId,
        options.limit || 50,
        options.offset || 0
      );
    } catch (error) {
      logger.error(`Failed to get job history for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up completed jobs and files
   */
  async cleanupCompletedJobs(olderThanHours: number = 24): Promise<{ cleanedJobs: number; cleanedFiles: number }> {
    try {
      logger.info(`Starting cleanup of jobs older than ${olderThanHours} hours`);

      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

      // Use existing cleanup method
      const result = await reportsService.cleanupExpiredFiles();

      logger.info(`Cleanup completed: ${result.cleanedCount} files cleaned`);
      return {
        cleanedJobs: 0, // Jobs are kept for history
        cleanedFiles: result.cleanedCount
      };
    } catch (error) {
      logger.error('Failed to cleanup completed jobs:', error);
      throw error;
    }
  }

  /**
   * Handle job timeout
   */
  async handleJobTimeout(jobId: string): Promise<void> {
    try {
      logger.info(`Handling timeout for job: ${jobId}`);

      await this.transitionJobStatus(jobId, ExportStatus.TIMEOUT, {
        errorMessage: 'Job timed out after exceeding maximum processing time',
        completedAt: new Date()
      });

      logger.info(`Job marked as timed out: ${jobId}`);
    } catch (error) {
      logger.error(`Failed to handle timeout for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Validate job request
   */
  private async validateJobRequest(
    userId: number,
    request: CreateExportJobRequest
  ): Promise<JobValidationResult> {
    const errors: string[] = [];

    // Validate required fields
    if (!request.templateId) {
      errors.push('Template ID is required');
    }

    if (!request.format) {
      errors.push('Export format is required');
    }

    // Validate format
    if (request.format && !Object.values(ExportFormat).includes(request.format)) {
      errors.push(`Invalid export format: ${request.format}`);
    }

    // Validate template ID
    const validTemplates = ['reproductive', 'health', 'inventory', 'financial'];
    if (request.templateId && !validTemplates.includes(request.templateId)) {
      errors.push(`Invalid template ID: ${request.templateId}`);
    }

    // Validate parameters
    if (request.parameters) {
      const paramErrors = this.validateJobParameters(request.parameters);
      errors.push(...paramErrors);
    }

    // Validate options
    if (request.options) {
      const optionErrors = this.validateJobOptions(request.format, request.options);
      errors.push(...optionErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate job parameters
   */
  private validateJobParameters(parameters: any): string[] {
    const errors: string[] = [];

    if (parameters.dateRange) {
      const { from, to } = parameters.dateRange;
      
      if (from && isNaN(Date.parse(from))) {
        errors.push('Invalid date format for dateRange.from');
      }
      
      if (to && isNaN(Date.parse(to))) {
        errors.push('Invalid date format for dateRange.to');
      }
      
      if (from && to && new Date(from) > new Date(to)) {
        errors.push('dateRange.from must be before dateRange.to');
      }
    }

    return errors;
  }

  /**
   * Validate job options based on format
   */
  private validateJobOptions(format: ExportFormat, options: unknown): string[] {
    const errors: string[] = [];

    switch (format) {
      case ExportFormat.PDF:
        const pdfOptions = options as any;
        if (pdfOptions.pageSize && !['A4', 'A3', 'Letter', 'Legal'].includes(pdfOptions.pageSize)) {
          errors.push(`Invalid PDF page size: ${pdfOptions.pageSize}`);
        }
        if (pdfOptions.orientation && !['portrait', 'landscape'].includes(pdfOptions.orientation)) {
          errors.push(`Invalid PDF orientation: ${pdfOptions.orientation}`);
        }
        break;

      case ExportFormat.EXCEL:
        const excelOptions = options as any;
        if (excelOptions.compression !== undefined && typeof excelOptions.compression !== 'boolean') {
          errors.push('Excel compression option must be boolean');
        }
        break;

      case ExportFormat.CSV:
        const csvOptions = options as any;
        if (csvOptions.encoding && !['utf8', 'latin1', 'ascii'].includes(csvOptions.encoding)) {
          errors.push(`Invalid CSV encoding: ${csvOptions.encoding}`);
        }
        if (csvOptions.separator && typeof csvOptions.separator !== 'string') {
          errors.push('CSV separator must be a string');
        }
        break;
    }

    return errors;
  }

  /**
   * Check if status transition is valid
   */
  private isValidStatusTransition(from: ExportStatus, to: ExportStatus): boolean {
    const allowedTransitions = this.allowedTransitions[from] || [];
    return allowedTransitions.includes(to);
  }

  /**
   * Enforce user job limits
   */
  private async enforceUserJobLimits(userId: number): Promise<void> {
    try {
      const activeJobs = await reportsService.getJobHistory(userId, this.maxJobsPerUser + 1, 0);
      const pendingOrProcessingJobs = activeJobs.filter(job => 
        job.status === ExportStatus.PENDING || job.status === ExportStatus.PROCESSING
      );

      if (pendingOrProcessingJobs.length >= this.maxJobsPerUser) {
        throw new Error(`User has reached maximum number of active jobs (${this.maxJobsPerUser})`);
      }
    } catch (error) {
      logger.error(`Failed to check job limits for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get job lifecycle statistics
   */
  async getLifecycleStats(): Promise<{
    averageProcessingTime: number;
    successRate: number;
    retryRate: number;
    timeoutRate: number;
  }> {
    try {
      const stats = await reportsService.getExportStats();
      
      const totalJobs = stats.totalJobs;
      const successRate = totalJobs > 0 ? (stats.completedJobs / totalJobs) * 100 : 0;
      const retryRate = totalJobs > 0 ? ((stats.failedJobs + stats.timeoutJobs) / totalJobs) * 100 : 0;
      const timeoutRate = totalJobs > 0 ? (stats.timeoutJobs / totalJobs) * 100 : 0;

      return {
        averageProcessingTime: 0, // TODO: Calculate from job timestamps
        successRate,
        retryRate,
        timeoutRate
      };
    } catch (error) {
      logger.error('Failed to get lifecycle stats:', error);
      throw error;
    }
  }
}

export const jobLifecycleService = new JobLifecycleService();