import { Router } from 'express';
import * as alimentosController from '../../controllers/alimentacion/alimentos.controller';

const router = Router();

router.get('/', alimentosController.getAllAlimentos);
router.get('/:id', alimentosController.getAlimentoById);
router.post('/', alimentosController.createAlimento);
router.put('/:id', alimentosController.updateAlimento);
router.delete('/:id', alimentosController.deleteAlimento);

export default router;
