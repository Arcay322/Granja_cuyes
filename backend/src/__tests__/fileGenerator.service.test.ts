import { FileGeneratorService } from '../services/reports/fileGenerator.service';
import { ExportFormat } from '@prisma/client';
import { PDFOptions, ExcelOptions, CSVOptions } from '../types/export.types';
import fs from 'fs/promises';

// Mock the individual generator services
jest.mock('../services/reports/pdfGenerator.service', () => ({
  pdfGeneratorService: {
    generatePDF: jest.fn().mockResolvedValue({
      filePath: '/tmp/test.pdf',
      fileSize: 1024
    }),
    closeBrowser: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('../services/reports/excelGenerator.service', () => ({
  excelGeneratorService: {
    generateExcel: jest.fn().mockResolvedValue({
      filePath: '/tmp/test.xlsx',
      fileSize: 2048
    })
  }
}));

jest.mock('../services/reports/csvGenerator.service', () => ({
  csvGeneratorService: {
    generateCSV: jest.fn().mockResolvedValue({
      filePath: '/tmp/test.csv',
      fileSize: 512
    })
  }
}));

// Mock fs
jest.mock('fs/promises', () => ({
  stat: jest.fn().mockResolvedValue({ 
    size: 1024,
    mtime: new Date()
  }),
  access: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
  readdir: jest.fn().mockResolvedValue(['file1.pdf', 'file2.xlsx'])
}));

// Mock path
jest.mock('path', () => {
  const actualPath = jest.requireActual('path');
  return {
    ...actualPath,
    join: jest.fn().mockImplementation((...parts) => parts.join('/')),
    dirname: jest.fn().mockReturnValue('/tmp'),
    basename: jest.fn().mockImplementation((filePath) => filePath.split('/').pop()),
    extname: jest.fn().mockImplementation((filePath) => {
      const parts = filePath.split('.');
      return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
    })
  };
});

describe('FileGeneratorService', () => {
  let fileGenerator: FileGeneratorService;
  let mockReportData: any;

  beforeEach(() => {
    fileGenerator = new FileGeneratorService();
    
    mockReportData = {
      templateId: 'reproductive',
      generatedAt: new Date().toISOString(),
      data: {
        summary: { totalPreneces: 10 },
        preneces: [{ id: 1, madre: 'Madre 1' }]
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateFile', () => {
    it('should generate PDF file successfully', async () => {
      const options = {
        format: ExportFormat.PDF,
        options: {
          pageSize: 'A4',
          orientation: 'portrait',
          includeCharts: true,
          includeImages: true,
          compression: false
        } as PDFOptions
      };

      const result = await fileGenerator.generateFile(mockReportData, options);

      expect(result).toEqual({
        filePath: '/tmp/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        fileName: 'test.pdf'
      });
    });

    it('should generate Excel file successfully', async () => {
      const options = {
        format: ExportFormat.EXCEL,
        options: {
          includeCharts: true,
          compression: false,
          multipleSheets: true
        } as ExcelOptions
      };

      const result = await fileGenerator.generateFile(mockReportData, options);

      expect(result).toEqual({
        filePath: '/tmp/test.xlsx',
        fileSize: 2048,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileName: 'test.xlsx'
      });
    });

    it('should generate CSV file successfully', async () => {
      const options = {
        format: ExportFormat.CSV,
        options: {
          encoding: 'utf8',
          separator: ',',
          includeHeaders: true
        } as CSVOptions
      };

      const result = await fileGenerator.generateFile(mockReportData, options);

      expect(result).toEqual({
        filePath: '/tmp/test.csv',
        fileSize: 512,
        mimeType: 'text/csv',
        fileName: 'test.csv'
      });
    });

    it('should throw error for unsupported format', async () => {
      const options = {
        format: 'UNSUPPORTED' as ExportFormat,
        options: {} as PDFOptions
      };

      await expect(
        fileGenerator.generateFile(mockReportData, options)
      ).rejects.toThrow('Unsupported format: UNSUPPORTED');
    });

    it('should validate required inputs', async () => {
      const options = {
        format: ExportFormat.PDF,
        options: {} as PDFOptions
      };

      await expect(
        fileGenerator.generateFile(null, options)
      ).rejects.toThrow('Report data is required');

      await expect(
        fileGenerator.generateFile({}, options)
      ).rejects.toThrow('Template ID is required');

      await expect(
        fileGenerator.generateFile({ templateId: 'test' }, options)
      ).rejects.toThrow('Data is required');
    });

    it('should handle file size validation', async () => {
      const pdfService = require('../services/reports/pdfGenerator.service');
      pdfService.pdfGeneratorService.generatePDF.mockResolvedValueOnce({
        filePath: '/tmp/large.pdf',
        fileSize: 200 * 1024 * 1024 // 200MB - exceeds limit
      });

      const options = {
        format: ExportFormat.PDF,
        options: {
          pageSize: 'A4',
          orientation: 'portrait'
        } as PDFOptions
      };

      await expect(
        fileGenerator.generateFile(mockReportData, options)
      ).rejects.toThrow('Generated file is too large');
    });

    it('should handle empty file validation', async () => {
      const pdfService = require('../services/reports/pdfGenerator.service');
      pdfService.pdfGeneratorService.generatePDF.mockResolvedValueOnce({
        filePath: '/tmp/empty.pdf',
        fileSize: 0
      });

      const options = {
        format: ExportFormat.PDF,
        options: {
          pageSize: 'A4',
          orientation: 'portrait'
        } as PDFOptions
      };

      await expect(
        fileGenerator.generateFile(mockReportData, options)
      ).rejects.toThrow('Generated file is empty');
    });
  });

  describe('generateMultipleFiles', () => {
    it('should generate multiple files successfully', async () => {
      const formats = [
        {
          format: ExportFormat.PDF,
          options: { pageSize: 'A4', orientation: 'portrait' } as PDFOptions
        },
        {
          format: ExportFormat.EXCEL,
          options: { includeCharts: true } as ExcelOptions
        }
      ];

      const results = await fileGenerator.generateMultipleFiles(mockReportData, formats);

      expect(results).toHaveLength(2);
      expect(results[0].mimeType).toBe('application/pdf');
      expect(results[1].mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should handle error in multiple file generation', async () => {
      const pdfService = require('../services/reports/pdfGenerator.service');
      pdfService.pdfGeneratorService.generatePDF.mockRejectedValueOnce(new Error('PDF generation failed'));

      const formats = [
        {
          format: ExportFormat.PDF,
          options: { pageSize: 'A4' } as PDFOptions
        }
      ];

      await expect(
        fileGenerator.generateMultipleFiles(mockReportData, formats)
      ).rejects.toThrow('Multiple file generation failed');
    });
  });

  describe('validateAndCleanupFile', () => {
    it('should validate file successfully', async () => {
      const result = await fileGenerator.validateAndCleanupFile('/tmp/valid.pdf');
      expect(result).toBe(true);
    });

    it('should cleanup empty file', async () => {
      const mockFs = require('fs/promises');
      mockFs.stat.mockResolvedValueOnce({ size: 0 });

      const result = await fileGenerator.validateAndCleanupFile('/tmp/empty.pdf');
      
      expect(result).toBe(false);
      expect(mockFs.unlink).toHaveBeenCalledWith('/tmp/empty.pdf');
    });

    it('should cleanup oversized file', async () => {
      const mockFs = require('fs/promises');
      mockFs.stat.mockResolvedValueOnce({ size: 200 * 1024 * 1024 }); // 200MB

      const result = await fileGenerator.validateAndCleanupFile('/tmp/large.pdf');
      
      expect(result).toBe(false);
      expect(mockFs.unlink).toHaveBeenCalledWith('/tmp/large.pdf');
    });

    it('should handle file validation error', async () => {
      const mockFs = require('fs/promises');
      mockFs.stat.mockRejectedValueOnce(new Error('File not found'));

      const result = await fileGenerator.validateAndCleanupFile('/tmp/missing.pdf');
      expect(result).toBe(false);
    });
  });

  describe('getFileInfo', () => {
    it('should return file info for existing file', async () => {
      const result = await fileGenerator.getFileInfo('/tmp/test.pdf');
      
      expect(result).toEqual({
        exists: true,
        size: 1024,
        mimeType: 'application/pdf',
        fileName: 'test.pdf'
      });
    });

    it('should return not exists for missing file', async () => {
      const mockFs = require('fs/promises');
      mockFs.stat.mockRejectedValueOnce(new Error('File not found'));

      const result = await fileGenerator.getFileInfo('/tmp/missing.pdf');
      
      expect(result).toEqual({ exists: false });
    });
  });

  describe('cleanupTempFiles', () => {
    it('should cleanup old files', async () => {
      const mockFs = require('fs/promises');
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      
      mockFs.stat
        .mockResolvedValueOnce({ mtime: oldDate })
        .mockResolvedValueOnce({ mtime: new Date() }); // Recent file

      const result = await fileGenerator.cleanupTempFiles('/tmp', 24);
      
      expect(result).toBe(1); // Only one old file cleaned
      expect(mockFs.unlink).toHaveBeenCalledTimes(1);
    });

    it('should handle cleanup errors gracefully', async () => {
      const mockFs = require('fs/promises');
      mockFs.readdir.mockRejectedValueOnce(new Error('Directory not found'));

      const result = await fileGenerator.cleanupTempFiles('/tmp/missing', 24);
      expect(result).toBe(0);
    });
  });

  describe('utility methods', () => {
    it('should return supported formats', () => {
      const formats = fileGenerator.getSupportedFormats();
      expect(formats).toEqual([ExportFormat.PDF, ExportFormat.EXCEL, ExportFormat.CSV]);
    });

    it('should return format validation rules', () => {
      const pdfRules = fileGenerator.getFormatValidationRules(ExportFormat.PDF);
      expect(pdfRules).toHaveProperty('requiredOptions');
      expect(pdfRules).toHaveProperty('supportedPageSizes');

      const excelRules = fileGenerator.getFormatValidationRules(ExportFormat.EXCEL);
      expect(excelRules).toHaveProperty('requiredOptions');

      const csvRules = fileGenerator.getFormatValidationRules(ExportFormat.CSV);
      expect(csvRules).toHaveProperty('supportedSeparators');
    });

    it('should cleanup resources', async () => {
      await fileGenerator.cleanup();
      
      const pdfService = require('../services/reports/pdfGenerator.service');
      expect(pdfService.pdfGeneratorService.closeBrowser).toHaveBeenCalled();
    });
  });
});