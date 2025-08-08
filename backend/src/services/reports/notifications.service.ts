import webSocketService from '../websocket/websocket.service';
import { ExportStatus } from '@prisma/client';
import logger from '../../utils/logger';

export interface JobNotification {
  jobId: string;
  userId: number;
  type: 'job_created' | 'job_started' | 'job_progress' | 'job_completed' | 'job_failed' | 'job_cancelled';
  title: string;
  message: string;
  data?: any;
}

export interface QueueNotification {
  type: 'queue_status' | 'queue_health' | 'worker_status';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export class NotificationsService {
  private webSocketService = webSocketService;

  /**
   * Send job-related notification
   */
  async sendJobNotification(notification: JobNotification): Promise<void> {
    try {
      logger.info(`Sending job notification: ${notification.type}`, {
        jobId: notification.jobId,
        userId: notification.userId
      });

      // Send WebSocket notification if service is available
      if (this.webSocketService) {
        this.webSocketService.sendNotificationToUser(notification.userId, {
          type: this.getNotificationLevel(notification.type),
          title: notification.title,
          message: notification.message,
          data: {
            jobId: notification.jobId,
            type: notification.type,
            ...notification.data
          }
        });

        // Also broadcast to job subscribers
        this.webSocketService.broadcastJobUpdate(notification.jobId, {
          type: notification.type,
          status: this.getStatusFromNotificationType(notification.type),
          message: notification.message,
          ...(notification.data || {})
        });
      }

      // Here you could also send email notifications, push notifications, etc.
      // await this.sendEmailNotification(notification);
      // await this.sendPushNotification(notification);
    } catch (error) {
      logger.error('Failed to send job notification:', error);
    }
  }

  /**
   * Send queue-related notification (admin only)
   */
  async sendQueueNotification(notification: QueueNotification): Promise<void> {
    try {
      logger.info(`Sending queue notification: ${notification.type}`);

      if (this.webSocketService) {
        this.webSocketService.broadcastQueueUpdate({
          type: notification.type,
          title: notification.title,
          message: notification.message,
          ...(notification.data || {})
        });
      }
    } catch (error) {
      logger.error('Failed to send queue notification:', error);
    }
  }

  /**
   * Send job progress update
   */
  async sendJobProgressUpdate(jobId: string, userId: number, progress: number, message?: string): Promise<void> {
    try {
      if (this.webSocketService) {
        this.webSocketService.sendJobUpdateToUser(userId, jobId, {
          type: 'progress',
          progress,
          message: message || `Job progress: ${progress}%`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Failed to send job progress update:', error);
    }
  }

  /**
   * Send bulk notification to multiple users
   */
  async sendBulkNotification(userIds: number[], notification: Omit<JobNotification, 'userId'>): Promise<void> {
    try {
      const promises = userIds.map(userId => 
        this.sendJobNotification({ ...notification, userId })
      );
      await Promise.allSettled(promises);
    } catch (error) {
      logger.error('Failed to send bulk notifications:', error);
    }
  }

  /**
   * Create job status change notification
   */
  createJobStatusNotification(
    jobId: string, 
    userId: number, 
    oldStatus: ExportStatus, 
    newStatus: ExportStatus,
    templateId?: string,
    errorMessage?: string
  ): JobNotification {
    const templateName = this.getTemplateName(templateId);

    switch (newStatus) {
      case ExportStatus.PENDING:
        return {
          jobId,
          userId,
          type: 'job_created',
          title: 'Export Job Created',
          message: `Your ${templateName} export has been queued for processing`,
          data: { status: newStatus, templateId }
        };

      case ExportStatus.PROCESSING:
        return {
          jobId,
          userId,
          type: 'job_started',
          title: 'Export Started',
          message: `Your ${templateName} export is now being processed`,
          data: { status: newStatus, templateId }
        };

      case ExportStatus.COMPLETED:
        return {
          jobId,
          userId,
          type: 'job_completed',
          title: 'Export Completed',
          message: `Your ${templateName} export is ready for download`,
          data: { status: newStatus, templateId }
        };

      case ExportStatus.FAILED:
        return {
          jobId,
          userId,
          type: 'job_failed',
          title: 'Export Failed',
          message: `Your ${templateName} export failed: ${errorMessage || 'Unknown error'}`,
          data: { status: newStatus, templateId, errorMessage }
        };

      case ExportStatus.TIMEOUT:
        return {
          jobId,
          userId,
          type: 'job_failed',
          title: 'Export Timeout',
          message: `Your ${templateName} export timed out and was cancelled`,
          data: { status: newStatus, templateId, reason: 'timeout' }
        };

      default:
        return {
          jobId,
          userId,
          type: 'job_progress',
          title: 'Export Status Update',
          message: `Your ${templateName} export status changed to ${newStatus}`,
          data: { status: newStatus, templateId }
        };
    }
  }

  /**
   * Create queue status notification
   */
  createQueueStatusNotification(queueLength: number, processingCount: number, isHealthy: boolean): QueueNotification {
    return {
      type: 'queue_status',
      title: 'Queue Status Update',
      message: `Queue: ${queueLength} waiting, ${processingCount} processing. Status: ${isHealthy ? 'Healthy' : 'Issues detected'}`,
      data: {
        queueLength,
        processingCount,
        isHealthy,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Get notification level based on type
   */
  private getNotificationLevel(type: JobNotification['type']): 'info' | 'success' | 'warning' | 'error' {
    switch (type) {
      case 'job_completed':
        return 'success';
      case 'job_failed':
      case 'job_cancelled':
        return 'error';
      case 'job_started':
        return 'info';
      case 'job_progress':
        return 'info';
      default:
        return 'info';
    }
  }

  /**
   * Get status from notification type
   */
  private getStatusFromNotificationType(type: JobNotification['type']): ExportStatus | null {
    switch (type) {
      case 'job_created':
        return ExportStatus.PENDING;
      case 'job_started':
        return ExportStatus.PROCESSING;
      case 'job_completed':
        return ExportStatus.COMPLETED;
      case 'job_failed':
        return ExportStatus.FAILED;
      case 'job_cancelled':
        return ExportStatus.TIMEOUT; // Using TIMEOUT for cancelled jobs
      default:
        return null;
    }
  }

  /**
   * Get human-readable template name
   */
  private getTemplateName(templateId?: string): string {
    const templateNames: Record<string, string> = {
      'inventory': 'Inventory Report',
      'reproductive': 'Reproductive Report',
      'financial': 'Financial Report',
      'health': 'Health Report'
    };

    return templateNames[templateId || ''] || 'Report';
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    const stats = this.webSocketService?.getConnectionStats();
    return {
      webSocketConnected: !!this.webSocketService,
      connectedUsers: stats?.connectedUsers || 0,
      connectedSockets: stats?.connectedSockets || 0,
      timestamp: new Date().toISOString()
    };
  }
}

export const notificationsService = new NotificationsService();