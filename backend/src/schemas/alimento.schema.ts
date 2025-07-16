import { z } from 'zod';

export const createAlimentoSchema = z.object({
    nombre: z.string({ required_error: 'El nombre es requerido.' }).min(3, 'El nombre debe tener al menos 3 caracteres'),
    descripcion: z.string().optional(),
    unidad: z.string({ required_error: 'La unidad es requerida.' }),
    stock: z.number({ required_error: 'El stock es requerido.' }).min(0, 'El stock no puede ser negativo'),
    costoUnitario: z.number({ required_error: 'El costo es requerido.' }).min(0, 'El costo no puede ser negativo'),
    proveedorId: z.number().int().positive().optional(),
});

export const updateAlimentoSchema = z.object({
    body: createAlimentoSchema.partial(), // En la actualización, todos los campos son opcionales
    params: z.object({
        id: z.string().refine((val) => !isNaN(parseInt(val, 10)), {
            message: 'El ID debe ser un número',
        }),
    }),
});

/**
 * @openapi
 * components:
 *   schemas:
 *     AlimentoInput:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           example: Alfalfa
 *         descripcion:
 *           type: string
 *           example: Forraje verde
 *         unidad:
 *           type: string
 *           example: kg
 *         stock:
 *           type: number
 *           example: 100
 *         costoUnitario:
 *           type: number
 *           example: 2.5
 *         proveedorId:
 *           type: integer
 *           example: 1
 *       required:
 *         - nombre
 *         - unidad
 *         - stock
 *         - costoUnitario
 */
