export interface CuyInput {
  nombre: string;
  fechaNacimiento?: Date | string;
  peso?: number;
  etapaId?: number;
  // Agrega aquí otros campos según tu modelo Prisma
}
