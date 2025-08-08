import { PrismaClient } from '@prisma/client';
import { webSocketService } from '../websocket/websocket.service';
import { cacheInvalidation } from '../cache.service';
import { dashboardCache } from '../cache.service';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

/**
 * Servicio de integración para conectar las funcionalidades de Fase 2
 * con el módulo de reproducción existente
 */
export class ReproductionIntegrationService {
  
  /**
   * Sincronizar datos de reproducción con dashboard en tiempo real
   */
  public static async syncReproductionWithDashboard(
    entity: 'prenez' | 'camada',
    action: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    try {
      // Invalidar caché del dashboard
      dashboardCache.invalidateDashboardCache();
      
      // Notificar cambios via WebSocket
      webSocketService.broadcastDashboardUpdate({
        type: 'reproduction_update',
        entity,
        action,
        data,
        timestamp: new Date().toISOString()
      });

      // Generar alertas automáticas si es necesario
      await this.generateAutomaticAlerts(entity, action, data);

      logger.info(`Reproduction data synced with dashboard: ${entity} ${action}`);
    } catch (error) {
      logger.error('Error syncing reproduction with dashboard:', error);
    }
  }

  /**
   * Generar alertas automáticas basadas en cambios de reproducción
   */
  private static async generateAutomaticAlerts(
    entity: string,
    action: string,
    data: any
  ): Promise<void> {
    try {
      switch (entity) {
        case 'prenez':
          if (action === 'create') {
            await this.createPregnancyAlerts(data);
          }
          break;
        
        case 'camada':
          if (action === 'create') {
            await this.createBirthAlerts(data);
          }
          break;
      }
    } catch (error) {
      logger.error('Error generating automatic alerts:', error);
    }
  }

  /**
   * Crear alertas automáticas para nuevas preñeces
   */
  private static async createPregnancyAlerts(prenezData: any): Promise<void> {
    const fechaProbableParto = new Date(prenezData.fechaProbableParto);
    const now = new Date();
    
    // Alerta de recordatorio de parto (7 días antes)
    const reminderDate = new Date(fechaProbableParto);
    reminderDate.setDate(reminderDate.getDate() - 7);
    
    if (reminderDate > now) {
      webSocketService.broadcastAlert({
        type: 'birth_reminder',
        priority: 'medium',
        title: 'Recordatorio de Parto Próximo',
        message: `La hembra ${prenezData.madreId} tiene parto programado para ${fechaProbableParto.toLocaleDateString()}`,
        data: {
          prenezId: prenezData.id,
          madreId: prenezData.madreId,
          fechaProbableParto: fechaProbableParto
        },
        scheduledFor: reminderDate
      });
    }

    // Alerta de preñez vencida (75 días después de la preñez)
    const overdueDate = new Date(prenezData.fechaPrenez);
    overdueDate.setDate(overdueDate.getDate() + 75);
    
    if (overdueDate < now) {
      webSocketService.broadcastAlert({
        type: 'pregnancy_overdue',
        priority: 'high',
        title: 'Preñez Vencida',
        message: `La preñez de la hembra ${prenezData.madreId} está vencida`,
        data: {
          prenezId: prenezData.id,
          madreId: prenezData.madreId,
          daysSincePrenez: Math.floor((now.getTime() - new Date(prenezData.fechaPrenez).getTime()) / (1000 * 60 * 60 * 24))
        }
      });
    }
  }

  /**
   * Crear alertas automáticas para nuevos nacimientos
   */
  private static async createBirthAlerts(camadaData: any): Promise<void> {
    // Alerta de nacimiento exitoso
    webSocketService.broadcastAlert({
      type: 'birth_success',
      priority: 'low',
      title: 'Nacimiento Registrado',
      message: `Nueva camada registrada: ${camadaData.numVivos} crías vivas, ${camadaData.numMuertos} muertas`,
      data: {
        camadaId: camadaData.id,
        madreId: camadaData.madreId,
        numVivos: camadaData.numVivos,
        numMuertos: camadaData.numMuertos
      }
    });

    // Alerta de alta mortalidad si es necesario
    const totalCrias = camadaData.numVivos + camadaData.numMuertos;
    const mortalityRate = totalCrias > 0 ? (camadaData.numMuertos / totalCrias) * 100 : 0;
    
    if (mortalityRate > 30) { // Más del 30% de mortalidad
      webSocketService.broadcastAlert({
        type: 'high_mortality',
        priority: 'high',
        title: 'Alta Mortalidad en Camada',
        message: `Camada con ${mortalityRate.toFixed(1)}% de mortalidad`,
        data: {
          camadaId: camadaData.id,
          madreId: camadaData.madreId,
          mortalityRate: mortalityRate
        }
      });
    }
  }

  /**
   * Integrar eventos de calendario con datos de reproducción
   */
  public static async syncWithCalendar(
    entity: 'prenez' | 'camada',
    action: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    try {
      switch (entity) {
        case 'prenez':
          await this.syncPregnancyWithCalendar(action, data);
          break;
        
        case 'camada':
          await this.syncBirthWithCalendar(action, data);
          break;
      }
    } catch (error) {
      logger.error('Error syncing with calendar:', error);
    }
  }

  /**
   * Sincronizar preñeces con calendario
   */
  private static async syncPregnancyWithCalendar(action: string, prenezData: any): Promise<void> {
    const calendarEvent = {
      id: `prenez_${prenezData.id}`,
      title: `Preñez - Hembra ${prenezData.madreId}`,
      type: 'breeding',
      startDate: prenezData.fechaPrenez,
      endDate: prenezData.fechaProbableParto,
      motherId: prenezData.madreId,
      fatherId: prenezData.padreId,
      status: prenezData.estado,
      description: `Preñez registrada el ${new Date(prenezData.fechaPrenez).toLocaleDateString()}`
    };

    webSocketService.broadcastCalendarUpdate(calendarEvent, action as any);
  }

  /**
   * Sincronizar nacimientos con calendario
   */
  private static async syncBirthWithCalendar(action: string, camadaData: any): Promise<void> {
    const calendarEvent = {
      id: `camada_${camadaData.id}`,
      title: `Nacimiento - ${camadaData.numVivos} crías`,
      type: 'birth',
      date: camadaData.fechaNacimiento,
      motherId: camadaData.madreId,
      fatherId: camadaData.padreId,
      description: `${camadaData.numVivos} crías vivas, ${camadaData.numMuertos} muertas`
    };

    webSocketService.broadcastCalendarUpdate(calendarEvent, action as any);
  }

  /**
   * Generar reportes automáticos basados en eventos de reproducción
   */
  public static async generateAutomaticReports(
    entity: 'prenez' | 'camada',
    data: any
  ): Promise<void> {
    try {
      // Notificar que hay nuevos datos disponibles para reportes
      webSocketService.broadcastReportUpdate('data_updated', 'completed');

      // Invalidar caché de reportes para forzar regeneración
      const { reportsCache } = await import('../cache.service');
      reportsCache.invalidateReportsCache();

      logger.info(`Automatic reports updated for ${entity} data`);
    } catch (error) {
      logger.error('Error generating automatic reports:', error);
    }
  }

  /**
   * Validar integridad de datos entre módulos
   */
  public static async validateDataIntegrity(): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Verificar preñeces sin camadas después de fecha probable de parto
      const overduePregnancies = await prisma.prenez.findMany({
        where: {
          estado: 'activa',
          fechaProbableParto: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 días atrás
          }
        },
        include: {
          camada: true
        }
      });

      overduePregnancies.forEach(prenez => {
        if (!prenez.camada) {
          issues.push(`Preñez ${prenez.id} vencida sin camada registrada`);
        }
      });

      // Verificar camadas sin preñez asociada
      const orphanLitters = await prisma.camada.findMany({
        where: {
          prenezId: null,
          madreId: { not: null }
        }
      });

      if (orphanLitters.length > 0) {
        issues.push(`${orphanLitters.length} camadas sin preñez asociada`);
      }

      // Verificar cuyes sin camada pero con camadaId
      const orphanCuyes = await prisma.cuy.findMany({
        where: {
          camadaId: { not: null },
          camada: null
        }
      });

      if (orphanCuyes.length > 0) {
        issues.push(`${orphanCuyes.length} cuyes con camadaId inválido`);
      }

      return {
        isValid: issues.length === 0,
        issues
      };
    } catch (error) {
      logger.error('Error validating data integrity:', error);
      return {
        isValid: false,
        issues: ['Error validating data integrity']
      };
    }
  }

  /**
   * Migrar datos existentes para compatibilidad con Fase 2
   */
  public static async migrateExistingData(): Promise<{
    success: boolean;
    migratedRecords: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let migratedRecords = 0;

    try {
      // Migrar preñeces existentes sin eventos de calendario
      const pregnanciesWithoutEvents = await prisma.prenez.findMany({
        where: {
          estado: 'activa'
        }
      });

      for (const prenez of pregnanciesWithoutEvents) {
        try {
          await this.syncPregnancyWithCalendar('create', prenez);
          migratedRecords++;
        } catch (error) {
          errors.push(`Error migrating prenez ${prenez.id}: ${error}`);
        }
      }

      // Migrar camadas recientes sin eventos de calendario
      const recentLitters = await prisma.camada.findMany({
        where: {
          fechaNacimiento: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
          }
        }
      });

      for (const camada of recentLitters) {
        try {
          await this.syncBirthWithCalendar('create', camada);
          migratedRecords++;
        } catch (error) {
          errors.push(`Error migrating camada ${camada.id}: ${error}`);
        }
      }

      logger.info(`Migration completed: ${migratedRecords} records migrated, ${errors.length} errors`);

      return {
        success: errors.length === 0,
        migratedRecords,
        errors
      };
    } catch (error) {
      logger.error('Error during data migration:', error);
      return {
        success: false,
        migratedRecords,
        errors: [...errors, `Migration failed: ${error}`]
      };
    }
  }

  /**
   * Obtener estadísticas de integración
   */
  public static async getIntegrationStats(): Promise<{
    totalPregnancies: number;
    activePregancies: number;
    totalLitters: number;
    recentLitters: number;
    alertsGenerated: number;
    calendarEvents: number;
  }> {
    try {
      const [
        totalPregnancies,
        activePregnancies,
        totalLitters,
        recentLitters
      ] = await Promise.all([
        prisma.prenez.count(),
        prisma.prenez.count({ where: { estado: 'activa' } }),
        prisma.camada.count(),
        prisma.camada.count({
          where: {
            fechaNacimiento: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      return {
        totalPregnancies,
        activePregancies: activePregnancies,
        totalLitters,
        recentLitters,
        alertsGenerated: 0, // Esto se obtendría del sistema de alertas
        calendarEvents: activePregnancies + recentLitters
      };
    } catch (error) {
      logger.error('Error getting integration stats:', error);
      throw error;
    }
  }
}

// Funciones de utilidad para integración
export const integrateReproductionData = async (
  entity: 'prenez' | 'camada',
  action: 'create' | 'update' | 'delete',
  data: any
): Promise<void> => {
  await Promise.all([
    ReproductionIntegrationService.syncReproductionWithDashboard(entity, action, data),
    ReproductionIntegrationService.syncWithCalendar(entity, action, data),
    ReproductionIntegrationService.generateAutomaticReports(entity, data)
  ]);
};

export const validateReproductionIntegrity = async () => {
  return await ReproductionIntegrationService.validateDataIntegrity();
};

export const migrateReproductionData = async () => {
  return await ReproductionIntegrationService.migrateExistingData();
};

export default ReproductionIntegrationService;