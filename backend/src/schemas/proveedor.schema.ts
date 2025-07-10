import { z } from 'zod';

export const createProveedorSchema = z.object({
    body: z.object({
        nombre: z.string({ required_error: 'El nombre es requerido.' }).min(3),
        contacto: z.string().optional(),
        telefono: z.string().optional(),
        direccion: z.string().optional(),
    }),
});

export const updateProveedorSchema = z.object({
    body: createProveedorSchema.shape.body.partial(),
    params: z.object({
        id: z.string().refine((val) => !isNaN(parseInt(val, 10))),
    }),
});
