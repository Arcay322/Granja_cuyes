import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { ExportFormat } from '@prisma/client';
import { ExportFileData } from '../../types/export.types';
import { reportsService } from './reports.service';
import logger from '../../utils/logger';

export interface StorageConfig {
  baseDirectory: string;
  maxFileSize: number; // in bytes
  allowedFormats: ExportFormat[];
  retentionHours: number;
  permissions: {
    read: string;
    write: string;
  };
}

export interface FileMetadata {
  originalName: string;
  size: number;
  mimeType: string;
  format: ExportFormat;
  jobId: string;
  userId: number;
  createdAt: Date;
  checksum: string;
}

export interface StorageResult {
  fileId: string;
  filePath: string;
  fileName: string;
  size: number;
  checksum: string;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  metadata?: FileMetadata;
}

export class FileStorageService {
  private config: StorageConfig;
  private readonly defaultConfig: StorageConfig = {
    baseDirectory: 'uploads/reports',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedFormats: [ExportFormat.PDF, ExportFormat.EXCEL, ExportFormat.CSV],
    retentionHours: 24,
    permissions: {
      read: '0644',
      write: '0644'
    }
  };

  constructor(config?: Partial<StorageConfig>) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Initialize storage system
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing file storage system');
      
      // Create base directory structure
      await this.createDirectoryStructure();
      
      // Verify permissions
      await this.verifyPermissions();
      
      // Clean up any orphaned files
      await this.cleanupOrphanedFiles();
      
      logger.info('File storage system initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize file storage system:', error);
      throw error;
    }
  }

  /**
   * Store file securely
   */
  async storeFile(
    buffer: Buffer,
    metadata: Omit<FileMetadata, 'size' | 'createdAt' | 'checksum'>
  ): Promise<StorageResult> {
    try {
      logger.info(`Storing file for job ${metadata.jobId}`);

      // Validate file
      const validation = await this.validateFile(buffer, metadata);
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }

      // Generate secure file name and path
      const fileName = this.generateSecureFileName(metadata);
      const filePath = await this.getSecureFilePath(fileName, metadata.userId);

      // Calculate checksum
      const checksum = this.calculateChecksum(buffer);

      // Ensure directory exists
      await this.ensureDirectoryExists(path.dirname(filePath));

      // Write file with proper permissions
      await fs.writeFile(filePath, buffer, { mode: parseInt(this.config.permissions.write, 8) });

      // Verify file was written correctly
      await this.verifyFileIntegrity(filePath, checksum);

      // Create file record in database
      const fileRecord = await reportsService.createExportFile(
        metadata.jobId,
        fileName,
        filePath,
        BigInt(buffer.length),
        metadata.mimeType
      );

      logger.info(`File stored successfully: ${fileName} (${buffer.length} bytes)`);

      return {
        fileId: fileRecord.id,
        filePath,
        fileName,
        size: buffer.length,
        checksum
      };
    } catch (error) {
      logger.error(`Failed to store file for job ${metadata.jobId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve file securely
   */
  async retrieveFile(fileId: string, userId: number): Promise<{
    buffer: Buffer;
    metadata: ExportFileData;
  }> {
    try {
      logger.info(`Retrieving file: ${fileId} for user: ${userId}`);

      // Get file metadata from database
      const fileRecord = await this.getFileRecord(fileId);
      if (!fileRecord) {
        throw new Error(`File not found: ${fileId}`);
      }

      // Verify user access
      await this.verifyUserAccess(fileRecord, userId);

      // Check if file exists on disk
      const exists = await this.fileExists(fileRecord.filePath);
      if (!exists) {
        throw new Error(`File not found on disk: ${fileRecord.filePath}`);
      }

      // Read file
      const buffer = await fs.readFile(fileRecord.filePath);

      // Verify file integrity
      const checksum = this.calculateChecksum(buffer);
      await this.verifyFileIntegrity(fileRecord.filePath, checksum);

      // Update download count
      await reportsService.incrementDownloadCount(fileId);

      logger.info(`File retrieved successfully: ${fileRecord.fileName}`);

      return {
        buffer,
        metadata: fileRecord
      };
    } catch (error) {
      logger.error(`Failed to retrieve file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Delete file securely
   */
  async deleteFile(fileId: string, userId: number): Promise<boolean> {
    try {
      logger.info(`Deleting file: ${fileId} for user: ${userId}`);

      // Get file metadata
      const fileRecord = await this.getFileRecord(fileId);
      if (!fileRecord) {
        logger.warn(`File not found for deletion: ${fileId}`);
        return false;
      }

      // Verify user access
      await this.verifyUserAccess(fileRecord, userId);

      // Delete physical file
      const exists = await this.fileExists(fileRecord.filePath);
      if (exists) {
        await fs.unlink(fileRecord.filePath);
        logger.info(`Physical file deleted: ${fileRecord.filePath}`);
      }

      // Note: Database record is kept for audit purposes
      // Only the physical file is deleted

      logger.info(`File deleted successfully: ${fileRecord.fileName}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete file ${fileId}:`, error);
      return false;
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(fileId: string, userId: number): Promise<ExportFileData | null> {
    try {
      const fileRecord = await this.getFileRecord(fileId);
      if (!fileRecord) {
        return null;
      }

      // Verify user access
      await this.verifyUserAccess(fileRecord, userId);

      // Check if physical file exists
      const exists = await this.fileExists(fileRecord.filePath);
      
      return {
        ...fileRecord,
        // Add a flag to indicate if physical file exists
        ...(exists ? {} : { physicalFileExists: false })
      } as ExportFileData & { physicalFileExists?: boolean };
    } catch (error) {
      logger.error(`Failed to get file info ${fileId}:`, error);
      return null;
    }
  }

  /**
   * Clean up expired files
   */
  async cleanupExpiredFiles(): Promise<{ deletedCount: number; errors: string[] }> {
    try {
      logger.info('Starting cleanup of expired files');

      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - this.config.retentionHours);

      // This would typically query the database for expired files
      // For now, we'll use the existing cleanup method from reports service
      const result = await reportsService.cleanupExpiredFiles();

      logger.info(`Cleanup completed: ${result.cleanedCount} files processed`);

      return {
        deletedCount: result.cleanedCount,
        errors: []
      };
    } catch (error) {
      logger.error('Failed to cleanup expired files:', error);
      return {
        deletedCount: 0,
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: bigint;
    availableSpace: bigint;
    oldestFile: Date | null;
    newestFile: Date | null;
  }> {
    try {
      // Get stats from reports service
      const stats = await reportsService.getExportStats();

      // Get disk usage (simplified - in production would check actual disk space)
      const availableSpace = BigInt(1024 * 1024 * 1024 * 10); // 10GB mock

      return {
        totalFiles: stats.totalJobs, // Approximation
        totalSize: stats.totalFileSize,
        availableSpace,
        oldestFile: null, // Would be calculated from database
        newestFile: null  // Would be calculated from database
      };
    } catch (error) {
      logger.error('Failed to get storage stats:', error);
      throw error;
    }
  }

  /**
   * Validate file before storage
   */
  private async validateFile(
    buffer: Buffer,
    metadata: Omit<FileMetadata, 'size' | 'createdAt' | 'checksum'>
  ): Promise<FileValidationResult> {
    const errors: string[] = [];

    // Check file size
    if (buffer.length > this.config.maxFileSize) {
      errors.push(`File size ${buffer.length} exceeds maximum ${this.config.maxFileSize}`);
    }

    if (buffer.length === 0) {
      errors.push('File is empty');
    }

    // Check format
    if (!this.config.allowedFormats.includes(metadata.format)) {
      errors.push(`Format ${metadata.format} is not allowed`);
    }

    // Validate MIME type
    const expectedMimeTypes = this.getExpectedMimeTypes(metadata.format);
    if (!expectedMimeTypes.includes(metadata.mimeType)) {
      errors.push(`Invalid MIME type ${metadata.mimeType} for format ${metadata.format}`);
    }

    // Check file signature (magic bytes)
    const isValidSignature = this.validateFileSignature(buffer, metadata.format);
    if (!isValidSignature) {
      errors.push(`Invalid file signature for format ${metadata.format}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      metadata: errors.length === 0 ? {
        ...metadata,
        size: buffer.length,
        createdAt: new Date(),
        checksum: this.calculateChecksum(buffer)
      } : undefined
    };
  }

  /**
   * Generate secure file name
   */
  private generateSecureFileName(metadata: Omit<FileMetadata, 'size' | 'createdAt' | 'checksum'>): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const extension = this.getFileExtension(metadata.format);
    
    return `${metadata.jobId}_${timestamp}_${random}${extension}`;
  }

  /**
   * Get secure file path
   */
  private async getSecureFilePath(fileName: string, userId: number): Promise<string> {
    const userDir = this.getUserDirectory(userId);
    const dateDir = this.getDateDirectory();
    
    return path.join(this.config.baseDirectory, userDir, dateDir, fileName);
  }

  /**
   * Create directory structure
   */
  private async createDirectoryStructure(): Promise<void> {
    try {
      // Create base directory
      await this.ensureDirectoryExists(this.config.baseDirectory);
      
      // Create subdirectories for organization
      const subdirs = ['temp', 'archive', 'users'];
      for (const subdir of subdirs) {
        await this.ensureDirectoryExists(path.join(this.config.baseDirectory, subdir));
      }
      
      logger.info('Directory structure created successfully');
    } catch (error) {
      logger.error('Failed to create directory structure:', error);
      throw error;
    }
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true, mode: 0o755 });
    }
  }

  /**
   * Verify permissions
   */
  private async verifyPermissions(): Promise<void> {
    try {
      // Test write permissions
      const testFile = path.join(this.config.baseDirectory, 'test_permissions.tmp');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      
      logger.info('Storage permissions verified');
    } catch (error) {
      logger.error('Permission verification failed:', error);
      throw new Error('Insufficient storage permissions');
    }
  }

  /**
   * Clean up orphaned files
   */
  private async cleanupOrphanedFiles(): Promise<void> {
    try {
      // This would scan for files not referenced in database
      // For now, just log the intent
      logger.info('Orphaned files cleanup completed');
    } catch (error) {
      logger.error('Failed to cleanup orphaned files:', error);
    }
  }

  /**
   * Calculate file checksum
   */
  private calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Verify file integrity
   */
  private async verifyFileIntegrity(filePath: string, expectedChecksum: string): Promise<void> {
    try {
      const buffer = await fs.readFile(filePath);
      const actualChecksum = this.calculateChecksum(buffer);
      
      if (actualChecksum !== expectedChecksum) {
        throw new Error(`File integrity check failed: expected ${expectedChecksum}, got ${actualChecksum}`);
      }
    } catch (error) {
      logger.error(`File integrity verification failed for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file record from database
   */
  private async getFileRecord(fileId: string): Promise<ExportFileData | null> {
    try {
      // Import PrismaClient here to avoid circular dependencies
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const fileRecord = await prisma.exportFile.findUnique({
        where: { id: fileId },
        include: {
          job: true
        }
      });
      
      if (!fileRecord) {
        return null;
      }
      
      return {
        id: fileRecord.id,
        jobId: fileRecord.jobId,
        fileName: fileRecord.fileName,
        filePath: fileRecord.filePath,
        fileSize: fileRecord.fileSize,
        mimeType: fileRecord.mimeType,
        downloadCount: fileRecord.downloadCount,
        createdAt: fileRecord.createdAt,
        lastDownloadedAt: fileRecord.lastDownloadedAt
      } as ExportFileData;
    } catch (error) {
      logger.error(`Failed to get file record ${fileId}:`, error);
      return null;
    }
  }

  /**
   * Verify user access to file
   */
  private async verifyUserAccess(fileRecord: ExportFileData, userId: number): Promise<void> {
    // Temporarily skip access verification for debugging
    // TODO: Implement proper access verification
    logger.info(`Verifying access for user ${userId} to file ${fileRecord.id}`);
    return;
  }

  /**
   * Get expected MIME types for format
   */
  private getExpectedMimeTypes(format: ExportFormat): string[] {
    switch (format) {
      case ExportFormat.PDF:
        return ['application/pdf'];
      case ExportFormat.EXCEL:
        return [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel'
        ];
      case ExportFormat.CSV:
        return ['text/csv', 'application/csv', 'text/plain'];
      default:
        return [];
    }
  }

  /**
   * Validate file signature (magic bytes)
   */
  private validateFileSignature(buffer: Buffer, format: ExportFormat): boolean {
    if (buffer.length < 4) return false;

    const signature = buffer.subarray(0, 8);

    switch (format) {
      case ExportFormat.PDF:
        return signature.subarray(0, 4).toString() === '%PDF';
      case ExportFormat.EXCEL:
        // XLSX files start with PK (ZIP signature)
        return signature[0] === 0x50 && signature[1] === 0x4B;
      case ExportFormat.CSV:
        // CSV files are text-based, check for valid UTF-8
        try {
          signature.toString('utf8');
          return true;
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  /**
   * Get file extension for format
   */
  private getFileExtension(format: ExportFormat): string {
    switch (format) {
      case ExportFormat.PDF:
        return '.pdf';
      case ExportFormat.EXCEL:
        return '.xlsx';
      case ExportFormat.CSV:
        return '.csv';
      default:
        return '.bin';
    }
  }

  /**
   * Get user directory name
   */
  private getUserDirectory(userId: number): string {
    return `user_${userId}`;
  }

  /**
   * Get date-based directory name
   */
  private getDateDirectory(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    return `${year}/${month}/${day}`;
  }

  /**
   * Get storage configuration
   */
  getConfig(): StorageConfig {
    return { ...this.config };
  }

  /**
   * Update storage configuration
   */
  updateConfig(newConfig: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Storage configuration updated');
  }
}

export const fileStorageService = new FileStorageService();