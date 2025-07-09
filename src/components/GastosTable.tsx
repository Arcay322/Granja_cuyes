import { useEffect, useState } from 'react';
import api from '../services/api';
import toastService from '../services/toastService';
import { useDeleteConfirmation } from '../hooks/useDeleteConfirmation';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton,
  Box, Tooltip, MenuItem, Select, FormControl, InputLabel, Chip, Divider, Alert,
  useTheme, alpha, CircularProgress, TablePagination, Grid, FormHelperText,
  Checkbox, Toolbar, Slide, Fab
} from '../utils/mui';
import { 
  Add, Edit, Delete, MonetizationOn, Close, AttachMoney, 
  CalendarToday, Category, Receipt, DeleteSweep, SelectAll,
  CheckBox, CheckBoxOutlineBlank
} from '@mui/icons-material';
import { InputAdornment } from '../utils/mui';

interface Gasto {
  id?: number;
  concepto: string;
  fecha: string;
  monto: number;
  categoria: string;
}

const initialForm: Gasto = {
  concepto: '',
  fecha: new Date().toISOString().split('T')[0],
  monto: '' as any,
  categoria: '',
};

// Opciones para categorías
const categoriaOptions = [
  'Alimentación',
  'Salud',
  'Personal',
  'Mantenimiento',
  'Servicios',
  'Logística'
];

const GastosTable = () => {
  const theme = useTheme();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Gasto>(initialForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formErrors, setFormErrors] = useState({
    concepto: '',
    fecha: '',
    monto: '',
    categoria: ''
  });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Hook para confirmación de eliminación
  const deleteConfirmation = useDeleteConfirmation({
    onDelete: async (id: number) => {
      await api.delete(`/gastos/${id}`);
      fetchGastos();
    },
    itemName: 'Gasto',
    successMessage: 'Gasto eliminado exitosamente'
  });

  const fetchGastos = () => {
    setLoading(true);
    api.get('/gastos')
      .then(res => {
        setGastos(res.data);
        setError(null);
      })
      .catch(err => {
        console.error("Error al cargar gastos:", err);
        setError("No se pudieron cargar los gastos. Mostrando datos de ejemplo.");
        // Datos de ejemplo
        const fakeGastos = [
          { id: 1, concepto: 'Compra de alfalfa', fecha: '2025-07-01', monto: 450.0, categoria: 'Alimentación' },
          { id: 2, concepto: 'Medicamentos', fecha: '2025-07-02', monto: 180.5, categoria: 'Salud' },
          { id: 3, concepto: 'Pago de personal', fecha: '2025-07-03', monto: 1200.0, categoria: 'Personal' },
          { id: 4, concepto: 'Reparación jaulas', fecha: '2025-07-04', monto: 350.0, categoria: 'Mantenimiento' },
        ];
        setGastos(fakeGastos);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGastos();
  }, []);

  const handleOpen = (gasto?: Gasto) => {
    if (gasto) {
      setForm(gasto);
      setEditId(gasto.id!);
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
    if (name === 'monto') {
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
      case 'concepto':
        if (!value || value.trim() === '') {
          error = 'El concepto es obligatorio';
        }
        break;
      case 'fecha':
        if (!value) {
          error = 'La fecha es obligatoria';
        }
        break;
      case 'monto':
        if (!value || value === '' || Number(value) <= 0) {
          error = 'El monto debe ser mayor a 0';
        }
        break;
      case 'categoria':
        if (!value) {
          error = 'Debe seleccionar una categoría';
        }
        break;
    }
    
    return error;
  };

  // Validar todo el formulario
  const validateForm = () => {
    const errors = {
      concepto: validateField('concepto', form.concepto),
      fecha: validateField('fecha', form.fecha),
      monto: validateField('monto', form.monto),
      categoria: validateField('categoria', form.categoria)
    };
    
    setFormErrors(errors);
    
    // Retornar true si no hay errores
    return !Object.values(errors).some(error => error !== '');
  };

  const handleSubmit = async () => {
    // Validar formulario antes de enviar
    if (!validateForm()) {
      toastService.error(
        'Error de Validación',
        'Por favor corrige los errores en el formulario'
      );
      return;
    }

    try {
      // Convertir campos vacíos a números antes de enviar
      const formData = {
        ...form,
        monto: form.monto === '' ? 0 : Number(form.monto)
      };
      
      if (editId) {
        await api.put(`/gastos/${editId}`, formData);
        toastService.success(
          'Gasto Actualizado',
          'Gasto actualizado exitosamente'
        );
      } else {
        await api.post('/gastos', formData);
        toastService.success(
          'Gasto Registrado',
          'Gasto registrado exitosamente'
        );
        
        // Los gastos altos no necesitan notificación en la campana
        if (formData.monto > 300) {
          toastService.warning(
            'Gasto Alto Registrado',
            `Se registró un gasto de S/ ${formData.monto.toFixed(2)} en ${formData.categoria}`
          );
        }
      }
      fetchGastos();
      handleClose();
    } catch (err) {
      console.error("Error al guardar gasto:", err);
      setError('Error al guardar el gasto. Intenta de nuevo.');
      toastService.error(
        'Error al Guardar',
        editId ? 'No se pudo actualizar el gasto' : 'No se pudo crear el gasto'
      );
    }
  };

  // Ya no necesitamos este método - usamos el hook de confirmación
  /*
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/gastos/${id}`);
      setSuccess('Gasto eliminado exitosamente');
      notificationService.crudSuccess('eliminar', 'Gasto');
      fetchGastos();
    } catch (err) {
      console.error("Error al eliminar gasto:", err);
      setError('Error al eliminar el gasto. Intenta de nuevo.');
      notificationService.crudError('eliminar', 'Gasto');
    }
  };
  */

  // Funciones para selección múltiple
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = gastos.map((n) => n.id!);
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
      await Promise.all(selectedIds.map(id => api.delete(`/gastos/${id}`)));
      toastService.success(
        'Eliminación Exitosa',
        `${selectedIds.length} gastos eliminados exitosamente`
      );
      setSelectedIds([]);
      setShowBulkActions(false);
      fetchGastos();
    } catch (err: any) {
      console.error('Error al eliminar gastos:', err);
      toastService.error(
        'Error al Eliminar',
        'No se pudieron eliminar algunos gastos'
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

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'Alimentación': return theme.palette.success.main;
      case 'Salud': return theme.palette.error.main;
      case 'Personal': return theme.palette.warning.main;
      case 'Mantenimiento': return theme.palette.info.main;
      case 'Servicios': return theme.palette.primary.main;
      case 'Logística': return theme.palette.secondary.main;
      default: return theme.palette.grey[500];
    }
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
          <MonetizationOn color="primary" />
          <Typography variant="h6">Registro de Gastos</Typography>
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
          Nuevo Gasto
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
                {selectedIds.length} gasto{selectedIds.length !== 1 ? 's' : ''} seleccionado{selectedIds.length !== 1 ? 's' : ''}
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
                      indeterminate={selectedIds.length > 0 && selectedIds.length < gastos.length}
                      checked={gastos.length > 0 && selectedIds.length === gastos.length}
                      onChange={handleSelectAllClick}
                      inputProps={{ 'aria-label': 'Seleccionar todos' }}
                    />
                  </TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Concepto</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Monto</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(rowsPerPage > 0
                  ? gastos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : gastos
                ).map(gasto => {
                  const isSelected = selectedIds.indexOf(gasto.id!) !== -1;
                  return (
                    <TableRow 
                      key={gasto.id} 
                      hover
                      selected={isSelected}
                      onClick={(event) => handleClick(event, gasto.id!)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isSelected}
                          onChange={(event) => handleClick(event, gasto.id!)}
                          inputProps={{ 'aria-labelledby': `enhanced-table-checkbox-${gasto.id}` }}
                        />
                      </TableCell>
                      <TableCell>{gasto.id}</TableCell>
                      <TableCell>{gasto.concepto}</TableCell>
                      <TableCell>{new Date(gasto.fecha).toLocaleDateString()}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{formatCurrency(gasto.monto)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={gasto.categoria} 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha(getCategoriaColor(gasto.categoria), 0.1),
                            color: getCategoriaColor(gasto.categoria),
                            fontWeight: 500
                          }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Editar">
                          <IconButton color="primary" onClick={() => handleOpen(gasto)} size="small">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton 
                            color="error" 
                            onClick={() => deleteConfirmation.handleDeleteClick(gasto.id!)} 
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {gastos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      <Typography color="textSecondary">
                        No hay gastos registrados. Agrega uno nuevo para comenzar.
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
            count={gastos.length}
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
            <MonetizationOn color="primary" />
            {editId ? 'Editar Gasto' : 'Registrar Gasto'}
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Concepto" 
                name="concepto" 
                value={form.concepto} 
                onChange={handleChange} 
                fullWidth 
                required
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Receipt fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                error={!!formErrors.concepto}
                helperText={formErrors.concepto}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Fecha" 
                name="fecha" 
                type="date" 
                value={form.fecha} 
                onChange={handleChange} 
                fullWidth 
                required
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                error={!!formErrors.fecha}
                helperText={formErrors.fecha}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Monto" 
                name="monto" 
                type="number" 
                value={form.monto === 0 ? '' : form.monto} 
                onChange={handleChange} 
                onFocus={(e) => e.target.select()}
                fullWidth 
                required
                variant="outlined"
                size="small"
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                error={!!formErrors.monto}
                helperText={formErrors.monto}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required variant="outlined" size="small">
                <InputLabel>Categoría</InputLabel>
                <Select
                  name="categoria"
                  value={form.categoria}
                  onChange={(e) => {
                    setForm({ ...form, categoria: e.target.value });
                    const error = validateField('categoria', e.target.value);
                    setFormErrors({ ...formErrors, categoria: error });
                  }}
                  label="Categoría"
                  startAdornment={
                    <InputAdornment position="start">
                      <Category fontSize="small" />
                    </InputAdornment>
                  }
                  error={!!formErrors.categoria}
                >
                  {categoriaOptions.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
                {formErrors.categoria && (
                  <FormHelperText error>{formErrors.categoria}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} variant="outlined" startIcon={<Close />}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained" startIcon={editId ? <Edit /> : <Add />}>
            {editId ? 'Guardar Cambios' : 'Registrar Gasto'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDeleteDialog
        open={deleteConfirmation.confirmOpen}
        onClose={deleteConfirmation.handleCancelDelete}
        onConfirm={deleteConfirmation.handleConfirmDelete}
        itemName="gasto"
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

export default GastosTable;
