import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Breadcrumbs, Link, Container, Paper, Card, CardContent, 
  Avatar, Alert, useTheme, alpha
} from '../utils/mui';
import { DataStateRenderer, ConditionalRender } from '../utils/conditional-render';
import { Link as RouterLink } from 'react-router-dom';
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
  Legend
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import MoneyIcon from '@mui/icons-material/Money';
import InventoryIcon from '@mui/icons-material/Inventory';
import PetsIcon from '@mui/icons-material/Pets';
import ReceiptIcon from '@mui/icons-material/Receipt';
import api from '../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [cuyes, setCuyes] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cuyesRes, ventasRes, gastosRes] = await Promise.all([
          api.get('/cuyes'),
          api.get('/ventas'),
          api.get('/gastos')
        ]);
        
        // Manejar el formato de respuesta mejorado {success, data, message}
        setCuyes(cuyesRes.data?.data || cuyesRes.data || []);
        setVentas(ventasRes.data?.data || ventasRes.data || []);
        setGastos(gastosRes.data?.data || gastosRes.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('Error al cargar datos del dashboard');
        // Asegurar que los arrays se mantengan como arrays vacíos en caso de error
        setCuyes([]);
        setVentas([]);
        setGastos([]);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Calcular KPIs
  const totalCuyes = cuyes.length;
  const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
  const balance = totalVentas - totalGastos;
  
  const statCards = [
    { 
      title: 'Total Cuyes', 
      value: totalCuyes, 
      icon: <PetsIcon />, 
      color: theme.palette.primary.main 
    },
    { 
      title: 'Ventas Totales', 
      value: `S/. ${totalVentas.toFixed(2)}`, 
      icon: <MoneyIcon />, 
      color: theme.palette.success.main 
    },
    { 
      title: 'Gastos Totales', 
      value: `S/. ${totalGastos.toFixed(2)}`, 
      icon: <ReceiptIcon />, 
      color: theme.palette.error.main 
    },
    { 
      title: 'Balance', 
      value: `S/. ${balance.toFixed(2)}`, 
      icon: <InventoryIcon />, 
      color: balance >= 0 ? theme.palette.success.main : theme.palette.error.main 
    }
  ];
  
  // Preparar datos para los gráficos
  const ventasPorMesLabels = ventas.map(v => {
    const fecha = new Date(v.fecha);
    return fecha.toLocaleString('es-ES', { month: 'short' });
  });
  const ventasPorMesData = ventas.map(v => v.total);
  
  const gastosPorCategoriaLabels = gastos.map(g => g.categoria);
  const gastosPorCategoriaData = gastos.map(g => g.monto);
  
  const cuyesPorSexoData = [
    cuyes.filter(c => c.sexo === 'M').length,
    cuyes.filter(c => c.sexo === 'H').length
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Dashboard
        </Typography>
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} to="/" color="inherit">
            Inicio
          </Link>
          <Typography color="text.primary">Dashboard</Typography>
        </Breadcrumbs>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Container maxWidth={false}>
        {/* Tarjetas de estadísticas */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 3 }}>
          {statCards.map((card, index) => (
            <Card key={index} 
                sx={{ 
                  borderRadius: 3,
                  boxShadow: 3,
                  height: '100%',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 5
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" color="text.secondary" fontSize="0.9rem">
                      {card.title}
                    </Typography>
                    <Avatar
                      sx={{
                        bgcolor: alpha(card.color, 0.1),
                        color: card.color,
                      }}
                    >
                      {card.icon}
                    </Avatar>
                  </Box>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {card.value}
                  </Typography>
                </CardContent>
              </Card>
          ))}
        </Box>
          
        {/* Gráficos */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3, mb: 3 }}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              boxShadow: 3,
              height: '100%',
              minHeight: 400
            }}
          >
            <Typography variant="h6" sx={{ mb: 3 }}>Ventas Mensuales</Typography>
            <Box sx={{ height: 350 }}>
              {ventas.length > 0 && (
                <Line
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      tooltip: {
                        mode: 'index',
                        intersect: false,
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return 'S/. ' + value;
                          }
                        }
                      }
                    }
                  }}
                  data={{
                    labels: ventasPorMesLabels,
                    datasets: [
                      {
                        label: 'Ventas',
                        data: ventasPorMesData,
                        borderColor: theme.palette.primary.main,
                        backgroundColor: alpha(theme.palette.primary.main, 0.5),
                        tension: 0.3,
                      }
                    ]
                  }}
                />
              )}
              {ventas.length === 0 && !loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography>No hay datos de ventas disponibles</Typography>
                </Box>
              )}
            </Box>
          </Paper>
          
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              boxShadow: 3,
              height: '100%',
              minHeight: 400,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="h6" sx={{ mb: 3 }}>Distribución de Cuyes</Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {cuyes.length > 0 && (
                <Doughnut
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      }
                    }
                  }}
                  data={{
                    labels: ['Machos', 'Hembras'],
                    datasets: [
                      {
                        data: cuyesPorSexoData,
                        backgroundColor: [
                          theme.palette.info.main,
                          theme.palette.success.main,
                        ],
                        borderColor: [
                          theme.palette.info.dark,
                          theme.palette.success.dark,
                        ],
                        borderWidth: 1,
                      }
                    ]
                  }}
                />
              )}
              {cuyes.length === 0 && !loading && (
                <Typography>No hay datos de cuyes disponibles</Typography>
              )}
            </Box>
          </Paper>
        </Box>
          
        {/* Gráfico de gastos y tabla de cuyes recientes */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mb: 3 }}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              boxShadow: 3,
              minHeight: 350
            }}
          >
            <Typography variant="h6" sx={{ mb: 3 }}>Gastos por Categoría</Typography>
            <Box sx={{ height: 300 }}>
              {gastos.length > 0 && (
                <Bar
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      tooltip: {
                        mode: 'index',
                        intersect: false,
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return 'S/. ' + value;
                          }
                        }
                      }
                    }
                  }}
                  data={{
                    labels: gastosPorCategoriaLabels,
                    datasets: [
                      {
                        label: 'Monto',
                        data: gastosPorCategoriaData,
                        backgroundColor: alpha(theme.palette.warning.main, 0.7),
                        borderColor: theme.palette.warning.main,
                        borderWidth: 1,
                      }
                    ]
                  }}
                />
              )}
              {gastos.length === 0 && !loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography>No hay datos de gastos disponibles</Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Tabla de cuyes recientes */}
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              boxShadow: 3,
              minHeight: 350
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Cuyes Recientes</Typography>
              <Link 
                component={RouterLink} 
                to="/cuyes" 
                sx={{ 
                  textDecoration: 'none',
                  color: theme.palette.primary.main,
                  fontWeight: 'medium',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Ver todos →
              </Link>
            </Box>
            
            {cuyes.length > 0 ? (
              <Box sx={{ maxHeight: 280, overflow: 'auto' }}>
                {cuyes.slice(0, 5).map((cuy, index) => (
                  <Box 
                    key={cuy.id || index}
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      py: 2,
                      borderBottom: index < 4 ? '1px solid #f0f0f0' : 'none'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        sx={{ 
                          width: 32, 
                          height: 32,
                          bgcolor: cuy.sexo === 'M' ? theme.palette.info.main : theme.palette.success.main
                        }}
                      >
                        <PetsIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          Cuy #{cuy.id || `Temp-${index}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {cuy.raza || 'Sin raza'} • {cuy.galpon || 'Sin galpón'}-{cuy.jaula || 'Sin jaula'}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" fontWeight="medium">
                        {cuy.peso || 0} kg
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: cuy.estado === 'Activo' ? theme.palette.success.main : 
                                cuy.estado === 'Enfermo' ? theme.palette.error.main : 
                                theme.palette.text.secondary
                        }}
                      >
                        {cuy.estado || 'Sin estado'}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                height: 200,
                color: 'text.secondary'
              }}>
                <PetsIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="body2">No hay cuyes registrados</Typography>
                <Link 
                  component={RouterLink} 
                  to="/cuyes" 
                  sx={{ 
                    mt: 1,
                    textDecoration: 'none',
                    color: theme.palette.primary.main,
                    fontWeight: 'medium'
                  }}
                >
                  Registrar primer cuy
                </Link>
              </Box>
            )}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default DashboardPage;
