import { EventEmitter } from 'events';
import { ExportStatus, ExportFormat } from '@prisma/client';
import { ExportJobData, ExportJobUpdate } from '../../types/export.types';
import { reportsService } from './reports.service';
import { fileGeneratorService } from './fileGenerator.service';
import { reportDataService } from './reportData.service';
import logger from '../../utils/logger';

export interface QueuedJob {
  id: string;
  userId: number;
  templateId: string;
  format: ExportFormat;
  parameters: any;
  options: any;
  priority: number;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
}

export interface QueueStatus {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalJobs: number;
}

export class JobQueueService extends EventEmitter {
  private queue: QueuedJob[] = [];
  private processingJobs: Map<string, QueuedJob> = new Map();
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly maxConcurrentJobs: number = 3;
  private readonly defaultMaxAttempts: number = 3;
  private readonly processingIntervalMs: number = 5000; // 5 seconds
  private readonly jobTimeoutMs: number = 10 * 60 * 1000; // 10 minutes

  constructor() {
    super();
    this.startProcessing();
  }

  /**
   * Add job to queue
   */
  async addJob(job: ExportJobData): Promise<void> {
    try {
      logger.info(`Adding job to queue: ${job.id}`);

      const queuedJob: QueuedJob = {
        id: job.id,
        userId: job.userId,
        templateId: job.templateId,
        format: job.format,
        parameters: job.parameters || {},
        options: job.options || {},
        priority: this.calculatePriority(job),
        createdAt: job.createdAt,
        attempts: 0,
        maxAttempts: this.defaultMaxAttempts
      };

      // Insert job in priority order
      this.insertJobByPriority(queuedJob);

      // Update job status to pending
      await reportsService.updateJob(job.id, {
        status: ExportStatus.PENDING,
        progress: 0
      });

      this.emit('jobAdded', queuedJob);
      logger.info(`Job added to queue: ${job.id} (queue size: ${this.queue.length})`);

      // Trigger immediate processing if not already processing
      if (!this.isProcessing) {
        this.processQueue();
      }
    } catch (error) {
      logger.error(`Error adding job to queue: ${job.id}`, error);
      throw error;
    }
  }

  /**
   * Process next job in queue
   */
  async processNextJob(): Promise<void> {
    if (this.processingJobs.size >= this.maxConcurrentJobs || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) {
      return;
    }

    try {
      logger.info(`Starting job processing: ${job.id}`);
      
      // Move job to processing
      this.processingJobs.set(job.id, job);
      job.attempts++;

      // Update job status
      await reportsService.updateJob(job.id, {
        status: ExportStatus.PROCESSING,
        progress: 0,
        startedAt: new Date()
      });

      this.emit('jobStarted', job);

      // Process the job
      await this.executeJob(job);

    } catch (error) {
      logger.error(`Error processing job: ${job.id}`, error);
      await this.handleJobError(job, error as Error);
    }
  }

  /**
   * Execute job
   */
  private async executeJob(job: QueuedJob): Promise<void> {
    try {
      // Set timeout for job execution
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Job execution timeout')), this.jobTimeoutMs);
      });

      // Execute job with timeout
      const executionPromise = this.performJobExecution(job);
      
      await Promise.race([executionPromise, timeoutPromise]);

      // Job completed successfully
      await this.handleJobSuccess(job);

    } catch (error) {
      throw error;
    }
  }

  /**
   * Perform actual job execution
   */
  private async performJobExecution(job: QueuedJob): Promise<void> {
    try {
      // Update progress
      await reportsService.updateJob(job.id, { progress: 10 });

      // Get report data
      const reportData = await this.generateReportData(job);
      
      // Update progress
      await reportsService.updateJob(job.id, { progress: 30 });

      // Generate file
      const fileResult = await fileGeneratorService.generateFile(reportData, {
        format: job.format,
        options: job.options,
        outputDirectory: 'uploads/reports',
        fileName: `${job.templateId}_${job.id}`
      });

      // Update progress
      await reportsService.updateJob(job.id, { progress: 80 });

      // Create file record
      await reportsService.createExportFile(
        job.id,
        fileResult.fileName,
        fileResult.filePath,
        BigInt(fileResult.fileSize),
        fileResult.mimeType
      );

      // Update progress
      await reportsService.updateJob(job.id, { progress: 100 });

      logger.info(`Job execution completed: ${job.id}`);

    } catch (error) {
      logger.error(`Job execution failed: ${job.id}`, error);
      throw error;
    }
  }

  /**
   * Generate report data for job using ReportDataService
   */
  private async generateReportData(job: QueuedJob): Promise<any> {
    try {
      logger.info(`Generating report data for job ${job.id}, template: ${job.templateId}`);

      // Use the ReportDataService to get real data based on template type
      switch (job.templateId) {
        case 'financial':
          return await reportDataService.getFinancialReportData(job.parameters);
        
        case 'inventory':
          return await reportDataService.getInventoryReportData(job.parameters);
        
        case 'reproductive':
          return await reportDataService.getReproductiveReportData(job.parameters);
        
        case 'health':
          return await reportDataService.getHealthReportData(job.parameters);
        
        default:
          logger.warn(`Unknown template ID: ${job.templateId}, using fallback data`);
          // Fallback for unknown templates
          return {
            templateId: job.templateId,
            generatedAt: new Date().toISOString(),
            parameters: job.parameters,
            data: {
              summary: {},
              details: [],
              charts: []
            }
          };
      }
    } catch (error) {
      logger.error(`Error generating report data for job ${job.id}:`, error);
      throw new Error(`Failed to generate report data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle job success
   */
  private async handleJobSuccess(job: QueuedJob): Promise<void> {
    try {
      // Remove from processing
      this.processingJobs.delete(job.id);

      // Update job status
      await reportsService.updateJob(job.id, {
        status: ExportStatus.COMPLETED,
        progress: 100,
        completedAt: new Date()
      });

      this.emit('jobCompleted', job);
      logger.info(`Job completed successfully: ${job.id}`);

    } catch (error) {
      logger.error(`Error handling job success: ${job.id}`, error);
    }
  }

  /**
   * Handle job error
   */
  private async handleJobError(job: QueuedJob, error: Error): Promise<void> {
    try {
      // Remove from processing
      this.processingJobs.delete(job.id);

      const shouldRetry = job.attempts < job.maxAttempts && this.isRetryableError(error);

      if (shouldRetry) {
        // Add back to queue with delay
        logger.info(`Retrying job: ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);
        
        setTimeout(() => {
          this.insertJobByPriority(job);
        }, this.calculateRetryDelay(job.attempts));

        // Update job status
        await reportsService.updateJob(job.id, {
          status: ExportStatus.PENDING,
          progress: 0,
          errorMessage: `Retry ${job.attempts}/${job.maxAttempts}: ${error.message}`
        });

        this.emit('jobRetry', job, error);

      } else {
        // Job failed permanently
        await reportsService.updateJob(job.id, {
          status: ExportStatus.FAILED,
          errorMessage: error.message,
          completedAt: new Date()
        });

        this.emit('jobFailed', job, error);
        logger.error(`Job failed permanently: ${job.id} - ${error.message}`);
      }

    } catch (updateError) {
      logger.error(`Error handling job error: ${job.id}`, updateError);
    }
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<QueueStatus> {
    try {
      const stats = await reportsService.getExportStats();
      
      return {
        pending: this.queue.length,
        processing: this.processingJobs.size,
        completed: stats.completedJobs,
        failed: stats.failedJobs,
        totalJobs: stats.totalJobs
      };
    } catch (error) {
      logger.error('Error getting queue status:', error);
      return {
        pending: this.queue.length,
        processing: this.processingJobs.size,
        completed: 0,
        failed: 0,
        totalJobs: this.queue.length + this.processingJobs.size
      };
    }
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      logger.info(`Cancelling job: ${jobId}`);

      // Remove from queue if pending
      const queueIndex = this.queue.findIndex(job => job.id === jobId);
      if (queueIndex !== -1) {
        const job = this.queue.splice(queueIndex, 1)[0];
        
        await reportsService.updateJob(jobId, {
          status: ExportStatus.FAILED,
          errorMessage: 'Job cancelled by user',
          completedAt: new Date()
        });

        this.emit('jobCancelled', job);
        logger.info(`Job cancelled from queue: ${jobId}`);
        return true;
      }

      // Check if currently processing
      if (this.processingJobs.has(jobId)) {
        // Mark for cancellation (actual cancellation depends on implementation)
        const job = this.processingJobs.get(jobId)!;
        
        await reportsService.updateJob(jobId, {
          status: ExportStatus.FAILED,
          errorMessage: 'Job cancelled by user',
          completedAt: new Date()
        });

        this.emit('jobCancelled', job);
        logger.info(`Processing job marked for cancellation: ${jobId}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Error cancelling job: ${jobId}`, error);
      return false;
    }
  }

  /**
   * Retry failed job
   */
  async retryFailedJob(jobId: string): Promise<boolean> {
    try {
      logger.info(`Retrying failed job: ${jobId}`);

      const jobStatus = await reportsService.getJobStatus(jobId);
      if (!jobStatus || jobStatus.status !== ExportStatus.FAILED) {
        return false;
      }

      const queuedJob: QueuedJob = {
        id: jobStatus.id,
        userId: jobStatus.userId,
        templateId: jobStatus.templateId,
        format: jobStatus.format,
        parameters: jobStatus.parameters || {},
        options: jobStatus.options || {},
        priority: this.calculatePriority(jobStatus),
        createdAt: jobStatus.createdAt,
        attempts: 0, // Reset attempts
        maxAttempts: this.defaultMaxAttempts
      };

      this.insertJobByPriority(queuedJob);

      await reportsService.updateJob(jobId, {
        status: ExportStatus.PENDING,
        progress: 0,
        errorMessage: null
      });

      this.emit('jobRetry', queuedJob);
      logger.info(`Failed job added back to queue: ${jobId}`);
      return true;

    } catch (error) {
      logger.error(`Error retrying failed job: ${jobId}`, error);
      return false;
    }
  }

  /**
   * Start queue processing
   */
  private startProcessing(): void {
    if (this.processingInterval) {
      return;
    }

    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.processingIntervalMs);

    logger.info('Job queue processing started');
  }

  /**
   * Stop queue processing
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.isProcessing = false;
    logger.info('Job queue processing stopped');
  }

  /**
   * Process queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.processingJobs.size < this.maxConcurrentJobs && this.queue.length > 0) {
        await this.processNextJob();
      }
    } catch (error) {
      logger.error('Error in queue processing:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Insert job by priority
   */
  private insertJobByPriority(job: QueuedJob): void {
    let insertIndex = 0;
    
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority <= job.priority) {
        insertIndex = i;
        break;
      }
      insertIndex = i + 1;
    }

    this.queue.splice(insertIndex, 0, job);
  }

  /**
   * Calculate job priority
   */
  private calculatePriority(job: ExportJobData): number {
    let priority = 0;

    // Higher priority for PDF (more complex)
    if (job.format === ExportFormat.PDF) priority += 10;
    else if (job.format === ExportFormat.EXCEL) priority += 5;

    // Higher priority for newer jobs
    const ageHours = (Date.now() - job.createdAt.getTime()) / (1000 * 60 * 60);
    priority += Math.max(0, 10 - ageHours);

    return Math.round(priority);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'timeout',
      'network',
      'connection',
      'temporary',
      'busy'
    ];

    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Calculate retry delay
   */
  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff: 2^attempt * 1000ms
    return Math.min(Math.pow(2, attempt) * 1000, 30000); // Max 30 seconds
  }

  /**
   * Handle timeout jobs
   */
  async handleTimeoutJobs(): Promise<void> {
    try {
      const timeoutJobs = await reportsService.getTimeoutJobs(10); // 10 minutes
      
      if (timeoutJobs.length > 0) {
        logger.info(`Found ${timeoutJobs.length} timeout jobs`);
        
        const jobIds = timeoutJobs.map(job => job.id);
        await reportsService.markJobsAsTimeout(jobIds);

        // Remove from processing jobs
        jobIds.forEach(jobId => {
          if (this.processingJobs.has(jobId)) {
            const job = this.processingJobs.get(jobId)!;
            this.processingJobs.delete(jobId);
            this.emit('jobTimeout', job);
          }
        });
      }
    } catch (error) {
      logger.error('Error handling timeout jobs:', error);
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): {
    queueLength: number;
    processingCount: number;
    maxConcurrent: number;
    isProcessing: boolean;
  } {
    return {
      queueLength: this.queue.length,
      processingCount: this.processingJobs.size,
      maxConcurrent: this.maxConcurrentJobs,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      this.stopProcessing();
      
      // Handle timeout jobs
      await this.handleTimeoutJobs();
      
      // Clear queues
      this.queue.length = 0;
      this.processingJobs.clear();
      
      // Remove all listeners
      this.removeAllListeners();
      
      logger.info('Job queue service cleanup completed');
    } catch (error) {
      logger.error('Error during job queue cleanup:', error);
    }
  }
}

export const jobQueueService = new JobQueueService();