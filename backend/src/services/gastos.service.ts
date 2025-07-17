import { PrismaClient, Gasto } from '@prisma/client';
const prisma = new PrismaClient();

export const getAllGastos = async (
  skip: number = 0,
  take: number = 20,
  select: Partial<Record<keyof Gasto, boolean>> = { id: true, concepto: true, monto: true, fecha: true, categoria: true }
): Promise<Gasto[]> => {
  return prisma.gasto.findMany({
    skip,
    take,
    select
  });
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

interface CreateGastoData {
  concepto: string;
  fecha: string | Date;
  monto: number | string;
  categoria: string;
}

export const createGasto = async (data: CreateGastoData): Promise<Gasto> => {
  // Sanitizar datos
  const sanitizedData = {
    concepto: data.concepto,
    fecha: typeof data.fecha === 'string' ? new Date(data.fecha) : data.fecha,
    monto: typeof data.monto === 'string' ? Number(data.monto) : data.monto,
    categoria: data.categoria
  };

  return prisma.gasto.create({ data: sanitizedData });
};

export const updateGasto = async (id: number, data: Partial<CreateGastoData>): Promise<Gasto | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de gasto inválido');
  }

  // Sanitizar datos
  const sanitizedData: any = {};
  
  if (data.concepto !== undefined) sanitizedData.concepto = data.concepto;
  if (data.fecha !== undefined) {
    sanitizedData.fecha = typeof data.fecha === 'string' ? new Date(data.fecha) : data.fecha;
  }
  if (data.monto !== undefined) {
    sanitizedData.monto = typeof data.monto === 'string' ? Number(data.monto) : data.monto;
  }
  if (data.categoria !== undefined) sanitizedData.categoria = data.categoria;

  return prisma.gasto.update({
    where: {
      id: Number(id)
    },
    data: sanitizedData
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
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al eliminar gasto:', error);
    }
    return false;
  }
};
