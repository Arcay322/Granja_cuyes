/**
 * @openapi
 * /api/alimentos:
 *   get:
 *     summary: Obtener todos los alimentos
 *     tags:
 *       - Alimentos
 *     responses:
 *       200:
 *         description: Lista de alimentos
 *   post:
 *     summary: Crear un nuevo alimento
 *     tags:
 *       - Alimentos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlimentoInput'
 *     responses:
 *       201:
 *         description: Alimento creado
 *
 * /api/alimentos/{id}:
 *   get:
 *     summary: Obtener un alimento por ID
 *     tags:
 *       - Alimentos
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del alimento
 *     responses:
 *       200:
 *         description: Alimento encontrado
 *   put:
 *     summary: Actualizar un alimento
 *     tags:
 *       - Alimentos
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del alimento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlimentoInput'
 *     responses:
 *       200:
 *         description: Alimento actualizado
 *   delete:
 *     summary: Eliminar un alimento
 *     tags:
 *       - Alimentos
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del alimento
 *     responses:
 *       204:
 *         description: Alimento eliminado
 */

import { Router } from 'express';
import * as alimentosController from '../../controllers/alimentacion/alimentos.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { createAlimentoSchema, updateAlimentoSchema } from '../../schemas/alimento.schema';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();

router.get('/', authenticateToken, alimentosController.getAllAlimentos);
router.get('/:id', authenticateToken, alimentosController.getAlimentoById);
router.post('/', authenticateToken, validateRequest(createAlimentoSchema), alimentosController.createAlimento);
router.put('/:id', authenticateToken, validateRequest(updateAlimentoSchema), alimentosController.updateAlimento);
router.delete('/:id', authenticateToken, alimentosController.deleteAlimento);

export default router;
