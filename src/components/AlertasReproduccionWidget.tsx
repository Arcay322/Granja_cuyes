import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon,
  Divider, Chip, CircularProgress, Alert
} from '../utils/mui';
import { Pets, Warning, CalendarToday, Favorite } from '@mui/icons-material';
import api from '../services/api';

interface AlertaReproduccion {
  tipo: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  prioridad: 'alta' | 'media' | 'baja';
  count?: number;
}

const AlertasReproduccionWidget = () => {
  const [alertas, setAlertas] = useState<AlertaReproduccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlertas = async () => {
      try {
        setLoading(true);
        const response = await api.get('/reproduccion/prenez/alertas');
        
        if (response.data.success) {
          const data = response.data.data;
          const alertasFormateadas: AlertaReproduccion[] = [];

          // Próximos partos
          if (data.proximosPartos > 0) {
            alertasFormateadas.push({
              tipo: 'parto_proximo',
              titulo: 'Próximos Partos',
              descripcion: `${data.proximosPartos} cuyes con parto estimado en los próximos 7 días`,
              fecha: new Date().toLocaleDateString(),
              prioridad: 'alta',
              count: data.proximosPartos
            });
          }

          // Preñeces vencidas
          if (data.prenecesVencidas > 0) {
            alertasFormateadas.push({
              tipo: 'prenez_vencida',
              titulo: 'Preñeces Vencidas',
              descripcion: `${data.prenecesVencidas} preñeces han superado el período normal de gestación`,
              fecha: new Date().toLocaleDateString(),
              prioridad: 'alta',
              count: data.prenecesVencidas
            });
          }

          // Reproductoras inactivas
          if (data.reproductorasInactivas > 0) {
            alertasFormateadas.push({
              tipo: 'reproductora_inactiva',
              titulo: 'Reproductoras Inactivas',
              descripcion: `${data.reproductorasInactivas} reproductoras sin actividad en los últimos 90 días`,
              fecha: new Date().toLocaleDateString(),
              prioridad: 'media',
              count: data.reproductorasInactivas
            });
          }

          setAlertas(alertasFormateadas);
        } else {
          setError('No se pudieron cargar las alertas');
        }
      } catch (error) {
        console.error('Error al cargar alertas de reproducción:', error);
        setError('Error al cargar alertas de reproducción');
      } finally {
        setLoading(false);
      }
    };

    fetchAlertas();
  }, []);

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

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'parto_proximo':
        return <CalendarToday />;
      case 'prenez_vencida':
        return <Warning />;
      case 'reproductora_inactiva':
        return <Favorite />;
      default:
        return <Pets />;
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Favorite color="secondary" sx={{ mr: 1 }} />
          <Typography variant="h6">
            Alertas de Reproducción
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Favorite color="secondary" sx={{ mr: 1 }} />
          <Typography variant="h6">
            Alertas de Reproducción
          </Typography>
        </Box>
        <Alert severity="error">
          {error}
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Favorite color="secondary" sx={{ mr: 1 }} />
        <Typography variant="h6">
          Alertas de Reproducción
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Monitoreo de eventos reproductivos importantes
      </Typography>
      
      {alertas.length === 0 ? (
        <Alert severity="info">
          No hay alertas de reproducción activas
        </Alert>
      ) : (
        <List disablePadding>
          {alertas.map((alerta, index) => (
            <React.Fragment key={index}>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  {getIcon(alerta.tipo)}
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {alerta.titulo}
                      <Chip 
                        label={`Prioridad ${alerta.prioridad}`} 
                        color={getChipColor(alerta.prioridad) as any}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      {alerta.descripcion}
                      <Box sx={{ mt: 1, fontSize: '0.8rem', color: 'text.secondary' }}>
                        {alerta.fecha}
                      </Box>
                    </>
                  }
                />
              </ListItem>
              {index < alertas.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default AlertasReproduccionWidget;