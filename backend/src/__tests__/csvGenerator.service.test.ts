import { CSVGeneratorService } from '../services/reports/csvGenerator.service';
import { CSVOptions } from '../types/export.types';
import fs from 'fs/promises';

// Mock csv-writer
jest.mock('csv-writer', () => ({
  createObjectCsvWriter: jest.fn().mockReturnValue({
    writeRecords: jest.fn().mockResolvedValue(undefined)
  })
}));

// Mock fs
jest.mock('fs/promises', () => ({
  stat: jest.fn().mockResolvedValue({ size: 512 }),
  rename: jest.fn().mockResolvedValue(undefined)
}));

// Mock path functions used in CSV generator
jest.mock('path', () => {
  const actualPath = jest.requireActual('path');
  return {
    ...actualPath,
    dirname: jest.fn().mockReturnValue('/tmp'),
    basename: jest.fn().mockImplementation((filePath, ext) => {
      if (ext) {
        return filePath.replace(ext, '').split('/').pop();
      }
      return filePath.split('/').pop();
    }),
    join: jest.fn().mockImplementation((...parts) => parts.join('/'))
  };
});

describe('CSVGeneratorService', () => {
  let csvGenerator: CSVGeneratorService;
  let mockReportData: any;
  let mockOptions: CSVOptions;

  beforeEach(() => {
    csvGenerator = new CSVGeneratorService();
    
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
      encoding: 'utf8',
      separator: ',',
      includeHeaders: true
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCSV', () => {
    it('should generate CSV successfully with multiple files', async () => {
      const outputPath = '/tmp/test-report.csv';
      
      const result = await csvGenerator.generateCSV(mockReportData, mockOptions, outputPath);
      
      expect(result.filePath).toBe(outputPath);
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should handle single data section', async () => {
      const singleSectionData = {
        ...mockReportData,
        data: {
          summary: mockReportData.data.summary,
          preneces: mockReportData.data.preneces,
          camadas: [],
          charts: []
        }
      };
      
      const outputPath = '/tmp/test-single-section.csv';
      
      const result = await csvGenerator.generateCSV(singleSectionData, mockOptions, outputPath);
      
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
      
      const outputPath = '/tmp/test-empty.csv';
      
      const result = await csvGenerator.generateCSV(emptyReportData, mockOptions, outputPath);
      
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
      
      const outputPath = '/tmp/test-financial.csv';
      
      const result = await csvGenerator.generateCSV(financialReportData, mockOptions, outputPath);
      
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
      
      const outputPath = '/tmp/test-inventory.csv';
      
      const result = await csvGenerator.generateCSV(inventoryReportData, mockOptions, outputPath);
      
      expect(result.filePath).toBe(outputPath);
    });

    it('should handle different CSV options', async () => {
      const customOptions: CSVOptions = {
        encoding: 'latin1',
        separator: ';',
        includeHeaders: true
      };
      
      const outputPath = '/tmp/test-custom-options.csv';
      
      const result = await csvGenerator.generateCSV(mockReportData, customOptions, outputPath);
      
      expect(result.filePath).toBe(outputPath);
    });

    it('should throw error when CSV generation fails', async () => {
      const csvWriter = require('csv-writer');
      csvWriter.createObjectCsvWriter.mockReturnValue({
        writeRecords: jest.fn().mockRejectedValue(new Error('Write failed'))
      });
      
      const outputPath = '/tmp/test-error.csv';
      
      await expect(
        csvGenerator.generateCSV(mockReportData, mockOptions, outputPath)
      ).rejects.toThrow('CSV generation failed: Write failed');
    });
  });

  describe('Data formatting', () => {
    it('should format labels correctly', () => {
      const formatLabel = (csvGenerator as any).formatLabel.bind(csvGenerator);
      
      expect(formatLabel('totalPreneces')).toBe('Total Preñeces');
      expect(formatLabel('tasaExito')).toBe('Tasa de Éxito (%)');
      expect(formatLabel('unknownKey')).toBe('UnknownKey');
    });

    it('should format values correctly', () => {
      const formatValue = (csvGenerator as any).formatValue.bind(csvGenerator);
      
      expect(formatValue(1000)).toBe('1,000');
      expect(formatValue(80.5)).toBe('80.50');
      expect(formatValue('text')).toBe('text');
    });
  });

  describe('Report title generation', () => {
    it('should return correct titles for different templates', () => {
      const getReportTitle = (csvGenerator as any).getReportTitle.bind(csvGenerator);
      
      expect(getReportTitle('reproductive')).toBe('Reporte de Reproducción');
      expect(getReportTitle('inventory')).toBe('Reporte de Inventario');
      expect(getReportTitle('financial')).toBe('Reporte Financiero');
      expect(getReportTitle('health')).toBe('Reporte de Salud');
      expect(getReportTitle('unknown')).toBe('Reporte del Sistema');
    });
  });

  describe('File description generation', () => {
    it('should return correct descriptions for different file types', () => {
      const getFileDescription = (csvGenerator as any).getFileDescription.bind(csvGenerator);
      
      expect(getFileDescription('report_resumen.csv')).toBe('Resumen ejecutivo del reporte');
      expect(getFileDescription('report_preneces.csv')).toBe('Datos de preñeces');
      expect(getFileDescription('report_camadas.csv')).toBe('Datos de camadas');
      expect(getFileDescription('report_inventario.csv')).toBe('Inventario de cuyes');
      expect(getFileDescription('report_ventas.csv')).toBe('Datos de ventas');
      expect(getFileDescription('report_gastos.csv')).toBe('Datos de gastos');
      expect(getFileDescription('report_graficos.csv')).toBe('Datos de gráficos');
      expect(getFileDescription('unknown_file.csv')).toBe('Datos del reporte');
    });
  });

  describe('CSV file creation methods', () => {
    it('should create summary CSV', async () => {
      const csvWriter = require('csv-writer');
      const mockWriter = { writeRecords: jest.fn().mockResolvedValue(undefined) };
      csvWriter.createObjectCsvWriter.mockReturnValue(mockWriter);
      
      await (csvGenerator as any).createSummaryCSV('/tmp/summary.csv', mockReportData, mockOptions);
      
      expect(csvWriter.createObjectCsvWriter).toHaveBeenCalled();
      expect(mockWriter.writeRecords).toHaveBeenCalled();
    });

    it('should create data CSV', async () => {
      const csvWriter = require('csv-writer');
      const mockWriter = { writeRecords: jest.fn().mockResolvedValue(undefined) };
      csvWriter.createObjectCsvWriter.mockReturnValue(mockWriter);
      
      const headers = [
        { id: 'id', title: 'ID' },
        { id: 'name', title: 'Name' }
      ];
      const data = [{ id: 1, name: 'Test' }];
      
      await (csvGenerator as any).createDataCSV('/tmp/data.csv', data, headers, mockOptions);
      
      expect(csvWriter.createObjectCsvWriter).toHaveBeenCalled();
      expect(mockWriter.writeRecords).toHaveBeenCalled();
    });

    it('should create charts CSV', async () => {
      const csvWriter = require('csv-writer');
      const mockWriter = { writeRecords: jest.fn().mockResolvedValue(undefined) };
      csvWriter.createObjectCsvWriter.mockReturnValue(mockWriter);
      
      const charts = [
        {
          title: 'Test Chart',
          type: 'pie',
          data: [{ name: 'A', value: 10 }, { name: 'B', value: 20 }]
        }
      ];
      
      await (csvGenerator as any).createChartsCSV('/tmp/charts.csv', charts, mockOptions);
      
      expect(csvWriter.createObjectCsvWriter).toHaveBeenCalled();
      expect(mockWriter.writeRecords).toHaveBeenCalled();
    });

    it('should create empty CSV when no data', async () => {
      const csvWriter = require('csv-writer');
      const mockWriter = { writeRecords: jest.fn().mockResolvedValue(undefined) };
      csvWriter.createObjectCsvWriter.mockReturnValue(mockWriter);
      
      await (csvGenerator as any).createEmptyCSV('/tmp/empty.csv', mockReportData, mockOptions);
      
      expect(csvWriter.createObjectCsvWriter).toHaveBeenCalled();
      expect(mockWriter.writeRecords).toHaveBeenCalled();
    });
  });
});