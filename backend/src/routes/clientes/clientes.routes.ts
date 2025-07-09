import express from 'express';
import * as clientesController from '../../controllers/clientes/clientes.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = express.Router();

router.get('/', authenticateToken, clientesController.getAllClientes);
router.get('/:id', authenticateToken, clientesController.getClienteById);
router.post('/', authenticateToken, clientesController.createCliente);
router.put('/:id', authenticateToken, clientesController.updateCliente);
router.delete('/:id', authenticateToken, clientesController.deleteCliente);

export default router;
