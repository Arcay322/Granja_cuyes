import { Router } from 'express';
import {
  getJobStatus,
  getJobHistory,
  getQueueStatus,
  bulkJobActions,
  updateJobPriority,
  getJobLogs
} from '../../controllers/reports/jobs.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     JobStatus:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         templateId:
 *           type: string
 *         format:
 *           type: string
 *           enum: [PDF, EXCEL, CSV]
 *         status:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, FAILED, TIMEOUT]
 *         progress:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *         userId:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         startedAt:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 *         estimatedCompletion:
 *           type: string
 *           format: date-time
 *         timeRemaining:
 *           type: number
 *         files:
 *           type: array
 *           items:
 *             type: object
 *         queuePosition:
 *           type: number
 *         canCancel:
 *           type: boolean
 *         canRetry:
 *           type: boolean
 *         canDelete:
 *           type: boolean
 */

/**
 * @swagger
 * /api/reports/jobs/{jobId}/status:
 *   get:
 *     summary: Obtener estado detallado de un trabajo
 *     tags: [Jobs]
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
 *         description: Estado del trabajo obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/JobStatus'
 *                 message:
 *                   type: string
 *       404:
 *         description: Trabajo no encontrado
 *       403:
 *         description: Acceso denegado
 */
router.get('/jobs/:jobId/status', getJobStatus);

/**
 * @swagger
 * /api/reports/jobs/{jobId}/logs:
 *   get:
 *     summary: Obtener logs de ejecución de un trabajo
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del trabajo
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [info, warn, error]
 *         description: Filtrar por nivel de log
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Límite de logs
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset para paginación
 *     responses:
 *       200:
 *         description: Logs obtenidos exitosamente
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
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                 message:
 *                   type: string
 */
router.get('/jobs/:jobId/logs', getJobLogs);

/**
 * @swagger
 * /api/reports/jobs/history:
 *   get:
 *     summary: Obtener historial de trabajos con filtros avanzados
 *     tags: [Jobs]
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
 *         name: templateId
 *         schema:
 *           type: string
 *         description: Filtrar por plantilla
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Límite de resultados
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Offset para paginación
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, completedAt, status]
 *           default: createdAt
 *         description: Campo para ordenar
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Orden de clasificación
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
 *                   type: object
 *                   properties:
 *                     jobs:
 *                       type: array
 *                       items:
 *                         type: object
 *                     summary:
 *                       type: object
 *                     pagination:
 *                       type: object
 *                     filters:
 *                       type: object
 *                 message:
 *                   type: string
 */
router.get('/jobs/history', getJobHistory);

/**
 * @swagger
 * /api/reports/queue/status:
 *   get:
 *     summary: Obtener estado de la cola de trabajos (solo admin)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado de la cola obtenido exitosamente
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
 *                     statistics:
 *                       type: object
 *                     recentJobs:
 *                       type: array
 *                     health:
 *                       type: object
 *                 message:
 *                   type: string
 *       403:
 *         description: Acceso denegado - Se requiere rol de admin
 */
router.get('/queue/status', getQueueStatus);

/**
 * @swagger
 * /api/reports/jobs/{jobId}/priority:
 *   put:
 *     summary: Actualizar prioridad de un trabajo pendiente
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del trabajo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               priority:
 *                 type: string
 *                 enum: [LOW, NORMAL, HIGH, URGENT]
 *                 description: Nueva prioridad del trabajo
 *             required:
 *               - priority
 *     responses:
 *       200:
 *         description: Prioridad actualizada exitosamente
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
 *                     priority:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *       400:
 *         description: No se puede actualizar la prioridad del trabajo
 *       404:
 *         description: Trabajo no encontrado
 */
router.put('/jobs/:jobId/priority', updateJobPriority);

/**
 * @swagger
 * /api/reports/jobs/bulk-actions:
 *   post:
 *     summary: Realizar acciones masivas en múltiples trabajos
 *     tags: [Jobs]
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
 *                 minItems: 1
 *                 maxItems: 50
 *                 description: IDs de los trabajos
 *               action:
 *                 type: string
 *                 enum: [cancel, retry, delete]
 *                 description: Acción a realizar
 *             required:
 *               - jobIds
 *               - action
 *     responses:
 *       200:
 *         description: Acciones masivas completadas
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
 *                     action:
 *                       type: string
 *                     results:
 *                       type: object
 *                       properties:
 *                         successful:
 *                           type: array
 *                           items:
 *                             type: string
 *                         failed:
 *                           type: array
 *                           items:
 *                             type: object
 *                     summary:
 *                       type: object
 *                 message:
 *                   type: string
 */
router.post('/jobs/bulk-actions', bulkJobActions);

export default router;