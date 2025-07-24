import React, { useState } from 'react';
import { useEffect } from 'react';
import api from '../services/api';
import { Dialog as MuiDialog } from '@mui/material';
interface EstadisticasDialogProps {
  open: boolean;
  onClose: () => void;
  cuy: any | null;
  tipo: 'madre' | 'padre';
}

export const EstadisticasDialog: React.FC<EstadisticasDialogProps> = ({ open, onClose, cuy, tipo }) => {
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && cuy) {
      setLoading(true);
      setError(null);
      api.get(`/cuyes/${cuy.id}/estadisticas`)
        .then(res => {
          setEstadisticas(res.data.data);
        })
        .catch(() => {
          setError('No se pudieron obtener las estadísticas');
        })
        .finally(() => setLoading(false));
    } else {
      setEstadisticas(null);
    }
  }, [open, cuy]);

  // Helper para formatear fechas
  const formatDate = (date: string | number | Date | null) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '-';
    }
  };

  return (
    <MuiDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#f8fafc', fontWeight: 700, fontSize: { xs: 18, md: 22 } }}>
        Estadísticas reproductivas del {tipo === 'madre' ? 'madre' : 'padre'} (ID: {cuy?.id})
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : estadisticas ? (
          <Box sx={{ p: 1 }}>
            <Grid container spacing={2}>
              {/* Resumen principal */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 2, bgcolor: '#f8fafc' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: tipo === 'madre' ? '#e91e63' : '#1976d2' }}>
                      <Pets sx={{ mr: 1, verticalAlign: 'middle' }} /> Resumen
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                      {tipo === 'madre' ? (
                        <>
                          <Chip label={`Preñeces: ${estadisticas.resumen.totalPreneces ?? '-'}`} color="primary" />
                          <Chip label={`Exitosas: ${estadisticas.resumen.prenecesExitosas ?? '-'}`} color="success" />
                          <Chip label={`Abortos: ${estadisticas.resumen.abortos ?? '-'}`} color="error" />
                          <Chip label={`Prom. crías/camada: ${estadisticas.resumen.promedioLitada ?? '-'}`} color="info" />
                          <Chip label={`Tasa éxito: ${estadisticas.resumen.tasaExito ?? '-'}%`} color="success" />
                          <Chip label={`Partos próximos: ${estadisticas.resumen.partosProximos ?? '-'}`} color="warning" />
                        </>
                      ) : (
                        <>
                          <Chip label={`Cruces: ${estadisticas.resumen.totalCruces ?? '-'}`} color="primary" />
                          <Chip label={`Exitosos: ${estadisticas.resumen.crucesExitosos ?? '-'}`} color="success" />
                          <Chip label={`Prom. descendencia: ${estadisticas.resumen.promedioDescendencia ?? '-'}`} color="info" />
                          <Chip label={`Tasa éxito: ${estadisticas.resumen.tasaExito ?? '-'}%`} color="success" />
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Crías/Hijos y dinámica */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 2, bgcolor: '#f8fafc' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#43a047' }}>
                      {tipo === 'madre' ? 'Crías' : 'Hijos'}
                    </Typography>
                    {tipo === 'madre' ? (
                      <>
                        <Typography variant="body2">Vivas: <b>{estadisticas.crias?.vivas ?? '-'}</b></Typography>
                        <Typography variant="body2">Muertas: <b>{estadisticas.crias?.muertas ?? '-'}</b></Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant="body2">Vivos: <b>{estadisticas.hijos?.vivos ?? '-'}</b></Typography>
                        <Typography variant="body2">Muertos: <b>{estadisticas.hijos?.muertos ?? '-'}</b></Typography>
                      </>
                    )}
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#ff9800' }}>
                      Dinámica
                    </Typography>
                    {tipo === 'madre' ? (
                      <>
                        <Typography variant="body2">Días entre partos:</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                          {estadisticas.dinamica?.diasEntrePartos?.length > 0 ? (
                            estadisticas.dinamica.diasEntrePartos.map((dias: number, i: number) => (
                              <Chip key={i} label={`${dias} días`} color="default" size="small" />
                            ))
                          ) : (
                            <Typography variant="caption" color="text.secondary">No hay datos</Typography>
                          )}
                        </Box>
                      </>
                    ) : null}
                  </CardContent>
                </Card>
              </Grid>

              {/* Fechas importantes */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 2, bgcolor: '#f8fafc' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#1976d2' }}>
                      <CalendarMonth sx={{ mr: 1, verticalAlign: 'middle' }} /> Fechas
                    </Typography>
                    {tipo === 'madre' ? (
                      <>
                        <Typography variant="body2">Primer parto: <b>{formatDate(estadisticas.resumen.primerParto)}</b></Typography>
                        <Typography variant="body2">Último parto: <b>{formatDate(estadisticas.resumen.ultimoParto)}</b></Typography>
                        <Typography variant="body2">Días desde último parto: <b>{estadisticas.resumen.diasDesdeUltimoParto ?? '-'}</b></Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant="body2">Primera monta: <b>{formatDate(estadisticas.resumen.primerMonta)}</b></Typography>
                        <Typography variant="body2">Última monta: <b>{formatDate(estadisticas.resumen.ultimaMonta)}</b></Typography>
                        <Typography variant="body2">Días desde última monta: <b>{estadisticas.resumen.diasDesdeUltimaMonta ?? '-'}</b></Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Historial avanzado */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700, color: '#e91e63' }}>
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} /> Historial reproductivo
              </Typography>
              <Paper variant="outlined" sx={{ maxHeight: 220, overflow: 'auto', p: 1, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <List dense>
                  {tipo === 'madre' && estadisticas.historialPreneces ? (
                    estadisticas.historialPreneces.map((p: any, i: number) => (
                      <ListItem key={i} sx={{ borderBottom: '1px solid #eee' }}>
                        <ListItemIcon>
                          {p.estado === 'completada' ? <CheckCircle color="success" /> : p.estado === 'fallida' ? <Warning color="error" /> : <Info color="info" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={<span style={{ fontWeight: 600 }}>{`Preñez: ${formatDate(p.fechaPrenez)} → ${formatDate(p.fechaProbableParto)}`}</span>}
                          secondary={<span style={{ color: '#888' }}>{`Estado: ${p.estado}${p.camada ? ` | Camada: ${p.camada.numVivos} vivos, ${p.camada.numMuertos} muertos` : ''}`}</span>}
                        />
                      </ListItem>
                    ))
                  ) : null}
                  {tipo === 'padre' && estadisticas.historialCruces ? (
                    estadisticas.historialCruces.map((p: any, i: number) => (
                      <ListItem key={i} sx={{ borderBottom: '1px solid #eee' }}>
                        <ListItemIcon>
                          {p.estado === 'completada' ? <CheckCircle color="success" /> : p.estado === 'fallida' ? <Warning color="error" /> : <Info color="info" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={<span style={{ fontWeight: 600 }}>{`Monta: ${formatDate(p.fechaPrenez)}`}</span>}
                          secondary={<span style={{ color: '#888' }}>{`Estado: ${p.estado}${p.camada ? ` | Camada: ${p.camada.numVivos} vivos, ${p.camada.numMuertos} muertos` : ''}`}</span>}
                        />
                      </ListItem>
                    ))
                  ) : null}
                  {(!estadisticas.historialPreneces && !estadisticas.historialCruces) && (
                    <ListItem>
                      <ListItemText primary="Sin historial disponible" />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Box>
          </Box>
        ) : (
          <Typography>No hay datos disponibles.</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 } }}>
        <Button onClick={onClose} color="primary" variant="contained" sx={{ borderRadius: 2, fontWeight: 600, fontSize: { xs: 15, md: 16 } }}>
          Cerrar
        </Button>
      </DialogActions>
    </MuiDialog>
  );
};
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

  // Estado para el diálogo de estadísticas
  const [estadisticasOpen, setEstadisticasOpen] = useState(false);
  const [selectedCuy, setSelectedCuy] = useState<any | null>(null);

  const handleShowEstadisticas = (reproductor: any) => {
    setSelectedCuy(reproductor);
    setEstadisticasOpen(true);
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
            <Button variant="outlined" size="small" sx={{ mb: 1 }} onClick={() => handleShowEstadisticas(reproductor)}>
              Ver estadísticas
            </Button>
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
    <>
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
      <EstadisticasDialog
        open={estadisticasOpen}
        onClose={() => setEstadisticasOpen(false)}
        cuy={selectedCuy}
        tipo={tipo}
      />
    </>
  );
};

export default ReproductorSelectionDialog;