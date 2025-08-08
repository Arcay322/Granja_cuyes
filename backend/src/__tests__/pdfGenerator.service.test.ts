import { PDFGeneratorService } from '../services/reports/pdfGenerator.service';
import { PDFOptions } from '../types/export.types';
import fs from 'fs/promises';
import path from 'path';

// Mock puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setViewport: jest.fn(),
      setContent: jest.fn(),
      pdf: jest.fn(),
      close: jest.fn()
    }),
    close: jest.fn()
  })
}));

// Mock fs
jest.mock('fs/promises', () => ({
  stat: jest.fn().mockResolvedValue({ size: 1024 })
}));

describe('PDFGeneratorService', () => {
  let pdfGenerator: PDFGeneratorService;
  let mockReportData: any;
  let mockOptions: PDFOptions;

  beforeEach(() => {
    pdfGenerator = new PDFGeneratorService();
    
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
      pageSize: 'A4',
      orientation: 'portrait',
      includeCharts: true,
      includeImages: true,
      compression: false
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePDF', () => {
    it('should generate PDF successfully', async () => {
      const outputPath = '/tmp/test-report.pdf';
      
      const result = await pdfGenerator.generatePDF(mockReportData, mockOptions, outputPath);
      
      expect(result).toEqual({
        filePath: outputPath,
        fileSize: 1024
      });
    });

    it('should handle different page sizes', async () => {
      const letterOptions: PDFOptions = {
        ...mockOptions,
        pageSize: 'Letter'
      };
      
      const outputPath = '/tmp/test-report-letter.pdf';
      
      const result = await pdfGenerator.generatePDF(mockReportData, letterOptions, outputPath);
      
      expect(result.filePath).toBe(outputPath);
    });

    it('should handle landscape orientation', async () => {
      const landscapeOptions: PDFOptions = {
        ...mockOptions,
        orientation: 'landscape'
      };
      
      const outputPath = '/tmp/test-report-landscape.pdf';
      
      const result = await pdfGenerator.generatePDF(mockReportData, landscapeOptions, outputPath);
      
      expect(result.filePath).toBe(outputPath);
    });

    it('should exclude charts when option is false', async () => {
      const noChartsOptions: PDFOptions = {
        ...mockOptions,
        includeCharts: false
      };
      
      const outputPath = '/tmp/test-report-no-charts.pdf';
      
      const result = await pdfGenerator.generatePDF(mockReportData, noChartsOptions, outputPath);
      
      expect(result.filePath).toBe(outputPath);
    });

    it('should handle empty data gracefully', async () => {
      const emptyReportData = {
        ...mockReportData,
        data: {
          summary: {},
          preneces: [],
          charts: []
        }
      };
      
      const outputPath = '/tmp/test-report-empty.pdf';
      
      const result = await pdfGenerator.generatePDF(emptyReportData, mockOptions, outputPath);
      
      expect(result.filePath).toBe(outputPath);
    });

    it('should throw error when PDF generation fails', async () => {
      const puppeteer = require('puppeteer');
      puppeteer.launch.mockRejectedValueOnce(new Error('Browser launch failed'));
      
      const outputPath = '/tmp/test-report-error.pdf';
      
      await expect(
        pdfGenerator.generatePDF(mockReportData, mockOptions, outputPath)
      ).rejects.toThrow('PDF generation failed: Browser launch failed');
    });
  });

  describe('HTML content generation', () => {
    it('should generate proper HTML structure', async () => {
      // Access private method for testing
      const htmlContent = (pdfGenerator as any).generateHTMLContent(mockReportData, mockOptions);
      
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('Reporte de Reproducción');
      expect(htmlContent).toContain('SUMAQ UYWA');
      expect(htmlContent).toContain('Total Preñeces');
      expect(htmlContent).toContain('chart.js');
    });

    it('should exclude charts from HTML when option is false', async () => {
      const noChartsOptions: PDFOptions = {
        ...mockOptions,
        includeCharts: false
      };
      
      const htmlContent = (pdfGenerator as any).generateHTMLContent(mockReportData, noChartsOptions);
      
      expect(htmlContent).not.toContain('<div class="charts-section page-break">');
      expect(htmlContent).not.toContain('chart.js');
    });
  });

  describe('Data formatting', () => {
    it('should format labels correctly', () => {
      const formatLabel = (pdfGenerator as any).formatLabel.bind(pdfGenerator);
      
      expect(formatLabel('totalPreneces')).toBe('Total Preñeces');
      expect(formatLabel('tasaExito')).toBe('Tasa de Éxito (%)');
      expect(formatLabel('unknownKey')).toBe('UnknownKey');
    });

    it('should format values correctly', () => {
      const formatValue = (pdfGenerator as any).formatValue.bind(pdfGenerator);
      
      expect(formatValue(1000)).toBe('1,000');
      expect(formatValue(80.5)).toBe('80.50');
      expect(formatValue('text')).toBe('text');
    });

    it('should format chart data correctly', () => {
      const formatChartData = (pdfGenerator as any).formatChartData.bind(pdfGenerator);
      
      const pieChart = {
        type: 'pie',
        data: [
          { name: 'Active', value: 5 },
          { name: 'Completed', value: 3 }
        ]
      };
      
      const result = formatChartData(pieChart);
      
      expect(result.labels).toEqual(['Active', 'Completed']);
      expect(result.datasets[0].data).toEqual([5, 3]);
    });
  });

  describe('Report title generation', () => {
    it('should return correct titles for different templates', () => {
      const getReportTitle = (pdfGenerator as any).getReportTitle.bind(pdfGenerator);
      
      expect(getReportTitle('reproductive')).toBe('Reporte de Reproducción');
      expect(getReportTitle('inventory')).toBe('Reporte de Inventario');
      expect(getReportTitle('financial')).toBe('Reporte Financiero');
      expect(getReportTitle('health')).toBe('Reporte de Salud');
      expect(getReportTitle('unknown')).toBe('Reporte del Sistema');
    });
  });

  describe('Browser management', () => {
    it('should close browser properly', async () => {
      const puppeteer = require('puppeteer');
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue({
          setViewport: jest.fn(),
          setContent: jest.fn(),
          pdf: jest.fn(),
          close: jest.fn()
        }),
        close: jest.fn()
      };
      
      puppeteer.launch.mockResolvedValue(mockBrowser);
      
      // Initialize browser by generating a PDF
      await pdfGenerator.generatePDF(mockReportData, mockOptions, '/tmp/test.pdf');
      
      // Close browser
      await pdfGenerator.closeBrowser();
      
      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });
});