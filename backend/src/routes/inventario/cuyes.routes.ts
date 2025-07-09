import { Router } from 'express';
import * as cuyesController from '../../controllers/inventario/cuyes.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

// Ruta para estadísticas debe ir antes de la ruta con parámetro :id
router.get('/stats', authenticateToken, cuyesController.getCuyesStats);
router.get('/', authenticateToken, cuyesController.getAllCuyes);
router.get('/:id', authenticateToken, cuyesController.getCuyById);
router.post('/', authenticateToken, cuyesController.createCuy);
router.put('/:id', authenticateToken, cuyesController.updateCuy);
router.delete('/:id', authenticateToken, cuyesController.deleteCuy);

// Rutas para cambiar propósito
router.patch('/:id/hacer-reproductor', authenticateToken, cuyesController.cambiarAReproductor);
router.patch('/:id/enviar-engorde', authenticateToken, cuyesController.cambiarAEngorde);

// Ruta para registro masivo por jaula
router.post('/jaula', authenticateToken, cuyesController.crearCuyesPorJaula);

export default router;
