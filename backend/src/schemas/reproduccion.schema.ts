import { z } from 'zod';

// Base validation schemas
const positiveIntSchema = z.number().int().positive();
const nonNegativeIntSchema = z.number().int().min(0);
const dateStringSchema = z.string().datetime('Fecha debe estar en formato ISO válido');
const optionalStringSchema = z.string().max(500).optional();

// Prenez (Pregnancy) validation schemas
export const PrenezCreateSchema = z.object({
  madreId: positiveIntSchema.refine(
    (val) => val > 0,
    { message: 'ID de madre debe ser un número positivo válido' }
  ),
  padreId: positiveIntSchema.optional().nullable(),
  fechaPrenez: dateStringSchema.refine(
    (dateStr) => {
      const date = new Date(dateStr);
      const now = new Date();
      return date <= now;
    },
    { message: 'La fecha de preñez no puede ser futura' }
  ),
  fechaProbableParto: dateStringSchema.optional(),
  notas: optionalStringSchema,
  estado: z.enum(['activa', 'completada', 'fallida']).default('activa')
}).refine(
  (data) => {
    if (data.fechaProbableParto) {
      const prenezDate = new Date(data.fechaPrenez);
      const partoDate = new Date(data.fechaProbableParto);
      const diffDays = Math.floor((partoDate.getTime() - prenezDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 59 && diffDays <= 80;
    }
    return true;
  },
  {
    message: 'La fecha probable de parto debe estar entre 59 y 80 días después de la fecha de preñez',
    path: ['fechaProbableParto']
  }
);

export const PrenezUpdateSchema = z.object({
  id: positiveIntSchema,
  madreId: positiveIntSchema.optional(),
  padreId: positiveIntSchema.optional().nullable(),
  fechaPrenez: dateStringSchema.optional(),
  fechaProbableParto: dateStringSchema.optional(),
  notas: optionalStringSchema,
  estado: z.enum(['activa', 'completada', 'fallida']).optional()
});

export const PrenezQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  estado: z.enum(['activa', 'completada', 'fallida']).optional(),
  fechaDesde: z.string().datetime().optional(),
  fechaHasta: z.string().datetime().optional(),
  galpon: z.string().min(1).max(50).optional(),
  jaula: z.string().min(1).max(50).optional(),
  search: z.string().min(1).max(100).optional()
}).refine(
  (data) => {
    if (data.fechaDesde && data.fechaHasta) {
      return new Date(data.fechaDesde) <= new Date(data.fechaHasta);
    }
    return true;
  },
  {
    message: 'La fecha desde debe ser anterior o igual a la fecha hasta',
    path: ['fechaHasta']
  }
);

// Camada (Litter) validation schemas
export const CamadaCreateSchema = z.object({
  fechaNacimiento: dateStringSchema.refine(
    (dateStr) => {
      const date = new Date(dateStr);
      const now = new Date();
      const maxPastDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
      return date <= now && date >= maxPastDate;
    },
    { message: 'La fecha de nacimiento debe ser válida y no mayor a 1 año atrás' }
  ),
  numVivos: nonNegativeIntSchema.max(20, 'Número de crías vivas no puede exceder 20'),
  numMuertos: nonNegativeIntSchema.max(20, 'Número de crías muertas no puede exceder 20'),
  madreId: positiveIntSchema,
  padreId: positiveIntSchema.optional().nullable(),
  prenezId: positiveIntSchema.optional().nullable(),
  numMachos: nonNegativeIntSchema.optional().default(0),
  numHembras: nonNegativeIntSchema.optional().default(0),
  crearCuyes: z.boolean().default(false)
}).refine(
  (data) => data.numVivos + data.numMuertos > 0,
  {
    message: 'El total de crías (vivas + muertas) debe ser mayor a 0',
    path: ['numVivos']
  }
).refine(
  (data) => {
    if (data.crearCuyes && data.numVivos > 0) {
      return (data.numMachos || 0) + (data.numHembras || 0) === data.numVivos;
    }
    return true;
  },
  {
    message: 'La suma de machos y hembras debe ser igual al número de crías vivas',
    path: ['numMachos']
  }
).refine(
  (data) => data.numVivos + data.numMuertos <= 20,
  {
    message: 'El total de crías no puede exceder 20',
    path: ['numMuertos']
  }
);

export const CamadaUpdateSchema = z.object({
  id: positiveIntSchema,
  fechaNacimiento: dateStringSchema.optional(),
  numVivos: nonNegativeIntSchema.optional(),
  numMuertos: nonNegativeIntSchema.optional(),
  madreId: positiveIntSchema.optional(),
  padreId: positiveIntSchema.optional().nullable(),
  prenezId: positiveIntSchema.optional().nullable(),
  numMachos: nonNegativeIntSchema.optional(),
  numHembras: nonNegativeIntSchema.optional(),
  crearCuyes: z.boolean().optional()
});

export const CamadaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  fechaDesde: z.string().datetime().optional(),
  fechaHasta: z.string().datetime().optional(),
  galpon: z.string().min(1).max(50).optional(),
  jaula: z.string().min(1).max(50).optional(),
  search: z.string().min(1).max(100).optional()
}).refine(
  (data) => {
    if (data.fechaDesde && data.fechaHasta) {
      return new Date(data.fechaDesde) <= new Date(data.fechaHasta);
    }
    return true;
  },
  {
    message: 'La fecha desde debe ser anterior o igual a la fecha hasta',
    path: ['fechaHasta']
  }
);

// Compatibility validation schema
export const CompatibilityQuerySchema = z.object({
  madreId: positiveIntSchema,
  padreId: positiveIntSchema
}).refine(
  (data) => data.madreId !== data.padreId,
  {
    message: 'La madre y el padre deben ser animales diferentes',
    path: ['padreId']
  }
);

// Gestation validation schema
export const GestationValidationSchema = z.object({
  madreId: positiveIntSchema,
  fechaRegistroCamada: dateStringSchema
});

// Statistics query schema
export const StatisticsQuerySchema = z.object({
  periodo: z.coerce.number().int().min(1).max(365).default(30),
  fechaDesde: z.string().datetime().optional(),
  fechaHasta: z.string().datetime().optional()
}).refine(
  (data) => {
    if (data.fechaDesde && data.fechaHasta) {
      const diffTime = new Date(data.fechaHasta).getTime() - new Date(data.fechaDesde).getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 365;
    }
    return true;
  },
  {
    message: 'El rango de fechas no puede exceder 365 días',
    path: ['fechaHasta']
  }
);

// ID parameter validation
export const IdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID debe ser un número positivo')
});

// Bulk operation schemas
export const BulkDeleteSchema = z.object({
  ids: z.array(positiveIntSchema).min(1, 'Debe proporcionar al menos un ID').max(50, 'No se pueden eliminar más de 50 registros a la vez')
});

// Export type inference helpers
export type PrenezCreateInput = z.infer<typeof PrenezCreateSchema>;
export type PrenezUpdateInput = z.infer<typeof PrenezUpdateSchema>;
export type PrenezQueryInput = z.infer<typeof PrenezQuerySchema>;
export type CamadaCreateInput = z.infer<typeof CamadaCreateSchema>;
export type CamadaUpdateInput = z.infer<typeof CamadaUpdateSchema>;
export type CamadaQueryInput = z.infer<typeof CamadaQuerySchema>;
export type CompatibilityQueryInput = z.infer<typeof CompatibilityQuerySchema>;
export type GestationValidationInput = z.infer<typeof GestationValidationSchema>;
export type StatisticsQueryInput = z.infer<typeof StatisticsQuerySchema>;
export type IdParamInput = z.infer<typeof IdParamSchema>;
export type BulkDeleteInput = z.infer<typeof BulkDeleteSchema>;