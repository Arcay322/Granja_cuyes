import { Request, Response } from 'express';
import {
  getAllAlerts,
  createAlert,
  markAlertAsRead,
  deleteAlert,
  getAlertStats,
  generateAllAlerts,
  Alert,
  AlertType
} from '../../services/alerts/alerts.service';
import {
  broadcastNotification,
  getNotificationStats,
  getNotificationChannels,
  updateNotificationChannel
} from '../../services/alerts/notifications.service';
import {
  runManualAlertGeneration,
  getAlertsSchedulerStatus
} from '../../jobs/alertsScheduler.job';

// Obtener todas las alertas
export const getAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = {
      type: req.query.type as AlertType,
      severity: req.query.severity as string,
      read: req.query.read === 'true' ? true : req.query.read === 'false' ? false : undefined,
      userId: req.query.userId ? parseInt(req.query.userId as string) : undefined
    };

    const alerts = await getAllAlerts(filters);

    res.status(200).json({
      success: true,
      data: alerts,
      message: `${alerts.length} alertas encontradas`,
      timestamp: new Date()
    });
  } catch (error: unknown) {
    console.error('Error obteniendo alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo alertas',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Crear nueva alerta manual
export const createManualAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, severity, title, message, data } = req.body;

    if (!type || !severity || !title || !message) {
      res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: type, severity, title, message'
      });
      return;
    }

    const alert = await createAlert({
      type,
      severity,
      title,
      message,
      data: data || {},
      userId: req.user?.id // Asumiendo que el middleware de auth agrega user al request
    });

    // Enviar notificación si es crítica o alta prioridad
    if (severity === 'critical' || severity === 'high') {
      await broadcastNotification(alert);
    }

    res.status(201).json({
      success: true,
      data: alert,
      message: 'Alerta creada exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error creando alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando alerta',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Marcar alerta como leída
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { actionTaken } = req.body;

    const alert = await markAlertAsRead(id, actionTaken);

    if (!alert) {
      res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: alert,
      message: 'Alerta marcada como leída'
    });
  } catch (error: unknown) {
    console.error('Error marcando alerta como leída:', error);
    res.status(500).json({
      success: false,
      message: 'Error marcando alerta como leída',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Eliminar alerta
export const removeAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const success = await deleteAlert(id);

    if (!success) {
      res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Alerta eliminada exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error eliminando alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando alerta',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener estadísticas de alertas
export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [alertStats, notificationStats] = await Promise.all([
      getAlertStats(),
      getNotificationStats()
    ]);

    res.status(200).json({
      success: true,
      data: {
        alerts: alertStats,
        notifications: notificationStats
      },
      message: 'Estadísticas obtenidas exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Generar alertas manualmente
export const generateAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔧 Iniciando generación manual de alertas...');
    
    await runManualAlertGeneration();

    res.status(200).json({
      success: true,
      message: 'Generación de alertas iniciada exitosamente',
      timestamp: new Date()
    });
  } catch (error: unknown) {
    console.error('Error generando alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando alertas',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener estado del programador de alertas
export const getSchedulerStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = getAlertsSchedulerStatus();

    res.status(200).json({
      success: true,
      data: status,
      message: 'Estado del programador obtenido exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error obteniendo estado del programador:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estado del programador',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Obtener canales de notificación
export const getChannels = async (req: Request, res: Response): Promise<void> => {
  try {
    const channels = await getNotificationChannels();

    res.status(200).json({
      success: true,
      data: channels,
      message: 'Canales de notificación obtenidos exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error obteniendo canales:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo canales de notificación',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Actualizar canal de notificación
export const updateChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const channel = await updateNotificationChannel(id, updates);

    if (!channel) {
      res.status(404).json({
        success: false,
        message: 'Canal de notificación no encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: channel,
      message: 'Canal de notificación actualizado exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error actualizando canal:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando canal de notificación',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Enviar notificación de prueba
export const sendTestNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.body;

    const testAlert: Omit<Alert, 'id' | 'createdAt'> = {
      type: 'birth_reminder',
      severity: 'medium',
      title: 'Notificación de Prueba',
      message: 'Esta es una notificación de prueba del sistema de alertas',
      data: {
        test: true,
        timestamp: new Date()
      }
    };

    const alert = await createAlert(testAlert);
    
    if (channelId) {
      await broadcastNotification(alert, [channelId]);
    } else {
      await broadcastNotification(alert);
    }

    res.status(200).json({
      success: true,
      data: alert,
      message: 'Notificación de prueba enviada exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error enviando notificación de prueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error enviando notificación de prueba',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Marcar múltiples alertas como leídas
export const markMultipleAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { alertIds } = req.body;

    if (!Array.isArray(alertIds) || alertIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs de alertas'
      });
      return;
    }

    const results = await Promise.all(
      alertIds.map(id => markAlertAsRead(id))
    );

    const successCount = results.filter(result => result !== null).length;

    res.status(200).json({
      success: true,
      data: {
        processed: alertIds.length,
        successful: successCount,
        failed: alertIds.length - successCount
      },
      message: `${successCount} alertas marcadas como leídas`
    });
  } catch (error: unknown) {
    console.error('Error marcando múltiples alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error marcando múltiples alertas como leídas',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};