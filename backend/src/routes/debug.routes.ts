import express from 'express';
import * as debugController from '../controllers/debug.controller';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

// Proteger todas las rutas de debug con autenticación
router.use(authenticateToken);

router.get('/etapas', debugController.debugEtapas);

export default router;
