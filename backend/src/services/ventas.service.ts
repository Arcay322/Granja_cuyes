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

interface CreateVentaData {
  fecha: string | Date;
  clienteId: number | string;
  total: number | string;
  estadoPago: string;
  detalles?: Array<{
    cuyId: number;
    peso: number;
    precioUnitario: number;
  }>;
}

export const createVenta = async (data: CreateVentaData): Promise<Venta> => {
  // Sanitizar datos
  const clienteId = typeof data.clienteId === 'string' ? Number(data.clienteId) : data.clienteId;
  const sanitizedData = {
    fecha: typeof data.fecha === 'string' ? new Date(data.fecha) : data.fecha,
    clienteId: clienteId,
    total: typeof data.total === 'string' ? Number(data.total) : data.total,
    estadoPago: data.estadoPago
  };

  // Verificar si existe el cliente o crearlo
  try {
    await prisma.cliente.findUnique({
      where: { id: clienteId }
    });
  } catch (error) {
    // Si no existe, crear un cliente genérico
    await prisma.cliente.create({
      data: {
        id: clienteId,
        nombre: 'Cliente General',
        contacto: 'Sin datos',
        direccion: 'Sin dirección'
      }
    });
  }

  return prisma.venta.create({
    data: sanitizedData,
    include: {
      cliente: true
    }
  });
};

export const updateVenta = async (id: number, data: Partial<CreateVentaData>): Promise<Venta | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de venta inválido');
  }

  // Sanitizar datos
  const sanitizedData: any = {};
  
  if (data.fecha !== undefined) {
    sanitizedData.fecha = typeof data.fecha === 'string' ? new Date(data.fecha) : data.fecha;
  }
  if (data.clienteId !== undefined) {
    sanitizedData.clienteId = typeof data.clienteId === 'string' ? Number(data.clienteId) : data.clienteId;
  }
  if (data.total !== undefined) {
    sanitizedData.total = typeof data.total === 'string' ? Number(data.total) : data.total;
  }
  if (data.estadoPago !== undefined) {
    sanitizedData.estadoPago = data.estadoPago;
  }

  return prisma.venta.update({
    where: {
      id: Number(id)
    },
    data: sanitizedData,
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
