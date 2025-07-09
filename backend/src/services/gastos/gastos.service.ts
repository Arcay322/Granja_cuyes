import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getAllGastos = async () => {
  return prisma.gasto.findMany(); // Cambia 'gasto' por 'gasto' si el modelo es correcto
};

export const getGastoById = async (id: number) => {
  return prisma.gasto.findUnique({ where: { id } });
};

export const createGasto = async (data: any) => {
  // Sanitize data - convert string to correct types
  const sanitizedData = {
    ...data,
    fecha: data.fecha ? new Date(data.fecha) : new Date(),
    monto: typeof data.monto === 'string' ? parseFloat(data.monto) : data.monto
  };

  return prisma.gasto.create({ data: sanitizedData });
};

export const updateGasto = async (id: number, data: any) => {
  // Sanitize data - convert string to correct types
  const sanitizedData = {
    ...data,
    fecha: data.fecha ? new Date(data.fecha) : undefined,
    monto: typeof data.monto === 'string' ? parseFloat(data.monto) : data.monto
  };

  return prisma.gasto.update({ where: { id }, data: sanitizedData });
};

export const deleteGasto = async (id: number) => {
  const deleted = await prisma.gasto.delete({ where: { id } });
  return !!deleted;
};
