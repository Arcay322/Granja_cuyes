import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Autocomplete
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import api from '../../services/api';
import { isSuccessfulApiResponse, extractErrorMessage } from '../../utils/typeGuards';
import { CuyesResponse, Cuy } from '../../types/api';

interface Animal {
  id: number;
  raza: string;
  galpon: string;
  jaula: string;
  sexo: string;
  etapaVida: string;
}

interface EventCreatorProps {
  open: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  onEventCreated: () => void;
}

const EventCreator: React.FC<EventCreatorProps> = ({
  open,
  onClose,
  initialDate,
  onEventCreated
}) => {
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    description: '',
    startDate: initialDate || new Date(),
    endDate: null as Date | null,
    allDay: false,
    animalId: null as number | null,
    priority: 'medium',
    metadata: {}
  });

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Cargar animales disponibles
  useEffect(() => {
    const loadAnimals = async () => {
      try {
        const response = await api.get('/cuyes');
        if (isSuccessfulApiResponse<Cuy[]>(response.data)) {
          setAnimals(response.data.data);
        }
      } catch (error) {
        console.error('Error cargando animales:', error);
      }
    };

    if (open) {
      loadAnimals();
    }
  }, [open]);

  // Resetear formulario cuando se abre
  useEffect(() => {
    if (open) {
      setFormData({
        type: '',
        title: '',
        description: '',
        startDate: initialDate || new Date(),
        endDate: null,
        allDay: false,
        animalId: null,
        priority: 'medium',
        metadata: {}
      });
      setError(null);
      setValidationErrors([]);
    }
  }, [open, initialDate]);

  // Manejadores de cambios
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generar título basado en tipo y animal
    if (field === 'type' || field === 'animalId') {
      generateTitle(
        field === 'type' ? value : formData.type,
        field === 'animalId' ? value : formData.animalId
      );
    }
  };

  const generateTitle = (type: string, animalId: number | null) => {
    if (!type) return;

    const typeLabels: Record<string, string> = {
      parto: 'Parto programado',
      apareamiento: 'Apareamiento',
      chequeo: 'Chequeo de salud',
      vacunacion: 'Vacunación',
      destete: 'Destete',
      evaluacion: 'Evaluación'
    };

    let title = typeLabels[type] || type;

    if (animalId) {
      const animal = animals.find(a => a.id === animalId);
      if (animal) {
        title += ` - ${animal.raza} (${animal.galpon}-${animal.jaula})`;
      }
    }

    setFormData(prev => ({ ...prev, title }));
  };

  // Validar formulario
  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.type) errors.push('El tipo de evento es requerido');
    if (!formData.title.trim()) errors.push('El título es requerido');
    if (!formData.startDate) errors.push('La fecha de inicio es requerida');
    
    if (formData.endDate && formData.endDate <= formData.startDate) {
      errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Validar conflictos con el servidor
  const validateConflicts = async () => {
    try {
      const response = await api.post('/calendar/validate', {
        type: formData.type,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate?.toISOString(),
        animalId: formData.animalId
      });

      if (isSuccessfulApiResponse(response.data)) {
        const validation = response.data.data;
        
        if ((validation as any).hasConflicts) {
          setError(`Conflicto detectado: ${(validation as any).conflicts.length} eventos se solapan`);
          return false;
        }

        if ((validation as any).warnings.length > 0) {
          setError(`Advertencias: ${(validation as any).warnings.join(', ')}`);
          // Permitir continuar con advertencias
        }

        return true;
      }
    } catch (error: any) {
      console.error('Error validando conflictos:', error);
      setError(error.response?.data?.message || 'Error validando evento');
      return false;
    }
  };

  // Crear evento
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Validar conflictos primero
      const isValid = await validateConflicts();
      if (!isValid) {
        setLoading(false);
        return;
      }

      const eventData = {
        ...formData,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate?.toISOString(),
        metadata: {
          ...formData.metadata,
          createdBy: 'user' // Podría venir del contexto de usuario
        }
      };

      const response = await api.post('/calendar/events', eventData);

      if (isSuccessfulApiResponse(response.data)) {
        onEventCreated();
        onClose();
      }
    } catch (error: unknown) {
      console.error('Error creando evento:', error);
      setError((error as any).response?.data?.message || 'Error creando evento');
    } finally {
      setLoading(false);
    }
  };

  const eventTypes = [
    { value: 'parto', label: 'Parto', icon: '🐹' },
    { value: 'apareamiento', label: 'Apareamiento', icon: '💕' },
    { value: 'chequeo', label: 'Chequeo de Salud', icon: '🏥' },
    { value: 'vacunacion', label: 'Vacunación', icon: '💉' },
    { value: 'destete', label: 'Destete', icon: '🍼' },
    { value: 'evaluacion', label: 'Evaluación', icon: '📋' }
  ];

  const priorities = [
    { value: 'low', label: 'Baja', color: '#4caf50' },
    { value: 'medium', label: 'Media', color: '#2196f3' },
    { value: 'high', label: 'Alta', color: '#ff9800' },
    { value: 'critical', label: 'Crítica', color: '#f44336' }
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6">
            Crear Nuevo Evento
          </Typography>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {validationErrors.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Información básica */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Tipo de Evento</InputLabel>
                <Select
                  value={formData.type}
                  label="Tipo de Evento"
                  onChange={(e) => handleChange('type', e.target.value)}
                >
                  {eventTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>{type.icon}</span>
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Título"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                margin="normal"
                required
              />

              <TextField
                fullWidth
                label="Descripción"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>

            {/* Fechas y configuración */}
            <Grid size={{ xs: 12, md: 6 }}>
              <DateTimePicker
                label="Fecha y Hora de Inicio"
                value={formData.startDate}
                onChange={(date) => handleChange('startDate', date)}
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
                    checked={formData.allDay}
                    onChange={(e) => handleChange('allDay', e.target.checked)}
                  />
                }
                label="Todo el día"
                sx={{ mt: 1, mb: 1 }}
              />

              {!formData.allDay && (
                <DateTimePicker
                  label="Fecha y Hora de Fin (opcional)"
                  value={formData.endDate}
                  onChange={(date) => handleChange('endDate', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: 'normal'
                    }
                  }}
                  minDateTime={formData.startDate}
                />
              )}

              <FormControl fullWidth margin="normal">
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={formData.priority}
                  label="Prioridad"
                  onChange={(e) => handleChange('priority', e.target.value)}
                >
                  {priorities.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          width={12}
                          height={12}
                          borderRadius="50%"
                          bgcolor={priority.color}
                        />
                        {priority.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Selección de animal */}
            <Grid size={{ xs: 12 }}>
              <Autocomplete
                options={animals}
                getOptionLabel={(option) => 
                  `ID: ${option.id} - ${option.raza} (${option.galpon}-${option.jaula}) - ${option.sexo} - ${option.etapaVida}`
                }
                value={animals.find(a => a.id === formData.animalId) || null}
                onChange={(event, newValue) => handleChange('animalId', newValue?.id || null)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Animal (opcional)"
                    placeholder="Buscar por ID, raza, galpón o jaula..."
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body2">
                        <strong>ID: {option.id}</strong> - {option.raza}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.galpon}-{option.jaula} | {option.sexo} | {option.etapaVida}
                      </Typography>
                    </Box>
                  </Box>
                )}
                filterOptions={(options, { inputValue }) => {
                  const filterValue = inputValue.toLowerCase();
                  return options.filter(option =>
                    option.id.toString().includes(filterValue) ||
                    option.raza.toLowerCase().includes(filterValue) ||
                    option.galpon.toLowerCase().includes(filterValue) ||
                    option.jaula.toLowerCase().includes(filterValue) ||
                    option.sexo.toLowerCase().includes(filterValue) ||
                    option.etapaVida.toLowerCase().includes(filterValue)
                  );
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Crear Evento'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default EventCreator;