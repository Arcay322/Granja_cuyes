// Estadísticas reproductivas de una madre
export const getEstadisticasMadre = async (madreId: number) => {
  // Buscar historial de preñeces
  const historialPreneces = await prisma.prenez.findMany({
    where: { madreId },
    select: {
      id: true,
      fechaPrenez: true,
      fechaProbableParto: true,
      estado: true,
      camada: {
        select: { numVivos: true, numMuertos: true, fechaNacimiento: true }
      }
    },
    orderBy: { fechaPrenez: 'desc' }
  });
  const totalPreneces = historialPreneces.length;
  const prenecesExitosas = historialPreneces.filter(p => p.estado === 'completada').length;
  const camadas = historialPreneces.filter(p => p.camada).map(p => p.camada!);
  const promedioLitada = camadas.length > 0 ? camadas.reduce((sum, c) => sum + c.numVivos, 0) / camadas.length : 0;
  const tasaExito = totalPreneces > 0 ? (prenecesExitosas / totalPreneces) * 100 : 0;
  return {
    totalPreneces,
    prenecesExitosas,
    promedioLitada: Math.round(promedioLitada * 10) / 10,
    tasaExito: Math.round(tasaExito * 10) / 10,
    historialPreneces
  };
};

// Estadísticas reproductivas de un padre
export const getEstadisticasPadre = async (padreId: number) => {
  // Buscar historial de cruces
  const historialCruces = await prisma.prenez.findMany({
    where: { padreId },
    select: {
      id: true,
      fechaPrenez: true,
      estado: true,
      camada: {
        select: { numVivos: true, numMuertos: true, fechaNacimiento: true }
      }
    },
    orderBy: { fechaPrenez: 'desc' }
  });
  const totalCruces = historialCruces.length;
  const crucesExitosos = historialCruces.filter(p => p.estado === 'completada').length;
  const camadas = historialCruces.filter(p => p.camada).map(p => p.camada!);
  const promedioDescendencia = camadas.length > 0 ? camadas.reduce((sum, c) => sum + c.numVivos, 0) / camadas.length : 0;
  const tasaExito = totalCruces > 0 ? (crucesExitosos / totalCruces) * 100 : 0;
  return {
    totalCruces,
    crucesExitosos,
    promedioDescendencia: Math.round(promedioDescendencia * 10) / 10,
    tasaExito: Math.round(tasaExito * 10) / 10,
    historialCruces
  };
};
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

// ===== SERVICIOS PARA SELECCIÓN DE REPRODUCTORES =====

// Obtener madres disponibles para reproducción
export const getMadresDisponibles = async () => {
  try {
    // Obtener todas las hembras potencialmente reproductoras
    const hembrasReproductoras = await prisma.cuy.findMany({
      where: {
        sexo: 'H',
        estado: 'Activo',
        etapaVida: {
          in: ['Reproductora', 'Adulta']
        }
      },
      select: {
        id: true,
        raza: true,
        sexo: true,
        galpon: true,
        jaula: true,
        etapaVida: true,
        peso: true,
        fechaNacimiento: true,
        estado: true,
        fechaRegistro: true
      }
    });

    // Obtener preñeces activas para filtrar madres ocupadas
    const prenecesActivas = await prisma.prenez.findMany({
      where: {
        estado: 'activa'
      },
      select: {
        madreId: true,
        fechaPrenez: true,
        fechaProbableParto: true
      }
    });

    // Obtener historial reproductivo de cada madre
    const madresConHistorial = await Promise.all(
      hembrasReproductoras.map(async (madre) => {
        // Verificar si está actualmente preñada
        const prenezActiva = prenecesActivas.find(p => p.madreId === madre.id);
        
        // Obtener historial de preñeces
        const historialPreneces = await prisma.prenez.findMany({
          where: { madreId: madre.id },
          select: {
            id: true,
            fechaPrenez: true,
            fechaProbableParto: true,
            estado: true,
            camada: {
              select: {
                numVivos: true,
                numMuertos: true,
                fechaNacimiento: true
              }
            }
          },
          orderBy: { fechaPrenez: 'desc' }
        });

        // Calcular métricas reproductivas
        const totalPreneces = historialPreneces.length;
        const prenecesExitosas = historialPreneces.filter(p => p.estado === 'completada').length;
        const camadas = historialPreneces.filter(p => p.camada).map(p => p.camada!);
        const promedioLitada = camadas.length > 0 
          ? camadas.reduce((sum, c) => sum + c.numVivos, 0) / camadas.length 
          : 0;

        // Calcular edad en meses
        const edadMeses = Math.floor((new Date().getTime() - new Date(madre.fechaNacimiento).getTime()) / (1000 * 60 * 60 * 24 * 30));

        // Determinar estado reproductivo
        let estadoReproductivo: 'Disponible' | 'Preñada' | 'Lactando' | 'Descanso' = 'Disponible';
        
        if (prenezActiva) {
          estadoReproductivo = 'Preñada';
        } else {
          // Verificar si está en período de lactancia (últimos 45 días desde parto)
          const ultimaCamada = camadas[0];
          if (ultimaCamada) {
            const diasDesdeParto = Math.floor((new Date().getTime() - new Date(ultimaCamada.fechaNacimiento).getTime()) / (1000 * 60 * 60 * 24));
            if (diasDesdeParto < 45) {
              estadoReproductivo = 'Lactando';
            } else if (diasDesdeParto < 60) {
              estadoReproductivo = 'Descanso';
            }
          }
        }

        // Solo incluir madres disponibles
        const estaDisponible = estadoReproductivo === 'Disponible' && 
                              edadMeses >= 3 && 
                              edadMeses <= 24 && 
                              madre.peso >= 0.8;

        return {
          ...madre,
          edad: edadMeses,
          estadoReproductivo,
          estaDisponible,
          historialReproductivo: {
            totalPreneces,
            prenecesExitosas,
            promedioLitada: Math.round(promedioLitada * 10) / 10,
            ultimaPrenez: historialPreneces[0]?.fechaPrenez,
            tasaExito: totalPreneces > 0 ? Math.round((prenecesExitosas / totalPreneces) * 100) : 0
          },
          salud: {
            estado: madre.estado,
            pesoOptimo: madre.peso >= 0.8 && madre.peso <= 1.5
          }
        };
      })
    );

    // Filtrar solo madres disponibles
    const madresDisponibles = madresConHistorial.filter(madre => madre.estaDisponible);

    return madresDisponibles;
  } catch (error) {
    console.error('Error en getMadresDisponibles:', error);
    throw error;
  }
};

// Obtener padres disponibles para reproducción
export const getPadresDisponibles = async () => {
  try {
    // Obtener todos los machos potencialmente reproductores
    const machosReproductores = await prisma.cuy.findMany({
      where: {
        sexo: 'M',
        estado: 'Activo',
        etapaVida: {
          in: ['Reproductor', 'Adulto', 'Engorde']
        }
      },
      select: {
        id: true,
        raza: true,
        sexo: true,
        galpon: true,
        jaula: true,
        etapaVida: true,
        peso: true,
        fechaNacimiento: true,
        estado: true,
        fechaRegistro: true
      }
    });

    // Obtener historial reproductivo de cada padre
    const padresConHistorial = await Promise.all(
      machosReproductores.map(async (padre) => {
        // Obtener historial como padre
        const historialCruces = await prisma.prenez.findMany({
          where: { padreId: padre.id },
          select: {
            id: true,
            fechaPrenez: true,
            estado: true,
            camada: {
              select: {
                numVivos: true,
                numMuertos: true,
                fechaNacimiento: true
              }
            }
          },
          orderBy: { fechaPrenez: 'desc' }
        });

        // Calcular métricas reproductivas
        const totalCruces = historialCruces.length;
        const crucesExitosos = historialCruces.filter(p => p.estado === 'completada').length;
        const camadas = historialCruces.filter(p => p.camada).map(p => p.camada!);
        const promedioDescendencia = camadas.length > 0 
          ? camadas.reduce((sum, c) => sum + c.numVivos, 0) / camadas.length 
          : 0;

        // Calcular edad en meses
        const edadMeses = Math.floor((new Date().getTime() - new Date(padre.fechaNacimiento).getTime()) / (1000 * 60 * 60 * 24 * 30));

        // Verificar disponibilidad (permitir hasta 3 cruces por semana)
        const crucesRecientes = historialCruces.filter(p => {
          const diasDesde = Math.floor((new Date().getTime() - new Date(p.fechaPrenez).getTime()) / (1000 * 60 * 60 * 24));
          return diasDesde <= 7;
        });

        // Peso en gramos: debe ser >= 1000 (1kg)
        const estaDisponible = crucesRecientes.length < 3 && 
                              edadMeses >= 4 && 
                              edadMeses <= 36 && 
                              padre.peso >= 1000;

        return {
          ...padre,
          edad: edadMeses,
          estaDisponible,
          rendimientoReproductivo: {
            totalCruces,
            tasaExito: totalCruces > 0 ? Math.round((crucesExitosos / totalCruces) * 100) : 0,
            promedioDescendencia: Math.round(promedioDescendencia * 10) / 10,
            ultimoCruce: historialCruces[0]?.fechaPrenez,
            frecuenciaCruce: totalCruces
          },
          genetica: {
            linaje: padre.raza,
            diversidadGenetica: 85 // Placeholder - se puede calcular basado en genealogía
          },
          salud: {
            estado: padre.estado,
            pesoOptimo: padre.peso >= 1000 && padre.peso <= 2000
          }
        };
      })
    );

    // Si no hay historial de cruces, o si nunca han sido padres, considerarlos disponibles
    const padresDisponibles = padresConHistorial.filter(padre => {
      // Si nunca ha tenido cruces, está disponible
      if (padre.rendimientoReproductivo.totalCruces === 0) return true;
      // Si tiene historial, usar la lógica anterior
      return padre.estaDisponible;
    });

    return padresDisponibles;
  } catch (error) {
    console.error('Error en getPadresDisponibles:', error);
    throw error;
  }
};

// Validar período de gestación para registro de camada
export const validarPeriodoGestacion = async (madreId: number, fechaRegistroCamada: string) => {
  try {
    // Buscar la preñez activa de la madre
    const prenezActiva = await prisma.prenez.findFirst({
      where: {
        madreId: madreId,
        estado: 'activa'
      },
      orderBy: {
        fechaPrenez: 'desc'
      }
    });

    if (!prenezActiva) {
      return {
        esValido: false,
        tipo: 'Error' as const,
        mensaje: 'No se encontró una preñez activa para esta madre',
        recomendaciones: ['Verificar que la madre tenga una preñez registrada', 'Registrar la preñez antes de la camada']
      };
    }

    // Calcular días de gestación
    const fechaPrenez = new Date(prenezActiva.fechaPrenez);
    const fechaCamada = new Date(fechaRegistroCamada);
    const diasGestacion = Math.floor((fechaCamada.getTime() - fechaPrenez.getTime()) / (1000 * 60 * 60 * 24));

    // Rangos de gestación
    const rangos = {
      minimo: 59,
      optimo: 68,
      maximo: 75,
      critico: 80
    };

    let validacion;

    if (diasGestacion < rangos.minimo) {
      validacion = {
        esValido: false,
        tipo: 'Prematuro' as const,
        mensaje: `Gestación muy corta (${diasGestacion} días). Mínimo requerido: ${rangos.minimo} días`,
        recomendaciones: [
          'Verificar la fecha de preñez registrada',
          'Esperar al menos hasta el día 59 de gestación',
          'Consultar con veterinario si hay signos de parto prematuro'
        ]
      };
    } else if (diasGestacion <= rangos.maximo) {
      validacion = {
        esValido: true,
        tipo: 'Normal' as const,
        mensaje: `Período de gestación normal (${diasGestacion} días)`,
        recomendaciones: [
          'Proceder con el registro de la camada',
          'Monitorear la salud de la madre y las crías'
        ]
      };
    } else if (diasGestacion <= rangos.critico) {
      validacion = {
        esValido: true,
        tipo: 'Tardio' as const,
        mensaje: `Gestación prolongada (${diasGestacion} días). Se recomienda atención veterinaria`,
        recomendaciones: [
          'Proceder con precaución',
          'Monitorear signos de complicaciones',
          'Considerar evaluación veterinaria',
          'Estar preparado para asistencia en el parto'
        ]
      };
    } else {
      validacion = {
        esValido: false,
        tipo: 'Critico' as const,
        mensaje: `Gestación crítica (${diasGestacion} días). Requiere atención veterinaria inmediata`,
        recomendaciones: [
          'Contactar veterinario inmediatamente',
          'No proceder sin supervisión profesional',
          'Evaluar la salud de la madre',
          'Considerar intervención médica'
        ]
      };
    }

    return {
      madreId,
      prenezId: prenezActiva.id,
      fechaPrenez: prenezActiva.fechaPrenez,
      fechaRegistroCamada,
      diasGestacion,
      validacion,
      rangosNormales: rangos
    };
  } catch (error) {
    console.error('Error en validarPeriodoGestacion:', error);
    throw error;
  }
};

// Obtener madres elegibles para registro de camada (con gestación apropiada)
export const getMadresElegiblesCamada = async () => {
  try {
    // Obtener preñeces activas
    const prenecesActivas = await prisma.prenez.findMany({
      where: {
        estado: 'activa'
      }
    });

    // Obtener información de madres por separado
    const madreIds = prenecesActivas.map(p => p.madreId);
    const madres = await prisma.cuy.findMany({
      where: { id: { in: madreIds } },
      select: {
        id: true,
        raza: true,
        galpon: true,
        jaula: true,
        etapaVida: true,
        peso: true,
        fechaNacimiento: true
      }
    });

    // Filtrar madres con gestación apropiada (59+ días)
    const madresElegibles = prenecesActivas
      .map(prenez => {
        const diasGestacion = Math.floor((new Date().getTime() - new Date(prenez.fechaPrenez).getTime()) / (1000 * 60 * 60 * 24));
        
        const madre = madres.find(m => m.id === prenez.madreId);
        
        return {
          prenezId: prenez.id,
          madre: madre,
          fechaPrenez: prenez.fechaPrenez,
          fechaProbableParto: prenez.fechaProbableParto,
          diasGestacion,
          esElegible: diasGestacion >= 59,
          estadoGestacion: diasGestacion < 59 ? 'Prematuro' : 
                          diasGestacion <= 75 ? 'Normal' : 
                          diasGestacion <= 80 ? 'Tardio' : 'Critico'
        };
      })
      .filter(item => item.esElegible);

    return madresElegibles;
  } catch (error) {
    console.error('Error en getMadresElegiblesCamada:', error);
    throw error;
  }
};

// Sistema de recomendaciones y compatibilidad
export const calcularCompatibilidadReproductiva = async (madreId: number, padreId: number) => {
  try {
    // Obtener información de la madre y el padre
    const madre = await prisma.cuy.findUnique({
      where: { id: madreId }
    });

    const padre = await prisma.cuy.findUnique({
      where: { id: padreId }
    });

    // Obtener preñeces de la madre por separado
    const prenecesMaternas = await prisma.prenez.findMany({
      where: { madreId: madreId },
      include: {
        camada: true
      }
    });

    // Obtener preñeces del padre por separado
    const prenecesPaternas = await prisma.prenez.findMany({
      where: { padreId: padreId },
      include: {
        camada: true
      }
    });

    if (!madre || !padre) {
      throw new Error('No se encontraron los reproductores especificados');
    }

    // Calcular métricas de compatibilidad
    let compatibilityScore = 100;
    const recomendaciones: string[] = [];
    const advertencias: string[] = [];

    // 1. Compatibilidad genética (raza)
    if (madre.raza === padre.raza) {
      compatibilityScore += 10;
      recomendaciones.push('Excelente compatibilidad genética - misma raza');
    } else {
      compatibilityScore -= 5;
      advertencias.push('Cruce entre razas diferentes - verificar compatibilidad');
    }

    // 2. Diferencia de edad
    const edadMadre = Math.floor((new Date().getTime() - new Date(madre.fechaNacimiento).getTime()) / (1000 * 60 * 60 * 24 * 30));
    const edadPadre = Math.floor((new Date().getTime() - new Date(padre.fechaNacimiento).getTime()) / (1000 * 60 * 60 * 24 * 30));
    const diferenciaEdad = Math.abs(edadMadre - edadPadre);

    if (diferenciaEdad <= 6) {
      compatibilityScore += 5;
      recomendaciones.push('Edades compatibles para reproducción');
    } else if (diferenciaEdad <= 12) {
      compatibilityScore -= 2;
      advertencias.push('Diferencia de edad moderada');
    } else {
      compatibilityScore -= 10;
      advertencias.push('Gran diferencia de edad - puede afectar la reproducción');
    }

    // 3. Historial reproductivo de la madre
    const prenecesExitosas = prenecesMaternas.filter((p: any) => p.estado === 'completada').length;
    const totalPreneces = prenecesMaternas.length;
    const tasaExitoMadre = totalPreneces > 0 ? (prenecesExitosas / totalPreneces) * 100 : 0;

    if (tasaExitoMadre >= 80) {
      compatibilityScore += 15;
      recomendaciones.push(`Madre con excelente historial reproductivo (${tasaExitoMadre.toFixed(1)}% éxito)`);
    } else if (tasaExitoMadre >= 60) {
      compatibilityScore += 5;
      recomendaciones.push(`Madre con buen historial reproductivo (${tasaExitoMadre.toFixed(1)}% éxito)`);
    } else if (totalPreneces > 0) {
      compatibilityScore -= 10;
      advertencias.push(`Madre con historial reproductivo bajo (${tasaExitoMadre.toFixed(1)}% éxito)`);
    }

    // 4. Historial reproductivo del padre
    const crucesExitosos = prenecesPaternas.filter((p: any) => p.estado === 'completada').length;
    const totalCruces = prenecesPaternas.length;
    const tasaExitoPadre = totalCruces > 0 ? (crucesExitosos / totalCruces) * 100 : 0;

    if (tasaExitoPadre >= 80) {
      compatibilityScore += 15;
      recomendaciones.push(`Padre con excelente historial reproductivo (${tasaExitoPadre.toFixed(1)}% éxito)`);
    } else if (tasaExitoPadre >= 60) {
      compatibilityScore += 5;
      recomendaciones.push(`Padre con buen historial reproductivo (${tasaExitoPadre.toFixed(1)}% éxito)`);
    } else if (totalCruces > 0) {
      compatibilityScore -= 10;
      advertencias.push(`Padre con historial reproductivo bajo (${tasaExitoPadre.toFixed(1)}% éxito)`);
    }

    // 5. Peso y condición física
    if (madre.peso >= 0.8 && madre.peso <= 1.5) {
      compatibilityScore += 5;
      recomendaciones.push('Madre con peso óptimo para reproducción');
    } else {
      compatibilityScore -= 5;
      advertencias.push('Peso de la madre fuera del rango óptimo');
    }

    if (padre.peso >= 1.0 && padre.peso <= 2.0) {
      compatibilityScore += 5;
      recomendaciones.push('Padre con peso óptimo para reproducción');
    } else {
      compatibilityScore -= 5;
      advertencias.push('Peso del padre fuera del rango óptimo');
    }

    // 6. Ubicación (mismo galpón facilita el manejo)
    if (madre.galpon === padre.galpon) {
      compatibilityScore += 3;
      recomendaciones.push('Reproductores en el mismo galpón - facilita el manejo');
    }

    // 7. Predicciones basadas en historial
    const camadasMadre = prenecesMaternas.filter((p: any) => p.camada).map((p: any) => p.camada!);
    const camadasPadre = prenecesPaternas.filter((p: any) => p.camada).map((p: any) => p.camada!);
    
    const promedioLitadaMadre = camadasMadre.length > 0 
      ? camadasMadre.reduce((sum: number, c: any) => sum + c.numVivos, 0) / camadasMadre.length 
      : 2.5; // Promedio típico

    const promedioLitadaPadre = camadasPadre.length > 0 
      ? camadasPadre.reduce((sum: number, c: any) => sum + c.numVivos, 0) / camadasPadre.length 
      : 2.5; // Promedio típico

    const prediccionLitada = Math.round((promedioLitadaMadre + promedioLitadaPadre) / 2);

    // Normalizar score (0-100)
    compatibilityScore = Math.max(0, Math.min(100, compatibilityScore));

    // Determinar nivel de compatibilidad
    let nivelCompatibilidad: 'Excelente' | 'Buena' | 'Regular' | 'Baja';
    if (compatibilityScore >= 85) {
      nivelCompatibilidad = 'Excelente';
    } else if (compatibilityScore >= 70) {
      nivelCompatibilidad = 'Buena';
    } else if (compatibilityScore >= 55) {
      nivelCompatibilidad = 'Regular';
    } else {
      nivelCompatibilidad = 'Baja';
    }

    return {
      compatibilityScore,
      nivelCompatibilidad,
      recomendaciones,
      advertencias,
      predicciones: {
        litadaEsperada: prediccionLitada,
        tasaExitoEstimada: Math.round((tasaExitoMadre + tasaExitoPadre) / 2),
        tiempoGestacionEstimado: 68 // días promedio
      },
      detalles: {
        madre: {
          id: madre.id,
          raza: madre.raza,
          edad: edadMadre,
          peso: madre.peso,
          historial: {
            totalPreneces,
            prenecesExitosas,
            tasaExito: tasaExitoMadre,
            promedioLitada: promedioLitadaMadre
          }
        },
        padre: {
          id: padre.id,
          raza: padre.raza,
          edad: edadPadre,
          peso: padre.peso,
          historial: {
            totalCruces,
            crucesExitosos,
            tasaExito: tasaExitoPadre,
            promedioLitada: promedioLitadaPadre
          }
        }
      }
    };
  } catch (error) {
    console.error('Error en calcularCompatibilidadReproductiva:', error);
    throw error;
  }
};

// Obtener recomendaciones de parejas reproductivas
export const getRecomendacionesReproductivas = async (madreId?: number, padreId?: number) => {
  try {
    let madresDisponibles: any[] = [];
    let padresDisponibles: any[] = [];

    if (!madreId) {
      madresDisponibles = await getMadresDisponibles();
    }

    if (!padreId) {
      padresDisponibles = await getPadresDisponibles();
    }

    const recomendaciones: any[] = [];

    // Si se especifica una madre, encontrar los mejores padres
    if (madreId && !padreId) {
      for (const padre of padresDisponibles.slice(0, 5)) { // Top 5 padres
        try {
          const compatibilidad = await calcularCompatibilidadReproductiva(madreId, padre.id);
          recomendaciones.push({
            tipo: 'padre_para_madre',
            madreId,
            padreId: padre.id,
            compatibilidad
          });
        } catch (error) {
          console.error(`Error calculando compatibilidad para padre ${padre.id}:`, error);
        }
      }
    }

    // Si se especifica un padre, encontrar las mejores madres
    if (padreId && !madreId) {
      for (const madre of madresDisponibles.slice(0, 5)) { // Top 5 madres
        try {
          const compatibilidad = await calcularCompatibilidadReproductiva(madre.id, padreId);
          recomendaciones.push({
            tipo: 'madre_para_padre',
            madreId: madre.id,
            padreId,
            compatibilidad
          });
        } catch (error) {
          console.error(`Error calculando compatibilidad para madre ${madre.id}:`, error);
        }
      }
    }

    // Si no se especifica ninguno, encontrar las mejores parejas generales
    if (!madreId && !padreId) {
      const mejoresParejas: unknown[] = [];
      
      for (const madre of madresDisponibles.slice(0, 3)) {
        for (const padre of padresDisponibles.slice(0, 3)) {
          try {
            const compatibilidad = await calcularCompatibilidadReproductiva(madre.id, padre.id);
            mejoresParejas.push({
              tipo: 'pareja_recomendada',
              madreId: madre.id,
              padreId: padre.id,
              compatibilidad
            });
          } catch (error) {
            console.error(`Error calculando compatibilidad para pareja ${madre.id}-${padre.id}:`, error);
          }
        }
      }

      // Ordenar por score de compatibilidad y tomar las mejores
      mejoresParejas.sort((a: any, b: any) => {
        return b.compatibilidad.compatibilityScore - a.compatibilidad.compatibilityScore;
      });
      recomendaciones.push(...mejoresParejas.slice(0, 5));
    }

    // Ordenar recomendaciones por score de compatibilidad
    recomendaciones.sort((a, b) => b.compatibilidad.compatibilityScore - a.compatibilidad.compatibilityScore);

    return {
      recomendaciones,
      resumen: {
        total: recomendaciones.length,
        excelentes: recomendaciones.filter(r => r.compatibilidad.nivelCompatibilidad === 'Excelente').length,
        buenas: recomendaciones.filter(r => r.compatibilidad.nivelCompatibilidad === 'Buena').length,
        regulares: recomendaciones.filter(r => r.compatibilidad.nivelCompatibilidad === 'Regular').length,
        bajas: recomendaciones.filter(r => r.compatibilidad.nivelCompatibilidad === 'Baja').length
      }
    };
  } catch (error) {
    console.error('Error en getRecomendacionesReproductivas:', error);
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