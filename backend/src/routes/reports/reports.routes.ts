import { Router } from 'express';
import {
  getTemplates,
  exportReport,
  getExportStatus,
  downloadReport,
  getExportsHistory,
  getReportsStats,
  cleanupFiles,
  cancelExportJob,
  retryExportJob,
  getJobDetails,
  getJobsHistory,
  getJobStatistics,
  getActiveJobs,
  cancelMultipleJobs,
  getCleanupConfig,
  updateCleanupConfig,
  testEndpoint
} from '../../controllers/reports/reports.controller';
import { authenticateToken } from '../../middlewares/auth';
import jobsRouter from './jobs.routes';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     ReportTemplate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           enum: [reproductive, health, financial, inventory, general]
 *         sections:
 *           type: array
 *           items:
 *             type: object
 *         parameters:
 *           type: array
 *           items:
 *             type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     ExportJob:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *         format:
 *           type: string
 *           enum: [pdf, excel, csv]
 *         fileName:
 *           type: string
 *         fileSize:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         downloadCount:
 *           type: number
 */

/**
 * @swagger
 * /api/reports/templates:
 *   get:
 *     summary: Obtener todas las plantillas de reportes
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de plantillas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReportTemplate'
 *                 message:
 *                   type: string
 */
router.get('/templates', getTemplates);

// Mount job management routes
router.use('/', jobsRouter);

/**
 * @swagger
 * /api/reports/export/{templateId}:
 *   post:
 *     summary: Exportar reporte en formato específico
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la plantilla
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [pdf, excel, csv]
 *                 description: Formato de exportación
 *               parameters:
 *                 type: object
 *                 description: Parámetros del reporte
 *               options:
 *                 type: object
 *                 properties:
 *                   includeCharts:
 *                     type: boolean
 *                   includeImages:
 *                     type: boolean
 *                   pageSize:
 *                     type: string
 *                     enum: [A4, Letter, Legal]
 *                   orientation:
 *                     type: string
 *                     enum: [portrait, landscape]
 *                   compression:
 *                     type: boolean
 *     responses:
 *       202:
 *         description: Exportación iniciada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     format:
 *                       type: string
 *                 message:
 *                   type: string
 */
router.post('/export/:templateId', exportReport);

/**
 * @swagger
 * /api/reports/exports/{jobId}/status:
 *   get:
 *     summary: Obtener estado de trabajo de exportación
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del trabajo de exportación
 *     responses:
 *       200:
 *         description: Estado obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ExportJob'
 *                 message:
 *                   type: string
 *       404:
 *         description: Trabajo no encontrado
 */
router.get('/exports/:jobId/status', getExportStatus);

/**
 * @swagger
 * /api/reports/exports/{jobId}/download:
 *   get:
 *     summary: Descargar archivo exportado
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del trabajo de exportación
 *     responses:
 *       200:
 *         description: Archivo descargado exitosamente
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Archivo no encontrado o expirado
 */
router.get('/exports/:jobId/files/:fileId/download', downloadReport);
router.get('/jobs/:jobId/files/:fileId/download', downloadReport);

/**
 * @swagger
 * /api/reports/exports/history:
 *   get:
 *     summary: Obtener historial de exportaciones
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Límite de resultados
 *     responses:
 *       200:
 *         description: Historial obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ExportJob'
 *                 message:
 *                   type: string
 */
router.get('/exports/history', getExportsHistory);

/**
 * @swagger
 * /api/reports/stats:
 *   get:
 *     summary: Obtener estadísticas de reportes
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalJobs:
 *                       type: number
 *                     completedJobs:
 *                       type: number
 *                     failedJobs:
 *                       type: number
 *                     pendingJobs:
 *                       type: number
 *                     totalDownloads:
 *                       type: number
 *                     byFormat:
 *                       type: object
 *                 message:
 *                   type: string
 */
router.get('/stats', getReportsStats);

/**
 * @swagger
 * /api/reports/cleanup:
 *   post:
 *     summary: Limpiar archivos expirados
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Limpieza completada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     cleanedCount:
 *                       type: number
 *                 message:
 *                   type: string
 */
router.post('/cleanup', cleanupFiles);

/**
 * @swagger
 * /api/reports/jobs/{jobId}/cancel:
 *   post:
 *     summary: Cancelar trabajo de exportación
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del trabajo
 *     responses:
 *       200:
 *         description: Trabajo cancelado exitosamente
 *       404:
 *         description: Trabajo no encontrado
 *       403:
 *         description: Acceso denegado
 */
router.post('/jobs/:jobId/cancel', cancelExportJob);

/**
 * @swagger
 * /api/reports/jobs/{jobId}/retry:
 *   post:
 *     summary: Reintentar trabajo fallido
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del trabajo
 *     responses:
 *       200:
 *         description: Trabajo reintentado exitosamente
 *       404:
 *         description: Trabajo no encontrado
 *       403:
 *         description: Acceso denegado
 */
router.post('/jobs/:jobId/retry', retryExportJob);

/**
 * @swagger
 * /api/reports/jobs/{jobId}/details:
 *   get:
 *     summary: Obtener detalles completos de un trabajo
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del trabajo
 *     responses:
 *       200:
 *         description: Detalles obtenidos exitosamente
 *       404:
 *         description: Trabajo no encontrado
 *       403:
 *         description: Acceso denegado
 */
router.get('/jobs/:jobId/details', getJobDetails);

/**
 * @swagger
 * /api/reports/jobs/history:
 *   get:
 *     summary: Obtener historial de trabajos con filtros avanzados
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, FAILED, TIMEOUT]
 *         description: Filtrar por estado
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [PDF, EXCEL, CSV]
 *         description: Filtrar por formato
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Límite de resultados
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset para paginación
 *     responses:
 *       200:
 *         description: Historial obtenido exitosamente
 */
router.get('/jobs/history', getJobsHistory);

/**
 * @swagger
 * /api/reports/jobs/statistics:
 *   get:
 *     summary: Obtener estadísticas detalladas de trabajos
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *         description: Período para estadísticas
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 */
router.get('/jobs/statistics', getJobStatistics);

/**
 * @swagger
 * /api/reports/jobs/active:
 *   get:
 *     summary: Obtener trabajos activos
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trabajos activos obtenidos exitosamente
 */
router.get('/jobs/active', getActiveJobs);

/**
 * @swagger
 * /api/reports/jobs/cancel-multiple:
 *   post:
 *     summary: Cancelar múltiples trabajos
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de IDs de trabajos a cancelar
 *     responses:
 *       200:
 *         description: Trabajos cancelados exitosamente
 */
router.post('/jobs/cancel-multiple', cancelMultipleJobs);

/**
 * @swagger
 * /api/reports/cleanup/config:
 *   get:
 *     summary: Obtener configuración de limpieza
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuración obtenida exitosamente
 *       403:
 *         description: Acceso de administrador requerido
 */
router.get('/cleanup/config', getCleanupConfig);

/**
 * @swagger
 * /api/reports/cleanup/config:
 *   put:
 *     summary: Actualizar configuración de limpieza
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               config:
 *                 type: object
 *                 description: Nueva configuración de limpieza
 *     responses:
 *       200:
 *         description: Configuración actualizada exitosamente
 *       403:
 *         description: Acceso de administrador requerido
 */
router.put('/cleanup/config', updateCleanupConfig);

/**
 * @swagger
 * /api/reports/test:
 *   get:
 *     summary: Endpoint de prueba para debug
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test exitoso
 */
router.get('/test', testEndpoint);

export default router;