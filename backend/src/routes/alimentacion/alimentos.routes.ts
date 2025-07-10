import { Router } from 'express';
import * as alimentosController from '../../controllers/alimentacion/alimentos.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { createAlimentoSchema, updateAlimentoSchema } from '../../schemas/alimento.schema';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

router.get('/', authenticateToken, alimentosController.getAllAlimentos);
router.get('/:id', authenticateToken, alimentosController.getAlimentoById);
router.post('/', authenticateToken, validateRequest(createAlimentoSchema), alimentosController.createAlimento);
router.put('/:id', authenticateToken, validateRequest(updateAlimentoSchema), alimentosController.updateAlimento);
router.delete('/:id', authenticateToken, alimentosController.deleteAlimento);

export default router;
