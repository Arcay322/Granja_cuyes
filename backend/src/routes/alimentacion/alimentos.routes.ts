import { Router } from 'express';
import * as alimentosController from '../../controllers/alimentacion/alimentos.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { createAlimentoSchema, updateAlimentoSchema } from '../../schemas/alimento.schema';

const router = Router();

router.get('/', alimentosController.getAllAlimentos);
router.get('/:id', alimentosController.getAlimentoById);
router.post('/', validateRequest(createAlimentoSchema), alimentosController.createAlimento);
router.put('/:id', validateRequest(updateAlimentoSchema), alimentosController.updateAlimento);
router.delete('/:id', alimentosController.deleteAlimento);

export default router;
