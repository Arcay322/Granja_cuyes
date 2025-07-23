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