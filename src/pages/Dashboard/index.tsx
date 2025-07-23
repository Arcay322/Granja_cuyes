import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress, Card, CardContent, Divider } from "../../utils/mui";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
         PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import api from '../../services/api';
import PartosProximosWidget from '../../components/PartosProximosWidget';

// Colores para los gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Dashboard principal que muestra varios KPIs y gráficos
const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalCuyes: 0,
    totalVentas: 0,
    totalGastos: 0,
    inventarioValor: 0,
    rentabilidad: 0
  });
  const [populationData, setPopulationData] = useState<any[]>([]);
  const [ventasData, setVentasData] = useState<any[]>([]);
  const [gastosData, setGastosData] = useState<any[]>([]);
  const [productivityData, setProductivityData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Carga de datos principales para el dashboard
        const [metricsRes, populationRes, ventasRes, gastosRes, productivityRes] = await Promise.all([
          api.get('/dashboard/metrics'),
          api.get('/dashboard/population'),
          api.get('/dashboard/ventas'),
          api.get('/dashboard/gastos'),
          api.get('/dashboard/productividad')
        ]);
        
        setMetrics((metricsRes.data as any) || {});
        setPopulationData((populationRes.data as any[]) || []);
        setVentasData((ventasRes.data as any[]) || []);
        setGastosData((gastosRes.data as any[]) || []);
        setProductivityData((productivityRes.data as any[]) || []);
      } catch (err) {
        console.error('Error cargando datos del dashboard:', err);
        setError('No se pudieron cargar los datos del dashboard. Por favor intenta más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Tarjeta de métrica individual
  const MetricCard = ({ title, value, unit = '', icon, color = '#0088FE' }: {
    title: string;
    value: number | string;
    unit?: string;
    icon: React.ReactNode;
    color?: string;
  }) => (
    <Card sx={{ height: '100%', boxShadow: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {value} {unit}
            </Typography>
          </Box>
          <Box 
            sx={{ 
              backgroundColor: `${color}20`, 
              borderRadius: '50%', 
              width: 48, 
              height: 48, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography color="error" variant="h6">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard de la Granja
      </Typography>
      
      {/* Métricas principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <MetricCard 
            title="Total Cuyes" 
            value={metrics.totalCuyes} 
            icon={<span style={{fontSize: '24px'}}>🐹</span>}
            color="#0088FE"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <MetricCard 
            title="Ventas Mensuales" 
            value={metrics.totalVentas.toFixed(2)} 
            unit="PEN" 
            icon={<span style={{fontSize: '24px'}}>💰</span>}
            color="#00C49F"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <MetricCard 
            title="Gastos Mensuales" 
            value={metrics.totalGastos.toFixed(2)} 
            unit="PEN" 
            icon={<span style={{fontSize: '24px'}}>📉</span>}
            color="#FFBB28"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <MetricCard 
            title="Valor Inventario" 
            value={metrics.inventarioValor.toFixed(2)} 
            unit="PEN" 
            icon={<span style={{fontSize: '24px'}}>📦</span>}
            color="#FF8042"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <MetricCard 
            title="Rentabilidad" 
            value={metrics.rentabilidad.toFixed(2)} 
            unit="%" 
            icon={<span style={{fontSize: '24px'}}>📈</span>}
            color="#8884d8"
          />
        </Grid>
      </Grid>

      {/* Gráficos principales */}
      <Grid container spacing={3}>
        {/* Crecimiento de Población */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 340 }}>
            <Typography variant="h6" gutterBottom component="div">
              Crecimiento de Población
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={populationData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="nacimientos" stroke="#8884d8" />
                <Line type="monotone" dataKey="fallecimientos" stroke="#FF8042" />
                <Line type="monotone" dataKey="total" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Próximos partos */}
        <Grid item xs={12} md={6}>
          <PartosProximosWidget />
        </Grid>

        {/* Ventas por Mes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 340 }}>
            <Typography variant="h6" gutterBottom component="div">
              Ventas por Mes
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ventasData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="monto" fill="#0088FE" />
                <Bar dataKey="unidades" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gastos por Categoría */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 340 }}>
            <Typography variant="h6" gutterBottom component="div">
              Gastos por Categoría
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gastosData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="valor"
                >
                  {gastosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Productividad por Galpon */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 340 }}>
            <Typography variant="h6" gutterBottom component="div">
              Productividad por Galpón
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={productivityData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="galpon" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="nacimientos" fill="#8884d8" />
                <Bar dataKey="camadas" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
