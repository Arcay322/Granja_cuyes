import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Avatar, Chip, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, MenuItem, Alert, CircularProgress, useTheme, alpha, Badge, 
  LinearProgress, Paper, Divider, IconButton, Tooltip, Stack, Breadcrumbs
} from '../utils/mui';
import {
  Home, Add, Edit, Delete, Analytics, Warning, Groups, TrendingUp, 
  Inventory, Close, ArrowBack, Pets, ViewModule
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toastService from '../services/toastService';
import { useDeleteConfirmation } from '../hooks/useDeleteConfirmation';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import DeleteGalponWithRelationsDialog from './DeleteGalponWithRelationsDialog';
import DeleteJaulaWithRelationsDialog from './DeleteJaulaWithRelationsDialog';
import CuyesManagerFixed from './CuyesManagerFixed';

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
  ocupacion?: {
    totalCuyes: number;
    cuyesActivos: number;
    cuyesEnfermos: number;
    capacidadMaxima: number;
    porcentajeOcupacion: number;
    estadoOcupacion: string;
    espaciosLibres: number;
  };
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

const GalponesManagerFixed: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [galpones, setGalpones] = useState<Galpon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGalpon, setSelectedGalpon] = useState<Galpon | null>(null);
  
  // Estados para navegación jerárquica
  const [currentView, setCurrentView] = useState<'galpones' | 'jaulas' | 'cuyes'>('galpones');
  const [selectedJaula, setSelectedJaula] = useState<Jaula | null>(null);
  const [jaulasDelGalpon, setJaulasDelGalpon] = useState<Jaula[]>([]);
  const [jaulasCuyes, setJaulasCuyes] = useState<unknown[]>([]);
  
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

  // Estados para eliminación con relaciones
  const [openDeleteGalponWithRelationsDialog, setOpenDeleteGalponWithRelationsDialog] = useState(false);
  const [openDeleteJaulaWithRelationsDialog, setOpenDeleteJaulaWithRelationsDialog] = useState(false);
  const [galponToDelete, setGalponToDelete] = useState<number | null>(null);
  const [jaulaToDelete, setJaulaToDelete] = useState<number | null>(null);

  // Configuración para diálogo de confirmación de eliminación
  const deleteConfirmation = useDeleteConfirmation({
    onDelete: async (id: number) => {
      try {
        const response = await api.delete(`/galpones/${id}`);
        if ((response.data as any).success) {
          fetchGalpones();
          // La notificación de éxito la maneja automáticamente el hook
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'No se pudo eliminar el galpón';
        // Re-lanzar el error para que el hook maneje la notificación de error
        throw new Error(errorMsg);
      }
    },
    itemName: 'galpón',
    successMessage: 'El galpón ha sido eliminado exitosamente'
  });

  const jaulaDeleteConfirmation = useDeleteConfirmation({
    onDelete: async (id: number) => {
      try {
        const response = await api.delete(`/galpones/jaulas/${id}`);
        if ((response.data as any).success) {
          if (selectedGalpon) {
            fetchGalponDetails(selectedGalpon.id);
          }
          fetchGalpones();
          // La notificación de éxito la maneja automáticamente el hook
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'No se pudo eliminar la jaula';
        // Re-lanzar el error para que el hook maneje la notificación de error
        throw new Error(errorMsg);
      }
    },
    itemName: 'jaula',
    successMessage: 'La jaula ha sido eliminada exitosamente'
  });

  useEffect(() => {
    fetchGalpones();
  }, []);

  const fetchGalpones = async () => {
    try {
      setLoading(true);
      const response = await api.get('/galpones/resumen');
      setGalpones((response.data as any).data || response.data);
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
      const data = response.data as any;
      setSelectedGalpon(data.data || data);
    } catch (error) {
      console.error('Error al obtener detalles del galpón:', error);
      toastService.error('Error', 'No se pudieron cargar los detalles del galpón');
    }
  };

  const handleOpenGalponDialog = (galpon?: Galpon) => {
    if (galpon) {
      setGalponForm({
        nombre: galpon.nombre || '',
        descripcion: galpon.descripcion || '',
        ubicacion: galpon.ubicacion || '',
        capacidadMaxima: galpon.capacidadMaxima || 50,
        estado: galpon.estado || 'Activo'
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
        nombre: jaula.nombre || '',
        galponId: jaula.galponId || galpon.id,
        galponNombre: jaula.galponNombre || galpon.nombre,
        descripcion: jaula.descripcion || '',
        capacidadMaxima: jaula.capacidadMaxima || 10,
        tipo: jaula.tipo || 'Estándar',
        estado: jaula.estado || 'Activo'
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
      // Obtener las jaulas del galpón para mostrar en las estadísticas
      const response = await api.get(`/galpones/${galpon.nombre}/jaulas`);
      const data = response.data as any;
      const jaulas = data.data || data;
      
      // Usar los datos del resumen que ya tenemos (más precisos) y agregar las jaulas
      setSelectedGalpon({
        ...galpon,
        jaulas: jaulas
      });
      setOpenEstadisticasDialog(true);
    } catch (error) {
      console.error('Error al obtener jaulas del galpón:', error);
      // Si falla, usar los datos que ya tenemos sin las jaulas
      setSelectedGalpon(galpon);
      setOpenEstadisticasDialog(true);
    }
  };

  const handleGalponChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
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

  const handleJaulaChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
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
      
      // Ensure all required fields are properly set
      const galponData = {
        ...galponForm,
        capacidadMaxima: Number(galponForm.capacidadMaxima) || 50,
        estado: galponForm.estado || 'Activo'
      };

      // Validate required fields
      if (!galponData.nombre || galponData.nombre.trim() === '') {
        toastService.error('Error de validación', 'El nombre del galpón es requerido');
        return;
      }

      if (galponData.capacidadMaxima <= 0) {
        toastService.error('Error de validación', 'La capacidad máxima debe ser mayor a 0');
        return;
      }

      console.log('Datos de galpón a enviar:', galponData);

      if (editId) {
        await api.put(`/galpones/${editId}`, galponData);
        toastService.success('Galpón actualizado', 'El galpón ha sido actualizado exitosamente');
      } else {
        await api.post('/galpones', galponData);
        toastService.success('Galpón creado', 'El galpón ha sido creado exitosamente');
      }
      setOpenGalponDialog(false);
      fetchGalpones();
    } catch (error: any) {
      console.error('Error al guardar galpón:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'No se pudo guardar el galpón';
      toastService.error('Error al guardar', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitJaula = async () => {
    if (!validateJaulaForm()) return;
    try {
      setLoading(true);
      
      // Ensure galponId is valid
      const jaulaData = {
        ...jaulaForm,
        galponId: jaulaForm.galponId || selectedGalpon?.id || 0,
        galponNombre: jaulaForm.galponNombre || selectedGalpon?.nombre || '',
        capacidadMaxima: Number(jaulaForm.capacidadMaxima) || 10
      };

      // Validate required fields
      if (!jaulaData.nombre || !jaulaData.galponId || jaulaData.galponId <= 0) {
        toastService.error('Error de validación', 'Faltan datos requeridos para la jaula');
        return;
      }

      console.log('Datos de jaula a enviar:', jaulaData);

      if (editId) {
        await api.put(`/galpones/jaulas/${editId}`, jaulaData);
        toastService.success('Jaula actualizada', 'La jaula ha sido actualizada exitosamente');
      } else {
        await api.post('/galpones/jaulas', jaulaData);
        toastService.success('Jaula creada', 'La jaula ha sido creada exitosamente');
      }
      setOpenJaulaDialog(false);
      fetchGalpones();
      if (selectedGalpon) {
        fetchGalponDetails(selectedGalpon.id);
      }
    } catch (error: any) {
      console.error('Error al guardar jaula:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'No se pudo guardar la jaula';
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

  // Funciones para navegación jerárquica
  const handleGalponClick = async (galpon: Galpon) => {
    try {
      setLoading(true);
      setSelectedGalpon(galpon);
      
      // Obtener jaulas del galpón
      const response = await api.get(`/galpones/${galpon.nombre}/jaulas`);
      const data = response.data as any;
      const jaulas = data.data || data;
      setJaulasDelGalpon(jaulas);
      
      setCurrentView('jaulas');
    } catch (error) {
      console.error('Error al obtener jaulas:', error);
      toastService.error('Error', 'No se pudieron cargar las jaulas del galpón');
    } finally {
      setLoading(false);
    }
  };

  const handleJaulaClick = async (jaula: Jaula) => {
    try {
      setLoading(true);
      setSelectedJaula(jaula);
      
      // Obtener cuyes de la jaula específica con filtros aplicados en el backend
      const response = await api.get(`/cuyes?galpon=${jaula.galponNombre}&jaula=${jaula.nombre}&limit=1000`);
      const data = response.data as any;
      const cuyes = data.data || [];
      setJaulasCuyes(cuyes);
      
      setCurrentView('cuyes');
    } catch (error) {
      console.error('Error al obtener cuyes:', error);
      toastService.error('Error', 'No se pudieron cargar los cuyes de la jaula');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToGalpones = () => {
    setCurrentView('galpones');
    setSelectedGalpon(null);
    setJaulasDelGalpon([]);
  };

  const handleBackToJaulas = () => {
    setCurrentView('jaulas');
    setSelectedJaula(null);
    setJaulasCuyes([]);
  };

  // Funciones para eliminación con relaciones
  const handleDeleteGalponWithRelations = (galponId: number) => {
    setGalponToDelete(galponId);
    setOpenDeleteGalponWithRelationsDialog(true);
  };

  const handleDeleteJaulaWithRelations = (jaulaId: number) => {
    setJaulaToDelete(jaulaId);
    setOpenDeleteJaulaWithRelationsDialog(true);
  };

  const handleGalponDeleteConfirmed = async (galponId: number) => {
    try {
      fetchGalpones();
      toastService.success(
        'Eliminación Exitosa',
        'El galpón y todos sus elementos relacionados han sido eliminados'
      );
      setOpenDeleteGalponWithRelationsDialog(false);
      setGalponToDelete(null);
    } catch (error: any) {
      console.error('Error al eliminar galpón con relaciones:', error);
      toastService.error('Error al eliminar', 'No se pudo eliminar el galpón');
    }
  };

  const handleJaulaDeleteConfirmed = async (jaulaId: number) => {
    try {
      if (selectedGalpon) {
        fetchGalponDetails(selectedGalpon.id);
      }
      fetchGalpones();
      toastService.success(
        'Eliminación Exitosa',
        'La jaula y todos sus cuyes han sido eliminados'
      );
      setOpenDeleteJaulaWithRelationsDialog(false);
      setJaulaToDelete(null);
    } catch (error: unknown) {
      console.error('Error al eliminar jaula con relaciones:', error);
      toastService.error('Error al eliminar', 'No se pudo eliminar la jaula');
    }
  };

  if (loading && galpones.length === 0) {
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main, mx: 'auto', mb: 1 }}>
              <Home />
            </Avatar>
            <Typography variant="h4">{galpones.length}</Typography>
            <Typography variant="body2" color="text.secondary">
              Total Galpones
            </Typography>
          </Box>
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
        </Box>
      </Paper>

      {/* Breadcrumbs de navegación */}
      {currentView !== 'galpones' && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.grey[100], 0.5) }}>
          <Breadcrumbs separator="›" sx={{ mb: 1 }}>
            <Button
              startIcon={<Home />}
              onClick={handleBackToGalpones}
              sx={{ textTransform: 'none', color: 'primary.main' }}
            >
              Galpones
            </Button>
            {currentView === 'jaulas' && selectedGalpon && (
              <Typography color="text.primary" sx={{ fontWeight: 'medium' }}>
                Galpón {selectedGalpon.nombre}
              </Typography>
            )}
            {currentView === 'cuyes' && selectedGalpon && selectedJaula && (
              <>
                <Button
                  startIcon={<ViewModule />}
                  onClick={handleBackToJaulas}
                  sx={{ textTransform: 'none', color: 'primary.main' }}
                >
                  Galpón {selectedGalpon.nombre}
                </Button>
                <Typography color="text.primary" sx={{ fontWeight: 'medium' }}>
                  Jaula {selectedJaula.nombre}
                </Typography>
              </>
            )}
          </Breadcrumbs>
          
          <Button
            startIcon={<ArrowBack />}
            onClick={currentView === 'jaulas' ? handleBackToGalpones : handleBackToJaulas}
            size="small"
            sx={{ mt: 1 }}
          >
            Volver
          </Button>
        </Paper>
      )}

      {/* Vista de Galpones */}
      {currentView === 'galpones' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
          {galpones.map((galpon) => (
            <Card key={galpon.id} sx={{ 
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}>
              <CardContent onClick={() => handleGalponClick(galpon)}>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenGalponDialog(galpon);
                        }}
                        sx={{ color: theme.palette.primary.main }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar galpón">
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGalponWithRelations(galpon.id);
                        }}
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
                      {(galpon.porcentajeOcupacion || 0).toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(galpon.porcentajeOcupacion || 0, 100)}
                    color={getOcupacionColor(galpon.porcentajeOcupacion || 0) as 'error' | 'warning' | 'success'}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 1 }}>
                    <Typography variant="h6">{galpon.totalJaulas}</Typography>
                    <Typography variant="caption">Jaulas</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 1 }}>
                    <Typography variant="h6">{galpon.totalCuyes}</Typography>
                    <Typography variant="caption">Cuyes</Typography>
                  </Box>
                </Box>

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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenJaulaDialog(galpon);
                    }}
                  >
                    Añadir Jaula
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<Analytics />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEstadisticasDialog(galpon);
                    }}
                  >
                    Estadísticas
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Vista de Jaulas */}
      {currentView === 'jaulas' && selectedGalpon && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
              <ViewModule sx={{ mr: 1, verticalAlign: 'middle' }} />
              Jaulas del Galpón {selectedGalpon.nombre}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenJaulaDialog(selectedGalpon)}
              sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
            >
              Nueva Jaula
            </Button>
          </Box>

          {jaulasDelGalpon.length > 0 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
              {jaulasDelGalpon.map((jaula) => (
                <Card key={jaula.id} sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                        Jaula {jaula.nombre}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip 
                          label={jaula.tipo} 
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                        <Tooltip title="Editar jaula">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenJaulaDialog(selectedGalpon, jaula);
                            }}
                            sx={{ color: theme.palette.primary.main }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar jaula">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteJaulaWithRelations(jaula.id);
                            }}
                            sx={{ color: theme.palette.error.main }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {jaula.descripcion || 'Sin descripción'}
                    </Typography>

                    {/* Información de Ocupación */}
                    <Box sx={{ mt: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          Ocupación
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                          {jaula.ocupacion?.totalCuyes || 0}/{jaula.capacidadMaxima}
                        </Typography>
                      </Box>
                      
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(jaula.ocupacion?.porcentajeOcupacion || 0, 100)}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(theme.palette.grey[300], 0.3),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: jaula.ocupacion?.porcentajeOcupacion >= 100 ? '#f44336' :
                                    jaula.ocupacion?.porcentajeOcupacion >= 80 ? '#ff9800' : '#4caf50'
                          }
                        }}
                      />
                      
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {jaula.ocupacion?.estadoOcupacion || 'Normal'} • {jaula.ocupacion?.espaciosLibres || 0} espacios libres
                      </Typography>
                    </Box>

                    {/* Estadísticas de Cuyes */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mb: 2 }}>
                      <Box sx={{ textAlign: 'center', p: 1, bgcolor: alpha('#4caf50', 0.1), borderRadius: 1 }}>
                        <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                          {jaula.ocupacion?.cuyesActivos || 0}
                        </Typography>
                        <Typography variant="caption">Activos</Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'center', p: 1, bgcolor: alpha('#ff9800', 0.1), borderRadius: 1 }}>
                        <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                          {jaula.ocupacion?.cuyesEnfermos || 0}
                        </Typography>
                        <Typography variant="caption">Enfermos</Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'center', p: 1, bgcolor: alpha('#2196f3', 0.1), borderRadius: 1 }}>
                        <Chip 
                          label={jaula.estado} 
                          color={jaula.estado === 'Activo' ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                    </Box>

                    {/* Alertas */}
                    {((jaula.ocupacion?.porcentajeOcupacion || 0) >= 100 || (jaula.ocupacion?.cuyesEnfermos || 0) > 0) && (
                      <Alert 
                        severity={(jaula.ocupacion?.porcentajeOcupacion || 0) >= 100 ? 'error' : 'warning'} 
                        sx={{ mb: 2, py: 0 }}
                      >
                        {(jaula.ocupacion?.porcentajeOcupacion || 0) >= 100 && (
                          <div>⚠️ Jaula llena</div>
                        )}
                        {(jaula.ocupacion?.cuyesEnfermos || 0) > 0 && (
                          <div>🏥 {jaula.ocupacion?.cuyesEnfermos || 0} cuyes enfermos</div>
                        )}
                      </Alert>
                    )}

                    <Button 
                      fullWidth
                      variant="contained"
                      startIcon={<Pets />}
                      sx={{ 
                        mt: 1,
                        bgcolor: '#2e7d32',
                        '&:hover': { bgcolor: '#1b5e20' }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJaulaClick(jaula);
                      }}
                    >
                      Ver Cuyes ({jaula.ocupacion?.totalCuyes || 0})
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay jaulas en este galpón
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Crea la primera jaula para comenzar a organizar los cuyes
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenJaulaDialog(selectedGalpon)}
                sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
              >
                Crear Primera Jaula
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* Vista de Cuyes Integrada */}
      {currentView === 'cuyes' && selectedGalpon && selectedJaula && (
        <CuyesManagerFixed
          showNewCuyButton={true}
          showMassiveRegistration={true}
          showViewToggle={true}
          showFiltersPanel={false}
          showStats={true}
          showTitle={false}
          showUpdateStagesButton={false}
          showFiltersButton={false}
          showRefreshButton={false}
          showSearchButton={false}
          presetFilters={{
            galpon: selectedJaula.galponNombre,
            jaula: selectedJaula.nombre
          }}
          customTitle={`Cuyes en Jaula ${selectedJaula.nombre} - Galpón ${selectedGalpon.nombre}`}
        />
      )}

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
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
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
            </Box>
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
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Ubicación"
                name="ubicacion"
                value={galponForm.ubicacion}
                onChange={handleGalponChange}
                fullWidth
                size="small"
              />
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  name="estado"
                  value={galponForm.estado}
                  onChange={(e) => handleGalponChange(e as any)}
                  label="Estado"
                >
                  {estadoOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Stack>
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
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
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
            </Box>
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
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  name="tipo"
                  value={jaulaForm.tipo}
                  onChange={(e) => handleJaulaChange(e as any)}
                  label="Tipo"
                >
                  {tipoJaulaOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  name="estado"
                  value={jaulaForm.estado}
                  onChange={(e) => handleJaulaChange(e as any)}
                  label="Estado"
                >
                  {estadoOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Stack>
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
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
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
              </Box>
              
              {/* Lista de jaulas */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Jaulas en este galpón
              </Typography>
              {selectedGalpon.jaulas && selectedGalpon.jaulas.length > 0 ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                  {selectedGalpon.jaulas.map(jaula => (
                    <Card key={jaula.id}>
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
                                onClick={() => handleDeleteJaulaWithRelations(jaula.id)}
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
                  ))}
                </Box>
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

      {/* Diálogos de eliminación con relaciones */}
      <DeleteGalponWithRelationsDialog
        open={openDeleteGalponWithRelationsDialog}
        onClose={() => {
          setOpenDeleteGalponWithRelationsDialog(false);
          setGalponToDelete(null);
        }}
        galponId={galponToDelete}
        onDeleteConfirmed={handleGalponDeleteConfirmed}
      />

      <DeleteJaulaWithRelationsDialog
        open={openDeleteJaulaWithRelationsDialog}
        onClose={() => {
          setOpenDeleteJaulaWithRelationsDialog(false);
          setJaulaToDelete(null);
        }}
        jaulaId={jaulaToDelete}
        onDeleteConfirmed={handleJaulaDeleteConfirmed}
      />
    </Box>
  );
};

export default GalponesManagerFixed;