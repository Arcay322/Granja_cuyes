import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  TextField, Grid, Card, CardContent, IconButton, Chip, Alert, Divider,
  FormControl, InputLabel, Select, MenuItem, InputAdornment
} from '../utils/mui';
import {
  Add, Delete, Pets, Home, GridOn, Male, Female, Scale, CalendarToday,
  Preview, Save, Close
} from '@mui/icons-material';
import api from '../services/api';
import toastService from '../services/toastService';

interface GrupoCuyes {
  id: string;
  sexo: 'M' | 'H';
  cantidad: number | '';
  edadDias: number | '';
  pesoPromedio: number | '';
  variacionEdad: number | '';
  variacionPeso: number | '';
}

interface RegistroJaulaFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultGalpon?: string;
  defaultJaula?: string;
  mode?: 'create-with-cuyes' | 'create-empty-jaula'; // Nuevo modo
}

const RegistroJaulaForm: React.FC<RegistroJaulaFormProps> = ({ 
  open, 
  onClose, 
  onSuccess, 
  defaultGalpon = '', 
  defaultJaula = '',
  mode = 'create-with-cuyes' // Por defecto crear con cuyes
}) => {
  const [galpon, setGalpon] = useState(defaultGalpon);
  const [jaula, setJaula] = useState(defaultJaula);
  const [raza, setRaza] = useState('');
  const [grupos, setGrupos] = useState<GrupoCuyes[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  // Actualizar valores cuando cambien los props por defecto
  React.useEffect(() => {
    if (open) {
      setGalpon(defaultGalpon);
      setJaula(defaultJaula);
    }
  }, [open, defaultGalpon, defaultJaula]);

  const agregarGrupo = () => {
    const nuevoGrupo: GrupoCuyes = {
      id: Date.now().toString(),
      sexo: 'M',
      cantidad: 1,
      edadDias: 30,
      pesoPromedio: 500,
      variacionEdad: 3,
      variacionPeso: 50
    };
    setGrupos([...grupos, nuevoGrupo]);
  };

  const eliminarGrupo = (id: string) => {
    setGrupos(grupos.filter(g => g.id !== id));
  };

  const actualizarGrupo = (id: string, campo: keyof GrupoCuyes, valor: any) => {
    setGrupos(grupos.map(g => 
      g.id === id ? { ...g, [campo]: valor } : g
    ));
  };

  const calcularTotalCuyes = () => {
    return grupos.reduce((total, grupo) => total + (typeof grupo.cantidad === 'number' ? grupo.cantidad : 0), 0);
  };

  const validarFormulario = () => {
    if (!galpon.trim()) return 'El galpón es obligatorio';
    if (!jaula.trim()) return 'La jaula es obligatoria';
    
    // Si es modo de crear jaula vacía, no necesitamos validar raza ni grupos
    if (mode === 'create-empty-jaula') {
      return null;
    }
    
    // Para modo de crear con cuyes, validar raza y grupos
    if (!raza.trim()) return 'La raza es obligatoria';
    if (grupos.length === 0) return 'Debe agregar al menos un grupo';
    
    for (const grupo of grupos) {
      if (!grupo.cantidad || grupo.cantidad <= 0) return 'La cantidad debe ser mayor a 0';
      if (grupo.edadDias === '' || grupo.edadDias < 0) return 'La edad no puede estar vacía o ser negativa';
      if (!grupo.pesoPromedio || grupo.pesoPromedio <= 0) return 'El peso debe ser mayor a 0';
      if (grupo.variacionEdad === '') grupo.variacionEdad = 0; // Permitir 0 por defecto
      if (grupo.variacionPeso === '') grupo.variacionPeso = 0; // Permitir 0 por defecto
    }
    
    return null;
  };

  const handleSubmit = async () => {
    const error = validarFormulario();
    if (error) {
      toastService.error('Error de Validación', error);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'create-empty-jaula') {
        // Para jaula vacía, usar el endpoint de galpones
        await api.post('/galpones/jaula', {
          galpon,
          jaula
        });
        
        toastService.success(
          'Jaula Creada',
          `Jaula "${jaula}" creada exitosamente en el galpón ${galpon}`
        );
      } else {
        // Para jaula con cuyes, usar el endpoint existente
        await api.post('/cuyes/jaula', {
          galpon,
          jaula,
          raza,
          grupos: grupos.map(g => ({
            sexo: g.sexo,
            cantidad: typeof g.cantidad === 'number' ? g.cantidad : parseInt(String(g.cantidad)) || 1,
            edadDias: typeof g.edadDias === 'number' ? g.edadDias : parseInt(String(g.edadDias)) || 30,
            pesoPromedio: typeof g.pesoPromedio === 'number' ? g.pesoPromedio : parseInt(String(g.pesoPromedio)) || 500,
            variacionEdad: typeof g.variacionEdad === 'number' ? g.variacionEdad : parseInt(String(g.variacionEdad)) || 0,
            variacionPeso: typeof g.variacionPeso === 'number' ? g.variacionPeso : parseInt(String(g.variacionPeso)) || 0
          }))
        });

        toastService.success(
          'Jaula Registrada',
          `${calcularTotalCuyes()} cuyes creados exitosamente en ${galpon}-${jaula}`
        );
      }
      
      handleClose();
      onSuccess();
    } catch (err: any) {
      console.error('Error al registrar jaula:', err);
      toastService.error(
        'Error al Registrar',
        err.response?.data?.message || 'No se pudo registrar la jaula'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGalpon('');
    setJaula('');
    setRaza('');
    setGrupos([]);
    setPreview(false);
    onClose();
  };

  const getEdadEnMeses = (dias: number | '') => {
    if (dias === '' || !dias) return 0;
    return Math.floor(dias / 30);
  };

  const getEtapaVida = (dias: number | '', sexo: 'M' | 'H') => {
    if (dias === '' || !dias) return 'Sin definir';
    const meses = getEdadEnMeses(dias);
    if (meses < 1) return 'Cría';
    if (meses < 2) return 'Juvenil';
    if (sexo === 'M') return 'Engorde';
    return meses >= 3 ? 'Reproductora' : 'Engorde';
  };

  const getProposito = (dias: number | '', sexo: 'M' | 'H') => {
    if (dias === '' || !dias) return 'Sin definir';
    const meses = getEdadEnMeses(dias);
    if (meses < 1) return 'Cría';
    if (meses < 2) return 'Juvenil';
    if (sexo === 'M') return 'Engorde';
    return meses >= 3 ? 'Reproducción' : 'Engorde';
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      fullScreen={window.innerWidth < 768} // Pantalla completa en móvil
      PaperProps={{
        sx: { 
          borderRadius: { xs: 0, sm: 3 }, // Sin bordes redondeados en móvil
          maxHeight: { xs: '100vh', sm: '90vh' }, // Altura completa en móvil
          margin: { xs: 0, sm: 2 } // Sin márgenes en móvil
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Home color="primary" />
          {preview 
            ? 'Vista Previa - Registro por Jaula' 
            : mode === 'create-empty-jaula' 
              ? 'Crear Nueva Jaula'
              : 'Registro Masivo por Jaula'
          }
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {mode === 'create-empty-jaula' 
            ? 'Crea una nueva jaula vacía en el galpón seleccionado'
            : 'Registra múltiples cuyes organizados por grupos dentro de una jaula'
          }
        </Typography>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ pt: 3 }}>
        {!preview ? (
          <>
            {/* Información de la Jaula */}
            <Card sx={{ mb: 3, borderRadius: 2, bgcolor: 'grey.50' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GridOn color="primary" />
                  Ubicación de la Jaula
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Galpón"
                      value={galpon}
                      onChange={(e) => setGalpon(e.target.value)}
                      fullWidth
                      required
                      placeholder="Ej: A, B, Galpón 1"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Home fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Jaula"
                      value={jaula}
                      onChange={(e) => setJaula(e.target.value)}
                      fullWidth
                      required
                      placeholder="Ej: J-001, 15"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <GridOn fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  {mode !== 'create-empty-jaula' && (
                    <Grid item xs={12}>
                      <FormControl fullWidth required sx={{ minWidth: 300 }}>
                        <InputLabel>Raza del Cuy</InputLabel>
                        <Select
                          value={raza}
                          label="Raza del Cuy"
                          onChange={(e) => setRaza(e.target.value as string)}
                          sx={{ 
                            '& .MuiSelect-select': { 
                              minHeight: '24px',
                              display: 'flex',
                              alignItems: 'center'
                            }
                          }}
                        >
                          <MenuItem value="Peru">Cuy Perú - Línea mejorada nacional</MenuItem>
                          <MenuItem value="Andina">Cuy Andina - Línea mejorada pesada</MenuItem>
                          <MenuItem value="Inti">Cuy Inti - Línea prolífica INIA</MenuItem>
                          <MenuItem value="Criolla">Cuy Criollo - Raza local tradicional</MenuItem>
                          <MenuItem value="Abisinia">Cuy Abisinio - Pelo largo ornamental</MenuItem>
                          <MenuItem value="Ingles">Cuy Inglés - Pelo corto liso</MenuItem>
                          <MenuItem value="Americana">Cuy Americana - Línea cárnica</MenuItem>
                          <MenuItem value="Mixta">Mezcla/Cruza - Características mixtas</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Grupos de Cuyes - Solo para modo con cuyes */}
            {mode !== 'create-empty-jaula' && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Pets color="primary" />
                    Grupos de Cuyes ({calcularTotalCuyes()} total)
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={agregarGrupo}
                    size="small"
                  >
                    Agregar Grupo
                  </Button>
                </Box>

                {grupos.length === 0 && (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Agrega grupos de cuyes con características similares. 
                    Ejemplo: "5 machos de 45 días" o "2 hembras reproductoras de 120 días"
                  </Alert>
                )}

                {grupos.map((grupo, index) => (
                  <Card key={grupo.id} sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Grupo {index + 1}
                          <Chip 
                            label={`${getEtapaVida(grupo.edadDias, grupo.sexo)} → ${getProposito(grupo.edadDias, grupo.sexo)}`}
                            size="small" 
                            color="primary"
                            variant="outlined"
                            sx={{ ml: 2 }}
                          />
                        </Typography>
                        <IconButton 
                          onClick={() => eliminarGrupo(grupo.id)}
                          color="error"
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Sexo</InputLabel>
                          <Select
                            value={grupo.sexo}
                            label="Sexo"
                            onChange={(e) => actualizarGrupo(grupo.id, 'sexo', e.target.value)}
                          >
                            <MenuItem value="M">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Male fontSize="small" color="info" />
                                Machos
                              </Box>
                            </MenuItem>
                            <MenuItem value="H">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Female fontSize="small" color="secondary" />
                                Hembras
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6} sm={3} md={2}>
                        <TextField
                          label="Cantidad"
                          type="number"
                          value={grupo.cantidad || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            actualizarGrupo(grupo.id, 'cantidad', value === '' ? '' : parseInt(value) || '');
                          }}
                          fullWidth
                          size="small"
                          inputProps={{ min: 1, max: 50 }}
                          placeholder="Ej: 5"
                        />
                      </Grid>
                      <Grid item xs={6} sm={3} md={2}>
                        <TextField
                          label="Edad (días)"
                          type="number"
                          value={grupo.edadDias || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            actualizarGrupo(grupo.id, 'edadDias', value === '' ? '' : parseInt(value) || '');
                          }}
                          fullWidth
                          size="small"
                          inputProps={{ min: 0, max: 365 }}
                          helperText={grupo.edadDias ? `${getEdadEnMeses(grupo.edadDias)} meses` : 'Días de vida'}
                          placeholder="Ej: 45"
                        />
                      </Grid>
                      <Grid item xs={6} sm={3} md={2}>
                        <TextField
                          label="Peso (g)"
                          type="number"
                          value={grupo.pesoPromedio || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            actualizarGrupo(grupo.id, 'pesoPromedio', value === '' ? '' : parseInt(value) || '');
                          }}
                          fullWidth
                          size="small"
                          inputProps={{ min: 50, max: 2000 }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">g</InputAdornment>,
                          }}
                          placeholder="Ej: 500"
                        />
                      </Grid>
                      <Grid item xs={6} sm={3} md={2}>
                        <TextField
                          label="±Edad (días)"
                          type="number"
                          value={grupo.variacionEdad || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            actualizarGrupo(grupo.id, 'variacionEdad', value === '' ? '' : parseInt(value) || '');
                          }}
                          fullWidth
                          size="small"
                          inputProps={{ min: 0, max: 10 }}
                          helperText="Variación"
                          placeholder="3"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={2}>
                        <TextField
                          label="±Peso (g)"
                          type="number"
                          value={grupo.variacionPeso || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            actualizarGrupo(grupo.id, 'variacionPeso', value === '' ? '' : parseInt(value) || '');
                          }}
                          fullWidth
                          size="small"
                          inputProps={{ min: 0, max: 200 }}
                          helperText="Variación"
                          placeholder="50"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
              </Box>
            )}
          </>
        ) : (
          /* Vista Previa */
          <Box>
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                📍 <strong>Ubicación:</strong> {galpon} - {jaula} | <strong>Raza:</strong> {raza}
              </Typography>
              <Typography variant="body2">
                Se crearán <strong>{calcularTotalCuyes()} cuyes</strong> distribuidos en {grupos.length} grupos
              </Typography>
            </Alert>

            {grupos.map((grupo, index) => (
              <Card key={grupo.id} sx={{ mb: 2, borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Grupo {index + 1}: {grupo.cantidad} {grupo.sexo === 'M' ? 'Machos' : 'Hembras'}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Edad:</strong> {grupo.edadDias} ± {grupo.variacionEdad} días ({getEdadEnMeses(grupo.edadDias)} meses)
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Peso:</strong> {grupo.pesoPromedio} ± {grupo.variacionPeso} gramos
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Etapa:</strong> {getEtapaVida(grupo.edadDias, grupo.sexo)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Propósito:</strong> {getProposito(grupo.edadDias, grupo.sexo)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ 
        px: { xs: 2, sm: 3 }, 
        pb: { xs: 1, sm: 2 },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 }
      }}>
        <Button 
          onClick={handleClose} 
          variant="outlined" 
          startIcon={<Close />}
          fullWidth={window.innerWidth < 600}
          sx={{ order: { xs: 3, sm: 1 } }}
        >
          Cancelar
        </Button>
        
        {!preview ? (
          <Button 
            onClick={() => setPreview(true)}
            variant="outlined"
            startIcon={<Preview />}
            disabled={validarFormulario() !== null}
            fullWidth={window.innerWidth < 600}
            sx={{ order: { xs: 2, sm: 2 } }}
          >
            Vista Previa
          </Button>
        ) : (
          <Button 
            onClick={() => setPreview(false)}
            variant="outlined"
            fullWidth={window.innerWidth < 600}
            sx={{ order: { xs: 2, sm: 2 } }}
          >
            Editar
          </Button>
        )}
        
        <Button 
          onClick={handleSubmit}
          variant="contained"
          startIcon={<Save />}
          disabled={loading || validarFormulario() !== null}
          fullWidth={window.innerWidth < 600}
          sx={{ order: { xs: 1, sm: 3 } }}
        >
          {loading 
            ? (mode === 'create-empty-jaula' ? 'Creando...' : 'Creando...') 
            : (mode === 'create-empty-jaula' ? 'Crear Jaula' : `Crear ${calcularTotalCuyes()} Cuyes`)
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RegistroJaulaForm;
