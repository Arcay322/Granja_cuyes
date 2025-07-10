import { Router } from 'express';
import * as gastosController from '../../controllers/gastos/gastos.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { createGastoSchema, updateGastoSchema } from '../../schemas/gasto.schema';

const router = Router();

router.get('/', gastosController.getAllGastos);
router.get('/:id', gastosController.getGastoById);
router.post('/', validateRequest(createGastoSchema), gastosController.createGasto);
router.put('/:id', validateRequest(updateGastoSchema), gastosController.updateGasto);
router.delete('/:id', gastosController.deleteGasto);

export default router;
