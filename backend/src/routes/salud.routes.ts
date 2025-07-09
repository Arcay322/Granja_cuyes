import { Router } from 'express';
import * as saludController from '../controllers/salud.controller';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.get('/', authenticateToken, saludController.getAllRegistrosSalud);
router.get('/:id', authenticateToken, saludController.getRegistroSaludById);
router.post('/', authenticateToken, saludController.createRegistroSalud);
router.put('/:id', authenticateToken, saludController.updateRegistroSalud);
router.delete('/:id', authenticateToken, saludController.deleteRegistroSalud);

export default router;
