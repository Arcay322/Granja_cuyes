import { z } from 'zod';

// Enums para validación
const razasValidas = ['Peruano', 'Andino', 'Inti', 'Criollo', 'Mejorado', 'Otros'] as const;
const sexosValidos = ['M', 'H'] as const;
const estadosValidos = ['Activo', 'Enfermo', 'Vendido', 'Fallecido'] as const;
const etapasValidas = ['Cría', 'Juvenil', 'Engorde', 'Reproductor', 'Reproductora', 'Retirado'] as const;
const propositosValidos = ['Cría', 'Juvenil', 'Engorde', 'Reproducción', 'Venta', 'Indefinido'] as const;

// Validaciones personalizadas
const fechaValidation = z.string()
  .refine((val) => !isNaN(Date.parse(val)), {
    message: 'Debe ser una fecha válida',
  })
  .refine((val) => {
    const fecha = new Date(val);
    const hoy = new Date();
    return fecha <= hoy;
  }, {
    message: 'La fecha no puede ser futura',
  });

const pesoValidation = z.number()
  .positive('El peso debe ser mayor a 0')
  .max(5, 'El peso no puede ser mayor a 5kg (valor muy alto para un cuy)')
  .refine((val) => val >= 0.05, {
    message: 'El peso mínimo es 0.05kg (50g)',
  });

// Esquema base que puede ser reutilizado
const cuyBodySchema = z.object({
    raza: z.enum(razasValidas, { 
      required_error: 'La raza es requerida.',
      invalid_type_error: 'Raza no válida'
    }),
    fechaNacimiento: fechaValidation,
    sexo: z.enum(sexosValidos, { 
      errorMap: () => ({ message: "El sexo debe ser 'M' (Macho) o 'H' (Hembra)" }) 
    }),
    peso: pesoValidation,
    galpon: z.string({ required_error: 'El galpón es requerido.' })
      .min(1, 'El galpón no puede estar vacío')
      .max(10, 'El nombre del galpón no puede tener más de 10 caracteres'),
    jaula: z.string({ required_error: 'La jaula es requerida.' })
      .min(1, 'La jaula no puede estar vacía')
      .max(10, 'El nombre de la jaula no puede tener más de 10 caracteres'),
    estado: z.enum(estadosValidos).default('Activo'),
    camadaId: z.number().int().positive().optional().nullable(),
    fechaVenta: z.string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'La fecha de venta debe ser válida',
      })
      .optional()
      .nullable(),
    fechaFallecimiento: z.string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'La fecha de fallecimiento debe ser válida',
      })
      .optional()
      .nullable(),
    etapaVida: z.enum(etapasValidas).optional(),
    proposito: z.enum(propositosValidos).optional(),
}).refine((data) => {
  // Validación cruzada: si está vendido, debe tener fecha de venta
  if (data.estado === 'Vendido' && !data.fechaVenta) {
    return false;
  }
  return true;
}, {
  message: 'Si el estado es "Vendido", debe especificar la fecha de venta',
  path: ['fechaVenta']
}).refine((data) => {
  // Validación cruzada: si está fallecido, debe tener fecha de fallecimiento
  if (data.estado === 'Fallecido' && !data.fechaFallecimiento) {
    return false;
  }
  return true;
}, {
  message: 'Si el estado es "Fallecido", debe especificar la fecha de fallecimiento',
  path: ['fechaFallecimiento']
});

export const createCuySchema = z.object({
    body: cuyBodySchema,
});

// Schema separado para actualización (sin validaciones cruzadas complejas)
const updateCuyBodySchema = z.object({
    raza: z.enum(razasValidas).optional(),
    fechaNacimiento: fechaValidation.optional(),
    sexo: z.enum(sexosValidos).optional(),
    peso: pesoValidation.optional(),
    galpon: z.string()
      .min(1, 'El galpón no puede estar vacío')
      .max(10, 'El nombre del galpón no puede tener más de 10 caracteres')
      .optional(),
    jaula: z.string()
      .min(1, 'La jaula no puede estar vacía')
      .max(10, 'El nombre de la jaula no puede tener más de 10 caracteres')
      .optional(),
    estado: z.enum(estadosValidos).optional(),
    camadaId: z.number().int().positive().optional().nullable(),
    fechaVenta: z.string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'La fecha de venta debe ser válida',
      })
      .optional()
      .nullable(),
    fechaFallecimiento: z.string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'La fecha de fallecimiento debe ser válida',
      })
      .optional()
      .nullable(),
    etapaVida: z.enum(etapasValidas).optional(),
    proposito: z.enum(propositosValidos).optional(),
});

export const updateCuySchema = z.object({
    body: updateCuyBodySchema,
    params: z.object({
        id: z.string().refine((val) => !isNaN(parseInt(val, 10)), {
            message: 'El ID debe ser un número válido',
        }),
    }),
});

// Schema para registro masivo por jaula
export const registroJaulaSchema = z.object({
    body: z.object({
        galpon: z.string().min(1, 'El galpón es requerido'),
        jaula: z.string().min(1, 'La jaula es requerida'),
        raza: z.enum(razasValidas),
        grupos: z.array(z.object({
            sexo: z.enum(sexosValidos),
            cantidad: z.number().int().positive().max(50, 'Máximo 50 cuyes por grupo'),
            edadDias: z.number().int().min(0).max(365, 'La edad no puede ser mayor a 365 días'),
            pesoPromedio: z.number().positive().max(5000, 'Peso en gramos, máximo 5000g'),
            variacionEdad: z.number().int().min(0).max(30).optional(),
            variacionPeso: z.number().min(0).max(500).optional()
        })).min(1, 'Debe especificar al menos un grupo')
    })
});

// Schema para cambio de propósito
export const cambiarPropositoSchema = z.object({
    params: z.object({
        id: z.string().refine((val) => !isNaN(parseInt(val, 10)), {
            message: 'El ID debe ser un número válido',
        }),
    })
});

// Schema para filtros de búsqueda
export const filtrosCuyesSchema = z.object({
    query: z.object({
        page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
        limit: z.string().optional().transform((val) => val ? parseInt(val) : 20),
        galpon: z.string().optional(),
        jaula: z.string().optional(),
        raza: z.enum(razasValidas).optional(),
        sexo: z.enum(sexosValidos).optional(),
        estado: z.enum(estadosValidos).optional(),
        etapaVida: z.enum(etapasValidas).optional(),
        proposito: z.enum(propositosValidos).optional(),
        search: z.string().optional()
    })
});
