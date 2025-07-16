import { z } from 'zod';

// ===== SCHEMAS PARA GALPONES =====

export const createGalponSchema = z.object({
  nombre: z.string({ required_error: 'El nombre es requerido.' })
    .min(1, 'El nombre no puede estar vacío')
    .max(10, 'El nombre no puede tener más de 10 caracteres'),
  descripcion: z.string().optional(),
  ubicacion: z.string().optional(),
  capacidadMaxima: z.number().int().positive().optional(),
  estado: z.enum(['Activo', 'Inactivo', 'Mantenimiento']).optional(),
});

export const updateGalponSchema = z.object({
  body: createGalponSchema.partial(),
  params: z.object({
    id: z.string().refine((val) => !isNaN(parseInt(val, 10)), {
      message: 'El ID debe ser un número',
    }),
  }),
});

// ===== SCHEMAS PARA JAULAS =====

export const createJaulaSchema = z.object({
  nombre: z.string({ required_error: 'El nombre es requerido.' })
    .min(1, 'El nombre no puede estar vacío')
    .max(10, 'El nombre no puede tener más de 10 caracteres'),
  galponId: z.number({ required_error: 'El ID del galpón es requerido.' }).int().positive(),
  galponNombre: z.string({ required_error: 'El nombre del galpón es requerido.' }),
  descripcion: z.string().optional(),
  capacidadMaxima: z.number().int().positive().optional(),
  tipo: z.enum(['Estándar', 'Cría', 'Engorde', 'Reproducción', 'Cuarentena']).optional(),
  estado: z.enum(['Activo', 'Inactivo', 'Mantenimiento']).optional(),
});

export const updateJaulaSchema = z.object({
  body: createJaulaSchema.partial(),
  params: z.object({
    id: z.string().refine((val) => !isNaN(parseInt(val, 10)), {
      message: 'El ID debe ser un número',
    }),
  }),
});