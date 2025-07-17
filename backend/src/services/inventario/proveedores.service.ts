import { PrismaClient, Proveedor } from '@prisma/client';
const prisma = new PrismaClient();

export const getAllProveedores = async (): Promise<Proveedor[]> => {
  return prisma.proveedor.findMany();
};

export const getProveedorById = async (id: number): Promise<Proveedor | null> => {
  return prisma.proveedor.findUnique({ where: { id } });
};

interface CreateProveedorData {
  nombre: string;
  contacto: string;
  telefono?: string;
  direccion?: string;
}

export const createProveedor = async (data: CreateProveedorData): Promise<Proveedor> => {
  return prisma.proveedor.create({ data });
};

export const updateProveedor = async (id: number, data: Partial<CreateProveedorData>): Promise<Proveedor | null> => {
  return prisma.proveedor.update({ where: { id }, data });
};

export const deleteProveedor = async (id: number): Promise<boolean> => {
  try {
    const deleted = await prisma.proveedor.delete({ where: { id } });
    return !!deleted;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al eliminar proveedor:', error);
    }
    return false;
  }
};
