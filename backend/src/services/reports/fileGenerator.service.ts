import path from 'path';
import fs from 'fs/promises';
import { ExportFormat } from '@prisma/client';
import { PDFOptions, ExcelOptions, CSVOptions } from '../../types/export.types';
import { pdfGeneratorService } from './pdfGenerator.service';
import { excelGeneratorService } from './excelGenerator.service';
import { csvGeneratorService } from './csvGenerator.service';
import logger from '../../utils/logger';

export interface FileGenerationResult {
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileName: string;
}

export interface FileGenerationOptions {
  format: ExportFormat;
  options: PDFOptions | ExcelOptions | CSVOptions;
  outputDirectory?: string;
  fileName?: string;
}

export class FileGeneratorService {
  private readonly maxFileSize = 100 * 1024 * 1024; // 100MB
  private readonly allowedFormats: ExportFormat[] = [ExportFormat.PDF, ExportFormat.EXCEL, ExportFormat.CSV];
  
  /**
   * Generate file based on format and options
   */
  async generateFile(
    reportData: any,
    generationOptions: FileGenerationOptions
  ): Promise<FileGenerationResult> {
    try {
      logger.info(`Starting file generation: ${generationOptions.format}`);
      
      // Validate inputs
      this.validateInputs(reportData, generationOptions);
      
      // Generate output path
      const outputPath = this.generateOutputPath(generationOptions);
      
      // Ensure output directory exists
      await this.ensureDirectoryExists(path.dirname(outputPath));
      
      // Generate file based on format
      let result: { filePath: string; fileSize: number };
      
      switch (generationOptions.format) {
        case ExportFormat.PDF:
          result = await pdfGeneratorService.generatePDF(
            reportData,
            generationOptions.options as PDFOptions,
            outputPath
          );
          break;
          
        case ExportFormat.EXCEL:
          result = await excelGeneratorService.generateExcel(
            reportData,
            generationOptions.options as ExcelOptions,
            outputPath
          );
          break;
          
        case ExportFormat.CSV:
          result = await csvGeneratorService.generateCSV(
            reportData,
            generationOptions.options as CSVOptions,
            outputPath
          );
          break;
          
        default:
          throw new Error(`Unsupported format: ${generationOptions.format}`);
      }
      
      // Validate file size
      this.validateFileSize(result.fileSize);
      
      // Verify file exists
      await this.verifyFileExists(result.filePath);
      
      const fileResult: FileGenerationResult = {
        filePath: result.filePath,
        fileSize: result.fileSize,
        mimeType: this.getMimeType(generationOptions.format),
        fileName: path.basename(result.filePath)
      };
      
      logger.info(`File generation completed: ${fileResult.fileName} (${fileResult.fileSize} bytes)`);
      
      return fileResult;
    } catch (error) {
      logger.error('File generation failed:', error);
      throw new Error(`File generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate multiple files for different formats
   */
  async generateMultipleFiles(
    reportData: any,
    formats: Array<{ format: ExportFormat; options: PDFOptions | ExcelOptions | CSVOptions }>
  ): Promise<FileGenerationResult[]> {
    try {
      logger.info(`Generating multiple files: ${formats.map(f => f.format).join(', ')}`);
      
      const results: FileGenerationResult[] = [];
      
      for (const formatConfig of formats) {
        const generationOptions: FileGenerationOptions = {
          format: formatConfig.format,
          options: formatConfig.options
        };
        
        const result = await this.generateFile(reportData, generationOptions);
        results.push(result);
      }
      
      logger.info(`Multiple file generation completed: ${results.length} files`);
      
      return results;
    } catch (error) {
      logger.error('Multiple file generation failed:', error);
      throw new Error(`Multiple file generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate file and clean up if corrupted
   */
  async validateAndCleanupFile(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      
      // Check if file exists and has content
      if (stats.size === 0) {
        logger.warn(`Empty file detected, cleaning up: ${filePath}`);
        await this.deleteFile(filePath);
        return false;
      }
      
      // Check file size limits
      if (stats.size > this.maxFileSize) {
        logger.warn(`File too large, cleaning up: ${filePath} (${stats.size} bytes)`);
        await this.deleteFile(filePath);
        return false;
      }
      
      // Additional format-specific validation could be added here
      
      return true;
    } catch (error) {
      logger.error(`File validation failed: ${filePath}`, error);
      return false;
    }
  }

  /**
   * Delete file safely
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      logger.info(`File deleted: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to delete file: ${filePath}`, error);
      // Don't throw error for cleanup operations
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(filePath: string): Promise<{
    exists: boolean;
    size?: number;
    mimeType?: string;
    fileName?: string;
  }> {
    try {
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      const extension = path.extname(filePath).toLowerCase();
      
      return {
        exists: true,
        size: stats.size,
        mimeType: this.getMimeTypeFromExtension(extension),
        fileName
      };
    } catch (error) {
      return { exists: false };
    }
  }

  /**
   * Clean up temporary files older than specified age
   */
  async cleanupTempFiles(directory: string, maxAgeHours: number = 24): Promise<number> {
    try {
      logger.info(`Cleaning up temporary files in: ${directory}`);
      
      const files = await fs.readdir(directory);
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
      let cleanedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(directory, file);
        
        try {
          const stats = await fs.stat(filePath);
          
          if (stats.mtime.getTime() < cutoffTime) {
            await this.deleteFile(filePath);
            cleanedCount++;
          }
        } catch (error) {
          logger.warn(`Failed to process file during cleanup: ${filePath}`, error);
        }
      }
      
      logger.info(`Cleanup completed: ${cleanedCount} files removed`);
      return cleanedCount;
    } catch (error) {
      logger.error(`Cleanup failed for directory: ${directory}`, error);
      return 0;
    }
  }

  /**
   * Validate inputs
   */
  private validateInputs(reportData: any, options: FileGenerationOptions): void {
    if (!reportData) {
      throw new Error('Report data is required');
    }
    
    if (!reportData.templateId) {
      throw new Error('Template ID is required in report data');
    }
    
    if (!reportData.data) {
      throw new Error('Data is required in report data');
    }
    
    if (!options.format) {
      throw new Error('Format is required');
    }
    
    if (!this.allowedFormats.includes(options.format)) {
      throw new Error(`Unsupported format: ${options.format}`);
    }
    
    if (!options.options) {
      throw new Error('Format options are required');
    }
  }

  /**
   * Generate output path
   */
  private generateOutputPath(options: FileGenerationOptions): string {
    const outputDir = options.outputDirectory || 'temp/exports';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomId = Math.random().toString(36).substring(2, 8);
    
    let fileName = options.fileName;
    if (!fileName) {
      fileName = `report_${timestamp}_${randomId}`;
    }
    
    // Remove extension if present
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    
    // Add appropriate extension
    const extension = this.getFileExtension(options.format);
    const fullFileName = `${baseName}.${extension}`;
    
    return path.join(outputDir, fullFileName);
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
      logger.info(`Created directory: ${dirPath}`);
    }
  }

  /**
   * Validate file size
   */
  private validateFileSize(fileSize: number): void {
    if (fileSize === 0) {
      throw new Error('Generated file is empty');
    }
    
    if (fileSize > this.maxFileSize) {
      throw new Error(`Generated file is too large: ${fileSize} bytes (max: ${this.maxFileSize} bytes)`);
    }
  }

  /**
   * Verify file exists
   */
  private async verifyFileExists(filePath: string): Promise<void> {
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new Error(`Generated file does not exist: ${filePath}`);
    }
  }

  /**
   * Get MIME type for format
   */
  private getMimeType(format: ExportFormat): string {
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
   * Get MIME type from file extension
   */
  private getMimeTypeFromExtension(extension: string): string {
    switch (extension) {
      case '.pdf':
        return 'application/pdf';
      case '.xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case '.csv':
        return 'text/csv';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Get file extension for format
   */
  private getFileExtension(format: ExportFormat): string {
    switch (format) {
      case ExportFormat.PDF:
        return 'pdf';
      case ExportFormat.EXCEL:
        return 'xlsx';
      case ExportFormat.CSV:
        return 'csv';
      default:
        throw new Error(`Unknown format: ${format}`);
    }
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): ExportFormat[] {
    return [...this.allowedFormats];
  }

  /**
   * Get format validation rules
   */
  getFormatValidationRules(format: ExportFormat): any {
    switch (format) {
      case ExportFormat.PDF:
        return {
          maxFileSize: this.maxFileSize,
          requiredOptions: ['pageSize', 'orientation'],
          supportedPageSizes: ['A4', 'Letter', 'Legal'],
          supportedOrientations: ['portrait', 'landscape']
        };
      case ExportFormat.EXCEL:
        return {
          maxFileSize: this.maxFileSize,
          requiredOptions: ['includeCharts'],
          supportedOptions: ['compression', 'multipleSheets']
        };
      case ExportFormat.CSV:
        return {
          maxFileSize: this.maxFileSize,
          requiredOptions: ['separator'],
          supportedSeparators: [',', ';', '\t'],
          supportedEncodings: ['utf8', 'latin1']
        };
      default:
        return {};
    }
  }

  /**
   * Close all generators (cleanup resources)
   */
  async cleanup(): Promise<void> {
    try {
      await pdfGeneratorService.closeBrowser();
      logger.info('File generator service cleanup completed');
    } catch (error) {
      logger.error('Error during file generator cleanup:', error);
    }
  }
}

export const fileGeneratorService = new FileGeneratorService();