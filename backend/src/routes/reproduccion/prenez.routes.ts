import express from 'express';
import * as prenezController from '../../controllers/reproduccion/prenez.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = express.Router();

// Proteger todas las rutas de prenez con autenticación
router.use(authenticateToken);

// ===== RUTAS ESPECÍFICAS (deben ir antes de las rutas con parámetros) =====
router.get('/stats', prenezController.getEstadisticas);
router.get('/estadisticas-avanzadas', prenezController.getEstadisticasAvanzadas);
router.get('/alertas', prenezController.getAlertas);
router.get('/alertas-especificas', prenezController.getAlertasEspecificas);
router.get('/activas', prenezController.getActivas);
router.get('/proximos-partos', prenezController.getProximosPartos);

// ===== RUTAS PRINCIPALES =====
router.get('/', prenezController.getAll);
router.get('/:id', prenezController.getById);
router.post('/', prenezController.create);
router.put('/:id', prenezController.update);
router.delete('/:id', prenezController.remove);

// ===== RUTAS PARA CAMBIAR ESTADO =====
router.post('/:id/completar', prenezController.completar);
router.post('/:id/fallida', prenezController.marcarFallida);

export default router;
