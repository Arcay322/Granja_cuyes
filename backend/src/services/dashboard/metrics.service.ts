import { PrismaClient } from '@prisma/client';
import { dashboardCache, getCacheKey } from '../cache.service';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export interface DashboardMetrics {
  reproductiveStats: {
    activePregnancies: number;
    expectedBirths: number;
    successRate: number;
    averageLitterSize: number;
    totalBirthsThisMonth: number;
    totalBirthsLastMonth: number;
  };
  performanceMetrics: {
    topPerformingMothers: Array<{
      id: number;
      raza: string;
      galpon: string;
      jaula: string;
      totalLitters: number;
      averageLitterSize: number;
      successRate: number;
    }>;
    topPerformingFathers: Array<{
      id: number;
      raza: string;
      galpon: string;
      jaula: string;
      totalOffspring: number;
      activeBreedings: number;
    }>;
    breedingEfficiency: number;
  };
  trends: {
    monthlyBirths: Array<{
      month: string;
      births: number;
      liveOffspring: number;
    }>;
    successRateHistory: Array<{
      month: string;
      rate: number;
    }>;
    capacityUtilization: Array<{
      galpon: string;
      used: number;
      total: number;
      percentage: number;
    }>;
  };
}

export interface DashboardFilters {
  dateFrom?: Date;
  dateTo?: Date;
  galpon?: string;
  raza?: string;
}

// Obtener estadísticas reproductivas básicas
export const getReproductiveStats = async (filters: DashboardFilters = {}) => {
  const { dateFrom, dateTo, galpon, raza } = filters;
  
  // Construir filtros de fecha
  const dateFilter = dateFrom && dateTo ? {
    fechaNacimiento: {
      gte: dateFrom,
      lte: dateTo
    }
  } : {};

  // Preñeces activas
  const activePregnancies = await prisma.prenez.count({
    where: {
      estado: 'activa'
    }
  });

  // Partos esperados en los próximos 30 días
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const expectedBirths = await prisma.prenez.count({
    where: {
      estado: 'activa',
      fechaProbableParto: {
        lte: thirtyDaysFromNow
      }
    }
  });

  // Camadas del período para calcular estadísticas
  const camadasFilter: any = { ...dateFilter };
  
  const camadas = await prisma.camada.findMany({
    where: camadasFilter,
    include: {
      cuyes: true
    }
  });

  // Calcular tasa de éxito y tamaño promedio de camada
  const totalCamadas = camadas.length;
  const totalVivos = camadas.reduce((sum, camada) => sum + camada.numVivos, 0);
  const totalMuertos = camadas.reduce((sum, camada) => sum + camada.numMuertos, 0);
  const totalCrias = totalVivos + totalMuertos;
  
  const successRate = totalCrias > 0 ? (totalVivos / totalCrias) * 100 : 0;
  const averageLitterSize = totalCamadas > 0 ? totalVivos / totalCamadas : 0;

  // Nacimientos este mes
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  
  const totalBirthsThisMonth = await prisma.camada.count({
    where: {
      fechaNacimiento: {
        gte: thisMonth
      }
    }
  });

  // Nacimientos mes pasado
  const lastMonth = new Date(thisMonth);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const endLastMonth = new Date(thisMonth);
  endLastMonth.setDate(0);
  
  const totalBirthsLastMonth = await prisma.camada.count({
    where: {
      fechaNacimiento: {
        gte: lastMonth,
        lt: thisMonth
      }
    }
  });

  return {
    activePregnancies,
    expectedBirths,
    successRate: Math.round(successRate * 100) / 100,
    averageLitterSize: Math.round(averageLitterSize * 100) / 100,
    totalBirthsThisMonth,
    totalBirthsLastMonth
  };
};

// Obtener métricas de rendimiento
export const getPerformanceMetrics = async (filters: DashboardFilters = {}) => {
  // Top madres reproductoras
  const topMothersQuery = `
    SELECT 
      c.id,
      c.raza,
      c.galpon,
      c.jaula,
      COUNT(cam.id) as total_litters,
      AVG(cam."numVivos") as average_litter_size,
      (SUM(cam."numVivos")::float / NULLIF(SUM(cam."numVivos" + cam."numMuertos"), 0)) * 100 as success_rate
    FROM "Cuy" c
    LEFT JOIN "Camada" cam ON c.id = cam."madreId"
    WHERE c.sexo = 'H' 
      AND c."etapaVida" = 'Reproductora'
      AND c.estado = 'Activo'
    GROUP BY c.id, c.raza, c.galpon, c.jaula
    HAVING COUNT(cam.id) > 0
    ORDER BY total_litters DESC, average_litter_size DESC
    LIMIT 5
  `;

  const topMothersRaw = await prisma.$queryRawUnsafe(topMothersQuery) as any[];
  const topMothers = topMothersRaw.map((row: any) => ({
    id: Number(row.id),
    raza: String(row.raza),
    galpon: String(row.galpon),
    jaula: String(row.jaula),
    totalLitters: Number(row.total_litters),
    averageLitterSize: Number(row.average_litter_size) || 0,
    successRate: Number(row.success_rate) || 0
  }));

  // Top padres reproductores
  const topFathersQuery = `
    SELECT 
      c.id,
      c.raza,
      c.galpon,
      c.jaula,
      COUNT(cam.id) as total_offspring,
      COUNT(p.id) as active_breedings
    FROM "Cuy" c
    LEFT JOIN "Camada" cam ON c.id = cam."padreId"
    LEFT JOIN "Prenez" p ON c.id = p."padreId" AND p.estado = 'activa'
    WHERE c.sexo = 'M' 
      AND c."etapaVida" = 'Reproductor'
      AND c.estado = 'Activo'
    GROUP BY c.id, c.raza, c.galpon, c.jaula
    ORDER BY total_offspring DESC, active_breedings DESC
    LIMIT 5
  `;

  const topFathersRaw = await prisma.$queryRawUnsafe(topFathersQuery) as any[];
  const topFathers = topFathersRaw.map((row: any) => ({
    id: Number(row.id),
    raza: String(row.raza),
    galpon: String(row.galpon),
    jaula: String(row.jaula),
    totalOffspring: Number(row.total_offspring),
    activeBreedings: Number(row.active_breedings)
  }));

  // Eficiencia reproductiva general
  const totalReproductoras = await prisma.cuy.count({
    where: {
      sexo: 'H',
      etapaVida: 'Reproductora',
      estado: 'Activo'
    }
  });

  const reproductoras30Dias = new Date();
  reproductoras30Dias.setDate(reproductoras30Dias.getDate() - 30);

  const activasUltimos30Dias = await prisma.prenez.count({
    where: {
      fechaPrenez: {
        gte: reproductoras30Dias
      }
    }
  });

  const breedingEfficiency = totalReproductoras > 0 ? 
    (activasUltimos30Dias / totalReproductoras) * 100 : 0;

  return {
    topPerformingMothers: topMothers,
    topPerformingFathers: topFathers,
    breedingEfficiency: Math.round(breedingEfficiency * 100) / 100
  };
};

// Obtener tendencias históricas
export const getTrends = async (filters: DashboardFilters = {}) => {
  // Nacimientos por mes (últimos 12 meses)
  const monthlyBirthsQuery = `
    SELECT 
      TO_CHAR("fechaNacimiento", 'YYYY-MM') as month,
      COUNT(*) as births,
      SUM("numVivos") as live_offspring
    FROM "Camada"
    WHERE "fechaNacimiento" >= NOW() - INTERVAL '12 months'
    GROUP BY TO_CHAR("fechaNacimiento", 'YYYY-MM')
    ORDER BY month
  `;

  const monthlyBirthsRaw = await prisma.$queryRawUnsafe(monthlyBirthsQuery) as any[];
  const monthlyBirths = monthlyBirthsRaw.map((row: any) => ({
    month: String(row.month),
    births: Number(row.births),
    liveOffspring: Number(row.live_offspring)
  }));

  // Tasa de éxito histórica
  const successRateQuery = `
    SELECT 
      TO_CHAR("fechaNacimiento", 'YYYY-MM') as month,
      (SUM("numVivos")::float / NULLIF(SUM("numVivos" + "numMuertos"), 0)) * 100 as rate
    FROM "Camada"
    WHERE "fechaNacimiento" >= NOW() - INTERVAL '12 months'
    GROUP BY TO_CHAR("fechaNacimiento", 'YYYY-MM')
    ORDER BY month
  `;

  const successRateHistoryRaw = await prisma.$queryRawUnsafe(successRateQuery) as any[];
  const successRateHistory = successRateHistoryRaw.map((row: any) => ({
    month: String(row.month),
    rate: Number(row.rate) || 0
  }));

  // Utilización de capacidad por galpón
  const capacityQuery = `
    SELECT 
      "galpon",
      COUNT(*) as used,
      50 as total,
      (COUNT(*)::float / 50) * 100 as percentage
    FROM "Cuy"
    WHERE "estado" = 'Activo'
    GROUP BY "galpon"
    ORDER BY "galpon"
  `;

  const capacityUtilizationRaw = await prisma.$queryRawUnsafe(capacityQuery) as any[];
  const capacityUtilization = capacityUtilizationRaw.map((row: any) => ({
    galpon: String(row.galpon),
    used: Number(row.used),
    total: Number(row.total),
    percentage: Number(row.percentage)
  }));

  return {
    monthlyBirths,
    successRateHistory,
    capacityUtilization
  };
};

// Función principal para obtener todas las métricas del dashboard con caché
export const getDashboardMetrics = async (filters: DashboardFilters = {}): Promise<DashboardMetrics> => {
  const cacheKey = getCacheKey('dashboard:metrics', JSON.stringify(filters));
  
  try {
    // Intentar obtener del caché primero
    const cachedMetrics = dashboardCache.get<DashboardMetrics>(cacheKey);
    if (cachedMetrics) {
      logger.debug(`Dashboard metrics cache hit: ${cacheKey}`);
      return cachedMetrics;
    }

    logger.debug(`Dashboard metrics cache miss: ${cacheKey}`);
    
    // Si no está en caché, calcular métricas
    const [reproductiveStats, performanceMetrics, trends] = await Promise.all([
      getReproductiveStats(filters),
      getPerformanceMetrics(filters),
      getTrends(filters)
    ]);

    const metrics: DashboardMetrics = {
      reproductiveStats,
      performanceMetrics,
      trends
    };

    // Guardar en caché con TTL de 5 minutos
    dashboardCache.set(cacheKey, metrics, 300);
    logger.debug(`Dashboard metrics cached: ${cacheKey}`);

    return metrics;
  } catch (error) {
    logger.error('Error obteniendo métricas del dashboard:', error);
    throw error;
  }
};

// Función para obtener métricas en tiempo real (versión ligera)
export const getRealTimeMetrics = async () => {
  try {
    const [activePregnancies, expectedBirths] = await Promise.all([
      prisma.prenez.count({ where: { estado: 'activa' } }),
      prisma.prenez.count({
        where: {
          estado: 'activa',
          fechaProbableParto: {
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
          }
        }
      })
    ]);

    return {
      activePregnancies,
      expectedBirths,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error obteniendo métricas en tiempo real:', error);
    throw error;
  }
};