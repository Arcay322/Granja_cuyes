import { z } from 'zod';

export const createGastoSchema = z.object({
    body: z.object({
        descripcion: z.string({ required_error: 'La descripción es requerida.' }),
        monto: z.number({ required_error: 'El monto es requerido.' }).positive(),
        fecha: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: 'La fecha debe ser válida',
        }),
        categoria: z.string({ required_error: 'La categoría es requerida.' }),
    }),
});

export const updateGastoSchema = z.object({
    body: createGastoSchema.shape.body.partial(),
    params: z.object({
        id: z.string().refine((val) => !isNaN(parseInt(val, 10))),
    }),
});
