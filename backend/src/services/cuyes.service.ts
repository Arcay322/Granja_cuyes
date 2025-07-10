import { PrismaClient, Cuy } from '@prisma/client';
import { CuyInput } from '../types/cuy.types';

const prisma = new PrismaClient();

export const getAllCuyesService = async (): Promise<Cuy[]> => {
  return prisma.cuy.findMany();
};

export const getCuyByIdService = async (id: number): Promise<Cuy | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw Object.assign(new Error('ID de cuy inválido'), { status: 400, isOperational: true });
  }
  return prisma.cuy.findUnique({ where: { id } });
};

export const createCuyService = async (data: CuyInput): Promise<Cuy> => {
  // Asegurarse de que las fechas estén en formato correcto y que todos los campos requeridos estén presentes
  const formattedData = {
    ...data,
    ...(data.fechaNacimiento && {
      fechaNacimiento: new Date(data.fechaNacimiento)
    })
  };
  // Validar y forzar campos obligatorios
  const requiredFields = ['raza', 'sexo', 'galpon', 'jaula', 'estado'];
  for (const field of requiredFields) {
    if (!(field in formattedData)) {
      throw new Error(`Falta el campo obligatorio: ${field}`);
    }
  }
  return prisma.cuy.create({ data: formattedData as any });
};

export const updateCuyService = async (id: number, data: Partial<CuyInput>): Promise<Cuy> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw Object.assign(new Error('ID de cuy inválido'), { status: 400, isOperational: true });
  }
  const formattedData = {
    ...data,
    ...(data.fechaNacimiento && {
      fechaNacimiento: new Date(data.fechaNacimiento)
    })
  };
  return prisma.cuy.update({ where: { id }, data: formattedData });
};

export const deleteCuyService = async (id: number): Promise<void> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw Object.assign(new Error('ID de cuy inválido'), { status: 400, isOperational: true });
  }
  await prisma.cuy.delete({ where: { id } });
};
