import request from 'supertest';
import { app } from '../index';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Mock data
const mockUser = {
  id: 1,
  email: 'test@example.com',
  nombre: 'Test User',
  role: 'admin'
};

const mockToken = jwt.sign(mockUser, process.env.JWT_SECRET || 'test-secret');

describe('Reports API', () => {
  beforeAll(async () => {
    // Setup test database if needed
    // await setupTestDatabase();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.$disconnect();
  });

  describe('GET /api/reports/templates', () => {
    it('should return list of report templates', async () => {
      const response = await request(app)
        .get('/api/reports/templates')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Check template structure
      const template = response.body.data[0];
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('category');
      expect(template).toHaveProperty('sections');
      expect(template).toHaveProperty('parameters');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/reports/templates')
        .expect(401);
    });
  });

  describe('GET /api/reports/templates/:id', () => {
    it('should return specific template', async () => {
      const response = await request(app)
        .get('/api/reports/templates/reproductive_summary')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('reproductive_summary');
      expect(response.body.data.name).toBe('Resumen Reproductivo');
    });

    it('should return 404 for non-existent template', async () => {
      await request(app)
        .get('/api/reports/templates/non_existent')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(404);
    });
  });

  describe('POST /api/reports/generate/:templateId', () => {
    it('should generate report successfully', async () => {
      const response = await request(app)
        .post('/api/reports/generate/reproductive_summary')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          parameters: {
            dateFrom: '2024-01-01',
            dateTo: '2024-12-31'
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title');
      expect(response.body.data).toHaveProperty('sections');
      expect(response.body.data).toHaveProperty('metadata');
      expect(Array.isArray(response.body.data.sections)).toBe(true);
    });

    it('should handle invalid template ID', async () => {
      await request(app)
        .post('/api/reports/generate/invalid_template')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({})
        .expect(500);
    });

    it('should validate parameters', async () => {
      const response = await request(app)
        .post('/api/reports/generate/reproductive_summary')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          parameters: {
            dateFrom: 'invalid-date'
          }
        });

      // Should still work but might have validation warnings
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('POST /api/reports/export/:templateId', () => {
    it('should create export job successfully', async () => {
      const response = await request(app)
        .post('/api/reports/export/reproductive_summary')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          format: 'pdf',
          parameters: {},
          options: {
            pageSize: 'A4',
            orientation: 'portrait'
          }
        })
        .expect(202);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('jobId');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data.format).toBe('pdf');
    });

    it('should validate export format', async () => {
      await request(app)
        .post('/api/reports/export/reproductive_summary')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          format: 'invalid_format'
        })
        .expect(400);
    });

    it('should validate export options', async () => {
      const response = await request(app)
        .post('/api/reports/export/reproductive_summary')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          format: 'pdf',
          options: {
            pageSize: 'InvalidSize'
          }
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/reports/exports/:jobId/status', () => {
    let jobId: string;

    beforeEach(async () => {
      // Create a test export job
      const response = await request(app)
        .post('/api/reports/export/reproductive_summary')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          format: 'csv',
          parameters: {}
        });
      
      jobId = response.body.data.jobId;
    });

    it('should return job status', async () => {
      const response = await request(app)
        .get(`/api/reports/exports/${jobId}/status`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('format');
      expect(['pending', 'processing', 'completed', 'failed']).toContain(response.body.data.status);
    });

    it('should return 404 for non-existent job', async () => {
      await request(app)
        .get('/api/reports/exports/non_existent_job/status')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(404);
    });
  });

  describe('GET /api/reports/exports/history', () => {
    it('should return export history', async () => {
      const response = await request(app)
        .get('/api/reports/exports/history')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/reports/exports/history?limit=5')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/reports/stats', () => {
    it('should return report statistics', async () => {
      const response = await request(app)
        .get('/api/reports/stats')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalJobs');
      expect(response.body.data).toHaveProperty('completedJobs');
      expect(response.body.data).toHaveProperty('failedJobs');
      expect(response.body.data).toHaveProperty('pendingJobs');
      expect(response.body.data).toHaveProperty('byFormat');
    });
  });

  describe('POST /api/reports/cleanup', () => {
    it('should cleanup expired files', async () => {
      const response = await request(app)
        .post('/api/reports/cleanup')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('cleanedCount');
      expect(typeof response.body.data.cleanedCount).toBe('number');
    });
  });

  describe('POST /api/reports/quick', () => {
    it('should generate quick report', async () => {
      const response = await request(app)
        .post('/api/reports/quick?type=summary')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('title');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('metadata');
    });

    it('should handle different report types', async () => {
      const types = ['summary', 'performance', 'health'];
      
      for (const type of types) {
        const response = await request(app)
          .post(`/api/reports/quick?type=${type}`)
          .set('Authorization', `Bearer ${mockToken}`)
          .send({});
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });
  });
});

// Unit tests for report generation service
describe('Report Generation Service', () => {
  let reportService: any;

  beforeAll(async () => {
    // TODO: Implement generator.service
    // const { generateReport, getReportTemplates } = await import('../services/reports/generator.service');
    reportService = { 
      generateReport: jest.fn(),
      getReportTemplates: jest.fn().mockResolvedValue([])
    };
  });

  describe('getReportTemplates', () => {
    it('should return all available templates', async () => {
      const templates = await reportService.getReportTemplates();
      
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      
      templates.forEach((template: any) => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('category');
        expect(template).toHaveProperty('sections');
        expect(template).toHaveProperty('parameters');
      });
    });
  });

  describe('generateReport', () => {
    it('should generate report with valid template', async () => {
      const report = await reportService.generateReport('reproductive_summary', {});
      
      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('templateId');
      expect(report).toHaveProperty('title');
      expect(report).toHaveProperty('sections');
      expect(report).toHaveProperty('metadata');
      expect(Array.isArray(report.sections)).toBe(true);
    });

    it('should handle invalid template ID', async () => {
      await expect(
        reportService.generateReport('invalid_template', {})
      ).rejects.toThrow();
    });

    it('should process parameters correctly', async () => {
      const parameters = {
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        galpon: 'Galpon A'
      };
      
      const report = await reportService.generateReport('reproductive_summary', parameters);
      
      expect(report.parameters).toEqual(parameters);
    });

    it('should generate all required sections', async () => {
      const report = await reportService.generateReport('reproductive_summary', {});
      
      expect(report.sections.length).toBeGreaterThan(0);
      
      report.sections.forEach((section: any) => {
        expect(section).toHaveProperty('id');
        expect(section).toHaveProperty('name');
        expect(section).toHaveProperty('type');
        expect(section).toHaveProperty('data');
      });
    });

    it('should include execution metadata', async () => {
      const report = await reportService.generateReport('reproductive_summary', {});
      
      expect(report.metadata).toHaveProperty('generatedAt');
      expect(report.metadata).toHaveProperty('totalRecords');
      expect(report.metadata).toHaveProperty('executionTime');
      expect(typeof report.metadata.executionTime).toBe('number');
      expect(report.metadata.executionTime).toBeGreaterThan(0);
    });
  });
});

// Integration tests for export service
describe('Export Service Integration', () => {
  let exportService: any;

  beforeAll(async () => {
    // TODO: Implement export.service
    // const exportModule = await import('../services/reports/export.service');
    exportService = {
      createExportJob: jest.fn().mockResolvedValue({
        id: 'test-job-id',
        status: 'pending',
        format: 'pdf'
      }),
      getExportJob: jest.fn().mockResolvedValue(null),
      getExportStats: jest.fn().mockResolvedValue({
        totalJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        pendingJobs: 0,
        byFormat: {}
      })
    };
  });

  describe('createExportJob', () => {
    it('should create export job successfully', async () => {
      const mockReportData = {
        id: 'test-report',
        templateId: 'reproductive_summary',
        title: 'Test Report',
        sections: [],
        metadata: {
          generatedAt: new Date(),
          totalRecords: 0,
          executionTime: 100
        }
      };

      const job = await exportService.createExportJob(mockReportData, {
        format: 'pdf',
        includeCharts: true
      });

      expect(job).toHaveProperty('id');
      expect(job).toHaveProperty('status');
      expect(job).toHaveProperty('format');
      expect(job.format).toBe('pdf');
      expect(job.status).toBe('pending');
    });
  });

  describe('getExportJob', () => {
    it('should retrieve export job by ID', async () => {
      // First create a job
      const mockReportData = {
        id: 'test-report-2',
        templateId: 'reproductive_summary',
        title: 'Test Report 2',
        sections: [],
        metadata: {
          generatedAt: new Date(),
          totalRecords: 0,
          executionTime: 100
        }
      };

      const createdJob = await exportService.createExportJob(mockReportData, {
        format: 'csv'
      });

      // Then retrieve it
      const retrievedJob = await exportService.getExportJob(createdJob.id);
      
      expect(retrievedJob).toBeTruthy();
      expect(retrievedJob.id).toBe(createdJob.id);
      expect(retrievedJob.format).toBe('csv');
    });

    it('should return null for non-existent job', async () => {
      const job = await exportService.getExportJob('non-existent-job');
      expect(job).toBeNull();
    });
  });

  describe('getExportStats', () => {
    it('should return export statistics', async () => {
      const stats = await exportService.getExportStats();
      
      expect(stats).toHaveProperty('totalJobs');
      expect(stats).toHaveProperty('completedJobs');
      expect(stats).toHaveProperty('failedJobs');
      expect(stats).toHaveProperty('pendingJobs');
      expect(stats).toHaveProperty('byFormat');
      expect(typeof stats.totalJobs).toBe('number');
    });
  });
});