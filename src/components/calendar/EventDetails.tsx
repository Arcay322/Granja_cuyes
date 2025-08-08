import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  IconButton,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../services/api';
import { isSuccessfulApiResponse, extractErrorMessage } from '../../utils/typeGuards';

interface ReproductiveEvent {
  id: string;
  type: 'parto' | 'apareamiento' | 'chequeo' | 'vacunacion' | 'destete' | 'evaluacion';
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  allDay: boolean;
  animalId?: number;
  prenezId?: number;
  camadaId?: number;
  status: 'programado' | 'completado' | 'cancelado' | 'vencido';
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface EventDetailsProps {
  event: ReproductiveEvent | null;
  open: boolean;
  onClose: () => void;
  onEventUpdated: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({
  event,
  open,
  onClose,
  onEventUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  
  // Estado para edición
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: null as Date | null,
    allDay: false,
    priority: 'medium'
  });

  if (!event) return null;

  // Manejadores de acciones
  const handleComplete = async () => {
    try {
      setLoading(true);
      const response = await api.patch(`/calendar/events/${event.id}/complete`, {
        completionNotes
      });

      if (isSuccessfulApiResponse(response.data)) {
        onEventUpdated();
        setShowCompletionDialog(false);
        setCompletionNotes('');
        onClose();
      }
    } catch (error: unknown) {
      console.error('Error completando evento:', error);
      setError(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.delete(`/calendar/events/${event.id}`);

      if (isSuccessfulApiResponse(response.data)) {
        onEventUpdated();
        onClose();
      }
    } catch (error: unknown) {
      console.error('Error eliminando evento:', error);
      setError(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar este evento?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.put(`/calendar/events/${event.id}`, {
        status: 'cancelado'
      });

      if (isSuccessfulApiResponse(response.data)) {
        onEventUpdated();
        onClose();
      }
    } catch (error: unknown) {
      console.error('Error cancelando evento:', error);
      setError(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Funciones para edición
  const handleEdit = () => {
    // Inicializar formulario de edición con datos actuales
    setEditFormData({
      title: event.title,
      description: event.description || '',
      startDate: new Date(event.startDate),
      endDate: event.endDate ? new Date(event.endDate) : null,
      allDay: event.allDay,
      priority: event.priority
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      const response = await api.put(`/calendar/events/${event.id}`, {
        title: editFormData.title,
        description: editFormData.description,
        startDate: editFormData.startDate.toISOString(),
        endDate: editFormData.endDate?.toISOString(),
        allDay: editFormData.allDay,
        priority: editFormData.priority
      });

      if (isSuccessfulApiResponse(response.data)) {
        onEventUpdated();
        setShowEditDialog(false);
        onClose();
      }
    } catch (error: unknown) {
      console.error('Error editando evento:', error);
      setError(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleEditFormChange = (field: string, value: unknown) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Funciones de utilidad
  const getEventTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      parto: '🐹',
      apareamiento: '💕',
      chequeo: '🏥',
      vacunacion: '💉',
      destete: '🍼',
      evaluacion: '📋'
    };
    return icons[type] || '📅';
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      parto: 'Parto',
      apareamiento: 'Apareamiento',
      chequeo: 'Chequeo de Salud',
      vacunacion: 'Vacunación',
      destete: 'Destete',
      evaluacion: 'Evaluación'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    const colors: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
      programado: 'info',
      completado: 'success',
      cancelado: 'warning',
      vencido: 'error'
    };
    return colors[status] || 'info';
  };

  const getPriorityColor = (priority: string): 'success' | 'warning' | 'error' | 'info' => {
    const colors: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
      low: 'success',
      medium: 'info',
      high: 'warning',
      critical: 'error'
    };
    return colors[priority] || 'info';
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      critical: 'Crítica'
    };
    return labels[priority] || priority;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP p', { locale: es });
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <span style={{ fontSize: '1.5rem' }}>
                {getEventTypeIcon(event.type)}
              </span>
              <Typography variant="h6">
                {event.title}
              </Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Información básica */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Información del Evento
                  </Typography>
                  
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Tipo de Evento
                    </Typography>
                    <Typography variant="body1">
                      {getEventTypeLabel(event.type)}
                    </Typography>
                  </Box>

                  {event.description && (
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Descripción
                      </Typography>
                      <Typography variant="body1">
                        {event.description}
                      </Typography>
                    </Box>
                  )}

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Fecha y Hora
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(event.startDate)}
                      {event.endDate && event.endDate !== event.startDate && (
                        <> - {formatDate(event.endDate)}</>
                      )}
                      {event.allDay && (
                        <Chip label="Todo el día" size="small" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                  </Box>

                  <Box display="flex" gap={1} mb={2}>
                    <Chip
                      label={event.status}
                      color={getStatusColor(event.status)}
                      size="small"
                    />
                    <Chip
                      label={`Prioridad: ${getPriorityLabel(event.priority)}`}
                      color={getPriorityColor(event.priority)}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Información adicional */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Detalles Adicionales
                  </Typography>

                  {event.animalId && (
                    <Box mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Animal ID
                      </Typography>
                      <Typography variant="body1">
                        {event.animalId}
                      </Typography>
                    </Box>
                  )}

                  {event.prenezId && (
                    <Box mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Preñez ID
                      </Typography>
                      <Typography variant="body1">
                        {event.prenezId}
                      </Typography>
                    </Box>
                  )}

                  {event.camadaId && (
                    <Box mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Camada ID
                      </Typography>
                      <Typography variant="body1">
                        {event.camadaId}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Creado
                    </Typography>
                    <Typography variant="caption">
                      {formatDate(event.createdAt)}
                    </Typography>
                  </Box>

                  <Box mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Actualizado
                    </Typography>
                    <Typography variant="caption">
                      {formatDate(event.updatedAt)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Metadata */}
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Información Adicional
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {Object.entries(event.metadata).map(([key, value]) => (
                        <Chip
                          key={key}
                          label={`${key}: ${value}`}
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions>
          <Box display="flex" gap={1} width="100%" justifyContent="space-between">
            <Box display="flex" gap={1}>
              {event.status === 'programado' && (
                <>
                  <Button
                    startIcon={<CompleteIcon />}
                    onClick={() => setShowCompletionDialog(true)}
                    color="success"
                    disabled={loading}
                  >
                    Completar
                  </Button>
                  <Button
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    color="warning"
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </Box>
            
            <Box display="flex" gap={1}>
              <Button
                startIcon={<EditIcon />}
                onClick={handleEdit}
                color="primary"
                disabled={loading}
              >
                Editar
              </Button>
              <Button
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
                color="error"
                disabled={loading}
              >
                Eliminar
              </Button>
              <Button onClick={onClose}>
                Cerrar
              </Button>
            </Box>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Dialog de completar evento */}
      <Dialog
        open={showCompletionDialog}
        onClose={() => setShowCompletionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Completar Evento</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            ¿Estás seguro de que quieres marcar este evento como completado?
          </Typography>
          <TextField
            fullWidth
            label="Notas de finalización (opcional)"
            multiline
            rows={3}
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            placeholder="Describe cómo se completó el evento..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompletionDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleComplete}
            variant="contained"
            color="success"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Completar Evento'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de editar evento */}
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <Dialog
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6">
              Editar Evento
            </Typography>
          </DialogTitle>

          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Información básica */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Título"
                  value={editFormData.title}
                  onChange={(e) => handleEditFormChange('title', e.target.value)}
                  margin="normal"
                  required
                />

                <TextField
                  fullWidth
                  label="Descripción"
                  value={editFormData.description}
                  onChange={(e) => handleEditFormChange('description', e.target.value)}
                  margin="normal"
                  multiline
                  rows={3}
                />

                <FormControl fullWidth margin="normal">
                  <InputLabel>Prioridad</InputLabel>
                  <Select
                    value={editFormData.priority}
                    label="Prioridad"
                    onChange={(e) => handleEditFormChange('priority', e.target.value)}
                  >
                    <MenuItem value="low">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box width={12} height={12} borderRadius="50%" bgcolor="#4caf50" />
                        Baja
                      </Box>
                    </MenuItem>
                    <MenuItem value="medium">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box width={12} height={12} borderRadius="50%" bgcolor="#2196f3" />
                        Media
                      </Box>
                    </MenuItem>
                    <MenuItem value="high">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box width={12} height={12} borderRadius="50%" bgcolor="#ff9800" />
                        Alta
                      </Box>
                    </MenuItem>
                    <MenuItem value="critical">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box width={12} height={12} borderRadius="50%" bgcolor="#f44336" />
                        Crítica
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Fechas y configuración */}
              <Grid size={{ xs: 12, md: 6 }}>
                <DateTimePicker
                  label="Fecha y Hora de Inicio"
                  value={editFormData.startDate}
                  onChange={(date) => handleEditFormChange('startDate', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: 'normal',
                      required: true
                    }
                  }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={editFormData.allDay}
                      onChange={(e) => handleEditFormChange('allDay', e.target.checked)}
                    />
                  }
                  label="Todo el día"
                  sx={{ mt: 1, mb: 1 }}
                />

                {!editFormData.allDay && (
                  <DateTimePicker
                    label="Fecha y Hora de Fin (opcional)"
                    value={editFormData.endDate}
                    onChange={(date) => handleEditFormChange('endDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: 'normal'
                      }
                    }}
                    minDateTime={editFormData.startDate}
                  />
                )}
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Guardar Cambios'}
            </Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
    </>
  );
};

export default EventDetails;