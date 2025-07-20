import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener todas las camadas con paginación y filtros
export const getAllCamadasPaginated = async (filters: Record<string, any>, pagination: { page: number; limit: number }) => {
  try {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Construir condiciones de filtro
    const where: any = {};

    // Filtro por rango de fechas
    if (filters.fechaDesde || filters.fechaHasta) {
      where.fechaNacimiento = {};
      if (filters.fechaDesde) {
        where.fechaNacimiento.gte = new Date(filters.fechaDesde);
      }
      if (filters.fechaHasta) {
        where.fechaNacimiento.lte = new Date(filters.fechaHasta);
      }
    }

    // Obtener camadas básicas primero
    const camadas = await prisma.camada.findMany({
      where,
      include: {
        cuyes: {
          select: {
            id: true,
            raza: true,
            sexo: true,
            peso: true,
            estado: true,
            etapaVida: true
          }
        },
        prenez: {
          select: {
            id: true,
            fechaPrenez: true,
            notas: true
          }
        }
      },
      orderBy: { fechaNacimiento: 'desc' },
      skip,
      take: limit
    });

    // Contar total para paginación
    const total = await prisma.camada.count({ where });

    // Obtener información de madres y padres por separado
    const madreIds = camadas.filter(c => c.madreId).map(c => c.madreId!);
    const padreIds = camadas.filter(c => c.padreId).map(c => c.padreId!);
    
    const madres = madreIds.length > 0 ? await prisma.cuy.findMany({
      where: { id: { in: madreIds } },
      select: {
        id: true,
        raza: true,
        galpon: true,
        jaula: true,
        etapaVida: true
      }
    }) : [];

    const padres = padreIds.length > 0 ? await prisma.cuy.findMany({
      where: { id: { in: padreIds } },
      select: {
        id: true,
        raza: true,
        galpon: true,
        jaula: true
      }
    }) : [];

    // Calcular información adicional para cada camada
    const camadasConInfo = camadas.map(camada => {
      const edadDias = Math.floor((new Date().getTime() - new Date(camada.fechaNacimiento).getTime()) / (1000 * 60 * 60 * 24));
      const tasaSupervivencia = camada.numVivos + camada.numMuertos > 0 
        ? (camada.numVivos / (camada.numVivos + camada.numMuertos)) * 100 
        : 0;
      
      const madre = madres.find(m => m.id === camada.madreId);
      const padre = padres.find(p => p.id === camada.padreId);
      
      return {
        ...camada,
        edadDias,
        tasaSupervivencia: Math.round(tasaSupervivencia),
        totalCrias: camada.numVivos + camada.numMuertos,
        criasActuales: (camada as any).cuyes?.length || 0,
        madre,
        padre
      };
    });

    return {
      camadas: camadasConInfo,
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
    console.error('Error en getAllCamadasPaginated:', error);
    throw error;
  }
};

// Mantener función original para compatibilidad
export const getAllCamadas = async () => {
  return prisma.camada.findMany({
    orderBy: { fechaNacimiento: 'desc' }
  });
};

// Obtener camada por ID
export const getCamadaById = async (id: number) => {
  return prisma.camada.findUnique({
    where: { id },
    include: {
      cuyes: true
    }
  });
};

// Crear nueva camada y las crías correspondientes
export const createCamada = async (data: {
  fechaNacimiento: Date | string;
  numVivos: number;
  numMuertos: number;
  padreId: number | null;
  madreId: number | null;
}) => {
  // Asegurarse de que la fecha esté en formato correcto para la base de datos
  let fechaNacimiento = data.fechaNacimiento;
  if (typeof fechaNacimiento === 'string') {
    fechaNacimiento = new Date(fechaNacimiento);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Convertida fecha de camada string a Date: ${fechaNacimiento}`);
    }
  }

  // Obtener información de los padres para determinar raza y otros datos
  const madre = data.madreId ? await prisma.cuy.findUnique({
    where: { id: data.madreId },
    select: { raza: true, galpon: true, jaula: true }
  }) : null;

  const padre = data.padreId ? await prisma.cuy.findUnique({
    where: { id: data.padreId },
    select: { raza: true }
  }) : null;

  // Usar transacción para asegurar que tanto la camada como las crías se crean correctamente
  const result = await prisma.$transaction(async (tx) => {
    // Crear la camada
    const camada = await tx.camada.create({
      data: {
        fechaNacimiento,
        numVivos: data.numVivos,
        numMuertos: data.numMuertos,
        padreId: data.padreId,
        madreId: data.madreId
      }
    });

    // Crear las crías vivas como registros individuales de cuyes
    const crias = [];
    for (let i = 0; i < data.numVivos; i++) {
      const cria = await tx.cuy.create({
        data: {
          raza: madre?.raza || 'Mixta', // Usar raza de la madre o 'Mixta' por defecto
          fechaNacimiento,
          sexo: 'Indefinido', // Se puede actualizar después cuando se determine
          peso: 0.08, // Peso promedio de cría (80g)
          galpon: madre?.galpon || 'General',
          jaula: madre?.jaula || 'General',
          estado: 'Activo', // Estado general
          etapaVida: 'Cría', // Etapa específica de vida
          proposito: 'Indefinido', // Se definirá cuando crezca
          camadaId: camada.id,
          ultimaEvaluacion: new Date() // Marcar como evaluado
        }
      });
      crias.push(cria);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ Camada creada con ${data.numVivos} crías individuales`);
    }

    return { camada, crias };
  });

  return result.camada;
};

// Crear nueva camada con crías automáticas y distribución de sexos
export const createCamadaConCrias = async (
  camadaData: {
    fechaNacimiento: Date;
    numVivos: number;
    numMuertos: number;
    padreId: number | null;
    madreId: number | null;
    prenezId: number | null;
  },
  criasConfig: {
    crearCuyes: boolean;
    numMachos: number;
    numHembras: number;
  }
) => {
  // Obtener información de la madre para determinar galpón, jaula y raza
  const madre = camadaData.madreId ? await prisma.cuy.findUnique({
    where: { id: camadaData.madreId },
    select: { raza: true, galpon: true, jaula: true }
  }) : null;

  const padre = camadaData.padreId ? await prisma.cuy.findUnique({
    where: { id: camadaData.padreId },
    select: { raza: true }
  }) : null;

  // Usar transacción para asegurar consistencia
  const result = await prisma.$transaction(async (tx) => {
    // 1. Crear la camada
    const camada = await tx.camada.create({
      data: {
        fechaNacimiento: camadaData.fechaNacimiento,
        numVivos: camadaData.numVivos,
        numMuertos: camadaData.numMuertos,
        padreId: camadaData.padreId,
        madreId: camadaData.madreId,
        prenezId: camadaData.prenezId
      }
    });

    let criasCreadas = 0;

    // 2. Crear crías automáticamente si se especifica
    if (criasConfig.crearCuyes && camadaData.numVivos > 0) {
      const crias = [];
      
      // Determinar raza de las crías (prioridad: madre, padre, mixta)
      const razaCrias = madre?.raza || padre?.raza || 'Mixta';
      
      // Determinar ubicación (mismo galpón y jaula de la madre, o valores por defecto)
      const galponCrias = madre?.galpon || 'CRIAS';
      const jaulaCrias = madre?.jaula || '1';
      
      // Peso promedio para crías recién nacidas (80-120g)
      const pesoPromedio = 0.1; // 100g promedio
      
      // Crear machos
      for (let i = 0; i < criasConfig.numMachos; i++) {
        const cria = await tx.cuy.create({
          data: {
            raza: razaCrias,
            fechaNacimiento: camadaData.fechaNacimiento,
            sexo: 'M',
            peso: pesoPromedio + (Math.random() * 0.04 - 0.02), // Variación ±20g
            galpon: galponCrias,
            jaula: jaulaCrias,
            estado: 'Activo',
            etapaVida: 'Cría',
            proposito: 'Indefinido',
            camadaId: camada.id,
            ultimaEvaluacion: new Date()
          }
        });
        crias.push(cria);
        criasCreadas++;
      }
      
      // Crear hembras
      for (let i = 0; i < criasConfig.numHembras; i++) {
        const cria = await tx.cuy.create({
          data: {
            raza: razaCrias,
            fechaNacimiento: camadaData.fechaNacimiento,
            sexo: 'H',
            peso: pesoPromedio + (Math.random() * 0.04 - 0.02), // Variación ±20g
            galpon: galponCrias,
            jaula: jaulaCrias,
            estado: 'Activo',
            etapaVida: 'Cría',
            proposito: 'Indefinido',
            camadaId: camada.id,
            ultimaEvaluacion: new Date()
          }
        });
        crias.push(cria);
        criasCreadas++;
      }

      console.log(`✅ Camada #${camada.id} creada con ${criasCreadas} crías automáticas (${criasConfig.numMachos}M, ${criasConfig.numHembras}H) en ${galponCrias}-${jaulaCrias}`);
    }

    // 3. Si hay preñez asociada, marcarla como completada
    if (camadaData.prenezId) {
      await tx.prenez.update({
        where: { id: camadaData.prenezId },
        data: {
          estado: 'completada',
          fechaCompletada: new Date()
        }
      });
    }

    return { camada, criasCreadas };
  });

  return result;
};

// Actualizar camada existente
export const updateCamada = async (
  id: number,
  data: {
    fechaNacimiento: Date | string;
    numVivos: number;
    numMuertos: number;
    padreId: number | null;
    madreId: number | null;
  }
) => {
  // Verificar si existe
  const exists = await prisma.camada.findUnique({ where: { id } });
  if (!exists) return null;

  // Asegurarse de que la fecha esté en formato correcto para la base de datos
  let fechaNacimiento = data.fechaNacimiento;
  if (typeof fechaNacimiento === 'string') {
    fechaNacimiento = new Date(fechaNacimiento);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Convertida fecha de actualización de camada string a Date: ${fechaNacimiento}`);
    }
  }

  // Crear el objeto con la fecha formateada
  const formattedData = {
    ...data,
    fechaNacimiento
  };

  if (process.env.NODE_ENV !== 'production') {
    console.log(`Actualizando camada #${id} con fecha: ${formattedData.fechaNacimiento}`);
  }

  return prisma.camada.update({
    where: { id },
    data: formattedData
  });
};

// Eliminar camada
export const deleteCamada = async (id: number) => {
  // Verificar si existe
  const exists = await prisma.camada.findUnique({ where: { id } });
  if (!exists) return null;

  // Actualizar los cuyes asociados para eliminar la referencia a la camada
  await prisma.cuy.updateMany({
    where: { camadaId: id },
    data: { camadaId: null }
  });

  // Eliminar la camada
  return prisma.camada.delete({
    where: { id }
  });
};
