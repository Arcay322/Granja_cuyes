import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Avatar, Chip, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, MenuItem, Alert, CircularProgress, useTheme, alpha, Badge, 
  LinearProgress, Paper, Divider, IconButton, Tooltip
} from '../utils/mui';
import {
  Home, Add, Edit, Delete, Analytics, Warning, Pets, Groups, TrendingUp, 
  LocationOn, Inventory, Settings, Close
} from '@mui/icons-material';
import api from '../services/api';
import toastService from '../services/toastService';
import { useDeleteConfirmation } from '../hooks/useDeleteConfirmation';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import { isSuccessfulApiResponse } from '../utils/typeGuards';

interface Galpon {
  id: number;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  capacidadMaxima: number;
  totalJaulas: number;
  totalCuyes: number;
  porcentajeOcupacion: number;
  estado: string;
  alertas: {
    sobrepoblacion: boolean;
    sinCuyes: boolean;
    cuyesEnfermos: number;
  };
  jaulas?: Jaula[];
}

interface Jaula {
  id: number;
  nombre: string;
  galponId: number;
  galponNombre: string;
  descripcion?: string;
  capacidadMaxima: number;
  tipo: string;
  estado: string;
}

interface GalponForm {
  nombre: string;
  descripcion: string;
  ubicacion: string;
  capacidadMaxima: number;
  estado: string;
}

interface JaulaForm {
  nombre: string;
  galponId: number;
  galponNombre: string;
  descripcion: string;
  capacidadMaxima: number;
  tipo: string;
  estado: string;
}

const initialGalponForm: GalponForm = {
  nombre: '',
  descripcion: '',
  ubicacion: '',
  capacidadMaxima: 50,
  estado: 'Activo'
};

const initialJaulaForm: JaulaForm = {
  nombre: '',
  galponId: 0,
  galponNombre: '',
  descripcion: '',
  capacidadMaxima: 10,
  tipo: 'Estándar',
  estado: 'Activo'
};

const estadoOptions = ['Activo', 'Inactivo', 'Mantenimiento'];
const tipoJaulaOptions = ['Estándar', 'Cría', 'Engorde', 'Reproducción', 'Cuarentena'];

const GalponesManager: React.FC = () => {
  const theme = useTheme();
  const [galpones, setGalpones] = useState<Galpon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGalpon, setSelectedGalpon] = useState<Galpon | null>(null);
  
  // Estados para diálogos
  const [openGalponDialog, setOpenGalponDialog] = useState(false);
  const [openJaulaDialog, setOpenJaulaDialog] = useState(false);
  const [openEstadisticasDialog, setOpenEstadisticasDialog] = useState(false);
  
  // Estados para formularios
  const [galponForm, setGalponForm] = useState<GalponForm>(initialGalponForm);
  const [jaulaForm, setJaulaForm] = useState<JaulaForm>(initialJaulaForm);
  const [editId, setEditId] = useState<number | null>(null);
  
  // Estados para errores de formulario
  const [galponErrors, setGalponErrors] = useState({
    nombre: '',
    capacidadMaxima: ''
  });
  const [jaulaErrors, setJaulaErrors] = useState({
    nombre: '',
    capacidadMaxima: ''
  });

  // Configuración para diálogo de confirmación de eliminación
  const deleteConfirmation = useDeleteConfirmation({
    onDelete: async (id: number) => {
      try {
        await api.delete(`/galpones/${id}`);
        fetchGalpones();
        toastService.success('Galpón eliminado', 'El galpón ha sido eliminado exitosamente');
      } catch (error: any) {
        const errorMsg = error.response?.data?.error || 'No se pudo eliminar el galpón';
        toastService.error('Error al eliminar', errorMsg);
      }
    },
    itemName: 'galpón',
    successMessage: 'Galpón eliminado exitosamente'
  });

  const jaulaDeleteConfirmation = useDeleteConfirmation({
    onDelete: async (id: number) => {
      try {
        await api.delete(`/galpones/jaulas/${id}`);
        if (selectedGalpon) {
          fetchGalponDetails(selectedGalpon.id);
        }
        fetchGalpones();
        toastService.success('Jaula eliminada', 'La jaula ha sido eliminada exitosamente');
      } catch (error: any) {
        const errorMsg = error.response?.data?.error || 'No se pudo eliminar la jaula';
        toastService.error('Error al eliminar', errorMsg);
      }
    },
    itemName: 'jaula',
    successMessage: 'Jaula eliminada exitosamente'
  });

  useEffect(() => {
    fetchGalpones();
  }, []);

  const fetchGalpones = async () => {
    try {
      setLoading(true);
      const response = await api.get('/galpones/resumen');
      if (isSuccessfulApiResponse<any[]>(response.data)) {
        setGalpones(response.data.data);
      }
    } catch (error) {
      console.error('Error al obtener galpones:', error);
      toastService.error('Error', 'No se pudieron cargar los galpones');
    } finally {
      setLoading(false);
    }
  };

  const fetchGalponDetails = async (id: number) => {
    try {
      const response = await api.get(`/galpones/${id}`);
      if (isSuccessfulApiResponse<any>(response.data)) {
        setSelectedGalpon(response.data.data);
      }
    } catch (error) {
      console.error('Error al obtener detalles del galpón:', error);
      toastService.error('Error', 'No se pudieron cargar los detalles del galpón');
    }
  };

  const handleOpenGalponDialog = (galpon?: Galpon) => {
    if (galpon) {
      setGalponForm({
        nombre: galpon.nombre,
        descripcion: galpon.descripcion || '',
        ubicacion: galpon.ubicacion || '',
        capacidadMaxima: galpon.capacidadMaxima,
        estado: galpon.estado
      });
      setEditId(galpon.id);
    } else {
      setGalponForm(initialGalponForm);
      setEditId(null);
    }
    setGalponErrors({ nombre: '', capacidadMaxima: '' });
    setOpenGalponDialog(true);
  };

  const handleOpenJaulaDialog = (galpon: Galpon, jaula?: Jaula) => {
    setSelectedGalpon(galpon);
    if (jaula) {
      setJaulaForm({
        nombre: jaula.nombre,
        galponId: jaula.galponId,
        galponNombre: jaula.galponNombre,
        descripcion: jaula.descripcion || '',
        capacidadMaxima: jaula.capacidadMaxima,
        tipo: jaula.tipo,
        estado: jaula.estado
      });
      setEditId(jaula.id);
    } else {
      setJaulaForm({
        ...initialJaulaForm,
        galponId: galpon.id,
        galponNombre: galpon.nombre
      });
      setEditId(null);
    }
    setJaulaErrors({ nombre: '', capacidadMaxima: '' });
    setOpenJaulaDialog(true);
  };

  const handleOpenEstadisticasDialog = async (galpon: Galpon) => {
    setSelectedGalpon(galpon);
    try {
      const response = await api.get(`/galpones/${galpon.id}`);
      if (isSuccessfulApiResponse<any>(response.data)) {
        setSelectedGalpon(response.data.data);
      }
      setOpenEstadisticasDialog(true);
    } catch (error) {
      console.error('Error al obtener detalles del galpón:', error);
      toastService.error('Error', 'No se pudieron cargar las estadísticas del galpón');
    }
  };

  const handleGalponChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name) {
      setGalponForm(prev => ({ ...prev, [name]: value }));
      if (galponErrors[name as keyof typeof galponErrors]) {
        setGalponErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    }
  };

  const handleGalponSelectChange = (e: any) => {
    const { name, value } = e.target;
    if (name) {
      setGalponForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleJaulaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name) {
      setJaulaForm(prev => ({ ...prev, [name]: value }));
      if (jaulaErrors[name as keyof typeof jaulaErrors]) {
        setJaulaErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    }
  };

  const handleJaulaSelectChange = (e: any) => {
    const { name, value } = e.target;
    if (name) {
      setJaulaForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateGalponForm = () => {
    const newErrors = {
      nombre: '',
      capacidadMaxima: ''
    };
    if (!galponForm.nombre) {
      newErrors.nombre = 'El nombre es obligatorio';
    } else if (galponForm.nombre.length > 10) {
      newErrors.nombre = 'El nombre no puede tener más de 10 caracteres';
    }
    if (!galponForm.capacidadMaxima || galponForm.capacidadMaxima <= 0) {
      newErrors.capacidadMaxima = 'La capacidad debe ser mayor a 0';
    }
    setGalponErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const validateJaulaForm = () => {
    const newErrors = {
      nombre: '',
      capacidadMaxima: ''
    };
    if (!jaulaForm.nombre) {
      newErrors.nombre = 'El nombre es obligatorio';
    } else if (jaulaForm.nombre.length > 10) {
      newErrors.nombre = 'El nombre no puede tener más de 10 caracteres';
    }
    if (!jaulaForm.capacidadMaxima || jaulaForm.capacidadMaxima <= 0) {
      newErrors.capacidadMaxima = 'La capacidad debe ser mayor a 0';
    }
    setJaulaErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmitGalpon = async () => {
    if (!validateGalponForm()) return;
    try {
      setLoading(true);
      if (editId) {
        await api.put(`/galpones/${editId}`, galponForm);
        toastService.success('Galpón actualizado', 'El galpón ha sido actualizado exitosamente');
      } else {
        await api.post('/galpones', galponForm);
        toastService.success('Galpón creado', 'El galpón ha sido creado exitosamente');
      }
      setOpenGalponDialog(false);
      fetchGalpones();
    } catch (error: any) {
      console.error('Error al guardar galpón:', error);
      const errorMsg = error.response?.data?.error || 'No se pudo guardar el galpón';
      toastService.error('Error al guardar', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitJaula = async () => {
    if (!validateJaulaForm()) return;
    try {
      setLoading(true);
      if (editId) {
        await api.put(`/galpones/jaulas/${editId}`, jaulaForm);
        toastService.success('Jaula actualizada', 'La jaula ha sido actualizada exitosamente');
      } else {
        await api.post('/galpones/jaulas', jaulaForm);
        toastService.success('Jaula creada', 'La jaula ha sido creada exitosamente');
      }
      setOpenJaulaDialog(false);
      fetchGalpones();
      if (selectedGalpon) {
        fetchGalponDetails(selectedGalpon.id);
      }
    } catch (error: unknown) {
      console.error('Error al guardar jaula:', error);
      const errorMsg = (error as any).response?.data?.error || 'No se pudo guardar la jaula';
      toastService.error('Error al guardar', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getOcupacionColor = (porcentaje: number) => {
    if (porcentaje >= 90) return 'error';
    if (porcentaje >= 70) return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
          <Home sx={{ mr: 1, verticalAlign: 'middle' }} />
          Sistema de Galpones
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenGalponDialog()}
          sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
        >
          Nuevo Galpón
        </Button>
      </Box>

      {/* Resumen general */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
        <Typography variant="h6" gutterBottom>
          Resumen General
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main, mx: 'auto', mb: 1 }}>
                <Home />
              </Avatar>
              <Typography variant="h4">{galpones.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Galpones
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: theme.palette.info.main, mx: 'auto', mb: 1 }}>
                <Groups />
              </Avatar>
              <Typography variant="h4">
                {galpones.reduce((sum, g) => sum + g.totalCuyes, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Cuyes
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: theme.palette.success.main, mx: 'auto', mb: 1 }}>
                <TrendingUp />
              </Avatar>
              <Typography variant="h4">
                {galpones.reduce((sum, g) => sum + g.totalJaulas, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Jaulas
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: theme.palette.warning.main, mx: 'auto', mb: 1 }}>
                <Warning />
              </Avatar>
              <Typography variant="h4">
                {galpones.filter(g => g.alertas.sobrepoblacion || g.alertas.cuyesEnfermos > 0).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Con Alertas
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Lista de galpones */}
      <Grid container spacing={3}>
        {galpones.map((galpon) => (
          <Grid item xs={12} sm={6} md={4} key={galpon.id}>
            <Card sx={{ 
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                    Galpón {galpon.nombre}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Badge 
                      badgeContent={
                        galpon.alertas.sobrepoblacion || galpon.alertas.cuyesEnfermos > 0 ? '!' : 0
                      } 
                      color="error"
                    >
                      <Chip 
                        label={galpon.estado} 
                        color={galpon.estado === 'Activo' ? 'success' : 'default'}
                        size="small"
                      />
                    </Badge>
                    <Tooltip title="Editar galpón">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenGalponDialog(galpon)}
                        sx={{ color: theme.palette.primary.main }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar galpón">
                      <IconButton 
                        size="small" 
                        onClick={() => deleteConfirmation.handleDeleteClick(galpon.id)}
                        sx={{ color: theme.palette.error.main }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {galpon.descripcion || 'Sin descripción'}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  📍 {galpon.ubicacion || 'Ubicación no especificada'}
                </Typography>

                <Box sx={{ my: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      Ocupación: {galpon.totalCuyes}/{galpon.capacidadMaxima}
                    </Typography>
                    <Typography variant="body2">
                      {galpon.porcentajeOcupacion.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(galpon.porcentajeOcupacion, 100)}
                    color={getOcupacionColor(galpon.porcentajeOcupacion)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 1 }}>
                      <Typography variant="h6">{galpon.totalJaulas}</Typography>
                      <Typography variant="caption">Jaulas</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 1 }}>
                      <Typography variant="h6">{galpon.totalCuyes}</Typography>
                      <Typography variant="caption">Cuyes</Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Alertas */}
                {(galpon.alertas.sobrepoblacion || galpon.alertas.cuyesEnfermos > 0 || galpon.alertas.sinCuyes) && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {galpon.alertas.sobrepoblacion && <div>⚠️ Sobrepoblación detectada</div>}
                    {galpon.alertas.cuyesEnfermos > 0 && <div>🏥 {galpon.alertas.cuyesEnfermos} cuyes enfermos</div>}
                    {galpon.alertas.sinCuyes && <div>📭 Galpón vacío</div>}
                  </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                  <Button 
                    size="small" 
                    startIcon={<Add />}
                    onClick={() => handleOpenJaulaDialog(galpon)}
                  >
                    Añadir Jaula
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<Analytics />}
                    onClick={() => handleOpenEstadisticasDialog(galpon)}
                  >
                    Estadísticas
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {galpones.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay galpones registrados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Crea tu primer galpón para comenzar a organizar tus cuyes
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenGalponDialog()}
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
          >
            Crear Primer Galpón
          </Button>
        </Box>
      )}

      {/* Diálogo para crear/editar galpón */}
      <Dialog open={openGalponDialog} onClose={() => setOpenGalponDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Home color="primary" />
              <Typography variant="h6">
                {editId ? 'Editar Galpón' : 'Nuevo Galpón'}
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenGalponDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre"
                name="nombre"
                value={galponForm.nombre}
                onChange={handleGalponChange}
                fullWidth
                required
                error={!!galponErrors.nombre}
                helperText={galponErrors.nombre || 'Máximo 10 caracteres'}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Capacidad Máxima"
                name="capacidadMaxima"
                type="number"
                value={galponForm.capacidadMaxima}
                onChange={handleGalponChange}
                fullWidth
                required
                error={!!galponErrors.capacidadMaxima}
                helperText={galponErrors.capacidadMaxima}
                size="small"
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descripción"
                name="descripcion"
                value={galponForm.descripcion}
                onChange={handleGalponChange}
                fullWidth
                multiline
                rows={2}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Ubicación"
                name="ubicacion"
                value={galponForm.ubicacion}
                onChange={handleGalponChange}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  name="estado"
                  value={galponForm.estado}
                  onChange={handleGalponSelectChange}
                  label="Estado"
                >
                  {estadoOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenGalponDialog(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitGalpon}
            disabled={loading}
          >
            {loading ? 'Guardando...' : (editId ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para crear/editar jaula */}
      <Dialog open={openJaulaDialog} onClose={() => setOpenJaulaDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Inventory color="primary" />
              <Typography variant="h6">
                {editId ? 'Editar Jaula' : 'Nueva Jaula'} - Galpón {selectedGalpon?.nombre}
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenJaulaDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre"
                name="nombre"
                value={jaulaForm.nombre}
                onChange={handleJaulaChange}
                fullWidth
                required
                error={!!jaulaErrors.nombre}
                helperText={jaulaErrors.nombre || 'Máximo 10 caracteres'}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Capacidad Máxima"
                name="capacidadMaxima"
                type="number"
                value={jaulaForm.capacidadMaxima}
                onChange={handleJaulaChange}
                fullWidth
                required
                error={!!jaulaErrors.capacidadMaxima}
                helperText={jaulaErrors.capacidadMaxima}
                size="small"
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descripción"
                name="descripcion"
                value={jaulaForm.descripcion}
                onChange={handleJaulaChange}
                fullWidth
                multiline
                rows={2}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  name="tipo"
                  value={jaulaForm.tipo}
                  onChange={handleJaulaSelectChange}
                  label="Tipo"
                >
                  {tipoJaulaOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  name="estado"
                  value={jaulaForm.estado}
                  onChange={handleJaulaSelectChange}
                  label="Estado"
                >
                  {estadoOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenJaulaDialog(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitJaula}
            disabled={loading}
          >
            {loading ? 'Guardando...' : (editId ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de estadísticas */}
      <Dialog open={openEstadisticasDialog} onClose={() => setOpenEstadisticasDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Analytics color="primary" />
              <Typography variant="h6">
                Estadísticas - Galpón {selectedGalpon?.nombre}
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenEstadisticasDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {selectedGalpon && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Información General</Typography>
                      <Typography variant="body2">
                        <strong>Capacidad:</strong> {selectedGalpon.capacidadMaxima} cuyes
                      </Typography>
                      <Typography variant="body2">
                        <strong>Ocupación:</strong> {selectedGalpon.totalCuyes} cuyes ({(selectedGalpon.porcentajeOcupacion || 0).toFixed(1)}%)
                      </Typography>
                      <Typography variant="body2">
                        <strong>Jaulas:</strong> {selectedGalpon.totalJaulas}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Ubicación:</strong> {selectedGalpon.ubicacion || 'No especificada'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Distribución de Cuyes</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Avatar sx={{ bgcolor: theme.palette.primary.main, mx: 'auto', mb: 1 }}>
                            {selectedGalpon.totalCuyes}
                          </Avatar>
                          <Typography variant="body2">Total</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Avatar sx={{ bgcolor: theme.palette.info.main, mx: 'auto', mb: 1 }}>
                            {selectedGalpon.alertas?.cuyesEnfermos || 0}
                          </Avatar>
                          <Typography variant="body2">Enfermos</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {/* Lista de jaulas */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Jaulas en este galpón
              </Typography>
              {selectedGalpon.jaulas && selectedGalpon.jaulas.length > 0 ? (
                <Grid container spacing={2}>
                  {selectedGalpon.jaulas.map(jaula => (
                    <Grid item xs={12} sm={6} md={4} key={jaula.id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              Jaula {jaula.nombre}
                            </Typography>
                            <Box>
                              <Tooltip title="Editar">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleOpenJaulaDialog(selectedGalpon, jaula)}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton 
                                  size="small" 
                                  onClick={() => jaulaDeleteConfirmation.handleDeleteClick(jaula.id)}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                          <Chip 
                            label={jaula.tipo} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {jaula.descripcion || 'Sin descripción'}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Capacidad:</strong> {jaula.capacidadMaxima} cuyes
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">
                  Este galpón no tiene jaulas. Añade jaulas para organizar mejor tus cuyes.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEstadisticasDialog(false)}>
            Cerrar
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => {
              setOpenEstadisticasDialog(false);
              if (selectedGalpon) {
                handleOpenJaulaDialog(selectedGalpon);
              }
            }}
          >
            Añadir Jaula
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogos de confirmación */}
      <ConfirmDeleteDialog
        open={deleteConfirmation.confirmOpen}
        onClose={deleteConfirmation.handleCancelDelete}
        onConfirm={deleteConfirmation.handleConfirmDelete}
        itemName="galpón"
        loading={deleteConfirmation.loading}
      />
      <ConfirmDeleteDialog
        open={jaulaDeleteConfirmation.confirmOpen}
        onClose={jaulaDeleteConfirmation.handleCancelDelete}
        onConfirm={jaulaDeleteConfirmation.handleConfirmDelete}
        itemName="jaula"
        loading={jaulaDeleteConfirmation.loading}
      />
    </Box>
  );
};

export default GalponesManager;