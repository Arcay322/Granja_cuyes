import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Box, CircularProgress, Grid, Card, CardContent, Divider, Chip,
  List, ListItem, ListItemIcon, ListItemText, Alert, IconButton,
  Avatar, LinearProgress
} from '../utils/mui';
import {
  Lightbulb, Close, Female, Male, Star, TrendingUp,
  Favorite, Assessment, CheckCircle, Warning
} from '@mui/icons-material';
import api from '../services/api';
import toastService from '../services/toastService';

interface RecomendacionesReproductivasProps {
  open: boolean;
  onClose: () => void;
  madreId?: number;
  padreId?: number;
}

interface RecomendacionData {
  recomendaciones: {
    madre: {
      id: number;
      raza: string;
      galpon: string;
      jaula: string;
      compatibilityScore: number;
      predicciones: {
        litadaEsperada: number;
        tasaExitoEstimada: number;
      };
      razones: string[];
    };
    padre: {
      id: number;
      raza: string;
      galpon: string;
      jaula: string;
      compatibilityScore: number;
      predicciones: {
        litadaEsperada: number;
        tasaExitoEstimada: number;
      };
      razones: string[];
    };
    pareja: {
      madreId: number;
      padreId: number;
      compatibilityScore: number;
      predicciones: {
        litadaEsperada: number;
        tasaExitoEstimada: number;
      };
      razones: string[];
    };
  }[];
  criterios: {
    geneticos: string[];
    rendimiento: string[];
    salud: string[];
  };
  resumen: {
    totalRecomendaciones: number;
    mejorCompatibilidad: number;
    criteriosEvaluados: number;
  };
}

const RecomendacionesReproductivas: React.FC<RecomendacionesReproductivasProps> = ({
  open,
  onClose,
  madreId,
  padreId
}) => {
  const [loading, setLoading] = useState(false);
  const [recomendaciones, setRecomendaciones] = useState<RecomendacionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tipoRecomendacion, setTipoRecomendacion] = useState<'madre' | 'padre' | 'pareja'>('pareja');

  useEffect(() => {
    if (open) {
      obtenerRecomendaciones();
    }
  }, [open, madreId, padreId]);

  const obtenerRecomendaciones = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (madreId) params.madreId = madreId;
      if (padreId) params.padreId = padreId;

      const response = await api.get('/reproduccion/prenez/recomendaciones', { params });

      if ((response.data as any).success) {
        setRecomendaciones((response.data as any).data);
      } else {
        setError((response.data as any).message || 'Error al obtener recomendaciones');
      }
    } catch (error: any) {
      console.error('Error al obtener recomendaciones:', error);
      setError(error.response?.data?.message || error.message || 'Error al obtener recomendaciones');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#4caf50';
    if (score >= 70) return '#8bc34a';
    if (score >= 55) return '#ff9800';
    return '#f44336';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Excelente';
    if (score >= 70) return 'Buena';
    if (score >= 55) return 'Regular';
    return 'Baja';
  };

  const renderMadreRecomendaciones = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <Female sx={{ mr: 1, verticalAlign: 'middle', color: '#e91e63' }} />
        Madres Recomendadas
      </Typography>
      
      <Grid container spacing={2}>
        {recomendaciones?.recomendaciones
          .filter(r => r.madre)
          .slice(0, 6)
          .map((rec, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: '#e91e63', width: 32, height: 32 }}>
                        <Female fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">ID: {rec.madre.id}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {rec.madre.raza} • {rec.madre.galpon}-{rec.madre.jaula}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip 
                      label={getScoreLabel(rec.madre.compatibilityScore)}
                      sx={{ 
                        backgroundColor: getScoreColor(rec.madre.compatibilityScore),
                        color: 'white'
                      }}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Compatibilidad: {rec.madre.compatibilityScore}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={rec.madre.compatibilityScore} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: '#f0f0f0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getScoreColor(rec.madre.compatibilityScore)
                        }
                      }}
                    />
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" align="center">
                        <strong>{rec.madre.predicciones.litadaEsperada}</strong>
                        <br />
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>Crías esperadas</span>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" align="center">
                        <strong>{rec.madre.predicciones.tasaExitoEstimada}%</strong>
                        <br />
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>Tasa de éxito</span>
                      </Typography>
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle2" gutterBottom>
                    Razones:
                  </Typography>
                  <List dense>
                    {rec.madre.razones.slice(0, 3).map((razon, idx) => (
                      <ListItem key={idx} sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 20 }}>
                          <CheckCircle fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={razon}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>
    </Box>
  );

  const renderPadreRecomendaciones = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <Male sx={{ mr: 1, verticalAlign: 'middle', color: '#2196f3' }} />
        Padres Recomendados
      </Typography>
      
      <Grid container spacing={2}>
        {recomendaciones?.recomendaciones
          .filter(r => r.padre)
          .slice(0, 6)
          .map((rec, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: '#2196f3', width: 32, height: 32 }}>
                        <Male fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">ID: {rec.padre.id}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {rec.padre.raza} • {rec.padre.galpon}-{rec.padre.jaula}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip 
                      label={getScoreLabel(rec.padre.compatibilityScore)}
                      sx={{ 
                        backgroundColor: getScoreColor(rec.padre.compatibilityScore),
                        color: 'white'
                      }}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Compatibilidad: {rec.padre.compatibilityScore}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={rec.padre.compatibilityScore} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: '#f0f0f0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getScoreColor(rec.padre.compatibilityScore)
                        }
                      }}
                    />
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" align="center">
                        <strong>{rec.padre.predicciones.litadaEsperada}</strong>
                        <br />
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>Crías esperadas</span>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" align="center">
                        <strong>{rec.padre.predicciones.tasaExitoEstimada}%</strong>
                        <br />
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>Tasa de éxito</span>
                      </Typography>
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle2" gutterBottom>
                    Razones:
                  </Typography>
                  <List dense>
                    {rec.padre.razones.slice(0, 3).map((razon, idx) => (
                      <ListItem key={idx} sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 20 }}>
                          <CheckCircle fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={razon}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>
    </Box>
  );

  const renderParejaRecomendaciones = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <Favorite sx={{ mr: 1, verticalAlign: 'middle', color: '#e91e63' }} />
        Parejas Recomendadas
      </Typography>
      
      <Grid container spacing={2}>
        {recomendaciones?.recomendaciones
          .filter(r => r.pareja)
          .slice(0, 6)
          .map((rec, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Pareja #{index + 1}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Avatar sx={{ bgcolor: '#e91e63', width: 24, height: 24 }}>
                            <Female fontSize="small" />
                          </Avatar>
                          <Typography variant="body2">ID: {rec.pareja.madreId}</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">+</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Avatar sx={{ bgcolor: '#2196f3', width: 24, height: 24 }}>
                            <Male fontSize="small" />
                          </Avatar>
                          <Typography variant="body2">ID: {rec.pareja.padreId}</Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Chip 
                      label={getScoreLabel(rec.pareja.compatibilityScore)}
                      sx={{ 
                        backgroundColor: getScoreColor(rec.pareja.compatibilityScore),
                        color: 'white'
                      }}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Compatibilidad: {rec.pareja.compatibilityScore}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={rec.pareja.compatibilityScore} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: '#f0f0f0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getScoreColor(rec.pareja.compatibilityScore)
                        }
                      }}
                    />
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" align="center">
                        <strong>{rec.pareja.predicciones.litadaEsperada}</strong>
                        <br />
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>Crías esperadas</span>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" align="center">
                        <strong>{rec.pareja.predicciones.tasaExitoEstimada}%</strong>
                        <br />
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>Tasa de éxito</span>
                      </Typography>
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle2" gutterBottom>
                    Razones:
                  </Typography>
                  <List dense>
                    {rec.pareja.razones.slice(0, 3).map((razon, idx) => (
                      <ListItem key={idx} sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 20 }}>
                          <CheckCircle fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={razon}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            <Lightbulb sx={{ mr: 1, verticalAlign: 'middle', color: '#ff9800' }} />
            Recomendaciones Reproductivas
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
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : recomendaciones ? (
          <Box>
            {/* Resumen */}
            {recomendaciones.resumen && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle2">
                  📊 Resumen: {recomendaciones.resumen.totalRecomendaciones} recomendaciones encontradas
                  • Mejor compatibilidad: {recomendaciones.resumen.mejorCompatibilidad}%
                  • Criterios evaluados: {recomendaciones.resumen.criteriosEvaluados}
                </Typography>
              </Alert>
            )}

            {/* Tabs de navegación */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Button
                variant={tipoRecomendacion === 'pareja' ? 'contained' : 'text'}
                onClick={() => setTipoRecomendacion('pareja')}
                sx={{ mr: 1 }}
              >
                Parejas
              </Button>
              <Button
                variant={tipoRecomendacion === 'madre' ? 'contained' : 'text'}
                onClick={() => setTipoRecomendacion('madre')}
                sx={{ mr: 1 }}
              >
                Madres
              </Button>
              <Button
                variant={tipoRecomendacion === 'padre' ? 'contained' : 'text'}
                onClick={() => setTipoRecomendacion('padre')}
              >
                Padres
              </Button>
            </Box>

            {/* Contenido de tabs */}
            {tipoRecomendacion === 'pareja' && renderParejaRecomendaciones()}
            {tipoRecomendacion === 'madre' && renderMadreRecomendaciones()}
            {tipoRecomendacion === 'padre' && renderPadreRecomendaciones()}

            {/* Criterios de evaluación */}
            {recomendaciones.criterios && (
              <Box sx={{ mt: 4 }}>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>
                  <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Criterios de Evaluación
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Criterios Genéticos:
                    </Typography>
                    <List dense>
                      {recomendaciones.criterios.geneticos.map((criterio, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 20 }}>
                            <Star fontSize="small" color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={criterio}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="success.main" gutterBottom>
                      Criterios de Rendimiento:
                    </Typography>
                    <List dense>
                      {recomendaciones.criterios.rendimiento.map((criterio, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 20 }}>
                            <TrendingUp fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={criterio}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="warning.main" gutterBottom>
                      Criterios de Salud:
                    </Typography>
                    <List dense>
                      {recomendaciones.criterios.salud.map((criterio, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 20 }}>
                            <Warning fontSize="small" color="warning" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={criterio}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            No hay recomendaciones disponibles en este momento.
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecomendacionesReproductivas;