import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Alert, CircularProgress, 
  Container, Breadcrumbs, Link, Grid, Card, CardContent,
  Avatar, useTheme, alpha
} from '../utils/mui';
import { Pets, Male, Female, History, Inventory2 } from '@mui/icons-material';
import CuyesTable from '../components/CuyesTable';
import { Link as RouterLink } from 'react-router-dom';
import api from '../services/api';
import { containerFullHeight, mainCardStyles } from '../theme/SimpleLayoutStyles';

// Datos de ejemplo para estadísticas
const fakeCuyesStats = {
  total: 128,
  machos: 55,
  hembras: 73,
  crias: 35,
  adultos: 93
};

const CuyesPage = () => {
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState(fakeCuyesStats);

  useEffect(() => {
    // Simular tiempo de carga y obtener estadísticas
    const timer = setTimeout(() => {
      // Intenta obtener estadísticas de cuyes
      api.get('/cuyes/stats')
        .then(res => {
          if (res.data) {
            setStats(res.data);
          }
        })
        .catch(err => {
          console.error("Error al cargar estadísticas:", err);
          // Mantiene los datos de ejemplo en caso de error
        })
        .finally(() => {
          setLoading(false);
        });
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Tarjetas de información para mostrar
  const infoCards = [
    {
      title: 'Total de Cuyes',
      value: stats.total,
      icon: <Pets />,
      color: theme.palette.primary.main
    },
    {
      title: 'Machos',
      value: stats.machos,
      icon: <Male />,
      color: theme.palette.info.main
    },
    {
      title: 'Hembras',
      value: stats.hembras,
      icon: <Female />,
      color: theme.palette.success.main
    },
    {
      title: 'Crías',
      value: stats.crias,
      icon: <History />,
      color: theme.palette.warning.main
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
            Gestión de Cuyes
          </Typography>
          <Breadcrumbs aria-label="breadcrumb">
            <Link component={RouterLink} to="/" color="inherit">
              Dashboard
            </Link>
            <Typography color="text.primary">Cuyes</Typography>
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
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {card.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Tabla de cuyes */}
        <Paper sx={mainCardStyles}>
          <CuyesTable />
        </Paper>
      </Container>
    );
  } catch (error) {
    console.error("Error en CuyesPage:", error);
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h5" gutterBottom>Error al cargar la página de Cuyes</Typography>
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

export default CuyesPage;
