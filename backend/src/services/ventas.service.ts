import { PrismaClient, Venta } from '@prisma/client';
const prisma = new PrismaClient();

export const getAllVentas = async (): Promise<Venta[]> => {
  return prisma.venta.findMany({
    include: {
      cliente: true,
      detalles: {
        include: {
          cuy: true
        }
      }
    }
  });
};

export const getVentaById = async (id: number): Promise<Venta | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de venta inválido');
  }
  return prisma.venta.findUnique({
    where: {
      id: Number(id)
    },
    include: {
      cliente: true,
      detalles: {
        include: {
          cuy: true
        }
      }
    }
  });
};

export const createVenta = async (data: any): Promise<Venta> => {
  // Formatear la fecha si viene en formato string
  if (data.fecha && typeof data.fecha === 'string') {
    data.fecha = new Date(data.fecha);
  }

  // Convertir el ID del cliente a número
  if (data.clienteId && typeof data.clienteId === 'string') {
    data.clienteId = Number(data.clienteId);
  }

  // Convertir el total a número
  if (data.total && typeof data.total === 'string') {
    data.total = Number(data.total);
  }

  // Verificar si existe el cliente o crearlo
  try {
    await prisma.cliente.findUnique({
      where: { id: data.clienteId }
    });
  } catch (error) {
    // Si no existe, crear un cliente genérico
    await prisma.cliente.create({
      data: {
        id: data.clienteId,
        nombre: 'Cliente General',
        contacto: 'Sin datos',
        direccion: 'Sin dirección'
      }
    });
  }

  return prisma.venta.create({
    data,
    include: {
      cliente: true
    }
  });
};

export const updateVenta = async (id: number, data: any): Promise<Venta | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de venta inválido');
  }

  // Formatear la fecha si viene en formato string
  if (data.fecha && typeof data.fecha === 'string') {
    data.fecha = new Date(data.fecha);
  }

  // Convertir el ID del cliente a número
  if (data.clienteId && typeof data.clienteId === 'string') {
    data.clienteId = Number(data.clienteId);
  }

  // Convertir el total a número
  if (data.total && typeof data.total === 'string') {
    data.total = Number(data.total);
  }

  return prisma.venta.update({
    where: {
      id: Number(id)
    },
    data,
    include: {
      cliente: true
    }
  });
};

export const deleteVenta = async (id: number): Promise<boolean> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de venta inválido');
  }

  try {
    // Primero eliminamos los detalles de la venta
    await prisma.ventaDetalle.deleteMany({
      where: {
        ventaId: Number(id)
      }
    });

    // Luego eliminamos la venta
    const deleted = await prisma.venta.delete({
      where: {
        id: Number(id)
      }
    });
    return !!deleted;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al eliminar venta:', error);
    }
    return false;
  }
};
