import { z } from 'zod';

export const createClienteSchema = z.object({
    nombre: z.string({ required_error: 'El nombre es requerido.' }).min(3),
    contacto: z.string({ required_error: 'El contacto es requerido.' }).min(3),
    direccion: z.string({ required_error: 'La dirección es requerida.' }).min(3),
    telefono: z.string().optional(),
    email: z.string().email('Email inválido').optional(),
});

export const updateClienteSchema = z.object({
    body: createClienteSchema.partial(),
    params: z.object({
        id: z.string().refine((val) => !isNaN(parseInt(val, 10)), {
            message: 'El ID debe ser un número',
        }),
    }),
});
