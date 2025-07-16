import React, { useEffect, useState } from 'react';
import { Box, Typography, Breadcrumbs, Link, Paper, Container, Grid, Card, CardContent, IconButton, Avatar, useTheme, alpha, Tabs, Tab } from "../utils/mui";
import AlimentosTable from '../components/AlimentosTable';
import ConsumoAlimentosTable from '../components/ConsumoAlimentosTable';
import { LocalDining, Spa, Grass, Science, Analytics, Restaurant, Inventory } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { mainCardStyles } from '../theme/SimpleLayoutStyles';
import api from '../services/api';

const AlimentosPage = () => {
  const theme = useTheme();
  const [alimentos, setAlimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchAlimentos = async () => {
      try {
        const response = await api.get('/alimentos');
        setAlimentos(response.data);
      } catch (error) {
        console.error('Error al cargar alimentos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlimentos();
  }, []);

  // Calcular datos reales a partir de los alimentos obtenidos
  const totalAlimentos = alimentos.length;
  const stockTotal = alimentos.reduce((total, alimento) => total + alimento.stock, 0);
  const forraje = alimentos.filter(a => 
    a.nombre.toLowerCase().includes('forraje') || 
    a.nombre.toLowerCase().includes('alfalfa') ||
    a.descripcion.toLowerCase().includes('forraje')
  ).reduce((total, alimento) => total + alimento.stock, 0);
  const suplementos = alimentos.filter(a => 
    a.nombre.toLowerCase().includes('suplemento') || 
    a.nombre.toLowerCase().includes('vitamina') ||
    a.descripcion.toLowerCase().includes('suplemento') ||
    a.descripcion.toLowerCase().includes('vitamina')
  ).length;

  const infoCards = [
    {
      title: 'Alimentos disponibles',
      value: loading ? '...' : totalAlimentos.toString(),
      icon: <LocalDining />,
      color: theme.palette.primary.main,
      description: 'Total de tipos de alimentos en inventario'
    },
    {
      title: 'Stock total',
      value: loading ? '...' : `${stockTotal} kg`,
      icon: <Spa />,
      color: theme.palette.success.main,
      description: 'Peso total de alimentos disponibles'
    },
    {
      title: 'Forraje disponible',
      value: loading ? '...' : `${forraje} kg`,
      icon: <Grass />,
      color: theme.palette.info.main,
      description: 'Cantidad de forraje fresco y seco'
    },
    {
      title: 'Suplementos',
      value: loading ? '...' : `${suplementos} tipos`,
      icon: <Science />,
      color: theme.palette.warning.main,
      description: 'Vitaminas y suplementos alimenticios'
    }
  ];

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      {/* Cabecera y breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Gestión de Alimentos
        </Typography>
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} to="/" color="inherit">
            Dashboard
          </Link>
          <Typography color="text.primary">Alimentos</Typography>
        </Breadcrumbs>
      </Box>

      {/* Tarjetas informativas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {infoCards.map((card, index) => (
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
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pestañas para alternar entre Alimentos y Consumo */}
      <Paper sx={mainCardStyles}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={(event, newValue) => setTabValue(newValue)}
            aria-label="pestañas de alimentos"
          >
            <Tab 
              icon={<Inventory />} 
              label="Inventario de Alimentos" 
              iconPosition="start"
              sx={{ minHeight: 60 }}
            />
            <Tab 
              icon={<Restaurant />} 
              label="Consumo de Alimentos" 
              iconPosition="start"
              sx={{ minHeight: 60 }}
            />
          </Tabs>
        </Box>
        
        {/* Contenido de las pestañas */}
        <Box sx={{ p: 0 }}>
          {tabValue === 0 && <AlimentosTable />}
          {tabValue === 1 && <ConsumoAlimentosTable />}
        </Box>
      </Paper>
    </Container>
  );
};

export default AlimentosPage;
