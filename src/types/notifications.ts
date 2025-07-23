// Definiciones de tipos para notificaciones

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  date: string;
  timestamp: Date;
  link?: string;
  category?: 'system' | 'stock' | 'reproductive' | 'sales' | 'health';
  priority?: 'low' | 'medium' | 'high';
}

export interface NotificationConfig {
  enabled: boolean;
  frequency: number;
  types: string[];
  stockAlerts?: boolean;
  reproductiveAlerts?: boolean;
  salesNotifications?: boolean;
  healthReminders?: boolean;
  systemUpdates?: boolean;
}

export interface NotificationRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: any[];
  actions: any[];
}