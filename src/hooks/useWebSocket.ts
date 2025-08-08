import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketConfig {
  url?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastMessage: any;
  connectionCount: number;
}

interface UseWebSocketReturn {
  socket: Socket | null;
  state: WebSocketState;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
  subscribe: (event: string, callback: (data: any) => void) => () => void;
  isConnected: boolean;
}

export const useWebSocket = (config: WebSocketConfig = {}): UseWebSocketReturn => {
  const {
    url = process.env.NODE_ENV === 'production' 
      ? 'wss://sumaq-uywa-backend.onrender.com'
      : 'ws://localhost:4000',
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 3000
  } = config;

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);
  const listenersRef = useRef<Map<string, Set<Function>>>(new Map());

  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    lastMessage: null,
    connectionCount: 0
  });

  const updateState = useCallback((updates: Partial<WebSocketState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const getAuthToken = useCallback(() => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('🔌 WebSocket already connected');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      console.error('❌ No auth token found for WebSocket connection');
      updateState({ error: 'No authentication token found' });
      return;
    }

    console.log('🔌 Connecting to WebSocket:', url);
    updateState({ connecting: true, error: null });

    socketRef.current = io(url, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    });

    const socket = socketRef.current;

    // Event listeners
    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
      reconnectCountRef.current = 0;
      updateState({
        connected: true,
        connecting: false,
        error: null,
        connectionCount: state.connectionCount + 1
      });

      // Reestablecer suscripciones
      listenersRef.current.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          socket.on(event, callback as any);
        });
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      updateState({
        connected: false,
        connecting: false,
        error: `Disconnected: ${reason}`
      });

      // Intentar reconectar si no fue desconexión manual
      if (reason !== 'io client disconnect' && reconnectCountRef.current < reconnectAttempts) {
        scheduleReconnect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      updateState({
        connected: false,
        connecting: false,
        error: `Connection error: ${error.message}`
      });

      if (reconnectCountRef.current < reconnectAttempts) {
        scheduleReconnect();
      }
    });

    socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      updateState({ error: `Socket error: ${error}` });
    });

    // Heartbeat
    socket.on('pong', (data) => {
      console.log('💓 WebSocket heartbeat received:', data);
    });

    // Manejar mensajes generales
    socket.onAny((event, data) => {
      console.log(`📨 WebSocket event received: ${event}`, data);
      updateState({ lastMessage: { event, data, timestamp: new Date() } });
    });

  }, [url, reconnectAttempts, getAuthToken, updateState, state.connectionCount]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectCountRef.current++;
    const delay = reconnectDelay * Math.pow(1.5, reconnectCountRef.current - 1); // Backoff exponencial

    console.log(`🔄 Scheduling reconnect attempt ${reconnectCountRef.current}/${reconnectAttempts} in ${delay}ms`);

    reconnectTimeoutRef.current = setTimeout(() => {
      if (reconnectCountRef.current <= reconnectAttempts) {
        connect();
      } else {
        console.error('❌ Max reconnection attempts reached');
        updateState({ error: 'Max reconnection attempts reached' });
      }
    }, delay);
  }, [reconnectDelay, reconnectAttempts, connect, updateState]);

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting WebSocket');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    updateState({
      connected: false,
      connecting: false,
      error: null
    });
  }, [updateState]);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      console.log(`📤 Emitting WebSocket event: ${event}`, data);
      socketRef.current.emit(event, data);
    } else {
      console.warn('⚠️ Cannot emit event, WebSocket not connected:', event);
    }
  }, []);

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    console.log(`👂 Subscribing to WebSocket event: ${event}`);
    
    // Agregar a la lista de listeners
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);

    // Suscribir al socket si está conectado
    if (socketRef.current?.connected) {
      socketRef.current.on(event, callback);
    }

    // Retornar función de cleanup
    return () => {
      console.log(`👂 Unsubscribing from WebSocket event: ${event}`);
      
      // Remover de la lista de listeners
      const eventListeners = listenersRef.current.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          listenersRef.current.delete(event);
        }
      }

      // Desuscribir del socket
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);

  // Heartbeat periódico
  useEffect(() => {
    if (!state.connected) return;

    const heartbeatInterval = setInterval(() => {
      emit('ping');
    }, 30000); // Cada 30 segundos

    return () => clearInterval(heartbeatInterval);
  }, [state.connected, emit]);

  // Auto-connect
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    socket: socketRef.current,
    state,
    connect,
    disconnect,
    emit,
    subscribe,
    isConnected: state.connected
  };
};

// Hook especializado para dashboard
export const useDashboardWebSocket = () => {
  const webSocket = useWebSocket();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [chartsData, setChartsData] = useState<any>(null);

  const subscribeToDashboard = useCallback((filters?: any) => {
    if (!webSocket.isConnected) return;

    console.log('📊 Subscribing to dashboard updates with filters:', filters);
    webSocket.emit('dashboard:subscribe', filters);
  }, [webSocket]);

  const unsubscribeFromDashboard = useCallback(() => {
    if (!webSocket.isConnected) return;

    console.log('📊 Unsubscribing from dashboard updates');
    webSocket.emit('dashboard:unsubscribe');
  }, [webSocket]);

  useEffect(() => {
    if (!webSocket.isConnected) return;

    const unsubscribeMetrics = webSocket.subscribe('dashboard:metrics', (data) => {
      console.log('📊 Dashboard metrics received:', data);
      setDashboardData(data.data);
    });

    const unsubscribeCharts = webSocket.subscribe('dashboard:charts', (data) => {
      console.log('📊 Dashboard charts received:', data);
      setChartsData(data.data);
    });

    const unsubscribeUpdate = webSocket.subscribe('dashboard:update', (data) => {
      console.log('📊 Dashboard update received:', data);
      if (data.data.metrics) {
        setDashboardData(data.data.metrics);
      }
      if (data.data.charts) {
        setChartsData(data.data.charts);
      }
    });

    const unsubscribeDataChange = webSocket.subscribe('data:change', (data) => {
      console.log('🔄 Data change received:', data);
      // Podrías disparar una actualización aquí si es necesario
    });

    return () => {
      unsubscribeMetrics();
      unsubscribeCharts();
      unsubscribeUpdate();
      unsubscribeDataChange();
    };
  }, [webSocket]);

  return {
    ...webSocket,
    dashboardData,
    chartsData,
    subscribeToDashboard,
    unsubscribeFromDashboard
  };
};

// Hook especializado para alertas
export const useAlertsWebSocket = () => {
  const webSocket = useWebSocket();
  const [alerts, setAlerts] = useState<any[]>([]);

  const subscribeToAlerts = useCallback(() => {
    if (!webSocket.isConnected) return;

    console.log('🔔 Subscribing to alerts');
    webSocket.emit('alerts:subscribe');
  }, [webSocket]);

  useEffect(() => {
    if (!webSocket.isConnected) return;

    const unsubscribeAlerts = webSocket.subscribe('alerts:new', (data) => {
      console.log('🔔 New alert received:', data);
      setAlerts(prev => [data.data, ...prev]);
    });

    return () => {
      unsubscribeAlerts();
    };
  }, [webSocket]);

  return {
    ...webSocket,
    alerts,
    subscribeToAlerts,
    clearAlerts: () => setAlerts([])
  };
};

// Hook especializado para calendario
export const useCalendarWebSocket = () => {
  const webSocket = useWebSocket();
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  const subscribeToCalendar = useCallback((filters?: any) => {
    if (!webSocket.isConnected) return;

    console.log('📅 Subscribing to calendar updates');
    webSocket.emit('calendar:subscribe', filters);
  }, [webSocket]);

  useEffect(() => {
    if (!webSocket.isConnected) return;

    const unsubscribeCalendar = webSocket.subscribe('calendar:update', (data) => {
      console.log('📅 Calendar update received:', data);
      
      switch (data.action) {
        case 'created':
          setCalendarEvents(prev => [...prev, data.data]);
          break;
        case 'updated':
          setCalendarEvents(prev => 
            prev.map(event => event.id === data.data.id ? data.data : event)
          );
          break;
        case 'deleted':
          setCalendarEvents(prev => 
            prev.filter(event => event.id !== data.data.id)
          );
          break;
      }
    });

    return () => {
      unsubscribeCalendar();
    };
  }, [webSocket]);

  return {
    ...webSocket,
    calendarEvents,
    subscribeToCalendar
  };
};