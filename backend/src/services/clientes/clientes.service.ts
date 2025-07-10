import { PrismaClient, Cliente } from '@prisma/client';
import { ClienteInput } from '../../types/cliente.types';
const prisma = new PrismaClient();

export const getAllClientes = async (): Promise<Cliente[]> => {
  return prisma.cliente.findMany();
};

export const getClienteById = async (id: number): Promise<Cliente | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw Object.assign(new Error('ID de cliente inválido'), { status: 400, isOperational: true });
  }
  return prisma.cliente.findUnique({ where: { id } });
};

export const createCliente = async (data: ClienteInput): Promise<Cliente> => {
  return prisma.cliente.create({ data });
};

export const updateCliente = async (id: number, data: Partial<ClienteInput>): Promise<Cliente | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw Object.assign(new Error('ID de cliente inválido'), { status: 400, isOperational: true });
  }
  return prisma.cliente.update({ where: { id }, data });
};

export const deleteCliente = async (id: number): Promise<boolean> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw Object.assign(new Error('ID de cliente inválido'), { status: 400, isOperational: true });
  }
  try {
    const deleted = await prisma.cliente.delete({ where: { id } });
    return !!deleted;
  } catch (error) {
    throw Object.assign(new Error('No se pudo eliminar el cliente'), { status: 404, isOperational: true });
  }
};
