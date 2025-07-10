import { Router } from 'express';
import * as jaulasController from '../controllers/jaulas.controller';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Rutas para jaulas
router.get('/', authenticateToken, jaulasController.getJaulas);
router.get('/:galpon/:jaula', authenticateToken, jaulasController.getJaula);
router.post('/', authenticateToken, jaulasController.createJaula);
router.put('/:galpon/:jaula', authenticateToken, jaulasController.updateJaula);
router.delete('/:galpon/:jaula', authenticateToken, jaulasController.deleteJaula);

export default router;
