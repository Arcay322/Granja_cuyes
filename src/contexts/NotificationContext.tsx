import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { Notification, NotificationConfig } from '../types/notifications';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  config: NotificationConfig;
  isOpen: boolean;
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_CONFIG'; payload: NotificationConfig }
  | { type: 'TOGGLE_PANEL' }
  | { type: 'SET_PANEL'; payload: boolean };

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  config: {
    enabled: true,
    frequency: 5000,
    types: ['stockAlerts', 'healthReminders', 'salesNotifications', 'reproductiveAlerts', 'systemUpdates']
  },
  isOpen: false,
};

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      const newNotifications = [action.payload, ...state.notifications];
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: newNotifications.filter(n => !n.read).length,
      };

    case 'REMOVE_NOTIFICATION':
      const filteredNotifications = state.notifications.filter(n => n.id !== action.payload);
      return {
        ...state,
        notifications: filteredNotifications,
        unreadCount: filteredNotifications.filter(n => !n.read).length,
      };

    case 'MARK_AS_READ':
      const updatedNotifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, read: true } : n
      );
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.read).length,
      };

    case 'MARK_ALL_AS_READ':
      const allReadNotifications = state.notifications.map(n => ({ ...n, read: true }));
      return {
        ...state,
        notifications: allReadNotifications,
        unreadCount: 0,
      };

    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };

    case 'SET_CONFIG':
      return {
        ...state,
        config: action.payload,
      };

    case 'TOGGLE_PANEL':
      return {
        ...state,
        isOpen: !state.isOpen,
      };

    case 'SET_PANEL':
      return {
        ...state,
        isOpen: action.payload,
      };

    default:
      return state;
  }
};

interface NotificationContextType extends NotificationState {
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  updateConfig: (config: NotificationConfig) => void;
  togglePanel: () => void;
  setPanel: (open: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const markAsRead = (id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
  };

  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  };

  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  const updateConfig = (config: NotificationConfig) => {
    dispatch({ type: 'SET_CONFIG', payload: config });
    // Guardar configuración en localStorage
    localStorage.setItem('notificationConfig', JSON.stringify(config));
  };

  const togglePanel = () => {
    dispatch({ type: 'TOGGLE_PANEL' });
  };

  const setPanel = (open: boolean) => {
    dispatch({ type: 'SET_PANEL', payload: open });
  };

  // Cargar configuración desde localStorage al inicializar
  useEffect(() => {
    const savedConfig = localStorage.getItem('notificationConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        dispatch({ type: 'SET_CONFIG', payload: config });
      } catch (error) {
        console.error('Error loading notification config:', error);
      }
    }
  }, []);

  const value: NotificationContextType = {
    ...state,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    updateConfig,
    togglePanel,
    setPanel,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
