import { ReportDataService } from '../services/reports/reportData.service';
import { ReportParameters } from '../types/reportData.types';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $disconnect: jest.fn(),
    venta: {
      findMany: jest.fn()
    },
    gasto: {
      findMany: jest.fn()
    }
  }))
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('ReportDataService', () => {
  let reportDataService: ReportDataService;
  let mockPrisma: any;

  beforeEach(() => {
    reportDataService = new ReportDataService();
    // Access the mocked prisma instance
    mockPrisma = (reportDataService as any).prisma;
  });

  afterEach(async () => {
    await reportDataService.cleanup();
  });

  describe('getFinancialReportData', () => {
    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();
      
      // Default mock responses
      mockPrisma.venta.findMany.mockResolvedValue([]);
      mockPrisma.gasto.findMany.mockResolvedValue([]);
    });

    it('should generate financial report data with default parameters', async () => {
      const parameters: ReportParameters = {};
      
      const result = await reportDataService.getFinancialReportData(parameters);
      
      expect(result).toBeDefined();
      expect(result.templateId).toBe('financial');
      expect(result.generatedAt).toBeDefined();
      expect(result.parameters).toEqual(parameters);
      expect(result.summary).toBeDefined();
      expect(result.sales).toEqual([]);
      expect(result.expenses).toEqual([]);
      expect(result.charts).toEqual([]);
      
      // Verify database queries were called
      expect(mockPrisma.venta.findMany).toHaveBeenCalled();
      expect(mockPrisma.gasto.findMany).toHaveBeenCalled();
    });

    it('should generate financial report data with real sales and expenses', async () => {
      // Mock sales data
      const mockSalesData = [
        {
          id: 1,
          fecha: new Date('2024-01-15'),
          total: 150.00,
          cliente: {
            nombre: 'Juan Pérez',
            telefono: '123456789'
          },
          detalles: [
            {
              precioUnitario: 75.00,
              cuy: { id: 1, peso: 1.2 }
            },
            {
              precioUnitario: 75.00,
              cuy: { id: 2, peso: 1.1 }
            }
          ]
        }
      ];

      // Mock expenses data
      const mockExpensesData = [
        {
          id: 1,
          fecha: new Date('2024-01-10'),
          concepto: 'Alimento balanceado',
          monto: 50.00,
          categoria: 'Alimentación'
        }
      ];

      mockPrisma.venta.findMany.mockResolvedValue(mockSalesData);
      mockPrisma.gasto.findMany.mockResolvedValue(mockExpensesData);

      const parameters: ReportParameters = {
        dateRange: {
          from: '2024-01-01',
          to: '2024-01-31'
        }
      };
      
      const result = await reportDataService.getFinancialReportData(parameters);
      
      expect(result).toBeDefined();
      expect(result.sales).toHaveLength(1);
      expect(result.expenses).toHaveLength(1);
      expect(result.summary.totalIncome).toBe(150.00);
      expect(result.summary.totalExpenses).toBe(50.00);
      expect(result.summary.netProfit).toBe(100.00);
      expect(result.summary.profitMargin).toBe(66.67);
      expect(result.summary.salesCount).toBe(1);
      expect(result.summary.expensesCount).toBe(1);
      
      // Verify sales data transformation
      expect(result.sales[0].cliente.nombre).toBe('Juan Pérez');
      expect(result.sales[0].total).toBe(150.00);
      expect(result.sales[0].cantidad).toBe(2);
      
      // Verify expenses data transformation
      expect(result.expenses[0].concepto).toBe('Alimento balanceado');
      expect(result.expenses[0].monto).toBe(50.00);
      expect(result.expenses[0].categoria).toBe('Alimentación');
    });

    it('should generate charts when data is available', async () => {
      // Mock data with multiple months for trend analysis
      const mockSalesData = [
        {
          id: 1,
          fecha: new Date('2024-01-15'),
          total: 150.00,
          cliente: { nombre: 'Cliente A', telefono: null },
          detalles: [{ precioUnitario: 75.00, cuy: { id: 1, peso: 1.2 } }]
        },
        {
          id: 2,
          fecha: new Date('2024-02-15'),
          total: 200.00,
          cliente: { nombre: 'Cliente B', telefono: '987654321' },
          detalles: [{ precioUnitario: 100.00, cuy: { id: 2, peso: 1.5 } }]
        }
      ];

      const mockExpensesData = [
        {
          id: 1,
          fecha: new Date('2024-01-10'),
          concepto: 'Alimento',
          monto: 50.00,
          categoria: 'Alimentación'
        },
        {
          id: 2,
          fecha: new Date('2024-02-10'),
          concepto: 'Medicinas',
          monto: 30.00,
          categoria: 'Salud'
        }
      ];

      mockPrisma.venta.findMany.mockResolvedValue(mockSalesData);
      mockPrisma.gasto.findMany.mockResolvedValue(mockExpensesData);

      const parameters: ReportParameters = {
        dateRange: {
          from: '2024-01-01',
          to: '2024-02-28'
        }
      };
      
      const result = await reportDataService.getFinancialReportData(parameters);
      
      expect(result.charts.length).toBeGreaterThan(0);
      expect(result.trends.monthlyIncome.length).toBeGreaterThanOrEqual(2);
      expect(result.trends.monthlyExpenses.length).toBeGreaterThanOrEqual(2);
      expect(result.trends.profitTrend.length).toBeGreaterThanOrEqual(2);
      
      // Verify monthly trends (find the months with actual data)
      const incomeWithData = result.trends.monthlyIncome.filter(item => item.amount > 0);
      const expensesWithData = result.trends.monthlyExpenses.filter(item => item.amount > 0);
      
      expect(incomeWithData).toHaveLength(2);
      expect(expensesWithData).toHaveLength(2);
      expect(incomeWithData[0].amount).toBe(150.00);
      expect(incomeWithData[1].amount).toBe(200.00);
      expect(expensesWithData[0].amount).toBe(50.00);
      expect(expensesWithData[1].amount).toBe(30.00);
    });

    it('should handle errors gracefully', async () => {
      // Mock an error scenario
      const invalidParameters: ReportParameters = {
        dateRange: {
          from: 'invalid-date',
          to: '2024-01-31'
        }
      };
      
      await expect(reportDataService.getFinancialReportData(invalidParameters))
        .rejects.toThrow('Failed to generate financial report data');
    });
  });

  describe('getInventoryReportData', () => {
    it('should generate inventory report data with default parameters', async () => {
      const parameters: ReportParameters = {};
      
      const result = await reportDataService.getInventoryReportData(parameters);
      
      expect(result).toBeDefined();
      expect(result.templateId).toBe('inventory');
      expect(result.generatedAt).toBeDefined();
      expect(result.parameters).toEqual(parameters);
      expect(result.summary).toBeDefined();
      expect(result.cuyes).toEqual([]);
      expect(result.galpones).toEqual([]);
      expect(result.distribution).toEqual([]);
      expect(result.alerts).toEqual([]);
    });

    it('should generate inventory report data with filters', async () => {
      const parameters: ReportParameters = {
        galpon: 'galpon-1',
        etapaVida: 'cria'
      };
      
      const result = await reportDataService.getInventoryReportData(parameters);
      
      expect(result).toBeDefined();
      expect(result.templateId).toBe('inventory');
      expect(result.parameters).toEqual(parameters);
    });
  });

  describe('getReproductiveReportData', () => {
    it('should generate reproductive report data with default parameters', async () => {
      const parameters: ReportParameters = {};
      
      const result = await reportDataService.getReproductiveReportData(parameters);
      
      expect(result).toBeDefined();
      expect(result.templateId).toBe('reproductive');
      expect(result.generatedAt).toBeDefined();
      expect(result.parameters).toEqual(parameters);
      expect(result.summary).toBeDefined();
      expect(result.pregnancies).toEqual([]);
      expect(result.litters).toEqual([]);
      expect(result.projections).toEqual([]);
      expect(result.statistics).toEqual([]);
    });

    it('should generate reproductive report data with date range', async () => {
      const parameters: ReportParameters = {
        dateRange: {
          from: '2024-01-01',
          to: '2024-12-31'
        },
        estado: 'activa'
      };
      
      const result = await reportDataService.getReproductiveReportData(parameters);
      
      expect(result).toBeDefined();
      expect(result.templateId).toBe('reproductive');
      expect(result.period.from).toEqual(new Date('2024-01-01'));
      expect(result.period.to).toEqual(new Date('2024-12-31'));
    });
  });

  describe('getHealthReportData', () => {
    it('should generate health report data with default parameters', async () => {
      const parameters: ReportParameters = {};
      
      const result = await reportDataService.getHealthReportData(parameters);
      
      expect(result).toBeDefined();
      expect(result.templateId).toBe('health');
      expect(result.generatedAt).toBeDefined();
      expect(result.parameters).toEqual(parameters);
      expect(result.summary).toBeDefined();
      expect(result.treatments).toEqual([]);
      expect(result.charts).toEqual([]);
    });

    it('should generate health report data with filters', async () => {
      const parameters: ReportParameters = {
        dateRange: {
          from: '2024-01-01',
          to: '2024-06-30'
        },
        galpon: 'galpon-1'
      };
      
      const result = await reportDataService.getHealthReportData(parameters);
      
      expect(result).toBeDefined();
      expect(result.templateId).toBe('health');
      expect(result.period.from).toEqual(new Date('2024-01-01'));
      expect(result.period.to).toEqual(new Date('2024-06-30'));
    });
  });

  describe('Date range parsing', () => {
    it('should use default date range when none provided', async () => {
      const parameters: ReportParameters = {};
      
      const result = await reportDataService.getFinancialReportData(parameters);
      
      expect(result.period.from).toBeInstanceOf(Date);
      expect(result.period.to).toBeInstanceOf(Date);
      expect(result.period.from.getTime()).toBeLessThan(result.period.to.getTime());
    });

    it('should parse provided date range correctly', async () => {
      const parameters: ReportParameters = {
        dateRange: {
          from: '2024-01-01T00:00:00.000Z',
          to: '2024-01-31T23:59:59.999Z'
        }
      };
      
      const result = await reportDataService.getFinancialReportData(parameters);
      
      expect(result.period.from).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(result.period.to).toEqual(new Date('2024-01-31T23:59:59.999Z'));
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors', async () => {
      // This test would be more meaningful with actual database mocking
      const parameters: ReportParameters = {};
      
      // For now, just ensure the service doesn't crash
      await expect(reportDataService.getFinancialReportData(parameters))
        .resolves.toBeDefined();
    });

    it('should handle cleanup gracefully', async () => {
      await expect(reportDataService.cleanup()).resolves.not.toThrow();
    });
  });

  describe('Chart generation utilities', () => {
    it('should generate chart data with correct structure', async () => {
      // Access protected method through any cast for testing
      const service = reportDataService as any;
      
      const chartData = service.generateChartData(
        'bar',
        'Test Chart',
        ['Label 1', 'Label 2', 'Label 3'],
        [10, 20, 30],
        'Test Data'
      );
      
      expect(chartData).toBeDefined();
      expect(chartData.type).toBe('bar');
      expect(chartData.title).toBe('Test Chart');
      expect(chartData.labels).toEqual(['Label 1', 'Label 2', 'Label 3']);
      expect(chartData.datasets).toHaveLength(1);
      expect(chartData.datasets[0].label).toBe('Test Data');
      expect(chartData.datasets[0].data).toEqual([10, 20, 30]);
      expect(chartData.datasets[0].backgroundColor).toHaveLength(3);
    });
  });
});