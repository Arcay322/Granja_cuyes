import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Button, TextField, Modal, 
  IconButton, Snackbar, Alert, FormControl, InputLabel, 
  Select, MenuItem, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TablePagination, Chip,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
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
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import api from '../services/api';
import es from 'date-fns/locale/es';
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
  const [currentPreñez, setCurrentPreñez] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    id: null as number | null,
    action: '' as 'delete' | 'completar' | 'fallida'
  });
  const [formData, setFormData] = useState({
    madreId: '',
    padreId: '',
    fechaPreñez: new Date(),
    fechaProbableParto: addDays(new Date(), 70), // Por defecto 70 días después
    notas: '',
    estado: 'activa'
  });
  const [errors, setErrors] = useState({
    madreId: '',
    fechaPreñez: '',
    fechaProbableParto: ''
  });
  const [camadaFormOpen, setCamadaFormOpen] = useState(false);
  const [camadaForm, setCamadaForm] = useState({
    fechaNacimiento: new Date(),
    numVivos: 0,
    numMuertos: 0,
    preñezId: null as number | null
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchPreñeces();
    fetchCuyes();
  }, []);

  // Obtener preñeces desde la API
  const fetchPreñeces = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reproduccion/preñez');
      setPreñeces(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar preñeces:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar datos de preñez',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  // Obtener cuyes desde la API
  const fetchCuyes = async () => {
    try {
      const response = await api.get('/cuyes');
      setCuyes(response.data);
    } catch (error) {
      console.error('Error al cargar cuyes:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar los cuyes disponibles',
        severity: 'error'
      });
    }
  };

  // Función para calcular la edad en meses de un cuy
  const calcularEdadEnMeses = (fechaNacimiento: string | Date): number => {
    try {
      if (!fechaNacimiento) return 0;
      
      // Convertir a objeto Date
      const fecha = typeof fechaNacimiento === 'string' 
        ? new Date(fechaNacimiento) 
        : fechaNacimiento;
      
      // Verificar si la fecha es válida
      if (isNaN(fecha.getTime())) return 0;
      
      // Usar la fecha del contexto: 5 de julio de 2025
      const fechaContexto = new Date(2025, 6, 5); // Mes es 0-indexed, julio = 6
      
      // Cálculo usando la fecha de contexto
      const aniosDif = fechaContexto.getFullYear() - fecha.getFullYear();
      const mesesDif = fechaContexto.getMonth() - fecha.getMonth();
      const ajusteDias = fechaContexto.getDate() < fecha.getDate() ? -1 : 0;
      
      // Edad total en meses
      const edadEnMeses = aniosDif * 12 + mesesDif + ajusteDias;
      
      return edadEnMeses;
    } catch (error) {
      console.error('Error al calcular edad:', error);
      return 0;
    }
  };
  
  // Filtrar cuyes hembras adultas disponibles
  const getHembrasDisponibles = () => {
    const EDAD_MINIMA_ADULTO_MESES = 3; // Cuyes son adultos después de 3 meses
    
    return cuyes.filter(cuy => {
      const edad = calcularEdadEnMeses(cuy.fechaNacimiento);
      const estadoNorm = cuy.estado?.toLowerCase() || '';
      const estadoEsActivo = estadoNorm === 'activo' || estadoNorm === 'a';
      
      return cuy.sexo === 'H' && estadoEsActivo && edad >= EDAD_MINIMA_ADULTO_MESES;
    });
  };
  
  // Filtrar cuyes machos adultos disponibles
  const getMachosDisponibles = () => {
    const EDAD_MINIMA_ADULTO_MESES = 3; // Cuyes son adultos después de 3 meses
    
    return cuyes.filter(cuy => {
      const edad = calcularEdadEnMeses(cuy.fechaNacimiento);
      const estadoNorm = cuy.estado?.toLowerCase() || '';
      const estadoEsActivo = estadoNorm === 'activo' || estadoNorm === 'a';
      
      return cuy.sexo === 'M' && estadoEsActivo && edad >= EDAD_MINIMA_ADULTO_MESES;
    });
  };

  // Manejar cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({ ...formData, [name]: value });
      
      // Validación básica
      let errorMsg = '';
      if (name === 'madreId' && !value) {
        errorMsg = 'Debe seleccionar una madre';
      }
      
      setErrors({ ...errors, [name as keyof typeof errors]: errorMsg });
    }
  };

  // Manejar cambio de fecha de preñez
  const handleFechaPreñezChange = (date: Date | null) => {
    if (date) {
      const fechaProbableParto = addDays(date, 70); // Gestación de 70 días aproximadamente
      
      setFormData({ 
        ...formData, 
        fechaPreñez: date,
        fechaProbableParto
      });
      
      // Validar fecha
      const now = new Date();
      if (date > now) {
        setErrors({ ...errors, fechaPreñez: 'La fecha no puede ser futura' });
      } else {
        setErrors({ ...errors, fechaPreñez: '' });
      }
    }
  };
  
  // Manejar cambio de fecha probable de parto
  const handleFechaPartoChange = (date: Date | null) => {
    if (date) {
      setFormData({ ...formData, fechaProbableParto: date });
      
      // Validar fecha
      if (date < formData.fechaPreñez) {
        setErrors({ 
          ...errors, 
          fechaProbableParto: 'La fecha debe ser posterior a la fecha de preñez' 
        });
      } else {
        setErrors({ ...errors, fechaProbableParto: '' });
      }
    }
  };

  // Validar formulario completo
  const validateForm = () => {
    const newErrors = {
      madreId: '',
      fechaPreñez: '',
      fechaProbableParto: ''
    };
    
    let isValid = true;
    
    // Validar madre
    if (!formData.madreId) {
      newErrors.madreId = 'Debe seleccionar una madre';
      isValid = false;
    }
    
    // Validar fecha de preñez
    const now = new Date();
    if (formData.fechaPreñez > now) {
      newErrors.fechaPreñez = 'La fecha no puede ser futura';
      isValid = false;
    }
    
    // Validar fecha probable de parto
    if (formData.fechaProbableParto < formData.fechaPreñez) {
      newErrors.fechaProbableParto = 'La fecha debe ser posterior a la fecha de preñez';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // Abrir modal para crear
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData({
      madreId: '',
      padreId: '',
      fechaPreñez: new Date(),
      fechaProbableParto: addDays(new Date(), 70),
      notas: '',
      estado: 'activa'
    });
    setErrors({
      madreId: '',
      fechaPreñez: '',
      fechaProbableParto: ''
    });
    setOpen(true);
  };

  // Abrir modal para editar
  const handleOpenEditModal = (preñez: any) => {
    setModalMode('edit');
    setCurrentPreñez(preñez);
    setFormData({
      madreId: preñez.madreId.toString(),
      padreId: preñez.padreId ? preñez.padreId.toString() : '',
      fechaPreñez: new Date(preñez.fechaPreñez),
      fechaProbableParto: new Date(preñez.fechaProbableParto),
      notas: preñez.notas || '',
      estado: preñez.estado
    });
    setErrors({
      madreId: '',
      fechaPreñez: '',
      fechaProbableParto: ''
    });
    setOpen(true);
  };

  // Cerrar modal
  const handleClose = () => {
    setOpen(false);
  };

  // Guardar preñez (crear o editar)
  const handleSave = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        madreId: Number(formData.madreId),
        padreId: formData.padreId ? Number(formData.padreId) : null,
        fechaPreñez: formData.fechaPreñez.toISOString(),
        fechaProbableParto: formData.fechaProbableParto.toISOString(),
      };
      
      if (modalMode === 'create') {
        await api.post('/reproduccion/preñez', payload);
        setSnackbar({
          open: true,
          message: 'Preñez registrada correctamente',
          severity: 'success'
        });
      } else {
        await api.put(`/reproduccion/preñez/${currentPreñez.id}`, payload);
        setSnackbar({
          open: true,
          message: 'Preñez actualizada correctamente',
          severity: 'success'
        });
      }
      
      fetchPreñeces();
      handleClose();
    } catch (error) {
      console.error('Error al guardar la preñez:', error);
      setSnackbar({
        open: true,
        message: 'Error al guardar la preñez',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Confirmar eliminación
  const handleConfirmDelete = (id: number) => {
    setConfirmDialog({
      open: true,
      id,
      action: 'delete'
    });
  };
  
  // Confirmar marcar como completada
  const handleConfirmCompletar = (id: number) => {
    setCurrentPreñez(preñeces.find(p => p.id === id));
    setCamadaForm({
      fechaNacimiento: new Date(),
      numVivos: 0,
      numMuertos: 0,
      preñezId: id
    });
    setCamadaFormOpen(true);
  };
  
  // Confirmar marcar como fallida
  const handleConfirmFallida = (id: number) => {
    setConfirmDialog({
      open: true,
      id,
      action: 'fallida'
    });
  };

  // Eliminar preñez
  const handleDeleteConfirmed = async () => {
    if (!confirmDialog.id) return;
    
    setLoading(true);
    
    try {
      await api.delete(`/reproduccion/preñez/${confirmDialog.id}`);
      setSnackbar({
        open: true,
        message: 'Registro de preñez eliminado correctamente',
        severity: 'success'
      });
      fetchPreñeces();
    } catch (error) {
      console.error('Error al eliminar la preñez:', error);
      setSnackbar({
        open: true,
        message: 'Error al eliminar el registro de preñez',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setConfirmDialog({
        open: false,
        id: null,
        action: 'delete'
      });
    }
  };
  
  // Marcar como fallida
  const handleFallidaConfirmed = async () => {
    if (!confirmDialog.id) return;
    
    setLoading(true);
    
    try {
      await api.post(`/reproduccion/preñez/${confirmDialog.id}/fallida`);
      setSnackbar({
        open: true,
        message: 'Preñez marcada como fallida',
        severity: 'info'
      });
      fetchPreñeces();
    } catch (error) {
      console.error('Error al marcar como fallida:', error);
      setSnackbar({
        open: true,
        message: 'Error al marcar la preñez como fallida',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setConfirmDialog({
        open: false,
        id: null,
        action: 'fallida'
      });
    }
  };
  
  // Manejar cambio de datos del formulario de camada
  const handleCamadaChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setCamadaForm({ ...camadaForm, [name]: value });
    }
  };
  
  // Manejar cambio de fecha de nacimiento de la camada
  const handleFechaNacimientoChange = (date: Date | null) => {
    if (date) {
      setCamadaForm({ ...camadaForm, fechaNacimiento: date });
    }
  };
  
  // Registrar camada y completar preñez
  const handleRegistrarCamada = async () => {
    setLoading(true);
    
    try {
      // Primero crear la camada
      const camadaPayload = {
        fechaNacimiento: camadaForm.fechaNacimiento.toISOString(),
        numVivos: Number(camadaForm.numVivos),
        numMuertos: Number(camadaForm.numMuertos),
        madreId: Number(currentPreñez.madreId),
        padreId: currentPreñez.padreId ? Number(currentPreñez.padreId) : null
      };
      
      const camadaResponse = await api.post('/reproduccion/camadas', camadaPayload);
      
      // Luego actualizar la preñez como completada
      await api.post(`/reproduccion/preñez/${camadaForm.preñezId}/completar`, {
        camadaId: camadaResponse.data.id
      });
      
      setSnackbar({
        open: true,
        message: 'Camada registrada y preñez completada con éxito',
        severity: 'success'
      });
      
      fetchPreñeces();
      setCamadaFormOpen(false);
    } catch (error) {
      console.error('Error al registrar camada y completar preñez:', error);
      setSnackbar({
        open: true,
        message: 'Error al registrar camada',
        severity: 'error'
      });
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

  // Cerrar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Buscar nombre del cuy por ID
  const getCuyNameById = (id: number) => {
    const cuy = cuyes.find(c => c.id === id);
    return cuy ? `${cuy.raza} #${cuy.id} (G: ${cuy.galpon}, J: ${cuy.jaula})` : 'N/A';
  };
  
  // Calcular días para el parto
  const calcularDiasParaParto = (fechaProbableParto: string | Date) => {
    const fechaParto = new Date(fechaProbableParto);
    const hoy = new Date();
    return differenceInDays(fechaParto, hoy);
  };
  
  // Obtener color y texto según estado
  const getEstadoChip = (estado: string, fechaProbableParto: string) => {
    switch (estado) {
      case 'activa':
        const diasRestantes = calcularDiasParaParto(fechaProbableParto);
        if (diasRestantes < 0) {
          return { color: 'error', label: 'Parto vencido', icon: <WarningIcon /> };
        } else if (diasRestantes <= 7) {
          return { color: 'warning', label: 'Parto próximo', icon: <NotificationIcon /> };
        } else {
          return { color: 'primary', label: 'Activa', icon: <CalendarIcon /> };
        }
      case 'completada':
        return { color: 'success', label: 'Completada', icon: <CheckIcon /> };
      case 'fallida':
        return { color: 'error', label: 'Fallida', icon: <CancelIcon /> };
      default:
        return { color: 'default', label: estado, icon: null };
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" component="h2">
          <PetsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Registro de Preñez
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpenCreateModal}
          disabled={loading}
        >
          Nueva Preñez
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Madre</TableCell>
              <TableCell>Padre</TableCell>
              <TableCell>Fecha Preñez</TableCell>
              <TableCell>Fecha Probable Parto</TableCell>
              <TableCell>Días Restantes</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Notas</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {preñeces
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((preñez) => {
                const diasParaParto = calcularDiasParaParto(preñez.fechaProbableParto);
                const estadoInfo = getEstadoChip(preñez.estado, preñez.fechaProbableParto);
                
                return (
                  <TableRow key={preñez.id}>
                    <TableCell>{preñez.id}</TableCell>
                    <TableCell>{getCuyNameById(preñez.madreId)}</TableCell>
                    <TableCell>{preñez.padreId ? getCuyNameById(preñez.padreId) : 'No registrado'}</TableCell>
                    <TableCell>{format(new Date(preñez.fechaPreñez), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{format(new Date(preñez.fechaProbableParto), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      {preñez.estado === 'activa' 
                        ? (diasParaParto >= 0 
                            ? `${diasParaParto} días` 
                            : `${Math.abs(diasParaParto)} días de retraso`)
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={estadoInfo.label}
                        color={estadoInfo.color as any}
                        size="small"
                        icon={estadoInfo.icon}
                      />
                    </TableCell>
                    <TableCell>{preñez.notas || '-'}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {preñez.estado === 'activa' && (
                          <>
                            <IconButton 
                              size="small" 
                              color="primary" 
                              onClick={() => handleOpenEditModal(preñez)}
                              disabled={loading}
                              title="Editar"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="success" 
                              onClick={() => handleConfirmCompletar(preñez.id)}
                              disabled={loading}
                              title="Registrar parto"
                            >
                              <CheckIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="warning" 
                              onClick={() => handleConfirmFallida(preñez.id)}
                              disabled={loading}
                              title="Marcar como fallida"
                            >
                              <CancelIcon />
                            </IconButton>
                          </>
                        )}
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleConfirmDelete(preñez.id)}
                          disabled={loading}
                          title="Eliminar"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
            })}
            {preñeces.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No hay preñeces registradas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={preñeces.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />

      {/* Modal para crear/editar preñez */}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-title"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: {xs: '95%', sm: '90%', md: 800, lg: 900},
          maxWidth: '95vw',
          maxHeight: '95vh',
          overflow: 'auto',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}>
          <Typography id="modal-title" variant="h6" component="h2" sx={{ fontWeight: 'bold', mb: 3 }}>
            {modalMode === 'create' ? 'Registrar Nueva Preñez' : 'Editar Registro de Preñez'}
          </Typography>

          <Box sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: 'info.light', 
            borderRadius: 1,
            color: 'info.contrastText' 
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Información importante:
            </Typography>
            <Typography variant="body2">
              • La duración promedio de gestación en los cuyes es de aproximadamente 68-70 días.
            </Typography>
            <Typography variant="body2">
              • Solo se muestran hembras adultas disponibles (con al menos 3 meses de edad).
            </Typography>
            <Typography variant="body2">
              • La fecha probable de parto se calcula automáticamente pero puede ser ajustada.
            </Typography>
          </Box>

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Grid container spacing={4} sx={{ position: 'relative' }}>
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
                    Madre
                  </InputLabel>
                  <Select
                    labelId="madre-label"
                    name="madreId"
                    value={formData.madreId}
                    onChange={handleChange}
                    label="Madre"
                    displayEmpty
                    placeholder=""
                    notched
                    disabled={modalMode === 'edit'}
                    renderValue={(selected) => {
                      if (!selected) return "";
                      const cuy = cuyes.find(c => c.id.toString() === selected);
                      if (!cuy) return "Seleccionada";
                      return `${cuy.raza} - #${cuy.id} (${calcularEdadEnMeses(cuy.fechaNacimiento).toFixed(1)} meses)`;
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
                    {getHembrasDisponibles().length > 0 ? (
                      getHembrasDisponibles().map((cuy) => (
                        <MenuItem key={cuy.id} value={cuy.id.toString()}>
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
                                {calcularEdadEnMeses(cuy.fechaNacimiento).toFixed(1)} meses
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Galpón: {cuy.galpon}, Jaula: {cuy.jaula}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>
                        No hay hembras adultas disponibles
                      </MenuItem>
                    )}
                  </Select>
                  {errors.madreId && (
                    <Typography variant="caption" color="error">
                      {errors.madreId}
                    </Typography>
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
                    disabled={modalMode === 'edit'}
                    renderValue={(selected) => {
                      if (!selected) return "";
                      const cuy = cuyes.find(c => c.id.toString() === selected);
                      if (!cuy) return "Seleccionado";
                      return `${cuy.raza} - #${cuy.id} (${calcularEdadEnMeses(cuy.fechaNacimiento).toFixed(1)} meses)`;
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
                    {getMachosDisponibles().length > 0 ? (
                      getMachosDisponibles().map((cuy) => (
                        <MenuItem key={cuy.id} value={cuy.id.toString()}>
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
                                {calcularEdadEnMeses(cuy.fechaNacimiento).toFixed(1)} meses
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Galpón: {cuy.galpon}, Jaula: {cuy.jaula}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>
                        No hay machos adultos disponibles
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Fecha de Preñez"
                  value={formData.fechaPreñez}
                  onChange={handleFechaPreñezChange}
                  disabled={modalMode === 'edit'}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.fechaPreñez,
                      helperText: errors.fechaPreñez || "Fecha en que se detectó la preñez"
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Fecha Probable de Parto"
                  value={formData.fechaProbableParto}
                  onChange={handleFechaPartoChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.fechaProbableParto,
                      helperText: errors.fechaProbableParto || "Calculado automáticamente (aproximadamente 70 días después)"
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  name="notas"
                  label="Notas"
                  multiline
                  rows={3}
                  fullWidth
                  value={formData.notas}
                  onChange={handleChange}
                  placeholder="Observaciones, condiciones especiales, etc."
                />
              </Grid>

              <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button onClick={handleClose} disabled={loading} variant="outlined">
                  Cancelar
                </Button>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleSave}
                  disabled={loading}
                  sx={{ minWidth: '150px' }}
                >
                  {modalMode === 'create' ? 'Registrar' : 'Guardar Cambios'}
                </Button>
              </Grid>
            </Grid>
          </LocalizationProvider>
        </Box>
      </Modal>
      
      {/* Modal para registrar camada y completar preñez */}
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
          width: {xs: '95%', sm: '90%', md: 600, lg: 700},
          maxWidth: '95vw',
          maxHeight: '95vh',
          overflow: 'auto',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}>
          <Typography id="camada-modal-title" variant="h6" component="h2" sx={{ fontWeight: 'bold', mb: 3 }}>
            Registrar Nacimiento de Camada
          </Typography>
          
          <Box sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: 'success.light', 
            borderRadius: 1,
            color: 'success.contrastText' 
          }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Registrando parto de: {currentPreñez ? getCuyNameById(currentPreñez.madreId) : ''}
            </Typography>
            <Typography variant="body2">
              • Esta acción registrará una nueva camada y marcará la preñez como completada
            </Typography>
          </Box>
          
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <DatePicker
                  label="Fecha de Nacimiento"
                  value={camadaForm.fechaNacimiento}
                  onChange={handleFechaNacimientoChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: "Fecha en que nació la camada"
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  name="numVivos"
                  label="Crías Vivas"
                  type="number"
                  fullWidth
                  value={camadaForm.numVivos}
                  onChange={handleCamadaChange}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  name="numMuertos"
                  label="Crías Muertas"
                  type="number"
                  fullWidth
                  value={camadaForm.numMuertos}
                  onChange={handleCamadaChange}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              
              <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button onClick={() => setCamadaFormOpen(false)} disabled={loading} variant="outlined">
                  Cancelar
                </Button>
                <Button 
                  variant="contained" 
                  color="success"
                  onClick={handleRegistrarCamada}
                  disabled={loading}
                >
                  Registrar Camada y Completar
                </Button>
              </Grid>
            </Grid>
          </LocalizationProvider>
        </Box>
      </Modal>

      {/* Diálogo de confirmación */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({...confirmDialog, open: false})}
      >
        <DialogTitle>
          {confirmDialog.action === 'delete' ? 'Confirmar eliminación' : 
           confirmDialog.action === 'fallida' ? 'Marcar como fallida' : 'Confirmar acción'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.action === 'delete' && '¿Está seguro de que desea eliminar este registro de preñez? Esta acción no se puede deshacer.'}
            {confirmDialog.action === 'fallida' && '¿Está seguro de que desea marcar esta preñez como fallida? Esto indica que no hubo nacimiento de crías.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({...confirmDialog, open: false})} disabled={loading}>Cancelar</Button>
          {confirmDialog.action === 'delete' && (
            <Button onClick={handleDeleteConfirmed} color="error" disabled={loading}>Eliminar</Button>
          )}
          {confirmDialog.action === 'fallida' && (
            <Button onClick={handleFallidaConfirmed} color="warning" disabled={loading}>Marcar como Fallida</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default PreñezTable;
