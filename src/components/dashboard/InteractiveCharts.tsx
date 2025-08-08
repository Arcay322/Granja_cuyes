import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import api from '../../services/api';
import { isSuccessfulApiResponse, extractErrorMessage } from '../../utils/typeGuards';
import { ChartsDataResponse } from '../../types/api';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardFilters {
  dateFrom?: Date | null;
  dateTo?: Date | null;
  galpon?: string;
  raza?: string;
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
  }>;
}

interface ChartsData {
  birthsChart: ChartData;
  successRateChart: ChartData;
  breedDistributionChart: ChartData;
  capacityChart: ChartData;
  performanceByAgeChart: ChartData;
}

interface InteractiveChartsProps {
  filters: DashboardFilters;
}

const InteractiveCharts: React.FC<InteractiveChartsProps> = ({ filters }) => {
  const theme = useTheme();
  const [chartsData, setChartsData] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [activeTab, setActiveTab] = useState(0);

  // Cargar datos de gráficos
  const loadChartsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('period', period);
      
      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo.toISOString());
      }
      if (filters.galpon) {
        params.append('galpon', filters.galpon);
      }
      if (filters.raza) {
        params.append('raza', filters.raza);
      }

      const response = await api.get(`/dashboard/charts?${params.toString()}`);
      
      if (isSuccessfulApiResponse(response.data)) {
        setChartsData((response.data as any).data);
      } else {
        setError('Error cargando datos de gráficos');
      }
    } catch (error: unknown) {
      console.error('Error cargando gráficos:', error);
      setError(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [filters, period]);

  useEffect(() => {
    loadChartsData();
  }, [loadChartsData]);

  // Opciones comunes para gráficos
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: theme.palette.divider,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
      },
      y: {
        grid: {
          color: theme.palette.divider,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
      },
    },
  };

  // Opciones específicas para gráfico de líneas
  const lineOptions = {
    ...commonOptions,
    elements: {
      point: {
        radius: 6,
        hoverRadius: 8,
      },
      line: {
        tension: 0.4,
      },
    },
  };

  // Opciones para gráfico de dona
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
      },
    },
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Cargando gráficos...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!chartsData) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        No hay datos disponibles para mostrar gráficos
      </Alert>
    );
  }

  const tabPanels = [
    {
      label: 'Nacimientos',
      content: (
        <Box sx={{ height: 400 }}>
          <Bar data={chartsData.birthsChart} options={commonOptions} />
        </Box>
      )
    },
    {
      label: 'Tasa de Éxito',
      content: (
        <Box sx={{ height: 400 }}>
          <Line data={chartsData.successRateChart} options={lineOptions} />
        </Box>
      )
    },
    {
      label: 'Distribución por Raza',
      content: (
        <Box sx={{ height: 400 }}>
          <Doughnut data={chartsData.breedDistributionChart} options={doughnutOptions} />
        </Box>
      )
    },
    {
      label: 'Capacidad',
      content: (
        <Box sx={{ height: 400 }}>
          <Bar data={chartsData.capacityChart} options={commonOptions} />
        </Box>
      )
    },
    {
      label: 'Rendimiento por Edad',
      content: (
        <Box sx={{ height: 400 }}>
          <Bar data={chartsData.performanceByAgeChart} options={commonOptions} />
        </Box>
      )
    }
  ];

  return (
    <Grid container spacing={3}>
      {/* Gráfico principal */}
      <Grid size={{ xs: 12 }}>
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Análisis Reproductivo
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Período</InputLabel>
              <Select
                value={period}
                label="Período"
                onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'quarter' | 'year')}
              >
                <MenuItem value="week">Semanal</MenuItem>
                <MenuItem value="month">Mensual</MenuItem>
                <MenuItem value="quarter">Trimestral</MenuItem>
                <MenuItem value="year">Anual</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          >
            {tabPanels.map((panel, index) => (
              <Tab key={index} label={panel.label} />
            ))}
          </Tabs>

          {tabPanels[activeTab]?.content}
        </Paper>
      </Grid>

      {/* Gráficos secundarios */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Nacimientos por Período
          </Typography>
          <Box sx={{ height: 300 }}>
            <Bar data={chartsData.birthsChart} options={commonOptions} />
          </Box>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Utilización de Capacidad
          </Typography>
          <Box sx={{ height: 300 }}>
            <Bar data={chartsData.capacityChart} options={commonOptions} />
          </Box>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Distribución por Raza
          </Typography>
          <Box sx={{ height: 300 }}>
            <Doughnut data={chartsData.breedDistributionChart} options={doughnutOptions} />
          </Box>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Rendimiento por Edad
          </Typography>
          <Box sx={{ height: 300 }}>
            <Bar data={chartsData.performanceByAgeChart} options={commonOptions} />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default InteractiveCharts;