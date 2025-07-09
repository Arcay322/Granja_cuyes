import { PrismaClient, Cliente } from '@prisma/client';
const prisma = new PrismaClient();

export const getAllClientes = async (): Promise<Cliente[]> => {
  return prisma.cliente.findMany();
};

export const getClienteById = async (id: number): Promise<Cliente | null> => {
  return prisma.cliente.findUnique({ where: { id } });
};

export const createCliente = async (data: any): Promise<Cliente> => {
  return prisma.cliente.create({ data });
};

export const updateCliente = async (id: number, data: any): Promise<Cliente | null> => {
  return prisma.cliente.update({ where: { id }, data });
};

export const deleteCliente = async (id: number): Promise<boolean> => {
  try {
    const deleted = await prisma.cliente.delete({ where: { id } });
    return !!deleted;
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    return false;
  }
};
