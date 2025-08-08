import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { ExportFormat } from '@prisma/client';
import { ExportFileData } from '../../types/export.types';
import { fileStorageService } from './fileStorage.service';
import { reportsService } from './reports.service';
import logger from '../../utils/logger';

export interface DownloadOptions {
  inline?: boolean;
  customFileName?: string;
  enableCaching?: boolean;
  maxAge?: number;
}

export interface DownloadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  size?: number;
  downloadCount?: number;
  error?: string;
}

export interface StreamOptions {
  chunkSize: number;
  enableRangeRequests: boolean;
  compressionLevel: number;
}

export class FileDownloadService {
  private readonly defaultStreamOptions: StreamOptions = {
    chunkSize: 64 * 1024, // 64KB chunks
    enableRangeRequests: true,
    compressionLevel: 6
  };

  /**
   * Serve file download with proper headers and security
   */
  async serveFileDownload(
    req: Request,
    res: Response,
    fileId: string,
    userId: number,
    options: DownloadOptions = {}
  ): Promise<DownloadResult> {
    try {
      logger.info(`Serving file download: ${fileId} for user: ${userId}`);

      // Get file information and verify access
      const fileInfo = await fileStorageService.getFileInfo(fileId, userId);
      if (!fileInfo) {
        res.status(404).json({ error: 'File not found' });
        return { success: false, error: 'File not found' };
      }

      // Check if physical file exists
      const fileExists = await this.checkFileExists(fileInfo.filePath);
      if (!fileExists) {
        res.status(404).json({ error: 'File not available' });
        return { success: false, error: 'File not available' };
      }

      // Get file stats for headers
      const stats = await fs.promises.stat(fileInfo.filePath);

      // Set security headers
      this.setSecurityHeaders(res);

      // Set content headers
      this.setContentHeaders(res, fileInfo, options);

      // Set caching headers
      this.setCachingHeaders(res, options);

      // Handle range requests for large files
      if (options.enableCaching !== false && this.shouldUseRangeRequests(req, stats.size)) {
        return await this.handleRangeRequest(req, res, fileInfo, stats);
      }

      // Stream file to response
      await this.streamFile(res, fileInfo, stats);

      // Update download statistics
      await this.updateDownloadStats(fileId);

      logger.info(`File download completed: ${fileInfo.fileName} (${stats.size} bytes)`);

      return {
        success: true,
        fileId,
        fileName: fileInfo.fileName,
        size: Number(fileInfo.fileSize),
        downloadCount: fileInfo.downloadCount + 1
      };
    } catch (error) {
      logger.error(`Failed to serve file download ${fileId}:`, error);
      
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }

      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get file download URL with authentication token
   */
  async getDownloadUrl(
    fileId: string,
    userId: number,
    expiresInMinutes: number = 60
  ): Promise<{ url: string; expiresAt: Date } | null> {
    try {
      // Verify file exists and user has access
      const fileInfo = await fileStorageService.getFileInfo(fileId, userId);
      if (!fileInfo) {
        return null;
      }

      // Generate secure download token
      const token = this.generateDownloadToken(fileId, userId, expiresInMinutes);
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

      // Construct download URL
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      const url = `${baseUrl}/api/reports/download/${fileId}?token=${token}`;

      logger.info(`Generated download URL for file ${fileId}, expires at ${expiresAt}`);

      return { url, expiresAt };
    } catch (error) {
      logger.error(`Failed to generate download URL for ${fileId}:`, error);
      return null;
    }
  }

  /**
   * Validate download token
   */
  validateDownloadToken(token: string, fileId: string, userId: number): boolean {
    try {
      // In a real implementation, this would verify a JWT or similar token
      // For now, we'll implement a simple validation
      const expectedToken = this.generateDownloadToken(fileId, userId, 60);
      return token === expectedToken;
    } catch (error) {
      logger.error(`Token validation failed:`, error);
      return false;
    }
  }

  /**
   * Get file preview (for supported formats)
   */
  async serveFilePreview(
    req: Request,
    res: Response,
    fileId: string,
    userId: number
  ): Promise<DownloadResult> {
    try {
      logger.info(`Serving file preview: ${fileId} for user: ${userId}`);

      const fileInfo = await fileStorageService.getFileInfo(fileId, userId);
      if (!fileInfo) {
        res.status(404).json({ error: 'File not found' });
        return { success: false, error: 'File not found' };
      }

      // Check if format supports preview
      if (!this.supportsPreview(fileInfo.mimeType)) {
        res.status(400).json({ error: 'Preview not supported for this file type' });
        return { success: false, error: 'Preview not supported' };
      }

      // Set preview headers
      res.setHeader('Content-Type', fileInfo.mimeType);
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // Stream file for preview
      const stats = await fs.promises.stat(fileInfo.filePath);
      await this.streamFile(res, fileInfo, stats);

      return {
        success: true,
        fileId,
        fileName: fileInfo.fileName,
        size: Number(fileInfo.fileSize)
      };
    } catch (error) {
      logger.error(`Failed to serve file preview ${fileId}:`, error);
      
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }

      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get download statistics for a file
   */
  async getDownloadStats(fileId: string, userId: number): Promise<{
    downloadCount: number;
    lastDownloadedAt: Date | null;
    fileSize: bigint;
    createdAt: Date;
  } | null> {
    try {
      const fileInfo = await fileStorageService.getFileInfo(fileId, userId);
      if (!fileInfo) {
        return null;
      }

      return {
        downloadCount: fileInfo.downloadCount,
        lastDownloadedAt: fileInfo.lastDownloadedAt,
        fileSize: fileInfo.fileSize,
        createdAt: fileInfo.createdAt
      };
    } catch (error) {
      logger.error(`Failed to get download stats for ${fileId}:`, error);
      return null;
    }
  }

  /**
   * Stream file with chunked transfer
   */
  private async streamFile(
    res: Response,
    fileInfo: ExportFileData,
    stats: fs.Stats
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(fileInfo.filePath, {
        highWaterMark: this.defaultStreamOptions.chunkSize
      });

      stream.on('error', (error) => {
        logger.error(`Stream error for file ${fileInfo.fileName}:`, error);
        reject(error);
      });

      stream.on('end', () => {
        logger.debug(`Stream completed for file ${fileInfo.fileName}`);
        resolve();
      });

      // Set content length
      res.setHeader('Content-Length', stats.size);

      // Pipe stream to response
      stream.pipe(res);
    });
  }

  /**
   * Handle HTTP range requests for large files
   */
  private async handleRangeRequest(
    req: Request,
    res: Response,
    fileInfo: ExportFileData,
    stats: fs.Stats
  ): Promise<DownloadResult> {
    const range = req.headers.range;
    if (!range) {
      // No range requested, serve full file
      await this.streamFile(res, fileInfo, stats);
      return { success: true, fileId: fileInfo.id, fileName: fileInfo.fileName };
    }

    // Parse range header
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
    const chunkSize = (end - start) + 1;

    // Validate range
    if (start >= stats.size || end >= stats.size) {
      res.status(416).json({ error: 'Range not satisfiable' });
      return { success: false, error: 'Invalid range' };
    }

    // Set partial content headers
    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', chunkSize);

    // Create range stream
    const stream = fs.createReadStream(fileInfo.filePath, { start, end });
    
    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('end', () => resolve({ 
        success: true, 
        fileId: fileInfo.id, 
        fileName: fileInfo.fileName 
      }));
      stream.pipe(res);
    });
  }

  /**
   * Set security headers
   */
  private setSecurityHeaders(res: Response): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
  }

  /**
   * Set content headers
   */
  private setContentHeaders(
    res: Response,
    fileInfo: ExportFileData,
    options: DownloadOptions
  ): void {
    // Set content type
    res.setHeader('Content-Type', fileInfo.mimeType);

    // Set content disposition
    const fileName = options.customFileName || fileInfo.fileName;
    const disposition = options.inline ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${disposition}; filename="${fileName}"`);

    // Set additional headers
    res.setHeader('Accept-Ranges', 'bytes');
  }

  /**
   * Set caching headers
   */
  private setCachingHeaders(res: Response, options: DownloadOptions): void {
    if (options.enableCaching === false) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      const maxAge = options.maxAge || 3600; // 1 hour default
      res.setHeader('Cache-Control', `private, max-age=${maxAge}`);
      res.setHeader('ETag', `"${Date.now()}"`);
    }
  }

  /**
   * Check if file exists
   */
  private async checkFileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Determine if range requests should be used
   */
  private shouldUseRangeRequests(req: Request, fileSize: number): boolean {
    const threshold = 1024 * 1024; // 1MB
    return fileSize > threshold && this.defaultStreamOptions.enableRangeRequests;
  }

  /**
   * Check if file format supports preview
   */
  private supportsPreview(mimeType: string): boolean {
    const previewableMimeTypes = [
      'application/pdf',
      'text/csv',
      'text/plain'
    ];
    return previewableMimeTypes.includes(mimeType);
  }

  /**
   * Generate download token
   */
  private generateDownloadToken(fileId: string, userId: number, expiresInMinutes: number): string {
    // In a real implementation, this would generate a JWT or similar secure token
    // For now, we'll create a simple hash-based token
    const crypto = require('crypto');
    const payload = `${fileId}:${userId}:${Date.now() + (expiresInMinutes * 60 * 1000)}`;
    const secret = process.env.JWT_SECRET || 'default-secret';
    
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Update download statistics
   */
  private async updateDownloadStats(fileId: string): Promise<void> {
    try {
      await reportsService.incrementDownloadCount(fileId);
    } catch (error) {
      // Don't fail the download if stats update fails
      logger.warn(`Failed to update download stats for ${fileId}:`, error);
    }
  }

  /**
   * Get MIME type for file format
   */
  getMimeType(format: ExportFormat): string {
    switch (format) {
      case ExportFormat.PDF:
        return 'application/pdf';
      case ExportFormat.EXCEL:
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case ExportFormat.CSV:
        return 'text/csv';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Get file extension for format
   */
  getFileExtension(format: ExportFormat): string {
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
   * Validate file access permissions
   */
  async validateFileAccess(fileId: string, userId: number): Promise<boolean> {
    try {
      const fileInfo = await fileStorageService.getFileInfo(fileId, userId);
      return fileInfo !== null;
    } catch (error) {
      logger.error(`Failed to validate file access for ${fileId}:`, error);
      return false;
    }
  }

  /**
   * Get download configuration
   */
  getDownloadConfig(): {
    maxFileSize: number;
    supportedFormats: ExportFormat[];
    defaultChunkSize: number;
    enableRangeRequests: boolean;
  } {
    return {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      supportedFormats: [ExportFormat.PDF, ExportFormat.EXCEL, ExportFormat.CSV],
      defaultChunkSize: this.defaultStreamOptions.chunkSize,
      enableRangeRequests: this.defaultStreamOptions.enableRangeRequests
    };
  }
}

export const fileDownloadService = new FileDownloadService();