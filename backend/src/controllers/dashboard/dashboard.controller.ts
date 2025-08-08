import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getDashboardMetrics, DashboardFilters } from '../../services/dashboard/metrics.service';
import { getAllChartsData, ChartFilters } from '../../services/dashboard/charts.service';
import { getRealTimeMetrics } from '../../services/dashboard/metrics.service';

const prisma = new PrismaClient();

// Obtener métricas del dashboard (alias para compatibilidad)
export const getMetrics = async (req: Request, res: Response): Promise<void> => {
  return getDashboardData(req, res);
};

// Obtener métricas completas del dashboard
export const getDashboardData = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: DashboardFilters = {
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      galpon: req.query.galpon as string,
      raza: req.query.raza as string
    };

    console.log('🔍 Dashboard: Obteniendo métricas con filtros:', filters);

    let metrics;
    try {
      metrics = await getDashboardMetrics(filters);
      console.log('✅ Dashboard: Métricas obtenidas exitosamente');
    } catch (serviceError) {
      console.error('❌ Dashboard: Error en servicio de métricas:', serviceError);
      
      // Proporcionar datos de fallback en caso de error del servicio
      metrics = {
        reproductiveStats: {
          activePregnancies: 0,
          expectedBirths: 0,
          successRate: 0,
          averageLitterSize: 0,
          totalBirthsThisMonth: 0,
          totalBirthsLastMonth: 0
        },
        performanceMetrics: {
          topPerformingMothers: [],
          topPerformingFathers: [],
          breedingEfficiency: 0
        },
        trends: {
          monthlyBirths: [],
          successRateHistory: [],
          capacityUtilization: []
        }
      };
      
      console.log('⚠️ Dashboard: Usando datos de fallback');
    }

    res.status(200).json({
      success: true,
      data: metrics,
      message: 'Métricas del dashboard obtenidas exitosamente',
      timestamp: new Date()
    });
  } catch (error: unknown) {
    console.error('❌ Dashboard: Error crítico en controlador:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo datos del dashboard',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener datos de gráficos
export const getChartsData = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: ChartFilters = {
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      galpon: req.query.galpon as string,
      raza: req.query.raza as string,
      period: req.query.period as 'week' | 'month' | 'quarter' | 'year' || 'month'
    };

    const chartsData = await getAllChartsData(filters);

    res.status(200).json({
      success: true,
      data: chartsData,
      message: 'Datos de gráficos obtenidos exitosamente',
      timestamp: new Date()
    });
  } catch (error: unknown) {
    console.error('Error obteniendo datos de gráficos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo datos de gráficos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener métricas en tiempo real
export const getRealTimeData = async (req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await getRealTimeMetrics();

    res.status(200).json({
      success: true,
      data: metrics,
      message: 'Métricas en tiempo real obtenidas exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error obteniendo métricas en tiempo real:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo métricas en tiempo real',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener resumen ejecutivo
export const getExecutiveSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: DashboardFilters = {
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
    };

    const metrics = await getDashboardMetrics(filters);
    
    // Crear resumen ejecutivo
    const summary = {
      reproductiveHealth: {
        status: metrics.reproductiveStats.successRate > 80 ? 'Excelente' : 
                metrics.reproductiveStats.successRate > 60 ? 'Bueno' : 'Necesita Atención',
        successRate: metrics.reproductiveStats.successRate,
        activePregnancies: metrics.reproductiveStats.activePregnancies,
        expectedBirths: metrics.reproductiveStats.expectedBirths
      },
      productivity: {
        averageLitterSize: metrics.reproductiveStats.averageLitterSize,
        breedingEfficiency: metrics.performanceMetrics.breedingEfficiency,
        monthlyGrowth: metrics.reproductiveStats.totalBirthsThisMonth - metrics.reproductiveStats.totalBirthsLastMonth
      },
      alerts: {
        overduePregnancies: 0, // Se calculará en el servicio de alertas
        inactiveReproducers: 0, // Se calculará en el servicio de alertas
        capacityWarnings: 0 // Se calculará basado en utilización
      },
      recommendations: generateRecommendations(metrics)
    };

    res.status(200).json({
      success: true,
      data: summary,
      message: 'Resumen ejecutivo obtenido exitosamente',
      timestamp: new Date()
    });
  } catch (error: unknown) {
    console.error('Error obteniendo resumen ejecutivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo resumen ejecutivo',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Generar recomendaciones basadas en métricas
const generateRecommendations = (metrics: unknown) => {
  const recommendations = [];
  const metricsData = metrics as any; // Type assertion para evitar errores de TypeScript

  // Recomendaciones basadas en tasa de éxito
  if (metricsData.reproductiveStats?.successRate < 70) {
    recommendations.push({
      type: 'warning',
      title: 'Tasa de Éxito Baja',
      message: 'La tasa de éxito reproductivo está por debajo del 70%. Considere revisar las condiciones de alimentación y salud.',
      priority: 'high'
    });
  }

  // Recomendaciones basadas en tamaño de camada
  if (metricsData.reproductiveStats?.averageLitterSize < 2.5) {
    recommendations.push({
      type: 'info',
      title: 'Tamaño de Camada Pequeño',
      message: 'El tamaño promedio de camada es menor a 2.5. Evalúe la nutrición y genética de los reproductores.',
      priority: 'medium'
    });
  }

  // Recomendaciones basadas en eficiencia reproductiva
  if (metricsData.performanceMetrics?.breedingEfficiency < 50) {
    recommendations.push({
      type: 'warning',
      title: 'Eficiencia Reproductiva Baja',
      message: 'Menos del 50% de las reproductoras están activas. Considere revisar el programa reproductivo.',
      priority: 'high'
    });
  }

  // Recomendación positiva
  if (metricsData.reproductiveStats?.successRate > 85) {
    recommendations.push({
      type: 'success',
      title: 'Excelente Rendimiento',
      message: 'La granja mantiene una excelente tasa de éxito reproductivo. ¡Continúe con las buenas prácticas!',
      priority: 'low'
    });
  }

  return recommendations;
};

// Obtener filtros disponibles para el dashboard
export const getAvailableFilters = async (req: Request, res: Response): Promise<void> => {
  try {
    // Obtener galpones únicos
    const galpones = await prisma.cuy.findMany({
      select: { galpon: true },
      distinct: ['galpon'],
      where: { estado: 'Activo' }
    });

    // Obtener razas únicas
    const razas = await prisma.cuy.findMany({
      select: { raza: true },
      distinct: ['raza'],
      where: { estado: 'Activo' }
    });

    // Obtener rango de fechas disponibles
    const dateRange = await prisma.camada.aggregate({
      _min: { fechaNacimiento: true },
      _max: { fechaNacimiento: true }
    });

    const filters = {
      galpones: galpones.map(g => g.galpon).sort(),
      razas: razas.map(r => r.raza).sort(),
      dateRange: {
        min: dateRange._min.fechaNacimiento,
        max: dateRange._max.fechaNacimiento
      },
      periods: ['week', 'month', 'quarter', 'year']
    };

    res.status(200).json({
      success: true,
      data: filters,
      message: 'Filtros disponibles obtenidos exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error obteniendo filtros disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo filtros disponibles',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

