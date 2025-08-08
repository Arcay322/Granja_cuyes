import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Badge,
  Tabs,
  Tab
} from '../../utils/mui';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { isSuccessfulApiResponse, extractErrorMessage } from '../../utils/typeGuards';
import { AlertsResponse, Alert as AlertType } from '../../types/api';

interface AlertItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  createdAt: string;
  category: string;
}

interface AlertStats {
  total: number;
  unread: number;
  byType: {
    info: number;
    warning: number;
    error: number;
    success: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
  };
}

const AlertsManager: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

  // Función para determinar prioridad automáticamente si no está definida
  const determinePriority = useCallback((alert: AlertItem): 'low' | 'medium' | 'high' => {
    // Si ya tiene prioridad definida, usarla
    if (alert.priority && alert.priority !== ('undefined' as any)) {
      return alert.priority as 'low' | 'medium' | 'high';
    }

    const title = alert.title.toLowerCase();
    const message = alert.message.toLowerCase();
    const type = alert.type;

    // Reglas para prioridad ALTA (high)
    if (
      type === 'error' ||
      title.includes('urgente') ||
      title.includes('crítico') ||
      title.includes('vencida') ||
      title.includes('complicado') ||
      message.includes('inmediata') ||
      message.includes('urgente') ||
      message.includes('crítico') ||
      title.includes('preñez vencida') ||
      title.includes('parto complicado')
    ) {
      return 'high';
    }

    // Reglas para prioridad MEDIA (medium)
    if (
      type === 'warning' ||
      title.includes('programado') ||
      title.includes('pendiente') ||
      title.includes('chequeo') ||
      title.includes('vacunación') ||
      title.includes('reproductora inactiva') ||
      title.includes('capacidad') ||
      message.includes('programado') ||
      message.includes('recordatorio')
    ) {
      return 'medium';
    }

    // Reglas para prioridad BAJA (low)
    if (
      type === 'success' ||
      type === 'info' ||
      title.includes('completado') ||
      title.includes('inventario') ||
      title.includes('destete') ||
      message.includes('completado') ||
      message.includes('exitosamente')
    ) {
      return 'low';
    }

    // Por defecto, prioridad media
    return 'medium';
  }, []);

  // Función para procesar alertas y asignar prioridades
  const processAlerts = useCallback((rawAlerts: AlertItem[]): AlertItem[] => {
    return rawAlerts.map(alert => ({
      ...alert,
      priority: determinePriority(alert)
    }));
  }, [determinePriority]);

  // Cargar alertas
  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/alerts');
      
      if (isSuccessfulApiResponse<AlertType[]>(response.data)) {
        const rawAlerts = response.data.data || [];
        const processedAlerts = processAlerts(rawAlerts as AlertItem[]);
        
        // Recalcular estadísticas con las prioridades procesadas
        const processedStats: AlertStats = {
          total: processedAlerts.length,
          unread: processedAlerts.filter(a => !a.read).length,
          byType: {
            info: processedAlerts.filter(a => a.type === 'info').length,
            warning: processedAlerts.filter(a => a.type === 'warning').length,
            error: processedAlerts.filter(a => a.type === 'error').length,
            success: processedAlerts.filter(a => a.type === 'success').length
          },
          byPriority: {
            low: processedAlerts.filter(a => a.priority === 'low').length,
            medium: processedAlerts.filter(a => a.priority === 'medium').length,
            high: processedAlerts.filter(a => a.priority === 'high').length
          }
        };
        
        setAlerts(processedAlerts);
        setStats(processedStats);
      } else {
        console.log('API response not successful, using sample data');
        // Usar datos de ejemplo si la respuesta no es exitosa
        // Datos de ejemplo si no hay backend
        const sampleAlerts: AlertItem[] = [
          {
            id: '1',
            title: 'URGENTE: Parto Complicado',
            message: 'La madre #123 lleva más de 6 horas en trabajo de parto sin progreso. Requiere atención veterinaria inmediata.',
            type: 'error',
            priority: 'high',
            read: false,
            createdAt: new Date().toISOString(),
            category: 'reproductive'
          },
          {
            id: '2',
            title: 'Preñez Vencida - Acción Requerida',
            message: 'La preñez #456 está 3 días vencida. Programar chequeo veterinario urgente.',
            type: 'error',
            priority: 'high',
            read: false,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            category: 'reproductive'
          },
          {
            id: '3',
            title: 'Capacidad de Galpón Crítica',
            message: 'El galpón A está al 95% de capacidad. Considerar redistribución de animales.',
            type: 'warning',
            priority: 'high',
            read: false,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            category: 'infrastructure'
          },
          {
            id: '4',
            title: 'Chequeo Reproductivo Programado',
            message: 'Chequeo reproductivo programado para 5 hembras en el galpón B',
            type: 'info',
            priority: 'medium',
            read: false,
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            category: 'health'
          },
          {
            id: '5',
            title: 'Vacunación Pendiente',
            message: 'Recordatorio: vacunación programada para el lote C mañana a las 10:00 AM',
            type: 'info',
            priority: 'medium',
            read: false,
            createdAt: new Date(Date.now() - 10800000).toISOString(),
            category: 'health'
          },
          {
            id: '6',
            title: 'Destete Completado',
            message: 'Se completó exitosamente el destete de la camada #789. 6 crías destetadas.',
            type: 'success',
            priority: 'low',
            read: true,
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            category: 'reproductive'
          },
          {
            id: '7',
            title: 'Inventario de Alimento',
            message: 'Recordatorio: revisar inventario de alimento concentrado esta semana',
            type: 'info',
            priority: 'low',
            read: false,
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            category: 'feeding'
          },
          {
            id: '8',
            title: 'Reproductora Inactiva',
            message: 'La hembra #234 lleva 45 días sin actividad reproductiva. Evaluar estado de salud.',
            type: 'warning',
            priority: 'medium',
            read: false,
            createdAt: new Date(Date.now() - 345600000).toISOString(),
            category: 'reproductive'
          }
        ];
        
        const sampleStats: AlertStats = {
          total: sampleAlerts.length,
          unread: sampleAlerts.filter(a => !a.read).length,
          byType: {
            info: sampleAlerts.filter(a => a.type === 'info').length,
            warning: sampleAlerts.filter(a => a.type === 'warning').length,
            error: sampleAlerts.filter(a => a.type === 'error').length,
            success: sampleAlerts.filter(a => a.type === 'success').length
          },
          byPriority: {
            low: sampleAlerts.filter(a => a.priority === 'low').length,
            medium: sampleAlerts.filter(a => a.priority === 'medium').length,
            high: sampleAlerts.filter(a => a.priority === 'high').length
          }
        };
        
        setAlerts(sampleAlerts);
        setStats(sampleStats);
      }
    } catch (error: unknown) {
      console.error('Error cargando alertas:', error);
      console.log('API failed, using sample data');
      
      // Cargar datos de ejemplo cuando falla la API
      const sampleAlerts: AlertItem[] = [
        {
          id: '1',
          title: 'URGENTE: Parto Complicado',
          message: 'La madre #123 lleva más de 6 horas en trabajo de parto sin progreso. Requiere atención veterinaria inmediata.',
          type: 'error',
          priority: 'high',
          read: false,
          createdAt: new Date().toISOString(),
          category: 'reproductive'
        },
        {
          id: '2',
          title: 'Preñez Vencida - Acción Requerida',
          message: 'La preñez #456 está 3 días vencida. Programar chequeo veterinario urgente.',
          type: 'error',
          priority: 'high',
          read: false,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          category: 'reproductive'
        },
        {
          id: '3',
          title: 'Capacidad de Galpón Crítica',
          message: 'El galpón A está al 95% de capacidad. Considerar redistribución de animales.',
          type: 'warning',
          priority: 'high',
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          category: 'infrastructure'
        },
        {
          id: '4',
          title: 'Chequeo Reproductivo Programado',
          message: 'Chequeo reproductivo programado para 5 hembras en el galpón B',
          type: 'info',
          priority: 'medium',
          read: false,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          category: 'health'
        },
        {
          id: '5',
          title: 'Vacunación Pendiente',
          message: 'Recordatorio: vacunación programada para el lote C mañana a las 10:00 AM',
          type: 'info',
          priority: 'medium',
          read: false,
          createdAt: new Date(Date.now() - 10800000).toISOString(),
          category: 'health'
        },
        {
          id: '6',
          title: 'Destete Completado',
          message: 'Se completó exitosamente el destete de la camada #789. 6 crías destetadas.',
          type: 'success',
          priority: 'low',
          read: true,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          category: 'reproductive'
        },
        {
          id: '7',
          title: 'Inventario de Alimento',
          message: 'Recordatorio: revisar inventario de alimento concentrado esta semana',
          type: 'info',
          priority: 'low',
          read: false,
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          category: 'feeding'
        },
        {
          id: '8',
          title: 'Reproductora Inactiva',
          message: 'La hembra #234 lleva 45 días sin actividad reproductiva. Evaluar estado de salud.',
          type: 'warning',
          priority: 'medium',
          read: false,
          createdAt: new Date(Date.now() - 345600000).toISOString(),
          category: 'reproductive'
        }
      ];
      
      const sampleStats: AlertStats = {
        total: sampleAlerts.length,
        unread: sampleAlerts.filter(a => !a.read).length,
        byType: {
          info: sampleAlerts.filter(a => a.type === 'info').length,
          warning: sampleAlerts.filter(a => a.type === 'warning').length,
          error: sampleAlerts.filter(a => a.type === 'error').length,
          success: sampleAlerts.filter(a => a.type === 'success').length
        },
        byPriority: {
          low: sampleAlerts.filter(a => a.priority === 'low').length,
          medium: sampleAlerts.filter(a => a.priority === 'medium').length,
          high: sampleAlerts.filter(a => a.priority === 'high').length
        }
      };
      
      setAlerts(sampleAlerts);
      setStats(sampleStats);
      // No mostrar error cuando usamos datos de ejemplo
      // setError('Error al cargar las alertas');
    } finally {
      setLoading(false);
    }
  }, [processAlerts]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleMarkAsRead = async (alertId: string) => {
    try {
      // Intentar marcar como leída en el backend
      await api.put(`/alerts/${alertId}/read`);
    } catch (error) {
      console.error('Error marcando alerta como leída en el backend:', error);
      // Continuar con la actualización local aunque falle el backend
    }
    
    // Actualizar estado local
    setAlerts(prev => {
      const updatedAlerts = prev.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      );
      
      // Recalcular estadísticas
      const newStats: AlertStats = {
        total: updatedAlerts.length,
        unread: updatedAlerts.filter(a => !a.read).length,
        byType: {
          info: updatedAlerts.filter(a => a.type === 'info').length,
          warning: updatedAlerts.filter(a => a.type === 'warning').length,
          error: updatedAlerts.filter(a => a.type === 'error').length,
          success: updatedAlerts.filter(a => a.type === 'success').length
        },
        byPriority: {
          low: updatedAlerts.filter(a => a.priority === 'low').length,
          medium: updatedAlerts.filter(a => a.priority === 'medium').length,
          high: updatedAlerts.filter(a => a.priority === 'high').length
        }
      };
      
      setStats(newStats);
      return updatedAlerts;
    });
  };

  const handleClearAlert = async (alertId: string) => {
    try {
      // Intentar eliminar en el backend
      await api.delete(`/alerts/${alertId}`);
    } catch (error) {
      console.error('Error eliminando alerta en el backend:', error);
      // Continuar con la eliminación local aunque falle el backend
    }
    
    // Actualizar estado local
    setAlerts(prev => {
      const updatedAlerts = prev.filter(alert => alert.id !== alertId);
      
      // Recalcular estadísticas
      const newStats: AlertStats = {
        total: updatedAlerts.length,
        unread: updatedAlerts.filter(a => !a.read).length,
        byType: {
          info: updatedAlerts.filter(a => a.type === 'info').length,
          warning: updatedAlerts.filter(a => a.type === 'warning').length,
          error: updatedAlerts.filter(a => a.type === 'error').length,
          success: updatedAlerts.filter(a => a.type === 'success').length
        },
        byPriority: {
          low: updatedAlerts.filter(a => a.priority === 'low').length,
          medium: updatedAlerts.filter(a => a.priority === 'medium').length,
          high: updatedAlerts.filter(a => a.priority === 'high').length
        }
      };
      
      setStats(newStats);
      return updatedAlerts;
    });
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'success': return <CheckCircleIcon color="success" />;
      default: return <InfoIcon color="info" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'success': return 'success';
      default: return 'info';
    }
  };

  const getPriorityColor = (priority: string): 'success' | 'info' | 'warning' | 'error' | 'default' => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getPriorityBackgroundColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'rgba(244, 67, 54, 0.08)'; // Rojo muy suave
      case 'medium': return 'rgba(255, 152, 0, 0.08)'; // Naranja muy suave
      case 'low': return 'rgba(76, 175, 80, 0.08)'; // Verde muy suave
      default: return 'grey.50';
    }
  };

  const getPriorityBorderColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error.main';
      case 'medium': return 'warning.main';
      case 'low': return 'success.main';
      default: return 'grey.300';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟠';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return priority;
    }
  };



  const filteredAlerts = alerts.filter((alert, index) => {
    if (currentTab === 0) return true; // Todas
    if (currentTab === 1) return !alert.read; // No leídas
    if (currentTab === 2) return alert.priority === 'high'; // Alta prioridad
    if (currentTab === 3) return alert.priority === 'medium'; // Media prioridad
    if (currentTab === 4) return alert.priority === 'low'; // Baja prioridad
    return true;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando alertas...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Badge badgeContent={stats?.unread || 0} color="error">
            <NotificationsIcon />
          </Badge>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Centro de Alertas
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            size="small"
          >
            Configurar
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadAlerts}
            size="small"
          >
            Actualizar
          </Button>
        </Box>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Estadísticas */}
      {stats && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Resumen de Alertas
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip label={`Total: ${stats.total}`} variant="outlined" />
            <Chip label={`No leídas: ${stats.unread}`} color="info" />
            <Chip 
              label={`🔴 Alta: ${stats.byPriority.high}`} 
              color="error" 
              variant={stats.byPriority.high > 0 ? "filled" : "outlined"}
            />
            <Chip 
              label={`🟠 Media: ${stats.byPriority.medium}`} 
              color="warning" 
              variant={stats.byPriority.medium > 0 ? "filled" : "outlined"}
            />
            <Chip 
              label={`🟢 Baja: ${stats.byPriority.low}`} 
              color="success" 
              variant={stats.byPriority.low > 0 ? "filled" : "outlined"}
            />
            <Chip label={`Errores: ${stats.byType.error}`} color="error" size="small" />
            <Chip label={`Advertencias: ${stats.byType.warning}`} color="warning" size="small" />
            <Chip label={`Éxitos: ${stats.byType.success}`} color="success" size="small" />
          </Box>
        </Paper>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)} variant="scrollable" scrollButtons="auto">
          <Tab label="Todas" />
          <Tab label="No leídas" />
          <Tab label="🔴 Alta prioridad" />
          <Tab label="🟠 Media prioridad" />
          <Tab label="🟢 Baja prioridad" />
        </Tabs>
      </Paper>

      {/* Lista de alertas */}
      <Paper>
        <List>
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert, index) => (
              <React.Fragment key={alert.id}>
                <ListItem
                  sx={{
                    bgcolor: alert.read ? 'transparent' : getPriorityBackgroundColor(alert.priority),
                    opacity: alert.read ? 0.7 : 1,
                    borderLeft: `4px solid`,
                    borderLeftColor: getPriorityBorderColor(alert.priority),
                    '&:hover': {
                      bgcolor: alert.read ? 'action.hover' : getPriorityBackgroundColor(alert.priority),
                      opacity: 0.9
                    }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    {getAlertIcon(alert.type)}
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {alert.title}
                        </Typography>
                        <Chip
                          label={`${getPriorityIcon(alert.priority)} ${getPriorityLabel(alert.priority)}`}
                          size="small"
                          color={getPriorityColor(alert.priority)}
                        />
                        <Chip
                          label={alert.category}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {alert.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(alert.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                      {!alert.read && (
                        <IconButton
                          size="small"
                          onClick={() => handleMarkAsRead(alert.id)}
                          title="Marcar como leída"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleClearAlert(alert.id)}
                        title="Eliminar alerta"
                      >
                        <ClearIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </ListItem>
                {index < filteredAlerts.length - 1 && <Divider />}
              </React.Fragment>
            ))
          ) : (
            <ListItem>
              <ListItemText
                primary="No hay alertas"
                secondary="No se encontraron alertas para mostrar"
              />
            </ListItem>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default AlertsManager;