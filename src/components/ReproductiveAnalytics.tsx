import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Grid, Box, Chip, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Avatar, Divider, Alert, CircularProgress, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton
} from '../utils/mui';
import {
  TrendingUp, Female, Male, Analytics, Star, Warning, Info,
  Close, Refresh, Timeline, Assessment
} from '@mui/icons-material';
import api from '../services/api';
import toastService from '../services/toastService';

interface ReproductiveAnalyticsProps {
  open: boolean;
  onClose: () => void;
}

interface PerformanceMetrics {
  reproductoras: {
    id: number;
    galpon: string;
    jaula: string;
    raza: string;
    metricas: {
      totalPreneces: number;
      prenecesExitosas: number;
      tasaExito: number;
      promedioLitada: number;
      intervalosReproductivos: number[];
      productividadVitalicia: number;
    };
  }[];
  reproductores: {
    id: number;
    galpon: string;
    jaula: string;
    raza: string;
    metricas: {
      totalCruces: number;
      tasaExito: number;
      promedioDescendencia: number;
      frecuenciaCruce: number;
      contribucionGenetica: number;
    };
  }[];
  tendencias: {
    mensual: {
      mes: string;
      preneces: number;
      camadas: number;
      tasaExito: number;
    }[];
    anual: {
      año: number;
      preneces: number;
      camadas: number;
      tasaExito: number;
    }[];
  };
  resumen: {
    totalReproductoras: number;
    totalReproductores: number;
    tasaExitoGeneral: number;
    promedioLitadaGeneral: number;
    mejorReproductora: any;
    mejorReproductor: any;
  };
}

const ReproductiveAnalytics: React.FC<ReproductiveAnalyticsProps> = ({
  open,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<PerformanceMetrics | null>(null);
  const [selectedTab, setSelectedTab] = useState<'reproductoras' | 'reproductores' | 'tendencias'>('reproductoras');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Obtener estadísticas avanzadas
      const statsResponse = await api.get('/reproduccion/prenez/estadisticas-avanzadas');
      
      // Obtener madres y padres disponibles para métricas
      const madresResponse = await api.get('/reproduccion/prenez/madres-disponibles');
      const padresResponse = await api.get('/reproduccion/prenez/padres-disponibles');
      
      if (statsResponse.data.success && madresResponse.data.success && padresResponse.data.success) {
        const statsData = statsResponse.data.data;
        const madresData = madresResponse.data.data;
        const padresData = padresResponse.data.data;
        
        // Procesar datos para el componente
        const processedAnalytics: PerformanceMetrics = {
          reproductoras: madresData.map((madre: any) => ({
            id: madre.id,
            galpon: madre.galpon,
            jaula: madre.jaula,
            raza: madre.raza,
            metricas: {
              totalPreneces: madre.historialReproductivo.totalPreneces,
              prenecesExitosas: madre.historialReproductivo.prenecesExitosas,
              tasaExito: madre.historialReproductivo.tasaExito,
              promedioLitada: madre.historialReproductivo.promedioLitada,
              intervalosReproductivos: [],
              productividadVitalicia: madre.historialReproductivo.totalPreneces * madre.historialReproductivo.promedioLitada
            }
          })),
          reproductores: padresData.map((padre: any) => ({
            id: padre.id,
            galpon: padre.galpon,
            jaula: padre.jaula,
            raza: padre.raza,
            metricas: {
              totalCruces: padre.rendimientoReproductivo.totalCruces,
              tasaExito: padre.rendimientoReproductivo.tasaExito,
              promedioDescendencia: padre.rendimientoReproductivo.promedioDescendencia,
              frecuenciaCruce: padre.rendimientoReproductivo.frecuenciaCruce,
              contribucionGenetica: padre.genetica.diversidadGenetica
            }
          })),
          tendencias: {
            mensual: [],
            anual: []
          },
          resumen: {
            totalReproductoras: madresData.length,
            totalReproductores: padresData.length,
            tasaExitoGeneral: madresData.reduce((sum: number, m: any) => sum + m.historialReproductivo.tasaExito, 0) / madresData.length || 0,
            promedioLitadaGeneral: madresData.reduce((sum: number, m: any) => sum + m.historialReproductivo.promedioLitada, 0) / madresData.length || 0,
            mejorReproductora: madresData.reduce((best: any, current: any) => 
              current.historialReproductivo.tasaExito > (best?.historialReproductivo?.tasaExito || 0) ? current : best, null),
            mejorReproductor: padresData.reduce((best: any, current: any) => 
              current.rendimientoReproductivo.tasaExito > (best?.rendimientoReproductivo?.tasaExito || 0) ? current : best, null)
          }
        };
        
        setAnalytics(processedAnalytics);
      }
    } catch (error: any) {
      console.error('Error al obtener analíticas reproductivas:', error);
      toastService.error('Error', 'No se pudieron cargar las analíticas reproductivas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAnalytics();
    }
  }, [open]);

  const renderReproductorasTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Rendimiento de Reproductoras
      </Typography>
      
      {analytics?.resumen.mejorReproductora && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">
            🏆 Mejor Reproductora: ID {analytics.resumen.mejorReproductora.id} 
            ({analytics.resumen.mejorReproductora.galpon}-{analytics.resumen.mejorReproductora.jaula})
            - {analytics.resumen.mejorReproductora.historialReproductivo.tasaExito}% éxito
          </Typography>
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Ubicación</TableCell>
              <TableCell>Raza</TableCell>
              <TableCell align="center">Preñeces</TableCell>
              <TableCell align="center">Tasa Éxito</TableCell>
              <TableCell align="center">Prom. Litada</TableCell>
              <TableCell align="center">Productividad</TableCell>
              <TableCell align="center">Rendimiento</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {analytics?.reproductoras
              .sort((a, b) => b.metricas.tasaExito - a.metricas.tasaExito)
              .map((reproductora) => (
                <TableRow key={reproductora.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: '#e91e63', width: 32, height: 32 }}>
                        <Female fontSize="small" />
                      </Avatar>
                      {reproductora.id}
                    </Box>
                  </TableCell>
                  <TableCell>{reproductora.galpon}-{reproductora.jaula}</TableCell>
                  <TableCell>{reproductora.raza}</TableCell>
                  <TableCell align="center">
                    {reproductora.metricas.prenecesExitosas}/{reproductora.metricas.totalPreneces}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={reproductora.metricas.tasaExito} 
                        sx={{ width: 60, height: 8, borderRadius: 4 }}
                        color={reproductora.metricas.tasaExito >= 80 ? 'success' : 
                               reproductora.metricas.tasaExito >= 60 ? 'warning' : 'error'}
                      />
                      <Typography variant="body2">
                        {reproductora.metricas.tasaExito.toFixed(1)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {reproductora.metricas.promedioLitada.toFixed(1)}
                  </TableCell>
                  <TableCell align="center">
                    {reproductora.metricas.productividadVitalicia.toFixed(1)}
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={
                        reproductora.metricas.tasaExito >= 80 ? 'Excelente' :
                        reproductora.metricas.tasaExito >= 60 ? 'Buena' :
                        reproductora.metricas.tasaExito >= 40 ? 'Regular' : 'Baja'
                      }
                      color={
                        reproductora.metricas.tasaExito >= 80 ? 'success' :
                        reproductora.metricas.tasaExito >= 60 ? 'warning' :
                        reproductora.metricas.tasaExito >= 40 ? 'info' : 'error'
                      }
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderReproductoresTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Rendimiento de Reproductores
      </Typography>
      
      {analytics?.resumen.mejorReproductor && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">
            🏆 Mejor Reproductor: ID {analytics.resumen.mejorReproductor.id} 
            ({analytics.resumen.mejorReproductor.galpon}-{analytics.resumen.mejorReproductor.jaula})
            - {analytics.resumen.mejorReproductor.rendimientoReproductivo.tasaExito}% éxito
          </Typography>
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Ubicación</TableCell>
              <TableCell>Raza</TableCell>
              <TableCell align="center">Cruces</TableCell>
              <TableCell align="center">Tasa Éxito</TableCell>
              <TableCell align="center">Prom. Descendencia</TableCell>
              <TableCell align="center">Diversidad Genética</TableCell>
              <TableCell align="center">Rendimiento</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {analytics?.reproductores
              .sort((a, b) => b.metricas.tasaExito - a.metricas.tasaExito)
              .map((reproductor) => (
                <TableRow key={reproductor.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: '#2196f3', width: 32, height: 32 }}>
                        <Male fontSize="small" />
                      </Avatar>
                      {reproductor.id}
                    </Box>
                  </TableCell>
                  <TableCell>{reproductor.galpon}-{reproductor.jaula}</TableCell>
                  <TableCell>{reproductor.raza}</TableCell>
                  <TableCell align="center">{reproductor.metricas.totalCruces}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={reproductor.metricas.tasaExito} 
                        sx={{ width: 60, height: 8, borderRadius: 4 }}
                        color={reproductor.metricas.tasaExito >= 80 ? 'success' : 
                               reproductor.metricas.tasaExito >= 60 ? 'warning' : 'error'}
                      />
                      <Typography variant="body2">
                        {reproductor.metricas.tasaExito.toFixed(1)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {reproductor.metricas.promedioDescendencia.toFixed(1)}
                  </TableCell>
                  <TableCell align="center">
                    {reproductor.metricas.contribucionGenetica}%
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={
                        reproductor.metricas.tasaExito >= 80 ? 'Excelente' :
                        reproductor.metricas.tasaExito >= 60 ? 'Buena' :
                        reproductor.metricas.tasaExito >= 40 ? 'Regular' : 'Baja'
                      }
                      color={
                        reproductor.metricas.tasaExito >= 80 ? 'success' :
                        reproductor.metricas.tasaExito >= 60 ? 'warning' :
                        reproductor.metricas.tasaExito >= 40 ? 'info' : 'error'
                      }
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderResumenTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Resumen General
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                <Female sx={{ mr: 1, verticalAlign: 'middle' }} />
                Reproductoras
              </Typography>
              <Typography variant="h4" color="text.primary">
                {analytics?.resumen.totalReproductoras || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tasa éxito promedio: {analytics?.resumen.tasaExitoGeneral.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Promedio litada: {analytics?.resumen.promedioLitadaGeneral.toFixed(1)} crías
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                <Male sx={{ mr: 1, verticalAlign: 'middle' }} />
                Reproductores
              </Typography>
              <Typography variant="h4" color="text.primary">
                {analytics?.resumen.totalReproductores || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Activos en reproducción
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            <Analytics sx={{ mr: 1, verticalAlign: 'middle' }} />
            Analíticas de Rendimiento Reproductivo
          </Typography>
          <Box>
            <IconButton onClick={fetchAnalytics} disabled={loading}>
              <Refresh />
            </IconButton>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : analytics ? (
          <Box>
            {/* Tabs de navegación */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Button
                variant={selectedTab === 'reproductoras' ? 'contained' : 'text'}
                onClick={() => setSelectedTab('reproductoras')}
                sx={{ mr: 1 }}
              >
                Reproductoras
              </Button>
              <Button
                variant={selectedTab === 'reproductores' ? 'contained' : 'text'}
                onClick={() => setSelectedTab('reproductores')}
                sx={{ mr: 1 }}
              >
                Reproductores
              </Button>
              <Button
                variant={selectedTab === 'tendencias' ? 'contained' : 'text'}
                onClick={() => setSelectedTab('tendencias')}
              >
                Resumen
              </Button>
            </Box>

            {/* Contenido de tabs */}
            {selectedTab === 'reproductoras' && renderReproductorasTab()}
            {selectedTab === 'reproductores' && renderReproductoresTab()}
            {selectedTab === 'tendencias' && renderResumenTab()}
          </Box>
        ) : (
          <Alert severity="info">
            No hay datos de analíticas disponibles
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReproductiveAnalytics;