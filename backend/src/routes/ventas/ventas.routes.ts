import { Router } from 'express';
import * as ventasController from '../../controllers/ventas/ventas.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { createVentaSchema, updateVentaSchema } from '../../schemas/venta.schema';

const router = Router();

router.get('/', ventasController.getAllVentas);
router.get('/:id', ventasController.getVentaById);
router.post('/', validateRequest(createVentaSchema), ventasController.createVenta);
router.put('/:id', validateRequest(updateVentaSchema), ventasController.updateVenta);
router.delete('/:id', ventasController.deleteVenta);

export default router;
