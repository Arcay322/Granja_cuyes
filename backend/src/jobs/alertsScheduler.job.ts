import * as cron from 'node-cron';
import { 
  generateAllAlerts, 
  cleanupOldAlerts,
  getAlertStats 
} from '../services/alerts/alerts.service';
import { 
  retryFailedNotifications, 
  cleanupOldDeliveries,
  getNotificationStats,
  broadcastNotification
} from '../services/alerts/notifications.service';

export class AlertsScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  // Inicializar el programador de alertas
  start() {
    if (this.isRunning) {
      console.log('⚠️ AlertsScheduler ya está ejecutándose');
      return;
    }

    console.log('🚀 Iniciando AlertsScheduler...');
    this.isRunning = true;

    // Job principal: Generar alertas cada hora
    const mainJob = cron.schedule('0 * * * *', async () => {
      await this.runMainAlertGeneration();
    });

    // Job de limpieza: Ejecutar diariamente a las 2:00 AM
    const cleanupJob = cron.schedule('0 2 * * *', async () => {
      await this.runCleanupTasks();
    });

    // Job de reintentos: Cada 30 minutos
    const retryJob = cron.schedule('*/30 * * * *', async () => {
      await this.runRetryTasks();
    });

    // Job de estadísticas: Cada 6 horas
    const statsJob = cron.schedule('0 */6 * * *', async () => {
      await this.runStatsReport();
    });

    // Almacenar jobs
    this.jobs.set('main', mainJob);
    this.jobs.set('cleanup', cleanupJob);
    this.jobs.set('retry', retryJob);
    this.jobs.set('stats', statsJob);

    // Iniciar todos los jobs
    this.jobs.forEach((job, name) => {
      job.start();
      console.log(`✅ Job '${name}' iniciado`);
    });

    // Ejecutar generación inicial de alertas
    setTimeout(() => {
      this.runMainAlertGeneration();
    }, 5000); // Esperar 5 segundos después del inicio

    console.log('✅ AlertsScheduler iniciado correctamente');
  }

  // Detener el programador
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ AlertsScheduler no está ejecutándose');
      return;
    }

    console.log('🛑 Deteniendo AlertsScheduler...');

    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`🛑 Job '${name}' detenido`);
    });

    this.jobs.clear();
    this.isRunning = false;

    console.log('✅ AlertsScheduler detenido correctamente');
  }

  // Ejecutar generación principal de alertas
  private async runMainAlertGeneration() {
    console.log('🔄 Ejecutando generación de alertas...');
    
    try {
      const startTime = Date.now();
      
      // Generar todas las alertas
      const alertsGenerated = await generateAllAlerts();
      
      // Enviar notificaciones para las nuevas alertas
      const allNewAlerts = [
        ...alertsGenerated.birthReminders,
        ...alertsGenerated.overduePregnancies,
        ...alertsGenerated.inactiveReproducers,
        ...alertsGenerated.capacityWarnings
      ];

      // Enviar notificaciones para alertas críticas y de alta prioridad
      const criticalAlerts = allNewAlerts.filter(
        alert => alert.severity === 'critical' || alert.severity === 'high'
      );

      for (const alert of criticalAlerts) {
        await broadcastNotification(alert);
      }

      const executionTime = Date.now() - startTime;
      const totalAlerts = allNewAlerts.length;

      console.log(`✅ Generación de alertas completada:`);
      console.log(`   - Total alertas: ${totalAlerts}`);
      console.log(`   - Recordatorios de parto: ${alertsGenerated.birthReminders.length}`);
      console.log(`   - Preñeces vencidas: ${alertsGenerated.overduePregnancies.length}`);
      console.log(`   - Reproductoras inactivas: ${alertsGenerated.inactiveReproducers.length}`);
      console.log(`   - Advertencias de capacidad: ${alertsGenerated.capacityWarnings.length}`);
      console.log(`   - Tiempo de ejecución: ${executionTime}ms`);
      console.log(`   - Notificaciones críticas enviadas: ${criticalAlerts.length}`);

    } catch (error) {
      console.error('❌ Error en generación de alertas:', error);
    }
  }

  // Ejecutar tareas de limpieza
  private async runCleanupTasks() {
    console.log('🧹 Ejecutando tareas de limpieza...');
    
    try {
      const startTime = Date.now();
      
      // Limpiar alertas antiguas
      const removedAlerts = await cleanupOldAlerts();
      
      // Limpiar entregas de notificaciones antiguas
      const removedDeliveries = await cleanupOldDeliveries();
      
      const executionTime = Date.now() - startTime;
      
      console.log(`✅ Limpieza completada:`);
      console.log(`   - Alertas eliminadas: ${removedAlerts}`);
      console.log(`   - Entregas eliminadas: ${removedDeliveries}`);
      console.log(`   - Tiempo de ejecución: ${executionTime}ms`);
      
    } catch (error) {
      console.error('❌ Error en tareas de limpieza:', error);
    }
  }

  // Ejecutar reintentos de notificaciones fallidas
  private async runRetryTasks() {
    console.log('🔄 Ejecutando reintentos de notificaciones...');
    
    try {
      const startTime = Date.now();
      
      const retriedCount = await retryFailedNotifications();
      
      const executionTime = Date.now() - startTime;
      
      if (retriedCount > 0) {
        console.log(`✅ Reintentos completados:`);
        console.log(`   - Notificaciones reintentadas: ${retriedCount}`);
        console.log(`   - Tiempo de ejecución: ${executionTime}ms`);
      }
      
    } catch (error) {
      console.error('❌ Error en reintentos de notificaciones:', error);
    }
  }

  // Ejecutar reporte de estadísticas
  private async runStatsReport() {
    console.log('📊 Generando reporte de estadísticas...');
    
    try {
      const [alertStats, notificationStats] = await Promise.all([
        getAlertStats(),
        getNotificationStats()
      ]);
      
      console.log(`📊 Estadísticas de Alertas:`);
      console.log(`   - Total: ${alertStats.total}`);
      console.log(`   - No leídas: ${alertStats.unread}`);
      console.log(`   - Por severidad:`, alertStats.bySeverity);
      console.log(`   - Por tipo:`, alertStats.byType);
      
      console.log(`📊 Estadísticas de Notificaciones:`);
      console.log(`   - Total: ${notificationStats.total}`);
      console.log(`   - Enviadas: ${notificationStats.sent}`);
      console.log(`   - Fallidas: ${notificationStats.failed}`);
      console.log(`   - Pendientes: ${notificationStats.pending}`);
      console.log(`   - Por canal:`, notificationStats.byChannel);
      
    } catch (error) {
      console.error('❌ Error generando estadísticas:', error);
    }
  }

  // Ejecutar generación manual de alertas
  async runManualGeneration(): Promise<void> {
    console.log('🔧 Ejecutando generación manual de alertas...');
    await this.runMainAlertGeneration();
  }

  // Obtener estado del programador
  getStatus(): {
    isRunning: boolean;
    activeJobs: string[];
    nextExecutions: Record<string, string>;
  } {
    const activeJobs = Array.from(this.jobs.keys());
    const nextExecutions: Record<string, string> = {};
    
    this.jobs.forEach((job, name) => {
      try {
        // Obtener próxima ejecución (esto puede variar según la versión de node-cron)
        nextExecutions[name] = 'Programado';
      } catch (error) {
        nextExecutions[name] = 'Error obteniendo próxima ejecución';
      }
    });

    return {
      isRunning: this.isRunning,
      activeJobs,
      nextExecutions
    };
  }
}

// Instancia singleton del programador
export const alertsScheduler = new AlertsScheduler();

// Funciones de utilidad para controlar el programador
export const startAlertsScheduler = () => {
  alertsScheduler.start();
};

export const stopAlertsScheduler = () => {
  alertsScheduler.stop();
};

export const getAlertsSchedulerStatus = () => {
  return alertsScheduler.getStatus();
};

export const runManualAlertGeneration = async () => {
  return alertsScheduler.runManualGeneration();
};