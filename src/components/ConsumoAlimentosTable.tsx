import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Chip, Alert, CircularProgress, FormControl, InputLabel, Select,
  MenuItem, Grid, Divider, Card, CardContent, Avatar, useTheme, alpha,
  TablePagination, Tooltip, InputAdornment, FormHelperText
} from '../utils/mui';
import {
  Add, Edit, Delete, Restaurant, CalendarToday, Warehouse, TrendingDown,
  Close, Save, Analytics, FilterList, Refresh
} from '@mui/icons-material';
import api from '../services/api';
import toastService from '../services/toastService';
import { useDeleteConfirmation } from '../hooks/useDeleteConfirmation';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

interface Alimento {
  id: number;
  nombre: string;
  unidad: string;
  stock: number;
  costoUnitario: number;
}

interface ConsumoAlimento {
  id?: number;
  galpon: string;
  fecha: string;
  alimentoId: number;
  cantidad: number;
  alimento?: Alimento;
}

const initialForm: ConsumoAlimento = {
  galpon: '',
  fecha: new Date().toISOString().split('T')[0],
  alimentoId: 0,
  cantidad: 0,
};

const galpones = ['A', 'B', 'C', 'D', 'E']; // Esto debería venir de una API

const ConsumoAlimentosTable: React.FC = () => {
  const theme = useTheme();
  const [consumos, setConsumos] = useState<ConsumoAlimento[]>([]);
  const [alimentos, setAlimentos] = useState<Alimento[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ConsumoAlimento>(initialForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formErrors, setFormErrors] = useState({
    galpon: '',
    fecha: '',
    alimentoId: '',
    cantidad: ''
  });

  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [showEstadisticas, setShowEstadisticas] = useState(false);

  const deleteConfirmation = useDeleteConfirmation({
    onDelete: async (id: number) => {
      await api.delete(`/consumo/${id}`);
      fetchConsumos();
      toastService.success('Consumo eliminado', 'Stock revertido correctamente');
    },
    itemName: 'Consumo',
    successMessage: 'Consumo eliminado exitosamente'
  });

  useEffect(() => {
    fetchConsumos();
    fetchAlimentos();
    fetchEstadisticas();
  }, []);

  const fetchConsumos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/consumo');
      setConsumos((response.data as any) || []);
    } catch (error) {
      console.error('Error al obtener consumos:', error);
      toastService.error('Error', 'No se pudieron cargar los consumos');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlimentos = async () => {
    try {
      const response = await api.get('/alimentos');
      setAlimentos((response.data as any) || []);
    } catch (error) {
      console.error('Error al obtener alimentos:', error);
    }
  };

  const fetchEstadisticas = async () => {
    try {
      const response = await api.get('/consumo/estadisticas');
      setEstadisticas(response.data);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {
      galpon: '',
      fecha: '',
      alimentoId: '',
      cantidad: ''
    };

    if (!form.galpon) {
      newErrors.galpon = 'El galpón es obligatorio';
    }

    if (!form.fecha) {
      newErrors.fecha = 'La fecha es obligatoria';
    }

    if (!form.alimentoId || form.alimentoId === 0) {
      newErrors.alimentoId = 'Debe seleccionar un alimento';
    }

    if (!form.cantidad || form.cantidad <= 0) {
      newErrors.cantidad = 'La cantidad debe ser mayor a 0';
    }

    setFormErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleOpen = (consumo?: ConsumoAlimento) => {
    if (consumo) {
      setForm(consumo);
      setEditId(consumo.id!);
    } else {
      setForm(initialForm);
      setEditId(null);
    }
    setFormErrors({
      galpon: '',
      fecha: '',
      alimentoId: '',
      cantidad: ''
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setForm(initialForm);
    setEditId(null);
    setFormErrors({
      galpon: '',
      fecha: '',
      alimentoId: '',
      cantidad: ''
    });
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    if (name) {
      if (name === 'cantidad') {
        const numericValue = value === '' ? 0 : Number(value);
        setForm(prev => ({ ...prev, [name]: numericValue }));
      } else if (name === 'alimentoId') {
        setForm(prev => ({ ...prev, [name]: Number(value) }));
      } else {
        setForm(prev => ({ ...prev, [name]: value }));
      }
      
      // Limpiar error del campo
      if (formErrors[name as keyof typeof formErrors]) {
        setFormErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (editId) {
        await api.put(`/consumo/${editId}`, form);
        toastService.success('Consumo actualizado', 'Stock ajustado correctamente');
      } else {
        await api.post('/consumo', form);
        toastService.success('Consumo registrado', 'Stock descontado automáticamente');
      }
      handleClose();
      fetchConsumos();
      fetchAlimentos(); // Actualizar alimentos para ver el stock actualizado
      fetchEstadisticas();
    } catch (error: any) {
      console.error('Error al guardar consumo:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'No se pudo guardar el consumo';
      toastService.error('Error al guardar', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    deleteConfirmation.handleDeleteClick(id);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getAlimentoById = (id: number) => {
    return alimentos.find(alimento => alimento.id === id);
  };

  const getStockColor = (stock: number) => {
    if (stock <= 5) return 'error';
    if (stock <= 20) return 'warning';
    return 'success';
  };

  if (loading && consumos.length === 0) {
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
          <Restaurant sx={{ mr: 1, verticalAlign: 'middle' }} />
          Consumo de Alimentos
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Analytics />}
            onClick={() => setShowEstadisticas(!showEstadisticas)}
          >
            {showEstadisticas ? 'Ocultar' : 'Ver'} Estadísticas
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
            sx={{ 
              bgcolor: '#4caf50',
              '&:hover': { bgcolor: '#45a049' }
            }}
          >
            Registrar Consumo
          </Button>
        </Box>
      </Box>

      {/* Estadísticas */}
      {showEstadisticas && estadisticas && (
        <Card sx={{ mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Estadísticas de Consumo
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, mx: 'auto', mb: 1 }}>
                    <Restaurant />
                  </Avatar>
                  <Typography variant="h4">{estadisticas.totalConsumos}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Registros
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: theme.palette.success.main, mx: 'auto', mb: 1 }}>
                    <TrendingDown />
                  </Avatar>
                  <Typography variant="h4">S/ {estadisticas.costoTotal?.toFixed(2)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Costo Total
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Alerta de alimentos con stock bajo */}
      {alimentos.some(alimento => alimento.stock <= 5) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">
            ⚠️ Alimentos con stock crítico:
          </Typography>
          {alimentos
            .filter(alimento => alimento.stock <= 5)
            .map(alimento => (
              <Chip
                key={alimento.id}
                label={`${alimento.nombre}: ${alimento.stock} ${alimento.unidad}`}
                color="warning"
                size="small"
                sx={{ mr: 1, mt: 1 }}
              />
            ))}
        </Alert>
      )}

      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Galpón</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Alimento</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cantidad</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Costo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Stock Actual</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {consumos
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((consumo) => (
                  <TableRow key={consumo.id} hover>
                    <TableCell>{consumo.id}</TableCell>
                    <TableCell>{new Date(consumo.fecha).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip label={`Galpón ${consumo.galpon}`} color="primary" size="small" />
                    </TableCell>
                    <TableCell>{consumo.alimento?.nombre || 'N/A'}</TableCell>
                    <TableCell>
                      {consumo.cantidad} {consumo.alimento?.unidad}
                    </TableCell>
                    <TableCell>
                      S/ {(consumo.cantidad * (consumo.alimento?.costoUnitario || 0)).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${consumo.alimento?.stock || 0} ${consumo.alimento?.unidad}`}
                        color={getStockColor(consumo.alimento?.stock || 0) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleOpen(consumo)}
                            sx={{ color: '#1976d2' }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(consumo.id!)}
                            sx={{ color: '#d32f2f' }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        {consumos.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              No hay consumos registrados
            </Typography>
          </Box>
        )}

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={consumos.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
        />
      </Paper>

      {/* Dialog para crear/editar consumo */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Restaurant color="primary" />
            <Typography variant="h6">
              {editId ? 'Editar Consumo' : 'Registrar Consumo'}
            </Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" size="small" error={!!formErrors.galpon}>
                <InputLabel>Galpón *</InputLabel>
                <Select
                  name="galpon"
                  value={form.galpon}
                  onChange={handleChange}
                  label="Galpón *"
                  required
                >
                  {galpones.map((galpon) => (
                    <MenuItem key={galpon} value={galpon}>
                      Galpón {galpon}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.galpon && <FormHelperText>{formErrors.galpon}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fecha"
                name="fecha"
                type="date"
                value={form.fecha}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
                fullWidth
                variant="outlined"
                size="small"
                error={!!formErrors.fecha}
                helperText={formErrors.fecha}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined" size="small" error={!!formErrors.alimentoId}>
                <InputLabel>Alimento *</InputLabel>
                <Select
                  name="alimentoId"
                  value={form.alimentoId}
                  onChange={handleChange}
                  label="Alimento *"
                  required
                >
                  <MenuItem value={0}>
                    <em>-- Seleccionar alimento --</em>
                  </MenuItem>
                  {alimentos.map((alimento) => (
                    <MenuItem key={alimento.id} value={alimento.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Typography variant="body1">
                          {alimento.nombre}
                        </Typography>
                        <Chip
                          label={`Stock: ${alimento.stock} ${alimento.unidad}`}
                          color={getStockColor(alimento.stock) as any}
                          size="small"
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.alimentoId && <FormHelperText>{formErrors.alimentoId}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Cantidad"
                name="cantidad"
                type="number"
                value={form.cantidad === 0 ? '' : form.cantidad}
                onChange={handleChange}
                required
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Ej: 10.5"
                error={!!formErrors.cantidad}
                helperText={formErrors.cantidad || `Unidad: ${getAlimentoById(form.alimentoId)?.unidad || 'N/A'}`}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Warehouse fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                inputProps={{ step: 0.1, min: 0 }}
              />
            </Grid>
            {form.alimentoId > 0 && form.cantidad > 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Costo estimado:</strong> S/ {(form.cantidad * (getAlimentoById(form.alimentoId)?.costoUnitario || 0)).toFixed(2)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Stock disponible:</strong> {getAlimentoById(form.alimentoId)?.stock || 0} {getAlimentoById(form.alimentoId)?.unidad}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} startIcon={<Close />} variant="outlined">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            startIcon={editId ? <Save /> : <Add />}
            variant="contained"
            disabled={loading}
            sx={{ 
              bgcolor: '#4caf50',
              '&:hover': { bgcolor: '#45a049' }
            }}
          >
            {loading ? 'Guardando...' : (editId ? 'Guardar' : 'Registrar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDeleteDialog
        open={deleteConfirmation.confirmOpen}
        onClose={deleteConfirmation.handleCancelDelete}
        onConfirm={deleteConfirmation.handleConfirmDelete}
        itemName="consumo"
        loading={deleteConfirmation.loading}
      />
    </Box>
  );
};

export default ConsumoAlimentosTable;