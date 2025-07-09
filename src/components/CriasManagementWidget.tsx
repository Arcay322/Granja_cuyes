import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, Card, CardContent, 
  Chip, Button, Alert, CircularProgress 
} from '../utils/mui';
import { Baby, Pets, TrendingUp, AccessTime } from '@mui/icons-material';
import api from '../services/api';

interface CriaStats {
  totalCrias: number;
  criasPorMes: { [key: string]: number };
  tasaSupervivencia: number;
  proximasTransiciones: number;
}

const CriasManagementWidget: React.FC = () => {
  const [stats, setStats] = useState<CriaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCriasStats();
  }, []);

  const fetchCriasStats = async () => {
    try {
      setLoading(true);
      
      // Obtener todos los cuyes
      const cuyesResponse = await api.get('/cuyes');
      const cuyes = cuyesResponse.data;
      
      // Obtener todas las camadas
      const camadasResponse = await api.get('/reproduccion/camadas');
      const camadas = camadasResponse.data;
      
      // Calcular estadísticas
      const crias = cuyes.filter((cuy: any) => cuy.estado === 'Cría');
      const totalCrias = crias.length;
      
      // Agrupar crías por mes de nacimiento
      const criasPorMes: { [key: string]: number } = {};
      crias.forEach((cria: any) => {
        const mes = new Date(cria.fechaNacimiento).toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long' 
        });
        criasPorMes[mes] = (criasPorMes[mes] || 0) + 1;
      });
      
      // Calcular tasa de supervivencia
      const totalVivos = camadas.reduce((sum: number, camada: any) => sum + camada.numVivos, 0);
      const totalMuertos = camadas.reduce((sum: number, camada: any) => sum + camada.numMuertos, 0);
      const tasaSupervivencia = totalVivos + totalMuertos > 0 
        ? (totalVivos / (totalVivos + totalMuertos)) * 100 
        : 0;
      
      // Calcular crías próximas a transición (más de 2.5 meses)
      const fechaActual = new Date();
      const proximasTransiciones = crias.filter((cria: any) => {
        const fechaNacimiento = new Date(cria.fechaNacimiento);
        const edadEnMeses = (fechaActual.getTime() - fechaNacimiento.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return edadEnMeses >= 2.5;
      }).length;
      
      setStats({
        totalCrias,
        criasPorMes,
        tasaSupervivencia,
        proximasTransiciones
      });
      
    } catch (err) {
      console.error('Error al obtener estadísticas de crías:', err);
      setError('Error al cargar estadísticas de crías');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!stats) return null;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Baby color="primary" />
        Gestión de Crías
      </Typography>
      
      <Grid container spacing={3}>
        {/* Estadísticas principales */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {stats.totalCrias}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Crías
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {stats.tasaSupervivencia.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Supervivencia
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {stats.proximasTransiciones}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Próximas Transiciones
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Button 
                    variant="contained" 
                    startIcon={<TrendingUp />}
                    onClick={fetchCriasStats}
                    size="small"
                  >
                    Actualizar
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        
        {/* Distribución por mes */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Crías por Mes
              </Typography>
              {Object.entries(stats.criasPorMes).map(([mes, cantidad]) => (
                <Box key={mes} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{mes}</Typography>
                  <Chip 
                    label={cantidad} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
              ))}
              {Object.keys(stats.criasPorMes).length === 0 && (
                <Typography variant="body2" color="textSecondary">
                  No hay crías registradas
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Alertas y recomendaciones */}
      {stats.proximasTransiciones > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime />
            <Typography>
              {stats.proximasTransiciones} crías están próximas a transición a adulto. 
              Considera actualizar su estado y determinar el sexo.
            </Typography>
          </Box>
        </Alert>
      )}
      
      {stats.totalCrias === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography>
            No hay crías registradas en el sistema. Las crías se crean automáticamente 
            al registrar una camada.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default CriasManagementWidget;
