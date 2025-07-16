import { z } from 'zod';

export const createGastoSchema = z.object({
    concepto: z.string({ required_error: 'El concepto es requerido.' }),
    monto: z.number({ required_error: 'El monto es requerido.' }).positive(),
    fecha: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'La fecha debe ser válida',
    }),
    categoria: z.string({ required_error: 'La categoría es requerida.' }),
});

export const updateGastoSchema = z.object({
    body: createGastoSchema.partial(),
    params: z.object({
        id: z.string().refine((val) => !isNaN(parseInt(val, 10))),
    }),
});
