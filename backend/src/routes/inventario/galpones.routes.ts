import { Router } from 'express';
import * as galponesController from '../../controllers/inventario/galpones.controller';
import { authenticateToken } from '../../middlewares/auth';
import { validateRequest, validateRequestWithParams } from '../../middlewares/validateRequest';
import { createGalponSchema, updateGalponSchema, createJaulaSchema, updateJaulaSchema } from '../../schemas/galpon.schema';

const router = Router();

// ===== RUTAS ESPECÍFICAS (deben ir antes de las rutas con parámetros) =====
router.get('/resumen', authenticateToken, galponesController.getResumenTodosGalpones);
router.get('/sugerir-ubicacion', authenticateToken, galponesController.sugerirUbicacionCuy);

// ===== RUTAS PARA GALPONES =====
router.get('/', authenticateToken, galponesController.getAllGalpones);
router.get('/:id', authenticateToken, galponesController.getGalponById);
router.get('/nombre/:nombre', authenticateToken, galponesController.getGalponByNombre);
router.post('/', authenticateToken, validateRequest(createGalponSchema), galponesController.createGalpon);
router.put('/:id', authenticateToken, validateRequestWithParams(updateGalponSchema), galponesController.updateGalpon);
router.delete('/:id', authenticateToken, galponesController.deleteGalpon);

// ===== RUTAS PARA ESTADÍSTICAS =====
router.get('/:galpon/estadisticas', authenticateToken, galponesController.getEstadisticasGalpon);

// ===== RUTAS PARA JAULAS =====
router.get('/jaulas/todas', authenticateToken, galponesController.getAllJaulas);
router.get('/jaulas/:id', authenticateToken, galponesController.getJaulaById);
router.get('/:galpon/jaulas', authenticateToken, galponesController.getJaulasByGalpon);
router.get('/:galpon/jaulas/:jaula/capacity', authenticateToken, galponesController.checkJaulaCapacity);
router.post('/jaulas', authenticateToken, validateRequest(createJaulaSchema), galponesController.createJaula);
router.put('/jaulas/:id', authenticateToken, validateRequestWithParams(updateJaulaSchema), galponesController.updateJaula);
router.delete('/jaulas/:id', authenticateToken, galponesController.deleteJaula);

// ===== RUTAS PARA ELIMINACIÓN CON RELACIONES =====
router.get('/:id/verificar-relaciones', authenticateToken, galponesController.verificarRelacionesGalpon);
router.delete('/:id/eliminar-con-relaciones', authenticateToken, galponesController.eliminarGalponConRelaciones);
router.get('/jaulas/:id/verificar-relaciones', authenticateToken, galponesController.verificarRelacionesJaula);
router.delete('/jaulas/:id/eliminar-con-relaciones', authenticateToken, galponesController.eliminarJaulaConRelaciones);

export default router;