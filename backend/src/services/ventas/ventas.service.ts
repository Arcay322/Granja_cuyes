import { PrismaClient, Venta } from '@prisma/client';
const prisma = new PrismaClient();

export const getAllVentas = async (): Promise<Venta[]> => {
  return prisma.venta.findMany({
    include: {
      cliente: true
    }
  });
};

export const getVentaById = async (id: number): Promise<Venta | null> => {
  return prisma.venta.findUnique({ 
    where: { id },
    include: {
      cliente: true
    }
  });
};

export const createVenta = async (data: any): Promise<Venta> => {
  // Sanitize data - convert string to correct types
  const sanitizedData = {
    ...data,
    fecha: data.fecha ? new Date(data.fecha) : new Date(),
    clienteId: typeof data.clienteId === 'string' ? parseInt(data.clienteId) : data.clienteId,
    total: typeof data.total === 'string' ? parseFloat(data.total) : data.total,
    estadoPago: data.estadoPago || 'Pendiente' // Provide default value if not provided
  };

  return prisma.venta.create({ data: sanitizedData });
};

export const updateVenta = async (id: number, data: any): Promise<Venta | null> => {
  // Sanitize data - convert string to correct types
  const sanitizedData = {
    ...data,
    fecha: data.fecha ? new Date(data.fecha) : undefined,
    clienteId: typeof data.clienteId === 'string' ? parseInt(data.clienteId) : data.clienteId,
    total: typeof data.total === 'string' ? parseFloat(data.total) : data.total,
    estadoPago: data.estadoPago || 'Pendiente' // Provide default value if not provided
  };

  return prisma.venta.update({ where: { id }, data: sanitizedData });
};

export const deleteVenta = async (id: number): Promise<boolean> => {
  const deleted = await prisma.venta.delete({ where: { id } });
  return !!deleted;
};
