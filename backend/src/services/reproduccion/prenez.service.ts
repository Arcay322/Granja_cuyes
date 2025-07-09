import { PrismaClient, Prenez } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener todas las preñeces
export const getAll = async (): Promise<Prenez[]> => {
  return prisma.prenez.findMany({
    orderBy: {
      fechaPrenez: 'desc'
    }
  });
};

// Obtener preñeces activas (sin camada asociada)
export const getActivas = async (): Promise<Prenez[]> => {
  return prisma.prenez.findMany({
    where: {
      estado: 'activa'
    },
    orderBy: {
      fechaProbableParto: 'asc'
    }
  });
};

// Obtener preñez por ID
export const getById = async (id: number): Promise<Prenez | null> => {
  return prisma.prenez.findUnique({
    where: { id }
  });
};

// Crear nueva preñez
export const create = async (data: Omit<Prenez, 'id'>): Promise<Prenez> => {
  return prisma.prenez.create({
    data
  });
};

// Actualizar preñez
export const update = async (id: number, data: Partial<Prenez>): Promise<Prenez> => {
  return prisma.prenez.update({
    where: { id },
    data
  });
};

// Eliminar preñez
export const remove = async (id: number): Promise<Prenez> => {
  return prisma.prenez.delete({
    where: { id }
  });
};

// Marcar preñez como completada y asociar a una camada
export const completarPrenez = async (id: number, camadaId: number): Promise<Prenez> => {
  return prisma.prenez.update({
    where: { id },
    data: {
      estado: 'completada',
      fechaCompletada: new Date(),
      camada: {
        connect: { id: camadaId }
      }
    }
  });
};

// Marcar preñez como fallida
export const marcarComoFallida = async (id: number): Promise<Prenez> => {
  return prisma.prenez.update({
    where: { id },
    data: {
      estado: 'fallida',
      fechaCompletada: new Date()
    }
  });
};

// Obtener próximos partos (preñeces activas con fecha de parto en los próximos días)
export const getProximosPartos = async (diasProximidad: number): Promise<Prenez[]> => {
  const hoy = new Date();
  const limiteFecha = new Date();
  limiteFecha.setDate(hoy.getDate() + diasProximidad);
  
  return prisma.prenez.findMany({
    where: {
      estado: 'activa',
      fechaProbableParto: {
        gte: hoy,
        lte: limiteFecha
      }
    },
    orderBy: {
      fechaProbableParto: 'asc'
    }
  });
};
