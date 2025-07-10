export interface VentaInput {
  clienteId: number;
  fecha: Date | string;
  total: number;
  estadoPago?: string;
  // Agrega aquí otros campos según tu modelo Prisma
}
