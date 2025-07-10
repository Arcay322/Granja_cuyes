import { z } from 'zod';

export const createHistorialSaludSchema = z.object({
  body: z.object({
    cuyId: z.number({ required_error: 'El cuyId es requerido.' }),
    fecha: z.string({ required_error: 'La fecha es requerida.' }),
    tipo: z.string({ required_error: 'El tipo es requerido.' }),
    veterinario: z.string({ required_error: 'El veterinario es requerido.' }),
    descripcion: z.string({ required_error: 'La descripción es requerida.' }),
    tratamiento: z.string().optional(),
  }),
});

export const updateHistorialSaludSchema = z.object({
  body: createHistorialSaludSchema.shape.body.partial(),
  params: z.object({
    id: z.string().refine((val) => !isNaN(parseInt(val, 10)), {
      message: 'El ID debe ser un número',
    }),
  }),
});
