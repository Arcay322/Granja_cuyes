import { z } from 'zod';

export const createGalponSchema = z.object({
  body: z.object({
    nombre: z.string({ required_error: 'El nombre es requerido.' }).min(2),
    capacidad: z.number({ required_error: 'La capacidad es requerida.' }).int().positive(),
    ubicacion: z.string().optional(),
  }),
});

export const updateGalponSchema = z.object({
  body: createGalponSchema.shape.body.partial(),
  params: z.object({
    id: z.string().refine((val) => !isNaN(parseInt(val, 10)), {
      message: 'El ID debe ser un número',
    }),
  }),
});
