import { Router } from 'express';
import * as dashboardController from '../../controllers/dashboard/dashboard.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

// Proteger todas las rutas del dashboard con autenticación
router.use(authenticateToken);

router.get('/metrics', dashboardController.getMetrics);
router.get('/population', dashboardController.getPopulationGrowth);
router.get('/ventas', dashboardController.getVentasStats);
router.get('/gastos', dashboardController.getGastosStats);
router.get('/productividad', dashboardController.getProductivityStats);

export default router;
