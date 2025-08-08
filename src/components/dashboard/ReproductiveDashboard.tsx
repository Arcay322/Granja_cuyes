import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Divider
} from '../../utils/mui';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  PregnantWoman,
  ChildCare,
  Analytics,
  Warning
} from '@mui/icons-material';
import api from '../../services/api';
import { isSuccessfulApiResponse, extractErrorMessage } from '../../utils/typeGuards';
import { DashboardMetricsResponse } from '../../types/api';

interface DashboardMetrics {
  reproductiveStats: {
    activePregnancies: number;
    expectedBirths: number;
    successRate: number;
    averageLitterSize: number;
    totalBirthsThisMonth: number;
    totalBirthsLastMonth: number;
  };
  performanceMetrics: {
    topPerformingMothers: Array<{
      id: number;
      raza: string;
      galpon: string;
      jaula: string;
      totalLitters: number;
      averageLitterSize: number;
      successRate: number;
    }>;
    topPerformingFathers: Array<{
      id: number;
      raza: string;
      galpon: string;
      jaula: string;
      totalOffspring: number;
      activeBreedings: number;
    }>;
    breedingEfficiency: number;
  };
}

const ReproductiveDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Cargar métricas del dashboard
  const loadDashboardMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/dashboard/metrics');
      
      if (isSuccessfulApiResponse<DashboardMetrics>(response.data)) {
        setMetrics(response.data.data);
        setLastUpdated(new Date());
      } else {
        setError('Error cargando métricas del dashboard');
      }
    } catch (error: unknown) {
      console.error('Error cargando métricas:', error);
      setError(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  // Efectos
  useEffect(() => {
    loadDashboardMetrics();
  }, [loadDashboardMetrics]);

  const handleRefresh = () => {
    loadDashboardMetrics();
  };

  // Calcular tendencia de nacimientos
  const getBirthsTrend = () => {
    if (!metrics) return null;
    
    const thisMonth = metrics.reproductiveStats.totalBirthsThisMonth;
    const lastMonth = metrics.reproductiveStats.totalBirthsLastMonth;
    const change = thisMonth - lastMonth;
    const percentage = lastMonth > 0 ? (change / lastMonth) * 100 : 0;
    
    return {
      change,
      percentage: Math.abs(percentage),
      isPositive: change >= 0
    };
  };

  const birthsTrend = getBirthsTrend();

  if (loading && !metrics) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Dashboard Reproductivo
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Última actualización: {lastUpdated.toLocaleTimeString()}
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
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

      {/* Métricas principales */}
      {metrics && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <PregnantWoman color="primary" />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {metrics.reproductiveStats.activePregnancies}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Preñeces Activas
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <ChildCare color="success" />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {metrics.reproductiveStats.expectedBirths}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Partos Esperados
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Analytics color="info" />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {metrics.reproductiveStats.successRate.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tasa de Éxito
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <CheckCircleIcon color="secondary" />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {metrics.reproductiveStats.averageLitterSize.toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Promedio por Camada
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tendencia de nacimientos */}
          {birthsTrend && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h6">
                    Tendencia de Nacimientos
                  </Typography>
                  <Chip
                    icon={birthsTrend.isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    label={`${birthsTrend.isPositive ? '+' : ''}${birthsTrend.change} (${birthsTrend.percentage.toFixed(1)}%)`}
                    color={birthsTrend.isPositive ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Este mes: {metrics.reproductiveStats.totalBirthsThisMonth} nacimientos | 
                  Mes anterior: {metrics.reproductiveStats.totalBirthsLastMonth} nacimientos
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Top performers */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Top Madres Reproductoras
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {metrics.performanceMetrics.topPerformingMothers.length > 0 ? (
                  metrics.performanceMetrics.topPerformingMothers.map((mother, index) => (
                    <Box key={mother.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2">
                          #{index + 1} - {mother.raza} ({mother.galpon}-{mother.jaula})
                        </Typography>
                        <Chip
                          icon={<CheckCircleIcon />}
                          label={`${mother.successRate}% éxito`}
                          color="success"
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {mother.totalLitters} camadas | Promedio: {mother.averageLitterSize} crías
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No hay datos disponibles
                  </Typography>
                )}
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Top Padres Reproductores
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {metrics.performanceMetrics.topPerformingFathers.length > 0 ? (
                  metrics.performanceMetrics.topPerformingFathers.map((father, index) => (
                    <Box key={father.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2">
                          #{index + 1} - {father.raza} ({father.galpon}-{father.jaula})
                        </Typography>
                        <Chip
                          label={`${father.activeBreedings} activos`}
                          color="primary"
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {father.totalOffspring} descendientes totales
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No hay datos disponibles
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default ReproductiveDashboard;