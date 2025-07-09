import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Alert, CircularProgress, 
  Container, Breadcrumbs, Link, Grid, Card, CardContent,
  Avatar, useTheme, alpha, Button
} from '../utils/mui';
import { Healing, MedicalServices, LocalHospital, MonitorHeart, Pets } from '@mui/icons-material';
import SaludTable from '../components/SaludTable';
import { Link as RouterLink } from 'react-router-dom';
import api from '../services/api';
import { containerFullHeight, mainCardStyles } from '../theme/SimpleLayoutStyles';

const SaludPage = () => {
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [registrosSalud, setRegistrosSalud] = useState([]);
  const [cuyes, setCuyes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtenemos los cuyes para calcular estadísticas generales
        const cuyesResponse = await api.get('/cuyes');
        setCuyes(cuyesResponse.data);
        
        // Los registros de salud requieren autenticación, 
        // pero podemos mostrar estadísticas basadas en los cuyes
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Calcular estadísticas basadas en los cuyes disponibles
  const totalCuyes = cuyes.length;
  const cuyesJovenes = cuyes.filter(cuy => {
    const fechaNac = new Date(cuy.fechaNacimiento);
    const edadMeses = Math.floor((Date.now() - fechaNac.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return edadMeses < 3;
  }).length;
  const cuyesMachos = cuyes.filter(cuy => cuy.sexo === 'M').length;
  const cuyesHembras = cuyes.filter(cuy => cuy.sexo === 'H').length;

  // Tarjetas de información para mostrar
  const infoCards = [
    {
      title: 'Total de Cuyes',
      value: loading ? '...' : totalCuyes.toString(),
      icon: <Pets />,
      color: theme.palette.primary.main,
      description: 'Cuyes en la granja'
    },
    {
      title: 'Cuyes Jóvenes',
      value: loading ? '...' : cuyesJovenes.toString(),
      icon: <MedicalServices />,
      color: theme.palette.info.main,
      description: 'Menores de 3 meses'
    },
    {
      title: 'Machos',
      value: loading ? '...' : cuyesMachos.toString(),
      icon: <LocalHospital />,
      color: theme.palette.warning.main,
      description: 'Cuyes machos'
    },
    {
      title: 'Hembras',
      value: loading ? '...' : cuyesHembras.toString(),
      icon: <MonitorHeart />,
      color: theme.palette.error.main,
      description: 'Cuyes hembras'
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
      <Container disableGutters maxWidth={false} sx={containerFullHeight}>
        {/* Mostrar error si existe */}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        {/* Cabecera y breadcrumbs */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Control de Salud
          </Typography>
          <Breadcrumbs aria-label="breadcrumb">
            <Link component={RouterLink} to="/" color="inherit">
              Dashboard
            </Link>
            <Typography color="text.primary">Salud</Typography>
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

        {/* Tabla de salud */}
        <Paper sx={mainCardStyles}>
          <SaludTable />
        </Paper>
      </Container>
    );
  } catch (error) {
    console.error("Error en SaludPage:", error);
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h5" gutterBottom>Error al cargar la página de Salud</Typography>
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

export default SaludPage;
