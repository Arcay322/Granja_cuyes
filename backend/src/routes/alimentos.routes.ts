import { Router } from 'express';
import * as alimentosController from '../controllers/alimentos.controller';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.get('/', authenticateToken, alimentosController.getAllAlimentos);
router.get('/:id', authenticateToken, alimentosController.getAlimentoById);
router.post('/', authenticateToken, alimentosController.createAlimento);
router.put('/:id', authenticateToken, alimentosController.updateAlimento);
router.delete('/:id', authenticateToken, alimentosController.deleteAlimento);

export default router;
