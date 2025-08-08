import request from 'supertest';
import express from 'express';
import {
  getJobStatus,
  getJobHistory,
  getQueueStatus,
  bulkJobActions,
  updateJobPriority,
  getJobLogs
} from '../controllers/reports/jobs.controller';
import { jobLifecycleService } from '../services/reports/jobLifecycle.service';
import { jobQueueService } from '../services/reports/jobQueue.service';
import { ExportStatus, ExportFormat } from '@prisma/client';

// Mock the services
jest.mock('../services/reports/jobLifecycle.service');
jest.mock('../services/reports/jobQueue.service');

const mockJobLifecycleService = jobLifecycleService as jest.Mocked<typeof jobLifecycleService>;
const mockJobQueueService = jobQueueService as jest.Mocked<typeof jobQueueService>;

describe('Jobs Controller', () => {
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
    app.get('/api/jobs/:jobId/status', getJobStatus);
    app.get('/api/jobs/:jobId/logs', getJobLogs);
    app.get('/api/jobs/history', getJobHistory);
    app.get('/api/queue/status', getQueueStatus);
    app.put('/api/jobs/:jobId/priority', updateJobPriority);
    app.post('/api/jobs/bulk-actions', bulkJobActions);

    jest.clearAllMocks();
  });

  describe('GET /api/jobs/:jobId/status', () => {
    it('should return detailed job status successfully', async () => {
      const mockJobWithFiles = {
        id: 'job-123',
        templateId: 'inventory',
        format: ExportFormat.PDF,
        status: ExportStatus.PROCESSING,
        progress: 75,
        userId: 1,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        startedAt: new Date('2024-01-01T10:01:00Z'),
        completedAt: null,
        failedAt: null,
        errorMessage: null,
        parameters: { dateRange: { from: '2024-01-01', to: '2024-01-31' } },
        options: { includeCharts: true },
        files: [
          {
            id: 'file-123',
            fileName: 'inventory-report.pdf',
            fileSize: BigInt(1024000),
            downloadCount: 2,
            createdAt: new Date('2024-01-01T10:05:00Z')
          }
        ]
      };

      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(mockJobWithFiles);

      const response = await request(app)
        .get('/api/jobs/job-123/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('job-123');
      expect(response.body.data.status).toBe(ExportStatus.PROCESSING);
      expect(response.body.data.progress).toBe(75);
      expect(response.body.data.estimatedCompletion).toBeDefined();
      expect(response.body.data.timeRemaining).toBeDefined();
      expect(response.body.data.files).toHaveLength(1);
      expect(response.body.data.canCancel).toBe(true);
      expect(response.body.data.canRetry).toBe(false);
    });

    it('should return 404 for non-existent job', async () => {
      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/jobs/non-existent/status');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Job not found');
    });

    it('should return 403 for unauthorized access', async () => {
      const mockJob = {
        id: 'job-123',
        userId: 2, // Different user
        status: ExportStatus.COMPLETED
      };

      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(mockJob);

      const response = await request(app)
        .get('/api/jobs/job-123/status');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied to this job');
    });
  });

  describe('GET /api/jobs/history', () => {
    it('should return job history with filtering and pagination', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          templateId: 'inventory',
          format: ExportFormat.PDF,
          status: ExportStatus.COMPLETED,
          progress: 100,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          startedAt: new Date('2024-01-01T10:01:00Z'),
          completedAt: new Date('2024-01-01T10:05:00Z'),
          failedAt: null,
          errorMessage: null,
          parameters: {},
          files: [
            {
              id: 'file-1',
              fileName: 'report.pdf',
              fileSize: BigInt(1024),
              downloadCount: 3
            }
          ]
        },
        {
          id: 'job-2',
          templateId: 'financial',
          format: ExportFormat.EXCEL,
          status: ExportStatus.FAILED,
          progress: 50,
          createdAt: new Date('2024-01-02T10:00:00Z'),
          startedAt: new Date('2024-01-02T10:01:00Z'),
          completedAt: null,
          failedAt: new Date('2024-01-02T10:03:00Z'),
          errorMessage: 'Processing error',
          parameters: {},
          files: []
        }
      ];

      (mockJobLifecycleService.getUserJobHistory as jest.Mock).mockResolvedValue(mockJobs);

      const response = await request(app)
        .get('/api/jobs/history')
        .query({
          status: 'COMPLETED',
          format: 'PDF',
          limit: 10,
          offset: 0,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.jobs).toHaveLength(2);
      expect(response.body.data.summary.total).toBe(2);
      expect(response.body.data.summary.byStatus).toHaveProperty('COMPLETED');
      expect(response.body.data.summary.byStatus).toHaveProperty('FAILED');
      expect(response.body.data.pagination.total).toBe(2);
      expect(response.body.data.filters.status).toBe('COMPLETED');
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/jobs/history')
        .query({ limit: 'invalid', status: 'INVALID_STATUS' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid query parameters');
    });
  });

  describe('GET /api/queue/status', () => {
    it('should return queue status for admin users', async () => {
      // Create admin app
      const adminApp = express();
      adminApp.use(express.json());
      adminApp.use((req, res, next) => {
        (req as any).user = { id: 1, role: 'admin' };
        next();
      });
      adminApp.get('/api/queue/status', getQueueStatus);

      const mockQueueStats = {
        queueLength: 5,
        processingCount: 2,
        maxConcurrent: 3,
        isProcessing: true
      };

      const mockPendingJobs = [
        {
          id: 'job-1',
          templateId: 'inventory',
          format: ExportFormat.PDF,
          userId: 1,
          createdAt: new Date(),
          parameters: {}
        }
      ];

      (mockJobQueueService.getQueueStats as jest.Mock).mockReturnValue(mockQueueStats);
      (mockJobLifecycleService.getUserJobHistory as jest.Mock).mockResolvedValue(mockPendingJobs);

      const response = await request(adminApp)
        .get('/api/queue/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics.queueLength).toBe(5);
      expect(response.body.data.statistics.processingCount).toBe(2);
      expect(response.body.data.recentJobs).toHaveLength(1);
      expect(response.body.data.health.status).toBe('healthy');
    });

    it('should deny access for non-admin users', async () => {
      const response = await request(app)
        .get('/api/queue/status');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Admin access required');
    });
  });

  describe('POST /api/jobs/bulk-actions', () => {
    it('should perform bulk cancel action successfully', async () => {
      const mockJobs = [
        { id: 'job-1', userId: 1, status: ExportStatus.PENDING },
        { id: 'job-2', userId: 1, status: ExportStatus.PROCESSING }
      ];

      (mockJobLifecycleService.getJobDetails as jest.Mock)
        .mockResolvedValueOnce(mockJobs[0])
        .mockResolvedValueOnce(mockJobs[1]);
      (mockJobLifecycleService.cancelJob as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post('/api/jobs/bulk-actions')
        .send({
          jobIds: ['job-1', 'job-2'],
          action: 'cancel'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results.successful).toHaveLength(2);
      expect(response.body.data.results.failed).toHaveLength(0);
      expect(response.body.data.summary.total).toBe(2);
      expect(response.body.data.summary.successful).toBe(2);
    });

    it('should validate request parameters', async () => {
      const response = await request(app)
        .post('/api/jobs/bulk-actions')
        .send({
          jobIds: [], // Empty array
          action: 'invalid_action'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request parameters');
    });
  });

  describe('PUT /api/jobs/:jobId/priority', () => {
    it('should update job priority successfully', async () => {
      const mockJob = {
        id: 'job-123',
        userId: 1,
        status: ExportStatus.PENDING
      };

      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(mockJob);

      const response = await request(app)
        .put('/api/jobs/job-123/priority')
        .send({ priority: 'HIGH' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.jobId).toBe('job-123');
      expect(response.body.data.priority).toBe('HIGH');
    });

    it('should not allow priority update for non-pending jobs', async () => {
      const mockJob = {
        id: 'job-123',
        userId: 1,
        status: ExportStatus.PROCESSING
      };

      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(mockJob);

      const response = await request(app)
        .put('/api/jobs/job-123/priority')
        .send({ priority: 'HIGH' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cannot update priority for job with status: PROCESSING');
    });

    it('should validate priority values', async () => {
      const response = await request(app)
        .put('/api/jobs/job-123/priority')
        .send({ priority: 'INVALID_PRIORITY' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid priority value');
    });
  });

  describe('GET /api/jobs/:jobId/logs', () => {
    it('should return job logs successfully', async () => {
      const mockJob = {
        id: 'job-123',
        userId: 1,
        templateId: 'inventory',
        format: ExportFormat.PDF,
        status: ExportStatus.COMPLETED,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        startedAt: new Date('2024-01-01T10:01:00Z'),
        completedAt: new Date('2024-01-01T10:05:00Z'),
        failedAt: null,
        errorMessage: null,
        files: [{ id: 'file-1' }]
      };

      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(mockJob);

      const response = await request(app)
        .get('/api/jobs/job-123/logs')
        .query({ level: 'info', limit: 50 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.jobId).toBe('job-123');
      expect(response.body.data.logs).toBeDefined();
      expect(response.body.data.logs.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should deny access to unauthorized users', async () => {
      const mockJob = {
        id: 'job-123',
        userId: 2, // Different user
        status: ExportStatus.COMPLETED
      };

      (mockJobLifecycleService.getJobDetails as jest.Mock).mockResolvedValue(mockJob);

      const response = await request(app)
        .get('/api/jobs/job-123/logs');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied to this job');
    });
  });
});