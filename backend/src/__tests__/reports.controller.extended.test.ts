import request from 'supertest';
import express from 'express';
import { 
  getJobDetails,
  getJobsHistory,
  getJobStatistics,
  getActiveJobs,
  cancelMultipleJobs
} from '../controllers/reports/reports.controller';
import { jobLifecycleService } from '../services/reports/jobLifecycle.service';
import { ExportStatus, ExportFormat } from '@prisma/client';

// Mock the services
jest.mock('../services/reports/jobLifecycle.service');

const mockJobLifecycleService = jobLifecycleService as jest.Mocked<typeof jobLifecycleService>;

describe('Reports Controller - Extended Endpoints', () => {
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
    app.get('/api/reports/jobs/:jobId/details', getJobDetails);
    app.get('/api/reports/jobs/history', getJobsHistory);
    app.get('/api/reports/jobs/statistics', getJobStatistics);
    app.get('/api/reports/jobs/active', getActiveJobs);
    app.post('/api/reports/jobs/cancel-multiple', cancelMultipleJobs);

    jest.clearAllMocks();
  });

  describe('GET /api/reports/jobs/:jobId/details', () => {
    it('should return detailed job information', async () => {
      const mockJobWithFiles = {
        id: 'job-123',
        templateId: 'inventory',
        format: ExportFormat.PDF,
        status: ExportStatus.COMPLETED,
        progress: 100,
        parameters: { dateRange: { from: '2024-01-01', to: '2024-01-31' } },
        options: { includeCharts: true },
        userId: 1,
        createdAt: new Date(),
        startedAt: new Date(),
        completedAt: new Date(),
        errorMessage: null,
        files: [
          {
            id: 'file-123',
            fileName: 'inventory-report.pdf',
            fileSize: BigInt(1024000),
            mimeType: 'application/pdf',
            downloadCount: 2,
            createdAt: new Date(),
            lastDownloadedAt: new Date()
          }
        ]
      };

      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(mockJobWithFiles);

      const response = await request(app)
        .get('/api/reports/jobs/job-123/details');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('job-123');
      expect(response.body.data.canDownload).toBe(true);
      expect(response.body.data.canCancel).toBe(false);
      expect(response.body.data.canRetry).toBe(false);
      expect(response.body.data.files).toHaveLength(1);
      expect(response.body.data.files[0].downloadCount).toBe(2);
    });

    it('should return 404 for non-existent job', async () => {
      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/reports/jobs/non-existent/details');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Export job not found');
    });

    it('should deny access to other users jobs', async () => {
      const mockJobWithFiles = {
        id: 'job-123',
        userId: 2, // Different user
        status: ExportStatus.COMPLETED,
        files: []
      };

      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(mockJobWithFiles);

      const response = await request(app)
        .get('/api/reports/jobs/job-123/details');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied to this export job');
    });

    it('should allow admin to access any job', async () => {
      // Create admin app
      const adminApp = express();
      adminApp.use(express.json());
      adminApp.use((req, res, next) => {
        (req as any).user = { id: 1, role: 'admin' };
        next();
      });
      adminApp.get('/api/reports/jobs/:jobId/details', getJobDetails);

      const mockJobWithFiles = {
        id: 'job-123',
        userId: 2, // Different user
        status: ExportStatus.COMPLETED,
        files: []
      };

      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(mockJobWithFiles);

      const response = await request(adminApp)
        .get('/api/reports/jobs/job-123/details');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/reports/jobs/history', () => {
    it('should return jobs history with filters', async () => {
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
          errorMessage: null,
          userId: 1,
          files: [{ id: 'file-1' }]
        },
        {
          id: 'job-2',
          templateId: 'financial',
          format: ExportFormat.EXCEL,
          status: ExportStatus.FAILED,
          progress: 50,
          createdAt: new Date(),
          startedAt: new Date(),
          completedAt: null,
          errorMessage: 'Generation failed',
          userId: 1,
          files: []
        }
      ];

      (mockJobLifecycleService.getUserJobHistory as jest.Mock).mockResolvedValue(mockJobs);

      const response = await request(app)
        .get('/api/reports/jobs/history')
        .query({ status: 'COMPLETED', limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.jobs).toHaveLength(2);
      expect(response.body.data.jobs[0].canDownload).toBe(true);
      expect(response.body.data.jobs[1].canRetry).toBe(true);
      expect(response.body.data.pagination.total).toBe(2);
      expect(response.body.data.filters.status).toBe('COMPLETED');
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/reports/jobs/history')
        .query({ status: 'INVALID_STATUS' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid query parameters');
    });
  });

  describe('GET /api/reports/jobs/statistics', () => {
    it('should return detailed job statistics', async () => {
      const mockLifecycleStats = {
        averageProcessingTime: 120000,
        successRate: 0.85,
        retryRate: 0.1,
        timeoutRate: 0.05
      };

      const mockJobs = [
        {
          id: 'job-1',
          templateId: 'inventory',
          format: ExportFormat.PDF,
          status: ExportStatus.COMPLETED,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        },
        {
          id: 'job-2',
          templateId: 'financial',
          format: ExportFormat.EXCEL,
          status: ExportStatus.FAILED,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
        },
        {
          id: 'job-3',
          templateId: 'inventory',
          format: ExportFormat.CSV,
          status: ExportStatus.PENDING,
          createdAt: new Date() // Today
        }
      ];

      (mockJobLifecycleService.getLifecycleStats as jest.Mock).mockResolvedValue(mockLifecycleStats);
      (mockJobLifecycleService.getUserJobHistory as jest.Mock).mockResolvedValue(mockJobs);

      const response = await request(app)
        .get('/api/reports/jobs/statistics')
        .query({ period: '7d' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.overview.totalJobs).toBe(3);
      expect(response.body.data.overview.completedJobs).toBe(1);
      expect(response.body.data.overview.failedJobs).toBe(1);
      expect(response.body.data.overview.pendingJobs).toBe(1);
      expect(response.body.data.byFormat.PDF).toBe(1);
      expect(response.body.data.byFormat.EXCEL).toBe(1);
      expect(response.body.data.byFormat.CSV).toBe(1);
      expect(response.body.data.byTemplate.inventory).toBe(2);
      expect(response.body.data.byTemplate.financial).toBe(1);
      expect(response.body.data.performance.successRate).toBe(0.85);
      expect(response.body.data.timeline).toBeInstanceOf(Array);
      expect(response.body.data.recentActivity).toHaveProperty('last24h');
    });
  });

  describe('GET /api/reports/jobs/active', () => {
    it('should return only active jobs', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          templateId: 'inventory',
          format: ExportFormat.PDF,
          status: ExportStatus.PENDING,
          progress: 0,
          createdAt: new Date(),
          startedAt: null,
          userId: 1
        },
        {
          id: 'job-2',
          templateId: 'financial',
          format: ExportFormat.EXCEL,
          status: ExportStatus.PROCESSING,
          progress: 50,
          createdAt: new Date(),
          startedAt: new Date(),
          userId: 1
        },
        {
          id: 'job-3',
          templateId: 'health',
          format: ExportFormat.CSV,
          status: ExportStatus.COMPLETED,
          progress: 100,
          createdAt: new Date(),
          startedAt: new Date(),
          userId: 1
        }
      ];

      (mockJobLifecycleService.getUserJobHistory as jest.Mock).mockResolvedValue(mockJobs);

      const response = await request(app)
        .get('/api/reports/jobs/active');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.activeJobs).toHaveLength(2); // Only PENDING and PROCESSING
      expect(response.body.data.count).toBe(2);
      expect(response.body.data.queuePosition).toBe(1); // First PENDING job
      expect(response.body.data.activeJobs[0].canCancel).toBe(true);
      expect(response.body.data.activeJobs[1].estimatedCompletion).toBeInstanceOf(String);
    });

    it('should return empty array when no active jobs', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          status: ExportStatus.COMPLETED,
          userId: 1
        }
      ];

      (mockJobLifecycleService.getUserJobHistory as jest.Mock).mockResolvedValue(mockJobs);

      const response = await request(app)
        .get('/api/reports/jobs/active');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.activeJobs).toHaveLength(0);
      expect(response.body.data.count).toBe(0);
    });
  });

  describe('POST /api/reports/jobs/cancel-multiple', () => {
    it('should cancel multiple jobs successfully', async () => {
      const mockJobs = [
        { id: 'job-1', userId: 1, status: ExportStatus.PENDING },
        { id: 'job-2', userId: 1, status: ExportStatus.PROCESSING }
      ];

      (mockJobLifecycleService.getJobDetails as jest.Mock)
        .mockResolvedValueOnce(mockJobs[0])
        .mockResolvedValueOnce(mockJobs[1]);
      
      (mockJobLifecycleService.cancelJob as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post('/api/reports/jobs/cancel-multiple')
        .send({ jobIds: ['job-1', 'job-2'] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveLength(2);
      expect(response.body.data.results[0].success).toBe(true);
      expect(response.body.data.results[1].success).toBe(true);
      expect(response.body.data.summary.successful).toBe(2);
      expect(response.body.data.summary.failed).toBe(0);
      expect(mockJobLifecycleService.cancelJob).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed success and failure', async () => {
      const mockJobs = [
        { id: 'job-1', userId: 1, status: ExportStatus.PENDING },
        { id: 'job-2', userId: 1, status: ExportStatus.COMPLETED } // Cannot cancel completed
      ];

      (mockJobLifecycleService.getJobDetails as jest.Mock)
        .mockResolvedValueOnce(mockJobs[0])
        .mockResolvedValueOnce(mockJobs[1]);
      
      (mockJobLifecycleService.cancelJob as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post('/api/reports/jobs/cancel-multiple')
        .send({ jobIds: ['job-1', 'job-2'] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveLength(2);
      expect(response.body.data.results[0].success).toBe(true);
      expect(response.body.data.results[1].success).toBe(false);
      expect(response.body.data.results[1].error).toContain('Cannot cancel job with status');
      expect(response.body.data.summary.successful).toBe(1);
      expect(response.body.data.summary.failed).toBe(1);
    });

    it('should validate job IDs array', async () => {
      const response = await request(app)
        .post('/api/reports/jobs/cancel-multiple')
        .send({ jobIds: [] });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Job IDs array is required');
    });

    it('should handle non-existent jobs', async () => {
      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/reports/jobs/cancel-multiple')
        .send({ jobIds: ['non-existent'] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results[0].success).toBe(false);
      expect(response.body.data.results[0].error).toBe('Job not found');
    });

    it('should handle access denied for other users jobs', async () => {
      const mockJob = { id: 'job-1', userId: 2, status: ExportStatus.PENDING }; // Different user

      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(mockJob);

      const response = await request(app)
        .post('/api/reports/jobs/cancel-multiple')
        .send({ jobIds: ['job-1'] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results[0].success).toBe(false);
      expect(response.body.data.results[0].error).toBe('Access denied');
    });
  });

  describe('Admin access', () => {
    it('should allow admin to see all users in job history', async () => {
      // Create admin app
      const adminApp = express();
      adminApp.use(express.json());
      adminApp.use((req, res, next) => {
        (req as any).user = { id: 1, role: 'admin' };
        next();
      });
      adminApp.get('/api/reports/jobs/history', getJobsHistory);

      const mockJobs = [
        { id: 'job-1', userId: 1, status: ExportStatus.COMPLETED, files: [] },
        { id: 'job-2', userId: 2, status: ExportStatus.COMPLETED, files: [] }
      ];

      (mockJobLifecycleService.getUserJobHistory as jest.Mock).mockResolvedValue(mockJobs);

      const response = await request(adminApp)
        .get('/api/reports/jobs/history');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.jobs).toHaveLength(2);
      expect(response.body.data.jobs[0].userId).toBe(1);
      expect(response.body.data.jobs[1].userId).toBe(2);
      expect(mockJobLifecycleService.getUserJobHistory).toHaveBeenCalledWith(
        undefined, // Admin sees all users
        expect.any(Object)
      );
    });
  });
});