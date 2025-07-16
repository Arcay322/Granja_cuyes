import { z } from 'zod';

export const createConsumoSchema = z.object({
  galpon: z.string({ required_error: 'El galpón es requerido.' }).min(1, 'El galpón no puede estar vacío'),
  fecha: z.string({ required_error: 'La fecha es requerida.' }),
  alimentoId: z.number({ required_error: 'El alimento es requerido.' }).int().positive(),
  cantidad: z.number({ required_error: 'La cantidad es requerida.' }).positive('La cantidad debe ser mayor a 0'),
});

export const updateConsumoSchema = z.object({
  body: createConsumoSchema.partial(),
  params: z.object({
    id: z.string().refine((val) => !isNaN(parseInt(val, 10)), {
      message: 'El ID debe ser un número',
    }),
  }),
});