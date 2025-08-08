import { NotificationsService } from '../services/reports/notifications.service';
import webSocketService from '../services/websocket/websocket.service';
import { ExportStatus } from '@prisma/client';

// Mock the WebSocket service
jest.mock('../services/websocket/websocket.service');

const mockWebSocketService = webSocketService as jest.Mocked<typeof webSocketService>;

// Mock the methods
mockWebSocketService.sendNotificationToUser = jest.fn();
mockWebSocketService.broadcastJobUpdate = jest.fn();
mockWebSocketService.broadcastQueueUpdate = jest.fn();
mockWebSocketService.sendJobUpdateToUser = jest.fn();
mockWebSocketService.getConnectedUsersCount = jest.fn().mockReturnValue(5);
mockWebSocketService.getConnectionStats = jest.fn().mockReturnValue({
  connectedUsers: 5,
  connectedSockets: 8,
  rooms: [],
  timestamp: new Date().toISOString()
});

describe('NotificationsService', () => {
  let notificationsService: NotificationsService;

  beforeEach(() => {
    notificationsService = new NotificationsService();
    jest.clearAllMocks();
  });

  describe('sendJobNotification', () => {
    it('should send job notification via WebSocket', async () => {
      const notification = {
        jobId: 'job-123',
        userId: 1,
        type: 'job_completed' as const,
        title: 'Export Completed',
        message: 'Your report is ready',
        data: { templateId: 'inventory' }
      };

      await notificationsService.sendJobNotification(notification);

      expect(mockWebSocketService.sendNotificationToUser).toHaveBeenCalledWith(1, {
        type: 'success',
        title: 'Export Completed',
        message: 'Your report is ready',
        data: {
          jobId: 'job-123',
          type: 'job_completed',
          templateId: 'inventory'
        }
      });

      expect(mockWebSocketService.broadcastJobUpdate).toHaveBeenCalledWith('job-123', {
        type: 'job_completed',
        status: ExportStatus.COMPLETED,
        message: 'Your report is ready',
        templateId: 'inventory'
      });
    });

    it('should handle WebSocket service not available', async () => {
      // Temporarily mock the service as null
      const originalService = notificationsService['webSocketService'];
      notificationsService['webSocketService'] = null;

      const notification = {
        jobId: 'job-123',
        userId: 1,
        type: 'job_completed' as const,
        title: 'Export Completed',
        message: 'Your report is ready'
      };

      // Should not throw error
      await expect(notificationsService.sendJobNotification(notification)).resolves.toBeUndefined();
      
      // Restore the original service
      notificationsService['webSocketService'] = originalService;
    });
  });

  describe('sendQueueNotification', () => {
    it('should send queue notification to admins', async () => {
      const notification = {
        type: 'queue_status' as const,
        title: 'Queue Status',
        message: 'Queue is healthy',
        data: { queueLength: 5 }
      };

      await notificationsService.sendQueueNotification(notification);

      expect(mockWebSocketService.broadcastQueueUpdate).toHaveBeenCalledWith({
        type: 'queue_status',
        title: 'Queue Status',
        message: 'Queue is healthy',
        queueLength: 5
      });
    });
  });

  describe('sendJobProgressUpdate', () => {
    it('should send progress update to user', async () => {
      await notificationsService.sendJobProgressUpdate('job-123', 1, 75, 'Processing data...');

      expect(mockWebSocketService.sendJobUpdateToUser).toHaveBeenCalledWith(1, 'job-123', {
        type: 'progress',
        progress: 75,
        message: 'Processing data...',
        timestamp: expect.any(String)
      });
    });

    it('should use default message when not provided', async () => {
      await notificationsService.sendJobProgressUpdate('job-123', 1, 50);

      expect(mockWebSocketService.sendJobUpdateToUser).toHaveBeenCalledWith(1, 'job-123', {
        type: 'progress',
        progress: 50,
        message: 'Job progress: 50%',
        timestamp: expect.any(String)
      });
    });
  });

  describe('sendBulkNotification', () => {
    it('should send notification to multiple users', async () => {
      const notification = {
        jobId: 'job-123',
        type: 'job_completed' as const,
        title: 'Export Completed',
        message: 'Your report is ready'
      };

      await notificationsService.sendBulkNotification([1, 2, 3], notification);

      expect(mockWebSocketService.sendNotificationToUser).toHaveBeenCalledTimes(3);
      expect(mockWebSocketService.broadcastJobUpdate).toHaveBeenCalledTimes(3);
    });
  });

  describe('createJobStatusNotification', () => {
    it('should create notification for job completion', () => {
      const notification = notificationsService.createJobStatusNotification(
        'job-123',
        1,
        ExportStatus.PROCESSING,
        ExportStatus.COMPLETED,
        'inventory'
      );

      expect(notification).toEqual({
        jobId: 'job-123',
        userId: 1,
        type: 'job_completed',
        title: 'Export Completed',
        message: 'Your Inventory Report export is ready for download',
        data: { status: ExportStatus.COMPLETED, templateId: 'inventory' }
      });
    });

    it('should create notification for job failure', () => {
      const notification = notificationsService.createJobStatusNotification(
        'job-123',
        1,
        ExportStatus.PROCESSING,
        ExportStatus.FAILED,
        'financial',
        'Database connection error'
      );

      expect(notification).toEqual({
        jobId: 'job-123',
        userId: 1,
        type: 'job_failed',
        title: 'Export Failed',
        message: 'Your Financial Report export failed: Database connection error',
        data: { 
          status: ExportStatus.FAILED, 
          templateId: 'financial',
          errorMessage: 'Database connection error'
        }
      });
    });

    it('should create notification for job start', () => {
      const notification = notificationsService.createJobStatusNotification(
        'job-123',
        1,
        ExportStatus.PENDING,
        ExportStatus.PROCESSING,
        'health'
      );

      expect(notification).toEqual({
        jobId: 'job-123',
        userId: 1,
        type: 'job_started',
        title: 'Export Started',
        message: 'Your Health Report export is now being processed',
        data: { status: ExportStatus.PROCESSING, templateId: 'health' }
      });
    });

    it('should handle unknown template ID', () => {
      const notification = notificationsService.createJobStatusNotification(
        'job-123',
        1,
        ExportStatus.PENDING,
        ExportStatus.PROCESSING,
        'unknown-template'
      );

      expect(notification.message).toContain('Your Report export');
    });
  });

  describe('createQueueStatusNotification', () => {
    it('should create queue status notification', () => {
      const notification = notificationsService.createQueueStatusNotification(5, 2, true);

      expect(notification).toEqual({
        type: 'queue_status',
        title: 'Queue Status Update',
        message: 'Queue: 5 waiting, 2 processing. Status: Healthy',
        data: {
          queueLength: 5,
          processingCount: 2,
          isHealthy: true,
          timestamp: expect.any(String)
        }
      });
    });

    it('should indicate unhealthy status', () => {
      const notification = notificationsService.createQueueStatusNotification(10, 0, false);

      expect(notification.message).toContain('Status: Issues detected');
      expect((notification.data as any).isHealthy).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return service statistics', () => {
      const stats = notificationsService.getStatistics();

      expect(stats).toEqual({
        webSocketConnected: true,
        connectedUsers: 5,
        connectedSockets: 8,
        timestamp: expect.any(String)
      });
    });

    it('should handle WebSocket service not available', () => {
      // Temporarily mock the service as null
      const originalService = notificationsService['webSocketService'];
      notificationsService['webSocketService'] = null;

      const stats = notificationsService.getStatistics();

      expect(stats).toEqual({
        webSocketConnected: false,
        connectedUsers: 0,
        connectedSockets: 0,
        timestamp: expect.any(String)
      });

      // Restore the original service
      notificationsService['webSocketService'] = originalService;
    });
  });
});