import request from 'supertest';
import { app } from '../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Reports Integration End-to-End', () => {
  let authToken: string;

  beforeAll(async () => {
    // Get auth token for testing
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@sumaquywa.com',
        password: 'admin123'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Financial Report Generation with Real Data', () => {
    it('should generate financial report with ReportDataService integration', async () => {
      // Create export job
      const exportResponse = await request(app)
        .post('/api/reports/export/financial')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'PDF',
          parameters: {
            dateRange: {
              from: '2024-01-01',
              to: '2024-12-31'
            }
          },
          options: {
            includeCharts: true,
            includeDetails: true
          }
        });

      expect(exportResponse.status).toBe(202);
      expect(exportResponse.body.success).toBe(true);
      expect(exportResponse.body.data.jobId).toBeDefined();
      expect(exportResponse.body.data.templateId).toBe('financial');
      expect(exportResponse.body.data.format).toBe('PDF');

      const jobId = exportResponse.body.data.jobId;

      // Wait a bit for job processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check job status
      const statusResponse = await request(app)
        .get(`/api/reports/status/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data.id).toBe(jobId);
      
      // Job should be completed or processing (depending on timing)
      expect(['COMPLETED', 'PROCESSING', 'PENDING']).toContain(statusResponse.body.data.status);

      console.log('✅ Financial report job created and processing with ReportDataService');
      console.log(`📊 Job Status: ${statusResponse.body.data.status}`);
      console.log(`📈 Progress: ${statusResponse.body.data.progress}%`);
      
      if (statusResponse.body.data.files && statusResponse.body.data.files.length > 0) {
        console.log(`📄 Generated file: ${statusResponse.body.data.files[0].fileName}`);
      }
    }, 10000); // Increase timeout for job processing

    it('should handle different report types correctly', async () => {
      const reportTypes = ['inventory', 'reproductive', 'health'];
      
      for (const templateId of reportTypes) {
        const exportResponse = await request(app)
          .post(`/api/reports/export/${templateId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            format: 'CSV',
            parameters: {},
            options: {
              includeCharts: false,
              includeDetails: true
            }
          });

        expect(exportResponse.status).toBe(202);
        expect(exportResponse.body.success).toBe(true);
        expect(exportResponse.body.data.templateId).toBe(templateId);
        
        console.log(`✅ ${templateId} report job created successfully`);
      }
    });
  });

  describe('Report Templates', () => {
    it('should return available report templates', async () => {
      const templatesResponse = await request(app)
        .get('/api/reports/templates')
        .set('Authorization', `Bearer ${authToken}`);

      expect(templatesResponse.status).toBe(200);
      expect(templatesResponse.body.success).toBe(true);
      expect(templatesResponse.body.data).toBeInstanceOf(Array);
      expect(templatesResponse.body.data.length).toBeGreaterThan(0);

      const templateIds = templatesResponse.body.data.map((t: any) => t.id);
      expect(templateIds).toContain('financial');
      expect(templateIds).toContain('inventory');
      expect(templateIds).toContain('reproductive');
      expect(templateIds).toContain('health');

      console.log('✅ Report templates available:', templateIds);
    });
  });

  describe('Reports Statistics', () => {
    it('should return reports statistics', async () => {
      const statsResponse = await request(app)
        .get('/api/reports/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data).toBeDefined();
      expect(statsResponse.body.data.jobs).toBeDefined();
      expect(statsResponse.body.data.files).toBeDefined();
      expect(statsResponse.body.data.queue).toBeDefined();

      console.log('✅ Reports statistics retrieved successfully');
      console.log(`📊 Active jobs: ${statsResponse.body.data.queue.activeJobs}`);
      console.log(`⏳ Waiting jobs: ${statsResponse.body.data.queue.waitingJobs}`);
    });
  });
});