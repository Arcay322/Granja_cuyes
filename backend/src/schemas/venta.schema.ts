import { z } from 'zod';

export const createVentaSchema = z.object({
  body: z.object({
    clienteId: z.number({ required_error: 'El clienteId es requerido.' }),
    fecha: z.string({ required_error: 'La fecha es requerida.' }),
    total: z.number({ required_error: 'El total es requerido.' }).min(0),
    estadoPago: z.string().optional(),
  }),
});

export const updateVentaSchema = z.object({
  body: createVentaSchema.shape.body.partial(),
  params: z.object({
    id: z.string().refine((val) => !isNaN(parseInt(val, 10)), {
      message: 'El ID debe ser un número',
    }),
  }),
});
