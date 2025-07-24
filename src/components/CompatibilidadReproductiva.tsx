import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Box, CircularProgress, Grid, Card, CardContent, Divider, Chip,
  List, ListItem, ListItemIcon, ListItemText, Alert, IconButton
} from '../utils/mui';
import {
  CheckCircle, Warning, Info, Close, Favorite, TrendingUp,
  Pets, Timeline, Assessment, VerifiedUser, ErrorOutline
} from '@mui/icons-material';
import api from '../services/api';
import toastService from '../services/toastService';

interface CompatibilidadReproductivaProps {
  open: boolean;
  onClose: () => void;
  madreId?: number;
  padreId?: number;
}

interface CompatibilidadData {
  compatibilityScore: number;
  nivelCompatibilidad: 'Excelente' | 'Buena' | 'Regular' | 'Baja';
  recomendaciones: string[];
  advertencias: string[];
  predicciones: {
    litadaEsperada: number;
    tasaExitoEstimada: number;
    tiempoGestacionEstimado: number;
  };
  detalles: {
    madre: {
      id: number;
      raza: string;
      edad: number;
      peso: number;
      historial: {
        totalPreneces: number;
        prenecesExitosas: number;
        tasaExito: number;
        promedioLitada: number;
      };
    };
    padre: {
      id: number;
      raza: string;
      edad: number;
      peso: number;
      historial: {
        totalCruces: number;
        crucesExitosos: number;
        tasaExito: number;
        promedioLitada: number;
      };
    };
  };
}

const CompatibilidadReproductiva: React.FC<CompatibilidadReproductivaProps> = ({
  open,
  onClose,
  madreId,
  padreId
}) => {
  const [loading, setLoading] = useState(false);
  const [compatibilidad, setCompatibilidad] = useState<CompatibilidadData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && madreId && padreId) {
      calcularCompatibilidad();
    }
  }, [open, madreId, padreId]);

  const calcularCompatibilidad = async () => {
    if (!madreId || !padreId) {
      setError('Se requiere seleccionar madre y padre para calcular compatibilidad');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/reproduccion/prenez/calcular-compatibilidad', {
        madreId,
        padreId
      });

      if ((response.data as any).success) {
        setCompatibilidad((response.data as any).data);
      } else {
        setError((response.data as any).message || 'Error al calcular compatibilidad');
      }
    } catch (error: any) {
      console.error('Error al calcular compatibilidad:', error);
      setError(error.response?.data?.message || error.message || 'Error al calcular compatibilidad');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#4caf50'; // verde
    if (score >= 70) return '#8bc34a'; // verde claro
    if (score >= 55) return '#ff9800'; // naranja
    return '#f44336'; // rojo
  };

  const getChipColor = (nivel: string) => {
    switch (nivel) {
      case 'Excelente': return 'success';
      case 'Buena': return 'info';
      case 'Regular': return 'warning';
      case 'Baja': return 'error';
      default: return 'default';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: { xs: 'auto', md: '70vh' },
          borderRadius: 3,
          boxShadow: 6,
          background: '#fff',
        }
      }}
    >
      <DialogTitle sx={{ px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 }, bgcolor: '#f8fafc' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: 18, md: 22 } }}>
            <Favorite sx={{ mr: 1, verticalAlign: 'middle', color: '#e91e63' }} />
            Compatibilidad Reproductiva
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#888', '&:hover': { color: '#e91e63', bgcolor: '#fce4ec' } }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : compatibilidad ? (
          <Box>
            {/* Resumen de compatibilidad */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: { xs: 2, md: 4 } }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: 20, md: 28 } }}>
                Compatibilidad: {compatibilidad.nivelCompatibilidad}
              </Typography>
              <Box
                sx={{
                  width: { xs: 140, sm: 180, md: 200 },
                  height: { xs: 140, sm: 180, md: 200 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  mb: 1
                }}
              >
                <Box sx={{ position: 'absolute', width: '100%', height: '100%' }}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={200}
                    thickness={4}
                    sx={{
                      color: '#f0f0f0',
                      width: '100% !important',
                      height: '100% !important',
                      position: 'absolute',
                      top: 0,
                      left: 0
                    }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={compatibilidad.compatibilityScore}
                    size={200}
                    thickness={4}
                    sx={{
                      color: getScoreColor(compatibilidad.compatibilityScore),
                      width: '100% !important',
                      height: '100% !important',
                      position: 'absolute',
                      top: 0,
                      left: 0
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <Typography
                    variant="h3"
                    component="div"
                    color={getScoreColor(compatibilidad.compatibilityScore)}
                    sx={{ fontWeight: 700, fontSize: { xs: 32, sm: 40, md: 48 } }}
                  >
                    {compatibilidad.compatibilityScore}%
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={compatibilidad.nivelCompatibilidad}
                color={getChipColor(compatibilidad.nivelCompatibilidad) as any}
                sx={{ mt: 2, fontSize: { xs: '0.95rem', md: '1.1rem' }, px: 2, py: 1, fontWeight: 600, letterSpacing: 0.5 }}
              />
            </Box>

            <Divider sx={{ my: { xs: 2, md: 3 } }} />

            {/* Predicciones */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: { xs: 16, md: 20 } }}>
              <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
              Predicciones
            </Typography>
            <Grid container spacing={2} sx={{ mb: { xs: 2, md: 3 } }}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ borderRadius: 3, boxShadow: 2, bgcolor: '#f8fafc' }}>
                  <CardContent sx={{ textAlign: 'center', p: { xs: 2, md: 3 } }}>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                      Litada Esperada
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#43a047' }}>
                      {compatibilidad.predicciones.litadaEsperada}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      crías promedio
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ borderRadius: 3, boxShadow: 2, bgcolor: '#f8fafc' }}>
                  <CardContent sx={{ textAlign: 'center', p: { xs: 2, md: 3 } }}>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                      Tasa de Éxito
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
                      {compatibilidad.predicciones.tasaExitoEstimada}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      probabilidad de éxito
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ borderRadius: 3, boxShadow: 2, bgcolor: '#f8fafc' }}>
                  <CardContent sx={{ textAlign: 'center', p: { xs: 2, md: 3 } }}>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                      Gestación
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
                      {compatibilidad.predicciones.tiempoGestacionEstimado}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      días estimados
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Divider sx={{ my: { xs: 2, md: 3 } }} />

            {/* Recomendaciones y advertencias */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600, fontSize: { xs: 15, md: 18 } }}>
                  <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Recomendaciones
                </Typography>
                <List>
                  {compatibilidad.recomendaciones.map((recomendacion, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Info color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={recomendacion} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom color="warning.main" sx={{ fontWeight: 600, fontSize: { xs: 15, md: 18 } }}>
                  <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Advertencias
                </Typography>
                {compatibilidad.advertencias.length > 0 ? (
                  <List>
                    {compatibilidad.advertencias.map((advertencia, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <ErrorOutline color="warning" />
                        </ListItemIcon>
                        <ListItemText primary={advertencia} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    No se encontraron advertencias para esta pareja reproductiva.
                  </Alert>
                )}
              </Grid>
            </Grid>

            <Divider sx={{ my: { xs: 2, md: 3 } }} />

            {/* Detalles de los reproductores */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: { xs: 15, md: 18 } }}>
              <Pets sx={{ mr: 1, verticalAlign: 'middle' }} />
              Detalles de los Reproductores
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                  <CardContent>
                    <Typography variant="h6" color="#e91e63" gutterBottom sx={{ fontWeight: 700 }}>
                      Madre (ID: {compatibilidad.detalles.madre.id})
                    </Typography>
                    <Typography variant="body1">
                      <strong>Raza:</strong> {compatibilidad.detalles.madre.raza}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Edad:</strong> {compatibilidad.detalles.madre.edad} meses
                    </Typography>
                    <Typography variant="body1">
                      <strong>Peso:</strong> {compatibilidad.detalles.madre.peso} kg
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      Historial Reproductivo:
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Total Preñeces:</strong> {compatibilidad.detalles.madre.historial.totalPreneces}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Preñeces Exitosas:</strong> {compatibilidad.detalles.madre.historial.prenecesExitosas}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Tasa de Éxito:</strong> {compatibilidad.detalles.madre.historial.tasaExito.toFixed(1)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Promedio Litada:</strong> {compatibilidad.detalles.madre.historial.promedioLitada.toFixed(1)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                  <CardContent>
                    <Typography variant="h6" color="#2196f3" gutterBottom sx={{ fontWeight: 700 }}>
                      Padre (ID: {compatibilidad.detalles.padre.id})
                    </Typography>
                    <Typography variant="body1">
                      <strong>Raza:</strong> {compatibilidad.detalles.padre.raza}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Edad:</strong> {compatibilidad.detalles.padre.edad} meses
                    </Typography>
                    <Typography variant="body1">
                      <strong>Peso:</strong> {compatibilidad.detalles.padre.peso} kg
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      Historial Reproductivo:
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Total Cruces:</strong> {compatibilidad.detalles.padre.historial.totalCruces}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Cruces Exitosos:</strong> {compatibilidad.detalles.padre.historial.crucesExitosos}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Tasa de Éxito:</strong> {compatibilidad.detalles.padre.historial.tasaExito.toFixed(1)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Promedio Litada:</strong> {compatibilidad.detalles.padre.historial.promedioLitada.toFixed(1)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            Seleccione una madre y un padre para calcular su compatibilidad reproductiva.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 } }}>
        <Button onClick={onClose} color="primary" variant="contained" sx={{ borderRadius: 2, fontWeight: 600, fontSize: { xs: 15, md: 16 } }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompatibilidadReproductiva;