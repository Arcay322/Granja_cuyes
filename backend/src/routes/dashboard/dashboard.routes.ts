import { Router } from 'express';
import {
  getDashboardData,
  getMetrics,
  getChartsData,
  getRealTimeData,
  getExecutiveSummary,
  getAvailableFilters
} from '../../controllers/dashboard/dashboard.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Obtener métricas completas del dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio para filtrar datos
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin para filtrar datos
 *       - in: query
 *         name: galpon
 *         schema:
 *           type: string
 *         description: Filtrar por galpón específico
 *       - in: query
 *         name: raza
 *         schema:
 *           type: string
 *         description: Filtrar por raza específica
 *     responses:
 *       200:
 *         description: Métricas del dashboard obtenidas exitosamente
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
 *                     reproductiveStats:
 *                       type: object
 *                     performanceMetrics:
 *                       type: object
 *                     trends:
 *                       type: object
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', getDashboardData);

/**
 * @swagger
 * /api/dashboard/metrics:
 *   get:
 *     summary: Obtener métricas del dashboard (alias)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métricas del dashboard obtenidas exitosamente
 */
router.get('/metrics', getMetrics);

/**
 * @swagger
 * /api/dashboard/charts:
 *   get:
 *     summary: Obtener datos para gráficos del dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *         description: Período de tiempo para los gráficos
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin
 *     responses:
 *       200:
 *         description: Datos de gráficos obtenidos exitosamente
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
 *                     birthsChart:
 *                       type: object
 *                     successRateChart:
 *                       type: object
 *                     breedDistributionChart:
 *                       type: object
 *                     capacityChart:
 *                       type: object
 *                     performanceByAgeChart:
 *                       type: object
 */
router.get('/charts', getChartsData);

/**
 * @swagger
 * /api/dashboard/realtime:
 *   get:
 *     summary: Obtener métricas en tiempo real
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métricas en tiempo real obtenidas exitosamente
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
 *                     activePregnancies:
 *                       type: number
 *                     expectedBirths:
 *                       type: number
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 */
router.get('/realtime', getRealTimeData);

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Obtener resumen ejecutivo del dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio para el resumen
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin para el resumen
 *     responses:
 *       200:
 *         description: Resumen ejecutivo obtenido exitosamente
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
 *                     reproductiveHealth:
 *                       type: object
 *                     productivity:
 *                       type: object
 *                     alerts:
 *                       type: object
 *                     recommendations:
 *                       type: array
 */
router.get('/summary', getExecutiveSummary);

/**
 * @swagger
 * /api/dashboard/filters:
 *   get:
 *     summary: Obtener filtros disponibles para el dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Filtros disponibles obtenidos exitosamente
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
 *                     galpones:
 *                       type: array
 *                       items:
 *                         type: string
 *                     razas:
 *                       type: array
 *                       items:
 *                         type: string
 *                     dateRange:
 *                       type: object
 *                       properties:
 *                         min:
 *                           type: string
 *                           format: date-time
 *                         max:
 *                           type: string
 *                           format: date-time
 *                     periods:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get('/filters', getAvailableFilters);

export default router;