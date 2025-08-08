import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Alert {
  id: string;
  type: AlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data: any;
  createdAt: Date;
  readAt?: Date;
  actionTaken?: string;
  userId?: number;
  relatedEntityId?: number;
  relatedEntityType?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  type: AlertType;
  conditions: AlertCondition[];
  actions: AlertAction[];
  enabled: boolean;
  userId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'between' | 'contains';
  value: any;
  unit?: string;
}

export interface AlertAction {
  type: 'notification' | 'email' | 'webhook';
  config: any;
}

export type AlertType = 
  | 'birth_reminder' 
  | 'overdue_pregnancy' 
  | 'inactive_reproducer' 
  | 'capacity_warning'
  | 'health_check_due'
  | 'breeding_opportunity'
  | 'performance_decline';

// Simulación de almacenamiento en memoria (en producción usar base de datos)
let alerts: Alert[] = [];
let alertRules: AlertRule[] = [];
let alertIdCounter = 1;

// Generar ID único para alertas
const generateAlertId = (): string => {
  return `alert_${alertIdCounter++}_${Date.now()}`;
};

// Crear nueva alerta
export const createAlert = async (alertData: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert> => {
  const alert: Alert = {
    ...alertData,
    id: generateAlertId(),
    createdAt: new Date()
  };

  alerts.push(alert);
  
  // Log para debugging
  console.log(`🚨 Nueva alerta creada: ${alert.type} - ${alert.title}`);
  
  return alert;
};

// Obtener todas las alertas
export const getAllAlerts = async (filters?: {
  type?: AlertType;
  severity?: string;
  read?: boolean;
  userId?: number;
}): Promise<Alert[]> => {
  let filteredAlerts = [...alerts];

  if (filters) {
    if (filters.type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === filters.type);
    }
    if (filters.severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === filters.severity);
    }
    if (filters.read !== undefined) {
      filteredAlerts = filteredAlerts.filter(alert => 
        filters.read ? alert.readAt !== undefined : alert.readAt === undefined
      );
    }
    if (filters.userId) {
      filteredAlerts = filteredAlerts.filter(alert => alert.userId === filters.userId);
    }
  }

  return filteredAlerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

// Marcar alerta como leída
export const markAlertAsRead = async (alertId: string, actionTaken?: string): Promise<Alert | null> => {
  const alertIndex = alerts.findIndex(alert => alert.id === alertId);
  
  if (alertIndex === -1) {
    return null;
  }

  alerts[alertIndex].readAt = new Date();
  if (actionTaken) {
    alerts[alertIndex].actionTaken = actionTaken;
  }

  return alerts[alertIndex];
};

// Eliminar alerta
export const deleteAlert = async (alertId: string): Promise<boolean> => {
  const alertIndex = alerts.findIndex(alert => alert.id === alertId);
  
  if (alertIndex === -1) {
    return false;
  }

  alerts.splice(alertIndex, 1);
  return true;
};

// Obtener estadísticas de alertas
export const getAlertStats = async (): Promise<{
  total: number;
  unread: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
}> => {
  const total = alerts.length;
  const unread = alerts.filter(alert => !alert.readAt).length;
  
  const bySeverity = alerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byType = alerts.reduce((acc, alert) => {
    acc[alert.type] = (acc[alert.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total,
    unread,
    bySeverity,
    byType
  };
};

// Generar alertas de recordatorio de partos
export const generateBirthReminders = async (): Promise<Alert[]> => {
  const generatedAlerts: Alert[] = [];

  try {
    // Partos en los próximos 7 días
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const upcomingBirths = await prisma.prenez.findMany({
      where: {
        estado: 'activa',
        fechaProbableParto: {
          lte: sevenDaysFromNow,
          gte: new Date()
        }
      }
    });

    for (const prenez of upcomingBirths) {
      const daysUntilBirth = Math.ceil(
        (prenez.fechaProbableParto.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      let severity: Alert['severity'] = 'medium';
      if (daysUntilBirth <= 1) severity = 'critical';
      else if (daysUntilBirth <= 3) severity = 'high';

      const alert = await createAlert({
        type: 'birth_reminder',
        severity,
        title: `Parto próximo en ${daysUntilBirth} día(s)`,
        message: `La hembra ID ${prenez.madreId} tiene parto programado para ${prenez.fechaProbableParto.toLocaleDateString()}`,
        data: {
          prenezId: prenez.id,
          madreId: prenez.madreId,
          fechaProbableParto: prenez.fechaProbableParto,
          daysUntilBirth
        },
        relatedEntityId: prenez.id,
        relatedEntityType: 'prenez'
      });

      generatedAlerts.push(alert);
    }

    console.log(`✅ Generadas ${generatedAlerts.length} alertas de recordatorio de partos`);
    return generatedAlerts;
  } catch (error) {
    console.error('Error generando alertas de recordatorio de partos:', error);
    return [];
  }
};

// Generar alertas de preñeces vencidas
export const generateOverduePregnancyAlerts = async (): Promise<Alert[]> => {
  const generatedAlerts: Alert[] = [];

  try {
    // Preñeces que exceden 75 días (período normal: 65-70 días)
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 75);

    const overduePregnancies = await prisma.prenez.findMany({
      where: {
        estado: 'activa',
        fechaPrenez: {
          lte: overdueDate
        }
      }
    });

    for (const prenez of overduePregnancies) {
      const daysOverdue = Math.floor(
        (new Date().getTime() - prenez.fechaPrenez.getTime()) / (1000 * 60 * 60 * 24)
      ) - 70; // 70 días es el período normal máximo

      const alert = await createAlert({
        type: 'overdue_pregnancy',
        severity: 'high',
        title: `Preñez vencida - ${daysOverdue} días de retraso`,
        message: `La hembra ID ${prenez.madreId} tiene una preñez que excede el período normal por ${daysOverdue} días`,
        data: {
          prenezId: prenez.id,
          madreId: prenez.madreId,
          fechaPrenez: prenez.fechaPrenez,
          daysOverdue
        },
        relatedEntityId: prenez.id,
        relatedEntityType: 'prenez'
      });

      generatedAlerts.push(alert);
    }

    console.log(`✅ Generadas ${generatedAlerts.length} alertas de preñeces vencidas`);
    return generatedAlerts;
  } catch (error) {
    console.error('Error generando alertas de preñeces vencidas:', error);
    return [];
  }
};

// Generar alertas de reproductoras inactivas
export const generateInactiveReproducerAlerts = async (): Promise<Alert[]> => {
  const generatedAlerts: Alert[] = [];

  try {
    // Reproductoras sin actividad en los últimos 90 días
    const inactiveDate = new Date();
    inactiveDate.setDate(inactiveDate.getDate() - 90);

    const reproductoras = await prisma.cuy.findMany({
      where: {
        sexo: 'H',
        etapaVida: 'Reproductora',
        estado: 'Activo'
      }
    });

    for (const reproductora of reproductoras) {
      const recentPregnancies = await prisma.prenez.count({
        where: {
          madreId: reproductora.id,
          fechaPrenez: {
            gte: inactiveDate
          }
        }
      });

      if (recentPregnancies === 0) {
        const alert = await createAlert({
          type: 'inactive_reproducer',
          severity: 'medium',
          title: `Reproductora inactiva - ${reproductora.raza}`,
          message: `La hembra ID ${reproductora.id} (${reproductora.galpon}-${reproductora.jaula}) no ha tenido actividad reproductiva en los últimos 90 días`,
          data: {
            cuyId: reproductora.id,
            raza: reproductora.raza,
            galpon: reproductora.galpon,
            jaula: reproductora.jaula,
            inactiveDays: 90
          },
          relatedEntityId: reproductora.id,
          relatedEntityType: 'cuy'
        });

        generatedAlerts.push(alert);
      }
    }

    console.log(`✅ Generadas ${generatedAlerts.length} alertas de reproductoras inactivas`);
    return generatedAlerts;
  } catch (error) {
    console.error('Error generando alertas de reproductoras inactivas:', error);
    return [];
  }
};

// Generar alertas de capacidad
export const generateCapacityWarningAlerts = async (): Promise<Alert[]> => {
  const generatedAlerts: Alert[] = [];

  try {
    // Obtener ocupación por galpón
    const galponOccupancy = await prisma.cuy.groupBy({
      by: ['galpon'],
      where: {
        estado: 'Activo'
      },
      _count: {
        id: true
      }
    });

    const capacidadMaximaPorGalpon = 50; // Valor por defecto

    for (const occupancy of galponOccupancy) {
      const utilizationPercentage = (occupancy._count.id / capacidadMaximaPorGalpon) * 100;

      if (utilizationPercentage >= 90) {
        let severity: Alert['severity'] = 'high';
        if (utilizationPercentage >= 95) severity = 'critical';

        const alert = await createAlert({
          type: 'capacity_warning',
          severity,
          title: `Capacidad crítica en ${occupancy.galpon}`,
          message: `El galpón ${occupancy.galpon} está al ${utilizationPercentage.toFixed(1)}% de su capacidad (${occupancy._count.id}/${capacidadMaximaPorGalpon})`,
          data: {
            galpon: occupancy.galpon,
            currentOccupancy: occupancy._count.id,
            maxCapacity: capacidadMaximaPorGalpon,
            utilizationPercentage
          },
          relatedEntityType: 'galpon'
        });

        generatedAlerts.push(alert);
      }
    }

    console.log(`✅ Generadas ${generatedAlerts.length} alertas de capacidad`);
    return generatedAlerts;
  } catch (error) {
    console.error('Error generando alertas de capacidad:', error);
    return [];
  }
};

// Generar todas las alertas automáticas
export const generateAllAlerts = async (): Promise<{
  birthReminders: Alert[];
  overduePregnancies: Alert[];
  inactiveReproducers: Alert[];
  capacityWarnings: Alert[];
}> => {
  console.log('🔄 Iniciando generación de alertas automáticas...');

  const [
    birthReminders,
    overduePregnancies,
    inactiveReproducers,
    capacityWarnings
  ] = await Promise.all([
    generateBirthReminders(),
    generateOverduePregnancyAlerts(),
    generateInactiveReproducerAlerts(),
    generateCapacityWarningAlerts()
  ]);

  const totalGenerated = birthReminders.length + overduePregnancies.length + 
                         inactiveReproducers.length + capacityWarnings.length;

  console.log(`✅ Generación de alertas completada. Total: ${totalGenerated} alertas`);

  return {
    birthReminders,
    overduePregnancies,
    inactiveReproducers,
    capacityWarnings
  };
};

// Limpiar alertas antiguas (más de 30 días)
export const cleanupOldAlerts = async (): Promise<number> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const initialCount = alerts.length;
  alerts = alerts.filter(alert => alert.createdAt > thirtyDaysAgo);
  const removedCount = initialCount - alerts.length;

  console.log(`🧹 Limpieza de alertas: ${removedCount} alertas antiguas eliminadas`);
  return removedCount;
};