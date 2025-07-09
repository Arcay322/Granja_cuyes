import express from 'express';
import * as camadasController from '../../controllers/reproduccion/camadas.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Rutas para camadas
router.get('/', camadasController.getAllCamadas);
router.get('/:id', camadasController.getCamadaById);
router.post('/', camadasController.createCamada);
router.put('/:id', camadasController.updateCamada);
router.delete('/:id', camadasController.deleteCamada);

export default router;
