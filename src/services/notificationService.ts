import { useNotifications } from '../contexts/NotificationContext';
import type { Notification } from '../types/notifications';
import type { Prenez, Alimento, Venta, Gasto, ApiResponse } from '../types/api';
import api from './api';

class NotificationService {
  protected notifications: () => any;
  
  constructor() {
    this.notifications = () => null;
  }

  // Crear notificación toast de éxito (para acciones del usuario)
  success(title: string, message: string, category: Notification['category'] = 'system') {
    this.notifications().addNotification({
      title,
      message,
      type: 'success',
      category,
      priority: 'low', // Los toasts tienen prioridad baja
    });
  }

  // Crear notificación toast de error (para acciones del usuario)
  error(title: string, message: string, category: Notification['category'] = 'system') {
    this.notifications().addNotification({
      title,
      message,
      type: 'error',
      category,
      priority: 'low', // Los toasts tienen prioridad baja
    });
  }

  // Crear notificación toast de advertencia (para acciones del usuario)
  warning(title: string, message: string, category: Notification['category'] = 'system') {
    this.notifications().addNotification({
      title,
      message,
      type: 'warning',
      category,
      priority: 'low', // Los toasts tienen prioridad baja
    });
  }

  // Crear notificación toast informativa (para acciones del usuario)
  info(title: string, message: string, category: Notification['category'] = 'system') {
    this.notifications().addNotification({
      title,
      message,
      type: 'info',
      category,
      priority: 'low', // Los toasts tienen prioridad baja
    });
  }

  // Verificar stock bajo
  async checkLowStock() {
    try {
      const response = await api.get('/alimentos');
      const alimentos = response.data;
      
      const alimentosData = (alimentos as ApiResponse<Alimento[]>)?.data || (alimentos as Alimento[]) || [];
      const lowStockItems = alimentosData.filter((item: Alimento) => item.stock < 10);
      
      lowStockItems.forEach((item: any) => {
        this.warning(
          'Stock Bajo',
          `${item.nombre} tiene solo ${item.stock} ${item.unidad} en stock`,
          'stock'
        );
      });
    } catch (error) {
      console.error('Error checking stock:', error);
    }
  }

  // Verificar partos próximos
  async checkUpcomingBirths() {
    try {
      const response = await api.get('/reproduccion/prenez');
      const prenezList = response.data;
      
      const today = new Date();
      const inThreeDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      const prenezData = (prenezList as ApiResponse<Prenez[]>)?.data || (prenezList as Prenez[]) || [];
      const upcomingBirths = prenezData.filter((prenez: Prenez) => {
        const birthDate = new Date(prenez.fechaEstimadaParto);
        return birthDate >= today && birthDate <= inThreeDays && prenez.estado === 'Activa';
      });

      upcomingBirths.forEach((prenez: Prenez) => {
        const daysLeft = Math.ceil((new Date(prenez.fechaEstimadaParto).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        this.info(
          'Parto Próximo',
          `Preñez ID ${prenez.id} dará a luz en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`,
          'reproductive'
        );
      });
    } catch (error) {
      console.error('Error checking births:', error);
    }
  }

  // Verificar ventas grandes
  async checkLargeSales() {
    try {
      const response = await api.get('/ventas');
      const ventas = response.data;
      
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      const ventasData = (ventas as ApiResponse<Venta[]>)?.data || (ventas as Venta[]) || [];
      const todaysSales = ventasData.filter((venta: Venta) => 
        venta.fecha.startsWith(todayString) && venta.total > 500
      );

      todaysSales.forEach((venta: Venta) => {
        this.success(
          'Venta Importante',
          `Venta de S/ ${venta.total.toFixed(2)} registrada hoy`,
          'sales'
        );
      });
    } catch (error) {
      console.error('Error checking sales:', error);
    }
  }

  // Verificar gastos altos
  async checkHighExpenses() {
    try {
      const response = await api.get('/gastos');
      const gastos = response.data;
      
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      const gastosData = (gastos as ApiResponse<Gasto[]>)?.data || (gastos as Gasto[]) || [];
      const todaysExpenses = gastosData.filter((gasto: Gasto) => 
        gasto.fecha.startsWith(todayString) && gasto.monto > 300
      );

      todaysExpenses.forEach((gasto: Gasto) => {
        this.warning(
          'Gasto Alto',
          `${gasto.descripcion || 'Gasto'}: S/ ${gasto.monto.toFixed(2)}`,
          'system'
        );
      });
    } catch (error) {
      console.error('Error checking expenses:', error);
    }
  }

  // Ejecutar todas las verificaciones automáticas
  async runAutomaticChecks() {
    const { config } = this.notifications();
    
    if (config.stockAlerts) {
      await this.checkLowStock();
    }
    
    if (config.reproductiveAlerts) {
      await this.checkUpcomingBirths();
    }
    
    if (config.salesNotifications) {
      await this.checkLargeSales();
    }
    
    // Siempre verificar gastos altos
    await this.checkHighExpenses();
  }

  // Notificación para operaciones CRUD
  crudSuccess(operation: 'crear' | 'actualizar' | 'eliminar', entity: string) {
    const operations = {
      crear: 'creado',
      actualizar: 'actualizado', 
      eliminar: 'eliminado'
    };
    
    this.success(
      `${entity} ${operations[operation]}`,
      `El ${entity.toLowerCase()} se ${operations[operation]} exitosamente`,
      'system'
    );
  }

  crudError(operation: 'crear' | 'actualizar' | 'eliminar', entity: string) {
    const operations = {
      crear: 'crear',
      actualizar: 'actualizar',
      eliminar: 'eliminar'
    };
    
    this.error(
      `Error al ${operations[operation]} ${entity.toLowerCase()}`,
      `No se pudo ${operations[operation]} el ${entity.toLowerCase()}. Intenta de nuevo.`,
      'system'
    );
  }
}

// Hook para usar el servicio con el contexto de notificaciones
export const useNotificationService = () => {
  const notificationContext = useNotifications();
  
  class NotificationServiceWithContext extends NotificationService {
    protected notifications = () => notificationContext;
  }
  
  const service = new NotificationServiceWithContext();
  
  return service;
};

export default NotificationService;
