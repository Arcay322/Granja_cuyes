import express from 'express';
import * as etapasController from '../controllers/etapas.controller';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Rutas para gestión de etapas
router.get('/evaluar', etapasController.evaluarTransiciones);
router.post('/transicion/:cuyId', etapasController.aplicarTransicion);
router.get('/estadisticas', etapasController.obtenerEstadisticas);
router.get('/proximas', etapasController.obtenerProximasTransiciones);
router.put('/proposito/:cuyId', etapasController.actualizarProposito);

export default router;
