import { Router } from 'express';
import * as gastosController from '../../controllers/gastos/gastos.controller';

const router = Router();

router.get('/', gastosController.getAllGastos);
router.get('/:id', gastosController.getGastoById);
router.post('/', gastosController.createGasto);
router.put('/:id', gastosController.updateGasto);
router.delete('/:id', gastosController.deleteGasto);

export default router;
