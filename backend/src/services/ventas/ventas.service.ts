import { PrismaClient, Venta } from '@prisma/client';
import { VentaInput } from '../../types/venta.types';
const prisma = new PrismaClient();

export const getAllVentas = async (): Promise<Venta[]> => {
  return prisma.venta.findMany({
    include: {
      cliente: true
    }
  });
};

export const getVentaById = async (id: number): Promise<Venta | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw Object.assign(new Error('ID de venta inválido'), { status: 400, isOperational: true });
  }
  return prisma.venta.findUnique({ 
    where: { id },
    include: {
      cliente: true
    }
  });
};

export const createVenta = async (data: VentaInput): Promise<Venta> => {
  const sanitizedData = {
    ...data,
    fecha: data.fecha ? new Date(data.fecha) : new Date(),
    clienteId: typeof data.clienteId === 'string' ? parseInt(data.clienteId as any) : data.clienteId,
    total: typeof data.total === 'string' ? parseFloat(data.total as any) : data.total,
    estadoPago: data.estadoPago || 'Pendiente'
  };
  return prisma.venta.create({ data: sanitizedData });
};

export const updateVenta = async (id: number, data: Partial<VentaInput>): Promise<Venta | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw Object.assign(new Error('ID de venta inválido'), { status: 400, isOperational: true });
  }
  const sanitizedData = {
    ...data,
    fecha: data.fecha ? new Date(data.fecha) : undefined,
    clienteId: typeof data.clienteId === 'string' ? parseInt(data.clienteId as any) : data.clienteId,
    total: typeof data.total === 'string' ? parseFloat(data.total as any) : data.total,
    estadoPago: data.estadoPago || 'Pendiente'
  };
  return prisma.venta.update({ where: { id }, data: sanitizedData });
};

export const deleteVenta = async (id: number): Promise<boolean> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw Object.assign(new Error('ID de venta inválido'), { status: 400, isOperational: true });
  }
  try {
    const deleted = await prisma.venta.delete({ where: { id } });
    return !!deleted;
  } catch (error) {
    throw Object.assign(new Error('No se pudo eliminar la venta'), { status: 404, isOperational: true });
  }
};
