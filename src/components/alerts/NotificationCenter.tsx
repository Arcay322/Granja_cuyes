import React, { useState, useEffect, useCallback } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Box,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  MarkEmailRead as MarkReadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { isSuccessfulApiResponse, extractErrorMessage } from '../../utils/typeGuards';
import { AlertsResponse, Alert as AlertType } from '../../types/api';

interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data: unknown;
  createdAt: string;
  readAt?: string;
  actionTaken?: string;
}

interface NotificationCenterProps {
  maxItems?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  maxItems = 5,
  autoRefresh = true,
  refreshInterval = 30000 // 30 segundos
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Cargar alertas no leídas
  const loadUnreadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/alerts?read=false');
      
      if (isSuccessfulApiResponse<Alert[]>(response.data)) {
        const unreadAlerts = response.data.data.slice(0, maxItems);
        setAlerts(unreadAlerts);
        setUnreadCount(response.data.data.length);
      }
    } catch (error) {
      console.error('Error cargando alertas:', error);
    } finally {
      setLoading(false);
    }
  }, [maxItems]);

  // Efectos
  useEffect(() => {
    loadUnreadAlerts();
  }, [loadUnreadAlerts]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadUnreadAlerts();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadUnreadAlerts]);

  // Manejadores de eventos
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await api.patch(`/alerts/${alertId}/read`);
      loadUnreadAlerts();
    } catch (error) {
      console.error('Error marcando alerta como leída:', error);
    }
  };

  const handleViewAll = () => {
    handleClose();
    navigate('/alerts'); // Asumiendo que tienes una ruta para alertas
  };

  const handleRefresh = () => {
    loadUnreadAlerts();
  };

  // Funciones de utilidad
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'high':
        return <WarningIcon color="warning" fontSize="small" />;
      case 'medium':
        return <InfoIcon color="info" fontSize="small" />;
      case 'low':
        return <CheckCircleIcon color="success" fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  const getSeverityColor = (severity: string): 'error' | 'warning' | 'info' | 'success' => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'info';
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ 
          position: 'relative',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <Badge 
          badgeContent={unreadCount} 
          color="error"
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%': {
                  transform: 'scale(1)',
                },
                '50%': {
                  transform: 'scale(1.1)',
                },
                '100%': {
                  transform: 'scale(1)',
                },
              },
            }
          }}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { 
            width: 400, 
            maxHeight: 500,
            mt: 1
          }
        }}
      >
        <Paper>
          {/* Header */}
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            p={2}
            borderBottom={1}
            borderColor="divider"
          >
            <Typography variant="h6">
              Notificaciones
            </Typography>
            <Box display="flex" gap={1}>
              <IconButton size="small" onClick={handleRefresh} disabled={loading}>
                <RefreshIcon fontSize="small" />
              </IconButton>
              {unreadCount > 0 && (
                <Chip 
                  label={`${unreadCount} nuevas`} 
                  color="error" 
                  size="small" 
                />
              )}
            </Box>
          </Box>

          {/* Content */}
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress size={24} />
            </Box>
          ) : alerts.length === 0 ? (
            <Box p={3} textAlign="center">
              <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No hay notificaciones nuevas
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0, maxHeight: 300, overflow: 'auto' }}>
              {alerts.map((alert, index) => (
                <React.Fragment key={alert.id}>
                  <ListItem
                    sx={{
                      alignItems: 'flex-start',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ mt: 1 }}>
                      {getSeverityIcon(alert.severity)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {alert.title}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleMarkAsRead(alert.id)}
                            sx={{ ml: 1 }}
                          >
                            <MarkReadIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {alert.message.length > 80 
                              ? `${alert.message.substring(0, 80)}...` 
                              : alert.message
                            }
                          </Typography>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(alert.createdAt), { 
                                addSuffix: true, 
                                locale: es 
                              })}
                            </Typography>
                            <Chip
                              label={alert.severity}
                              size="small"
                              color={getSeverityColor(alert.severity)}
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < alerts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}

          {/* Footer */}
          {alerts.length > 0 && (
            <>
              <Divider />
              <Box p={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleViewAll}
                  size="small"
                >
                  Ver todas las alertas
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Popover>
    </>
  );
};

export default NotificationCenter;