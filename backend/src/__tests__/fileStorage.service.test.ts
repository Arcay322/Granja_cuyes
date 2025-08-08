import { FileStorageService, StorageConfig, FileMetadata } from '../services/reports/fileStorage.service';
import { ExportFormat } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

// Mock the dependencies
jest.mock('fs/promises');
jest.mock('../services/reports/reports.service', () => ({
  reportsService: {
    createExportFile: jest.fn(),
    getJobStatus: jest.fn(),
    incrementDownloadCount: jest.fn(),
    cleanupExpiredFiles: jest.fn(),
    getExportStats: jest.fn()
  }
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('FileStorageService', () => {
  let fileStorageService: FileStorageService;
  let mockConfig: Partial<StorageConfig>;
  let mockBuffer: Buffer;
  let mockMetadata: Omit<FileMetadata, 'size' | 'createdAt' | 'checksum'>;

  beforeEach(() => {
    mockConfig = {
      baseDirectory: '/tmp/test-storage',
      maxFileSize: 1024 * 1024, // 1MB
      retentionHours: 24
    };

    fileStorageService = new FileStorageService(mockConfig);

    // Create a mock PDF buffer
    mockBuffer = Buffer.from('%PDF-1.4\n%âãÏÓ\ntest content');

    mockMetadata = {
      originalName: 'test-report.pdf',
      mimeType: 'application/pdf',
      format: ExportFormat.PDF,
      jobId: 'job-123',
      userId: 1
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize storage system successfully', async () => {
      mockFs.access.mockRejectedValue(new Error('Directory not found'));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.unlink.mockResolvedValue(undefined);

      await fileStorageService.initialize();

      expect(mockFs.mkdir).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalled(); // Permission test
      expect(mockFs.unlink).toHaveBeenCalled(); // Cleanup test file
    });

    it('should handle initialization errors', async () => {
      mockFs.access.mockRejectedValue(new Error('Permission denied'));
      mockFs.mkdir.mockRejectedValue(new Error('Cannot create directory'));

      await expect(fileStorageService.initialize()).rejects.toThrow();
    });
  });

  describe('storeFile', () => {
    beforeEach(() => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.createExportFile.mockResolvedValue({
        id: 'file-123',
        jobId: 'job-123',
        fileName: 'test-file.pdf',
        filePath: '/tmp/test-storage/user_1/2024/01/15/job-123_1234567890_abcdef12.pdf',
        fileSize: BigInt(mockBuffer.length),
        mimeType: 'application/pdf',
        downloadCount: 0,
        createdAt: new Date(),
        lastDownloadedAt: null
      });

      mockFs.access.mockRejectedValue(new Error('Directory not found'));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(mockBuffer);
    });

    it('should store file successfully', async () => {
      const result = await fileStorageService.storeFile(mockBuffer, mockMetadata);

      expect(result).toHaveProperty('fileId');
      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('fileName');
      expect(result.size).toBe(mockBuffer.length);
      expect(result).toHaveProperty('checksum');

      expect(mockFs.writeFile).toHaveBeenCalled();
      expect(mockFs.readFile).toHaveBeenCalled(); // For integrity check
    });

    it('should reject oversized files', async () => {
      const largeBuffer = Buffer.alloc(2 * 1024 * 1024); // 2MB, exceeds 1MB limit

      await expect(fileStorageService.storeFile(largeBuffer, mockMetadata))
        .rejects.toThrow('File validation failed');
    });

    it('should reject empty files', async () => {
      const emptyBuffer = Buffer.alloc(0);

      await expect(fileStorageService.storeFile(emptyBuffer, mockMetadata))
        .rejects.toThrow('File validation failed');
    });

    it('should reject invalid file formats', async () => {
      const invalidMetadata = {
        ...mockMetadata,
        format: 'INVALID' as ExportFormat
      };

      await expect(fileStorageService.storeFile(mockBuffer, invalidMetadata))
        .rejects.toThrow('File validation failed');
    });

    it('should reject invalid MIME types', async () => {
      const invalidMetadata = {
        ...mockMetadata,
        mimeType: 'text/plain' // Invalid for PDF
      };

      await expect(fileStorageService.storeFile(mockBuffer, invalidMetadata))
        .rejects.toThrow('File validation failed');
    });

    it('should reject invalid file signatures', async () => {
      const invalidBuffer = Buffer.from('not a pdf file');
      
      await expect(fileStorageService.storeFile(invalidBuffer, mockMetadata))
        .rejects.toThrow('File validation failed');
    });

    it('should handle Excel files', async () => {
      const excelBuffer = Buffer.from('PK\x03\x04'); // ZIP signature for XLSX
      const excelMetadata = {
        ...mockMetadata,
        format: ExportFormat.EXCEL,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };

      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.createExportFile.mockResolvedValue({
        id: 'file-excel',
        jobId: 'job-123',
        fileName: 'test-file.xlsx',
        filePath: '/tmp/test-storage/user_1/2024/01/15/job-123_1234567890_abcdef12.xlsx',
        fileSize: BigInt(excelBuffer.length),
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        downloadCount: 0,
        createdAt: new Date(),
        lastDownloadedAt: null
      });

      mockFs.readFile.mockResolvedValue(excelBuffer);

      const result = await fileStorageService.storeFile(excelBuffer, excelMetadata);

      expect(result.fileId).toBe('file-excel');
      expect(result.size).toBe(excelBuffer.length);
    });

    it('should handle CSV files', async () => {
      const csvBuffer = Buffer.from('name,age,city\nJohn,30,NYC');
      const csvMetadata = {
        ...mockMetadata,
        format: ExportFormat.CSV,
        mimeType: 'text/csv'
      };

      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.createExportFile.mockResolvedValue({
        id: 'file-csv',
        jobId: 'job-123',
        fileName: 'test-file.csv',
        filePath: '/tmp/test-storage/user_1/2024/01/15/job-123_1234567890_abcdef12.csv',
        fileSize: BigInt(csvBuffer.length),
        mimeType: 'text/csv',
        downloadCount: 0,
        createdAt: new Date(),
        lastDownloadedAt: null
      });

      mockFs.readFile.mockResolvedValue(csvBuffer);

      const result = await fileStorageService.storeFile(csvBuffer, csvMetadata);

      expect(result.fileId).toBe('file-csv');
      expect(result.size).toBe(csvBuffer.length);
    });
  });

  describe('retrieveFile', () => {
    const mockFileRecord = {
      id: 'file-123',
      jobId: 'job-123',
      fileName: 'test-file.pdf',
      filePath: '/tmp/test-storage/user_1/2024/01/15/test-file.pdf',
      fileSize: BigInt(100),
      mimeType: 'application/pdf',
      downloadCount: 0,
      createdAt: new Date(),
      lastDownloadedAt: null
    };

    beforeEach(() => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.getJobStatus.mockResolvedValue({
        id: 'job-123',
        userId: 1,
        status: 'COMPLETED'
      });
      reportsService.incrementDownloadCount.mockResolvedValue(undefined);
    });

    it('should retrieve file successfully', async () => {
      // Mock the private method getFileRecord
      jest.spyOn(fileStorageService as any, 'getFileRecord').mockResolvedValue(mockFileRecord);
      
      mockFs.access.mockResolvedValue(undefined); // File exists
      mockFs.readFile.mockResolvedValue(mockBuffer);

      const result = await fileStorageService.retrieveFile('file-123', 1);

      expect(result.buffer).toEqual(mockBuffer);
      expect(result.metadata).toEqual(mockFileRecord);
      const reportsService = require('../services/reports/reports.service').reportsService;
      expect(reportsService.incrementDownloadCount).toHaveBeenCalledWith('file-123');
    });

    it('should reject access for wrong user', async () => {
      jest.spyOn(fileStorageService as any, 'getFileRecord').mockResolvedValue(mockFileRecord);
      
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.getJobStatus.mockResolvedValue({
        id: 'job-123',
        userId: 2, // Different user
        status: 'COMPLETED'
      });

      await expect(fileStorageService.retrieveFile('file-123', 1))
        .rejects.toThrow('Access denied');
    });

    it('should handle non-existent files', async () => {
      jest.spyOn(fileStorageService as any, 'getFileRecord').mockResolvedValue(null);

      await expect(fileStorageService.retrieveFile('non-existent', 1))
        .rejects.toThrow('File not found');
    });

    it('should handle missing physical files', async () => {
      jest.spyOn(fileStorageService as any, 'getFileRecord').mockResolvedValue(mockFileRecord);
      
      mockFs.access.mockRejectedValue(new Error('File not found')); // Physical file missing

      await expect(fileStorageService.retrieveFile('file-123', 1))
        .rejects.toThrow('File not found on disk');
    });
  });

  describe('deleteFile', () => {
    const mockFileRecord = {
      id: 'file-123',
      jobId: 'job-123',
      fileName: 'test-file.pdf',
      filePath: '/tmp/test-storage/user_1/2024/01/15/test-file.pdf',
      fileSize: BigInt(100),
      mimeType: 'application/pdf',
      downloadCount: 0,
      createdAt: new Date(),
      lastDownloadedAt: null
    };

    beforeEach(() => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.getJobStatus.mockResolvedValue({
        id: 'job-123',
        userId: 1,
        status: 'COMPLETED'
      });
    });

    it('should delete file successfully', async () => {
      jest.spyOn(fileStorageService as any, 'getFileRecord').mockResolvedValue(mockFileRecord);
      
      mockFs.access.mockResolvedValue(undefined); // File exists
      mockFs.unlink.mockResolvedValue(undefined);

      const result = await fileStorageService.deleteFile('file-123', 1);

      expect(result).toBe(true);
      expect(mockFs.unlink).toHaveBeenCalledWith(mockFileRecord.filePath);
    });

    it('should handle non-existent files gracefully', async () => {
      jest.spyOn(fileStorageService as any, 'getFileRecord').mockResolvedValue(null);

      const result = await fileStorageService.deleteFile('non-existent', 1);

      expect(result).toBe(false);
    });

    it('should reject deletion for wrong user', async () => {
      jest.spyOn(fileStorageService as any, 'getFileRecord').mockResolvedValue(mockFileRecord);
      
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.getJobStatus.mockResolvedValue({
        id: 'job-123',
        userId: 2, // Different user
        status: 'COMPLETED'
      });

      const result = await fileStorageService.deleteFile('file-123', 1);

      expect(result).toBe(false);
    });
  });

  describe('getFileInfo', () => {
    const mockFileRecord = {
      id: 'file-123',
      jobId: 'job-123',
      fileName: 'test-file.pdf',
      filePath: '/tmp/test-storage/user_1/2024/01/15/test-file.pdf',
      fileSize: BigInt(100),
      mimeType: 'application/pdf',
      downloadCount: 0,
      createdAt: new Date(),
      lastDownloadedAt: null
    };

    beforeEach(() => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.getJobStatus.mockResolvedValue({
        id: 'job-123',
        userId: 1,
        status: 'COMPLETED'
      });
    });

    it('should return file info successfully', async () => {
      jest.spyOn(fileStorageService as any, 'getFileRecord').mockResolvedValue(mockFileRecord);
      mockFs.access.mockResolvedValue(undefined); // File exists

      const result = await fileStorageService.getFileInfo('file-123', 1);

      expect(result).toEqual(mockFileRecord);
    });

    it('should return null for non-existent files', async () => {
      jest.spyOn(fileStorageService as any, 'getFileRecord').mockResolvedValue(null);

      const result = await fileStorageService.getFileInfo('non-existent', 1);

      expect(result).toBeNull();
    });
  });

  describe('cleanupExpiredFiles', () => {
    it('should cleanup expired files successfully', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.cleanupExpiredFiles.mockResolvedValue({ cleanedCount: 5 });

      const result = await fileStorageService.cleanupExpiredFiles();

      expect(result.deletedCount).toBe(5);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle cleanup errors', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.cleanupExpiredFiles.mockRejectedValue(new Error('Cleanup failed'));

      const result = await fileStorageService.cleanupExpiredFiles();

      expect(result.deletedCount).toBe(0);
      expect(result.errors).toContain('Cleanup failed');
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics', async () => {
      const reportsService = require('../services/reports/reports.service').reportsService;
      reportsService.getExportStats.mockResolvedValue({
        totalJobs: 100,
        totalFileSize: BigInt(1024 * 1024 * 50) // 50MB
      });

      const result = await fileStorageService.getStorageStats();

      expect(result.totalFiles).toBe(100);
      expect(result.totalSize).toBe(BigInt(1024 * 1024 * 50));
      expect(result.availableSpace).toBe(BigInt(1024 * 1024 * 1024 * 10)); // 10GB
    });
  });

  describe('configuration', () => {
    it('should return current configuration', () => {
      const config = fileStorageService.getConfig();

      expect(config).toHaveProperty('baseDirectory');
      expect(config).toHaveProperty('maxFileSize');
      expect(config).toHaveProperty('allowedFormats');
    });

    it('should update configuration', () => {
      const newConfig = { maxFileSize: 2 * 1024 * 1024 }; // 2MB

      fileStorageService.updateConfig(newConfig);
      const config = fileStorageService.getConfig();

      expect(config.maxFileSize).toBe(2 * 1024 * 1024);
    });
  });

  describe('file validation', () => {
    it('should validate PDF files correctly', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\ntest content');
      const validation = await (fileStorageService as any).validateFile(pdfBuffer, {
        ...mockMetadata,
        format: ExportFormat.PDF,
        mimeType: 'application/pdf'
      });

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should validate Excel files correctly', async () => {
      const excelBuffer = Buffer.from('PK\x03\x04test content');
      const validation = await (fileStorageService as any).validateFile(excelBuffer, {
        ...mockMetadata,
        format: ExportFormat.EXCEL,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should validate CSV files correctly', async () => {
      const csvBuffer = Buffer.from('name,age\nJohn,30');
      const validation = await (fileStorageService as any).validateFile(csvBuffer, {
        ...mockMetadata,
        format: ExportFormat.CSV,
        mimeType: 'text/csv'
      });

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('utility methods', () => {
    it('should generate secure file names', () => {
      const fileName1 = (fileStorageService as any).generateSecureFileName(mockMetadata);
      const fileName2 = (fileStorageService as any).generateSecureFileName(mockMetadata);

      expect(fileName1).toMatch(/^job-123_\d+_[a-f0-9]{16}\.pdf$/);
      expect(fileName2).toMatch(/^job-123_\d+_[a-f0-9]{16}\.pdf$/);
      expect(fileName1).not.toBe(fileName2); // Should be unique
    });

    it('should calculate checksums correctly', () => {
      const checksum1 = (fileStorageService as any).calculateChecksum(mockBuffer);
      const checksum2 = (fileStorageService as any).calculateChecksum(mockBuffer);

      expect(checksum1).toBe(checksum2);
      expect(checksum1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
    });

    it('should get correct file extensions', () => {
      expect((fileStorageService as any).getFileExtension(ExportFormat.PDF)).toBe('.pdf');
      expect((fileStorageService as any).getFileExtension(ExportFormat.EXCEL)).toBe('.xlsx');
      expect((fileStorageService as any).getFileExtension(ExportFormat.CSV)).toBe('.csv');
    });

    it('should generate user directories correctly', () => {
      const userDir = (fileStorageService as any).getUserDirectory(123);
      expect(userDir).toBe('user_123');
    });

    it('should generate date directories correctly', () => {
      const dateDir = (fileStorageService as any).getDateDirectory();
      expect(dateDir).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
    });
  });
});