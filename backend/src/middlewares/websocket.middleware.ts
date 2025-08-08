import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

export interface AuthenticatedSocket extends Socket {
  userId?: number;
  userRole?: string;
}

interface Socket {
  id: string;
  userId?: number;
  userRole?: string;
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  disconnect: () => void;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<number, Set<string>> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        socket.userId = decoded.id;
        socket.userRole = decoded.role || 'user';

        logger.info(`WebSocket client authenticated: ${socket.id}`, { 
          userId: socket.userId, 
          userRole: socket.userRole 
        });

        next();
      } catch (error) {
        logger.error('WebSocket authentication failed:', error);
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`WebSocket client connected: ${socket.id}`, { 
        userId: socket.userId,
        userRole: socket.userRole
      });

      // Track connected users
      if (socket.userId) {
        if (!this.connectedUsers.has(socket.userId)) {
          this.connectedUsers.set(socket.userId, new Set());
        }
        this.connectedUsers.get(socket.userId)!.add(socket.id);

        // Join user-specific room
        socket.join(`user:${socket.userId}`);

        // Join admin room if user is admin
        if (socket.userRole === 'admin') {
          socket.join('admin');
        }
      }

      // Handle job subscription
      socket.on('subscribe:job', (data: { jobId: string }) => {
        const { jobId } = data;
        if (!jobId) {
          socket.emit('error', { message: 'Job ID is required' });
          return;
        }

        logger.info(`Client subscribing to job updates: ${jobId}`, { 
          socketId: socket.id,
          userId: socket.userId 
        });

        socket.join(`job:${jobId}`);
        socket.emit('subscribed', { jobId, message: 'Subscribed to job updates' });
      });

      // Handle job unsubscription
      socket.on('unsubscribe:job', (data: { jobId: string }) => {
        const { jobId } = data;
        if (!jobId) {
          socket.emit('error', { message: 'Job ID is required' });
          return;
        }

        logger.info(`Client unsubscribing from job updates: ${jobId}`, { 
          socketId: socket.id,
          userId: socket.userId 
        });

        socket.leave(`job:${jobId}`);
        socket.emit('unsubscribed', { jobId, message: 'Unsubscribed from job updates' });
      });

      // Handle queue subscription (admin only)
      socket.on('subscribe:queue', () => {
        if (socket.userRole !== 'admin') {
          socket.emit('error', { message: 'Admin access required for queue updates' });
          return;
        }

        logger.info(`Admin client subscribing to queue updates`, { 
          socketId: socket.id,
          userId: socket.userId 
        });

        socket.join('queue');
        socket.emit('subscribed', { type: 'queue', message: 'Subscribed to queue updates' });
      });

      // Handle ping for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info(`WebSocket client disconnected: ${socket.id}`, { 
          userId: socket.userId,
          reason 
        });

        // Remove from connected users tracking
        if (socket.userId && this.connectedUsers.has(socket.userId)) {
          const userSockets = this.connectedUsers.get(socket.userId)!;
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this.connectedUsers.delete(socket.userId);
          }
        }
      });

      // Send initial connection confirmation
      socket.emit('connected', {
        message: 'WebSocket connection established',
        timestamp: new Date().toISOString(),
        socketId: socket.id
      });
    });
  }

  /**
   * Broadcast job status update to subscribers
   */
  public broadcastJobUpdate(jobId: string, update: any) {
    logger.info(`Broadcasting job update: ${jobId}`, { update });
    this.io.to(`job:${jobId}`).emit('job:update', {
      jobId,
      timestamp: new Date().toISOString(),
      ...update
    });
  }

  /**
   * Send job update to specific user
   */
  public sendJobUpdateToUser(userId: number, jobId: string, update: any) {
    logger.info(`Sending job update to user: ${userId}`, { jobId, update });
    this.io.to(`user:${userId}`).emit('job:update', {
      jobId,
      timestamp: new Date().toISOString(),
      ...update
    });
  }

  /**
   * Broadcast queue status update to admins
   */
  public broadcastQueueUpdate(update: any) {
    logger.info('Broadcasting queue update to admins', { update });
    this.io.to('admin').emit('queue:update', {
      timestamp: new Date().toISOString(),
      ...update
    });
  }

  /**
   * Send notification to user
   */
  public sendNotificationToUser(userId: number, notification: {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    data?: any;
  }) {
    logger.info(`Sending notification to user: ${userId}`, { notification });
    this.io.to(`user:${userId}`).emit('notification', {
      timestamp: new Date().toISOString(),
      ...notification
    });
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get connected sockets count
   */
  public getConnectedSocketsCount(): number {
    return this.io.sockets.sockets.size;
  }

  /**
   * Check if user is connected
   */
  public isUserConnected(userId: number): boolean {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId)!.size > 0;
  }

  /**
   * Get connection statistics
   */
  public getConnectionStats() {
    return {
      connectedUsers: this.getConnectedUsersCount(),
      connectedSockets: this.getConnectedSocketsCount(),
      rooms: Array.from(this.io.sockets.adapter.rooms.keys()),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Shutdown WebSocket server gracefully
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down WebSocket server');
    
    // Notify all connected clients
    this.io.emit('server:shutdown', {
      message: 'Server is shutting down',
      timestamp: new Date().toISOString()
    });

    // Close all connections
    this.io.close();

    // Clear tracking data
    this.connectedUsers.clear();

    logger.info('WebSocket server shutdown completed');
  }
}

// Singleton instance
let webSocketService: WebSocketService | null = null;

export const initializeWebSocket = (server: HTTPServer): WebSocketService => {
  if (!webSocketService) {
    webSocketService = new WebSocketService(server);
  }
  return webSocketService;
};

export const getWebSocketService = (): WebSocketService | null => {
  return webSocketService;
};