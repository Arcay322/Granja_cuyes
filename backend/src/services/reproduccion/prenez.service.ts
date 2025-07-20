import { PrismaClient, Prenez } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener todas las preñeces con paginación y filtros
export const getAllPaginated = async (filters: Record<string, any>, pagination: { page: number; limit: number }) => {
  try {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Construir condiciones de filtro
    const where: any = {};

    // Filtro por estado
    if (filters.estado) {
      where.estado = filters.estado;
    }

    // Filtro por rango de fechas
    if (filters.fechaDesde || filters.fechaHasta) {
      where.fechaPrenez = {};
      if (filters.fechaDesde) {
        where.fechaPrenez.gte = new Date(filters.fechaDesde);
      }
      if (filters.fechaHasta) {
        where.fechaPrenez.lte = new Date(filters.fechaHasta);
      }
    }

    // Búsqueda por texto (en notas)
    if (filters.search) {
      where.OR = [
        { notas: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Obtener preñeces básicas primero
    const preneces = await prisma.prenez.findMany({
      where,
      include: {
        camada: {
          select: {
            id: true,
            fechaNacimiento: true,
            numVivos: true,
            numMuertos: true
          }
        }
      },
      orderBy: {
        fechaPrenez: 'desc'
      },
      skip,
      take: limit
    });

    // Contar total para paginación
    const total = await prisma.prenez.count({ where });

    // Obtener información de madres y padres por separado
    const madreIds = preneces.map(p => p.madreId);
    const padreIds = preneces.filter(p => p.padreId).map(p => p.padreId!);
    
    const madres = await prisma.cuy.findMany({
      where: { id: { in: madreIds } },
      select: {
        id: true,
        raza: true,
        galpon: true,
        jaula: true,
        etapaVida: true
      }
    });

    const padres = padreIds.length > 0 ? await prisma.cuy.findMany({
      where: { id: { in: padreIds } },
      select: {
        id: true,
        raza: true,
        galpon: true,
        jaula: true
      }
    }) : [];

    // Calcular información adicional para cada preñez
    const prenecesConInfo = preneces.map(prenez => {
      const diasGestacion = Math.floor((new Date().getTime() - new Date(prenez.fechaPrenez).getTime()) / (1000 * 60 * 60 * 24));
      const diasRestantes = Math.floor((new Date(prenez.fechaProbableParto).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      const madre = madres.find(m => m.id === prenez.madreId);
      const padre = padres.find(p => p.id === prenez.padreId);
      
      return {
        ...prenez,
        diasGestacion,
        diasRestantes,
        estadoCalculado: diasRestantes < 0 && prenez.estado === 'activa' ? 'vencida' : prenez.estado,
        madre,
        padre
      };
    });

    return {
      preneces: prenecesConInfo,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    console.error('Error en getAllPaginated:', error);
    throw error;
  }
};

// Mantener función original para compatibilidad
export const getAll = async (): Promise<Prenez[]> => {
  return prisma.prenez.findMany({
    orderBy: {
      fechaPrenez: 'desc'
    }
  });
};

// Obtener preñeces activas (sin camada asociada)
export const getActivas = async (): Promise<Prenez[]> => {
  return prisma.prenez.findMany({
    where: {
      estado: 'activa'
    },
    orderBy: {
      fechaProbableParto: 'asc'
    }
  });
};

// Obtener preñez por ID
export const getById = async (id: number): Promise<Prenez | null> => {
  return prisma.prenez.findUnique({
    where: { id }
  });
};

// Crear nueva preñez
export const create = async (data: Omit<Prenez, 'id'>): Promise<Prenez> => {
  return prisma.prenez.create({
    data
  });
};

// Actualizar preñez
export const update = async (id: number, data: Partial<Prenez>): Promise<Prenez> => {
  return prisma.prenez.update({
    where: { id },
    data
  });
};

// Eliminar preñez
export const remove = async (id: number): Promise<Prenez> => {
  return prisma.prenez.delete({
    where: { id }
  });
};

// Marcar preñez como completada y asociar a una camada
export const completarPrenez = async (id: number, camadaId: number): Promise<Prenez> => {
  return prisma.prenez.update({
    where: { id },
    data: {
      estado: 'completada',
      fechaCompletada: new Date(),
      camada: {
        connect: { id: camadaId }
      }
    }
  });
};

// Marcar preñez como fallida
export const marcarComoFallida = async (id: number): Promise<Prenez> => {
  return prisma.prenez.update({
    where: { id },
    data: {
      estado: 'fallida',
      fechaCompletada: new Date()
    }
  });
};

// Obtener próximos partos (preñeces activas con fecha de parto en los próximos días)
export const getProximosPartos = async (diasProximidad: number): Promise<Prenez[]> => {
  const hoy = new Date();
  const limiteFecha = new Date();
  limiteFecha.setDate(hoy.getDate() + diasProximidad);
  
  return prisma.prenez.findMany({
    where: {
      estado: 'activa',
      fechaProbableParto: {
        gte: hoy,
        lte: limiteFecha
      }
    },
    orderBy: {
      fechaProbableParto: 'asc'
    }
  });
};
// Estadísticas de reproducción
export const getEstadisticasReproduccion = async () => {
  try {
    // Estadísticas básicas de preñez
    const totalPreneces = await prisma.prenez.count();
    const prenecesActivas = await prisma.prenez.count({
      where: { estado: 'activa' }
    });
    const prenecesCompletadas = await prisma.prenez.count({
      where: { estado: 'completada' }
    });
    const prenecesFallidas = await prisma.prenez.count({
      where: { estado: 'fallida' }
    });

    // Estadísticas de camadas
    const totalCamadas = await prisma.camada.count();
    const camadasUltimos30Dias = await prisma.camada.count({
      where: {
        fechaNacimiento: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Promedio de crías por camada
    const camadas = await prisma.camada.findMany({
      select: {
        numVivos: true,
        numMuertos: true
      }
    });

    const promedioCriasPorCamada = camadas.length > 0 
      ? camadas.reduce((sum, c) => sum + c.numVivos + c.numMuertos, 0) / camadas.length 
      : 0;

    const promedioVivosPorCamada = camadas.length > 0 
      ? camadas.reduce((sum, c) => sum + c.numVivos, 0) / camadas.length 
      : 0;

    // Tasa de éxito reproductivo
    const tasaExito = totalPreneces > 0 
      ? (prenecesCompletadas / totalPreneces) * 100 
      : 0;

    // Próximos partos (próximos 7 días)
    const proximosPartos = await prisma.prenez.count({
      where: {
        estado: 'activa',
        fechaProbableParto: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Preñeces vencidas (más de 75 días)
    const prenecesVencidas = await prisma.prenez.count({
      where: {
        estado: 'activa',
        fechaProbableParto: {
          lt: new Date()
        }
      }
    });

    return {
      resumen: {
        totalPreneces,
        prenecesActivas,
        prenecesCompletadas,
        prenecesFallidas,
        totalCamadas,
        camadasRecientes: camadasUltimos30Dias,
        proximosPartos,
        prenecesVencidas
      },
      promedios: {
        criasPorCamada: Math.round(promedioCriasPorCamada * 10) / 10,
        vivosPorCamada: Math.round(promedioVivosPorCamada * 10) / 10,
        tasaExito: Math.round(tasaExito * 10) / 10
      }
    };
  } catch (error) {
    console.error('Error en getEstadisticasReproduccion:', error);
    throw error;
  }
};

// Estadísticas avanzadas con análisis temporal
export const getEstadisticasAvanzadas = async (periodo: number = 30) => {
  try {
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - periodo);

    // Distribución por galpones
    const distribucionGalpones = await prisma.prenez.groupBy({
      by: ['madreId'],
      _count: {
        id: true
      },
      where: {
        fechaPrenez: {
          gte: fechaInicio
        }
      }
    });

    // Obtener información de galpones
    const madresIds = distribucionGalpones.map(d => d.madreId);
    const madres = await prisma.cuy.findMany({
      where: {
        id: { in: madresIds }
      },
      select: {
        id: true,
        galpon: true,
        jaula: true
      }
    });

    const galponesStats = madres.reduce((acc, madre) => {
      const prenecesCount = distribucionGalpones.find(d => d.madreId === madre.id)?._count.id || 0;
      const key = madre.galpon;
      
      if (!acc[key]) {
        acc[key] = { galpon: key, preneces: 0, jaulas: new Set() };
      }
      
      acc[key].preneces += prenecesCount;
      acc[key].jaulas.add(madre.jaula);
      
      return acc;
    }, {} as Record<string, any>);

    const distribucionPorGalpon = Object.values(galponesStats).map((stat: any) => ({
      galpon: stat.galpon,
      preneces: stat.preneces,
      jaulas: stat.jaulas.size
    }));

    // Tendencia mensual
    const tendenciaMensual = await prisma.camada.groupBy({
      by: ['fechaNacimiento'],
      _count: {
        id: true
      },
      _sum: {
        numVivos: true,
        numMuertos: true
      },
      where: {
        fechaNacimiento: {
          gte: fechaInicio
        }
      }
    });

    // Análisis de productividad por reproductora
    const reproductoras = await prisma.cuy.findMany({
      where: {
        sexo: 'H',
        etapaVida: 'Reproductora',
        estado: 'Activo'
      }
    });

    // Obtener conteos por separado
    const reproductorasConConteos = await Promise.all(
      reproductoras.map(async (reproductora) => {
        const prenecesCount = await prisma.prenez.count({
          where: { madreId: reproductora.id }
        });
        const camadasCount = await prisma.camada.count({
          where: { madreId: reproductora.id }
        });
        
        return {
          ...reproductora,
          prenecesCount,
          camadasCount
        };
      })
    );

    return {
      resumen: {
        periodo,
        fechaInicio,
        totalReproductoras: reproductoras.length
      },
      distribucion: {
        galpones: distribucionPorGalpon,
        reproductoras: reproductorasConConteos.map(r => ({
          id: r.id,
          galpon: r.galpon,
          jaula: r.jaula,
          preneces: r.prenecesCount,
          camadas: r.camadasCount
        }))
      },
      tendencias: {
        mensual: tendenciaMensual
      }
    };
  } catch (error) {
    console.error('Error en getEstadisticasAvanzadas:', error);
    throw error;
  }
};

// Sistema de alertas específicas
export const getAlertasEspecificas = async () => {
  try {
    const ahora = new Date();
    
    // 1. Próximos partos (próximos 3-7 días)
    const proximosPartos3Dias = await prisma.prenez.findMany({
      where: {
        estado: 'activa',
        fechaProbableParto: {
          gte: ahora,
          lte: new Date(ahora.getTime() + 3 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const proximosPartos7Dias = await prisma.prenez.findMany({
      where: {
        estado: 'activa',
        fechaProbableParto: {
          gte: new Date(ahora.getTime() + 3 * 24 * 60 * 60 * 1000),
          lte: new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // 2. Preñeces vencidas (más de 75 días de gestación)
    const prenecesVencidas = await prisma.prenez.findMany({
      where: {
        estado: 'activa',
        fechaProbableParto: {
          lt: ahora
        }
      }
    });

    // Obtener información de madres para las alertas
    const todasLasPreneces = [...proximosPartos3Dias, ...proximosPartos7Dias, ...prenecesVencidas];
    const madreIds = todasLasPreneces.map(p => p.madreId);
    const madres = await prisma.cuy.findMany({
      where: { id: { in: madreIds } },
      select: {
        id: true,
        raza: true,
        galpon: true,
        jaula: true
      }
    });

    // 3. Reproductoras sin actividad reciente (90+ días sin preñez)
    const fechaLimite90Dias = new Date(ahora.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const reproductorasActivas = await prisma.cuy.findMany({
      where: {
        sexo: 'H',
        etapaVida: 'Reproductora',
        estado: 'Activo'
      }
    });

    // Obtener reproductoras inactivas por separado
    const reproductorasInactivas = await Promise.all(
      reproductorasActivas.map(async (reproductora) => {
        const prenecesRecientes = await prisma.prenez.count({
          where: {
            madreId: reproductora.id,
            fechaPrenez: {
              gte: fechaLimite90Dias
            }
          }
        });
        
        return prenecesRecientes === 0 ? reproductora : null;
      })
    ).then(results => results.filter(r => r !== null));

    // 4. Camadas recientes que necesitan seguimiento (menos de 30 días)
    const camadasRecientes = await prisma.camada.findMany({
      where: {
        fechaNacimiento: {
          gte: new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        cuyes: {
          where: {
            estado: 'Activo'
          }
        }
      }
    });

    // Obtener información de madres para las camadas
    const madreIdsCamadas = camadasRecientes.filter(c => c.madreId).map(c => c.madreId!);
    const madresCamadas = madreIdsCamadas.length > 0 ? await prisma.cuy.findMany({
      where: { id: { in: madreIdsCamadas } },
      select: {
        id: true,
        raza: true,
        galpon: true,
        jaula: true
      }
    }) : [];

    // Calcular niveles de prioridad usando la información de madres obtenida
    const alertas = {
      criticas: [
        ...prenecesVencidas.map(p => {
          const madre = madres.find(m => m.id === p.madreId);
          return {
            tipo: 'prenez_vencida',
            prioridad: 'critica' as const,
            mensaje: `Preñez vencida: Madre en ${madre?.galpon || 'N/A'}-${madre?.jaula || 'N/A'}`,
            diasVencida: Math.floor((ahora.getTime() - new Date(p.fechaProbableParto).getTime()) / (1000 * 60 * 60 * 24)),
            data: { ...p, madre }
          };
        })
      ],
      altas: [
        ...proximosPartos3Dias.map(p => {
          const madre = madres.find(m => m.id === p.madreId);
          return {
            tipo: 'parto_inminente',
            prioridad: 'alta' as const,
            mensaje: `Parto en 1-3 días: Madre en ${madre?.galpon || 'N/A'}-${madre?.jaula || 'N/A'}`,
            diasRestantes: Math.ceil((new Date(p.fechaProbableParto).getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)),
            data: { ...p, madre }
          };
        })
      ],
      medias: [
        ...proximosPartos7Dias.map(p => {
          const madre = madres.find(m => m.id === p.madreId);
          return {
            tipo: 'parto_proximo',
            prioridad: 'media' as const,
            mensaje: `Parto en 4-7 días: Madre en ${madre?.galpon || 'N/A'}-${madre?.jaula || 'N/A'}`,
            diasRestantes: Math.ceil((new Date(p.fechaProbableParto).getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)),
            data: { ...p, madre }
          };
        }),
        ...camadasRecientes.filter(c => c.cuyes.length < c.numVivos * 0.8).map(c => {
          const madre = madresCamadas.find(m => m.id === c.madreId);
          return {
            tipo: 'camada_baja_supervivencia',
            prioridad: 'media' as const,
            mensaje: `Camada con baja supervivencia: ${c.cuyes.length}/${c.numVivos} vivos en ${madre?.galpon || 'N/A'}-${madre?.jaula || 'N/A'}`,
            supervivencia: Math.round((c.cuyes.length / c.numVivos) * 100),
            data: { ...c, madre }
          };
        })
      ],
      bajas: [
        ...reproductorasInactivas.map(r => ({
          tipo: 'reproductora_inactiva',
          prioridad: 'baja' as const,
          mensaje: `Reproductora sin actividad reciente: ${r.galpon}-${r.jaula}`,
          diasInactiva: 90,
          data: r
        }))
      ]
    };

    const resumen = {
      total: alertas.criticas.length + alertas.altas.length + alertas.medias.length + alertas.bajas.length,
      criticas: alertas.criticas.length,
      altas: alertas.altas.length,
      medias: alertas.medias.length,
      bajas: alertas.bajas.length
    };

    return {
      resumen,
      alertas,
      fechaGeneracion: ahora
    };
  } catch (error) {
    console.error('Error en getAlertasEspecificas:', error);
    throw error;
  }
};