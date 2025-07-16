import { PrismaClient, ConsumoAlimento } from '@prisma/client';

const prisma = new PrismaClient();

export interface ConsumoAlimentoInput {
  galpon: string;
  fecha: Date | string;
  alimentoId: number;
  cantidad: number;
}

export const getAllConsumos = async (): Promise<ConsumoAlimento[]> => {
  return prisma.consumoAlimento.findMany({
    include: {
      alimento: true
    },
    orderBy: [
      { fecha: 'desc' },
      { galpon: 'asc' }
    ]
  });
};

export const getConsumoById = async (id: number): Promise<ConsumoAlimento | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de consumo inválido');
  }
  return prisma.consumoAlimento.findUnique({
    where: { id },
    include: {
      alimento: true
    }
  });
};

export const createConsumo = async (data: ConsumoAlimentoInput): Promise<ConsumoAlimento> => {
  const sanitizedData = {
    ...data,
    fecha: data.fecha ? new Date(data.fecha) : new Date(),
    cantidad: typeof data.cantidad === 'string' ? parseFloat(data.cantidad as any) : data.cantidad,
    alimentoId: typeof data.alimentoId === 'string' ? parseInt(data.alimentoId as any) : data.alimentoId
  };

  // Usar transacción para crear el consumo y actualizar el stock
  return prisma.$transaction(async (tx) => {
    // Verificar que el alimento existe y tiene suficiente stock
    const alimento = await tx.alimento.findUnique({
      where: { id: sanitizedData.alimentoId }
    });

    if (!alimento) {
      throw new Error('El alimento especificado no existe');
    }

    if (alimento.stock < sanitizedData.cantidad) {
      throw new Error(`Stock insuficiente. Disponible: ${alimento.stock} ${alimento.unidad}, Solicitado: ${sanitizedData.cantidad} ${alimento.unidad}`);
    }

    // Crear el registro de consumo
    const consumo = await tx.consumoAlimento.create({
      data: sanitizedData,
      include: {
        alimento: true
      }
    });

    // Actualizar el stock del alimento
    await tx.alimento.update({
      where: { id: sanitizedData.alimentoId },
      data: {
        stock: {
          decrement: sanitizedData.cantidad
        }
      }
    });

    return consumo;
  });
};

export const updateConsumo = async (id: number, data: Partial<ConsumoAlimentoInput>): Promise<ConsumoAlimento | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de consumo inválido');
  }

  // Obtener el consumo original para revertir el stock
  const consumoOriginal = await prisma.consumoAlimento.findUnique({
    where: { id },
    include: { alimento: true }
  });

  if (!consumoOriginal) {
    throw new Error('Consumo no encontrado');
  }

  const sanitizedData = {
    ...data,
    fecha: data.fecha ? new Date(data.fecha) : undefined,
    cantidad: typeof data.cantidad === 'string' ? parseFloat(data.cantidad as any) : data.cantidad,
    alimentoId: typeof data.alimentoId === 'string' ? parseInt(data.alimentoId as any) : data.alimentoId
  };

  // Filtrar campos undefined
  const filteredData = Object.fromEntries(
    Object.entries(sanitizedData).filter(([_, value]) => value !== undefined)
  );

  return prisma.$transaction(async (tx) => {
    // Revertir el stock original
    await tx.alimento.update({
      where: { id: consumoOriginal.alimentoId },
      data: {
        stock: {
          increment: consumoOriginal.cantidad
        }
      }
    });

    // Actualizar el consumo
    const consumoActualizado = await tx.consumoAlimento.update({
      where: { id },
      data: filteredData,
      include: {
        alimento: true
      }
    });

    // Aplicar el nuevo stock
    const nuevoAlimentoId = consumoActualizado.alimentoId;
    const nuevaCantidad = consumoActualizado.cantidad;

    // Verificar stock disponible
    const alimento = await tx.alimento.findUnique({
      where: { id: nuevoAlimentoId }
    });

    if (!alimento) {
      throw new Error('El alimento especificado no existe');
    }

    if (alimento.stock < nuevaCantidad) {
      throw new Error(`Stock insuficiente. Disponible: ${alimento.stock} ${alimento.unidad}, Solicitado: ${nuevaCantidad} ${alimento.unidad}`);
    }

    // Descontar el nuevo stock
    await tx.alimento.update({
      where: { id: nuevoAlimentoId },
      data: {
        stock: {
          decrement: nuevaCantidad
        }
      }
    });

    return consumoActualizado;
  });
};

export const deleteConsumo = async (id: number): Promise<boolean> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de consumo inválido');
  }

  try {
    // Obtener el consumo para revertir el stock
    const consumo = await prisma.consumoAlimento.findUnique({
      where: { id },
      include: { alimento: true }
    });

    if (!consumo) {
      throw new Error('Consumo no encontrado');
    }

    return prisma.$transaction(async (tx) => {
      // Revertir el stock
      await tx.alimento.update({
        where: { id: consumo.alimentoId },
        data: {
          stock: {
            increment: consumo.cantidad
          }
        }
      });

      // Eliminar el consumo
      const deleted = await tx.consumoAlimento.delete({
        where: { id }
      });

      return !!deleted;
    });
  } catch (error: any) {
    console.error('Error al eliminar consumo:', error);
    throw error;
  }
};

// Función para obtener consumos por galpón y período
export const getConsumosPorGalpon = async (galpon: string, fechaInicio?: Date, fechaFin?: Date) => {
  const whereClause: any = { galpon };

  if (fechaInicio || fechaFin) {
    whereClause.fecha = {};
    if (fechaInicio) whereClause.fecha.gte = fechaInicio;
    if (fechaFin) whereClause.fecha.lte = fechaFin;
  }

  return prisma.consumoAlimento.findMany({
    where: whereClause,
    include: {
      alimento: true
    },
    orderBy: { fecha: 'desc' }
  });
};

// Función para obtener estadísticas de consumo
export const getEstadisticasConsumo = async (fechaInicio?: Date, fechaFin?: Date) => {
  const whereClause: any = {};

  if (fechaInicio || fechaFin) {
    whereClause.fecha = {};
    if (fechaInicio) whereClause.fecha.gte = fechaInicio;
    if (fechaFin) whereClause.fecha.lte = fechaFin;
  }

  const consumos = await prisma.consumoAlimento.findMany({
    where: whereClause,
    include: {
      alimento: true
    }
  });

  // Calcular estadísticas
  const totalConsumos = consumos.length;
  const consumoPorGalpon = consumos.reduce((acc, consumo) => {
    if (!acc[consumo.galpon]) {
      acc[consumo.galpon] = { cantidad: 0, costo: 0 };
    }
    acc[consumo.galpon].cantidad += consumo.cantidad;
    acc[consumo.galpon].costo += consumo.cantidad * consumo.alimento.costoUnitario;
    return acc;
  }, {} as Record<string, { cantidad: number; costo: number }>);

  const consumoPorAlimento = consumos.reduce((acc, consumo) => {
    const key = consumo.alimento.nombre;
    if (!acc[key]) {
      acc[key] = { cantidad: 0, costo: 0, unidad: consumo.alimento.unidad };
    }
    acc[key].cantidad += consumo.cantidad;
    acc[key].costo += consumo.cantidad * consumo.alimento.costoUnitario;
    return acc;
  }, {} as Record<string, { cantidad: number; costo: number; unidad: string }>);

  const costoTotal = consumos.reduce((total, consumo) => 
    total + (consumo.cantidad * consumo.alimento.costoUnitario), 0
  );

  return {
    totalConsumos,
    costoTotal,
    consumoPorGalpon,
    consumoPorAlimento
  };
};