import { Alert } from './alerts.service';

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'in_app' | 'email' | 'webhook' | 'push';
  config: any;
  enabled: boolean;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  alertType: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface NotificationDelivery {
  id: string;
  alertId: string;
  channelId: string;
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  attempts: number;
  lastAttempt?: Date;
  deliveredAt?: Date;
  error?: string;
}

// Simulación de almacenamiento en memoria
let notificationChannels: NotificationChannel[] = [];
let notificationTemplates: NotificationTemplate[] = [];
let notificationDeliveries: NotificationDelivery[] = [];
let deliveryIdCounter = 1;

// Inicializar canales y plantillas por defecto
const initializeDefaults = () => {
  // Canales por defecto
  if (notificationChannels.length === 0) {
    notificationChannels = [
      {
        id: 'in_app_default',
        name: 'Notificaciones en la aplicación',
        type: 'in_app',
        config: {},
        enabled: true
      },
      {
        id: 'email_default',
        name: 'Correo electrónico',
        type: 'email',
        config: {
          smtp: {
            host: process.env.SMTP_HOST || 'localhost',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
              user: process.env.SMTP_USER || '',
              pass: process.env.SMTP_PASS || ''
            }
          },
          from: process.env.SMTP_FROM || 'noreply@sumaquywa.com'
        },
        enabled: false // Deshabilitado por defecto hasta configurar SMTP
      }
    ];
  }

  // Plantillas por defecto
  if (notificationTemplates.length === 0) {
    notificationTemplates = [
      {
        id: 'birth_reminder_template',
        name: 'Recordatorio de Parto',
        alertType: 'birth_reminder',
        subject: 'Recordatorio: Parto próximo - {{daysUntilBirth}} día(s)',
        body: `
          Estimado usuario,
          
          Le recordamos que la hembra ID {{madreId}} tiene un parto programado para {{fechaProbableParto}}.
          
          Días restantes: {{daysUntilBirth}}
          
          Por favor, prepare las condiciones necesarias para el parto.
          
          Saludos,
          Sistema SUMAQ UYWA
        `,
        variables: ['madreId', 'fechaProbableParto', 'daysUntilBirth']
      },
      {
        id: 'overdue_pregnancy_template',
        name: 'Preñez Vencida',
        alertType: 'overdue_pregnancy',
        subject: 'Alerta: Preñez vencida - {{daysOverdue}} días de retraso',
        body: `
          Estimado usuario,
          
          La hembra ID {{madreId}} tiene una preñez que excede el período normal.
          
          Días de retraso: {{daysOverdue}}
          Fecha de preñez: {{fechaPrenez}}
          
          Se recomienda realizar una evaluación veterinaria inmediata.
          
          Saludos,
          Sistema SUMAQ UYWA
        `,
        variables: ['madreId', 'daysOverdue', 'fechaPrenez']
      },
      {
        id: 'inactive_reproducer_template',
        name: 'Reproductora Inactiva',
        alertType: 'inactive_reproducer',
        subject: 'Aviso: Reproductora inactiva - {{raza}}',
        body: `
          Estimado usuario,
          
          La hembra ID {{cuyId}} ({{raza}}) ubicada en {{galpon}}-{{jaula}} no ha tenido actividad reproductiva en los últimos {{inactiveDays}} días.
          
          Se recomienda evaluar su estado reproductivo.
          
          Saludos,
          Sistema SUMAQ UYWA
        `,
        variables: ['cuyId', 'raza', 'galpon', 'jaula', 'inactiveDays']
      },
      {
        id: 'capacity_warning_template',
        name: 'Advertencia de Capacidad',
        alertType: 'capacity_warning',
        subject: 'Alerta: Capacidad crítica en {{galpon}}',
        body: `
          Estimado usuario,
          
          El galpón {{galpon}} está alcanzando su capacidad máxima.
          
          Ocupación actual: {{currentOccupancy}}/{{maxCapacity}} ({{utilizationPercentage}}%)
          
          Se recomienda considerar la redistribución de animales o ampliación de capacidad.
          
          Saludos,
          Sistema SUMAQ UYWA
        `,
        variables: ['galpon', 'currentOccupancy', 'maxCapacity', 'utilizationPercentage']
      }
    ];
  }
};

// Inicializar al cargar el módulo
initializeDefaults();

// Generar ID único para entregas
const generateDeliveryId = (): string => {
  return `delivery_${deliveryIdCounter++}_${Date.now()}`;
};

// Procesar variables en plantillas
const processTemplate = (template: string, variables: Record<string, any>): string => {
  let processed = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, String(value));
  });
  
  return processed;
};

// Enviar notificación a través de un canal específico
export const sendNotification = async (
  alert: Alert,
  channelId: string
): Promise<NotificationDelivery> => {
  const delivery: NotificationDelivery = {
    id: generateDeliveryId(),
    alertId: alert.id,
    channelId,
    status: 'pending',
    attempts: 0
  };

  notificationDeliveries.push(delivery);

  try {
    const channel = notificationChannels.find(c => c.id === channelId);
    if (!channel) {
      throw new Error(`Canal de notificación no encontrado: ${channelId}`);
    }

    if (!channel.enabled) {
      throw new Error(`Canal de notificación deshabilitado: ${channelId}`);
    }

    const template = notificationTemplates.find(t => t.alertType === alert.type);
    if (!template) {
      throw new Error(`Plantilla no encontrada para tipo de alerta: ${alert.type}`);
    }

    delivery.attempts++;
    delivery.lastAttempt = new Date();

    switch (channel.type) {
      case 'in_app':
        await sendInAppNotification(alert, template, channel);
        break;
      case 'email':
        await sendEmailNotification(alert, template, channel);
        break;
      case 'webhook':
        await sendWebhookNotification(alert, template, channel);
        break;
      case 'push':
        await sendPushNotification(alert, template, channel);
        break;
      default:
        throw new Error(`Tipo de canal no soportado: ${channel.type}`);
    }

    delivery.status = 'sent';
    delivery.deliveredAt = new Date();
    
    console.log(`✅ Notificación enviada: ${alert.type} via ${channel.type}`);
    
  } catch (error: any) {
    delivery.status = 'failed';
    delivery.error = error.message;
    
    console.error(`❌ Error enviando notificación: ${error.message}`);
  }

  return delivery;
};

// Enviar notificación in-app
const sendInAppNotification = async (
  alert: Alert,
  template: NotificationTemplate,
  channel: NotificationChannel
): Promise<void> => {
  // Para notificaciones in-app, simplemente las almacenamos
  // En una implementación real, se enviarían via WebSocket
  console.log(`📱 Notificación in-app: ${alert.title}`);
  
  // Simular envío exitoso
  await new Promise(resolve => setTimeout(resolve, 100));
};

// Enviar notificación por email
const sendEmailNotification = async (
  alert: Alert,
  template: NotificationTemplate,
  channel: NotificationChannel
): Promise<void> => {
  const subject = processTemplate(template.subject, alert.data);
  const body = processTemplate(template.body, alert.data);
  
  console.log(`📧 Email notification:`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}`);
  
  // En una implementación real, aquí se enviaría el email usando nodemailer
  // Por ahora solo simulamos el envío
  if (!channel.config.smtp || !channel.config.from) {
    throw new Error('Configuración SMTP incompleta');
  }
  
  // Simular envío de email
  await new Promise(resolve => setTimeout(resolve, 500));
};

// Enviar notificación por webhook
const sendWebhookNotification = async (
  alert: Alert,
  template: NotificationTemplate,
  channel: NotificationChannel
): Promise<void> => {
  const payload = {
    alert,
    template,
    timestamp: new Date().toISOString()
  };
  
  console.log(`🔗 Webhook notification:`, payload);
  
  // En una implementación real, aquí se haría una petición HTTP al webhook
  if (!channel.config.url) {
    throw new Error('URL de webhook no configurada');
  }
  
  // Simular llamada a webhook
  await new Promise(resolve => setTimeout(resolve, 300));
};

// Enviar notificación push
const sendPushNotification = async (
  alert: Alert,
  template: NotificationTemplate,
  channel: NotificationChannel
): Promise<void> => {
  const title = processTemplate(template.subject, alert.data);
  const body = alert.message;
  
  console.log(`🔔 Push notification: ${title} - ${body}`);
  
  // En una implementación real, aquí se enviaría la notificación push
  // usando un servicio como Firebase Cloud Messaging
  
  // Simular envío de push
  await new Promise(resolve => setTimeout(resolve, 200));
};

// Enviar notificación a través de múltiples canales
export const broadcastNotification = async (
  alert: Alert,
  channelIds?: string[]
): Promise<NotificationDelivery[]> => {
  const targetChannels = channelIds || 
    notificationChannels.filter(c => c.enabled).map(c => c.id);
  
  const deliveries = await Promise.all(
    targetChannels.map(channelId => sendNotification(alert, channelId))
  );
  
  console.log(`📢 Notificación enviada a ${deliveries.length} canales para alerta: ${alert.type}`);
  
  return deliveries;
};

// Reintentar notificaciones fallidas
export const retryFailedNotifications = async (): Promise<number> => {
  const failedDeliveries = notificationDeliveries.filter(
    d => d.status === 'failed' && d.attempts < 3
  );
  
  let retriedCount = 0;
  
  for (const delivery of failedDeliveries) {
    const alert = { id: delivery.alertId } as Alert; // Simplificado para el ejemplo
    
    delivery.status = 'retrying';
    const newDelivery = await sendNotification(alert, delivery.channelId);
    
    if (newDelivery.status === 'sent') {
      retriedCount++;
    }
  }
  
  console.log(`🔄 Reintentadas ${retriedCount} notificaciones fallidas`);
  return retriedCount;
};

// Obtener estadísticas de notificaciones
export const getNotificationStats = async (): Promise<{
  total: number;
  sent: number;
  failed: number;
  pending: number;
  byChannel: Record<string, number>;
}> => {
  const total = notificationDeliveries.length;
  const sent = notificationDeliveries.filter(d => d.status === 'sent').length;
  const failed = notificationDeliveries.filter(d => d.status === 'failed').length;
  const pending = notificationDeliveries.filter(d => d.status === 'pending').length;
  
  const byChannel = notificationDeliveries.reduce((acc, delivery) => {
    acc[delivery.channelId] = (acc[delivery.channelId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    total,
    sent,
    failed,
    pending,
    byChannel
  };
};

// Obtener canales de notificación
export const getNotificationChannels = async (): Promise<NotificationChannel[]> => {
  return [...notificationChannels];
};

// Actualizar canal de notificación
export const updateNotificationChannel = async (
  channelId: string,
  updates: Partial<NotificationChannel>
): Promise<NotificationChannel | null> => {
  const channelIndex = notificationChannels.findIndex(c => c.id === channelId);
  
  if (channelIndex === -1) {
    return null;
  }
  
  notificationChannels[channelIndex] = {
    ...notificationChannels[channelIndex],
    ...updates
  };
  
  return notificationChannels[channelIndex];
};

// Obtener plantillas de notificación
export const getNotificationTemplates = async (): Promise<NotificationTemplate[]> => {
  return [...notificationTemplates];
};

// Limpiar entregas antiguas
export const cleanupOldDeliveries = async (): Promise<number> => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const initialCount = notificationDeliveries.length;
  notificationDeliveries = notificationDeliveries.filter(
    d => d.lastAttempt && d.lastAttempt > sevenDaysAgo
  );
  
  const removedCount = initialCount - notificationDeliveries.length;
  console.log(`🧹 Limpieza de entregas: ${removedCount} entregas antiguas eliminadas`);
  
  return removedCount;
};