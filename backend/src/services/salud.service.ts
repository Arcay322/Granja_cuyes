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

interface CreateRegistroSaludData {
  cuyId: number | string;
  tipo: string;
  fecha: string | Date;
  descripcion: string;
  veterinario: string;
  medicamento?: string;
  dosis?: string;
  duracion?: string;
  tratamiento?: string;
}

export const createRegistroSalud = async (data: CreateRegistroSaludData): Promise<HistorialSalud> => {
  // Sanitizar datos
  const sanitizedData = {
    cuyId: typeof data.cuyId === 'string' ? Number(data.cuyId) : data.cuyId,
    tipo: data.tipo,
    fecha: typeof data.fecha === 'string' ? new Date(data.fecha) : data.fecha,
    descripcion: data.descripcion,
    veterinario: data.veterinario,
    medicamento: data.medicamento,
    dosis: data.dosis,
    duracion: data.duracion,
    tratamiento: data.tratamiento
  };

  return prisma.historialSalud.create({
    data: sanitizedData,
    include: {
      cuy: true
    }
  });
};

export const updateRegistroSalud = async (id: number, data: Partial<CreateRegistroSaludData>): Promise<HistorialSalud | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de registro inválido');
  }

  // Sanitizar datos
  const sanitizedData: any = {};
  
  if (data.cuyId !== undefined) {
    sanitizedData.cuyId = typeof data.cuyId === 'string' ? Number(data.cuyId) : data.cuyId;
  }
  if (data.tipo !== undefined) sanitizedData.tipo = data.tipo;
  if (data.fecha !== undefined) {
    sanitizedData.fecha = typeof data.fecha === 'string' ? new Date(data.fecha) : data.fecha;
  }
  if (data.descripcion !== undefined) sanitizedData.descripcion = data.descripcion;
  if (data.veterinario !== undefined) sanitizedData.veterinario = data.veterinario;
  if (data.medicamento !== undefined) sanitizedData.medicamento = data.medicamento;
  if (data.dosis !== undefined) sanitizedData.dosis = data.dosis;
  if (data.duracion !== undefined) sanitizedData.duracion = data.duracion;
  if (data.tratamiento !== undefined) sanitizedData.tratamiento = data.tratamiento;

  return prisma.historialSalud.update({
    where: {
      id: Number(id)
    },
    data: sanitizedData,
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
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al eliminar registro de salud:', error);
    }
    return false;
  }
};
