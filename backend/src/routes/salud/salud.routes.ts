import { Router } from 'express';
import * as saludController from '../../controllers/salud/salud.controller';
import { authenticateToken } from '../../middlewares/auth';
import { validateRequest, validateRequestWithParams } from '../../middlewares/validateRequest';
import { createHistorialSaludSchema, updateHistorialSaludSchema } from '../../schemas/historialSalud.schema';

const router = Router();

router.get('/', authenticateToken, saludController.getAllHistorial);
router.get('/:id', authenticateToken, saludController.getHistorialById);
router.post('/', authenticateToken, validateRequest(createHistorialSaludSchema), saludController.createHistorial);
router.put('/:id', authenticateToken, validateRequestWithParams(updateHistorialSaludSchema), saludController.updateHistorial);
router.delete('/:id', authenticateToken, saludController.deleteHistorial);

export default router;
