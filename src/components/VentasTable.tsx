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
  Checkbox, Toolbar, Slide, Fab, SelectChangeEvent
} from '../utils/mui';
import { 
  Add, Edit, Delete, ShoppingCart, Close, Save, AttachMoney, 
  CalendarToday, Person, Payments, Info, FiberManualRecord, PersonAdd,
  Phone, HomeWork, Check, DeleteSweep, SelectAll,
  CheckBox, CheckBoxOutlineBlank
} from '@mui/icons-material';
import { InputAdornment } from '../utils/mui';
import CuySelector from './CuySelector';
import { MuiColor } from '../types/api';
import { isSuccessfulApiResponse } from '../utils/typeGuards';

interface Cliente {
  id: number;
  nombre: string;
  contacto: string;
  direccion: string;
}

interface VentaDetalle {
  cuyId: number;
  peso: number;
  precioUnitario: number;
  cuy?: {
    id: number;
    raza: string;
    sexo: string;
    peso: number;
    galpon: string;
    jaula: string;
  };
}

interface Venta {
  id?: number;
  fecha: string;
  clienteId: number;
  total: number;
  estadoPago: string;
  cliente?: Cliente;
  detalles?: VentaDetalle[];
}

const initialForm: Venta = {
  fecha: new Date().toISOString().split('T')[0],
  clienteId: 0,
  total: '' as any,
  estadoPago: 'Pendiente',
};

const metodoPagoOptions = [
  'Efectivo',
  'Transferencia',
  'Tarjeta',
  'Yape',
  'Plin'
];

const estadoPagoOptions = [
  'Pendiente',
  'Pagado',
  'Cancelado'
];

const VentasTable = () => {
  const theme = useTheme();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Venta>(initialForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formErrors, setFormErrors] = useState({
    clienteId: '',
    fecha: '',
    total: '',
    estadoPago: ''
  });

  // Estados para el formulario de nuevo cliente
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    nombre: '',
    contacto: '',
    direccion: ''
  });
  const [newClientErrors, setNewClientErrors] = useState({
    nombre: '',
    contacto: '',
    direccion: ''
  });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // Estados para el selector de cuyes
  const [selectedCuyes, setSelectedCuyes] = useState<VentaDetalle[]>([]);

  // Hook para confirmación de eliminación
  const deleteConfirmation = useDeleteConfirmation({
    onDelete: async (id: number) => {
      await api.delete(`/ventas/${id}`);
      fetchVentas();
    },
    itemName: 'Venta',
    successMessage: 'Venta eliminada exitosamente'
  });

  // Validar formulario
  const validateForm = () => {
    const newErrors = {
      clienteId: '',
      fecha: '',
      total: '',
      estadoPago: ''
    };

    if (!form.clienteId || form.clienteId === 0) {
      newErrors.clienteId = 'Debe seleccionar un cliente';
    }

    if (!form.fecha) {
      newErrors.fecha = 'La fecha es obligatoria';
    } else {
      const fechaVenta = new Date(form.fecha);
      const hoy = new Date();
      if (fechaVenta > hoy) {
        newErrors.fecha = 'La fecha de venta no puede ser futura';
      }
    }

    if (!form.total || Number(form.total) <= 0) {
      newErrors.total = 'El total debe ser mayor a 0';
    }

    if (!form.estadoPago) {
      newErrors.estadoPago = 'El estado de pago es obligatorio';
    }

    setFormErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const fetchVentas = async () => {
    setLoading(true);
    try {
      const response = await api.get('/ventas');
      if (isSuccessfulApiResponse<Venta[]>(response.data)) {
        setVentas(response.data.data);
      }
    } catch (error) {
      console.error('Error al obtener ventas:', error);
      toastService.error(
        'Error al Cargar',
        'No se pudieron cargar los datos de ventas'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await api.get('/clientes');
      if (isSuccessfulApiResponse<Cliente[]>(response.data)) {
        setClientes(response.data.data);
      }
    } catch (error) {
      console.error('Error al obtener clientes:', error);
    }
  };

  // Funciones para el formulario de nuevo cliente
  const validateNewClientForm = () => {
    const newErrors = {
      nombre: '',
      contacto: '',
      direccion: ''
    };

    if (!newClientForm.nombre || newClientForm.nombre.trim() === '') {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!newClientForm.contacto || newClientForm.contacto.trim() === '') {
      newErrors.contacto = 'El contacto es obligatorio';
    }

    if (!newClientForm.direccion || newClientForm.direccion.trim() === '') {
      newErrors.direccion = 'La dirección es obligatoria';
    }

    setNewClientErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleNewClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewClientForm(prev => ({ ...prev, [name]: value }));
    
    // Validar en tiempo real
    if (newClientErrors[name as keyof typeof newClientErrors]) {
      const newErrors = { ...newClientErrors };
      if (value.trim() === '') {
        switch (name) {
          case 'nombre':
            newErrors.nombre = 'El nombre es obligatorio';
            break;
          case 'contacto':
            newErrors.contacto = 'El contacto es obligatorio';
            break;
          case 'direccion':
            newErrors.direccion = 'La dirección es obligatoria';
            break;
        }
      } else {
        newErrors[name as keyof typeof newErrors] = '';
      }
      setNewClientErrors(newErrors);
    }
  };

  const handleNewClientSubmit = async () => {
    try {
      if (!validateNewClientForm()) {
        toastService.error(
          'Error de Validación',
          'Por favor corrige los errores en el formulario'
        );
        return;
      }

      const response = await api.post('/clientes', newClientForm);
      
      // Actualizar la lista de clientes
      await fetchClientes();
      
      // Seleccionar automáticamente el nuevo cliente
      if (isSuccessfulApiResponse<Cliente>(response.data)) {
        setForm(prev => ({ ...prev, clienteId: (response.data as any).data.id }));
      }
      
      // Limpiar el formulario de nuevo cliente
      setNewClientForm({
        nombre: '',
        contacto: '',
        direccion: ''
      });
      setNewClientErrors({
        nombre: '',
        contacto: '',
        direccion: ''
      });
      
      // Cerrar el formulario de nuevo cliente
      setShowNewClientForm(false);
      
      toastService.success(
        'Cliente Agregado',
        `Cliente "${(response.data as any).data.nombre}" agregado exitosamente`
      );
      
    } catch (error: any) {
      console.error('Error al crear cliente:', error);
      toastService.error(
        'Error al Crear Cliente',
        error.response?.data?.message || 'No se pudo crear el cliente'
      );
    }
  };

  const handleNewClientCancel = () => {
    setShowNewClientForm(false);
    setNewClientForm({
      nombre: '',
      contacto: '',
      direccion: ''
    });
    setNewClientErrors({
      nombre: '',
      contacto: '',
      direccion: ''
    });
  };

  useEffect(() => {
    fetchVentas();
    fetchClientes();
  }, []);

  const handleOpen = (venta?: Venta) => {
    if (venta) {
      setForm(venta);
      setEditId(venta.id!);
    } else {
      setForm(initialForm);
      setEditId(null);
    }
    setFormErrors({
      clienteId: '',
      fecha: '',
      total: '',
      estadoPago: ''
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setForm(initialForm);
    setEditId(null);
    setSelectedCuyes([]);
    setFormErrors({
      clienteId: '',
      fecha: '',
      total: '',
      estadoPago: ''
    });
  };

  // Funciones para manejar los cuyes seleccionados
  const handleCuyesChange = (cuyes: VentaDetalle[]) => {
    setSelectedCuyes(cuyes);
  };

  const handleTotalChange = (total: number) => {
    setForm(prev => ({ ...prev, total }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name) {
      // Para campos numéricos, permitir valor vacío temporalmente
      if (name === 'total') {
        const numericValue = value === '' ? 0 : Number(value);
        setForm(prev => ({ ...prev, [name]: numericValue }));
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

  const handleSelectChange = (e: SelectChangeEvent<number | string>) => {
    const { name, value } = e.target;
    if (name) {
      setForm(prev => ({ ...prev, [name]: value }));
      
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

    // Validar que se hayan seleccionado cuyes para nuevas ventas
    if (!editId && selectedCuyes.length === 0) {
      toastService.error(
        'Error de Validación',
        'Debe seleccionar al menos un cuy para la venta'
      );
      return;
    }

    setLoading(true);
    try {
      if (editId) {
        // Para editar, solo enviamos los datos básicos de la venta
        await api.put(`/ventas/${editId}`, form);
        toastService.success(
          'Venta Actualizada',
          'Venta actualizada exitosamente'
        );
      } else {
        // Para crear, incluimos los detalles de los cuyes
        const ventaData = {
          ...form,
          detalles: selectedCuyes.map(detalle => ({
            cuyId: detalle.cuyId,
            peso: detalle.peso,
            precioUnitario: detalle.precioUnitario
          }))
        };
        
        await api.post('/ventas', ventaData);
        toastService.success(
          'Venta Creada',
          `Venta creada exitosamente con ${selectedCuyes.length} cuy${selectedCuyes.length > 1 ? 'es' : ''}`
        );
      }
      handleClose();
      fetchVentas();
    } catch (error: any) {
      console.error('Error al guardar venta:', error);
      toastService.error(
        'Error al Guardar',
        error.response?.data?.message || 'No se pudo guardar la venta'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    deleteConfirmation.handleDeleteClick(id);
  };

  // Funciones para selección múltiple
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = ventas.map((n) => n.id!);
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

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>, id: number) => {
    handleClick(event as any, id);
  };

  // Funciones para acciones en lote
  const handleBulkDelete = async () => {
    setBulkActionLoading(true);
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/ventas/${id}`)));
      toastService.success(
        'Eliminación Exitosa',
        `${selectedIds.length} ventas eliminadas exitosamente`
      );
      setSelectedIds([]);
      setShowBulkActions(false);
      fetchVentas();
    } catch (err: unknown) {
      console.error('Error al eliminar ventas:', err);
      toastService.error(
        'Error al Eliminar',
        'No se pudieron eliminar algunas ventas'
      );
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkChangeStatus = async (newStatus: string) => {
    setBulkActionLoading(true);
    try {
      await Promise.all(
        selectedIds.map(id => 
          api.patch(`/ventas/${id}`, { estadoPago: newStatus })
        )
      );
      toastService.success(
        'Cambio Exitoso',
        `Estado de ${selectedIds.length} ventas actualizado a ${newStatus}`
      );
      setSelectedIds([]);
      setShowBulkActions(false);
      fetchVentas();
    } catch (err: unknown) {
      console.error('Error al cambiar estado:', err);
      toastService.error(
        'Error al Cambiar Estado',
        'No se pudo cambiar el estado de algunas ventas'
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

  const getEstadoColor = (estadoPago: string): MuiColor => {
    switch (estadoPago) {
      case 'Pagado':
        return 'success';
      case 'Pendiente':
        return 'warning';
      case 'Cancelado':
        return 'error';
      default:
        return 'default';
    }
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
          <ShoppingCart sx={{ mr: 1, verticalAlign: 'middle' }} />
          Gestión de Ventas
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
          sx={{ 
            bgcolor: '#4caf50',
            '&:hover': { bgcolor: '#45a049' }
          }}
        >
          Nueva Venta
        </Button>
      </Box>

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
            {selectedIds.length} venta{selectedIds.length !== 1 ? 's' : ''} seleccionada{selectedIds.length !== 1 ? 's' : ''}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Marcar como Pagado">
              <IconButton
                size="small"
                onClick={() => handleBulkChangeStatus('Pagado')}
                disabled={bulkActionLoading}
                color="success"
              >
                <Check />
              </IconButton>
            </Tooltip>
            <Tooltip title="Marcar como Pendiente">
              <IconButton
                size="small"
                onClick={() => handleBulkChangeStatus('Pendiente')}
                disabled={bulkActionLoading}
                color="warning"
              >
                <AttachMoney />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar seleccionadas">
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

      <Paper elevation={3}>
        <TableContainer sx={{
          overflowX: 'auto',
          maxWidth: { xs: 'calc(100vw - 32px)', sm: '100%' }
        }}>
          <Table sx={{ minWidth: { xs: 650, sm: 900 } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selectedIds.length > 0 && selectedIds.length < ventas.length}
                    checked={ventas.length > 0 && selectedIds.length === ventas.length}
                    onChange={handleSelectAllClick}
                    inputProps={{ 'aria-label': 'Seleccionar todas las ventas' }}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cuyes</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado Pago</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ventas
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((venta) => {
                  const isSelected = selectedIds.indexOf(venta.id!) !== -1;
                  return (
                    <TableRow 
                      key={venta.id} 
                      hover
                      selected={isSelected}
                      onClick={(event) => handleClick(event, venta.id!)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isSelected}
                          onChange={(event) => handleCheckboxChange(event, venta.id!)}
                          inputProps={{ 'aria-label': `Seleccionar venta ${venta.id}` }}
                        />
                      </TableCell>
                      <TableCell>{venta.id}</TableCell>
                      <TableCell>{venta.cliente?.nombre || 'N/A'}</TableCell>
                      <TableCell>{new Date(venta.fecha).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {venta.detalles && venta.detalles.length > 0 ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {venta.detalles.map((detalle, index) => (
                              <Chip
                                key={index}
                                label={`Cuy #${detalle.cuyId} (${detalle.peso}kg)`}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            ))}
                            <Typography variant="caption" color="text.secondary">
                              {venta.detalles.length} cuy{venta.detalles.length > 1 ? 'es' : ''}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Sin detalles
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>S/ {Number(venta.total).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={venta.estadoPago}
                          color={getEstadoColor(venta.estadoPago)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpen(venta)}
                            sx={{ color: '#1976d2' }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(venta.id!)}
                            sx={{ color: '#d32f2f' }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>

        {ventas.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              No hay ventas registradas
            </Typography>
          </Box>
        )}

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={ventas.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
        />
      </Paper>

      {/* Dialog para crear/editar venta */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCart color="primary" />
            <Typography variant="h6">
              {editId ? 'Editar Venta' : 'Nueva Venta'}
            </Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <FormControl fullWidth variant="outlined" size="small" error={!!formErrors.clienteId}>
                  <InputLabel>Cliente *</InputLabel>
                  <Select
                    name="clienteId"
                    value={form.clienteId}
                    onChange={handleSelectChange}
                    label="Cliente *"
                    required
                  >
                    <MenuItem value={0}>
                      <em>-- Seleccionar cliente --</em>
                    </MenuItem>
                    {clientes.map((cliente) => (
                      <MenuItem key={cliente.id} value={cliente.id}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                          <Typography variant="body1" fontWeight={500}>
                            {cliente.nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {cliente.contacto} - {cliente.direccion}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.clienteId && <FormHelperText>{formErrors.clienteId}</FormHelperText>}
                </FormControl>
                <Tooltip title="Agregar nuevo cliente">
                  <IconButton
                    onClick={() => setShowNewClientForm(true)}
                    sx={{
                      mt: 0.5,
                      color: theme.palette.primary.main,
                      border: `2px solid ${theme.palette.primary.main}`,
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      }
                    }}
                  >
                    <PersonAdd />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Total de la Venta"
                name="total"
                type="number"
                value={form.total === 0 ? '' : form.total}
                onChange={handleChange}
                required
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Ej: 150.00"
                error={!!formErrors.total}
                helperText={formErrors.total}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth variant="outlined" size="small" error={!!formErrors.estadoPago}>
                <InputLabel>Estado de Pago</InputLabel>
                <Select
                  name="estadoPago"
                  value={form.estadoPago}
                  onChange={handleSelectChange}
                  label="Estado de Pago"
                  required
                >
                  {estadoPagoOptions.map((estado) => (
                    <MenuItem key={estado} value={estado}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FiberManualRecord 
                          fontSize="small" 
                          sx={{ color: getEstadoColor(estado) === 'success' ? '#4caf50' : 
                                      getEstadoColor(estado) === 'warning' ? '#ff9800' : '#f44336' }} 
                        />
                        {estado}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.estadoPago && <FormHelperText>{formErrors.estadoPago}</FormHelperText>}
              </FormControl>
            </Grid>
            
            {/* Selector de cuyes - solo para nuevas ventas */}
            {!editId && (
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
                <CuySelector
                  selectedCuyes={selectedCuyes as any}
                  onCuyesChange={handleCuyesChange}
                  onTotalChange={handleTotalChange}
                />
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
            {loading ? 'Guardando...' : (editId ? 'Guardar' : 'Crear')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para agregar nuevo cliente */}
      <Dialog
        open={showNewClientForm}
        onClose={handleNewClientCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
            overflowY: 'auto'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAdd color="primary" />
            <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
              Agregar Nuevo Cliente
            </Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Nombre del Cliente *"
                name="nombre"
                value={newClientForm.nombre}
                onChange={handleNewClientChange}
                required
                fullWidth
                variant="outlined"
                size="small"
                error={!!newClientErrors.nombre}
                helperText={newClientErrors.nombre}
                placeholder="Ej: Juan Pérez"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Contacto *"
                name="contacto"
                value={newClientForm.contacto}
                onChange={handleNewClientChange}
                required
                fullWidth
                variant="outlined"
                size="small"
                error={!!newClientErrors.contacto}
                helperText={newClientErrors.contacto}
                placeholder="Ej: 987654321 o juan@email.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Dirección *"
                name="direccion"
                value={newClientForm.direccion}
                onChange={handleNewClientChange}
                required
                fullWidth
                variant="outlined"
                size="small"
                error={!!newClientErrors.direccion}
                helperText={newClientErrors.direccion}
                placeholder="Ej: Av. Principal 123, Lima"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <HomeWork fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleNewClientCancel} 
            startIcon={<Close />} 
            variant="outlined"
            color="inherit"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleNewClientSubmit} 
            startIcon={<Check />}
            variant="contained"
            sx={{ 
              bgcolor: '#4caf50',
              '&:hover': { bgcolor: '#45a049' }
            }}
          >
            Agregar Cliente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDeleteDialog
        open={deleteConfirmation.confirmOpen}
        onClose={deleteConfirmation.handleCancelDelete}
        onConfirm={deleteConfirmation.handleConfirmDelete}
        itemName="venta"
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

export default VentasTable;
