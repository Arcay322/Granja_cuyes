import { ExportFormat, ExportStatus } from '@prisma/client';
import { 
  ExportJobData, 
  ExportFileData, 
  CreateExportJobRequest, 
  ExportStats, 
  JobWithFile,
  ExportJobUpdate 
} from '../../types/export.types';
import logger from '../../utils/logger';
import { prisma } from '../../utils/prisma';

export class ReportsService {
  
  /**
   * Create a new export job
   */
  async createExportJob(
    userId: number, 
    request: CreateExportJobRequest
  ): Promise<ExportJobData> {
    try {
      logger.info(`Creating export job for user ${userId}, template ${request.templateId}`);
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now
      
      const job = await prisma.exportJob.create({
        data: {
          userId,
          templateId: request.templateId,
          format: request.format,
          parameters: request.parameters || {},
          options: request.options as any || {},
          expiresAt,
          status: ExportStatus.PENDING,
          progress: 0
        }
      });
      
      logger.info(`Export job created with ID: ${job.id}`);
      return job as ExportJobData;
    } catch (error) {
      logger.error('Error creating export job:', error);
      throw new Error('Failed to create export job');
    }
  }

  /**
   * Get job status by ID
   */
  async getJobStatus(jobId: string): Promise<JobWithFile | null> {
    try {
      const job = await prisma.exportJob.findUnique({
        where: { id: jobId },
        include: {
          files: true,
          user: {
            select: { id: true, email: true }
          }
        }
      });
      
      return job as JobWithFile;
    } catch (error) {
      logger.error(`Error getting job status for ${jobId}:`, error);
      throw new Error('Failed to get job status');
    }
  }

  /**
   * Update job status and progress
   */
  async updateJob(jobId: string, update: ExportJobUpdate): Promise<ExportJobData> {
    try {
      logger.info(`Updating job ${jobId} with status: ${update.status}`);
      
      const job = await prisma.exportJob.update({
        where: { id: jobId },
        data: {
          ...update,
          ...(update.status === ExportStatus.PROCESSING && !update.startedAt && { startedAt: new Date() }),
          ...(update.status === ExportStatus.COMPLETED && !update.completedAt && { completedAt: new Date() })
        }
      });
      
      return job as ExportJobData;
    } catch (error) {
      logger.error(`Error updating job ${jobId}:`, error);
      throw new Error('Failed to update job');
    }
  }

  /**
   * Get job history for a user
   */
  async getJobHistory(
    userId: number, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<JobWithFile[]> {
    try {
      const jobs = await prisma.exportJob.findMany({
        where: { userId },
        include: {
          files: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });
      
      return jobs as JobWithFile[];
    } catch (error) {
      logger.error(`Error getting job history for user ${userId}:`, error);
      throw new Error('Failed to get job history');
    }
  }

  /**
   * Get all pending jobs for processing
   */
  async getPendingJobs(): Promise<ExportJobData[]> {
    try {
      const jobs = await prisma.exportJob.findMany({
        where: { 
          status: ExportStatus.PENDING 
        },
        orderBy: { createdAt: 'asc' }
      });
      
      return jobs as ExportJobData[];
    } catch (error) {
      logger.error('Error getting pending jobs:', error);
      throw new Error('Failed to get pending jobs');
    }
  }

  /**
   * Create export file record
   */
  async createExportFile(
    jobId: string,
    fileName: string,
    filePath: string,
    fileSize: bigint,
    mimeType: string
  ): Promise<ExportFileData> {
    try {
      logger.info(`Creating export file record for job ${jobId}: ${fileName}`);
      
      const file = await prisma.exportFile.create({
        data: {
          jobId,
          fileName,
          filePath,
          fileSize,
          mimeType
        }
      });
      
      return file;
    } catch (error) {
      logger.error(`Error creating export file for job ${jobId}:`, error);
      throw new Error('Failed to create export file record');
    }
  }

  /**
   * Get export file by job ID
   */
  async getExportFile(jobId: string): Promise<ExportFileData | null> {
    try {
      const file = await prisma.exportFile.findFirst({
        where: { jobId }
      });
      
      return file;
    } catch (error) {
      logger.error(`Error getting export file for job ${jobId}:`, error);
      throw new Error('Failed to get export file');
    }
  }

  /**
   * Increment download count
   */
  async incrementDownloadCount(fileId: string): Promise<void> {
    try {
      await prisma.exportFile.update({
        where: { id: fileId },
        data: {
          downloadCount: { increment: 1 },
          lastDownloadedAt: new Date()
        }
      });
      
      logger.info(`Download count incremented for file ${fileId}`);
    } catch (error) {
      logger.error(`Error incrementing download count for file ${fileId}:`, error);
      throw new Error('Failed to increment download count');
    }
  }

  /**
   * Get export statistics
   */
  async getExportStats(userId?: number): Promise<ExportStats> {
    try {
      const whereClause = userId ? { userId } : {};
      
      // Get job counts by status
      const jobCounts = await prisma.exportJob.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { id: true }
      });

      // Get job counts by format
      const formatCounts = await prisma.exportJob.groupBy({
        by: ['format'],
        where: { ...whereClause, status: ExportStatus.COMPLETED },
        _count: { id: true }
      });

      // Get job counts by template
      const templateCounts = await prisma.exportJob.groupBy({
        by: ['templateId'],
        where: { ...whereClause, status: ExportStatus.COMPLETED },
        _count: { id: true }
      });

      // Get total downloads and file size
      const fileStats = await prisma.exportFile.aggregate({
        where: {
          job: whereClause
        },
        _sum: {
          downloadCount: true,
          fileSize: true
        }
      });

      // Get recent activity
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [activity24h, activity7d, activity30d] = await Promise.all([
        prisma.exportJob.count({ where: { ...whereClause, createdAt: { gte: last24h } } }),
        prisma.exportJob.count({ where: { ...whereClause, createdAt: { gte: last7d } } }),
        prisma.exportJob.count({ where: { ...whereClause, createdAt: { gte: last30d } } })
      ]);

      // Process results
      const statusCounts = jobCounts.reduce((acc, item) => {
        acc[item.status.toLowerCase()] = item._count.id;
        return acc;
      }, {} as Record<string, number>);

      const byFormat = formatCounts.reduce((acc, item) => {
        acc[item.format.toLowerCase()] = item._count.id;
        return acc;
      }, { pdf: 0, excel: 0, csv: 0 });

      const byTemplate = templateCounts.reduce((acc, item) => {
        acc[item.templateId] = item._count.id;
        return acc;
      }, {} as Record<string, number>);

      const totalJobs = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

      return {
        totalJobs,
        completedJobs: statusCounts.completed || 0,
        failedJobs: statusCounts.failed || 0,
        pendingJobs: statusCounts.pending || 0,
        processingJobs: statusCounts.processing || 0,
        timeoutJobs: statusCounts.timeout || 0,
        totalDownloads: Number(fileStats._sum.downloadCount) || 0,
        totalFileSize: fileStats._sum.fileSize || BigInt(0),
        byFormat,
        byTemplate,
        recentActivity: {
          last24h: activity24h,
          last7d: activity7d,
          last30d: activity30d
        }
      };
    } catch (error) {
      logger.error('Error getting export statistics:', error);
      throw new Error('Failed to get export statistics');
    }
  }

  /**
   * Clean up expired files
   */
  async cleanupExpiredFiles(): Promise<{ cleanedCount: number }> {
    try {
      logger.info('Starting cleanup of expired files');
      
      const now = new Date();
      const expiredJobs = await prisma.exportJob.findMany({
        where: {
          expiresAt: { lt: now },
          status: ExportStatus.COMPLETED
        },
        include: { files: true }
      });

      let cleanedCount = 0;
      
      for (const job of expiredJobs) {
        // Delete physical files (will be implemented in file service)
        for (const file of job.files) {
          // TODO: Delete physical file from filesystem
          cleanedCount++;
        }
        
        // Delete file records but keep job record for history
        await prisma.exportFile.deleteMany({
          where: { jobId: job.id }
        });
      }
      
      logger.info(`Cleaned up ${cleanedCount} expired files`);
      return { cleanedCount };
    } catch (error) {
      logger.error('Error cleaning up expired files:', error);
      throw new Error('Failed to cleanup expired files');
    }
  }

  /**
   * Get jobs that need timeout handling
   */
  async getTimeoutJobs(timeoutMinutes: number = 10): Promise<ExportJobData[]> {
    try {
      const timeoutDate = new Date();
      timeoutDate.setMinutes(timeoutDate.getMinutes() - timeoutMinutes);
      
      const jobs = await prisma.exportJob.findMany({
        where: {
          status: ExportStatus.PROCESSING,
          startedAt: { lt: timeoutDate }
        }
      });
      
      return jobs as ExportJobData[];
    } catch (error) {
      logger.error('Error getting timeout jobs:', error);
      throw new Error('Failed to get timeout jobs');
    }
  }

  /**
   * Mark jobs as timed out
   */
  async markJobsAsTimeout(jobIds: string[]): Promise<void> {
    try {
      await prisma.exportJob.updateMany({
        where: { id: { in: jobIds } },
        data: {
          status: ExportStatus.TIMEOUT,
          errorMessage: 'Job timed out after exceeding maximum processing time'
        }
      });
      
      logger.info(`Marked ${jobIds.length} jobs as timed out`);
    } catch (error) {
      logger.error('Error marking jobs as timeout:', error);
      throw new Error('Failed to mark jobs as timeout');
    }
  }
}

export const reportsService = new ReportsService();