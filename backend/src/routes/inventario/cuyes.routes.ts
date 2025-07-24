import { Router } from 'express';
import * as cuyesController from '../../controllers/inventario/cuyes.controller';
import { authenticateToken } from '../../middlewares/auth';
import { validateRequest, validateRequestWithParams } from '../../middlewares/validateRequest';
import { createCuySchema, updateCuySchema } from '../../schemas/cuy.schema';

const router = Router();

// ===== RUTAS ESPECÍFICAS (deben ir antes de las rutas con parámetros) =====
router.get('/stats', authenticateToken, cuyesController.getCuyesStats);
router.get('/estadisticas-avanzadas', authenticateToken, cuyesController.getCuyesEstadisticasAvanzadas);
router.get('/estadisticas-jaula', authenticateToken, cuyesController.getEstadisticasPorJaula);
router.get('/disponibles-venta', authenticateToken, cuyesController.getCuyesDisponiblesParaVenta);
router.get('/por-etapa/:etapa', authenticateToken, cuyesController.getCuyesPorEtapa);

// ===== RUTAS PRINCIPALES =====
router.get('/', authenticateToken, cuyesController.getAllCuyes);
// Ruta específica debe ir antes de la genérica
router.get('/:id/estadisticas', authenticateToken, cuyesController.getCuyEstadisticas);
router.get('/:id', authenticateToken, cuyesController.getCuyById);
router.post('/', authenticateToken, cuyesController.createCuy);
router.put('/:id', authenticateToken, cuyesController.updateCuy);
router.delete('/:id', authenticateToken, cuyesController.deleteCuy);

// ===== RUTAS PARA ELIMINACIÓN CON VERIFICACIÓN =====
router.get('/:id/verificar-relaciones', authenticateToken, cuyesController.verificarRelacionesCuy);
router.delete('/:id/eliminar-con-relaciones', authenticateToken, cuyesController.deleteCuyConRelaciones);

// ===== RUTAS PARA CAMBIAR PROPÓSITO =====
router.patch('/:id/hacer-reproductor', authenticateToken, cuyesController.cambiarAReproductor);
router.patch('/:id/enviar-engorde', authenticateToken, cuyesController.cambiarAEngorde);

// ===== RUTAS PARA HISTORIAL Y ANÁLISIS =====

// Nueva ruta: estadísticas reproductivas individuales
router.get('/:id/estadisticas', authenticateToken, cuyesController.getCuyEstadisticas);
router.get('/:id/historial', authenticateToken, cuyesController.getCuyHistorial);

// ===== RUTAS PARA REGISTRO MASIVO =====
router.post('/jaula', authenticateToken, cuyesController.crearCuyesPorJaula);

// ===== RUTAS PARA MANTENIMIENTO =====
router.post('/actualizar-etapas', authenticateToken, cuyesController.actualizarEtapasAutomaticamente);

export default router;
