import express from 'express';
import * as clientesController from '../../controllers/clientes/clientes.controller';
import { authenticateToken } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { createClienteSchema, updateClienteSchema } from '../../schemas/cliente.schema';

const router = express.Router();

router.get('/', authenticateToken, clientesController.getAllClientes);
router.get('/:id', authenticateToken, clientesController.getClienteById);
router.post('/', authenticateToken, validateRequest(createClienteSchema), clientesController.createCliente);
router.put('/:id', authenticateToken, validateRequest(updateClienteSchema), clientesController.updateCliente);
router.delete('/:id', authenticateToken, clientesController.deleteCliente);

export default router;
