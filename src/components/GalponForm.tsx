import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  TextField, Grid, Alert, Divider, InputAdornment, FormControl, InputLabel, Select, MenuItem
} from '../utils/mui';
import {
  Warehouse, Save, Close, Home, LocationOn
} from '@mui/icons-material';
import api from '../services/api';
import toastService from '../services/toastService';

interface GalponFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  galpon?: {
    nombre: string;
    descripcion?: string;
    ubicacion?: string;
    capacidadMaxima?: number;
    estado?: string;
  } | null;
  mode: 'create' | 'edit';
}

const GalponForm: React.FC<GalponFormProps> = ({ 
  open, 
  onClose, 
  onSuccess, 
  galpon,
  mode 
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    ubicacion: '',
    capacidadMaxima: 50,
    estado: 'Activo'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Cargar datos del galpón si estamos editando
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && galpon) {
        setFormData({
          nombre: galpon.nombre || '',
          descripcion: galpon.descripcion || '',
          ubicacion: galpon.ubicacion || '',
          capacidadMaxima: galpon.capacidadMaxima || 50,
          estado: galpon.estado || 'Activo'
        });
      } else {
        setFormData({
          nombre: '',
          descripcion: '',
          ubicacion: '',
          capacidadMaxima: 50,
          estado: 'Activo'
        });
      }
      setErrors({});
    }
  }, [open, mode, galpon]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del galpón es obligatorio';
    } else if (formData.nombre.length < 1) {
      newErrors.nombre = 'El nombre debe tener al menos 1 carácter';
    }

    if (formData.capacidadMaxima <= 0) {
      newErrors.capacidadMaxima = 'La capacidad debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (mode === 'create') {
        await api.post('/galpones', formData);
        toastService.success(
          'Galpón Creado',
          `El galpón "${formData.nombre}" ha sido creado exitosamente`
        );
      } else {
        await api.put(`/galpones/${galpon?.nombre}`, formData);
        toastService.success(
          'Galpón Actualizado',
          `El galpón "${formData.nombre}" ha sido actualizado exitosamente`
        );
      }
      
      handleClose();
      onSuccess();
    } catch (err: any) {
      console.error('Error al guardar galpón:', err);
      toastService.error(
        'Error al Guardar',
        err.response?.data?.message || `No se pudo ${mode === 'create' ? 'crear' : 'actualizar'} el galpón`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      ubicacion: '',
      capacidadMaxima: 50,
      estado: 'Activo'
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warehouse color="primary" />
          {mode === 'create' ? 'Crear Nuevo Galpón' : `Editar Galpón ${galpon?.nombre}`}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {mode === 'create' 
            ? 'Configura la información básica del nuevo galpón'
            : 'Modifica la información del galpón existente'
          }
        </Typography>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Nombre del Galpón"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              fullWidth
              required
              error={!!errors.nombre}
              helperText={errors.nombre || 'Ej: A, B, Galpón 1, Norte'}
              placeholder="Ingresa el nombre o código del galpón"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Home fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="Descripción opcional del galpón"
              helperText="Información adicional sobre el galpón"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Ubicación"
              value={formData.ubicacion}
              onChange={(e) => handleChange('ubicacion', e.target.value)}
              fullWidth
              placeholder="Ej: Sector Norte, Lado Este"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn fontSize="small" />
                  </InputAdornment>
                ),
              }}
              helperText="Ubicación física del galpón"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Capacidad Máxima"
              type="number"
              value={formData.capacidadMaxima}
              onChange={(e) => handleChange('capacidadMaxima', parseInt(e.target.value) || 0)}
              fullWidth
              required
              error={!!errors.capacidadMaxima}
              helperText={errors.capacidadMaxima || 'Número máximo de cuyes'}
              inputProps={{ min: 1, max: 1000 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">cuyes</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Estado del Galpón</InputLabel>
              <Select
                value={formData.estado}
                label="Estado del Galpón"
                onChange={(e) => handleChange('estado', e.target.value)}
              >
                <MenuItem value="Activo">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                    Activo
                  </Box>
                </MenuItem>
                <MenuItem value="Mantenimiento">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                    En Mantenimiento
                  </Box>
                </MenuItem>
                <MenuItem value="Inactivo">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                    Inactivo
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {Object.keys(errors).length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Por favor corrige los errores antes de continuar
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={handleClose} 
          variant="outlined" 
          startIcon={<Close />}
        >
          Cancelar
        </Button>
        
        <Button 
          onClick={handleSubmit}
          variant="contained"
          startIcon={<Save />}
          disabled={loading}
        >
          {loading 
            ? (mode === 'create' ? 'Creando...' : 'Actualizando...') 
            : (mode === 'create' ? 'Crear Galpón' : 'Actualizar')
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GalponForm;
