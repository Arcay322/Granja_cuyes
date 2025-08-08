import { Server as SocketIOServer } from 'socket.io';
import { getRealTimeMetrics } from './metrics.service';

export class RealtimeService {
  private io: SocketIOServer | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private connectedClients = new Set<string>();

  // Inicializar el servicio con el servidor Socket.IO
  initialize(io: SocketIOServer) {
    this.io = io;
    this.setupSocketHandlers();
    this.startPeriodicUpdates();
  }

  // Configurar manejadores de eventos Socket.IO
  private setupSocketHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log(`Cliente conectado: ${socket.id}`);
      this.connectedClients.add(socket.id);

      // Enviar métricas iniciales al cliente recién conectado
      this.sendInitialMetrics(socket.id);

      // Manejar suscripción a actualizaciones del dashboard
      socket.on('subscribe-dashboard', () => {
        socket.join('dashboard-updates');
        console.log(`Cliente ${socket.id} suscrito a actualizaciones del dashboard`);
      });

      // Manejar desuscripción
      socket.on('unsubscribe-dashboard', () => {
        socket.leave('dashboard-updates');
        console.log(`Cliente ${socket.id} desuscrito de actualizaciones del dashboard`);
      });

      // Manejar solicitud de métricas bajo demanda
      socket.on('request-metrics', async () => {
        try {
          const metrics = await getRealTimeMetrics();
          socket.emit('metrics-update', metrics);
        } catch (error) {
          console.error('Error enviando métricas bajo demanda:', error);
          socket.emit('metrics-error', { message: 'Error obteniendo métricas' });
        }
      });

      // Manejar desconexión
      socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });
    });
  }

  // Enviar métricas iniciales a un cliente específico
  private async sendInitialMetrics(socketId: string) {
    try {
      const metrics = await getRealTimeMetrics();
      this.io?.to(socketId).emit('initial-metrics', metrics);
    } catch (error) {
      console.error('Error enviando métricas iniciales:', error);
      this.io?.to(socketId).emit('metrics-error', { message: 'Error cargando métricas iniciales' });
    }
  }

  // Iniciar actualizaciones periódicas
  private startPeriodicUpdates() {
    // Actualizar cada 30 segundos
    this.updateInterval = setInterval(async () => {
      await this.broadcastMetricsUpdate();
    }, 30000);
  }

  // Transmitir actualización de métricas a todos los clientes suscritos
  private async broadcastMetricsUpdate() {
    if (!this.io || this.connectedClients.size === 0) return;

    try {
      const metrics = await getRealTimeMetrics();
      this.io.to('dashboard-updates').emit('metrics-update', metrics);
    } catch (error) {
      console.error('Error transmitiendo actualización de métricas:', error);
      this.io.to('dashboard-updates').emit('metrics-error', { 
        message: 'Error actualizando métricas' 
      });
    }
  }

  // Notificar evento específico (nuevo nacimiento, nueva preñez, etc.)
  async notifyEvent(eventType: string, data: any) {
    if (!this.io) return;

    try {
      // Enviar notificación del evento
      this.io.to('dashboard-updates').emit('reproduction-event', {
        type: eventType,
        data,
        timestamp: new Date()
      });

      // Actualizar métricas después del evento
      setTimeout(async () => {
        await this.broadcastMetricsUpdate();
      }, 1000);
    } catch (error) {
      console.error('Error notificando evento:', error);
    }
  }

  // Obtener estadísticas de conexiones
  getConnectionStats() {
    return {
      connectedClients: this.connectedClients.size,
      rooms: this.io?.sockets.adapter.rooms.size || 0
    };
  }

  // Detener el servicio
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.connectedClients.clear();
  }
}

// Instancia singleton del servicio
export const realtimeService = new RealtimeService();

// Tipos para eventos de tiempo real
export interface RealtimeMetrics {
  activePregnancies: number;
  expectedBirths: number;
  timestamp: Date;
}

export interface ReproductionEvent {
  type: 'new-pregnancy' | 'birth-recorded' | 'pregnancy-completed' | 'alert-generated';
  data: any;
  timestamp: Date;
}

// Funciones de utilidad para notificar eventos específicos
export const notifyNewPregnancy = (pregnancyData: any) => {
  realtimeService.notifyEvent('new-pregnancy', pregnancyData);
};

export const notifyBirthRecorded = (birthData: any) => {
  realtimeService.notifyEvent('birth-recorded', birthData);
};

export const notifyPregnancyCompleted = (pregnancyData: any) => {
  realtimeService.notifyEvent('pregnancy-completed', pregnancyData);
};

export const notifyAlertGenerated = (alertData: any) => {
  realtimeService.notifyEvent('alert-generated', alertData);
};