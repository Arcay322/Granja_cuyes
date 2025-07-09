import { PrismaClient, Gasto } from '@prisma/client';
const prisma = new PrismaClient();

export const getAllGastos = async (): Promise<Gasto[]> => {
  return prisma.gasto.findMany();
};

export const getGastoById = async (id: number): Promise<Gasto | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de gasto inválido');
  }
  return prisma.gasto.findUnique({ 
    where: { 
      id: Number(id) 
    } 
  });
};

export const createGasto = async (data: any): Promise<Gasto> => {
  // Formatear la fecha si viene en formato string
  if (data.fecha && typeof data.fecha === 'string') {
    data.fecha = new Date(data.fecha);
  }
  
  // Convertir el monto a número si viene como string
  if (data.monto && typeof data.monto === 'string') {
    data.monto = Number(data.monto);
  }
  
  return prisma.gasto.create({ data });
};

export const updateGasto = async (id: number, data: any): Promise<Gasto | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de gasto inválido');
  }
  
  // Formatear la fecha si viene en formato string
  if (data.fecha && typeof data.fecha === 'string') {
    data.fecha = new Date(data.fecha);
  }
  
  // Convertir el monto a número si viene como string
  if (data.monto && typeof data.monto === 'string') {
    data.monto = Number(data.monto);
  }
  
  return prisma.gasto.update({ 
    where: { 
      id: Number(id) 
    }, 
    data 
  });
};

export const deleteGasto = async (id: number): Promise<boolean> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de gasto inválido');
  }
  
  try {
    const deleted = await prisma.gasto.delete({ 
      where: { 
        id: Number(id) 
      } 
    });
    return !!deleted;
  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    return false;
  }
};
