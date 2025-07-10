import { z } from 'zod';

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email({ message: 'Debe ser un correo electrónico válido' }),
        password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
    }),
});

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email({ message: 'Debe ser un correo electrónico válido' }),
        password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
        nombre: z.string().min(2, { message: 'El nombre es requerido' }),
    }),
});
