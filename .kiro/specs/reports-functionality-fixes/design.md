# Design Document - Corrección de Funcionalidades de Reportes

## Overview

Este diseño implementa un sistema completo de generación, procesamiento y descarga de reportes para el módulo de reproducción. La solución incluye generación real de archivos, sistema de jobs asíncronos, almacenamiento seguro, y una experiencia de usuario mejorada con feedback en tiempo real.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   File System  │
│                 │    │                  │    │                 │
│ ReportsGenerator│◄──►│ Reports API      │◄──►│ /uploads/reports│
│ ReportsHistory  │    │ Jobs Queue       │    │ /temp/exports   │
│ ExportOptions   │    │ File Generator   │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │    Database      │
                       │                  │
                       │ export_jobs      │
                       │ export_files     │
                       │ export_stats     │
                       └──────────────────┘
```

### Component Architecture

```
Backend Components:
├── Controllers/
│   └── reports.controller.ts (Enhanced)
├── Services/
│   ├── reports.service.ts (New)
│   ├── fileGenerator.service.ts (New)
│   └── jobQueue.service.ts (New)
├── Models/
│   ├── ExportJob.ts (New)
│   └── ExportFile.ts (New)
└── Utils/
    ├── pdfGenerator.ts (New)
    ├── excelGenerator.ts (New)
    └── csvGenerator.ts (New)

Frontend Components:
├── ReportsGenerator.tsx (Enhanced)
├── ReportsHistory.tsx (Enhanced)
├── ExportOptions.tsx (Enhanced)
└── Components/
    ├── ExportProgress.tsx (New)
    ├── JobStatusIndicator.tsx (New)
    └── FileDownloadButton.tsx (New)
```

## Components and Interfaces

### Database Schema

#### ExportJobs Table
```sql
CREATE TABLE export_jobs (
  id VARCHAR(36) PRIMARY KEY,
  user_id INTEGER NOT NULL,
  template_id VARCHAR(50) NOT NULL,
  format ENUM('pdf', 'excel', 'csv') NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed', 'timeout') DEFAULT 'pending',
  parameters JSON,
  options JSON,
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  INDEX idx_user_status (user_id, status),
  INDEX idx_created_at (created_at),
  INDEX idx_expires_at (expires_at)
);
```

#### ExportFiles Table
```sql
CREATE TABLE export_files (
  id VARCHAR(36) PRIMARY KEY,
  job_id VARCHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_downloaded_at TIMESTAMP NULL,
  FOREIGN KEY (job_id) REFERENCES export_jobs(id) ON DELETE CASCADE,
  INDEX idx_job_id (job_id)
);
```

### Backend Services

#### ReportsService
```typescript
interface ReportsService {
  // Job Management
  createExportJob(userId: number, templateId: string, format: string, parameters: any, options: any): Promise<ExportJob>;
  getJobStatus(jobId: string): Promise<ExportJob>;
  getJobHistory(userId: number, limit: number, offset: number): Promise<ExportJob[]>;
  
  // File Operations
  generateReportFile(job: ExportJob): Promise<ExportFile>;
  getFileForDownload(jobId: string): Promise<{ file: ExportFile, stream: ReadStream }>;
  cleanupExpiredFiles(): Promise<{ cleanedCount: number }>;
  
  // Statistics
  getExportStats(userId?: number): Promise<ExportStats>;
}
```

#### FileGeneratorService
```typescript
interface FileGeneratorService {
  generatePDF(reportData: any, options: PDFOptions): Promise<{ filePath: string, fileSize: number }>;
  generateExcel(reportData: any, options: ExcelOptions): Promise<{ filePath: string, fileSize: number }>;
  generateCSV(reportData: any, options: CSVOptions): Promise<{ filePath: string, fileSize: number }>;
}

interface PDFOptions {
  pageSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  includeCharts: boolean;
  includeImages: boolean;
  compression: boolean;
}

interface ExcelOptions {
  includeCharts: boolean;
  compression: boolean;
  multipleSheets: boolean;
}

interface CSVOptions {
  encoding: 'utf8' | 'latin1';
  separator: ',' | ';' | '\t';
  includeHeaders: boolean;
}
```

#### JobQueueService
```typescript
interface JobQueueService {
  addJob(job: ExportJob): Promise<void>;
  processNextJob(): Promise<void>;
  getQueueStatus(): Promise<{ pending: number, processing: number }>;
  cancelJob(jobId: string): Promise<void>;
  retryFailedJob(jobId: string): Promise<void>;
}
```

### Frontend Components

#### Enhanced ReportsGenerator
```typescript
interface ReportsGeneratorState {
  templates: ReportTemplate[];
  selectedTemplate: ReportTemplate | null;
  loading: boolean;
  generating: boolean;
  error: string | null;
  activeJobs: ExportJob[];
  showExportOptions: boolean;
  exportProgress: { [jobId: string]: number };
}

interface ReportsGeneratorProps {
  onJobCreated?: (job: ExportJob) => void;
  onJobCompleted?: (job: ExportJob) => void;
  onJobFailed?: (job: ExportJob, error: string) => void;
}
```

#### ExportProgress Component
```typescript
interface ExportProgressProps {
  job: ExportJob;
  onCancel?: (jobId: string) => void;
  onRetry?: (jobId: string) => void;
}

interface ExportProgressState {
  progress: number;
  status: JobStatus;
  estimatedTimeRemaining: number;
  canCancel: boolean;
}
```

#### JobStatusIndicator Component
```typescript
interface JobStatusIndicatorProps {
  status: JobStatus;
  progress?: number;
  error?: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}
```

## Data Models

### ExportJob Model
```typescript
interface ExportJob {
  id: string;
  userId: number;
  templateId: string;
  format: 'pdf' | 'excel' | 'csv';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'timeout';
  parameters: {
    dateRange?: { from: string; to: string };
    filters?: Record<string, any>;
  };
  options: PDFOptions | ExcelOptions | CSVOptions;
  progress: number;
  errorMessage?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
  file?: ExportFile;
}
```

### ExportFile Model
```typescript
interface ExportFile {
  id: string;
  jobId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  downloadCount: number;
  createdAt: Date;
  lastDownloadedAt?: Date;
}
```

### ExportStats Model
```typescript
interface ExportStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  pendingJobs: number;
  processingJobs: number;
  totalDownloads: number;
  totalFileSize: number;
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
```

## Error Handling

### Error Types
```typescript
enum ExportErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  FILE_GENERATION_ERROR = 'FILE_GENERATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR'
}

interface ExportError {
  type: ExportErrorType;
  message: string;
  details?: any;
  retryable: boolean;
  userMessage: string;
}
```

### Error Recovery Strategy
```typescript
interface ErrorRecoveryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  timeoutMs: number;
  fallbackActions: string[];
}
```

## Testing Strategy

### Unit Tests
- **Services**: Test each service method independently
- **File Generators**: Test PDF, Excel, CSV generation with various inputs
- **Job Queue**: Test job processing, queuing, and error handling
- **Database Operations**: Test CRUD operations and transactions

### Integration Tests
- **End-to-End Export Flow**: From request to file download
- **Job Processing Pipeline**: Test complete job lifecycle
- **File Storage and Retrieval**: Test file operations
- **API Endpoints**: Test all report endpoints with various scenarios

### Performance Tests
- **Concurrent Exports**: Test multiple simultaneous exports
- **Large Data Sets**: Test with large report data
- **File Size Limits**: Test with various file sizes
- **Memory Usage**: Monitor memory during file generation

### Error Scenario Tests
- **Network Failures**: Test API resilience
- **Database Failures**: Test transaction rollbacks
- **File System Errors**: Test storage error handling
- **Timeout Scenarios**: Test job timeout handling

## Implementation Plan

### Phase 1: Database and Core Services
1. Create database migrations for export_jobs and export_files tables
2. Implement ExportJob and ExportFile models
3. Create ReportsService with basic CRUD operations
4. Implement JobQueueService with in-memory queue

### Phase 2: File Generation
1. Implement PDFGenerator using puppeteer or similar
2. Implement ExcelGenerator using exceljs
3. Implement CSVGenerator using csv-writer
4. Create FileGeneratorService to coordinate generators
5. Add file storage and cleanup utilities

### Phase 3: API Enhancement
1. Update reports controller with new endpoints
2. Add job status polling endpoints
3. Implement file download endpoint with security
4. Add cleanup and statistics endpoints
5. Update API documentation

### Phase 4: Frontend Enhancement
1. Update ReportsGenerator with job management
2. Create ExportProgress component
3. Enhance ReportsHistory with real data
4. Add JobStatusIndicator component
5. Implement real-time status updates

### Phase 5: Error Handling and Polish
1. Implement comprehensive error handling
2. Add retry mechanisms and fallbacks
3. Create user-friendly error messages
4. Add progress indicators and notifications
5. Performance optimization and testing

## Security Considerations

### File Access Control
- Validate user permissions before file access
- Use signed URLs for temporary file access
- Implement rate limiting for downloads
- Sanitize file names and paths

### Data Protection
- Encrypt sensitive data in export parameters
- Implement audit logging for file access
- Use secure file storage locations
- Regular cleanup of expired files

### API Security
- Validate all input parameters
- Implement proper authentication checks
- Use HTTPS for all file transfers
- Rate limit export requests per user

## Performance Optimization

### File Generation
- Use streaming for large datasets
- Implement file compression options
- Cache frequently requested reports
- Optimize database queries for report data

### Storage Management
- Implement automatic file cleanup
- Use efficient file naming conventions
- Monitor disk space usage
- Implement file archiving for old exports

### Queue Management
- Implement priority queuing for urgent reports
- Use worker processes for CPU-intensive tasks
- Monitor queue performance metrics
- Implement job timeout and cleanup