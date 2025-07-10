import { Router } from 'express';
import * as gastosController from '../../controllers/gastos/gastos.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { createGastoSchema, updateGastoSchema } from '../../schemas/gasto.schema';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

router.get('/', authenticateToken, gastosController.getAllGastos);
router.get('/:id', authenticateToken, gastosController.getGastoById);
router.post('/', authenticateToken, validateRequest(createGastoSchema), gastosController.createGasto);
router.put('/:id', authenticateToken, validateRequest(updateGastoSchema), gastosController.updateGasto);
router.delete('/:id', authenticateToken, gastosController.deleteGasto);

export default router;
