import { PrismaClient, HistorialSalud } from '@prisma/client';
const prisma = new PrismaClient();

export const getAllHistorial = async (): Promise<HistorialSalud[]> => {
  return prisma.historialSalud.findMany({
    include: {
      cuy: true
    }
  });
};

export const getHistorialById = async (id: number): Promise<HistorialSalud | null> => {
  return prisma.historialSalud.findUnique({
    where: { id },
    include: {
      cuy: true
    }
  });
};

export const createHistorial = async (data: any): Promise<HistorialSalud> => {
  // Formatear la fecha si viene como string
  if (data.fecha && typeof data.fecha === 'string') {
    data.fecha = new Date(data.fecha);
  }

  // Asegurar que cuyId es un número
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

export const updateHistorial = async (id: number, data: any): Promise<HistorialSalud | null> => {
  // Formatear la fecha si viene como string
  if (data.fecha && typeof data.fecha === 'string') {
    data.fecha = new Date(data.fecha);
  }

  // Asegurar que cuyId es un número
  if (data.cuyId && typeof data.cuyId === 'string') {
    data.cuyId = Number(data.cuyId);
  }

  return prisma.historialSalud.update({
    where: { id },
    data,
    include: {
      cuy: true
    }
  });
};

export const deleteHistorial = async (id: number): Promise<boolean> => {
  try {
    const deleted = await prisma.historialSalud.delete({ where: { id } });
    return !!deleted;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al eliminar historial de salud:', error);
    }
    return false;
  }
};
