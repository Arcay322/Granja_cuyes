import { z } from 'zod';

const ventaDetalleSchema = z.object({
  cuyId: z.number({ required_error: 'El cuyId es requerido.' }),
  peso: z.number({ required_error: 'El peso es requerido.' }).min(0),
  precioUnitario: z.number({ required_error: 'El precio unitario es requerido.' }).min(0),
});

export const createVentaSchema = z.object({
  clienteId: z.number({ required_error: 'El clienteId es requerido.' }),
  fecha: z.string({ required_error: 'La fecha es requerida.' }),
  total: z.number({ required_error: 'El total es requerido.' }).min(0),
  estadoPago: z.string().optional(),
  detalles: z.array(ventaDetalleSchema).optional(),
});

export const updateVentaSchema = z.object({
  body: createVentaSchema.partial(),
  params: z.object({
    id: z.string().refine((val) => !isNaN(parseInt(val, 10)), {
      message: 'El ID debe ser un número',
    }),
  }),
});
