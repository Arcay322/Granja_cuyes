import { Request, Response } from 'express';
import { z } from 'zod';
import logger from '../../utils/logger';
import { jobLifecycleService } from '../../services/reports/jobLifecycle.service';
import { jobQueueService } from '../../services/reports/jobQueue.service';
import { ExportStatus, ExportFormat } from '@prisma/client';

// Validation schemas
const jobQuerySchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'TIMEOUT']).optional(),
  format: z.enum(['PDF', 'EXCEL', 'CSV']).optional(),
  templateId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['createdAt', 'completedAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

const bulkActionSchema = z.object({
  jobIds: z.array(z.string()).min(1).max(50),
  action: z.enum(['cancel', 'retry', 'delete'])
});

const jobPrioritySchema = z.object({
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
});

/**
 * Get detailed job status with real-time updates
 */
export const getJobStatus = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = (req as any).user?.id || 1;

    logger.info(`Getting detailed job status: ${jobId}`, { userId });

    // Get job details
    const jobWithFiles = await jobLifecycleService.getJobDetails(jobId);
    if (!jobWithFiles) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check if user has access to this job
    if (jobWithFiles.userId !== userId && (req as any).user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this job'
      });
    }

    // Calculate progress and estimated completion
    const now = new Date();
    let estimatedCompletion = null;
    let timeRemaining = null;

    if (jobWithFiles.status === 'PROCESSING' && jobWithFiles.startedAt) {
      const elapsedTime = now.getTime() - jobWithFiles.startedAt.getTime();
      const progress = jobWithFiles.progress || 0;
      
      if (progress > 0) {
        const estimatedTotal = (elapsedTime / progress) * 100;
        const remaining = estimatedTotal - elapsedTime;
        estimatedCompletion = new Date(now.getTime() + remaining);
        timeRemaining = Math.max(0, Math.round(remaining / 1000)); // seconds
      }
    }

    const response = {
      id: jobWithFiles.id,
      templateId: jobWithFiles.templateId,
      format: jobWithFiles.format,
      status: jobWithFiles.status,
      progress: jobWithFiles.progress || 0,
      userId: jobWithFiles.userId,
      createdAt: jobWithFiles.createdAt,
      startedAt: jobWithFiles.startedAt,
      completedAt: jobWithFiles.completedAt,
      failedAt: jobWithFiles.status === ExportStatus.FAILED ? jobWithFiles.completedAt : null,
      errorMessage: jobWithFiles.errorMessage,
      parameters: jobWithFiles.parameters,
      options: jobWithFiles.options,
      estimatedCompletion,
      timeRemaining,
      files: (jobWithFiles.files || []).map(file => ({
        id: file.id,
        fileName: file.fileName,
        fileSize: Number(file.fileSize), // Convert BigInt to number
        downloadCount: file.downloadCount,
        createdAt: file.createdAt,
        expiresAt: new Date(file.createdAt.getTime() + 24 * 60 * 60 * 1000), // 24 hours
        downloadUrl: `/api/reports/jobs/${jobId}/files/${file.id}/download`
      })),
      // Queue information
      queuePosition: jobWithFiles.status === 'PENDING' ? await getQueuePosition(jobId) : null,
      canCancel: ['PENDING', 'PROCESSING'].includes(jobWithFiles.status),
      canRetry: ['FAILED', 'TIMEOUT'].includes(jobWithFiles.status),
      canDelete: ['COMPLETED', 'FAILED', 'TIMEOUT'].includes(jobWithFiles.status)
    };

    res.json({
      success: true,
      data: response,
      message: 'Job status retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting job status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get job status'
    });
  }
};

/**
 * Get comprehensive job history with advanced filtering
 */
export const getJobHistory = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const validationResult = jobQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validationResult.error.errors
      });
    }

    const { status, format, templateId, limit, offset, sortBy, sortOrder } = validationResult.data;
    const userId = (req as any).user?.id || 1;
    const isAdmin = (req as any).user?.role === 'admin';

    logger.info('Getting job history', { 
      userId, 
      isAdmin, 
      filters: { status, format, templateId },
      pagination: { limit, offset },
      sorting: { sortBy, sortOrder }
    });

    // Get jobs with filters
    const jobs = await jobLifecycleService.getUserJobHistory(
      isAdmin ? undefined : userId, 
      {
        status,
        format,
        templateId,
        limit,
        offset
      }
    );

    // Get summary statistics for the filtered results
    const summary = {
      total: jobs.length,
      byStatus: jobs.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byFormat: jobs.reduce((acc, job) => {
        acc[job.format] = (acc[job.format] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    const history = jobs.map(job => ({
      id: job.id,
      templateId: job.templateId,
      format: job.format,
      status: job.status,
      progress: job.progress || 0,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      failedAt: job.status === ExportStatus.FAILED ? job.completedAt : null,
      errorMessage: job.errorMessage,
      parameters: job.parameters,
      fileCount: job.files?.length || 0,
      totalFileSize: job.files?.reduce((sum, file) => sum + Number(file.fileSize), 0) || 0,
      downloadCount: job.files?.reduce((sum, file) => sum + file.downloadCount, 0) || 0,
      duration: job.completedAt && job.startedAt 
        ? job.completedAt.getTime() - job.startedAt.getTime()
        : null,
      canCancel: ['PENDING', 'PROCESSING'].includes(job.status),
      canRetry: ['FAILED', 'TIMEOUT'].includes(job.status),
      canDelete: ['COMPLETED', 'FAILED', 'TIMEOUT'].includes(job.status)
    }));

    res.json({
      success: true,
      data: {
        jobs: history,
        summary,
        pagination: {
          total: jobs.length,
          limit,
          offset,
          hasMore: jobs.length === limit, // Simplified check
          totalPages: Math.ceil(jobs.length / limit),
          currentPage: Math.floor(offset / limit) + 1
        },
        filters: {
          status,
          format,
          templateId,
          sortBy,
          sortOrder
        }
      },
      message: 'Job history retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting job history:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get job history'
    });
  }
};

/**
 * Get job queue status and statistics
 */
export const getQueueStatus = async (req: Request, res: Response) => {
  try {
    const isAdmin = (req as any).user?.role === 'admin';
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    logger.info('Getting queue status');

    // Get queue statistics
    const queueStats = jobQueueService.getQueueStats();

    // Get recent jobs in queue
    const recentJobs = await jobLifecycleService.getUserJobHistory(undefined, {
      status: 'PENDING',
      limit: 10,
      offset: 0
    });

    const queueStatus = {
      statistics: {
        queueLength: queueStats.queueLength,
        processingCount: queueStats.processingCount,
        maxConcurrent: queueStats.maxConcurrent,
        isProcessing: queueStats.isProcessing,
        averageWaitTime: 0, // Would be calculated from historical data
        averageProcessingTime: 0 // Would be calculated from historical data
      },
      recentJobs: recentJobs.map((job, index) => ({
        id: job.id,
        templateId: job.templateId,
        format: job.format,
        userId: job.userId,
        createdAt: job.createdAt,
        queuePosition: index + 1,
        estimatedStartTime: new Date(Date.now() + (index * 2 * 60 * 1000)), // Rough estimate
        parameters: job.parameters
      })),
      health: {
        status: queueStats.isProcessing ? 'healthy' : 'idle',
        lastProcessedAt: new Date(), // Would be tracked in real implementation
        errorRate: 0, // Would be calculated from recent failures
        throughput: 0 // Jobs per hour
      }
    };

    res.json({
      success: true,
      data: queueStatus,
      message: 'Queue status retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting queue status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get queue status'
    });
  }
};

/**
 * Perform bulk actions on multiple jobs
 */
export const bulkJobActions = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = bulkActionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        details: validationResult.error.errors
      });
    }

    const { jobIds, action } = validationResult.data;
    const userId = (req as any).user?.id || 1;
    const isAdmin = (req as any).user?.role === 'admin';

    logger.info(`Performing bulk action: ${action} on ${jobIds.length} jobs`, { userId, isAdmin });

    const results = {
      successful: [] as string[],
      failed: [] as { jobId: string; error: string }[]
    };

    for (const jobId of jobIds) {
      try {
        // Get job to verify ownership
        const job = await jobLifecycleService.getJobDetails(jobId);
        if (!job) {
          results.failed.push({ jobId, error: 'Job not found' });
          continue;
        }

        // Check permissions
        if (job.userId !== userId && !isAdmin) {
          results.failed.push({ jobId, error: 'Access denied' });
          continue;
        }

        // Perform action
        let success = false;
        switch (action) {
          case 'cancel':
            if (['PENDING', 'PROCESSING'].includes(job.status)) {
              success = await jobLifecycleService.cancelJob(jobId);
            } else {
              results.failed.push({ jobId, error: `Cannot cancel job with status: ${job.status}` });
              continue;
            }
            break;

          case 'retry':
            if (['FAILED', 'TIMEOUT'].includes(job.status)) {
              success = await jobLifecycleService.retryJob(jobId);
            } else {
              results.failed.push({ jobId, error: `Cannot retry job with status: ${job.status}` });
              continue;
            }
            break;

          case 'delete':
            if (['COMPLETED', 'FAILED', 'TIMEOUT'].includes(job.status)) {
              // This would be implemented in the lifecycle service
              success = true; // Placeholder
            } else {
              results.failed.push({ jobId, error: `Cannot delete job with status: ${job.status}` });
              continue;
            }
            break;
        }

        if (success) {
          results.successful.push(jobId);
        } else {
          results.failed.push({ jobId, error: `Failed to ${action} job` });
        }
      } catch (error) {
        results.failed.push({ 
          jobId, 
          error: error instanceof Error ? error.message : `Failed to ${action} job`
        });
      }
    }

    res.json({
      success: true,
      data: {
        action,
        results,
        summary: {
          total: jobIds.length,
          successful: results.successful.length,
          failed: results.failed.length
        }
      },
      message: `Bulk ${action} operation completed`
    });
  } catch (error) {
    logger.error('Error performing bulk job actions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to perform bulk actions'
    });
  }
};

/**
 * Update job priority
 */
export const updateJobPriority = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    // Validate request body
    const validationResult = jobPrioritySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid priority value',
        details: validationResult.error.errors
      });
    }

    const { priority } = validationResult.data;
    const userId = (req as any).user?.id || 1;
    const isAdmin = (req as any).user?.role === 'admin';

    logger.info(`Updating job priority: ${jobId} to ${priority}`, { userId, isAdmin });

    // Get job to verify ownership
    const job = await jobLifecycleService.getJobDetails(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check permissions (only admin or job owner can update priority)
    if (job.userId !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this job'
      });
    }

    // Only pending jobs can have their priority updated
    if (job.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: `Cannot update priority for job with status: ${job.status}`
      });
    }

    // Update priority (this would be implemented in the lifecycle service)
    // For now, we'll just return success
    const success = true; // Placeholder

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update job priority'
      });
    }

    res.json({
      success: true,
      data: {
        jobId,
        priority,
        updatedAt: new Date()
      },
      message: 'Job priority updated successfully'
    });
  } catch (error) {
    logger.error('Error updating job priority:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update job priority'
    });
  }
};

/**
 * Get job execution logs
 */
export const getJobLogs = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { level, limit = 100, offset = 0 } = req.query;
    const userId = (req as any).user?.id || 1;
    const isAdmin = (req as any).user?.role === 'admin';

    logger.info(`Getting job logs: ${jobId}`, { userId, level, limit, offset });

    // Get job to verify ownership
    const job = await jobLifecycleService.getJobDetails(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check permissions
    if (job.userId !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this job'
      });
    }

    // Mock logs for now (would be implemented with actual log storage)
    const logs = [
      {
        id: '1',
        timestamp: job.createdAt,
        level: 'info',
        message: 'Job created and queued for processing',
        details: { templateId: job.templateId, format: job.format }
      },
      ...(job.startedAt ? [{
        id: '2',
        timestamp: job.startedAt,
        level: 'info',
        message: 'Job processing started',
        details: { workerId: 'worker-1' }
      }] : []),
      ...(job.completedAt ? [{
        id: '3',
        timestamp: job.completedAt,
        level: 'info',
        message: 'Job completed successfully',
        details: { fileCount: job.files?.length || 0 }
      }] : []),
      ...(job.status === ExportStatus.FAILED ? [{
        id: '4',
        timestamp: job.completedAt || job.createdAt,
        level: 'error',
        message: job.errorMessage || 'Job failed with unknown error',
        details: { error: job.errorMessage }
      }] : [])
    ].filter(log => !level || log.level === level)
     .slice(Number(offset), Number(offset) + Number(limit));

    res.json({
      success: true,
      data: {
        jobId,
        logs,
        pagination: {
          total: logs.length,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: false // Simplified
        },
        filters: {
          level
        }
      },
      message: 'Job logs retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting job logs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get job logs'
    });
  }
};

/**
 * Helper function to get queue position
 */
async function getQueuePosition(jobId: string): Promise<number | null> {
  try {
    // This would be implemented by querying the job queue
    // For now, return a mock position
    return Math.floor(Math.random() * 5) + 1;
  } catch (error) {
    logger.error('Error getting queue position:', error);
    return null;
  }
}