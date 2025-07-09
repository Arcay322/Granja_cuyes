import React from 'react';
import { IconButton, Badge, Tooltip } from '../utils/mui';
import { NotificationsActive } from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationBell: React.FC = () => {
  const { notifications, togglePanel } = useNotifications();
  
  // Contar solo notificaciones del sistema (no toasts de acciones del usuario)
  const systemNotifications = notifications.filter(n => 
    !n.read && (n.priority === 'high' || n.priority === 'medium')
  );
  const systemUnreadCount = systemNotifications.length;

  return (
    <Tooltip title={`${systemUnreadCount} notificación${systemUnreadCount !== 1 ? 'es' : ''} del sistema`}>
      <IconButton
        color="inherit"
        onClick={togglePanel}
        sx={{
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        <Badge badgeContent={systemUnreadCount} color="error" max={99}>
          <NotificationsActive />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default NotificationBell;
