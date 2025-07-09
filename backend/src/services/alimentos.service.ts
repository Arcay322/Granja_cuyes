import { PrismaClient, Alimento } from '@prisma/client';
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
    throw new Error('ID de alimento inválido');
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

export const createAlimento = async (data: any): Promise<Alimento> => {
  // Para simplificar la demo, asignamos un proveedor por defecto (ID 1)
  // En un sistema completo, esto vendría del frontend
  if (!data.proveedorId) {
    data.proveedorId = 1;
  }
  
  // Convertir valores numéricos si vienen como strings
  if (data.stock && typeof data.stock === 'string') {
    data.stock = Number(data.stock);
  }
  
  if (data.costoUnitario && typeof data.costoUnitario === 'string') {
    data.costoUnitario = Number(data.costoUnitario);
  }
  
  // Verificar si existe el proveedor o crearlo
  try {
    await prisma.proveedor.findUnique({
      where: { id: data.proveedorId }
    });
  } catch (error) {
    // Si no existe, crear un proveedor genérico
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

export const updateAlimento = async (id: number, data: any): Promise<Alimento | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de alimento inválido');
  }
  
  // Convertir valores numéricos si vienen como strings
  if (data.stock && typeof data.stock === 'string') {
    data.stock = Number(data.stock);
  }
  
  if (data.costoUnitario && typeof data.costoUnitario === 'string') {
    data.costoUnitario = Number(data.costoUnitario);
  }
  
  // Eliminar proveedorId si existe en data para evitar errores de relación
  if (data.proveedorId !== undefined) {
    delete data.proveedorId;
  }
  
  return prisma.alimento.update({ 
    where: { 
      id: Number(id) 
    }, 
    data,
    include: {
      proveedor: true
    }
  });
};

export const deleteAlimento = async (id: number): Promise<boolean> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de alimento inválido');
  }
  
  try {
    const deleted = await prisma.alimento.delete({ 
      where: { 
        id: Number(id) 
      } 
    });
    return !!deleted;
  } catch (error) {
    console.error('Error al eliminar alimento:', error);
    return false;
  }
};
