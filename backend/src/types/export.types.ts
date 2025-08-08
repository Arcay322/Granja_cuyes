import { ExportFormat, ExportStatus } from '@prisma/client';

export interface ExportJobData {
  id: string;
  userId: number;
  templateId: string;
  format: ExportFormat;
  status: ExportStatus;
  parameters?: Record<string, any>;
  options?: Record<string, any>;
  progress: number;
  errorMessage?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
}

export interface ExportFileData {
  id: string;
  jobId: string;
  fileName: string;
  filePath: string;
  fileSize: bigint;
  mimeType: string;
  downloadCount: number;
  createdAt: Date;
  lastDownloadedAt?: Date;
}

export interface CreateExportJobRequest {
  templateId: string;
  format: ExportFormat;
  parameters?: {
    dateRange?: {
      from: string;
      to: string;
    };
    filters?: Record<string, any>;
  };
  options?: PDFOptions | ExcelOptions | CSVOptions;
}

export interface PDFOptions {
  pageSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  includeCharts: boolean;
  includeImages: boolean;
  compression: boolean;
}

export interface ExcelOptions {
  includeCharts: boolean;
  compression: boolean;
  multipleSheets: boolean;
}

export interface CSVOptions {
  encoding: 'utf8' | 'latin1';
  separator: ',' | ';' | '\t';
  includeHeaders: boolean;
}

export interface ExportStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  pendingJobs: number;
  processingJobs: number;
  timeoutJobs: number;
  totalDownloads: number;
  totalFileSize: bigint;
  byFormat: {
    pdf: number;
    excel: number;
    csv: number;
  };
  byTemplate: Record<string, number>;
  recentActivity: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
}

export interface JobWithFile extends ExportJobData {
  files: ExportFileData[];
}

export interface ExportJobUpdate {
  status?: ExportStatus;
  progress?: number;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
}

export enum ExportErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  FILE_GENERATION_ERROR = 'FILE_GENERATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR'
}

export interface ExportError {
  type: ExportErrorType;
  message: string;
  details?: any;
  retryable: boolean;
  userMessage: string;
}