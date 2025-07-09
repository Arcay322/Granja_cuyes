import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Alert, CircularProgress, 
  Container, Breadcrumbs, Link, Grid, Card, CardContent,
  Avatar, useTheme, alpha, Button
} from '../utils/mui';
import { ShoppingCart, TrendingUp, PeopleAlt, MonetizationOn, AttachMoney } from '@mui/icons-material';
import VentasTable from '../components/VentasTable';
import { Link as RouterLink } from 'react-router-dom';
import api from '../services/api';
import { containerFullHeight, mainCardStyles } from '../theme/SimpleLayoutStyles';

const VentasPage = () => {
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const response = await api.get('/ventas');
        setVentas(response.data);
      } catch (error) {
        console.error('Error al cargar ventas:', error);
        setError('Error al cargar las ventas');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVentas();
  }, []);

  // Calcular datos reales a partir de las ventas obtenidas
  const totalVentas = ventas.length;
  const ingresosTotales = ventas.reduce((total, venta) => total + venta.total, 0);
  const ventasDelMes = ventas.filter(venta => {
    const fechaVenta = new Date(venta.fecha);
    const fechaActual = new Date();
    return fechaVenta.getMonth() === fechaActual.getMonth() && 
           fechaVenta.getFullYear() === fechaActual.getFullYear();
  });
  const ingresosDelMes = ventasDelMes.reduce((total, venta) => total + venta.total, 0);
  const clientesUnicos = new Set(ventas.map(venta => venta.clienteId)).size;

  // Tarjetas de información para mostrar
  const infoCards = [
    {
      title: 'Total de Ventas',
      value: loading ? '...' : totalVentas.toString(),
      icon: <ShoppingCart />,
      color: theme.palette.primary.main,
      description: 'Ventas registradas'
    },
    {
      title: 'Ventas del Mes',
      value: loading ? '...' : ventasDelMes.length.toString(),
      icon: <TrendingUp />,
      color: theme.palette.success.main,
      description: 'Ventas este mes'
    },
    {
      title: 'Clientes Activos',
      value: loading ? '...' : clientesUnicos.toString(),
      icon: <PeopleAlt />,
      color: theme.palette.info.main,
      description: 'Clientes únicos'
    },
    {
      title: 'Ingresos del Mes',
      value: loading ? '...' : `S/. ${ingresosDelMes.toFixed(2)}`,
      icon: <MonetizationOn />,
      color: theme.palette.warning.main,
      description: 'Total facturado'
    }
  ];

  // Manejo de estado de carga
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  try {
    return (
      <Container disableGutters maxWidth={false} sx={{...containerFullHeight, width: '100%'}}>
        {/* Mostrar error si existe */}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        {/* Cabecera y breadcrumbs */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Gestión de Ventas
          </Typography>
          <Breadcrumbs aria-label="breadcrumb">
            <Link component={RouterLink} to="/" color="inherit">
              Dashboard
            </Link>
            <Typography color="text.primary">Ventas</Typography>
          </Breadcrumbs>
        </Box>

        {/* Tarjetas de estadísticas */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {infoCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
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
                  <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 1 }}>
                    {card.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Tabla de ventas */}
        <Paper sx={mainCardStyles}>
          <VentasTable />
        </Paper>
      </Container>
    );
  } catch (error) {
    console.error("Error en VentasPage:", error);
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h5" gutterBottom>Error al cargar la página de Ventas</Typography>
        <Alert severity="error" sx={{ mb: 3 }}>
          Ocurrió un error inesperado. Por favor, intenta de nuevo o contacta al soporte técnico.
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.reload()}
        >
          Reintentar
        </Button>
      </Box>
    );
  }
};

export default VentasPage;
