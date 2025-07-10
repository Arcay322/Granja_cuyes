import { z } from 'zod';

export const createClienteSchema = z.object({
    body: z.object({
        nombre: z.string({ required_error: 'El nombre es requerido.' }).min(3),
        contacto: z.string().optional(),
        telefono: z.string().optional(),
        direccion: z.string().optional(),
    }),
});

export const updateClienteSchema = z.object({
    body: createClienteSchema.shape.body.partial(),
    params: z.object({
        id: z.string().refine((val) => !isNaN(parseInt(val, 10))),
    }),
});
