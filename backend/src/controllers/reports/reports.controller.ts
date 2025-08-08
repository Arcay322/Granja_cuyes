import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import logger from '../../utils/logger';
import { jobLifecycleService } from '../../services/reports/jobLifecycle.service';
import { jobQueueService } from '../../services/reports/jobQueue.service';
import { fileDownloadService } from '../../services/reports/fileDownload.service';
import { fileCleanupService } from '../../services/reports/fileCleanup.service';
import { ExportFormat, ExportStatus } from '@prisma/client';

// Utility function to convert BigInt values to strings for JSON serialization
const convertBigIntToString = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        converted[key] = convertBigIntToString(obj[key]);
      }
    }
    return converted;
  }
  
  return obj;
};

const prisma = new PrismaClient();

// Rate limiting for report generation
export const reportGenerationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many report generation requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const exportRequestSchema = z.object({
  format: z.enum(['PDF', 'EXCEL', 'CSV']),
  parameters: z.object({
    dateRange: z.object({
      from: z.string().optional(),
      to: z.string().optional()
    }).optional(),
    galpon: z.string().optional(),
    etapaVida: z.string().optional(),
    estado: z.string().optional(),
    categoria: z.string().optional()
  }).optional(),
  options: z.object({
    includeCharts: z.boolean().default(true),
    includeDetails: z.boolean().default(true),
    pageSize: z.enum(['A4', 'LETTER', 'LEGAL']).default('A4'),
    orientation: z.enum(['portrait', 'landscape']).default('portrait'),
    compression: z.boolean().default(true)
  }).optional()
});

const jobStatusQuerySchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'TIMEOUT']).optional(),
  format: z.enum(['PDF', 'EXCEL', 'CSV']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0)
});

// Exportar reporte en formato específico
export const exportReport = async (req: Request, res: Response) => {
  try {
    // Get templateId from URL parameters
    const { templateId } = req.params;
    
    // Validate request body
    const validationResult = exportRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        details: validationResult.error.errors
      });
    }

    const { format, parameters, options } = validationResult.data;
    const userId = (req as any).user?.id || 1; // Get from auth middleware

    logger.info(`Creating export job for template ${templateId} in format ${format}`, {
      userId,
      templateId,
      format,
      parameters
    });

    // Create export job
    const request = {
      templateId,
      format: format as ExportFormat,
      parameters: parameters ? {
        ...parameters,
        dateRange: parameters.dateRange ? {
          from: parameters.dateRange.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          to: parameters.dateRange.to || new Date().toISOString()
        } : undefined
      } : undefined,
      options: {
        pageSize: 'A4' as const,
        orientation: 'portrait' as const,
        includeCharts: options?.includeCharts ?? true,
        includeImages: true,
        compression: options?.compression ?? true
      }
    };

    const job = await jobLifecycleService.createJob(userId, request);

    logger.info(`Export job created successfully: ${job.id}`);

    res.status(202).json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        templateId: job.templateId,
        format: job.format,
        createdAt: job.createdAt,
        estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes estimate
      },
      message: 'Export job created successfully'
    });
  } catch (error) {
    logger.error('Error creating export job:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create export job'
    });
  }
};

// Obtener estado de trabajo de exportación
export const getExportStatus = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    
    logger.info(`Getting job status: ${jobId}`);

    // Get job details from lifecycle service
    const jobWithFiles = await jobLifecycleService.getJobDetails(jobId);
    
    if (!jobWithFiles) {
      return res.status(404).json({
        success: false,
        error: 'Export job not found'
      });
    }

    // Manually construct response with BigInt handling
    const response = {
      id: jobWithFiles.id,
      status: jobWithFiles.status,
      templateId: jobWithFiles.templateId,
      format: jobWithFiles.format,
      progress: jobWithFiles.progress,
      createdAt: jobWithFiles.createdAt,
      startedAt: jobWithFiles.startedAt,
      completedAt: jobWithFiles.completedAt,
      failedAt: jobWithFiles.status === 'FAILED' ? jobWithFiles.completedAt : null,
      errorMessage: jobWithFiles.errorMessage,
      files: (jobWithFiles.files || []).map(file => ({
        id: file.id,
        fileName: file.fileName,
        fileSize: file.fileSize?.toString() || '0', // Convert BigInt to string
        downloadCount: file.downloadCount || 0,
        expiresAt: new Date(file.createdAt.getTime() + 24 * 60 * 60 * 1000) // 24 hours
      }))
    };
    
    // Use custom JSON serialization to handle BigInt
    const responseData = {
      success: true, 
      data: response,
      message: 'Job status retrieved successfully'
    };
    
    // Send response with custom BigInt handling
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(responseData, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
  } catch (error) {
    logger.error('Error getting export job status:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get job status'
    });
  }
};

// Descargar archivo exportado
export const downloadReport = async (req: Request, res: Response) => {
  try {
    const { jobId, fileId } = req.params;
    const userId = (req as any).user?.id || 1;
    
    logger.info(`Downloading file for job: ${jobId}, file: ${fileId}`, { userId });

    // Get job to verify ownership
    const jobWithFiles = await jobLifecycleService.getJobDetails(jobId);
    
    if (!jobWithFiles) {
      return res.status(404).json({
        success: false,
        error: 'Export job not found'
      });
    }

    // Verify user has access to this job (admin can access all jobs)
    const isAdmin = (req as any).user?.role === 'admin';
    if (!isAdmin && jobWithFiles.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this export job'
      });
    }

    // Get file details
    logger.info(`Looking for file ${fileId} in job files:`, jobWithFiles.files);
    const file = (jobWithFiles.files || []).find(f => f.id === fileId);
    
    if (!file) {
      logger.error(`File ${fileId} not found in job ${jobId} files`);
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Check if file has expired
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours
    const fileAge = Date.now() - file.createdAt.getTime();
    if (fileAge > expirationTime) {
      return res.status(410).json({
        success: false,
        error: 'File has expired and is no longer available'
      });
    }

    logger.info(`Found file: ${file.fileName}, attempting download`);
    
    // Use the file download service for proper handling
    const downloadResult = await fileDownloadService.serveFileDownload(
      req,
      res,
      fileId,
      userId,
      {
        inline: false, // Force download
        enableCaching: true,
        maxAge: 3600 // 1 hour cache
      }
    );

    if (!downloadResult.success) {
      logger.error(`Download failed: ${downloadResult.error}`);
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          error: downloadResult.error || 'Failed to download file'
        });
      }
    }

    logger.info(`File download completed successfully: ${file.fileName}`);

  } catch (error) {
    logger.error('Error downloading file:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to download file'
      });
    }
  }
};

// Obtener historial de exportaciones
export const getExportsHistory = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const validationResult = jobStatusQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validationResult.error.errors
      });
    }

    const { status, format, limit, offset } = validationResult.data;
    const userId = (req as any).user?.id || 1;
    
    logger.info('Getting exports history', { userId, status, format, limit, offset });

    // Get jobs with filters using getUserJobHistory
    const jobs = await jobLifecycleService.getUserJobHistory(userId, {
      status,
      format,
      limit,
      offset
    });

    const totalCount = jobs.length; // Simplified for now

    const history = jobs.map(job => ({
      id: job.id,
      templateId: job.templateId,
      format: job.format,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      failedAt: job.status === 'FAILED' ? job.completedAt : null,
      errorMessage: job.errorMessage,
      parameters: job.parameters
    }));
    
    res.json({ 
      success: true, 
      data: {
        jobs: history,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      },
      message: 'Export history retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting exports history:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get exports history'
    });
  }
};

// Obtener estadísticas de reportes
export const getReportsStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 1;
    const isAdmin = (req as any).user?.role === 'admin';
    
    logger.info('Getting reports statistics', { userId, isAdmin });

    // Get job statistics
    const jobStats = await jobLifecycleService.getLifecycleStats();
    
    // Get file download statistics
    const downloadStats = await fileDownloadService.getDownloadStats('', userId);
    
    // Get cleanup statistics
    const cleanupStats = fileCleanupService.getMetrics();

    // Get queue statistics
    const queueStats = jobQueueService.getQueueStats();

    const stats = {
      jobs: {
        total: 0, // Will be implemented when service methods are available
        completed: 0,
        failed: 0,
        pending: 0,
        processing: 0,
        cancelled: 0
      },
      files: {
        totalDownloads: downloadStats.downloadCount || 0,
        totalSize: downloadStats.fileSize?.toString() || '0',
        averageSize: downloadStats.fileSize?.toString() || '0'
      },
      formats: {
        PDF: 0, // Will be implemented when service methods are available
        EXCEL: 0,
        CSV: 0
      },
      cleanup: {
        totalRuns: cleanupStats.totalRuns,
        totalFilesDeleted: cleanupStats.totalFilesDeleted,
        totalSpaceCleaned: cleanupStats.totalSpaceCleaned.toString(), // Convert BigInt to string
        lastRunTime: cleanupStats.lastRunTime,
        nextScheduledRun: cleanupStats.nextScheduledRun
      },
      queue: {
        activeJobs: queueStats.processingCount || 0,
        waitingJobs: queueStats.queueLength || 0,
        completedJobs: 0, // Will be implemented when service methods are available
        failedJobs: 0
      },
      performance: {
        averageProcessingTime: jobStats.averageProcessingTime,
        successRate: jobStats.successRate
      }
    };
    
    res.json({ 
      success: true, 
      data: stats,
      message: 'Statistics retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting reports statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get reports statistics'
    });
  }
};

// Limpiar archivos expirados
export const cleanupFiles = async (req: Request, res: Response) => {
  try {
    const isAdmin = (req as any).user?.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required for file cleanup'
      });
    }

    logger.info('Starting file cleanup operation');
    
    // Perform cleanup using the file cleanup service
    const cleanupResult = await fileCleanupService.performCleanup();
    
    res.json({ 
      success: true, 
      data: {
        filesDeleted: cleanupResult.filesDeleted,
        spaceCleaned: cleanupResult.spaceCleaned.toString(), // Convert BigInt to string
        duration: cleanupResult.duration,
        details: cleanupResult.details,
        errors: cleanupResult.errors
      },
      message: 'File cleanup completed successfully'
    });
  } catch (error) {
    logger.error('Error during file cleanup:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to cleanup files'
    });
  }
};

// Cancelar trabajo de exportación
export const cancelExportJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = (req as any).user?.id || 1;
    
    logger.info(`Cancelling export job: ${jobId}`, { userId });

    // Get job to verify ownership
    const job = await jobLifecycleService.getJobDetails(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Export job not found'
      });
    }

    // Verify user has access to this job
    if (job.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this export job'
      });
    }

    // Check if job can be cancelled
    if (job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'TIMEOUT') {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel job with status: ${job.status}`
      });
    }

    // Cancel the job
    const cancelled = await jobLifecycleService.cancelJob(jobId);

    if (!cancelled) {
      return res.status(500).json({
        success: false,
        error: 'Failed to cancel job'
      });
    }

    res.json({
      success: true,
      data: {
        jobId: job.id,
        status: 'CANCELLED',
        cancelledAt: new Date()
      },
      message: 'Export job cancelled successfully'
    });
  } catch (error) {
    logger.error('Error cancelling export job:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel export job'
    });
  }
};

// Reintentar trabajo de exportación fallido
export const retryExportJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = (req as any).user?.id || 1;
    
    logger.info(`Retrying export job: ${jobId}`, { userId });

    // Get job to verify ownership
    const job = await jobLifecycleService.getJobDetails(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Export job not found'
      });
    }

    // Verify user has access to this job
    if (job.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this export job'
      });
    }

    // Check if job can be retried
    if (job.status !== 'FAILED' && job.status !== 'TIMEOUT') {
      return res.status(400).json({
        success: false,
        error: `Cannot retry job with status: ${job.status}`
      });
    }

    // Retry the job
    const retried = await jobLifecycleService.retryJob(jobId);

    if (!retried) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retry job'
      });
    }

    res.json({
      success: true,
      data: {
        originalJobId: jobId,
        newJobId: jobId, // Same job ID for retry
        status: 'PENDING'
      },
      message: 'Export job retry initiated successfully'
    });
  } catch (error) {
    logger.error('Error retrying export job:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retry export job'
    });
  }
};

// Obtener configuración del sistema de limpieza
export const getCleanupConfig = async (req: Request, res: Response) => {
  try {
    const isAdmin = (req as any).user?.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const config = fileCleanupService.getConfig();
    
    res.json({
      success: true,
      data: config,
      message: 'Cleanup configuration retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting cleanup configuration:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get cleanup configuration'
    });
  }
};

// Actualizar configuración del sistema de limpieza
export const updateCleanupConfig = async (req: Request, res: Response) => {
  try {
    const isAdmin = (req as any).user?.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { config } = req.body;
    
    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Configuration data is required'
      });
    }

    fileCleanupService.updateConfig(config);
    
    const updatedConfig = fileCleanupService.getConfig();
    
    res.json({
      success: true,
      data: updatedConfig,
      message: 'Cleanup configuration updated successfully'
    });
  } catch (error) {
    logger.error('Error updating cleanup configuration:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update cleanup configuration'
    });
  }
};

// Test endpoint to debug BigInt issue
export const testEndpoint = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: 'Test endpoint working',
      user: req.user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed'
    });
  }
};

// Legacy methods for backward compatibility
export const getTemplates = async (req: Request, res: Response) => {
  try {
    logger.info('Getting report templates');
    
    const templates = [
      {
        id: 'inventory',
        name: 'Reporte de Inventario',
        description: 'Reporte completo del inventario de cuyes',
        category: 'inventory',
        sections: ['cuyes', 'galpones', 'jaulas'],
        parameters: ['dateRange', 'galpon', 'etapaVida'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'reproductive',
        name: 'Reporte de Reproducción',
        description: 'Estadísticas de reproducción y camadas',
        category: 'reproductive',
        sections: ['preneces', 'camadas', 'estadisticas'],
        parameters: ['dateRange', 'estado'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'financial',
        name: 'Reporte Financiero',
        description: 'Análisis de ventas, gastos e ingresos',
        category: 'financial',
        sections: ['ventas', 'gastos', 'rentabilidad'],
        parameters: ['dateRange', 'categoria'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'health',
        name: 'Reporte de Salud',
        description: 'Estado de salud del ganado',
        category: 'health',
        sections: ['tratamientos', 'vacunas', 'mortalidad'],
        parameters: ['dateRange', 'galpon'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    res.json({ 
      success: true, 
      data: templates,
      message: 'Templates retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting report templates:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get report templates' 
    });
  }
};
// Obtener detalles completos de un trabajo específico
export const getJobDetails = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = (req as any).user?.id || 1;
    
    logger.info(`Getting detailed job information: ${jobId}`, { userId });

    // Get job details from lifecycle service
    const jobWithFiles = await jobLifecycleService.getJobDetails(jobId);
    
    if (!jobWithFiles) {
      return res.status(404).json({
        success: false,
        error: 'Export job not found'
      });
    }

    // Verify user has access to this job (unless admin)
    const isAdmin = (req as any).user?.role === 'admin';
    if (!isAdmin && jobWithFiles.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this export job'
      });
    }

    const response = {
      id: jobWithFiles.id,
      templateId: jobWithFiles.templateId,
      format: jobWithFiles.format,
      status: jobWithFiles.status,
      progress: jobWithFiles.progress,
      parameters: jobWithFiles.parameters,
      options: jobWithFiles.options,
      createdAt: jobWithFiles.createdAt,
      startedAt: jobWithFiles.startedAt,
      completedAt: jobWithFiles.completedAt,
      errorMessage: jobWithFiles.errorMessage,
      userId: jobWithFiles.userId,
      files: (jobWithFiles.files || []).map(file => ({
        id: file.id,
        fileName: file.fileName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        downloadCount: file.downloadCount,
        createdAt: file.createdAt,
        lastDownloadedAt: file.lastDownloadedAt,
        expiresAt: new Date(file.createdAt.getTime() + 24 * 60 * 60 * 1000) // 24 hours
      })),
      estimatedCompletion: jobWithFiles.status === 'PROCESSING' ? 
        new Date(Date.now() + 5 * 60 * 1000) : null, // 5 minutes estimate
      canCancel: ['PENDING', 'PROCESSING'].includes(jobWithFiles.status),
      canRetry: ['FAILED', 'TIMEOUT'].includes(jobWithFiles.status),
      canDownload: jobWithFiles.status === 'COMPLETED' && (jobWithFiles.files || []).length > 0
    };
    
    res.json({ 
      success: true, 
      data: response,
      message: 'Job details retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting job details:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get job details'
    });
  }
};

// Obtener historial de trabajos con filtros avanzados
export const getJobsHistory = async (req: Request, res: Response) => {
  try {
    const validationResult = jobStatusQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validationResult.error.errors
      });
    }

    const { status, format, limit, offset } = validationResult.data;
    const userId = (req as any).user?.id || 1;
    const isAdmin = (req as any).user?.role === 'admin';
    
    logger.info('Getting jobs history with filters', { 
      userId, 
      isAdmin, 
      status, 
      format, 
      limit, 
      offset 
    });

    // Get jobs with filters
    const jobs = await jobLifecycleService.getUserJobHistory(
      isAdmin ? undefined : userId, // Admin can see all jobs
      {
        status,
        format,
        limit,
        offset
      }
    );

    const totalCount = jobs.length; // Simplified for now

    const history = jobs.map(job => ({
      id: job.id,
      templateId: job.templateId,
      format: job.format,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      errorMessage: job.errorMessage,
      userId: isAdmin ? job.userId : undefined, // Only show userId to admin
      filesCount: (job.files || []).length,
      canCancel: ['PENDING', 'PROCESSING'].includes(job.status),
      canRetry: ['FAILED', 'TIMEOUT'].includes(job.status),
      canDownload: job.status === 'COMPLETED' && (job.files || []).length > 0
    }));
    
    res.json({ 
      success: true, 
      data: {
        jobs: history,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        },
        filters: {
          status,
          format
        }
      },
      message: 'Jobs history retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting jobs history:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get jobs history'
    });
  }
};

// Obtener estadísticas detalladas de trabajos
export const getJobStatistics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 1;
    const isAdmin = (req as any).user?.role === 'admin';
    const { period = '30d' } = req.query;
    
    logger.info('Getting job statistics', { userId, isAdmin, period });

    // Get lifecycle statistics
    const lifecycleStats = await jobLifecycleService.getLifecycleStats();
    
    // Get user-specific jobs for detailed stats
    const userJobs = await jobLifecycleService.getUserJobHistory(
      isAdmin ? undefined : userId,
      { limit: 1000 } // Get more jobs for statistics
    );

    // Calculate detailed statistics
    const now = new Date();
    const periodMs = period === '7d' ? 7 * 24 * 60 * 60 * 1000 : 
                    period === '30d' ? 30 * 24 * 60 * 60 * 1000 :
                    90 * 24 * 60 * 60 * 1000; // 90d default
    
    const periodStart = new Date(now.getTime() - periodMs);
    const recentJobs = userJobs.filter(job => job.createdAt >= periodStart);

    const stats = {
      overview: {
        totalJobs: userJobs.length,
        recentJobs: recentJobs.length,
        completedJobs: userJobs.filter(job => job.status === 'COMPLETED').length,
        failedJobs: userJobs.filter(job => job.status === 'FAILED').length,
        pendingJobs: userJobs.filter(job => job.status === 'PENDING').length,
        processingJobs: userJobs.filter(job => job.status === 'PROCESSING').length
      },
      byFormat: {
        PDF: userJobs.filter(job => job.format === 'PDF').length,
        EXCEL: userJobs.filter(job => job.format === 'EXCEL').length,
        CSV: userJobs.filter(job => job.format === 'CSV').length
      },
      byTemplate: userJobs.reduce((acc, job) => {
        acc[job.templateId] = (acc[job.templateId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      performance: {
        averageProcessingTime: lifecycleStats.averageProcessingTime,
        successRate: lifecycleStats.successRate,
        retryRate: lifecycleStats.retryRate,
        timeoutRate: lifecycleStats.timeoutRate
      },
      timeline: generateJobTimeline(recentJobs, period as string),
      recentActivity: {
        last24h: userJobs.filter(job => 
          job.createdAt >= new Date(now.getTime() - 24 * 60 * 60 * 1000)
        ).length,
        last7d: userJobs.filter(job => 
          job.createdAt >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        last30d: recentJobs.length
      }
    };
    
    res.json({ 
      success: true, 
      data: stats,
      message: 'Job statistics retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting job statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get job statistics'
    });
  }
};

// Obtener trabajos activos (en progreso o pendientes)
export const getActiveJobs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 1;
    const isAdmin = (req as any).user?.role === 'admin';
    
    logger.info('Getting active jobs', { userId, isAdmin });

    // Get active jobs (PENDING or PROCESSING)
    const allJobs = await jobLifecycleService.getUserJobHistory(
      isAdmin ? undefined : userId,
      { limit: 100 }
    );

    const activeJobs = allJobs.filter(job => 
      ['PENDING', 'PROCESSING'].includes(job.status)
    );

    const response = activeJobs.map(job => ({
      id: job.id,
      templateId: job.templateId,
      format: job.format,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      estimatedCompletion: job.status === 'PROCESSING' ? 
        new Date(Date.now() + 5 * 60 * 1000) : null, // 5 minutes estimate
      userId: isAdmin ? job.userId : undefined,
      canCancel: true
    }));
    
    res.json({ 
      success: true, 
      data: {
        activeJobs: response,
        count: response.length,
        queuePosition: response.findIndex(job => job.status === 'PENDING') + 1
      },
      message: 'Active jobs retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting active jobs:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get active jobs'
    });
  }
};

// Cancelar múltiples trabajos
export const cancelMultipleJobs = async (req: Request, res: Response) => {
  try {
    const { jobIds } = req.body;
    const userId = (req as any).user?.id || 1;
    const isAdmin = (req as any).user?.role === 'admin';
    
    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Job IDs array is required'
      });
    }

    logger.info(`Cancelling multiple jobs: ${jobIds.join(', ')}`, { userId, isAdmin });

    const results = [];
    
    for (const jobId of jobIds) {
      try {
        // Get job to verify ownership
        const job = await jobLifecycleService.getJobDetails(jobId);
        
        if (!job) {
          results.push({
            jobId,
            success: false,
            error: 'Job not found'
          });
          continue;
        }

        // Verify user has access to this job (unless admin)
        if (!isAdmin && job.userId !== userId) {
          results.push({
            jobId,
            success: false,
            error: 'Access denied'
          });
          continue;
        }

        // Check if job can be cancelled
        if (!['PENDING', 'PROCESSING'].includes(job.status)) {
          results.push({
            jobId,
            success: false,
            error: `Cannot cancel job with status: ${job.status}`
          });
          continue;
        }

        // Cancel the job
        const cancelled = await jobLifecycleService.cancelJob(jobId);
        
        results.push({
          jobId,
          success: cancelled,
          error: cancelled ? null : 'Failed to cancel job'
        });
      } catch (error) {
        results.push({
          jobId,
          success: false,
          error: (error as Error).message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount
        }
      },
      message: `Cancelled ${successCount} of ${results.length} jobs`
    });
  } catch (error) {
    logger.error('Error cancelling multiple jobs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel jobs'
    });
  }
};

// Helper function to generate job timeline data
interface JobTimelineData {
  createdAt: Date;
  status: string;
}

function generateJobTimeline(jobs: JobTimelineData[], period: string) {
  const timeline = [];
  const now = new Date();
  const intervals = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  
  for (let i = intervals - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const dayJobs = jobs.filter(job => 
      job.createdAt >= date && job.createdAt < nextDate
    );
    
    timeline.push({
      date: date.toISOString().split('T')[0],
      total: dayJobs.length,
      completed: dayJobs.filter(job => job.status === 'COMPLETED').length,
      failed: dayJobs.filter(job => job.status === 'FAILED').length
    });
  }
  
  return timeline;
}