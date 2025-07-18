import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Breadcrumbs, Link, Container, Paper, Card, CardContent, 
  Avatar, Alert, useTheme, alpha, Grid
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
        
        setCuyes(cuyesRes.data);
        setVentas(ventasRes.data);
        setGastos(gastosRes.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Error al cargar datos del dashboard');
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
        <Grid container spacing={3}>
          {statCards.map((card, index) => (
            <Grid key={index} sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
              <Card 
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
            </Grid>
          ))}
          
          {/* Gráficos */}
          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 8' } }}>
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
          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
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
          </Grid>
          
          <Grid sx={{ gridColumn: 'span 12' }}>
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
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DashboardPage;
