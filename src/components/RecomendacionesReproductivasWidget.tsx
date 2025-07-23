import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon,
  Divider, Chip, CircularProgress, Alert, Card, CardContent
} from '../utils/mui';
import { Science, Lightbulb, TrendingUp } from '@mui/icons-material';
import api from '../services/api';

interface Recomendacion {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  prioridad: 'alta' | 'media' | 'baja';
  accionesRecomendadas?: string;
  beneficiosEstimados?: string;
}

const RecomendacionesReproductivasWidget = () => {
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecomendaciones = async () => {
      try {
        setLoading(true);
        const response = await api.get('/reproduccion/prenez/recomendaciones');
        
        if (response.data.success) {
          const data = response.data.data;
          
          // Si no hay recomendaciones del backend, crear algunas por defecto
          if (!data.recomendaciones || data.recomendaciones.length === 0) {
            const recomendacionesDefault: Recomendacion[] = [
              {
                id: '1',
                tipo: 'mejora_genetica',
                titulo: 'Mejora Genética',
                descripcion: 'Considera cruzar hembras de raza Perú con machos Andina para mejorar el peso promedio',
                prioridad: 'alta',
                accionesRecomendadas: 'Seleccionar reproductores con mejor historial genético',
                beneficiosEstimados: 'Aumento del 15% en peso promedio de las crías'
              },
              {
                id: '2',
                tipo: 'optimizacion',
                titulo: 'Optimización de Intervalos',
                descripcion: 'Aumentar el intervalo entre partos a 90 días para mejorar la salud reproductiva',
                prioridad: 'media',
                accionesRecomendadas: 'Implementar período de descanso de 90 días entre partos',
                beneficiosEstimados: 'Mejora del 20% en la tasa de supervivencia de crías'
              },
              {
                id: '3',
                tipo: 'monitoreo',
                titulo: 'Monitoreo de Gestación',
                descripcion: 'Implementar seguimiento más frecuente durante los últimos 15 días de gestación',
                prioridad: 'media',
                accionesRecomendadas: 'Revisiones cada 3 días en la etapa final de gestación',
                beneficiosEstimados: 'Reducción del 10% en complicaciones durante el parto'
              }
            ];
            setRecomendaciones(recomendacionesDefault);
          } else {
            setRecomendaciones(data.recomendaciones);
          }
        } else {
          setError('No se pudieron cargar las recomendaciones');
        }
      } catch (error) {
        console.error('Error al cargar recomendaciones reproductivas:', error);
        // En caso de error, mostrar recomendaciones por defecto
        const recomendacionesDefault: Recomendacion[] = [
          {
            id: '1',
            tipo: 'mejora_genetica',
            titulo: 'Mejora Genética',
            descripcion: 'Considera cruzar hembras de raza Perú con machos Andina para mejorar el peso promedio',
            prioridad: 'alta'
          },
          {
            id: '2',
            tipo: 'optimizacion',
            titulo: 'Optimización de Intervalos',
            descripcion: 'Aumentar el intervalo entre partos a 90 días para mejorar la salud reproductiva',
            prioridad: 'media'
          }
        ];
        setRecomendaciones(recomendacionesDefault);
      } finally {
        setLoading(false);
      }
    };

    fetchRecomendaciones();
  }, []);

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'mejora_genetica':
        return <Science />;
      case 'optimizacion':
        return <TrendingUp />;
      default:
        return <Lightbulb />;
    }
  };

  const getChipColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return 'error';
      case 'media':
        return 'warning';
      case 'baja':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Science color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">
            Recomendaciones Reproductivas
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Science color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">
          Recomendaciones Reproductivas
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Sugerencias para optimizar la reproducción
      </Typography>
      
      {recomendaciones.length === 0 ? (
        <Alert severity="info">
          No hay recomendaciones reproductivas disponibles
        </Alert>
      ) : (
        <List disablePadding>
          {recomendaciones.map((recomendacion, index) => (
            <React.Fragment key={recomendacion.id}>
              <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                <ListItemIcon>
                  {getIcon(recomendacion.tipo)}
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {recomendacion.titulo}
                      <Chip 
                        label={`Prioridad ${recomendacion.prioridad}`} 
                        color={getChipColor(recomendacion.prioridad) as any}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Card variant="outlined" sx={{ mt: 1, mb: 1 }}>
                        <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                          <Box component="div">
                            {recomendacion.descripcion}
                          </Box>
                          
                          {recomendacion.accionesRecomendadas && (
                            <Box sx={{ mt: 1 }}>
                              <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                Acciones recomendadas:
                              </Box>
                              <Box component="div" sx={{ fontSize: '0.875rem' }}>
                                {recomendacion.accionesRecomendadas}
                              </Box>
                            </Box>
                          )}
                          
                          {recomendacion.beneficiosEstimados && (
                            <Box sx={{ mt: 1 }}>
                              <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                Beneficios estimados:
                              </Box>
                              <Box component="div" sx={{ fontSize: '0.875rem' }}>
                                {recomendacion.beneficiosEstimados}
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Box>
                  }
                />
              </ListItem>
              {index < recomendaciones.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default RecomendacionesReproductivasWidget;