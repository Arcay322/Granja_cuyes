import { Router } from 'express';
import * as consumoController from '../../controllers/alimentacion/consumo.controller';
import { authenticateToken } from '../../middlewares/auth';
import { validateRequest, validateRequestWithParams } from '../../middlewares/validateRequest';
import { createConsumoSchema, updateConsumoSchema } from '../../schemas/consumo.schema';

const router = Router();

// Rutas específicas primero
router.get('/estadisticas', authenticateToken, consumoController.getEstadisticasConsumo);
router.get('/galpon/:galpon', authenticateToken, consumoController.getConsumosPorGalpon);

// Rutas CRUD básicas
router.get('/', authenticateToken, consumoController.getAllConsumos);
router.get('/:id', authenticateToken, consumoController.getConsumoById);
router.post('/', authenticateToken, validateRequest(createConsumoSchema), consumoController.createConsumo);
router.put('/:id', authenticateToken, validateRequestWithParams(updateConsumoSchema), consumoController.updateConsumo);
router.delete('/:id', authenticateToken, consumoController.deleteConsumo);

export default router;