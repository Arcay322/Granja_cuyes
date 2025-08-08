import { Router } from 'express';
import {
  getAlerts,
  createManualAlert,
  markAsRead,
  removeAlert,
  getStats,
  generateAlerts,
  getSchedulerStatus,
  getChannels,
  updateChannel,
  sendTestNotification,
  markMultipleAsRead
} from '../../controllers/alerts/alerts.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     Alert:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *           enum: [birth_reminder, overdue_pregnancy, inactive_reproducer, capacity_warning, health_check_due, breeding_opportunity, performance_decline]
 *         severity:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         data:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         readAt:
 *           type: string
 *           format: date-time
 *         actionTaken:
 *           type: string
 *         userId:
 *           type: number
 *         relatedEntityId:
 *           type: number
 *         relatedEntityType:
 *           type: string
 */

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: Obtener todas las alertas
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de alerta
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *         description: Filtrar por severidad
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado de lectura
 *       - in: query
 *         name: userId
 *         schema:
 *           type: number
 *         description: Filtrar por usuario
 *     responses:
 *       200:
 *         description: Alertas obtenidas exitosamente
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
 *                     $ref: '#/components/schemas/Alert'
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/', getAlerts);

/**
 * @swagger
 * /api/alerts:
 *   post:
 *     summary: Crear nueva alerta manual
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - severity
 *               - title
 *               - message
 *             properties:
 *               type:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       201:
 *         description: Alerta creada exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 */
router.post('/', createManualAlert);

/**
 * @swagger
 * /api/alerts/{id}/read:
 *   patch:
 *     summary: Marcar alerta como leída
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la alerta
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actionTaken:
 *                 type: string
 *                 description: Acción tomada por el usuario
 *     responses:
 *       200:
 *         description: Alerta marcada como leída
 *       404:
 *         description: Alerta no encontrada
 */
router.patch('/:id/read', markAsRead);

/**
 * @swagger
 * /api/alerts/{id}:
 *   delete:
 *     summary: Eliminar alerta
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la alerta
 *     responses:
 *       200:
 *         description: Alerta eliminada exitosamente
 *       404:
 *         description: Alerta no encontrada
 */
router.delete('/:id', removeAlert);

/**
 * @swagger
 * /api/alerts/bulk/read:
 *   patch:
 *     summary: Marcar múltiples alertas como leídas
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - alertIds
 *             properties:
 *               alertIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de IDs de alertas
 *     responses:
 *       200:
 *         description: Alertas procesadas exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 */
router.patch('/bulk/read', markMultipleAsRead);

/**
 * @swagger
 * /api/alerts/stats:
 *   get:
 *     summary: Obtener estadísticas de alertas y notificaciones
 *     tags: [Alerts]
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
 *                     alerts:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         unread:
 *                           type: number
 *                         bySeverity:
 *                           type: object
 *                         byType:
 *                           type: object
 *                     notifications:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         sent:
 *                           type: number
 *                         failed:
 *                           type: number
 *                         pending:
 *                           type: number
 */
router.get('/stats', getStats);

/**
 * @swagger
 * /api/alerts/generate:
 *   post:
 *     summary: Generar alertas manualmente
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Generación de alertas iniciada exitosamente
 */
router.post('/generate', generateAlerts);

/**
 * @swagger
 * /api/alerts/scheduler/status:
 *   get:
 *     summary: Obtener estado del programador de alertas
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado del programador obtenido exitosamente
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
 *                     isRunning:
 *                       type: boolean
 *                     activeJobs:
 *                       type: array
 *                       items:
 *                         type: string
 *                     nextExecutions:
 *                       type: object
 */
router.get('/scheduler/status', getSchedulerStatus);

/**
 * @swagger
 * /api/alerts/channels:
 *   get:
 *     summary: Obtener canales de notificación
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Canales obtenidos exitosamente
 */
router.get('/channels', getChannels);

/**
 * @swagger
 * /api/alerts/channels/{id}:
 *   patch:
 *     summary: Actualizar canal de notificación
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del canal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               enabled:
 *                 type: boolean
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: Canal actualizado exitosamente
 *       404:
 *         description: Canal no encontrado
 */
router.patch('/channels/:id', updateChannel);

/**
 * @swagger
 * /api/alerts/test:
 *   post:
 *     summary: Enviar notificación de prueba
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               channelId:
 *                 type: string
 *                 description: ID del canal específico (opcional)
 *     responses:
 *       200:
 *         description: Notificación de prueba enviada exitosamente
 */
router.post('/test', sendTestNotification);

export default router;