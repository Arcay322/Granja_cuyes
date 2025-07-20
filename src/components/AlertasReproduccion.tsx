import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Avatar, Chip, Button, Alert,
  CircularProgress, useTheme, alpha, Badge, Paper, Divider, IconButton, 
  Tooltip, Stack, Collapse, List, ListItem, ListItemText, ListItemIcon
} from '../utils/mui';
import {
  NotificationImportant, Warning, Schedule, PregnantWoman, ChildCare,
  ExpandMore, ExpandLess, Close, Refresh, CheckCircle, Error, Info
} from '@mui/icons-material';
import api from '../services/api';
import toastService from '../services/toastService';

interface AlertaReproduccion {
  tipo: string;
  prioridad: 'critica' | 'alta' | 'media' | 'baja';
  mensaje: string;
  diasVencida?: number;
  diasRestantes?: number;
  supervivencia?: number;
  diasInactiva?: number;
  data: any;
}

interface AlertasData {
  resumen: {
    total: number;
    criticas: number;
    altas: number;
    medias: number;
    bajas: number;
  };
  alertas: {
    criticas: AlertaReproduccion[];
    altas: AlertaReproduccion[];
    medias: AlertaReproduccion[];
    bajas: AlertaReproduccion[];
  };
  fechaGeneracion: string;
}

interface AlertasReproduccionProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  showDetails?: boolean;
  maxAlertas?: number;
}

const AlertasReproduccion: React.FC<AlertasReproduccionProps> = ({
  autoRefresh = true,
  refreshInterval = 300000, // 5 minutos
  showDetails = true,
  maxAlertas = 10
}) => {
  const theme = useTheme();
  const [alertas, setAlertas] = useState<AlertasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    criticas: true,
    altas: true,
    medias: false,
    bajas: false
  });

  const fetchAlertas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reproduccion/prenez/alertas-especificas');
      if (response.data.success) {
        setAlertas(response.data.data);
      }
    } catch (error) {
      console.error('Error al obtener alertas de reproducción:', error);
      toastService.error('Error', 'No se pudieron cargar las alertas de reproducción');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertas();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAlertas, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'critica': return '#f44336';
      case 'alta': return '#ff9800';
      case 'media': return '#2196f3';
      case 'baja': return '#4caf50';
      default: return '#757575';
    }
  };

  const getPriorityIcon = (tipo: string) => {
    switch (tipo) {
      case 'prenez_vencida': return <Error />;
      case 'parto_inminente': return <Schedule />;
      case 'parto_proximo': return <PregnantWoman />;
      case 'camada_baja_supervivencia': return <ChildCare />;
      case 'reproductora_inactiva': return <Warning />;
      default: return <Info />;
    }
  };

  const renderAlertasList = (alertasList: AlertaReproduccion[], prioridad: string, maxItems?: number) => {
    const itemsToShow = maxItems ? alertasList.slice(0, maxItems) : alertasList;
    
    return (
      <List dense>
        {itemsToShow.map((alerta, index) => (
          <ListItem key={index} sx={{ 
            bgcolor: alpha(getPriorityColor(prioridad), 0.05),
            borderRadius: 1,
            mb: 1,
            border: `1px solid ${alpha(getPriorityColor(prioridad), 0.2)}`
          }}>
            <ListItemIcon>
              <Avatar sx={{ 
                bgcolor: getPriorityColor(prioridad), 
                width: 32, 
                height: 32 
              }}>
                {getPriorityIcon(alerta.tipo)}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={alerta.mensaje}
              secondary={
                <Box sx={{ mt: 0.5 }}>
                  {alerta.diasVencida && (
                    <Chip 
                      label={`${alerta.diasVencida} días vencida`} 
                      size="small" 
                      color="error" 
                      sx={{ mr: 1, mb: 0.5 }}
                    />
                  )}
                  {alerta.diasRestantes && (
                    <Chip 
                      label={`${alerta.diasRestantes} días restantes`} 
                      size="small" 
                      color="warning" 
                      sx={{ mr: 1, mb: 0.5 }}
                    />
                  )}
                  {alerta.supervivencia && (
                    <Chip 
                      label={`${alerta.supervivencia}% supervivencia`} 
                      size="small" 
                      color="error" 
                      sx={{ mr: 1, mb: 0.5 }}
                    />
                  )}
                  {alerta.diasInactiva && (
                    <Chip 
                      label={`${alerta.diasInactiva}+ días inactiva`} 
                      size="small" 
                      color="default" 
                      sx={{ mr: 1, mb: 0.5 }}
                    />
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
        {maxItems && alertasList.length > maxItems && (
          <ListItem>
            <ListItemText
              primary={
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  +{alertasList.length - maxItems} alertas más...
                </Typography>
              }
            />
          </ListItem>
        )}
      </List>
    );
  };

  if (loading && !alertas) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!alertas) {
    return (
      <Alert severity="error">
        No se pudieron cargar las alertas de reproducción
      </Alert>
    );
  }

  return (
    <Box>
      {/* Resumen de alertas */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationImportant color="warning" />
            Alertas de Reproducción
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Actualizar alertas">
              <IconButton onClick={fetchAlertas} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: '#f44336', mx: 'auto', mb: 1 }}>
              <Error />
            </Avatar>
            <Typography variant="h4">{alertas.resumen.criticas}</Typography>
            <Typography variant="body2" color="text.secondary">
              Críticas
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: '#ff9800', mx: 'auto', mb: 1 }}>
              <Warning />
            </Avatar>
            <Typography variant="h4">{alertas.resumen.altas}</Typography>
            <Typography variant="body2" color="text.secondary">
              Altas
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: '#2196f3', mx: 'auto', mb: 1 }}>
              <Info />
            </Avatar>
            <Typography variant="h4">{alertas.resumen.medias}</Typography>
            <Typography variant="body2" color="text.secondary">
              Medias
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: '#4caf50', mx: 'auto', mb: 1 }}>
              <CheckCircle />
            </Avatar>
            <Typography variant="h4">{alertas.resumen.bajas}</Typography>
            <Typography variant="body2" color="text.secondary">
              Bajas
            </Typography>
          </Box>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
          Última actualización: {new Date(alertas.fechaGeneracion).toLocaleString()}
        </Typography>
      </Paper>

      {/* Alertas detalladas */}
      {showDetails && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
          {/* Alertas Críticas */}
          {alertas.resumen.criticas > 0 && (
            <Card sx={{ border: `2px solid ${alpha('#f44336', 0.3)}` }}>
              <CardContent>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleSection('criticas')}
                >
                  <Typography variant="h6" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                    🔴 Alertas Críticas ({alertas.resumen.criticas})
                  </Typography>
                  {expandedSections.criticas ? <ExpandLess /> : <ExpandMore />}
                </Box>
                <Collapse in={expandedSections.criticas}>
                  <Box sx={{ mt: 2 }}>
                    {renderAlertasList(alertas.alertas.criticas, 'critica', maxAlertas)}
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          )}

          {/* Alertas Altas */}
          {alertas.resumen.altas > 0 && (
            <Card sx={{ border: `2px solid ${alpha('#ff9800', 0.3)}` }}>
              <CardContent>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleSection('altas')}
                >
                  <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                    🟠 Alertas Altas ({alertas.resumen.altas})
                  </Typography>
                  {expandedSections.altas ? <ExpandLess /> : <ExpandMore />}
                </Box>
                <Collapse in={expandedSections.altas}>
                  <Box sx={{ mt: 2 }}>
                    {renderAlertasList(alertas.alertas.altas, 'alta', maxAlertas)}
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          )}

          {/* Alertas Medias */}
          {alertas.resumen.medias > 0 && (
            <Card sx={{ border: `2px solid ${alpha('#2196f3', 0.3)}` }}>
              <CardContent>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleSection('medias')}
                >
                  <Typography variant="h6" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                    🟡 Alertas Medias ({alertas.resumen.medias})
                  </Typography>
                  {expandedSections.medias ? <ExpandLess /> : <ExpandMore />}
                </Box>
                <Collapse in={expandedSections.medias}>
                  <Box sx={{ mt: 2 }}>
                    {renderAlertasList(alertas.alertas.medias, 'media', maxAlertas)}
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          )}

          {/* Alertas Bajas */}
          {alertas.resumen.bajas > 0 && (
            <Card sx={{ border: `2px solid ${alpha('#4caf50', 0.3)}` }}>
              <CardContent>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleSection('bajas')}
                >
                  <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                    🔵 Alertas Bajas ({alertas.resumen.bajas})
                  </Typography>
                  {expandedSections.bajas ? <ExpandLess /> : <ExpandMore />}
                </Box>
                <Collapse in={expandedSections.bajas}>
                  <Box sx={{ mt: 2 }}>
                    {renderAlertasList(alertas.alertas.bajas, 'baja', maxAlertas)}
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Mensaje cuando no hay alertas */}
      {alertas.resumen.total === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: alpha('#4caf50', 0.05) }}>
          <Avatar sx={{ bgcolor: '#4caf50', mx: 'auto', mb: 2, width: 56, height: 56 }}>
            <CheckCircle sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h6" sx={{ color: '#4caf50', mb: 1 }}>
            ¡Todo en orden!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No hay alertas de reproducción en este momento
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default AlertasReproduccion;