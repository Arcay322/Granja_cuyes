import request from 'supertest';
import express from 'express';
import { 
  exportReport, 
  getExportStatus, 
  downloadReport, 
  getExportsHistory, 
  getReportsStats, 
  cleanupFiles,
  cancelExportJob,
  retryExportJob,
  reportGenerationLimiter
} from '../controllers/reports/reports.controller';
import { jobLifecycleService } from '../services/reports/jobLifecycle.service';
import { jobQueueService } from '../services/reports/jobQueue.service';
import { fileDownloadService } from '../services/reports/fileDownload.service';
import { fileCleanupService } from '../services/reports/fileCleanup.service';
import { ExportStatus, ExportFormat } from '@prisma/client';

// Mock the services
jest.mock('../services/reports/jobLifecycle.service');
jest.mock('../services/reports/jobQueue.service');
jest.mock('../services/reports/fileDownload.service');
jest.mock('../services/reports/fileCleanup.service');

const mockJobLifecycleService = jobLifecycleService as jest.Mocked<typeof jobLifecycleService>;
const mockJobQueueService = jobQueueService as jest.Mocked<typeof jobQueueService>;
const mockFileDownloadService = fileDownloadService as jest.Mocked<typeof fileDownloadService>;
const mockFileCleanupService = fileCleanupService as jest.Mocked<typeof fileCleanupService>;

describe('Reports Controller', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock auth middleware
    app.use((req, res, next) => {
      (req as any).user = { id: 1, role: 'user' };
      next();
    });

    // Setup routes
    app.post('/api/reports/export', exportReport);
    app.get('/api/reports/jobs/:jobId/status', getExportStatus);
    app.get('/api/reports/jobs/:jobId/files/:fileId/download', downloadReport);
    app.get('/api/reports/history', getExportsHistory);
    app.get('/api/reports/stats', getReportsStats);
    app.post('/api/reports/cleanup', cleanupFiles);
    app.post('/api/reports/jobs/:jobId/cancel', cancelExportJob);
    app.post('/api/reports/jobs/:jobId/retry', retryExportJob);

    jest.clearAllMocks();
  });

  describe('POST /api/reports/export', () => {
    it('should create export job successfully', async () => {
      const mockJob = {
        id: 'job-123',
        templateId: 'inventory',
        format: ExportFormat.PDF,
        status: ExportStatus.PENDING,
        userId: 1,
        createdAt: new Date(),
        parameters: {},
        options: {}
      };

      (mockJobLifecycleService.createJob as jest.Mock).mockResolvedValue(mockJob);
      (mockJobQueueService.addJob as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/reports/export')
        .send({
          templateId: 'inventory',
          format: 'PDF',
          parameters: { dateRange: { from: '2024-01-01', to: '2024-01-31' } },
          options: { includeCharts: true }
        });

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);
      expect(response.body.data.jobId).toBe('job-123');
      expect(response.body.data.status).toBe(ExportStatus.PENDING);
    });

    it('should validate request parameters', async () => {
      const response = await request(app)
        .post('/api/reports/export')
        .send({
          templateId: '',
          format: 'INVALID_FORMAT'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request parameters');
    });

    it('should handle service errors', async () => {
      (mockJobLifecycleService.createJob as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/reports/export')
        .send({
          templateId: 'inventory',
          format: 'PDF'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database error');
    });
  });

  describe('GET /api/reports/jobs/:jobId/status', () => {
    it('should return job status successfully', async () => {
      const mockJobWithFiles = {
        id: 'job-123',
        templateId: 'inventory',
        format: ExportFormat.PDF,
        status: ExportStatus.COMPLETED,
        progress: 100,
        userId: 1,
        createdAt: new Date(),
        startedAt: new Date(),
        completedAt: new Date(),
        failedAt: null,
        errorMessage: null,
        files: [
          {
            id: 'file-123',
            fileName: 'inventory-report.pdf',
            fileSize: BigInt(1024000),
            downloadCount: 0,
            createdAt: new Date()
          }
        ]
      };

      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(mockJobWithFiles);

      const response = await request(app)
        .get('/api/reports/jobs/job-123/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('job-123');
      expect(response.body.data.status).toBe(ExportStatus.COMPLETED);
      expect(response.body.data.files).toHaveLength(1);
      expect(response.body.data.files[0].fileName).toBe('inventory-report.pdf');
    });

    it('should return 404 for non-existent job', async () => {
      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/reports/jobs/non-existent/status');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Export job not found');
    });
  });

  describe('GET /api/reports/jobs/:jobId/files/:fileId/download', () => {
    it('should download file successfully', async () => {
      const mockJobWithFiles = {
        id: 'job-123',
        userId: 1,
        status: ExportStatus.COMPLETED,
        files: [
          {
            id: 'file-123',
            fileName: 'inventory-report.pdf',
            fileSize: BigInt(1024000)
          }
        ]
      };

      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(mockJobWithFiles);
      (mockFileDownloadService.serveFileDownload as jest.Mock).mockImplementation(async (req, res, userId, fileId) => {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="inventory-report.pdf"');
        res.send('PDF content');
      });

      const response = await request(app)
        .get('/api/reports/jobs/job-123/files/file-123/download');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(mockFileDownloadService.serveFileDownload).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        1,
        'file-123'
      );
    });

    it('should return 403 for unauthorized access', async () => {
      const mockJobWithFiles = {
        id: 'job-123',
        userId: 2, // Different user
        status: ExportStatus.COMPLETED,
        files: []
      };

      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(mockJobWithFiles);

      const response = await request(app)
        .get('/api/reports/jobs/job-123/files/file-123/download');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied to this export job');
    });

    it('should return 404 for non-existent file', async () => {
      const mockJobWithFiles = {
        id: 'job-123',
        userId: 1,
        status: ExportStatus.COMPLETED,
        files: []
      };

      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(mockJobWithFiles);

      const response = await request(app)
        .get('/api/reports/jobs/job-123/files/file-123/download');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('File not found');
    });
  });

  describe('GET /api/reports/history', () => {
    it('should return exports history successfully', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          templateId: 'inventory',
          format: ExportFormat.PDF,
          status: ExportStatus.COMPLETED,
          progress: 100,
          createdAt: new Date(),
          startedAt: new Date(),
          completedAt: new Date(),
          failedAt: null,
          errorMessage: null,
          parameters: {}
        }
      ];

      (mockJobLifecycleService.getUserJobHistory as jest.Mock).mockResolvedValue(mockJobs);

      const response = await request(app)
        .get('/api/reports/history')
        .query({ limit: 20, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.jobs).toHaveLength(1);
      expect(response.body.data.pagination.total).toBe(1);
      expect(response.body.data.pagination.hasMore).toBe(false);
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/reports/history')
        .query({ limit: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid query parameters');
    });
  });

  describe('GET /api/reports/stats', () => {
    it('should return statistics successfully', async () => {
      const mockJobStats = {
        totalJobs: 10,
        completedJobs: 8,
        failedJobs: 1,
        pendingJobs: 1,
        processingJobs: 0,
        cancelledJobs: 0,
        byFormat: { PDF: 5, EXCEL: 3, CSV: 2 },
        averageProcessingTime: 120000,
        successRate: 0.8
      };

      const mockDownloadStats = {
        totalDownloads: 15,
        totalSize: BigInt(50000000),
        averageSize: BigInt(3333333)
      };

      const mockCleanupStats = {
        totalRuns: 5,
        totalFilesDeleted: 20,
        totalSpaceCleaned: BigInt(100000000),
        lastRunTime: new Date(),
        nextScheduledRun: new Date()
      };

      const mockQueueStats = {
        activeJobs: 1,
        waitingJobs: 2,
        completedJobs: 8,
        failedJobs: 1
      };

      (mockJobLifecycleService.getLifecycleStats as jest.Mock).mockResolvedValue(mockJobStats);
      (mockFileDownloadService.getDownloadStats as jest.Mock).mockResolvedValue(mockDownloadStats);
      (mockFileCleanupService.getMetrics as jest.Mock).mockReturnValue(mockCleanupStats);
      (mockJobQueueService.getQueueStats as jest.Mock).mockReturnValue(mockQueueStats);

      const response = await request(app)
        .get('/api/reports/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.jobs.total).toBe(10);
      expect(response.body.data.files.totalDownloads).toBe(15);
      expect(response.body.data.cleanup.totalRuns).toBe(5);
      expect(response.body.data.queue.activeJobs).toBe(1);
    });
  });

  describe('POST /api/reports/cleanup', () => {
    it('should perform cleanup successfully for admin', async () => {
      // Create new app with admin user
      const adminApp = express();
      adminApp.use(express.json());
      adminApp.use((req, res, next) => {
        (req as any).user = { id: 1, role: 'admin' };
        next();
      });
      adminApp.post('/api/reports/cleanup', cleanupFiles);

      const mockCleanupResult = {
        success: true,
        filesDeleted: 5,
        spaceCleaned: BigInt(10000000),
        duration: 5000,
        details: {
          completedJobs: 3,
          failedJobs: 1,
          orphanedFiles: 1,
          tempFiles: 0
        },
        errors: []
      };

      (mockFileCleanupService.performCleanup as jest.Mock).mockResolvedValue(mockCleanupResult);

      const response = await request(adminApp)
        .post('/api/reports/cleanup');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.filesDeleted).toBe(5);
      expect(mockFileCleanupService.performCleanup).toHaveBeenCalled();
    });

    it('should deny access for non-admin users', async () => {
      const response = await request(app)
        .post('/api/reports/cleanup');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Admin access required for file cleanup');
    });
  });

  describe('POST /api/reports/jobs/:jobId/cancel', () => {
    it('should cancel job successfully', async () => {
      const mockJob = {
        id: 'job-123',
        userId: 1,
        status: ExportStatus.PROCESSING
      };

      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(mockJob);
      (mockJobLifecycleService.cancelJob as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post('/api/reports/jobs/job-123/cancel');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockJobLifecycleService.cancelJob).toHaveBeenCalledWith('job-123');
    });

    it('should not cancel already completed job', async () => {
      const mockJob = {
        id: 'job-123',
        userId: 1,
        status: ExportStatus.COMPLETED
      };

      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(mockJob);

      const response = await request(app)
        .post('/api/reports/jobs/job-123/cancel');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cannot cancel job with status: COMPLETED');
    });
  });

  describe('POST /api/reports/jobs/:jobId/retry', () => {
    it('should retry failed job successfully', async () => {
      const mockFailedJob = {
        id: 'job-123',
        userId: 1,
        status: ExportStatus.FAILED,
        templateId: 'inventory',
        format: ExportFormat.PDF,
        parameters: { dateRange: { from: '2024-01-01' } },
        options: { includeCharts: true }
      };

      const mockNewJob = {
        id: 'job-456',
        status: ExportStatus.PENDING,
        createdAt: new Date()
      };

      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(mockFailedJob);
      (mockJobLifecycleService.createJob as jest.Mock).mockResolvedValue(mockNewJob);
      (mockJobQueueService.addJob as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/reports/jobs/job-123/retry');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.originalJobId).toBe('job-123');
      expect(response.body.data.newJobId).toBe('job-456');
    });

    it('should not retry non-failed job', async () => {
      const mockJob = {
        id: 'job-123',
        userId: 1,
        status: ExportStatus.COMPLETED
      };

      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(mockJob);

      const response = await request(app)
        .post('/api/reports/jobs/job-123/retry');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cannot retry job with status: COMPLETED');
    });
  });

  describe('Rate limiting', () => {
    it('should apply rate limiting to report generation', () => {
      expect(reportGenerationLimiter).toBeDefined();
      expect(typeof reportGenerationLimiter).toBe('function');
    });
  });
});