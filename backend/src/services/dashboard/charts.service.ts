import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
  }>;
}

export interface ChartFilters {
  dateFrom?: Date;
  dateTo?: Date;
  galpon?: string;
  raza?: string;
  period?: 'week' | 'month' | 'quarter' | 'year';
}

// Gráfico de nacimientos por mes
export const getBirthsChart = async (filters: ChartFilters = {}): Promise<ChartData> => {
  const { period = 'month', dateFrom, dateTo } = filters;
  
  let dateFormat: string;
  let intervalClause: string;
  
  switch (period) {
    case 'week':
      dateFormat = 'YYYY-"W"WW';
      intervalClause = '12 weeks';
      break;
    case 'quarter':
      dateFormat = 'YYYY-Q';
      intervalClause = '2 years';
      break;
    case 'year':
      dateFormat = 'YYYY';
      intervalClause = '5 years';
      break;
    default:
      dateFormat = 'YYYY-MM';
      intervalClause = '12 months';
  }

  const query = `
    SELECT 
      TO_CHAR("fechaNacimiento", '${dateFormat}') as period,
      COUNT(*) as total_births,
      SUM("numVivos") as live_births,
      SUM("numMuertos") as dead_births
    FROM "Camada"
    WHERE "fechaNacimiento" >= NOW() - INTERVAL '${intervalClause}'
    ${dateFrom && dateTo ? `AND "fechaNacimiento" BETWEEN '${dateFrom.toISOString()}' AND '${dateTo.toISOString()}'` : ''}
    GROUP BY TO_CHAR("fechaNacimiento", '${dateFormat}')
    ORDER BY period
  `;

  const results: any[] = await prisma.$queryRawUnsafe(query);

  const labels = results.map(r => r.period);
  const liveBirths = results.map(r => Number(r.live_births));
  const deadBirths = results.map(r => Number(r.dead_births));

  return {
    labels,
    datasets: [
      {
        label: 'Crías Vivas',
        data: liveBirths,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2
      },
      {
        label: 'Crías Muertas',
        data: deadBirths,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2
      }
    ]
  };
};

// Gráfico de tasa de éxito reproductivo
export const getSuccessRateChart = async (filters: ChartFilters = {}): Promise<ChartData> => {
  const { period = 'month' } = filters;
  
  let dateFormat: string;
  let intervalClause: string;
  
  switch (period) {
    case 'week':
      dateFormat = 'YYYY-"W"WW';
      intervalClause = '12 weeks';
      break;
    case 'quarter':
      dateFormat = 'YYYY-Q';
      intervalClause = '2 years';
      break;
    case 'year':
      dateFormat = 'YYYY';
      intervalClause = '5 years';
      break;
    default:
      dateFormat = 'YYYY-MM';
      intervalClause = '12 months';
  }

  const query = `
    SELECT 
      TO_CHAR("fechaNacimiento", '${dateFormat}') as period,
      ROUND((SUM("numVivos")::float / NULLIF(SUM("numVivos" + "numMuertos"), 0)) * 100, 2) as success_rate,
      ROUND(AVG("numVivos"), 2) as avg_litter_size
    FROM "Camada"
    WHERE "fechaNacimiento" >= NOW() - INTERVAL '${intervalClause}'
    GROUP BY TO_CHAR("fechaNacimiento", '${dateFormat}')
    ORDER BY period
  `;

  const results: any[] = await prisma.$queryRawUnsafe(query);

  const labels = results.map(r => r.period);
  const successRates = results.map(r => Number(r.success_rate) || 0);
  const avgLitterSizes = results.map(r => Number(r.avg_litter_size) || 0);

  return {
    labels,
    datasets: [
      {
        label: 'Tasa de Éxito (%)',
        data: successRates,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        fill: false
      },
      {
        label: 'Tamaño Promedio de Camada',
        data: avgLitterSizes,
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 2,
        fill: false
      }
    ]
  };
};

// Gráfico de distribución por raza
export const getBreedDistributionChart = async (filters: ChartFilters = {}): Promise<ChartData> => {
  const query = `
    SELECT 
      c.raza,
      COUNT(*) as total_animals,
      COUNT(CASE WHEN c.sexo = 'H' AND c."etapaVida" = 'Reproductora' THEN 1 END) as reproductive_females,
      COUNT(CASE WHEN c.sexo = 'M' AND c."etapaVida" = 'Reproductor' THEN 1 END) as reproductive_males
    FROM "Cuy" c
    WHERE c.estado = 'Activo'
    GROUP BY c.raza
    ORDER BY total_animals DESC
  `;

  const results: any[] = await prisma.$queryRawUnsafe(query);

  const labels = results.map(r => r.raza);
  const totalAnimals = results.map(r => Number(r.total_animals));
  const reproductiveFemales = results.map(r => Number(r.reproductive_females));
  const reproductiveMales = results.map(r => Number(r.reproductive_males));

  // Colores para las razas
  const colors = [
    'rgba(255, 99, 132, 0.8)',
    'rgba(54, 162, 235, 0.8)',
    'rgba(255, 205, 86, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 159, 64, 0.8)'
  ];

  return {
    labels,
    datasets: [
      {
        label: 'Total de Animales',
        data: totalAnimals,
        backgroundColor: colors.slice(0, labels.length)
      },
      {
        label: 'Hembras Reproductoras',
        data: reproductiveFemales,
        backgroundColor: colors.slice(0, labels.length).map(color => color.replace('0.8', '0.6'))
      },
      {
        label: 'Machos Reproductores',
        data: reproductiveMales,
        backgroundColor: colors.slice(0, labels.length).map(color => color.replace('0.8', '0.4'))
      }
    ]
  };
};

// Gráfico de utilización de capacidad por galpón
export const getCapacityUtilizationChart = async (filters: ChartFilters = {}): Promise<ChartData> => {
  const query = `
    SELECT 
      galpon,
      COUNT(*) as current_occupancy,
      50 as max_capacity,
      ROUND((COUNT(*)::float / 50) * 100, 1) as utilization_percentage
    FROM "Cuy"
    WHERE estado = 'Activo'
    GROUP BY galpon
    ORDER BY galpon
  `;

  const results: any[] = await prisma.$queryRawUnsafe(query);

  const labels = results.map(r => r.galpon);
  const currentOccupancy = results.map(r => Number(r.current_occupancy));
  const maxCapacity = results.map(r => Number(r.max_capacity));
  const utilizationPercentage = results.map(r => Number(r.utilization_percentage));

  return {
    labels,
    datasets: [
      {
        label: 'Ocupación Actual',
        data: currentOccupancy,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2
      },
      {
        label: 'Capacidad Máxima',
        data: maxCapacity,
        backgroundColor: 'rgba(201, 203, 207, 0.6)',
        borderColor: 'rgba(201, 203, 207, 1)',
        borderWidth: 2
      },
      {
        label: 'Porcentaje de Utilización',
        data: utilizationPercentage,
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 2
      }
    ]
  };
};

// Gráfico de rendimiento reproductivo por edad
export const getPerformanceByAgeChart = async (filters: ChartFilters = {}): Promise<ChartData> => {
  const query = `
    SELECT 
      CASE 
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, c."fechaNacimiento")) < 1 THEN 'Menos de 1 año'
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, c."fechaNacimiento")) BETWEEN 1 AND 2 THEN '1-2 años'
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, c."fechaNacimiento")) BETWEEN 2 AND 3 THEN '2-3 años'
        ELSE 'Más de 3 años'
      END as age_group,
      COUNT(cam.id) as total_litters,
      AVG(cam."numVivos") as avg_live_offspring,
      ROUND((SUM(cam."numVivos")::float / NULLIF(SUM(cam."numVivos" + cam."numMuertos"), 0)) * 100, 2) as success_rate
    FROM "Cuy" c
    LEFT JOIN "Camada" cam ON c.id = cam."madreId"
    WHERE c.sexo = 'H' 
      AND c."etapaVida" = 'Reproductora'
      AND c.estado = 'Activo'
      AND cam.id IS NOT NULL
    GROUP BY age_group
    ORDER BY 
      CASE age_group
        WHEN 'Menos de 1 año' THEN 1
        WHEN '1-2 años' THEN 2
        WHEN '2-3 años' THEN 3
        ELSE 4
      END
  `;

  const results: any[] = await prisma.$queryRawUnsafe(query);

  const labels = results.map(r => r.age_group);
  const totalLitters = results.map(r => Number(r.total_litters));
  const avgLiveOffspring = results.map(r => Number(r.avg_live_offspring) || 0);
  const successRates = results.map(r => Number(r.success_rate) || 0);

  return {
    labels,
    datasets: [
      {
        label: 'Total de Camadas',
        data: totalLitters,
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 2
      },
      {
        label: 'Promedio Crías Vivas',
        data: avgLiveOffspring,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2
      },
      {
        label: 'Tasa de Éxito (%)',
        data: successRates,
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 2
      }
    ]
  };
};

// Función principal para obtener todos los datos de gráficos
export const getAllChartsData = async (filters: ChartFilters = {}) => {
  try {
    const [
      birthsChart,
      successRateChart,
      breedDistributionChart,
      capacityChart,
      performanceByAgeChart
    ] = await Promise.all([
      getBirthsChart(filters),
      getSuccessRateChart(filters),
      getBreedDistributionChart(filters),
      getCapacityUtilizationChart(filters),
      getPerformanceByAgeChart(filters)
    ]);

    return {
      birthsChart,
      successRateChart,
      breedDistributionChart,
      capacityChart,
      performanceByAgeChart
    };
  } catch (error) {
    console.error('Error obteniendo datos de gráficos:', error);
    throw error;
  }
};