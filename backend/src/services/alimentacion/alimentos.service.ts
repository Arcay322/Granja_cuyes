import { PrismaClient, Alimento } from '@prisma/client';
const prisma = new PrismaClient();

export const getAllAlimentos = async (): Promise<Alimento[]> => {
  return prisma.alimento.findMany();
};

export const getAlimentoById = async (id: number): Promise<Alimento | null> => {
  return prisma.alimento.findUnique({ where: { id } });
};

export const createAlimento = async (data: any): Promise<Alimento> => {
  // Check if data has numeric fields and convert them
  let proveedorId = data.proveedorId ? parseInt(data.proveedorId) : undefined;
  
  // Si no se proporciona un ID de proveedor o si el proveedor no existe, crear uno por defecto
  if (!proveedorId) {
    // Primero verificamos si existe algún proveedor
    const proveedores = await prisma.proveedor.findMany({
      take: 1,
    });
    
    if (proveedores.length > 0) {
      // Usar el primer proveedor disponible
      proveedorId = proveedores[0].id;
    } else {
      // Crear un proveedor por defecto si no existe ninguno
      const nuevoProveedor = await prisma.proveedor.create({
        data: {
          nombre: 'Proveedor por Defecto',
          contacto: 'Sin contacto',
        },
      });
      proveedorId = nuevoProveedor.id;
    }
  } else {
    // Verificar si el proveedor existe
    const proveedorExiste = await prisma.proveedor.findUnique({
      where: { id: proveedorId },
    });
    
    if (!proveedorExiste) {
      throw new Error(`El proveedor con ID ${proveedorId} no existe`);
    }
  }
  
  const sanitizedData = {
    ...data,
    stock: typeof data.stock === 'string' ? parseFloat(data.stock) : data.stock,
    costoUnitario: typeof data.costoUnitario === 'string' ? parseFloat(data.costoUnitario) : data.costoUnitario,
    proveedorId,
  };

  return prisma.alimento.create({ data: sanitizedData });
};

export const updateAlimento = async (id: number, data: any): Promise<Alimento | null> => {
  // Check if data has numeric fields and convert them
  const sanitizedData: any = {
    ...data,
    stock: typeof data.stock === 'string' ? parseFloat(data.stock) : data.stock,
    costoUnitario: typeof data.costoUnitario === 'string' ? parseFloat(data.costoUnitario) : data.costoUnitario,
  };
  
  // Si se proporciona un proveedorId, verificar que exista
  if (data.proveedorId) {
    const proveedorId = parseInt(data.proveedorId);
    const proveedorExiste = await prisma.proveedor.findUnique({
      where: { id: proveedorId },
    });
    
    if (!proveedorExiste) {
      throw new Error(`El proveedor con ID ${proveedorId} no existe`);
    }
    
    sanitizedData.proveedorId = proveedorId;
  }

  return prisma.alimento.update({ where: { id }, data: sanitizedData });
};

export const deleteAlimento = async (id: number): Promise<boolean> => {
  const deleted = await prisma.alimento.delete({ where: { id } });
  return !!deleted;
};
