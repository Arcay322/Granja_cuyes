import { Router } from 'express';
import {
  getAllEvents,
  getEvent,
  createNewEvent,
  updateExistingEvent,
  removeEvent,
  generateEvents,
  getUpcoming,
  getOverdue,
  markAsCompleted,
  getStats,
  validateEvent,
  cleanupEvents,
  getCalendarView
} from '../../controllers/calendar/calendar.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     ReproductiveEvent:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *           enum: [parto, apareamiento, chequeo, vacunacion, destete, evaluacion]
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         allDay:
 *           type: boolean
 *         animalId:
 *           type: number
 *         prenezId:
 *           type: number
 *         camadaId:
 *           type: number
 *         status:
 *           type: string
 *           enum: [programado, completado, cancelado, vencido]
 *         priority:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         metadata:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         userId:
 *           type: number
 */

/**
 * @swagger
 * /api/calendar/events:
 *   get:
 *     summary: Obtener todos los eventos del calendario
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio para filtrar eventos
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin para filtrar eventos
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de evento
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filtrar por estado del evento
 *       - in: query
 *         name: animalId
 *         schema:
 *           type: number
 *         description: Filtrar por ID del animal
 *     responses:
 *       200:
 *         description: Eventos obtenidos exitosamente
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
 *                     $ref: '#/components/schemas/ReproductiveEvent'
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/events', getAllEvents);

/**
 * @swagger
 * /api/calendar/events/{id}:
 *   get:
 *     summary: Obtener evento por ID
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del evento
 *     responses:
 *       200:
 *         description: Evento obtenido exitosamente
 *       404:
 *         description: Evento no encontrado
 */
router.get('/events/:id', getEvent);

/**
 * @swagger
 * /api/calendar/events:
 *   post:
 *     summary: Crear nuevo evento
 *     tags: [Calendar]
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
 *               - title
 *               - startDate
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [parto, apareamiento, chequeo, vacunacion, destete, evaluacion]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               allDay:
 *                 type: boolean
 *                 default: false
 *               animalId:
 *                 type: number
 *               prenezId:
 *                 type: number
 *               camadaId:
 *                 type: number
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 default: medium
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Evento creado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       409:
 *         description: Conflicto con eventos existentes
 */
router.post('/events', createNewEvent);

/**
 * @swagger
 * /api/calendar/events/{id}:
 *   put:
 *     summary: Actualizar evento existente
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del evento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               allDay:
 *                 type: boolean
 *               status:
 *                 type: string
 *               priority:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Evento actualizado exitosamente
 *       404:
 *         description: Evento no encontrado
 *       409:
 *         description: Conflicto con eventos existentes
 */
router.put('/events/:id', updateExistingEvent);

/**
 * @swagger
 * /api/calendar/events/{id}:
 *   delete:
 *     summary: Eliminar evento
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del evento
 *     responses:
 *       200:
 *         description: Evento eliminado exitosamente
 *       404:
 *         description: Evento no encontrado
 */
router.delete('/events/:id', removeEvent);

/**
 * @swagger
 * /api/calendar/events/{id}/complete:
 *   patch:
 *     summary: Marcar evento como completado
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del evento
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               completionNotes:
 *                 type: string
 *                 description: Notas sobre la finalización del evento
 *     responses:
 *       200:
 *         description: Evento marcado como completado
 *       404:
 *         description: Evento no encontrado
 */
router.patch('/events/:id/complete', markAsCompleted);

/**
 * @swagger
 * /api/calendar/generate:
 *   post:
 *     summary: Generar eventos automáticos
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Eventos automáticos generados exitosamente
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
 *                     $ref: '#/components/schemas/ReproductiveEvent'
 *                 message:
 *                   type: string
 */
router.post('/generate', generateEvents);

/**
 * @swagger
 * /api/calendar/upcoming:
 *   get:
 *     summary: Obtener eventos próximos
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *           default: 7
 *         description: Número de días hacia adelante para buscar eventos
 *     responses:
 *       200:
 *         description: Eventos próximos obtenidos exitosamente
 */
router.get('/upcoming', getUpcoming);

/**
 * @swagger
 * /api/calendar/overdue:
 *   get:
 *     summary: Obtener eventos vencidos
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Eventos vencidos obtenidos exitosamente
 */
router.get('/overdue', getOverdue);

/**
 * @swagger
 * /api/calendar/stats:
 *   get:
 *     summary: Obtener estadísticas de eventos
 *     tags: [Calendar]
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
 *                     total:
 *                       type: number
 *                     byStatus:
 *                       type: object
 *                     byType:
 *                       type: object
 *                     upcoming:
 *                       type: number
 *                     overdue:
 *                       type: number
 */
router.get('/stats', getStats);

/**
 * @swagger
 * /api/calendar/validate:
 *   post:
 *     summary: Validar evento (verificar conflictos)
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: excludeEventId
 *         schema:
 *           type: string
 *         description: ID del evento a excluir de la validación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               animalId:
 *                 type: number
 *     responses:
 *       200:
 *         description: Validación completada
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
 *                     hasConflicts:
 *                       type: boolean
 *                     conflicts:
 *                       type: array
 *                     warnings:
 *                       type: array
 */
router.post('/validate', validateEvent);

/**
 * @swagger
 * /api/calendar/view:
 *   get:
 *     summary: Obtener vista de calendario (formato específico para componentes de calendario)
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: Año para la vista del calendario
 *       - in: query
 *         name: month
 *         schema:
 *           type: number
 *         description: Mes para la vista del calendario (1-12)
 *     responses:
 *       200:
 *         description: Vista de calendario obtenida exitosamente
 */
router.get('/view', getCalendarView);

/**
 * @swagger
 * /api/calendar/cleanup:
 *   delete:
 *     summary: Limpiar eventos antiguos completados
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: daysOld
 *         schema:
 *           type: number
 *           default: 90
 *         description: Días de antigüedad para considerar eventos como antiguos
 *     responses:
 *       200:
 *         description: Eventos antiguos eliminados exitosamente
 */
router.delete('/cleanup', cleanupEvents);

export default router;