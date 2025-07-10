export interface ClienteInput {
  nombre: string;
  contacto: string; // Obligatorio según Prisma
  direccion: string; // Obligatorio según Prisma
  email?: string;
  telefono?: string;
  // Agrega aquí otros campos obligatorios según tu modelo Prisma
}
