import { PrismaClient, HistorialSalud } from '@prisma/client';
const prisma = new PrismaClient();

export const getAllRegistrosSalud = async (): Promise<HistorialSalud[]> => {
  return prisma.historialSalud.findMany({
    include: {
      cuy: true
    }
  });
};

export const getRegistroSaludById = async (id: number): Promise<HistorialSalud | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de registro inválido');
  }
  return prisma.historialSalud.findUnique({ 
    where: { 
      id: Number(id) 
    },
    include: {
      cuy: true
    }
  });
};

export const createRegistroSalud = async (data: any): Promise<HistorialSalud> => {
  // Formatear la fecha si viene en formato string
  if (data.fecha && typeof data.fecha === 'string') {
    data.fecha = new Date(data.fecha);
  }
  
  // Convertir el ID del cuy a número
  if (data.cuyId && typeof data.cuyId === 'string') {
    data.cuyId = Number(data.cuyId);
  }
  
  return prisma.historialSalud.create({ 
    data,
    include: {
      cuy: true
    }
  });
};

export const updateRegistroSalud = async (id: number, data: any): Promise<HistorialSalud | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de registro inválido');
  }
  
  // Formatear la fecha si viene en formato string
  if (data.fecha && typeof data.fecha === 'string') {
    data.fecha = new Date(data.fecha);
  }
  
  // Convertir el ID del cuy a número
  if (data.cuyId && typeof data.cuyId === 'string') {
    data.cuyId = Number(data.cuyId);
  }
  
  return prisma.historialSalud.update({ 
    where: { 
      id: Number(id) 
    }, 
    data,
    include: {
      cuy: true
    }
  });
};

export const deleteRegistroSalud = async (id: number): Promise<boolean> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de registro inválido');
  }
  
  try {
    const deleted = await prisma.historialSalud.delete({ 
      where: { 
        id: Number(id) 
      } 
    });
    return !!deleted;
  } catch (error) {
    console.error('Error al eliminar registro de salud:', error);
    return false;
  }
};
