// Types for optimized reproduction queries and responses

export interface OptimizedPrenez {
  id: number;
  fechaPrenez: Date;
  fechaProbableParto: Date;
  estado: string;
  notas?: string | null;
  fechaCompletada?: Date | null;
  madre: {
    id: number;
    raza: string;
    galpon: string;
    jaula: string;
    etapaVida: string;
    peso: number;
  } | null;
  padre?: {
    id: number;
    raza: string;
    galpon: string;
    jaula: string;
    peso: number;
  } | null;
  camada?: {
    id: number;
    numVivos: number;
    numMuertos: number;
    fechaNacimiento: Date;
  } | null;
  // Calculated fields
  diasGestacion: number;
  diasRestantes: number;
  estadoCalculado: string;
}

export interface OptimizedCamada {
  id: number;
  fechaNacimiento: Date;
  numVivos: number;
  numMuertos: number;
  madre?: {
    id: number;
    raza: string;
    galpon: string;
    jaula: string;
    etapaVida: string;
  } | null;
  padre?: {
    id: number;
    raza: string;
    galpon: string;
    jaula: string;
  } | null;
  prenez?: {
    id: number;
    fechaPrenez: Date;
    estado: string;
  } | null;
  cuyes: {
    id: number;
    raza: string;
    sexo: string;
    peso: number;
    estado: string;
    etapaVida: string;
  }[];
  // Calculated fields
  edadDias: number;
  tasaSupervivencia: number;
  totalCrias: number;
}

export interface CursorPagination {
  cursor?: string;
  take: number;
  orderBy: {
    [key: string]: 'asc' | 'desc';
  };
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextCursor?: string;
    prevCursor?: string;
    total: number;
  };
}

export interface ReproductionFilters {
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  galpon?: string;
  jaula?: string;
  search?: string;
}

export interface ReproductionStatistics {
  resumen: {
    totalPreneces: number;
    prenecesActivas: number;
    prenecesCompletadas: number;
    prenecesFallidas: number;
    totalCamadas: number;
    camadasRecientes: number;
    proximosPartos: number;
    prenecesVencidas: number;
  };
  promedios: {
    criasPorCamada: number;
    vivosPorCamada: number;
    tasaExito: number;
    promedioGestacion: number;
  };
  tendencias: {
    ultimoMes: {
      preneces: number;
      camadas: number;
      tasaExito: number;
    };
    ultimoTrimestre: {
      preneces: number;
      camadas: number;
      tasaExito: number;
    };
  };
}

export interface AvailableReproductor {
  id: number;
  raza: string;
  sexo: string;
  galpon: string;
  jaula: string;
  etapaVida: string;
  peso: number;
  fechaNacimiento: Date;
  estado: string;
  edad: number;
  estaDisponible: boolean;
  estadoReproductivo: 'Disponible' | 'Preñada' | 'Lactando' | 'Descanso' | 'Ocupado';
  historialReproductivo: {
    totalPreneces: number;
    prenecesExitosas: number;
    promedioLitada: number;
    ultimaPrenez?: Date;
    tasaExito: number;
  };
  salud: {
    estado: string;
    pesoOptimo: boolean;
  };
}

export interface CompatibilityResult {
  madreId: number;
  padreId: number;
  compatibilityScore: number;
  nivel: 'Excelente' | 'Buena' | 'Regular' | 'Baja';
  recomendaciones: string[];
  advertencias: string[];
  predicciones: {
    tasaExitoEstimada: number;
    litadaEstimada: number;
    riesgos: string[];
  };
}