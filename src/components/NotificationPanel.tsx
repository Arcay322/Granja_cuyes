import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  Divider,
  Tooltip,
  Badge,
  useTheme,
  alpha,
  Paper,
} from '../utils/mui';
import {
  Close,
  NotificationsActive,
  Warning,
  CheckCircle,
  Error,
  Info,
  Inventory,
  Pets,
  AttachMoney,
  Settings,
  MarkAsUnread,
  Delete,
  DoneAll,
  DeleteSweep,
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';
import type { Notification } from '../types/notifications';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const getNotificationIcon = (type: Notification['type'], category: Notification['category']) => {
  const iconProps = { fontSize: 'small' as const };
  
  if (category === 'stock') return <Inventory {...iconProps} />;
  if (category === 'health') return <Pets {...iconProps} />;
  if (category === 'sales') return <AttachMoney {...iconProps} />;
  if (category === 'reproductive') return <Pets {...iconProps} />;
  
  switch (type) {
    case 'success':
      return <CheckCircle {...iconProps} />;
    case 'warning':
      return <Warning {...iconProps} />;
    case 'error':
      return <Error {...iconProps} />;
    default:
      return <Info {...iconProps} />;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'info';
  }
};

const getCategoryColor = (category: Notification['category']) => {
  switch (category) {
    case 'stock':
      return '#ff9800';
    case 'health':
      return '#4caf50';
    case 'sales':
      return '#2196f3';
    case 'reproductive':
      return '#e91e63';
    default:
      return '#9e9e9e';
  }
};

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  const { markAsRead, removeNotification } = useNotifications();
  const theme = useTheme();

  const handleMarkAsRead = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNotification(notification.id);
  };

  return (
    <ListItem
      sx={{
        backgroundColor: notification.read ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
        border: `1px solid ${notification.read ? 'transparent' : alpha(theme.palette.primary.main, 0.1)}`,
        borderRadius: 1,
        mb: 1,
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: alpha(theme.palette.action.hover, 0.1),
        },
      }}
      onClick={handleMarkAsRead}
    >
      <ListItemAvatar>
        <Avatar
          sx={{
            backgroundColor: alpha(getCategoryColor(notification.category), 0.1),
            color: getCategoryColor(notification.category),
            width: 40,
            height: 40,
          }}
        >
          {getNotificationIcon(notification.type, notification.category)}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="subtitle2" fontWeight={notification.read ? 'normal' : 'bold'}>
              {notification.title}
            </Typography>
            <Chip
              label={notification.category}
              size="small"
              sx={{
                fontSize: '0.7rem',
                height: 20,
                backgroundColor: alpha(getCategoryColor(notification.category), 0.1),
                color: getCategoryColor(notification.category),
              }}
            />
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {notification.message}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {formatDistanceToNow(notification.timestamp, { addSuffix: true, locale: es })}
            </Typography>
          </Box>
        }
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Tooltip title="Eliminar notificación">
          <IconButton size="small" onClick={handleRemove}>
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
        {!notification.read && (
          <Chip
            label="Nuevo"
            size="small"
            color="primary"
            sx={{ fontSize: '0.6rem', height: 18 }}
          />
        )}
      </Box>
    </ListItem>
  );
};

const NotificationPanel: React.FC = () => {
  const {
    notifications,
    isOpen,
    setPanel,
    markAsRead,
    removeNotification,
  } = useNotifications();
  const theme = useTheme();

  const handleClose = () => {
    setPanel(false);
  };

  // Filtrar solo notificaciones del sistema (no toasts de acciones del usuario)
  const systemNotifications = notifications.filter(n => n.priority === 'high' || n.priority === 'medium');
  const recentNotifications = systemNotifications.slice(0, 20); // Mostrar últimas 20

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          backgroundColor: theme.palette.background.default,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsActive color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Notificaciones del Sistema
            </Typography>
            {systemNotifications.filter(n => !n.read).length > 0 && (
              <Badge badgeContent={systemNotifications.filter(n => !n.read).length} color="error" />
            )}
          </Box>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>

        {/* Actions */}
        {systemNotifications.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DoneAll />}
              onClick={() => {
                // Marcar solo notificaciones del sistema como leídas
                systemNotifications.forEach(n => {
                  if (!n.read) markAsRead(n.id);
                });
              }}
              disabled={systemNotifications.filter(n => !n.read).length === 0}
            >
              Marcar todas
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DeleteSweep />}
              onClick={() => {
                // Limpiar solo notificaciones del sistema
                systemNotifications.forEach(n => removeNotification(n.id));
              }}
              color="error"
            >
              Limpiar todo
            </Button>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Notifications List */}
        {recentNotifications.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <NotificationsActive sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay notificaciones
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Te notificaremos cuando haya novedades importantes en tu granja
            </Typography>
          </Paper>
        ) : (
          <List sx={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
            {recentNotifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </List>
        )}

        {/* Footer */}
        {notifications.length > 20 && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.disabled">
              Mostrando las últimas 20 notificaciones
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default NotificationPanel;
