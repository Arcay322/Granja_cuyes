import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Collapse,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Pets as PetsIcon,
  Home as HomeIcon,
  Favorite as HeartIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useSwipeable } from 'react-swipeable';

interface MobileDashboardProps {
  metrics: any;
  chartsData: unknown;
  loading: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mobile-tabpanel-${index}`}
      aria-labelledby={`mobile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  metrics,
  chartsData,
  loading
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState(0);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCardExpand = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (tabValue < 2) setTabValue(tabValue + 1);
    },
    onSwipedRight: () => {
      if (tabValue > 0) setTabValue(tabValue - 1);
    },
    trackMouse: true
  });

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary" align="center">
          Cargando dashboard...
        </Typography>
      </Box>
    );
  }

  if (!metrics) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No hay datos disponibles
        </Typography>
      </Box>
    );
  }

  const reproductiveStats = metrics.reproductiveStats || {};
  const performanceMetrics = metrics.performanceMetrics || {};

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.default' }}>
      {/* Tabs Navigation */}
      <Paper square elevation={1}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          sx={{
            '& .MuiTab-root': {
              minHeight: 48,
              fontSize: '0.75rem'
            }
          }}
        >
          <Tab label="Resumen" icon={<HomeIcon fontSize="small" />} />
          <Tab label="Reproducción" icon={<HeartIcon fontSize="small" />} />
          <Tab label="Alertas" icon={<WarningIcon fontSize="small" />} />
        </Tabs>
      </Paper>

      {/* Swipeable Content */}
      <Box {...swipeHandlers}>
        {/* Tab 1: Resumen General */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            {/* Métricas principales */}
            <Grid size={{ xs: 6 }}>
              <Card elevation={2}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, mr: 1 }}>
                      <PetsIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" component="div">
                      {reproductiveStats.totalAnimals || 0}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Animales
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <Card elevation={2}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32, mr: 1 }}>
                      <HeartIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" component="div">
                      {reproductiveStats.activePregnancies || 0}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Preñeces Activas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <Card elevation={2}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32, mr: 1 }}>
                      <CheckIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" component="div">
                      {reproductiveStats.successRate?.toFixed(1) || 0}%
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Tasa de Éxito
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <Card elevation={2}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32, mr: 1 }}>
                      <ScheduleIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" component="div">
                      {reproductiveStats.expectedBirths || 0}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Partos Esperados
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Card expandible de rendimiento */}
            <Grid size={{ xs: 12 }}>
              <Card elevation={2}>
                <CardContent sx={{ p: 2 }}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleCardExpand('performance')}
                  >
                    <Typography variant="h6">
                      Rendimiento General
                    </Typography>
                    <IconButton size="small">
                      {expandedCards.performance ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                  
                  <Collapse in={expandedCards.performance}>
                    <Box sx={{ mt: 2 }}>
                      <List dense>
                        <ListItem>
                          <ListItemText
                            primary="Eficiencia Reproductiva"
                            secondary={`${performanceMetrics.breedingEfficiency?.toFixed(1) || 0}%`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Promedio Crías por Camada"
                            secondary={performanceMetrics.averageLitterSize?.toFixed(1) || 0}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Reproductoras Activas"
                            secondary={performanceMetrics.activeReproducers || 0}
                          />
                        </ListItem>
                      </List>
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 2: Reproducción Detallada */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Estado Reproductivo
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Tasa de Éxito</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {reproductiveStats.successRate?.toFixed(1) || 0}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={reproductiveStats.successRate || 0}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <HeartIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Preñeces Activas"
                        secondary={`${reproductiveStats.activePregnancies || 0} hembras gestantes`}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <PetsIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Nacimientos Recientes"
                        secondary={`${reproductiveStats.recentBirths || 0} en los últimos 30 días`}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <ScheduleIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Partos Próximos"
                        secondary={`${reproductiveStats.expectedBirths || 0} en los próximos 30 días`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Gráfico simplificado para móvil */}
            <Grid size={{ xs: 12 }}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Tendencia Mensual
                  </Typography>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Gráfico interactivo disponible en versión desktop
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 3: Alertas */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Alertas Activas
                  </Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Preñeces Vencidas"
                        secondary="2 hembras requieren atención"
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <ScheduleIcon color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Partos Próximos"
                        secondary="5 partos esperados esta semana"
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Sistema Saludable"
                        secondary="No hay alertas críticas"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>

      {/* Indicador de swipe */}
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: tabValue === index ? 'primary.main' : 'grey.300',
              mx: 0.5,
              transition: 'background-color 0.3s'
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default MobileDashboard;