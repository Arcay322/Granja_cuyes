import { Router } from 'express';
import * as cuyesController from '../controllers/cuyes.controller';

const router = Router();

router.get('/', cuyesController.getAllCuyes);
router.get('/:id', cuyesController.getCuyById);
router.post('/', cuyesController.createCuy);
router.put('/:id', cuyesController.updateCuy);
router.delete('/:id', cuyesController.deleteCuy);

export default router;
