import { Router } from 'express';
import * as dashboardController from '../../controllers/dashboard/dashboard.controller';

const router = Router();

router.get('/metrics', dashboardController.getMetrics);
router.get('/population', dashboardController.getPopulationGrowth);
router.get('/ventas', dashboardController.getVentasStats);
router.get('/gastos', dashboardController.getGastosStats);
router.get('/productividad', dashboardController.getProductivityStats);

export default router;
