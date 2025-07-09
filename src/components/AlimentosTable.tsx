import { useEffect, useState } from 'react';
import api from '../services/api';
import toastService from '../services/toastService';
import { useDeleteConfirmation } from '../hooks/useDeleteConfirmation';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton,
  Box, Tooltip, MenuItem, Select, FormControl, InputLabel, Chip, Divider, Alert,
  useTheme, alpha, CircularProgress, TablePagination, Grid,
  Checkbox, Toolbar, Slide, Fab
} from '../utils/mui';
import { 
  Add, Edit, Delete, Kitchen, Close, 
  Description, Inventory2, AttachMoney, DeleteSweep, SelectAll,
  CheckBox, CheckBoxOutlineBlank
} from '@mui/icons-material';
import { InputAdornment } from '../utils/mui';

interface Alimento {
  id?: number;
  nombre: string;
  descripcion: string;
  unidad: string;
  stock: number;
  costoUnitario: number;
  proveedorId?: number;
}

const initialForm: Alimento = {
  nombre: '',
  descripcion: '',
  unidad: '',
  stock: '' as any,
  costoUnitario: '' as any,
  proveedorId: undefined,
};

// Opciones para unidades
const unidadOptions = [
  'kg',
  'gramos',
  'litros',
  'unidades',
  'sacos',
  'toneladas'
];

const AlimentosTable = () => {
  const theme = useTheme();
  const [alimentos, setAlimentos] = useState<Alimento[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Alimento>(initialForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formErrors, setFormErrors] = useState({
    nombre: '',
    descripcion: '',
    unidad: '',
    stock: '',
    costoUnitario: ''
  });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Hook para confirmación de eliminación
  const deleteConfirmation = useDeleteConfirmation({
    onDelete: async (id: number) => {
      await api.delete(`/alimentos/${id}`);
      fetchAlimentos();
    },
    itemName: 'Alimento',
    successMessage: 'Alimento eliminado exitosamente'
  });

  const fetchAlimentos = () => {
    setLoading(true);
    api.get('/alimentos')
      .then(res => {
        setAlimentos(res.data);
        setError(null);
      })
      .catch(err => {
        console.error("Error al cargar alimentos:", err);
        setError("No se pudieron cargar los alimentos. Mostrando datos de ejemplo.");
        // Datos de ejemplo
        const fakeAlimentos = [
          { id: 1, nombre: 'Alfalfa', descripcion: 'Forraje fresco rico en proteínas', unidad: 'kg', stock: 100, costoUnitario: 2.50 },
          { id: 2, nombre: 'Concentrado', descripcion: 'Alimento balanceado para cuyes', unidad: 'kg', stock: 50, costoUnitario: 5.00 },
          { id: 3, nombre: 'Maíz molido', descripcion: 'Maíz procesado para alimentación', unidad: 'kg', stock: 75, costoUnitario: 3.20 },
          { id: 4, nombre: 'Vitaminas', descripcion: 'Suplemento vitamínico', unidad: 'unidades', stock: 25, costoUnitario: 12.00 },
        ];
        setAlimentos(fakeAlimentos);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAlimentos();
  }, []);

  const handleOpen = (alimento?: Alimento) => {
    if (alimento) {
      setForm(alimento);
      setEditId(alimento.id!);
    } else {
      setForm(initialForm);
      setEditId(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setForm(initialForm);
    setEditId(null);
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Para campos numéricos, permitir valor vacío temporalmente
    if (name === 'stock' || name === 'costoUnitario') {
      // Si el valor está vacío, mantenerlo como string vacío
      // Si tiene valor, convertir a número
      const numericValue = value === '' ? '' : Number(value);
      setForm(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Validar el campo en tiempo real
    const error = validateField(name, value);
    setFormErrors({ ...formErrors, [name]: error });
  };

  // Validar un campo específico
  const validateField = (name: string, value: any) => {
    let error = '';
    
    switch (name) {
      case 'nombre':
        if (!value || value.trim() === '') {
          error = 'El nombre es obligatorio';
        }
        break;
      case 'descripcion':
        if (!value || value.trim() === '') {
          error = 'La descripción es obligatoria';
        }
        break;
      case 'unidad':
        if (!value) {
          error = 'Debe seleccionar una unidad';
        }
        break;
      case 'stock':
        if (!value || value === '' || Number(value) < 0) {
          error = 'El stock debe ser mayor o igual a 0';
        }
        break;
      case 'costoUnitario':
        if (!value || value === '' || Number(value) <= 0) {
          error = 'El costo unitario debe ser mayor a 0';
        }
        break;
    }
    
    return error;
  };

  // Validar todo el formulario
  const validateForm = () => {
    const errors = {
      nombre: validateField('nombre', form.nombre),
      descripcion: validateField('descripcion', form.descripcion),
      unidad: validateField('unidad', form.unidad),
      stock: validateField('stock', form.stock),
      costoUnitario: validateField('costoUnitario', form.costoUnitario)
    };
    
    setFormErrors(errors);
    
    // Retornar true si no hay errores
    return !Object.values(errors).some(error => error !== '');
  };

  const handleSubmit = async () => {
    try {
      // Validar formulario
      const isValid = validateForm();
      if (!isValid) {
        toastService.error(
          'Error de Validación',
          'Por favor corrige los errores en el formulario'
        );
        return;
      }

      // Convertir campos vacíos a números antes de enviar
      const formData = {
        ...form,
        stock: form.stock === '' ? 0 : Number(form.stock),
        costoUnitario: form.costoUnitario === '' ? 0 : Number(form.costoUnitario)
      };
      
      if (editId) {
        await api.put(`/alimentos/${editId}`, formData);
        toastService.success(
          'Alimento Actualizado',
          'Alimento actualizado exitosamente'
        );
      } else {
        await api.post('/alimentos', formData);
        toastService.success(
          'Alimento Creado',
          'Alimento registrado exitosamente'
        );
      }

      // Verificar stock bajo después de actualizar
      if (formData.stock < 10) {
        toastService.warning(
          'Stock Bajo',
          `${formData.nombre} tiene solo ${formData.stock} ${formData.unidad} en stock`,
          'stock'
        );
      }

      fetchAlimentos();
      handleClose();
    } catch (err) {
      console.error("Error al guardar alimento:", err);
      setError('Error al guardar el alimento. Intenta de nuevo.');
      toastService.error(
        'Error al Guardar',
        editId ? 'No se pudo actualizar el alimento' : 'No se pudo crear el alimento'
      );
    }
  };

  // Ya no necesitamos este método - usamos el hook de confirmación
  /*
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/alimentos/${id}`);
      setSuccess('Alimento eliminado exitosamente');
      toastService.crudSuccess('eliminar', 'Alimento');
      fetchAlimentos();
    } catch (err) {
      console.error("Error al eliminar alimento:", err);
      setError('Error al eliminar el alimento. Intenta de nuevo.');
      toastService.crudError('eliminar', 'Alimento');
    }
  };
  */

  // Funciones para selección múltiple
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = alimentos.map((n) => n.id!);
      setSelectedIds(newSelected);
      setShowBulkActions(newSelected.length > 0);
    } else {
      setSelectedIds([]);
      setShowBulkActions(false);
    }
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: number) => {
    const selectedIndex = selectedIds.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedIds, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedIds.slice(1));
    } else if (selectedIndex === selectedIds.length - 1) {
      newSelected = newSelected.concat(selectedIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedIds.slice(0, selectedIndex),
        selectedIds.slice(selectedIndex + 1),
      );
    }

    setSelectedIds(newSelected);
    setShowBulkActions(newSelected.length > 0);
  };

  const isSelected = (id: number) => selectedIds.indexOf(id) !== -1;

  // Funciones para acciones en lote
  const handleBulkDelete = async () => {
    setBulkActionLoading(true);
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/alimentos/${id}`)));
      toastService.success(
        'Eliminación Exitosa',
        `${selectedIds.length} alimentos eliminados exitosamente`
      );
      setSelectedIds([]);
      setShowBulkActions(false);
      fetchAlimentos();
    } catch (err: any) {
      console.error('Error al eliminar alimentos:', err);
      toastService.error(
        'Error al Eliminar',
        'No se pudieron eliminar algunos alimentos'
      );
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const getStockColor = (stock: number) => {
    if (stock <= 10) return theme.palette.error.main;
    if (stock <= 30) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Cabecera */}
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Kitchen color="primary" />
          <Typography variant="h6">Inventario de Alimentos</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => handleOpen()}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: theme.shadows[2]
          }}
        >
          Agregar Alimento
        </Button>
      </Box>

      {/* Alerta de error */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {/* Alerta de éxito */}
      {success && (
        <Alert severity="success" sx={{ m: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Tabla principal */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Barra de herramientas para acciones en lote */}
          <Slide direction="down" in={showBulkActions} mountOnEnter unmountOnExit>
            <Toolbar
              sx={{
                pl: { sm: 2 },
                pr: { xs: 1, sm: 1 },
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                borderRadius: 1,
                mb: 2,
                border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <Typography
                sx={{ flex: '1 1 100%' }}
                color="primary"
                variant="subtitle1"
                component="div"
              >
                {selectedIds.length} alimento{selectedIds.length !== 1 ? 's' : ''} seleccionado{selectedIds.length !== 1 ? 's' : ''}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Eliminar seleccionados">
                  <IconButton
                    size="small"
                    onClick={handleBulkDelete}
                    disabled={bulkActionLoading}
                    color="error"
                  >
                    {bulkActionLoading ? <CircularProgress size={20} /> : <DeleteSweep />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Toolbar>
          </Slide>

          <TableContainer sx={{ 
            flex: 1, 
            overflowY: 'auto',
            overflowX: 'auto', // Scroll horizontal para móvil
            width: '100%',
            maxWidth: { xs: 'calc(100vw - 32px)', sm: '100%' }, // Ancho máximo en móvil
            borderRadius: 2,
            boxShadow: (theme) => `0 0 12px ${alpha(theme.palette.primary.main, 0.08)}`,
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              borderRadius: '8px',
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
            },
            '&::-webkit-scrollbar-track': {
              borderRadius: '8px',
              backgroundColor: (theme) => alpha(theme.palette.grey[200], 0.6),
            }
          }}>
            <Table stickyHeader sx={{ minWidth: { xs: 600, sm: 800 } }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      indeterminate={selectedIds.length > 0 && selectedIds.length < alimentos.length}
                      checked={alimentos.length > 0 && selectedIds.length === alimentos.length}
                      onChange={handleSelectAllClick}
                      inputProps={{ 'aria-label': 'Seleccionar todo' }}
                    />
                  </TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Unidad</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Costo Unitario</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(rowsPerPage > 0
                  ? alimentos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : alimentos
                ).map(alimento => {
                  const isItemSelected = isSelected(alimento.id!);
                  const labelId = `enhanced-table-checkbox-${alimento.id}`;
                  
                  return (
                    <TableRow 
                      key={alimento.id} 
                      hover
                      selected={isItemSelected}
                      onClick={(event) => handleClick(event, alimento.id!)}
                      aria-checked={isItemSelected}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          onChange={(event) => handleClick(event, alimento.id!)}
                          inputProps={{ 'aria-labelledby': labelId }}
                        />
                      </TableCell>
                      <TableCell>{alimento.id}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{alimento.nombre}</TableCell>
                      <TableCell>{alimento.descripcion}</TableCell>
                      <TableCell>{alimento.unidad}</TableCell>
                      <TableCell>
                        <Chip 
                          label={`${alimento.stock} ${alimento.unidad}`}
                          size="small" 
                          sx={{ 
                            bgcolor: alpha(getStockColor(alimento.stock), 0.1),
                            color: getStockColor(alimento.stock),
                            fontWeight: 500
                          }} 
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{formatCurrency(alimento.costoUnitario)}</TableCell>
                      <TableCell>
                        <Tooltip title="Editar">
                          <IconButton color="primary" onClick={() => handleOpen(alimento)} size="small">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton 
                            color="error" 
                            onClick={() => deleteConfirmation.handleDeleteClick(alimento.id!)} 
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {alimentos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                      <Typography color="textSecondary">
                        No hay alimentos registrados. Agrega uno nuevo para comenzar.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Paginación */}
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, { label: 'Todos', value: -1 }]}
            component="div"
            count={alimentos.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </>
      )}

      {/* Dialog para agregar/editar */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Kitchen color="primary" />
            {editId ? 'Editar Alimento' : 'Agregar Alimento'}
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Nombre" 
                name="nombre" 
                value={form.nombre} 
                onChange={handleChange} 
                fullWidth 
                required
                variant="outlined"
                size="small"
                error={!!formErrors.nombre}
                helperText={formErrors.nombre}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Kitchen fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Descripción" 
                name="descripcion" 
                value={form.descripcion} 
                onChange={handleChange} 
                fullWidth 
                required
                variant="outlined"
                size="small"
                error={!!formErrors.descripcion}
                helperText={formErrors.descripcion}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Description fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required variant="outlined" size="small"
                error={!!formErrors.unidad}
              >
                <InputLabel>Unidad</InputLabel>
                <Select
                  name="unidad"
                  value={form.unidad}
                  onChange={(e) => {
                    setForm({ ...form, unidad: e.target.value });
                    const error = validateField('unidad', e.target.value);
                    setFormErrors({ ...formErrors, unidad: error });
                  }}
                  label="Unidad"
                  startAdornment={
                    <InputAdornment position="start">
                      <Inventory2 fontSize="small" />
                    </InputAdornment>
                  }
                >
                  {unidadOptions.map((unidad) => (
                    <MenuItem key={unidad} value={unidad}>{unidad}</MenuItem>
                  ))}
                </Select>
                {formErrors.unidad && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {formErrors.unidad}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Stock" 
                name="stock" 
                type="number" 
                value={form.stock === 0 ? '' : form.stock} 
                onChange={handleChange} 
                onFocus={(e) => e.target.select()}
                fullWidth 
                required
                variant="outlined"
                size="small"
                inputProps={{ min: 0, step: 1 }}
                error={!!formErrors.stock}
                helperText={formErrors.stock}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Inventory2 fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Costo Unitario" 
                name="costoUnitario" 
                type="number" 
                value={form.costoUnitario === 0 ? '' : form.costoUnitario} 
                onChange={handleChange} 
                onFocus={(e) => e.target.select()}
                fullWidth 
                required
                variant="outlined"
                size="small"
                inputProps={{ min: 0, step: 0.01 }}
                error={!!formErrors.costoUnitario}
                helperText={formErrors.costoUnitario}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} variant="outlined" startIcon={<Close />}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained" startIcon={editId ? <Edit /> : <Add />}>
            {editId ? 'Guardar Cambios' : 'Agregar Alimento'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDeleteDialog
        open={deleteConfirmation.confirmOpen}
        onClose={deleteConfirmation.handleCancelDelete}
        onConfirm={deleteConfirmation.handleConfirmDelete}
        itemName="alimento"
        loading={deleteConfirmation.loading}
      />

      {/* Botón flotante para limpiar selección */}
      {selectedIds.length > 0 && (
        <Fab
          color="secondary"
          aria-label="limpiar selección"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
          onClick={() => {
            setSelectedIds([]);
            setShowBulkActions(false);
          }}
        >
          <Close />
        </Fab>
      )}
    </Box>
  );
};

export default AlimentosTable;
