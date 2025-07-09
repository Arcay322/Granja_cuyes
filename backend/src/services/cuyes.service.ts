import { PrismaClient, Cuy } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllCuyesService = async (): Promise<Cuy[]> => {
  return prisma.cuy.findMany();
};

export const getCuyByIdService = async (id: number): Promise<Cuy | null> => {
  return prisma.cuy.findUnique({ where: { id } });
};

export const createCuyService = async (data: Partial<Cuy>): Promise<Cuy> => {
  // Asegurarse de que las fechas estén en formato correcto
  const formattedData = {
    ...data,
    // Si hay fecha de nacimiento, asegurarse de que sea un objeto Date válido
    ...(data.fechaNacimiento && {
      fechaNacimiento: new Date(data.fechaNacimiento)
    })
  };
  
  console.log(`Creando cuy con fecha: ${formattedData.fechaNacimiento}`);
  
  return prisma.cuy.create({ data: formattedData as Cuy });
};

export const updateCuyService = async (id: number, data: Partial<Cuy>): Promise<Cuy> => {
  // Asegurarse de que las fechas estén en formato correcto
  const formattedData = {
    ...data,
    // Si hay fecha de nacimiento, asegurarse de que sea un objeto Date válido
    ...(data.fechaNacimiento && {
      fechaNacimiento: new Date(data.fechaNacimiento)
    })
  };
  
  console.log(`Actualizando cuy #${id} con fecha: ${formattedData.fechaNacimiento}`);
  
  return prisma.cuy.update({ where: { id }, data: formattedData });
};

export const deleteCuyService = async (id: number): Promise<void> => {
  await prisma.cuy.delete({ where: { id } });
};
