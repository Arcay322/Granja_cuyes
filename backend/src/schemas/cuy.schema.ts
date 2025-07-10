import { z } from 'zod';

// Esquema base que puede ser reutilizado
const cuyBodySchema = z.object({
    raza: z.string({ required_error: 'La raza es requerida.' }),
    fechaNacimiento: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'La fecha de nacimiento debe ser válida',
    }),
    sexo: z.enum(['M', 'H'], { errorMap: () => ({ message: "El sexo debe ser 'M' o 'H'" }) }),
    peso: z.number({ required_error: 'El peso es requerido.' }).positive('El peso debe ser un número positivo'),
    galpon: z.string({ required_error: 'El galpón es requerido.' }),
    jaula: z.string({ required_error: 'La jaula es requerida.' }),
    estado: z.string().optional(),
    camadaId: z.number().int().positive().optional().nullable(),
    fechaVenta: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'La fecha de venta debe ser válida',
    }).optional().nullable(),
    fechaFallecimiento: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'La fecha de fallecimiento debe ser válida',
    }).optional().nullable(),
    etapaVida: z.string().optional(),
    proposito: z.string().optional(),
});

export const createCuySchema = z.object({
    body: cuyBodySchema,
});

export const updateCuySchema = z.object({
    body: cuyBodySchema.partial(), // En la actualización, todos los campos son opcionales
    params: z.object({
        id: z.string().refine((val) => !isNaN(parseInt(val, 10)), {
            message: 'El ID debe ser un número',
        }),
    }),
});
