import { ExcelGeneratorService } from '../services/reports/excelGenerator.service';
import { ExcelOptions } from '../types/export.types';
import fs from 'fs/promises';

// Mock ExcelJS
jest.mock('exceljs', () => ({
  __esModule: true,
  default: {
    Workbook: jest.fn().mockImplementation(() => ({
      creator: '',
      lastModifiedBy: '',
      created: null,
      modified: null,
      lastPrinted: null,
      addWorksheet: jest.fn().mockReturnValue({
        columns: [],
        addRow: jest.fn().mockReturnValue({
          getCell: jest.fn().mockReturnValue({
            font: {},
            alignment: {},
            fill: {},
            border: {},
            numFmt: '',
            value: null
          }),
          font: {},
          fill: {},
          height: 0,
          number: 1
        }),
        mergeCells: jest.fn(),
        getRow: jest.fn().mockReturnValue({
          font: {},
          fill: {},
          height: 0,
          getCell: jest.fn().mockReturnValue({
            font: {},
            alignment: {},
            fill: {},
            border: {},
            numFmt: '',
            value: null
          })
        }),
        getCell: jest.fn().mockReturnValue({
          border: {}
        }),
        eachRow: jest.fn().mockImplementation((callback) => {
          // Mock a few rows
          for (let i = 1; i <= 3; i++) {
            const mockRow = {
              eachCell: jest.fn().mockImplementation((cellCallback) => {
                // Mock a few cells
                for (let j = 1; j <= 3; j++) {
                  cellCallback({ border: {} }, j);
                }
              })
            };
            callback(mockRow, i);
          }
        }),
        lastRow: { number: 5 },
        autoFilter: null
      }),
      xlsx: {
        writeFile: jest.fn().mockResolvedValue(undefined)
      }
    }))
  }
}));

// Mock fs
jest.mock('fs/promises', () => ({
  stat: jest.fn().mockResolvedValue({ size: 2048 })
}));

describe('ExcelGeneratorService', () => {
  let excelGenerator: ExcelGeneratorService;
  let mockReportData: any;
  let mockOptions: ExcelOptions;

  beforeEach(() => {
    excelGenerator = new ExcelGeneratorService();
    
    mockReportData = {
      templateId: 'reproductive',
      generatedAt: new Date().toISOString(),
      parameters: {
        dateRange: {
          from: '2024-01-01',
          to: '2024-01-31'
        }
      },
      data: {
        summary: {
          totalPreneces: 10,
          prenecesActivas: 5,
          totalCamadas: 8,
          tasaExito: 80.5
        },
        preneces: [
          {
            id: 1,
            madre: 'Madre 1',
            padre: 'Padre 1',
            fechaPrenez: '2024-01-15',
            estado: 'activa'
          }
        ],
        camadas: [
          {
            id: 1,
            madre: 'Madre 1',
            padre: 'Padre 1',
            fechaNacimiento: '2024-01-20',
            numVivos: 3,
            numMuertos: 0
          }
        ],
        charts: [
          {
            type: 'pie',
            title: 'Estado de Preñeces',
            data: [
              { name: 'Activas', value: 5 },
              { name: 'Completadas', value: 3 }
            ]
          }
        ]
      }
    };

    mockOptions = {
      includeCharts: true,
      compression: false,
      multipleSheets: true
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateExcel', () => {
    it('should generate Excel successfully', async () => {
      const outputPath = '/tmp/test-report.xlsx';
      
      const result = await excelGenerator.generateExcel(mockReportData, mockOptions, outputPath);
      
      expect(result).toEqual({
        filePath: outputPath,
        fileSize: 2048
      });
    });

    it('should handle options without charts', async () => {
      const noChartsOptions: ExcelOptions = {
        ...mockOptions,
        includeCharts: false
      };
      
      const outputPath = '/tmp/test-report-no-charts.xlsx';
      
      const result = await excelGenerator.generateExcel(mockReportData, noChartsOptions, outputPath);
      
      expect(result.filePath).toBe(outputPath);
    });

    it('should handle empty data gracefully', async () => {
      const emptyReportData = {
        ...mockReportData,
        data: {
          summary: {},
          preneces: [],
          camadas: [],
          charts: []
        }
      };
      
      const outputPath = '/tmp/test-report-empty.xlsx';
      
      const result = await excelGenerator.generateExcel(emptyReportData, mockOptions, outputPath);
      
      expect(result.filePath).toBe(outputPath);
    });

    it('should handle financial data', async () => {
      const financialReportData = {
        ...mockReportData,
        templateId: 'financial',
        data: {
          ...mockReportData.data,
          ventas: [
            {
              id: 1,
              fecha: '2024-01-15',
              clienteId: 1,
              total: 150.50,
              estadoPago: 'Pagado'
            }
          ],
          gastos: [
            {
              id: 1,
              fecha: '2024-01-10',
              concepto: 'Alimento',
              monto: 50.00,
              categoria: 'Alimentación'
            }
          ]
        }
      };
      
      const outputPath = '/tmp/test-financial-report.xlsx';
      
      const result = await excelGenerator.generateExcel(financialReportData, mockOptions, outputPath);
      
      expect(result.filePath).toBe(outputPath);
    });

    it('should handle inventory data', async () => {
      const inventoryReportData = {
        ...mockReportData,
        templateId: 'inventory',
        data: {
          ...mockReportData.data,
          details: [
            {
              id: 1,
              raza: 'Perú',
              sexo: 'Macho',
              etapaVida: 'Adulto',
              galpon: 'A1',
              jaula: 'J1',
              peso: 800
            }
          ]
        }
      };
      
      const outputPath = '/tmp/test-inventory-report.xlsx';
      
      const result = await excelGenerator.generateExcel(inventoryReportData, mockOptions, outputPath);
      
      expect(result.filePath).toBe(outputPath);
    });

    it('should throw error when Excel generation fails', async () => {
      // Mock ExcelJS to throw error during workbook creation
      const ExcelJS = require('exceljs');
      const originalWorkbook = ExcelJS.default.Workbook;
      
      ExcelJS.default.Workbook = jest.fn().mockImplementation(() => {
        throw new Error('Workbook creation failed');
      });
      
      const outputPath = '/tmp/test-report-error.xlsx';
      
      await expect(
        excelGenerator.generateExcel(mockReportData, mockOptions, outputPath)
      ).rejects.toThrow('Excel generation failed: Workbook creation failed');
      
      // Restore original mock
      ExcelJS.default.Workbook = originalWorkbook;
    });
  });

  describe('Report title generation', () => {
    it('should return correct titles for different templates', () => {
      const getReportTitle = (excelGenerator as any).getReportTitle.bind(excelGenerator);
      
      expect(getReportTitle('reproductive')).toBe('Reproducción');
      expect(getReportTitle('inventory')).toBe('Inventario');
      expect(getReportTitle('financial')).toBe('Financiero');
      expect(getReportTitle('health')).toBe('Salud');
      expect(getReportTitle('unknown')).toBe('Sistema');
    });
  });

  describe('Data formatting', () => {
    it('should format labels correctly', () => {
      const formatLabel = (excelGenerator as any).formatLabel.bind(excelGenerator);
      
      expect(formatLabel('totalPreneces')).toBe('Total Preñeces');
      expect(formatLabel('tasaExito')).toBe('Tasa de Éxito (%)');
      expect(formatLabel('unknownKey')).toBe('UnknownKey');
    });

    it('should format values correctly', () => {
      const formatValue = (excelGenerator as any).formatValue.bind(excelGenerator);
      
      expect(formatValue(1000)).toBe(1000);
      expect(formatValue(80.5)).toBe(80.5);
      expect(formatValue('text')).toBe('text');
    });
  });

  describe('Worksheet creation', () => {
    it('should create summary worksheet', async () => {
      const ExcelJS = require('exceljs');
      const mockWorkbook = new ExcelJS.default.Workbook();
      
      await (excelGenerator as any).createSummaryWorksheet(mockWorkbook, mockReportData);
      
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Resumen', {
        properties: { tabColor: { argb: '2196F3' } }
      });
    });

    it('should create data worksheets', async () => {
      const ExcelJS = require('exceljs');
      const mockWorkbook = new ExcelJS.default.Workbook();
      
      await (excelGenerator as any).createDataWorksheets(mockWorkbook, mockReportData, mockOptions);
      
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Preñeces');
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Camadas');
    });

    it('should create charts worksheet when enabled', async () => {
      const ExcelJS = require('exceljs');
      const mockWorkbook = new ExcelJS.default.Workbook();
      
      await (excelGenerator as any).createChartsWorksheet(mockWorkbook, mockReportData);
      
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Gráficos');
    });

    it('should skip charts worksheet when no charts available', async () => {
      const ExcelJS = require('exceljs');
      const mockWorkbook = new ExcelJS.default.Workbook();
      const reportDataNoCharts = {
        ...mockReportData,
        data: {
          ...mockReportData.data,
          charts: []
        }
      };
      
      await (excelGenerator as any).createChartsWorksheet(mockWorkbook, reportDataNoCharts);
      
      // Should not add worksheet when no charts
      expect(mockWorkbook.addWorksheet).not.toHaveBeenCalledWith('Gráficos');
    });
  });
});