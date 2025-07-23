import { useEffect, useState } from 'react';
import { Box, Typography, Breadcrumbs, Link, Paper, Container, Grid, Card, CardContent, Avatar, useTheme, alpha } from "../utils/mui";
import GastosTable from '../components/GastosTable';
import { MonetizationOn, Inventory, Receipt, ArrowDownward, ArrowUpward } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { mainCardStyles } from '../theme/SimpleLayoutStyles';
import api from '../services/api';
import type { Gasto, ApiResponse } from '../types/api';

const GastosPage = () => {
  const theme = useTheme();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGastos = async () => {
      try {
        const response = await api.get('/gastos');
        const gastosData = (response.data as ApiResponse<Gasto[]>)?.data || (response.data as Gasto[]) || [];
        setGastos(gastosData);
      } catch (error) {
        console.error('Error al cargar gastos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGastos();
  }, []);

  // Calcular datos reales a partir de los gastos obtenidos
  const totalGastos = gastos.reduce((total, gasto) => total + gasto.monto, 0);
  const gastosDelMes = gastos.filter(gasto => {
    const fechaGasto = new Date(gasto.fecha);
    const fechaActual = new Date();
    return fechaGasto.getMonth() === fechaActual.getMonth() && 
           fechaGasto.getFullYear() === fechaActual.getFullYear();
  });
  const totalGastosDelMes = gastosDelMes.reduce((total, gasto) => total + gasto.monto, 0);
  const promedioGastoDiario = totalGastosDelMes / (new Date().getDate() || 1);
  
  // Agrupar por categorías
  const gastosPorCategoria = gastos.reduce((acc: Record<string, number>, gasto) => {
    acc[gasto.categoria] = (acc[gasto.categoria] || 0) + gasto.monto;
    return acc;
  }, {});
  
  const mayorCategoria = Object.entries(gastosPorCategoria).sort((a, b) => b[1] - a[1])[0];
  const gastosAlimentacion = gastosPorCategoria['Alimentación'] || 0;

  const statsCards = [
    {
      title: 'Total de gastos del mes',
      value: loading ? '...' : `S/. ${totalGastosDelMes.toFixed(2)}`,
      icon: <MonetizationOn />,
      color: theme.palette.error.main,
      change: '',
      changeDirection: 'down',
      description: `${gastosDelMes.length} gastos registrados`
    },
    {
      title: 'Gasto promedio diario',
      value: loading ? '...' : `S/. ${promedioGastoDiario.toFixed(2)}`,
      icon: <MonetizationOn />,
      color: theme.palette.warning.main,
      change: '',
      changeDirection: 'up',
      description: 'basado en gastos del mes'
    },
    {
      title: 'Gastos en alimentación',
      value: loading ? '...' : `S/. ${gastosAlimentacion.toFixed(2)}`,
      icon: <Inventory />,
      color: theme.palette.primary.main,
      change: '',
      changeDirection: 'down',
      description: totalGastos > 0 ? `${((gastosAlimentacion / totalGastos) * 100).toFixed(1)}% del total` : '0% del total'
    },
    {
      title: 'Mayor categoría de gasto',
      value: loading ? '...' : (mayorCategoria ? mayorCategoria[0] : 'Sin datos'),
      icon: <Receipt />,
      color: theme.palette.info.main,
      change: '',
      changeDirection: 'up',
      description: mayorCategoria && totalGastos > 0 ? `${((mayorCategoria[1] / totalGastos) * 100).toFixed(1)}% del total` : '0% del total'
    }
  ];

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      {/* Cabecera y breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Control de Gastos
        </Typography>
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} to="/" color="inherit">
            Dashboard
          </Link>
          <Typography color="text.primary">Gastos</Typography>
        </Breadcrumbs>
      </Box>

      {/* Tarjetas de estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                borderRadius: 2,
                boxShadow: 3,
                height: '100%',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 5
                },
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  backgroundColor: alpha(card.color, 0.1),
                  zIndex: 0
                }}
              />
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
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
                <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 1 }}>
                  {card.value}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {card.changeDirection === 'up' ? (
                    <ArrowUpward fontSize="small" sx={{ color: theme.palette.success.main }} />
                  ) : (
                    <ArrowDownward fontSize="small" sx={{ color: theme.palette.error.main }} />
                  )}
                  <Typography 
                    variant="body2" 
                    color={card.changeDirection === 'up' ? 'success.main' : 'error.main'}
                    fontWeight="medium"
                    sx={{ mr: 1 }}
                  >
                    {card.change}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.description}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Componente principal - Tabla de gastos */}
      <Paper sx={mainCardStyles}>
        <GastosTable />
      </Paper>
    </Container>
  );
};

export default GastosPage;
