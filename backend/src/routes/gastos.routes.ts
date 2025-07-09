import { Router } from 'express';
import * as gastosController from '../controllers/gastos.controller';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.get('/', authenticateToken, gastosController.getAllGastos);
router.get('/:id', authenticateToken, gastosController.getGastoById);
router.post('/', authenticateToken, gastosController.createGasto);
router.put('/:id', authenticateToken, gastosController.updateGasto);
router.delete('/:id', authenticateToken, gastosController.deleteGasto);

export default router;
