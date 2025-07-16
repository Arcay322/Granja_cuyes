import { PrismaClient, Venta } from '@prisma/client';
import { VentaInput } from '../../types/venta.types';
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
    throw Object.assign(new Error('ID de venta inválido'), { status: 400, isOperational: true });
  }
  return prisma.venta.findUnique({ 
    where: { id },
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

export const createVenta = async (data: VentaInput): Promise<Venta> => {
  // Separar los detalles del resto de los datos
  const { detalles, ...ventaData } = data;
  
  const sanitizedData = {
    ...ventaData,
    fecha: ventaData.fecha ? new Date(ventaData.fecha) : new Date(),
    clienteId: typeof ventaData.clienteId === 'string' ? parseInt(ventaData.clienteId as any) : ventaData.clienteId,
    total: typeof ventaData.total === 'string' ? parseFloat(ventaData.total as any) : ventaData.total,
    estadoPago: ventaData.estadoPago || 'Pendiente'
  };

  // Crear la venta con sus detalles en una transacción
  return prisma.$transaction(async (tx) => {
    // Crear la venta
    const venta = await tx.venta.create({ 
      data: sanitizedData,
      include: {
        cliente: true,
        detalles: {
          include: {
            cuy: true
          }
        }
      }
    });

    // Si se proporcionaron detalles de cuyes, crearlos
    if (detalles && detalles.length > 0) {
      for (const detalle of detalles) {
        // Crear el detalle de venta
        await tx.ventaDetalle.create({
          data: {
            ventaId: venta.id,
            cuyId: detalle.cuyId,
            peso: detalle.peso,
            precioUnitario: detalle.precioUnitario
          }
        });

        // Actualizar el estado del cuy a "Vendido" y registrar la fecha de venta
        await tx.cuy.update({
          where: { id: detalle.cuyId },
          data: {
            estado: 'Vendido',
            fechaVenta: venta.fecha
          }
        });
      }
    }

    // Obtener la venta completa con los detalles creados
    const ventaCompleta = await tx.venta.findUnique({
      where: { id: venta.id },
      include: {
        cliente: true,
        detalles: {
          include: {
            cuy: true
          }
        }
      }
    });

    return ventaCompleta!;
  });
};

export const updateVenta = async (id: number, data: Partial<VentaInput>): Promise<Venta | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw Object.assign(new Error('ID de venta inválido'), { status: 400, isOperational: true });
  }
  
  // Separar los detalles del resto de los datos para la actualización
  const { detalles, ...ventaData } = data;
  
  const sanitizedData = {
    ...ventaData,
    fecha: ventaData.fecha ? new Date(ventaData.fecha) : undefined,
    clienteId: typeof ventaData.clienteId === 'string' ? parseInt(ventaData.clienteId as any) : ventaData.clienteId,
    total: typeof ventaData.total === 'string' ? parseFloat(ventaData.total as any) : ventaData.total,
    estadoPago: ventaData.estadoPago
  };
  
  // Filtrar campos undefined
  const filteredData = Object.fromEntries(
    Object.entries(sanitizedData).filter(([_, value]) => value !== undefined)
  );
  
  return prisma.venta.update({ 
    where: { id }, 
    data: filteredData,
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

export const deleteVenta = async (id: number): Promise<boolean> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw Object.assign(new Error('ID de venta inválido'), { status: 400, isOperational: true });
  }
  try {
    const deleted = await prisma.venta.delete({ where: { id } });
    return !!deleted;
  } catch (error) {
    throw Object.assign(new Error('No se pudo eliminar la venta'), { status: 404, isOperational: true });
  }
};
