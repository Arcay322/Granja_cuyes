export interface AlimentoInput {
  nombre: string;
  descripcion?: string;
  stock: number;
  costoUnitario: number;
  proveedorId?: number;
  // Agrega aquí otros campos según tu modelo Prisma
}
