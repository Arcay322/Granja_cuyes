import { PrismaClient, Galpon, Jaula } from '@prisma/client';

const prisma = new PrismaClient();

export interface GalponInput {
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  capacidadMaxima?: number;
  estado?: string;
}

export interface JaulaInput {
  nombre: string;
  galponId: number;
  galponNombre: string;
  descripcion?: string;
  capacidadMaxima?: number;
  tipo?: string;
  estado?: string;
}

// ===== SERVICIOS PARA GALPONES =====

export const getAllGalpones = async (): Promise<Galpon[]> => {
  return prisma.galpon.findMany({
    include: {
      jaulas: true
    },
    orderBy: { nombre: 'asc' }
  });
};

export const getGalponById = async (id: number): Promise<Galpon | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de galpón inválido');
  }
  return prisma.galpon.findUnique({
    where: { id },
    include: {
      jaulas: true
    }
  });
};

export const getGalponByNombre = async (nombre: string): Promise<Galpon | null> => {
  return prisma.galpon.findUnique({
    where: { nombre },
    include: {
      jaulas: true
    }
  });
};

export const createGalpon = async (data: GalponInput): Promise<Galpon> => {
  const sanitizedData = {
    ...data,
    capacidadMaxima: data.capacidadMaxima || 50,
    estado: data.estado || 'Activo'
  };

  return prisma.galpon.create({
    data: sanitizedData,
    include: {
      jaulas: true
    }
  });
};

export const updateGalpon = async (id: number, data: Partial<GalponInput>): Promise<Galpon | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de galpón inválido');
  }

  return prisma.galpon.update({
    where: { id },
    data,
    include: {
      jaulas: true
    }
  });
};

export const deleteGalpon = async (id: number): Promise<boolean> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de galpón inválido');
  }

  try {
    // Verificar si hay cuyes en este galpón
    const cuyesEnGalpon = await prisma.cuy.findMany({
      where: { galpon: { equals: await getGalponNombreById(id) } }
    });

    if (cuyesEnGalpon.length > 0) {
      throw new Error(`No se puede eliminar el galpón porque tiene ${cuyesEnGalpon.length} cuyes asignados`);
    }

    // Eliminar jaulas primero
    await prisma.jaula.deleteMany({
      where: { galponId: id }
    });

    // Eliminar galpón
    const deleted = await prisma.galpon.delete({
      where: { id }
    });

    return !!deleted;
  } catch (error: any) {
    console.error('Error al eliminar galpón:', error);
    throw error;
  }
};

// ===== SERVICIOS PARA JAULAS =====

export const getAllJaulas = async (): Promise<Jaula[]> => {
  return prisma.jaula.findMany({
    include: {
      galpon: true
    },
    orderBy: [
      { galponNombre: 'asc' },
      { nombre: 'asc' }
    ]
  });
};

export const getJaulaById = async (id: number): Promise<Jaula | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de jaula inválido');
  }
  return prisma.jaula.findUnique({
    where: { id },
    include: {
      galpon: true
    }
  });
};

export const getJaulasByGalpon = async (galponNombre: string): Promise<Jaula[]> => {
  return prisma.jaula.findMany({
    where: { galponNombre },
    include: {
      galpon: true
    },
    orderBy: { nombre: 'asc' }
  });
};

export const createJaula = async (data: JaulaInput): Promise<Jaula> => {
  const sanitizedData = {
    ...data,
    capacidadMaxima: data.capacidadMaxima || 10,
    tipo: data.tipo || 'Estándar',
    estado: data.estado || 'Activo'
  };

  return prisma.jaula.create({
    data: sanitizedData,
    include: {
      galpon: true
    }
  });
};

export const updateJaula = async (id: number, data: Partial<JaulaInput>): Promise<Jaula | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de jaula inválido');
  }

  return prisma.jaula.update({
    where: { id },
    data,
    include: {
      galpon: true
    }
  });
};

export const deleteJaula = async (id: number): Promise<boolean> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de jaula inválido');
  }

  try {
    // Verificar si hay cuyes en esta jaula
    const jaula = await prisma.jaula.findUnique({ where: { id } });
    if (!jaula) {
      throw new Error('Jaula no encontrada');
    }

    const cuyesEnJaula = await prisma.cuy.findMany({
      where: { 
        galpon: jaula.galponNombre,
        jaula: jaula.nombre
      }
    });

    if (cuyesEnJaula.length > 0) {
      throw new Error(`No se puede eliminar la jaula porque tiene ${cuyesEnJaula.length} cuyes asignados`);
    }

    const deleted = await prisma.jaula.delete({
      where: { id }
    });

    return !!deleted;
  } catch (error: any) {
    console.error('Error al eliminar jaula:', error);
    throw error;
  }
};

// ===== SERVICIOS DE ESTADÍSTICAS =====

export const getEstadisticasGalpon = async (galponNombre: string) => {
  // Obtener cuyes del galpón
  const cuyes = await prisma.cuy.findMany({
    where: { galpon: galponNombre }
  });

  // Obtener jaulas del galpón
  const jaulas = await prisma.jaula.findMany({
    where: { galponNombre }
  });

  // Calcular estadísticas por jaula
  const estadisticasPorJaula = await Promise.all(
    jaulas.map(async (jaula) => {
      const cuyesJaula = cuyes.filter(cuy => cuy.jaula === jaula.nombre);
      
      const estadisticas = {
        jaula: jaula.nombre,
        capacidadMaxima: jaula.capacidadMaxima,
        ocupacionActual: cuyesJaula.length,
        porcentajeOcupacion: (cuyesJaula.length / jaula.capacidadMaxima) * 100,
        cuyesPorSexo: {
          machos: cuyesJaula.filter(cuy => cuy.sexo === 'Macho').length,
          hembras: cuyesJaula.filter(cuy => cuy.sexo === 'Hembra').length
        },
        cuyesPorEstado: {
          activos: cuyesJaula.filter(cuy => cuy.estado === 'Activo').length,
          vendidos: cuyesJaula.filter(cuy => cuy.estado === 'Vendido').length,
          enfermos: cuyesJaula.filter(cuy => cuy.estado === 'Enfermo').length
        },
        razas: [...new Set(cuyesJaula.map(cuy => cuy.raza))],
        pesoPromedio: cuyesJaula.length > 0 
          ? cuyesJaula.reduce((sum, cuy) => sum + cuy.peso, 0) / cuyesJaula.length 
          : 0,
        tipo: jaula.tipo,
        estado: jaula.estado
      };

      return estadisticas;
    })
  );

  // Estadísticas generales del galpón
  const galpon = await prisma.galpon.findUnique({
    where: { nombre: galponNombre }
  });

  const estadisticasGenerales = {
    nombre: galponNombre,
    descripcion: galpon?.descripcion,
    ubicacion: galpon?.ubicacion,
    capacidadMaxima: galpon?.capacidadMaxima || 0,
    totalJaulas: jaulas.length,
    totalCuyes: cuyes.length,
    porcentajeOcupacion: galpon?.capacidadMaxima 
      ? (cuyes.length / galpon.capacidadMaxima) * 100 
      : 0,
    cuyesPorSexo: {
      machos: cuyes.filter(cuy => cuy.sexo === 'Macho').length,
      hembras: cuyes.filter(cuy => cuy.sexo === 'Hembra').length
    },
    cuyesPorEstado: {
      activos: cuyes.filter(cuy => cuy.estado === 'Activo').length,
      vendidos: cuyes.filter(cuy => cuy.estado === 'Vendido').length,
      enfermos: cuyes.filter(cuy => cuy.estado === 'Enfermo').length
    },
    razasPresentes: [...new Set(cuyes.map(cuy => cuy.raza))],
    pesoPromedio: cuyes.length > 0 
      ? cuyes.reduce((sum, cuy) => sum + cuy.peso, 0) / cuyes.length 
      : 0,
    jaulasConSobrepoblacion: estadisticasPorJaula.filter(j => j.porcentajeOcupacion > 100).length,
    jaulasVacias: estadisticasPorJaula.filter(j => j.ocupacionActual === 0).length
  };

  return {
    general: estadisticasGenerales,
    jaulas: estadisticasPorJaula
  };
};

export const getResumenTodosGalpones = async () => {
  const galpones = await prisma.galpon.findMany({
    include: { jaulas: true }
  });

  const resumen = await Promise.all(
    galpones.map(async (galpon) => {
      const cuyes = await prisma.cuy.findMany({
        where: { galpon: galpon.nombre }
      });

      return {
        id: galpon.id,
        nombre: galpon.nombre,
        descripcion: galpon.descripcion,
        ubicacion: galpon.ubicacion,
        capacidadMaxima: galpon.capacidadMaxima,
        totalJaulas: galpon.jaulas.length,
        totalCuyes: cuyes.length,
        porcentajeOcupacion: (cuyes.length / galpon.capacidadMaxima) * 100,
        estado: galpon.estado,
        alertas: {
          sobrepoblacion: cuyes.length > galpon.capacidadMaxima,
          sinCuyes: cuyes.length === 0,
          cuyesEnfermos: cuyes.filter(cuy => cuy.estado === 'Enfermo').length
        }
      };
    })
  );

  return resumen;
};

// Función auxiliar para obtener nombre de galpón por ID
const getGalponNombreById = async (id: number): Promise<string> => {
  const galpon = await prisma.galpon.findUnique({
    where: { id },
    select: { nombre: true }
  });
  return galpon?.nombre || '';
};

// Función para sugerir ubicación automática
export const sugerirUbicacionCuy = async (sexo: string, proposito: string) => {
  const galpones = await getResumenTodosGalpones();
  
  // Filtrar galpones activos con espacio disponible
  const galponesDisponibles = galpones.filter(g => 
    g.estado === 'Activo' && 
    g.porcentajeOcupacion < 90 && // Dejar 10% de margen
    !g.alertas.sobrepoblacion
  );

  if (galponesDisponibles.length === 0) {
    return null; // No hay espacio disponible
  }

  // Ordenar por menor ocupación
  galponesDisponibles.sort((a, b) => a.porcentajeOcupacion - b.porcentajeOcupacion);

  const galponSugerido = galponesDisponibles[0];
  
  // Buscar jaula disponible en el galpón sugerido
  const jaulasGalpon = await getJaulasByGalpon(galponSugerido.nombre);
  const jaulasDisponibles = [];

  for (const jaula of jaulasGalpon) {
    const cuyesEnJaula = await prisma.cuy.count({
      where: {
        galpon: galponSugerido.nombre,
        jaula: jaula.nombre
      }
    });

    if (cuyesEnJaula < jaula.capacidadMaxima) {
      jaulasDisponibles.push({
        ...jaula,
        ocupacionActual: cuyesEnJaula,
        espacioDisponible: jaula.capacidadMaxima - cuyesEnJaula
      });
    }
  }

  if (jaulasDisponibles.length === 0) {
    return null;
  }

  // Ordenar jaulas por mayor espacio disponible
  jaulasDisponibles.sort((a, b) => b.espacioDisponible - a.espacioDisponible);

  return {
    galpon: galponSugerido.nombre,
    jaula: jaulasDisponibles[0].nombre,
    razon: `Galpón con ${galponSugerido.porcentajeOcupacion.toFixed(1)}% de ocupación, jaula con ${jaulasDisponibles[0].espacioDisponible} espacios disponibles`
  };
};