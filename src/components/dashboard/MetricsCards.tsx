import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  PregnantWoman as PregnancyIcon,
  ChildCare as BirthIcon,
  TrendingUp as SuccessIcon,
  Groups as LitterIcon,
  Speed as EfficiencyIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';

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
    breedingEfficiency: number;
  };
}

interface MetricsCardsProps {
  metrics: DashboardMetrics;
  loading: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  loading?: boolean;
  progress?: number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  loading = false,
  progress,
  trend
}) => {
  const getColorValue = (color: string) => {
    const colors = {
      primary: '#1976d2',
      secondary: '#dc004e',
      success: '#2e7d32',
      warning: '#ed6c02',
      error: '#d32f2f',
      info: '#0288d1'
    };
    return colors[color as keyof typeof colors] || colors.primary;
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: `${getColorValue(color)}15`,
              color: getColorValue(color)
            }}
          >
            {icon}
          </Box>
          {trend && (
            <Chip
              label={`${trend.isPositive ? '+' : ''}${trend.value}%`}
              color={trend.isPositive ? 'success' : 'error'}
              size="small"
            />
          )}
        </Box>

        <Typography variant="h6" color="text.secondary" gutterBottom>
          {title}
        </Typography>

        {loading ? (
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={24} />
            <Typography variant="h4">--</Typography>
          </Box>
        ) : (
          <Typography variant="h4" fontWeight="bold" color={getColorValue(color)}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Typography>
        )}

        {subtitle && (
          <Typography variant="body2" color="text.secondary" mt={1}>
            {subtitle}
          </Typography>
        )}

        {progress !== undefined && (
          <Box mt={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Progreso
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: `${getColorValue(color)}20`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getColorValue(color)
                }
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics, loading }) => {
  // Calcular tendencia de nacimientos
  const getBirthsTrend = () => {
    const thisMonth = metrics.reproductiveStats.totalBirthsThisMonth;
    const lastMonth = metrics.reproductiveStats.totalBirthsLastMonth;
    if (lastMonth === 0) return null;
    
    const change = ((thisMonth - lastMonth) / lastMonth) * 100;
    return {
      value: Math.round(change),
      isPositive: change >= 0
    };
  };

  const birthsTrend = getBirthsTrend();

  // Determinar color de la tasa de éxito
  const getSuccessRateColor = (rate: number): 'success' | 'warning' | 'error' => {
    if (rate >= 80) return 'success';
    if (rate >= 60) return 'warning';
    return 'error';
  };

  // Determinar color de la eficiencia reproductiva
  const getEfficiencyColor = (efficiency: number): 'success' | 'warning' | 'error' => {
    if (efficiency >= 70) return 'success';
    if (efficiency >= 50) return 'warning';
    return 'error';
  };

  const metricsData = [
    {
      title: 'Preñeces Activas',
      value: metrics.reproductiveStats.activePregnancies,
      subtitle: 'Hembras gestantes actualmente',
      icon: <PregnancyIcon />,
      color: 'primary' as const,
      loading
    },
    {
      title: 'Partos Esperados',
      value: metrics.reproductiveStats.expectedBirths,
      subtitle: 'Próximos 30 días',
      icon: <CalendarIcon />,
      color: 'info' as const,
      loading
    },
    {
      title: 'Nacimientos del Mes',
      value: metrics.reproductiveStats.totalBirthsThisMonth,
      subtitle: 'Camadas registradas este mes',
      icon: <BirthIcon />,
      color: 'secondary' as const,
      loading,
      trend: birthsTrend || undefined
    },
    {
      title: 'Tasa de Éxito',
      value: `${metrics.reproductiveStats.successRate.toFixed(1)}%`,
      subtitle: 'Supervivencia de crías',
      icon: <SuccessIcon />,
      color: getSuccessRateColor(metrics.reproductiveStats.successRate),
      loading,
      progress: metrics.reproductiveStats.successRate
    },
    {
      title: 'Tamaño Promedio',
      value: metrics.reproductiveStats.averageLitterSize.toFixed(1),
      subtitle: 'Crías por camada',
      icon: <LitterIcon />,
      color: 'success' as const,
      loading
    },
    {
      title: 'Eficiencia Reproductiva',
      value: `${metrics.performanceMetrics.breedingEfficiency.toFixed(1)}%`,
      subtitle: 'Reproductoras activas',
      icon: <EfficiencyIcon />,
      color: getEfficiencyColor(metrics.performanceMetrics.breedingEfficiency),
      loading,
      progress: metrics.performanceMetrics.breedingEfficiency
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {metricsData.map((metric, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={index}>
          <MetricCard {...metric} />
        </Grid>
      ))}
    </Grid>
  );
};

export default MetricsCards;