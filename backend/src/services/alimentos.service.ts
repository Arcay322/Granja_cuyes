import { PrismaClient, Alimento } from '@prisma/client';
import { AlimentoInput } from '../types/alimento.types';
const prisma = new PrismaClient();

export const getAllAlimentos = async (): Promise<Alimento[]> => {
  return prisma.alimento.findMany({
    include: {
      proveedor: true
    }
  });
};

export const getAlimentoById = async (id: number): Promise<Alimento | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw Object.assign(new Error('ID de alimento inválido'), { status: 400, isOperational: true });
  }
  return prisma.alimento.findUnique({
    where: {
      id: Number(id)
    },
    include: {
      proveedor: true
    }
  });
};

export const createAlimento = async (data: AlimentoInput): Promise<Alimento> => {
  // Para simplificar la demo, asignamos un proveedor por defecto (ID 1)
  if (!data.proveedorId) {
    data.proveedorId = 1;
  }
  // Conversión de tipos
  data.stock = Number(data.stock);
  data.costoUnitario = Number(data.costoUnitario);

  // Verificar si existe el proveedor o crearlo
  const proveedor = await prisma.proveedor.findUnique({ where: { id: data.proveedorId } });
  if (!proveedor) {
    await prisma.proveedor.create({
      data: {
        id: 1,
        nombre: 'Proveedor General',
        contacto: 'Sin datos'
      }
    });
  }

  return prisma.alimento.create({
    data,
    include: {
      proveedor: true
    }
  });
};

export const updateAlimento = async (id: number, data: Partial<AlimentoInput>): Promise<Alimento | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw Object.assign(new Error('ID de alimento inválido'), { status: 400, isOperational: true });
  }
  // Conversión de tipos
  if (data.stock !== undefined) data.stock = Number(data.stock);
  if (data.costoUnitario !== undefined) data.costoUnitario = Number(data.costoUnitario);
  // Eliminar proveedorId si existe en data para evitar errores de relación
  if (data.proveedorId !== undefined) {
    delete data.proveedorId;
  }
  return prisma.alimento.update({
    where: { id: Number(id) },
    data,
    include: { proveedor: true }
  });
};

export const deleteAlimento = async (id: number): Promise<boolean> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw Object.assign(new Error('ID de alimento inválido'), { status: 400, isOperational: true });
  }
  try {
    const deleted = await prisma.alimento.delete({ where: { id: Number(id) } });
    return !!deleted;
  } catch (error) {
    throw Object.assign(new Error('No se pudo eliminar el alimento'), { status: 404, isOperational: true });
  }
};
