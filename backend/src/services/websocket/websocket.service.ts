import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userEmail?: string;
}

interface SocketUser {
  id: number;
  email: string;
  socketId: string;
  connectedAt: Date;
  lastActivity: Date;
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private userSockets: Map<number, string[]> = new Map();

  initialize(server: HttpServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? [
              'https://sumaq-uywa-frontend.onrender.com',
              'https://sumaq-uywa-fontend.onrender.com'
            ]
          : [
              'http://localhost:3000',
              'http://localhost:5173',
              'http://localhost:5174',
              'http://localhost:5175'
            ],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));

    logger.info('🔌 WebSocket service initialized');
  }

  private async authenticateSocket(socket: AuthenticatedSocket, next: Function): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;
      
      logger.info(`🔐 Socket authenticated for user ${decoded.email} (${decoded.id})`);
      next();
    } catch (error) {
      logger.error('❌ Socket authentication failed:', error);
      next(new Error('Authentication failed'));
    }
  }

  private handleConnection(socket: AuthenticatedSocket): void {
    if (!socket.userId || !socket.userEmail) {
      socket.disconnect();
      return;
    }

    const user: SocketUser = {
      id: socket.userId,
      email: socket.userEmail,
      socketId: socket.id,
      connectedAt: new Date(),
      lastActivity: new Date()
    };

    this.connectedUsers.set(socket.id, user);
    
    const userSocketIds = this.userSockets.get(socket.userId) || [];
    userSocketIds.push(socket.id);
    this.userSockets.set(socket.userId, userSocketIds);

    logger.info(`👤 User connected: ${socket.userEmail} (${socket.id})`);

    socket.join(`user_${socket.userId}`);
    socket.join('dashboard_updates');
    socket.join('alerts_updates');

    // Job-related event handlers
    socket.on('subscribe:job', (data: { jobId: string }) => {
      if (data.jobId) {
        socket.join(`job_${data.jobId}`);
        socket.emit('subscribed', { jobId: data.jobId, type: 'job' });
        logger.info(`📋 User ${socket.userEmail} subscribed to job ${data.jobId}`);
      }
    });

    socket.on('unsubscribe:job', (data: { jobId: string }) => {
      if (data.jobId) {
        socket.leave(`job_${data.jobId}`);
        socket.emit('unsubscribed', { jobId: data.jobId, type: 'job' });
        logger.info(`📋 User ${socket.userEmail} unsubscribed from job ${data.jobId}`);
      }
    });

    socket.on('subscribe:queue', () => {
      // Only allow admin users to subscribe to queue updates
      // This would need to be checked against user role in a real implementation
      socket.join('queue_updates');
      socket.emit('subscribed', { type: 'queue' });
      logger.info(`📊 User ${socket.userEmail} subscribed to queue updates`);
    });

    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    socket.on('disconnect', () => this.handleDisconnection(socket));

    // Send connection confirmation
    socket.emit('connected', {
      message: 'WebSocket connection established',
      timestamp: new Date().toISOString(),
      socketId: socket.id
    });
  }

  private handleDisconnection(socket: AuthenticatedSocket): void {
    const user = this.connectedUsers.get(socket.id);
    if (user) {
      this.connectedUsers.delete(socket.id);
      
      const userSocketIds = this.userSockets.get(user.id) || [];
      const updatedSocketIds = userSocketIds.filter(id => id !== socket.id);
      
      if (updatedSocketIds.length === 0) {
        this.userSockets.delete(user.id);
      } else {
        this.userSockets.set(user.id, updatedSocketIds);
      }

      logger.info(`👤 User disconnected: ${user.email} (${socket.id})`);
    }
  }

  public broadcastAlert(alert: any, targetUsers?: number[]): void {
    if (!this.io) return;

    if (targetUsers && targetUsers.length > 0) {
      targetUsers.forEach(userId => {
        this.io!.to(`user_${userId}`).emit('alerts:new', {
          type: 'targeted',
          data: alert,
          timestamp: new Date().toISOString()
        });
      });
    } else {
      this.io.to('alerts_updates').emit('alerts:new', {
        type: 'broadcast',
        data: alert,
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`🔔 Alert broadcasted: ${alert.type}`);
  }

  public notifyDataChange(entity: string, action: 'created' | 'updated' | 'deleted', data: any): void {
    if (!this.io) return;

    const dashboardEntities = ['cuy', 'prenez', 'camada', 'galpon', 'jaula'];
    if (dashboardEntities.includes(entity)) {
      this.io.to('dashboard_updates').emit('data:change', {
        entity,
        action,
        data,
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`🔄 Data change notified: ${entity} ${action}`);
  }

  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  public isUserConnected(userId: number): boolean {
    return this.userSockets.has(userId);
  }

  // Job notification methods
  public broadcastJobUpdate(jobId: string, update: any): void {
    if (!this.io) return;

    this.io.to(`job_${jobId}`).emit('job:update', {
      jobId,
      timestamp: new Date().toISOString(),
      ...update
    });

    logger.info(`📋 Job update broadcasted: ${jobId}`, { update });
  }

  // Dashboard update methods
  public broadcastDashboardUpdate(data: any): void {
    if (!this.io) return;

    this.io.emit('dashboard:update', {
      timestamp: new Date().toISOString(),
      ...data
    });

    logger.info(`📊 Dashboard update broadcasted`, { data });
  }

  // Calendar update methods
  public broadcastCalendarUpdate(event: any, action: string): void {
    if (!this.io) return;

    this.io.emit('calendar:update', {
      event,
      action,
      timestamp: new Date().toISOString()
    });

    logger.info(`📅 Calendar update broadcasted: ${action}`, { event });
  }

  // Report update methods
  public broadcastReportUpdate(type: string, status: string): void {
    if (!this.io) return;

    this.io.emit('report:update', {
      type,
      status,
      timestamp: new Date().toISOString()
    });

    logger.info(`📄 Report update broadcasted: ${type} - ${status}`);
  }

  public sendJobUpdateToUser(userId: number, jobId: string, update: any): void {
    if (!this.io) return;

    this.io.to(`user_${userId}`).emit('job:update', {
      jobId,
      timestamp: new Date().toISOString(),
      ...update
    });

    logger.info(`📋 Job update sent to user ${userId}: ${jobId}`, { update });
  }

  public broadcastQueueUpdate(update: any): void {
    if (!this.io) return;

    this.io.to('queue_updates').emit('queue:update', {
      timestamp: new Date().toISOString(),
      ...update
    });

    logger.info('📊 Queue update broadcasted', { update });
  }

  public sendNotificationToUser(userId: number, notification: {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    data?: any;
  }): void {
    if (!this.io) return;

    this.io.to(`user_${userId}`).emit('notification', {
      timestamp: new Date().toISOString(),
      ...notification
    });

    logger.info(`🔔 Notification sent to user ${userId}`, { notification });
  }

  public getConnectionStats(): any {
    return {
      connectedUsers: this.getConnectedUsersCount(),
      connectedSockets: this.io?.sockets.sockets.size || 0,
      rooms: this.io ? Array.from(this.io.sockets.adapter.rooms.keys()) : [],
      timestamp: new Date().toISOString()
    };
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService;