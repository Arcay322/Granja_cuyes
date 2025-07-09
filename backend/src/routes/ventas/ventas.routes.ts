import { Router } from 'express';
import * as ventasController from '../../controllers/ventas/ventas.controller';

const router = Router();

router.get('/', ventasController.getAllVentas);
router.get('/:id', ventasController.getVentaById);
router.post('/', ventasController.createVenta);
router.put('/:id', ventasController.updateVenta);
router.delete('/:id', ventasController.deleteVenta);

export default router;
