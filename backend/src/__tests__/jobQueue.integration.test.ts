import { JobQueueService } from '../services/reports/jobQueue.service';
import { ExportJobData } from '../types/export.types';
import { ExportFormat, ExportStatus } from '@prisma/client';

// Mock all dependencies
jest.mock('../services/reports/reports.service', () => ({
  reportsService: {
    updateJob: jest.fn(),
    createExportFile: jest.fn(),
    getJobStatus: jest.fn(),
    getExportStats: jest.fn().mockResolvedValue({
      completedJobs: 0,
      failedJobs: 0,
      totalJobs: 0
    })
  }
}));

jest.mock('../services/reports/fileGenerator.service', () => ({
  fileGeneratorService: {
    generateFile: jest.fn().mockResolvedValue({
      fileName: 'test-report.pdf',
      filePath: '/tmp/test-report.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf'
    })
  }
}));

jest.mock('../services/reports/reportData.service', () => ({
  reportDataService: {
    getFinancialReportData: jest.fn(),
    getInventoryReportData: jest.fn(),
    getReproductiveReportData: jest.fn(),
    getHealthReportData: jest.fn()
  }
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('JobQueue Integration with ReportDataService', () => {
  let jobQueueService: JobQueueService;
  let mockReportDataService: any;
  let mockReportsService: any;
  let mockFileGeneratorService: unknown;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Get mocked services
    mockReportDataService = require('../services/reports/reportData.service').reportDataService;
    mockReportsService = require('../services/reports/reports.service').reportsService;
    mockFileGeneratorService = require('../services/reports/fileGenerator.service').fileGeneratorService;
    
    // Create new instance
    jobQueueService = new JobQueueService();
    
    // Stop processing to control execution manually
    jobQueueService.stopProcessing();
  });

  afterEach(async () => {
    await jobQueueService.cleanup();
  });

  describe('Financial Report Integration', () => {
    it('should use ReportDataService for financial reports', async () => {
      // Mock financial report data
      const mockFinancialData = {
        templateId: 'financial',
        generatedAt: new Date().toISOString(),
        summary: {
          totalIncome: 1500.00,
          totalExpenses: 500.00,
          netProfit: 1000.00,
          profitMargin: 66.67,
          salesCount: 5,
          expensesCount: 3
        },
        sales: [
          {
            id: '1',
            fecha: new Date('2024-01-15'),
            total: 300.00,
            cliente: { nombre: 'Cliente Test' }
          }
        ],
        expenses: [
          {
            id: '1',
            fecha: new Date('2024-01-10'),
            concepto: 'Alimento',
            monto: 100.00,
            categoria: 'Alimentación'
          }
        ],
        charts: [],
        trends: {
          monthlyIncome: [],
          monthlyExpenses: [],
          profitTrend: []
        }
      };

      mockReportDataService.getFinancialReportData.mockResolvedValue(mockFinancialData);
      mockReportsService.updateJob.mockResolvedValue({});
      mockReportsService.createExportFile.mockResolvedValue({});

      const testJob: ExportJobData = {
        id: 'test-job-1',
        userId: 1,
        templateId: 'financial',
        format: ExportFormat.PDF,
        status: ExportStatus.PENDING,
        parameters: {
          dateRange: {
            from: '2024-01-01',
            to: '2024-01-31'
          }
        },
        options: {},
        progress: 0,
        createdAt: new Date()
      };

      // Add job to queue
      await jobQueueService.addJob(testJob);

      // Process the job manually
      await jobQueueService.processNextJob();

      // Wait a bit for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify ReportDataService was called with correct parameters
      expect(mockReportDataService.getFinancialReportData).toHaveBeenCalledWith({
        dateRange: {
          from: '2024-01-01',
          to: '2024-01-31'
        }
      });

      // Verify file generator was called with real data
      expect((mockFileGeneratorService as any).generateFile).toHaveBeenCalledWith(
        mockFinancialData,
        expect.objectContaining({
          format: ExportFormat.PDF,
          outputDirectory: 'uploads/reports',
          fileName: 'financial_test-job-1'
        })
      );

      // Verify job status updates
      expect(mockReportsService.updateJob).toHaveBeenCalledWith('test-job-1', {
        status: ExportStatus.PROCESSING,
        progress: 0,
        startedAt: expect.any(Date)
      });

      expect(mockReportsService.updateJob).toHaveBeenCalledWith('test-job-1', {
        progress: 10
      });

      expect(mockReportsService.updateJob).toHaveBeenCalledWith('test-job-1', {
        progress: 30
      });
    });

    it('should handle financial report data errors gracefully', async () => {
      // Mock error in ReportDataService - use non-retryable error
      const testError = new Error('Invalid data format');
      mockReportDataService.getFinancialReportData.mockRejectedValue(testError);
      mockReportsService.updateJob.mockResolvedValue({});

      const testJob: ExportJobData = {
        id: 'test-job-error',
        userId: 1,
        templateId: 'financial',
        format: ExportFormat.PDF,
        status: ExportStatus.PENDING,
        parameters: {},
        options: {},
        progress: 0,
        createdAt: new Date()
      };

      // Add job to queue
      await jobQueueService.addJob(testJob);

      // Process the job manually
      await jobQueueService.processNextJob();

      // Wait a bit for async operations
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify error handling - check that the job was eventually marked as failed
      const updateCalls = mockReportsService.updateJob.mock.calls;
      const failedCall = updateCalls.find(call => 
        call[0] === 'test-job-error' && 
        call[1].status === ExportStatus.FAILED
      );

      expect(failedCall).toBeDefined();
      expect(failedCall[1]).toEqual({
        status: ExportStatus.FAILED,
        errorMessage: 'Failed to generate report data: Invalid data format',
        completedAt: expect.any(Date)
      });
    });
  });

  describe('Multiple Report Types Integration', () => {
    it('should route different template types to correct ReportDataService methods', async () => {
      const mockInventoryData = {
        templateId: 'inventory',
        generatedAt: new Date().toISOString(),
        summary: { totalCuyes: 100 },
        cuyes: [],
        galpones: [],
        distribution: [],
        alerts: [],
        charts: []
      };

      const mockReproductiveData = {
        templateId: 'reproductive',
        generatedAt: new Date().toISOString(),
        summary: { activePregnancies: 5 },
        pregnancies: [],
        litters: [],
        projections: [],
        statistics: [],
        charts: []
      };

      const mockHealthData = {
        templateId: 'health',
        generatedAt: new Date().toISOString(),
        summary: { totalTreatments: 10 },
        treatments: [],
        charts: []
      };

      mockReportDataService.getInventoryReportData.mockResolvedValue(mockInventoryData);
      mockReportDataService.getReproductiveReportData.mockResolvedValue(mockReproductiveData);
      mockReportDataService.getHealthReportData.mockResolvedValue(mockHealthData);
      mockReportsService.updateJob.mockResolvedValue({});
      mockReportsService.createExportFile.mockResolvedValue({});

      const jobs = [
        {
          id: 'inventory-job',
          templateId: 'inventory',
          expectedMethod: 'getInventoryReportData'
        },
        {
          id: 'reproductive-job',
          templateId: 'reproductive',
          expectedMethod: 'getReproductiveReportData'
        },
        {
          id: 'health-job',
          templateId: 'health',
          expectedMethod: 'getHealthReportData'
        }
      ];

      for (const jobConfig of jobs) {
        const testJob: ExportJobData = {
          id: jobConfig.id,
          userId: 1,
          templateId: jobConfig.templateId,
          format: ExportFormat.PDF,
          status: ExportStatus.PENDING,
          parameters: {},
          options: {},
          progress: 0,
          createdAt: new Date()
        };

        await jobQueueService.addJob(testJob);
        await jobQueueService.processNextJob();
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Verify each method was called
      expect(mockReportDataService.getInventoryReportData).toHaveBeenCalledWith({});
      expect(mockReportDataService.getReproductiveReportData).toHaveBeenCalledWith({});
      expect(mockReportDataService.getHealthReportData).toHaveBeenCalledWith({});
    });

    it('should handle unknown template types with fallback data', async () => {
      mockReportsService.updateJob.mockResolvedValue({});
      mockReportsService.createExportFile.mockResolvedValue({});

      const testJob: ExportJobData = {
        id: 'unknown-job',
        userId: 1,
        templateId: 'unknown-template',
        format: ExportFormat.PDF,
        status: ExportStatus.PENDING,
        parameters: {},
        options: {},
        progress: 0,
        createdAt: new Date()
      };

      await jobQueueService.addJob(testJob);
      await jobQueueService.processNextJob();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify file generator was called with fallback data
      expect((mockFileGeneratorService as any).generateFile).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: 'unknown-template',
          data: {
            summary: {},
            details: [],
            charts: []
          }
        }),
        expect.any(Object)
      );

      // Verify none of the specific report methods were called
      expect(mockReportDataService.getFinancialReportData).not.toHaveBeenCalled();
      expect(mockReportDataService.getInventoryReportData).not.toHaveBeenCalled();
      expect(mockReportDataService.getReproductiveReportData).not.toHaveBeenCalled();
      expect(mockReportDataService.getHealthReportData).not.toHaveBeenCalled();
    });
  });

  describe('Parameter Passing', () => {
    it('should pass job parameters correctly to ReportDataService', async () => {
      const testParameters = {
        dateRange: {
          from: '2024-01-01',
          to: '2024-12-31'
        },
        galpon: 'galpon-1',
        etapaVida: 'adulto',
        categoria: 'alimentacion'
      };

      mockReportDataService.getFinancialReportData.mockResolvedValue({
        templateId: 'financial',
        generatedAt: new Date().toISOString(),
        summary: {},
        sales: [],
        expenses: [],
        charts: [],
        trends: { monthlyIncome: [], monthlyExpenses: [], profitTrend: [] }
      });
      mockReportsService.updateJob.mockResolvedValue({});
      mockReportsService.createExportFile.mockResolvedValue({});

      const testJob: ExportJobData = {
        id: 'param-test-job',
        userId: 1,
        templateId: 'financial',
        format: ExportFormat.EXCEL,
        status: ExportStatus.PENDING,
        parameters: testParameters,
        options: {},
        progress: 0,
        createdAt: new Date()
      };

      await jobQueueService.addJob(testJob);
      await jobQueueService.processNextJob();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify parameters were passed correctly
      expect(mockReportDataService.getFinancialReportData).toHaveBeenCalledWith(testParameters);
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('should retry jobs when ReportDataService fails with retryable error', async () => {
      const retryableError = new Error('Database connection timeout');
      mockReportDataService.getFinancialReportData
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce({
          templateId: 'financial',
          generatedAt: new Date().toISOString(),
          summary: {},
          sales: [],
          expenses: [],
          charts: [],
          trends: { monthlyIncome: [], monthlyExpenses: [], profitTrend: [] }
        });
      
      mockReportsService.updateJob.mockResolvedValue({});
      mockReportsService.createExportFile.mockResolvedValue({});

      const testJob: ExportJobData = {
        id: 'retry-test-job',
        userId: 1,
        templateId: 'financial',
        format: ExportFormat.PDF,
        status: ExportStatus.PENDING,
        parameters: {},
        options: {},
        progress: 0,
        createdAt: new Date()
      };

      await jobQueueService.addJob(testJob);
      await jobQueueService.processNextJob();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify first attempt failed and job was marked for retry
      expect(mockReportsService.updateJob).toHaveBeenCalledWith('retry-test-job', {
        status: ExportStatus.PENDING,
        progress: 0,
        errorMessage: expect.stringContaining('Retry 1/3')
      });
    });
  });
});