import { Router } from 'express';
import * as ventasController from '../../controllers/ventas/ventas.controller';
import { validateRequest, validateRequestWithParams } from '../../middlewares/validateRequest';
import { createVentaSchema, updateVentaSchema } from '../../schemas/venta.schema';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

router.get('/', authenticateToken, ventasController.getAllVentas);
router.get('/:id', authenticateToken, ventasController.getVentaById);
router.post('/', authenticateToken, validateRequest(createVentaSchema), ventasController.createVenta);
router.put('/:id', authenticateToken, validateRequestWithParams(updateVentaSchema), ventasController.updateVenta);
router.delete('/:id', authenticateToken, ventasController.deleteVenta);

export default router;
