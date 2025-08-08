import { useEffect, useState } from 'react';
import api from '../services/api';
import toastService from '../services/toastService';
import { useDeleteConfirmation } from '../hooks/useDeleteConfirmation';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import { isSuccessfulApiResponse } from '../utils/typeGuards';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton,
  Box, Tooltip, MenuItem, Select, FormControl, InputLabel, Chip, Divider, Alert,
  useTheme, alpha, CircularProgress, TablePagination, Grid, Zoom, InputAdornment,
  Checkbox, Toolbar, Slide, Fab
} from '../utils/mui';

// Definir SelectChangeEvent directamente en este archivo
interface SelectChangeEvent<T = unknown> {
  target: {
    value: T;
    name?: string;
  };
}
import { 
  Add, Edit, Delete, Healing, LocalHospital, Close, Save, 
  Pets, CalendarToday, Person, MedicationLiquid, Medication, 
  Science, AccessTime, FiberManualRecord, DeleteSweep, SelectAll,
  CheckBox, CheckBoxOutlineBlank
} from '@mui/icons-material';
import { formDialogStyles, formControlStyles } from '../theme/SimpleLayoutStyles';

interface HistorialSalud {
  id?: number;
  cuyId: number;
  tipo: string;
  fecha: string;
  descripcion: string;
  veterinario: string;
  medicamento?: string;
  dosis?: string;
  duracion?: string;
}

// Interfaz para el diálogo de confirmación - Ya no se usa, usamos el componente global
/*
interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

// Componente de diálogo de confirmación - Ya no se usa, usamos el componente global
const ConfirmDeleteDialog = ({ open, onClose, onConfirm, title, message }: ConfirmDeleteDialogProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ 
        sx: {
          borderRadius: 3,
          padding: 1,
          maxWidth: '400px'
        } 
      }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body1">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          color="inherit"
          startIcon={<Close />}
          sx={{ borderRadius: 2 }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="error"
          startIcon={<Delete />}
          sx={{ borderRadius: 2 }}
        >
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
*/

const initialForm: HistorialSalud = {
  cuyId: 0,
  tipo: '',
  fecha: '',
  descripcion: '',
  veterinario: '',
  medicamento: '',
  dosis: '',
  duracion: '',
};

// Opciones para el tipo de registro
const tipoOptions = [
  'Chequeo rutinario',
  'Tratamiento',
  'Vacunación',
  'Desparasitación',
  'Cirugía',
  'Emergencia',
  'Otro'
];

const SaludTable = () => {
  const theme = useTheme();
  const [registros, setRegistros] = useState<HistorialSalud[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<HistorialSalud>(initialForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [cuyesOptions, setCuyesOptions] = useState<any[]>([]);
  const [formErrors, setFormErrors] = useState({
    cuyId: '',
    tipo: '',
    fecha: '',
    descripcion: '',
    veterinario: ''
  });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Hook para confirmación de eliminación
  const deleteConfirmation = useDeleteConfirmation({
    onDelete: async (id: number) => {
      await api.delete(`/salud/${id}`);
      fetchRegistros();
    },
    itemName: 'Registro de Salud',
    successMessage: 'Registro eliminado exitosamente'
  });

  const fetchRegistros = () => {
    setLoading(true);
    api.get('/salud')
      .then(res => {
        // Asegurarse de que los datos están formateados correctamente
        if (isSuccessfulApiResponse<any[]>(res.data)) {
          const formattedData = res.data.data.map((registro: any) => ({
            ...registro,
            cuyId: Number(registro.cuyId),
            fecha: registro.fecha // La fecha ya viene en formato ISO desde el backend
          }));
          setRegistros(formattedData);
          setError(null);
        }
      })
      .catch(err => {
        console.error("Error al cargar registros de salud:", err);
        setError("No se pudieron cargar los registros de salud. Por favor, intenta de nuevo.");
      })
      .catch(() => {})
      .then(() => {
        setLoading(false);
      });
  };

  const fetchCuyes = async () => {
    try {
      const response = await api.get('/cuyes');
      if (isSuccessfulApiResponse<any[]>(response.data)) {
        setCuyesOptions(response.data.data);
      }
    } catch (err) {
      console.error("Error al cargar lista de cuyes:", err);
    }
  };

  useEffect(() => {
    fetchRegistros();
  }, []);

  useEffect(() => {
    // Esta parte es solo para manejar el caso donde un cuy es eliminado pero todavía hay referencias
    if (cuyesOptions.length > 0 && form.cuyId > 0 && !cuyesOptions.find(c => c.id === form.cuyId)) {
      setForm(prev => ({ ...prev, cuyId: 0 }));
    }
  }, [cuyesOptions, form.cuyId]);

  // Función para validar campos individuales
  const validateField = (name: string, value: any) => {
    let error = '';
    
    switch (name) {
      case 'cuyId':
        if (!value || value <= 0) {
          error = 'Debe seleccionar un cuy';
        }
        break;
      case 'tipo':
        if (!value || value.trim() === '') {
          error = 'El tipo de registro es obligatorio';
        }
        break;
      case 'fecha':
        if (!value || value.trim() === '') {
          error = 'La fecha es obligatoria';
        }
        break;
      case 'descripcion':
        if (!value || value.trim() === '') {
          error = 'La descripción es obligatoria';
        }
        break;
      case 'veterinario':
        if (!value || value.trim() === '') {
          error = 'El nombre del veterinario es obligatorio';
        }
        break;
    }
    
    setFormErrors({ ...formErrors, [name]: error });
    return error;
  };

  // Validar todo el formulario
  const validateForm = () => {
    const errors = {
      cuyId: validateField('cuyId', form.cuyId),
      tipo: validateField('tipo', form.tipo),
      fecha: validateField('fecha', form.fecha),
      descripcion: validateField('descripcion', form.descripcion),
      veterinario: validateField('veterinario', form.veterinario)
    };
    
    setFormErrors(errors);
    
    // Retornar true si no hay errores
    return !Object.values(errors).some(error => error !== '');
  };

  const handleOpen = (registro?: HistorialSalud) => {
    // Cargar lista de cuyes al abrir el modal
    fetchCuyes();
    
    if (registro) {
      // Convertir la fecha para el input date (formato YYYY-MM-DD)
      const fechaFormatted = typeof registro.fecha === 'string' 
        ? registro.fecha.split('T')[0] 
        : new Date(registro.fecha).toISOString().split('T')[0];
      
      setForm({
        ...registro,
        cuyId: Number(registro.cuyId), // Asegurar que cuyId es número
        fecha: fechaFormatted
      });
      setEditId(registro.id!);
    } else {
      setForm({
        ...initialForm,
        fecha: new Date().toISOString().split('T')[0] // Fecha actual por defecto
      });
      setEditId(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setForm(initialForm);
    setEditId(null);
    setFormErrors({
      cuyId: '',
      tipo: '',
      fecha: '',
      descripcion: '',
      veterinario: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Validar el campo en tiempo real
    if (formErrors[name as keyof typeof formErrors]) {
      validateField(name, value);
    }
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Validar el campo en tiempo real
    if (formErrors[name as keyof typeof formErrors]) {
      validateField(name, value);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Validar formulario
      const isValid = validateForm();
      if (!isValid) {
        toastService.error(
          'Error de Validación',
          'Por favor corrige los errores en el formulario'
        );
        setSubmitting(false);
        return;
      }

      // Preparar los datos para enviar al backend
      const formData = {
        ...form,
        cuyId: Number(form.cuyId) // Asegurar que cuyId es un número
      };

      if (editId) {
        await api.put(`/salud/${editId}`, formData);
        toastService.success(
          'Registro Actualizado',
          'Registro de salud actualizado correctamente'
        );
      } else {
        await api.post('/salud', formData);
        toastService.success(
          'Registro Añadido',
          'Registro de salud añadido correctamente'
        );
      }
      fetchRegistros();
      handleClose();
    } catch (err: any) {
      console.error("Error al guardar el registro:", err);
      const errorMsg = err.response?.data?.message || "No se pudo guardar el registro. Por favor, verifica los datos e intenta de nuevo.";
      toastService.error(
        'Error al Guardar',
        errorMsg
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    deleteConfirmation.handleDeleteClick(id);
  };

  // Funciones para selección múltiple
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = registros.map((n) => n.id!);
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
      await Promise.all(selectedIds.map(id => api.delete(`/salud/${id}`)));
      toastService.success(
        'Eliminación Exitosa',
        `${selectedIds.length} registros de salud eliminados exitosamente`
      );
      setSelectedIds([]);
      setShowBulkActions(false);
      fetchRegistros();
    } catch (err: unknown) {
      console.error('Error al eliminar registros:', err);
      toastService.error(
        'Error al Eliminar',
        'No se pudieron eliminar algunos registros'
      );
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Función para obtener el color según el tipo de registro
  const getTipoColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'chequeo rutinario':
        return theme.palette.info.main;
      case 'tratamiento':
        return theme.palette.warning.main;
      case 'vacunación':
        return theme.palette.success.main;
      case 'desparasitación':
        return theme.palette.primary.main;
      case 'cirugía':
        return theme.palette.error.main;
      case 'emergencia':
        return theme.palette.error.dark;
      default:
        return theme.palette.secondary.main;
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
          <Healing 
            color="primary" 
            sx={{ 
              fontSize: '2rem',
              p: 0.8,
              borderRadius: '50%',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
            }} 
          />
          <Typography variant="h6" fontWeight={600} color="text.primary">Historial de Salud</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => handleOpen()}
          sx={{ 
            borderRadius: 8,
            textTransform: 'none',
            px: 3,
            py: 1.2,
            boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              boxShadow: (theme) => `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          Agregar Registro
        </Button>
      </Box>

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
                {selectedIds.length} registro{selectedIds.length !== 1 ? 's' : ''} de salud seleccionado{selectedIds.length !== 1 ? 's' : ''}
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

          <TableContainer 
            sx={{ 
              flex: 1, 
              overflowY: 'auto',
              overflowX: 'auto', // Scroll horizontal para móvil 
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
            }}
          >
            <Table stickyHeader sx={{ minWidth: { xs: 650, sm: 850 } }}>
              <TableHead>
                <TableRow sx={{ 
                  '& th': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    py: 2,
                    color: 'text.primary'
                  }
                }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      indeterminate={selectedIds.length > 0 && selectedIds.length < registros.length}
                      checked={registros.length > 0 && selectedIds.length === registros.length}
                      onChange={handleSelectAllClick}
                      sx={{ p: 0.5 }}
                    />
                  </TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Cuy ID</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Veterinario</TableCell>
                  <TableCell>Medicamento</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(rowsPerPage > 0
                  ? registros.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : registros
                ).map(r => {
                  const isSelected = selectedIds.indexOf(r.id!) !== -1;
                  return (
                    <TableRow 
                      key={r.id} 
                      hover
                      selected={isSelected}
                      sx={{
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                          '& .action-icons': {
                            opacity: 1,
                          }
                        },
                        '&:nth-of-type(even)': {
                          bgcolor: (theme) => alpha(theme.palette.background.default, 0.5)
                        }
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isSelected}
                          onChange={(e) => handleCheckboxChange(e, r.id!)}
                          sx={{ p: 0.5 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{r.id}</TableCell>
                      <TableCell>{r.cuyId}</TableCell>
                      <TableCell>
                        <Chip 
                          label={r.tipo} 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha(getTipoColor(r.tipo), 0.1),
                            color: getTipoColor(r.tipo),
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: (theme) => `1px solid ${alpha(getTipoColor(r.tipo), 0.3)}`,
                            px: 1
                          }} 
                        />
                      </TableCell>
                      <TableCell>{new Date(r.fecha).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}</TableCell>
                      <TableCell sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.descripcion}
                      </TableCell>
                      <TableCell>{r.veterinario}</TableCell>
                      <TableCell>{r.medicamento || '—'}</TableCell>
                      <TableCell>
                        <Box className="action-icons" sx={{ opacity: { xs: 1, sm: 0.6 }, transition: 'opacity 0.2s' }}>
                          <Tooltip title="Editar" TransitionComponent={Zoom}>
                            <IconButton 
                              color="primary" 
                              onClick={() => handleOpen(r)} 
                              size="small"
                              sx={{
                                boxShadow: (theme) => `0 0 0 1px ${alpha(theme.palette.primary.main, 0.15)}`,
                                mr: 0.5,
                                '&:hover': { transform: 'translateY(-2px)' }
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar" TransitionComponent={Zoom}>
                            <IconButton 
                              color="error" 
                              onClick={() => handleDelete(r.id!)} 
                              size="small"
                              sx={{
                                boxShadow: (theme) => `0 0 0 1px ${alpha(theme.palette.error.main, 0.15)}`,
                                '&:hover': { transform: 'translateY(-2px)' }
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {registros.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <LocalHospital sx={{ fontSize: 60, color: (theme) => alpha(theme.palette.primary.main, 0.3) }} />
                        <Typography variant="h6" color="textSecondary" fontWeight={500}>
                          No hay registros de salud
                        </Typography>
                        <Typography color="textSecondary" variant="body2">
                          Agrega un nuevo registro usando el botón "Nuevo Registro" arriba
                        </Typography>
                        <Button 
                          variant="outlined" 
                          color="primary" 
                          startIcon={<Add />}
                          onClick={() => setOpen(true)}
                          sx={{ mt: 1, borderRadius: 8, px: 3 }}
                        >
                          Nuevo Registro
                        </Button>
                      </Box>
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
            count={registros.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </>
      )}

      {/* Formulario modal */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md"
        fullWidth
        PaperProps={{ 
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
            overflowY: 'auto',
            m: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 32px)', md: '800px' }
          } 
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalHospital color="primary" />
            {editId ? 'Editar Registro de Salud' : 'Agregar Registro de Salud'}
          </Typography>
        </DialogTitle>
        
        <Divider />
        
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2.5}>
            {/* Primera fila: ID del cuy y Fecha */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" size="small" error={!!formErrors.cuyId}>
                <InputLabel id="cuy-label">Cuy *</InputLabel>
                <Select
                  labelId="cuy-label"
                  name="cuyId"
                  value={form.cuyId || ''}
                  onChange={(e) => {
                    setForm(prev => ({ ...prev, cuyId: Number(e.target.value) }));
                    // Validar en tiempo real
                    if (formErrors.cuyId) {
                      validateField('cuyId', Number(e.target.value));
                    }
                  }}
                  label="Cuy *"
                  required
                  startAdornment={
                    <InputAdornment position="start">
                      <Pets fontSize="small" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="" disabled>
                    <em>Selecciona un cuy</em>
                  </MenuItem>
                  {cuyesOptions.map((cuy) => (
                    <MenuItem key={cuy.id} value={cuy.id}>
                      ID: {cuy.id} - {cuy.raza} ({cuy.sexo === 'M' ? 'Macho' : 'Hembra'})
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.cuyId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                    {formErrors.cuyId}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Fecha *" 
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
            
            {/* Segunda fila: Tipo y Veterinario */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" size="small" error={!!formErrors.tipo}>
                <InputLabel id="tipo-label">Tipo de Registro *</InputLabel>
                <Select
                  labelId="tipo-label"
                  name="tipo"
                  value={form.tipo}
                  onChange={handleSelectChange}
                  label="Tipo de Registro *"
                  required
                  startAdornment={
                    <InputAdornment position="start">
                      <LocalHospital fontSize="small" />
                    </InputAdornment>
                  }
                >
                  {tipoOptions.map(option => (
                    <MenuItem key={option} value={option}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        color: getTipoColor(option)
                      }}>
                        <FiberManualRecord fontSize="small" />
                        {option}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.tipo && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                    {formErrors.tipo}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Veterinario *" 
                name="veterinario" 
                value={form.veterinario} 
                onChange={handleChange} 
                required 
                fullWidth
                variant="outlined"
                size="small"
                error={!!formErrors.veterinario}
                helperText={formErrors.veterinario}
                placeholder="Nombre del veterinario"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* Descripción - campo más ancho */}
            <Grid item xs={12}>
              <TextField 
                label="Descripción *" 
                name="descripcion" 
                value={form.descripcion} 
                onChange={handleChange} 
                required 
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                size="small"
                error={!!formErrors.descripcion}
                helperText={formErrors.descripcion}
                placeholder="Describe detalladamente el motivo de la atención, síntomas observados y acciones tomadas"
              />
            </Grid>
            
            {/* Medicamento y Dosis */}
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Medicamento" 
                name="medicamento" 
                value={form.medicamento} 
                onChange={handleChange} 
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Ej: Enrofloxacina, Ivermectina"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Medication fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Dosis" 
                name="dosis" 
                value={form.dosis} 
                onChange={handleChange} 
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Ej: 0.5ml/kg, 2 tabletas/día"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Science fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* Duración */}
            <Grid item xs={12}>
              <TextField 
                label="Duración del tratamiento" 
                name="duracion" 
                value={form.duracion} 
                onChange={handleChange} 
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Ej: 5 días, 1 semana, Hasta el 15/05/2023"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccessTime fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleClose}
            startIcon={<Close />}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            startIcon={editId ? <Edit /> : <Add />}
            sx={{ borderRadius: 2 }}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                {editId ? 'Guardando...' : 'Agregando...'}
              </>
            ) : (
              editId ? 'Guardar Cambios' : 'Agregar Registro'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDeleteDialog
        open={deleteConfirmation.confirmOpen}
        onClose={deleteConfirmation.handleCancelDelete}
        onConfirm={deleteConfirmation.handleConfirmDelete}
        itemName="registro de salud"
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

export default SaludTable;
