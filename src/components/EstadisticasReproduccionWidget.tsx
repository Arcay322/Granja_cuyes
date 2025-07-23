import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, CircularProgress, Alert
} from '../utils/mui';
import { TrendingUp } from '@mui/icons-material';
import api from '../services/api';

interface EstadisticasReproduccion {
  totalPreneces: number;
  prenecesActivas: number;
  prenecesCompletadas: number;
  prenecesExitosas: number;
  tasaExito: number;
  promedioGestacion: number;
  proximosPartos: number;
}

const EstadisticasReproduccionWidget = () => {
  const [estadisticas, setEstadisticas] = useState<EstadisticasReproduccion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEstadisticas = async () => {
      try {
        setLoading(true);
        const response = await api.get('/reproduccion/prenez/stats');
        
        if (response.data.success) {
          setEstadisticas(response.data.data);
        } else {
          setError('No se pudieron cargar las estadísticas');
        }
      } catch (error) {
        console.error('Error al cargar estadísticas de reproducción:', error);
        setError('Error al cargar estadísticas de reproducción');
      } finally {
        setLoading(false);
      }
    };

    fetchEstadisticas();
  }, []);

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TrendingUp color="success" sx={{ mr: 1 }} />
          <Typography variant="h6">
            Análisis Reproductivo
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
          <TrendingUp color="success" sx={{ mr: 1 }} />
          <Typography variant="h6">
            Análisis Reproductivo
          </Typography>
        </Box>
        <Alert severity="error">
          {error}
        </Alert>
      </Paper>
    );
  }

  if (!estadisticas) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TrendingUp color="success" sx={{ mr: 1 }} />
          <Typography variant="h6">
            Análisis Reproductivo
          </Typography>
        </Box>
        <Alert severity="info">
          No hay datos estadísticos disponibles
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TrendingUp color="success" sx={{ mr: 1 }} />
        <Typography variant="h6">
          Análisis Reproductivo
        </Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h4" color="primary" gutterBottom>
                {Math.round(estadisticas.tasaExito)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tasa de Éxito
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h4" color="secondary" gutterBottom>
                {estadisticas.prenecesActivas}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Preñeces Activas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h4" color="success.main" gutterBottom>
                {estadisticas.proximosPartos}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Próximos Partos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" color="info.main" gutterBottom>
                {estadisticas.totalPreneces}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total de Preñeces
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" color="warning.main" gutterBottom>
                {Math.round(estadisticas.promedioGestacion)} días
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Promedio de Gestación
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default EstadisticasReproduccionWidget;