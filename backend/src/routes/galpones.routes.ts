import { Router } from 'express';
import * as galponesController from '../controllers/galpones.controller';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Rutas para galpones
router.get('/', authenticateToken, galponesController.getGalpones);
router.get('/:galpon', authenticateToken, galponesController.getGalpon);
router.post('/', authenticateToken, galponesController.createGalpon);
router.put('/:galpon', authenticateToken, galponesController.updateGalpon);
router.delete('/:galpon', authenticateToken, galponesController.deleteGalpon);

// Rutas para jaulas dentro de galpones
router.get('/:galpon/jaulas', authenticateToken, galponesController.getJaulasByGalpon);
router.post('/jaula', authenticateToken, galponesController.createJaulaVacia);

export default router;
