// Interfaces para las respuestas de API

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Cuy {
  id: number;
  raza: string;
  sexo: 'M' | 'H';
  galpon: string;
  jaula: string;
  etapaVida: string;
  proposito?: string;
  peso: number;
  fechaNacimiento: string;
  estado: 'Activo' | 'Enfermo' | 'Vendido' | 'Muerto';
  edad?: number;
  fechaRegistro?: string;
  observaciones?: string;
}

export interface Venta {
  id: number;
  fecha: string;
  total: number;
  clienteId: number;
  cliente?: string;
  detalles?: VentaDetalle[];
  estado?: string;
  observaciones?: string;
}

export interface VentaDetalle {
  id: number;
  ventaId: number;
  cuyId: number;
  cuy?: {
    id: number;
    raza: string;
    sexo: string;
    peso: number;
    galpon: string;
    jaula: string;
    etapaVida: string;
    fechaNacimiento: string;
  };
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Gasto {
  id: number;
  fecha: string;
  monto: number;
  categoria: string;
  descripcion?: string;
  proveedor?: string;
  estado?: string;
  comprobante?: string;
}

export interface Prenez {
  id: number;
  madreId: number;
  padreId: number;
  fechaPrenez: string;
  fechaEstimadaParto: string;
  estado: 'Activa' | 'Completada' | 'Fallida';
  observaciones?: string;
  diasGestacion?: number;
}

export interface Galpon {
  id: number;
  nombre: string;
  capacidad: number;
  ubicacion?: string;
  estado: 'Activo' | 'Inactivo';
  fechaCreacion?: string;
  observaciones?: string;
}

export interface Jaula {
  id: number;
  galponId: number;
  numero: string;
  capacidad: number;
  estado: 'Activo' | 'Inactivo';
  ocupacion?: number;
}

export interface Alimento {
  id: number;
  nombre: string;
  tipo: string;
  stock: number;
  unidadMedida: string;
  precioUnitario: number;
  fechaVencimiento?: string;
  proveedor?: string;
  descripcion?: string;
}

export interface HistorialSalud {
  id: number;
  cuyId: number;
  fecha: string;
  tipo: string;
  descripcion: string;
  tratamiento?: string;
  veterinario?: string;
  costo?: number;
  estado: 'Activo' | 'Completado';
}

export interface Cliente {
  id: number;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  fechaRegistro?: string;
  estado: 'Activo' | 'Inactivo';
}

export interface Proveedor {
  id: number;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ruc?: string;
  fechaRegistro?: string;
  estado: 'Activo' | 'Inactivo';
}

// Tipos para estadísticas del dashboard
export interface DashboardStats {
  totalCuyes: number;
  cuyesMachos: number;
  cuyesHembras: number;
  totalVentas: number;
  totalGastos: number;
  ganancia: number;
  ventasDelMes: number;
  gastosDelMes: number;
}

// Tipos para notificaciones
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  date: string;
  link?: string;
}

export interface NotificationConfig {
  enabled: boolean;
  frequency: number;
  types: string[];
}

export interface NotificationRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: any[];
  actions: any[];
}

// Specific API Response Types
export interface CuyesResponse extends ApiResponse<Cuy[]> {}
export interface CuyResponse extends ApiResponse<Cuy> {}

export interface VentasResponse extends ApiResponse<Venta[]> {}
export interface VentaResponse extends ApiResponse<Venta> {}

export interface GastosResponse extends ApiResponse<Gasto[]> {}
export interface GastoResponse extends ApiResponse<Gasto> {}

export interface GalponesResponse extends ApiResponse<Galpon[]> {}
export interface GalponResponse extends ApiResponse<Galpon> {}

export interface JaulasResponse extends ApiResponse<Jaula[]> {}
export interface JaulaResponse extends ApiResponse<Jaula> {}

export interface AlimentosResponse extends ApiResponse<Alimento[]> {}
export interface AlimentoResponse extends ApiResponse<Alimento> {}

export interface HistorialSaludResponse extends ApiResponse<HistorialSalud[]> {}
export interface RegistroSaludResponse extends ApiResponse<HistorialSalud> {}

export interface ClientesResponse extends ApiResponse<Cliente[]> {}
export interface ClienteResponse extends ApiResponse<Cliente> {}

export interface ProveedoresResponse extends ApiResponse<Proveedor[]> {}
export interface ProveedorResponse extends ApiResponse<Proveedor> {}

export interface PrenezResponse extends ApiResponse<Prenez[]> {}
export interface PregnancyResponse extends ApiResponse<Prenez> {}

export interface DashboardStatsResponse extends ApiResponse<DashboardStats> {}

export interface NotificationsResponse extends ApiResponse<Notification[]> {}
export interface NotificationResponse extends ApiResponse<Notification> {}

// Dashboard Metrics Response
export interface DashboardMetricsResponse extends ApiResponse<{
  totalCuyes: number;
  totalGalpones: number;
  totalVentas: number;
  ingresosMensuales: number;
  gastosDelMes: number;
  gananciaDelMes: number;
  cuyesPorEtapa: Record<string, number>;
  ventasPorMes: Array<{ mes: string; total: number }>;
}> {}

// Reports Response Types
export interface ReportJobResponse extends ApiResponse<{
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  templateId: string;
  format: 'pdf' | 'excel' | 'csv';
  createdAt: string;
  updatedAt?: string;
  progress?: number;
  error?: string;
  files?: Array<{
    name: string;
    size: number;
    url: string;
  }>;
}> {}

export interface ReportTemplatesResponse extends ApiResponse<Array<{
  id: string;
  name: string;
  description: string;
  type: 'financial' | 'reproductive' | 'health' | 'inventory';
  formats: string[];
  parameters: Record<string, any>;
}>> {}

export interface ReportHistoryResponse extends ApiResponse<Array<{
  id: string;
  templateId: string;
  format: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  files?: Array<{
    name: string;
    size: number;
    downloadUrl: string;
  }>;
}>> {}

// Calendar/Events Response Types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  type: 'parto' | 'apareamiento' | 'chequeo' | 'vacunacion' | 'destete' | 'evaluacion';
  status: 'programado' | 'completado' | 'vencido' | 'scheduled' | 'completed' | 'overdue';
  allDay: boolean;
  animalId?: number;
  metadata?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
}

export interface ReproductiveEvent extends CalendarEvent {
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEventsResponse extends ApiResponse<CalendarEvent[]> {}
export interface CalendarEventResponse extends ApiResponse<CalendarEvent> {}

// Alerts Response Types
export interface Alert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  createdAt: string;
  animalId?: number;
  metadata?: Record<string, any>;
}

export interface AlertsResponse extends ApiResponse<Alert[]> {}
export interface AlertResponse extends ApiResponse<Alert> {}

export interface AlertChannelsResponse extends ApiResponse<Array<{
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push';
  enabled: boolean;
  config: Record<string, any>;
}>> {}

// Charts Data Response
export interface ChartsDataResponse extends ApiResponse<{
  reproductiveMetrics: {
    totalPregnancies: number;
    activePregancies: number;
    birthsThisMonth: number;
    fertilityRate: number;
  };
  healthMetrics: {
    healthyAnimals: number;
    sickAnimals: number;
    treatmentsThisMonth: number;
    mortalityRate: number;
  };
  financialMetrics: {
    monthlyRevenue: Array<{ month: string; revenue: number }>;
    monthlyExpenses: Array<{ month: string; expenses: number }>;
    profitMargin: number;
  };
}> {}

// Error Response Types
export interface ApiError {
  response?: {
    data?: {
      message?: string;
      error?: string;
      details?: any;
    };
    status?: number;
    statusText?: string;
  };
  request?: any;
  message?: string;
  code?: string;
}

// Authentication Response Types
export interface LoginResponse extends ApiResponse<{
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}> {}

export interface RegisterResponse extends ApiResponse<{
  user: {
    id: number;
    email: string;
    name: string;
  };
}> {}

// Validation Response Types
export interface ValidationResponse extends ApiResponse<{
  valid: boolean;
  errors?: Record<string, string[]>;
  warnings?: string[];
}> {}

// Material UI Types
export type MuiColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

export type ChipColor = MuiColor;

export type AlertSeverity = 'error' | 'warning' | 'info' | 'success';

// Form Event Types
export interface SelectChangeEvent<T = string | number> {
  target: {
    name?: string;
    value: T;
  };
}

// Loading State Types
export interface LoadingState<T = unknown> {
  isLoading: boolean;
  error: string | null;
  data: T | null;
}

// Form State Types
export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isValid: boolean;
}