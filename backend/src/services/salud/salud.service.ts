import { PrismaClient, HistorialSalud } from '@prisma/client';
import { HistorialSaludInput } from '../../types/historialSalud.types';
const prisma = new PrismaClient();

export const getAllHistorial = async (): Promise<HistorialSalud[]> => {
  return prisma.historialSalud.findMany({
    include: {
      cuy: true
    }
  });
};

export const getHistorialById = async (id: number): Promise<HistorialSalud | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw Object.assign(new Error('ID de historial inválido'), { status: 400, isOperational: true });
  }
  return prisma.historialSalud.findUnique({
    where: { id },
    include: {
      cuy: true
    }
  });
};

export const createHistorial = async (data: HistorialSaludInput): Promise<HistorialSalud> => {
  if (data.fecha && typeof data.fecha === 'string') {
    data.fecha = new Date(data.fecha);
  }
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

export const updateHistorial = async (id: number, data: Partial<HistorialSaludInput>): Promise<HistorialSalud | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw Object.assign(new Error('ID de historial inválido'), { status: 400, isOperational: true });
  }
  if (data.fecha && typeof data.fecha === 'string') {
    data.fecha = new Date(data.fecha);
  }
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
  if (isNaN(id) || id === undefined || id === null) {
    throw Object.assign(new Error('ID de historial inválido'), { status: 400, isOperational: true });
  }
  try {
    const deleted = await prisma.historialSalud.delete({ where: { id } });
    return !!deleted;
  } catch (error) {
    throw Object.assign(new Error('No se pudo eliminar el registro de salud'), { status: 404, isOperational: true });
  }
};
