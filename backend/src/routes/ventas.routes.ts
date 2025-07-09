import { Router } from 'express';
import * as ventasController from '../controllers/ventas.controller';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.get('/', authenticateToken, ventasController.getAllVentas);
router.get('/:id', authenticateToken, ventasController.getVentaById);
router.post('/', authenticateToken, ventasController.createVenta);
router.put('/:id', authenticateToken, ventasController.updateVenta);
router.delete('/:id', authenticateToken, ventasController.deleteVenta);

export default router;
