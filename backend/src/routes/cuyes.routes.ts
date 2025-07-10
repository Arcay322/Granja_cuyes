import { Router } from 'express';
import * as cuyesController from '../controllers/cuyes.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { createCuySchema, updateCuySchema } from '../schemas/cuy.schema';

const router = Router();

router.get('/', cuyesController.getAllCuyes);
router.get('/:id', cuyesController.getCuyById);
router.post('/', validateRequest(createCuySchema), cuyesController.createCuy);
router.put('/:id', validateRequest(updateCuySchema), cuyesController.updateCuy);
router.delete('/:id', cuyesController.deleteCuy);

export default router;
