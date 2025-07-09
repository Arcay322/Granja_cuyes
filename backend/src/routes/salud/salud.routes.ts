import { Router } from 'express';
import * as saludController from '../../controllers/salud/salud.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

router.get('/', authenticateToken, saludController.getAllHistorial);
router.get('/:id', authenticateToken, saludController.getHistorialById);
router.post('/', authenticateToken, saludController.createHistorial);
router.put('/:id', authenticateToken, saludController.updateHistorial);
router.delete('/:id', authenticateToken, saludController.deleteHistorial);

export default router;
