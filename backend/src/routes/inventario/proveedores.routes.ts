import express from 'express';
import * as proveedoresController from '../../controllers/inventario/proveedores.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Rutas para Proveedores
router.get('/', proveedoresController.getAllProveedores);
router.get('/:id', proveedoresController.getProveedorById);
router.post('/', proveedoresController.createProveedor);
router.put('/:id', proveedoresController.updateProveedor);
router.delete('/:id', proveedoresController.deleteProveedor);

export default router;
