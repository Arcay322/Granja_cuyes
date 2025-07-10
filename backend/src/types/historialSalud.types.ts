export interface HistorialSaludInput {
  cuyId: number;
  fecha: Date | string;
  tipo: string; // Obligatorio según Prisma
  veterinario: string; // Obligatorio según Prisma
  descripcion: string; // Obligatorio según Prisma
  tratamiento?: string;
  // Agrega aquí otros campos obligatorios según tu modelo Prisma
}
