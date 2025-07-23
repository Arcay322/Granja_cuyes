import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Box, CircularProgress, Grid, Card, CardContent, Divider, Chip,
  List, ListItem, ListItemIcon, ListItemText, Alert, IconButton,
  Avatar, LinearProgress, TextField, InputAdornment, Paper
} from '../utils/mui';
import {
  Close, Female, Male, Search, Star, TrendingUp, CheckCircle,
  Warning, Info, Pets, Scale, CalendarMonth
} from '@mui/icons-material';

interface ReproductorSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (reproductor: any) => void;
  reproductores: any[];
  tipo: 'madre' | 'padre';
  loading: boolean;
}

const ReproductorSelectionDialog: React.FC<ReproductorSelectionDialogProps> = ({
  open,
  onClose,
  onSelect,
  reproductores,
  tipo,
  loading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'tasaExito' | 'edad' | 'peso'>('tasaExito');
  
  const isMother = tipo === 'madre';

  const filteredReproductores = reproductores
    .filter(reproductor => {
      const searchLower = searchTerm.toLowerCase();
      return (
        reproductor.raza.toLowerCase().includes(searchLower) ||
        reproductor.galpon.toLowerCase().includes(searchLower) ||
        reproductor.jaula.toLowerCase().includes(searchLower) ||
        reproductor.id.toString().includes(searchLower)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'tasaExito':
          const tasaA = tipo === 'madre' ? a.historialReproductivo?.tasaExito || 0 : a.rendimientoReproductivo?.tasaExito || 0;
          const tasaB = tipo === 'madre' ? b.historialReproductivo?.tasaExito || 0 : b.rendimientoReproductivo?.tasaExito || 0;
          return tasaB - tasaA;
        case 'edad':
          return a.edad - b.edad;
        case 'peso':
          return b.peso - a.peso;
        default:
          return 0;
      }
    });

  const getPerformanceColor = (tasa: number) => {
    if (tasa >= 80) return 'success';
    if (tasa >= 60) return 'warning';
    return 'error';
  };

  const getPerformanceLabel = (tasa: number) => {
    if (tasa >= 80) return 'Excelente';
    if (tasa >= 60) return 'Buena';
    if (tasa >= 40) return 'Regular';
    return 'Baja';
  };

  const renderReproductorCard = (reproductor: any) => {
    const isMother = tipo === 'madre';
    const historial = isMother ? reproductor.historialReproductivo : reproductor.rendimientoReproductivo;
    const tasaExito = historial?.tasaExito || 0;
    
    return (
      <Grid size={{ xs: 12, md: 6 }} key={reproductor.id}>
        <Card 
          sx={{ 
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 4
            }
          }}
          onClick={() => onSelect(reproductor)}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ 
                  bgcolor: isMother ? '#e91e63' : '#2196f3', 
                  width: 40, 
                  height: 40 
                }}>
                  {isMother ? <Female /> : <Male />}
                </Avatar>
                <Box>
                  <Typography variant="h6">ID: {reproductor.id}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {reproductor.raza} • {reproductor.galpon}-{reproductor.jaula}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ textAlign: 'right' }}>
                <Chip 
                  label={getPerformanceLabel(tasaExito)}
                  color={getPerformanceColor(tasaExito) as unknown}
                  size="small"
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {reproductor.estadoReproductivo || 'Disponible'}
                </Typography>
              </Box>
            </Box>

            {/* Información básica */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{reproductor.edad}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    meses
                  </Typography>
                </Box>
              </Grid>
              <Grid size={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{reproductor.peso.toFixed(1)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    kg
                  </Typography>
                </Box>
              </Grid>
              <Grid size={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{tasaExito.toFixed(1)}%</Typography>
                  <Typography variant="caption" color="text.secondary">
                    éxito
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Barra de rendimiento */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Rendimiento: {tasaExito.toFixed(1)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={tasaExito} 
                color={getPerformanceColor(tasaExito) as unknown}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            {/* Historial específico */}
            {isMother ? (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Historial Reproductivo:
                </Typography>
                <Grid container spacing={1}>
                  <Grid size={6}>
                    <Typography variant="body2">
                      <strong>Preñeces:</strong> {historial?.totalPreneces || 0}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="body2">
                      <strong>Exitosas:</strong> {historial?.prenecesExitosas || 0}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="body2">
                      <strong>Prom. Litada:</strong> {historial?.promedioLitada?.toFixed(1) || '0.0'}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="body2">
                      <strong>Estado:</strong> {reproductor.estadoReproductivo}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Rendimiento Reproductivo:
                </Typography>
                <Grid container spacing={1}>
                  <Grid size={6}>
                    <Typography variant="body2">
                      <strong>Cruces:</strong> {historial?.totalCruces || 0}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="body2">
                      <strong>Prom. Desc.:</strong> {historial?.promedioDescendencia?.toFixed(1) || '0.0'}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="body2">
                      <strong>Diversidad:</strong> {reproductor.genetica?.diversidadGenetica || 0}%
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="body2">
                      <strong>Frecuencia:</strong> {historial?.frecuenciaCruce || 0}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Indicadores de salud */}
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {reproductor.salud?.pesoOptimo && (
                <Chip 
                  label="Peso Óptimo" 
                  color="success" 
                  size="small"
                  icon={<CheckCircle />}
                />
              )}
              
              {reproductor.estaDisponible && (
                <Chip 
                  label="Disponible" 
                  color="info" 
                  size="small"
                  icon={<Star />}
                />
              )}
              
              {tasaExito >= 80 && (
                <Chip 
                  label="Alto Rendimiento" 
                  color="success" 
                  size="small"
                  icon={<TrendingUp />}
                />
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {isMother ? (
              <>
                <Female sx={{ mr: 1, verticalAlign: 'middle', color: '#e91e63' }} />
                Seleccionar Madre
              </>
            ) : (
              <>
                <Male sx={{ mr: 1, verticalAlign: 'middle', color: '#2196f3' }} />
                Seleccionar Padre
              </>
            )}
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Controles de búsqueda y filtrado */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                placeholder={`Buscar ${tipo}s...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 250 }}
              />
              
              <Button
                variant={sortBy === 'tasaExito' ? 'contained' : 'outlined'}
                onClick={() => setSortBy('tasaExito')}
                size="small"
              >
                Por Rendimiento
              </Button>
              
              <Button
                variant={sortBy === 'edad' ? 'contained' : 'outlined'}
                onClick={() => setSortBy('edad')}
                size="small"
              >
                Por Edad
              </Button>
              
              <Button
                variant={sortBy === 'peso' ? 'contained' : 'outlined'}
                onClick={() => setSortBy('peso')}
                size="small"
              >
                Por Peso
              </Button>
            </Box>

            {/* Resumen */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2">
                📊 {filteredReproductores.length} {tipo}s disponibles
                {searchTerm && ` (filtrado por "${searchTerm}")`}
              </Typography>
            </Alert>

            {/* Lista de reproductores */}
            {filteredReproductores.length > 0 ? (
              <Grid container spacing={2}>
                {filteredReproductores.map(renderReproductorCard)}
              </Grid>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  {searchTerm ? 'No se encontraron resultados' : `No hay ${tipo}s disponibles`}
                </Typography>
                {searchTerm && (
                  <Button onClick={() => setSearchTerm('')} sx={{ mt: 2 }}>
                    Limpiar búsqueda
                  </Button>
                )}
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReproductorSelectionDialog;