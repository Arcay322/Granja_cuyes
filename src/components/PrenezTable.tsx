import React, { useState, useEffect } from 'react';
import toastService from '../services/toastService';
import { useDeleteConfirmation } from '../hooks/useDeleteConfirmation';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import { 
  Box, Typography, Grid, Paper, Button, TextField, Modal, 
  IconButton, FormControl, InputLabel, FormHelperText, Tooltip,
  Select, MenuItem, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TablePagination, Chip, alpha, useTheme,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Checkbox, Toolbar, Slide, Fab, CircularProgress
} from '../utils/mui';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  Pets as PetsIcon,
  Warning as WarningIcon,
  NotificationsActive as NotificationIcon,
  CalendarMonth as CalendarIcon,
  DeleteSweep, SelectAll, CheckBox, CheckBoxOutlineBlank, Close
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import api from '../services/api';
import { es } from 'date-fns/locale/es';
import { addDays, differenceInDays, format } from 'date-fns';

// Estilo global para los labels de Material UI
const LABEL_STYLE = {
  fontSize: '16px',
  fontWeight: 'normal',
  width: 'auto',
  overflow: 'visible',
  whiteSpace: 'nowrap', 
  textOverflow: 'clip',
  maxWidth: 'none',
  '&.MuiInputLabel-root': {
    textOverflow: 'initial'
  }
};

const PrenezTable = () => {
  const [preneces, setPreneces] = useState<any[]>([]);
  const [cuyes, setCuyes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentPrenez, setCurrentPrenez] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    madreId: '',
    padreId: '',
    fechaPrenez: new Date(),
    fechaProbableParto: addDays(new Date(), 70), // Por defecto 70 días después
    notas: '',
    estado: 'activa'
  });
  const [errors, setErrors] = useState({
    madreId: '',
    fechaPrenez: '',
    fechaProbableParto: ''
  });
  const [camadaErrors, setCamadaErrors] = useState({
    fechaNacimiento: '',
    numVivos: '',
    numMuertos: ''
  });
  const [camadaFormOpen, setCamadaFormOpen] = useState(false);
  const [camadaForm, setCamadaForm] = useState({
    fechaNacimiento: new Date(),
    numVivos: 0,
    numMuertos: 0,
    prenezId: null as number | null
  });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Hook para confirmación de eliminación
  const deleteConfirmation = useDeleteConfirmation({
    onDelete: async (id: number) => {
      await api.delete(`/reproduccion/prenez/${id}`);
      fetchPreneces();
    },
    itemName: 'Preñez',
    successMessage: 'Preñez eliminada exitosamente'
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchPreneces();
    fetchCuyes();
  }, []);

  // Obtener preñeces desde la API
  const fetchPreneces = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reproduccion/prenez');
      setPreneces(response.data);
    } catch (error) {
      console.error('Error al obtener preñeces:', error);
      toastService.error(
        'Error al Cargar',
        'No se pudieron cargar los datos de preñez'
      );
    } finally {
      setLoading(false);
    }
  };

  // Obtener cuyes desde la API
  const fetchCuyes = async () => {
    try {
      const response = await api.get('/cuyes');
      setCuyes(response.data);
    } catch (error) {
      console.error('Error al obtener cuyes:', error);
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {
      madreId: '',
      fechaPrenez: '',
      fechaProbableParto: ''
    };

    if (!formData.madreId) {
      newErrors.madreId = 'Debe seleccionar una madre';
    }

    if (!formData.fechaPrenez) {
      newErrors.fechaPrenez = 'Debe seleccionar una fecha de preñez';
    }

    if (!formData.fechaProbableParto) {
      newErrors.fechaProbableParto = 'Debe seleccionar una fecha probable de parto';
    }

    // Validar que la fecha probable de parto sea posterior a la fecha de preñez
    if (formData.fechaPrenez && formData.fechaProbableParto) {
      const prenezDate = new Date(formData.fechaPrenez);
      const partoDate = new Date(formData.fechaProbableParto);
      if (partoDate <= prenezDate) {
        newErrors.fechaProbableParto = 'La fecha de parto debe ser posterior a la fecha de preñez';
      }
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  // Validar formulario de camada
  const validateCamadaForm = () => {
    const newErrors = {
      fechaNacimiento: '',
      numVivos: '',
      numMuertos: ''
    };

    if (!camadaForm.fechaNacimiento) {
      newErrors.fechaNacimiento = 'Debe seleccionar una fecha de nacimiento';
    }

    // Convertir a números para validación
    const numVivos = Number(camadaForm.numVivos);
    const numMuertos = Number(camadaForm.numMuertos);

    if (camadaForm.numVivos === '' || numVivos < 0) {
      newErrors.numVivos = 'Debe ingresar un número válido de cuyes vivos (mínimo 0)';
    }

    if (camadaForm.numMuertos === '' || numMuertos < 0) {
      newErrors.numMuertos = 'Debe ingresar un número válido de cuyes muertos (mínimo 0)';
    }

    if (numVivos === 0 && numMuertos === 0) {
      newErrors.numVivos = 'Debe haber al menos un cuy (vivo o muerto) en la camada';
      newErrors.numMuertos = 'Debe haber al menos un cuy (vivo o muerto) en la camada';
    }

    setCamadaErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  // Abrir modal para crear
  const handleCreate = () => {
    setModalMode('create');
    setFormData({
      madreId: '',
      padreId: '',
      fechaPrenez: new Date(),
      fechaProbableParto: addDays(new Date(), 70),
      notas: '',
      estado: 'activa'
    });
    setCurrentPrenez(null);
    setErrors({
      madreId: '',
      fechaPrenez: '',
      fechaProbableParto: ''
    });
    setCamadaErrors({
      fechaNacimiento: '',
      numVivos: '',
      numMuertos: ''
    });
    setOpen(true);
  };

  // Abrir modal para editar
  const handleEdit = (id: number) => {
    const prenez = preneces.find(p => p.id === id);
    if (prenez) {
      setModalMode('edit');
      setFormData({
        madreId: prenez.madreId || '',
        padreId: prenez.padreId || '',
        fechaPrenez: new Date(prenez.fechaPrenez),
        fechaProbableParto: new Date(prenez.fechaProbableParto),
        notas: prenez.notas || '',
        estado: prenez.estado
      });
      setCurrentPrenez(prenez);
      setOpen(true);
    }
  };

  // Eliminar preñez
  const handleDelete = (id: number) => {
    deleteConfirmation.handleDeleteClick(id);
  };

  // Confirmar marcar como fallida
  const handleConfirmFallida = async (id: number) => {
    try {
      await api.post(`/reproduccion/prenez/${id}/fallida`);
      toastService.info(
        'Preñez Fallida',
        'Preñez marcada como fallida'
      );
      fetchPreneces();
    } catch (error) {
      console.error('Error al marcar como fallida:', error);
      toastService.error(
        'Error',
        'No se pudo marcar la preñez como fallida'
      );
    }
  };

  // Registrar camada
  const handleRegistrarCamada = (id: number) => {
    setCamadaForm({
      fechaNacimiento: new Date(),
      numVivos: 0,
      numMuertos: 0,
      prenezId: id
    });
    setCamadaErrors({
      fechaNacimiento: '',
      numVivos: '',
      numMuertos: ''
    });
    setCamadaFormOpen(true);
  };

  // Manejar cambio de fecha de camada
  const handleCamadaDateChange = (date: Date | null) => {
    if (date) {
      setCamadaForm(prev => ({ ...prev, fechaNacimiento: date }));
      
      // Limpiar error del campo
      if (camadaErrors.fechaNacimiento) {
        setCamadaErrors(prev => ({
          ...prev,
          fechaNacimiento: ''
        }));
      }
    }
  };

  // Manejar cambio de datos del formulario de camada
  const handleCamadaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Para campos numéricos, permitir valor vacío temporalmente
    if (name === 'numVivos' || name === 'numMuertos') {
      // Si el valor está vacío, mantenerlo como string vacío
      // Si tiene valor, convertir a número
      const numericValue = value === '' ? '' : Number(value);
      setCamadaForm(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setCamadaForm(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Limpiar error del campo específico
    if (camadaErrors[name as keyof typeof camadaErrors]) {
      setCamadaErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Guardar camada
  const handleSaveCamada = async () => {
    if (!validateCamadaForm()) return;

    try {
      const camadaDataToSend = {
        ...camadaForm,
        numVivos: Number(camadaForm.numVivos),
        numMuertos: Number(camadaForm.numMuertos)
      };
      
      const camadaResponse = await api.post('/reproduccion/camadas', camadaDataToSend);
      // Actualizar la preñez con el ID de la camada
      await api.put(`/reproduccion/prenez/${camadaForm.prenezId}`, {
        camadaId: camadaResponse.data.id
      });
      toastService.success(
        'Camada Registrada',
        'Camada registrada exitosamente'
      );
      setCamadaFormOpen(false);
      // Reset form
      setCamadaForm({
        fechaNacimiento: new Date(),
        numVivos: 0,
        numMuertos: 0,
        prenezId: null
      });
      setCamadaErrors({
        fechaNacimiento: '',
        numVivos: '',
        numMuertos: ''
      });
      fetchPreneces();
    } catch (error) {
      console.error('Error al registrar camada:', error);
      toastService.error(
        'Error al Registrar',
        'No se pudo registrar la camada'
      );
    }
  };

  // Manejar cambio de datos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      // Limpiar error del campo
      if (errors[name as keyof typeof errors]) {
        setErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    }
  };

  // Manejar cambio de fecha
  const handleDateChange = (field: string) => (date: Date | null) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        [field]: date,
        // Si cambia la fecha de preñez, actualizar automáticamente la fecha probable de parto
        ...(field === 'fechaPrenez' && { fechaProbableParto: addDays(date, 70) })
      }));
      
      // Limpiar error del campo
      if (errors[field as keyof typeof errors]) {
        setErrors(prev => ({
          ...prev,
          [field]: ''
        }));
      }
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (modalMode === 'create') {
        await api.post('/reproduccion/prenez', formData);
        toastService.success(
          'Preñez Creada',
          'Preñez creada exitosamente'
        );
      } else {
        await api.put(`/reproduccion/prenez/${currentPrenez.id}`, formData);
        toastService.success(
          'Preñez Actualizada',
          'Preñez actualizada exitosamente'
        );
      }
      setOpen(false);
      fetchPreneces();
    } catch (error) {
      console.error('Error al guardar preñez:', error);
      toastService.error(
        'Error al Guardar',
        'No se pudo guardar la preñez'
      );
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de página
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Manejar cambio de filas por página
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Obtener información del estado de la preñez
  const getEstadoInfo = (estado: string, fechaProbableParto: string) => {
    const today = new Date();
    const fechaParto = new Date(fechaProbableParto);
    const diasRestantes = differenceInDays(fechaParto, today);
    
    switch (estado) {
      case 'activa':
        if (diasRestantes < 0) {
          return {
            label: 'Vencida',
            color: 'error' as const,
            icon: <WarningIcon fontSize="small" />
          };
        } else if (diasRestantes <= 7) {
          return {
            label: `${diasRestantes} días`,
            color: 'warning' as const,
            icon: <NotificationIcon fontSize="small" />
          };
        } else {
          return {
            label: `${diasRestantes} días`,
            color: 'primary' as const,
            icon: <CalendarIcon fontSize="small" />
          };
        }
      case 'finalizada':
        return {
          label: 'Finalizada',
          color: 'success' as const,
          icon: <CheckIcon fontSize="small" />
        };
      case 'fallida':
        return {
          label: 'Fallida',
          color: 'error' as const,
          icon: <CancelIcon fontSize="small" />
        };
      default:
        return {
          label: estado,
          color: 'default' as const,
          icon: null
        };
    }
  };

  // Obtener cuyes disponibles para reproducción (hembras para madres)
  const getCuyesDisponibles = (tipo: 'madre' | 'padre') => {
    return cuyes.filter(cuy => 
      tipo === 'madre' ? cuy.sexo === 'H' : cuy.sexo === 'M'
    );
  };

  // Buscar nombre del cuy por ID (mismo formato que CamadasTable)
  const getCuyNameById = (id: number | string) => {
    const cuy = cuyes.find(c => c.id === Number(id));
    return cuy ? `${cuy.raza} #${cuy.id} (G: ${cuy.galpon}, J: ${cuy.jaula})` : 'N/A';
  };

  // Funciones para selección múltiple
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = preneces.map((n) => n.id!);
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
      await Promise.all(selectedIds.map(id => api.delete(`/prenez/${id}`)));
      toastService.success(
        'Eliminación Exitosa',
        `${selectedIds.length} preñeces eliminadas exitosamente`
      );
      setSelectedIds([]);
      setShowBulkActions(false);
      fetchPreneces();
    } catch (err: any) {
      console.error('Error al eliminar preñeces:', err);
      toastService.error(
        'Error al Eliminar',
        'No se pudieron eliminar algunas preñeces'
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
          api.patch(`/prenez/${id}`, { estado: newStatus })
        )
      );
      toastService.success(
        'Cambio Exitoso',
        `Estado de ${selectedIds.length} preñeces actualizado a ${newStatus}`
      );
      setSelectedIds([]);
      setShowBulkActions(false);
      fetchPreneces();
    } catch (err: any) {
      console.error('Error al cambiar estado:', err);
      toastService.error(
        'Error al Cambiar Estado',
        'No se pudo cambiar el estado de algunas preñeces'
      );
    } finally {
      setBulkActionLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
            <PetsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Gestión de Preñeces
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            sx={{ 
              bgcolor: '#4caf50',
              '&:hover': { bgcolor: '#45a049' }
            }}
          >
            Nueva Preñez
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
              {selectedIds.length} preñe{selectedIds.length !== 1 ? 'ces' : 'z'} seleccionada{selectedIds.length !== 1 ? 's' : ''}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Marcar como Finalizada">
                <IconButton
                  size="small"
                  onClick={() => handleBulkChangeStatus('finalizada')}
                  disabled={bulkActionLoading}
                  color="success"
                >
                  <CheckIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Marcar como Fallida">
                <IconButton
                  size="small"
                  onClick={() => handleBulkChangeStatus('fallida')}
                  disabled={bulkActionLoading}
                  color="warning"
                >
                  <CancelIcon />
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
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      indeterminate={selectedIds.length > 0 && selectedIds.length < preneces.length}
                      checked={preneces.length > 0 && selectedIds.length === preneces.length}
                      onChange={handleSelectAllClick}
                      inputProps={{ 'aria-label': 'Seleccionar todo' }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Madre</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Padre</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Fecha Preñez</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Fecha Probable Parto</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Notas</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {preneces
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((prenez) => {
                    const estadoInfo = getEstadoInfo(prenez.estado, prenez.fechaProbableParto);
                    const isSelected = selectedIds.indexOf(prenez.id!) !== -1;
                    return (
                      <TableRow 
                        key={prenez.id} 
                        hover
                        selected={isSelected}
                        onClick={(event) => handleClick(event, prenez.id!)}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={isSelected}
                            onChange={(event) => handleClick(event, prenez.id!)}
                            inputProps={{ 'aria-label': `Seleccionar preñez ${prenez.id}` }}
                          />
                        </TableCell>
                        <TableCell>{prenez.id}</TableCell>
                        <TableCell>
                          {prenez.madreId ? getCuyNameById(prenez.madreId) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {prenez.padreId ? getCuyNameById(prenez.padreId) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(prenez.fechaPrenez), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(prenez.fechaProbableParto), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={estadoInfo.label}
                            color={estadoInfo.color}
                            icon={estadoInfo.icon}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{prenez.notas || '-'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(prenez.id)}
                              sx={{ color: '#1976d2' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(prenez.id)}
                              sx={{ color: '#d32f2f' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                            {prenez.estado === 'activa' && (
                              <>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleRegistrarCamada(prenez.id)}
                                  sx={{ ml: 1 }}
                                >
                                  Registrar Camada
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                  onClick={() => handleConfirmFallida(prenez.id)}
                                  sx={{ ml: 1 }}
                                >
                                  Marcar Fallida
                                </Button>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          {preneces.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary">
                No hay registros de preñeces disponibles
              </Typography>
            </Box>
          )}

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={preneces.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
          />
        </Paper>

        {/* Modal para crear/editar preñez */}
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          aria-labelledby="modal-title"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <Typography id="modal-title" variant="h6" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
              {modalMode === 'create' ? 'Crear Nueva Preñez' : 'Editar Preñez'}
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.madreId} sx={{
                  width: '100%',
                  minWidth: '240px',
                  '& .MuiFormLabel-filled + .MuiInputBase-formControl .MuiInputBase-input': {
                    paddingTop: '8px' // Ajustar padding cuando hay una etiqueta
                  },
                  '& .MuiInputLabel-shrink': {
                    backgroundColor: 'white',
                    padding: '0 8px',
                    transform: 'translate(14px, -6px) scale(0.75)',
                    width: 'auto',
                    textOverflow: 'visible',
                    whiteSpace: 'nowrap'
                  },
                  '& .MuiInputLabel-outlined': {
                    width: 'auto',
                    maxWidth: 'none',
                    textOverflow: 'visible',
                    whiteSpace: 'nowrap',
                    overflow: 'visible'
                  }
                }}>
                  <InputLabel id="madre-label" sx={LABEL_STYLE}>
                    Madre *
                  </InputLabel>
                  <Select
                    labelId="madre-label"
                    name="madreId"
                    value={formData.madreId}
                    onChange={handleChange}
                    label="Madre *"
                    displayEmpty
                    placeholder=""
                    notched
                    renderValue={(selected) => {
                      if (!selected) return ""; // Campo vacío para evitar superposición
                      const cuy = getCuyesDisponibles('madre').find(c => c.id === selected);
                      if (!cuy) return "Seleccionada";
                      return `${cuy.raza} - #${cuy.id}`;
                    }}
                    sx={{ 
                      height: '56px',
                      width: '100%',
                      minWidth: '240px',
                      '.MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        whiteSpace: 'normal',
                        paddingRight: '32px' // Ensure text doesn't overlap with dropdown icon
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.23)', // Default MUI border color
                        borderWidth: '1px'
                      },
                      '& .MuiInputLabel-root': {
                        width: 'auto',
                        textOverflow: 'visible',
                        whiteSpace: 'nowrap',
                        maxWidth: 'none'
                      },
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1976d2',
                          borderWidth: '2px'
                        }
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                          width: '500px'
                        },
                      },
                    }}
                  >
                    <MenuItem value="" sx={{ minHeight: '36px' }}>
                      <em>-- Seleccionar madre --</em>
                    </MenuItem>
                    {getCuyesDisponibles('madre').map((cuy) => (
                      <MenuItem key={cuy.id} value={cuy.id}>
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          width: '100%',
                          py: 0.5
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            width: '100%' 
                          }}>
                            <Typography variant="body1" fontWeight={500}>
                              {cuy.raza} - #{cuy.id}
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              bgcolor: 'success.light', 
                              color: 'success.contrastText', 
                              px: 1, 
                              borderRadius: 1,
                              fontSize: '0.75rem',
                              fontWeight: 'bold' 
                            }}>
                              {cuy.codigo}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Estado: {cuy.estado}, Sexo: {cuy.sexo}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.madreId && (
                    <FormHelperText error>
                      {errors.madreId}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{
                  width: '100%',
                  minWidth: '240px',
                  '& .MuiFormLabel-filled + .MuiInputBase-formControl .MuiInputBase-input': {
                    paddingTop: '8px' // Ajustar padding cuando hay una etiqueta
                  },
                  '& .MuiInputLabel-shrink': {
                    backgroundColor: 'white',
                    padding: '0 8px',
                    transform: 'translate(14px, -6px) scale(0.75)',
                    width: 'auto',
                    textOverflow: 'visible',
                    whiteSpace: 'nowrap'
                  },
                  '& .MuiInputLabel-outlined': {
                    width: 'auto',
                    maxWidth: 'none',
                    textOverflow: 'visible',
                    whiteSpace: 'nowrap',
                    overflow: 'visible'
                  }
                }}>
                  <InputLabel id="padre-label" sx={LABEL_STYLE}>
                    Padre (opcional)
                  </InputLabel>
                  <Select
                    labelId="padre-label"
                    name="padreId"
                    value={formData.padreId}
                    onChange={handleChange}
                    label="Padre (opcional)"
                    displayEmpty
                    placeholder=""
                    notched
                    renderValue={(selected) => {
                      if (!selected) return ""; // Campo vacío para evitar superposición
                      const cuy = getCuyesDisponibles('padre').find(c => c.id === selected);
                      if (!cuy) return "Seleccionado";
                      return `${cuy.raza} - #${cuy.id}`;
                    }}
                    sx={{ 
                      height: '56px',
                      width: '100%',
                      minWidth: '240px',
                      '.MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        whiteSpace: 'normal',
                        paddingRight: '32px' // Ensure text doesn't overlap with dropdown icon
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.23)', // Default MUI border color
                        borderWidth: '1px'
                      },
                      '& .MuiInputLabel-root': {
                        width: 'auto',
                        textOverflow: 'visible',
                        whiteSpace: 'nowrap',
                        maxWidth: 'none'
                      },
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1976d2',
                          borderWidth: '2px'
                        }
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                          width: '500px'
                        },
                      },
                    }}
                  >
                    <MenuItem value="" sx={{ minHeight: '36px' }}>
                      <em>-- Seleccionar padre --</em>
                    </MenuItem>
                    {getCuyesDisponibles('padre').map((cuy) => (
                      <MenuItem key={cuy.id} value={cuy.id}>
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          width: '100%',
                          py: 0.5 
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            width: '100%' 
                          }}>
                            <Typography variant="body1" fontWeight={500}>
                              {cuy.raza} - #{cuy.id}
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              bgcolor: 'info.light', 
                              color: 'info.contrastText', 
                              px: 1, 
                              borderRadius: 1,
                              fontSize: '0.75rem',
                              fontWeight: 'bold' 
                            }}>
                              {cuy.codigo}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Estado: {cuy.estado}, Sexo: {cuy.sexo}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Fecha de Preñez *"
                  value={formData.fechaPrenez}
                  onChange={handleDateChange('fechaPrenez')}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      error={!!errors.fechaPrenez}
                      helperText={errors.fechaPrenez}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Fecha Probable de Parto *"
                  value={formData.fechaProbableParto}
                  onChange={handleDateChange('fechaProbableParto')}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      error={!!errors.fechaProbableParto}
                      helperText={errors.fechaProbableParto}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notas"
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
                  >
                    {loading ? 'Guardando...' : (modalMode === 'create' ? 'Crear' : 'Actualizar')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Modal>

        {/* Modal para registrar camada */}
        <Modal
          open={camadaFormOpen}
          onClose={() => setCamadaFormOpen(false)}
          aria-labelledby="camada-modal-title"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2
          }}>
            <Typography id="camada-modal-title" variant="h6" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
              Registrar Camada
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <DatePicker
                  label="Fecha de Nacimiento *"
                  value={camadaForm.fechaNacimiento}
                  onChange={handleCamadaDateChange}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      error={!!camadaErrors.fechaNacimiento}
                      helperText={camadaErrors.fechaNacimiento}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cuyes Vivos *"
                  name="numVivos"
                  value={camadaForm.numVivos === 0 ? '' : camadaForm.numVivos}
                  onChange={handleCamadaChange}
                  error={!!camadaErrors.numVivos}
                  helperText={camadaErrors.numVivos}
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cuyes Muertos *"
                  name="numMuertos"
                  value={camadaForm.numMuertos === 0 ? '' : camadaForm.numMuertos}
                  onChange={handleCamadaChange}
                  error={!!camadaErrors.numMuertos}
                  helperText={camadaErrors.numMuertos}
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setCamadaFormOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveCamada}
                  sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
                >
                  Registrar
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Modal>

        {/* Diálogo de confirmación para eliminar */}
        <ConfirmDeleteDialog
          open={deleteConfirmation.confirmOpen}
          onClose={deleteConfirmation.handleCancelDelete}
          onConfirm={deleteConfirmation.handleConfirmDelete}
          itemName="preñez"
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
    </LocalizationProvider>
  );
};

export default PrenezTable;
