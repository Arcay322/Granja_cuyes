import express from 'express';
import * as prenezController from '../../controllers/reproduccion/prenez.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = express.Router();

// Proteger todas las rutas de prenez con autenticación
router.use(authenticateToken);

// Rutas para gestionar preñeces
router.get('/', prenezController.getAll);
router.get('/activas', prenezController.getActivas);
router.get('/proximos-partos', prenezController.getProximosPartos);
router.get('/:id', prenezController.getById);
router.post('/', prenezController.create);
router.put('/:id', prenezController.update);
router.delete('/:id', prenezController.remove);
router.post('/:id/completar', prenezController.completar);
router.post('/:id/fallida', prenezController.marcarFallida);

export default router;
