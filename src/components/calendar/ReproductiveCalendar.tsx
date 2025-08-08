import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Divider
} from '../../utils/mui';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Today as TodayIcon,
  NavigateBefore,
  NavigateNext
} from '@mui/icons-material';
import api from '../../services/api';
import { isSuccessfulApiResponse, extractErrorMessage } from '../../utils/typeGuards';
import { CalendarEventsResponse, CalendarEvent as CalendarEventType, MuiColor } from '../../types/api';
import EventCreator from './EventCreator';
import EventDetails from './EventDetails';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'birth' | 'breeding' | 'checkup' | 'vaccination' | 'parto' | 'apareamiento' | 'chequeo' | 'vacunacion' | 'destete' | 'evaluacion';
  status: 'scheduled' | 'completed' | 'overdue' | 'programado' | 'completado' | 'vencido';
  description?: string;
  startDate?: string;
  endDate?: string;
  allDay?: boolean;
  animalId?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

const ReproductiveCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventCreator, setShowEventCreator] = useState(false);
  
  // Estado para el modal de detalles de eventos
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);

  // Estado para filtros
  const [filters, setFilters] = useState({
    eventTypes: [] as string[],
    priorities: [] as string[],
    showOverdueOnly: false
  });

  // Cargar eventos del calendario
  const loadCalendarEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/calendar/events', {
        params: {
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear()
        }
      });
      
      if (isSuccessfulApiResponse<CalendarEvent[]>(response.data)) {
        setEvents(response.data.data || []);
      } else {
        setError('Error cargando eventos del calendario');
      }
    } catch (error: unknown) {
      console.error('Error cargando eventos:', error);
      // Crear eventos de ejemplo si no hay backend
      const sampleEvents: CalendarEvent[] = [
        {
          id: '1',
          title: 'Parto esperado - Madre #123',
          date: new Date().toISOString().split('T')[0],
          startDate: new Date(new Date().setHours(10, 30)).toISOString(),
          type: 'parto',
          status: 'programado',
          description: 'Parto esperado para hoy',
          allDay: false,
          animalId: 123,
          priority: 'high',
          metadata: { observaciones: 'Primera camada', veterinario: 'Dr. García' }
        },
        {
          id: '2',
          title: 'Chequeo reproductivo - Hembra #456',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          startDate: new Date(Date.now() + 86400000 + (14 * 60 * 60 * 1000)).toISOString(), // 2pm mañana
          type: 'chequeo',
          status: 'programado',
          description: 'Chequeo rutinario de reproductoras',
          allDay: false,
          animalId: 456,
          priority: 'medium',
          metadata: { tipo_chequeo: 'rutinario', peso_esperado: '800g' }
        },
        {
          id: '3',
          title: 'Apareamiento programado',
          date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
          startDate: new Date(Date.now() + 172800000 + (9 * 60 * 60 * 1000)).toISOString(), // 9am pasado mañana
          type: 'apareamiento',
          status: 'programado',
          description: 'Cruce entre madre #456 y padre #789',
          allDay: false,
          animalId: 456,
          priority: 'critical',
          metadata: { padre_id: 789, ciclo: 'segundo', notas: 'Verificar compatibilidad' }
        },
        {
          id: '4',
          title: 'Vacunación - Lote A',
          date: new Date(Date.now() + 259200000).toISOString().split('T')[0],
          type: 'vacunacion',
          status: 'programado',
          description: 'Vacunación preventiva del lote A',
          allDay: true,
          priority: 'medium',
          metadata: { lote: 'A', vacuna: 'Preventiva', cantidad_animales: 15 }
        },
        {
          id: '5',
          title: 'Destete - Camada #12',
          date: new Date(Date.now() + 345600000).toISOString().split('T')[0],
          startDate: new Date(Date.now() + 345600000 + (8 * 60 * 60 * 1000)).toISOString(), // 8am
          type: 'destete',
          status: 'programado',
          description: 'Destete de camada nacida hace 21 días',
          allDay: false,
          animalId: 123,
          priority: 'high',
          metadata: { camada_id: 12, edad_dias: 21, crias_esperadas: 4 }
        }
      ];
      setEvents(sampleEvents);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadCalendarEvents();
  }, [loadCalendarEvents]);

  const handleRefresh = () => {
    loadCalendarEvents();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleNewEvent = () => {
    setShowEventCreator(true);
  };

  const handleEventCreated = () => {
    setShowEventCreator(false);
    loadCalendarEvents(); // Recargar eventos después de crear uno nuevo
  };

  // Funciones para manejar el modal de detalles de eventos
  const handleEventClick = (event: CalendarEvent) => {
    // Convertir CalendarEvent a ReproductiveEvent para EventDetails
    const reproductiveEvent = {
      ...event,
      type: event.type as 'parto' | 'apareamiento' | 'chequeo' | 'vacunacion' | 'destete' | 'evaluacion',
      status: event.status as 'programado' | 'completado' | 'cancelado' | 'vencido',
      allDay: event.allDay || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setSelectedEvent(reproductiveEvent as any);
    setShowEventDetails(true);
  };

  const handleEventDetailsClose = () => {
    setShowEventDetails(false);
    setSelectedEvent(null);
  };

  const handleEventUpdated = () => {
    loadCalendarEvents(); // Recargar eventos después de actualizar
    setShowEventDetails(false);
    setSelectedEvent(null);
  };

  // Funciones para filtros
  const applyFilters = (events: CalendarEvent[]) => {
    return events.filter(event => {
      // Filtro por tipo de evento
      if (filters.eventTypes.length > 0 && !filters.eventTypes.includes(event.type)) {
        return false;
      }
      
      // Filtro por prioridad
      if (filters.priorities.length > 0 && event.priority && !filters.priorities.includes(event.priority)) {
        return false;
      }
      
      // Filtro solo eventos vencidos
      if (filters.showOverdueOnly && !isEventOverdue(event)) {
        return false;
      }
      
      return true;
    });
  };

  const handleFilterChange = (filterType: 'eventTypes' | 'priorities', value: string) => {
    setFilters(prev => {
      const currentValues = prev[filterType];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return { ...prev, [filterType]: newValues };
    });
  };

  const handleClearFilters = () => {
    setFilters({
      eventTypes: [],
      priorities: [],
      showOverdueOnly: false
    });
  };

  // Funciones para detectar eventos vencidos
  const isEventOverdue = (event: CalendarEvent): boolean => {
    const now = new Date();
    const eventDate = new Date(event.startDate || event.date);
    
    // Si el evento ya está completado o cancelado, no está vencido
    if (event.status === 'completado' || (event.status as any) === 'cancelado') {
      return false;
    }
    
    // Si es un evento de todo el día, comparar solo fechas
    if (event.allDay) {
      const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return eventDateOnly < nowDateOnly;
    }
    
    // Para eventos con hora específica, comparar fecha y hora
    return eventDate < now;
  };

  const updateEventStatuses = (events: CalendarEvent[]): CalendarEvent[] => {
    return events.map(event => {
      if (event.status === 'programado' && isEventOverdue(event)) {
        return { ...event, status: 'vencido' as const };
      }
      return event;
    });
  };

  // Actualizar estados de eventos y aplicar filtros
  const eventsWithUpdatedStatus = updateEventStatuses(events);
  const filteredEvents = applyFilters(eventsWithUpdatedStatus);
  const overdueEvents = eventsWithUpdatedStatus.filter(isEventOverdue);
  const overdueCount = overdueEvents.length;

  // Función helper para formatear fechas de manera segura
  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha inválida';
    }
  };

  const getEventColor = (type: string, status: string): MuiColor => {
    // Prioridad a los estados especiales
    if (status === 'vencido' || status === 'overdue') return 'error';
    if (status === 'completado' || status === 'completed') return 'success';
    
    // Colores por tipo de evento para eventos programados
    switch (type) {
      case 'parto':
      case 'birth': return 'primary';
      case 'apareamiento':
      case 'breeding': return 'secondary';
      case 'chequeo':
      case 'checkup': return 'info';
      case 'vacunacion':
      case 'vaccination': return 'warning';
      case 'destete': return 'success';
      case 'evaluacion': return 'default';
      default: return 'default';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      // Tipos en español (del EventCreator)
      case 'parto': return '🐹';
      case 'apareamiento': return '💕';
      case 'chequeo': return '🏥';
      case 'vacunacion': return '💉';
      case 'destete': return '🍼';
      case 'evaluacion': return '📋';
      // Tipos en inglés (para compatibilidad)
      case 'birth': return '🐹';
      case 'breeding': return '💕';
      case 'checkup': return '🔍';
      case 'vaccination': return '💉';
      default: return '📅';
    }
  };

  // Funciones para manejar prioridad
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low': return '🟢';
      case 'medium': return '🔵';
      case 'high': return '🟠';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Baja';
      case 'medium': return 'Media';
      case 'high': return 'Alta';
      case 'critical': return 'Crítica';
      default: return priority;
    }
  };

  const getPriorityColor = (priority: string): 'success' | 'info' | 'warning' | 'error' | 'default' => {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'info';
      case 'high': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  // Generar días del mes
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getEventsForDay = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString().split('T')[0];
    return filteredEvents.filter(event => event.date === dateStr);
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando calendario...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Calendario Reproductivo
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleNewEvent}
            size="small"
          >
            Nuevo Evento
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            size="small"
          >
            Actualizar
          </Button>
        </Box>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Controles de Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Filtros
          </Typography>
          {/* Contador de eventos vencidos */}
          {overdueCount > 0 && (
            <Alert severity="warning" sx={{ py: 0.5 }}>
              ⚠️ {overdueCount} evento{overdueCount > 1 ? 's' : ''} vencido{overdueCount > 1 ? 's' : ''}
            </Alert>
          )}
        </Box>
        
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
          {/* Filtro por tipo de evento */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Tipo de Evento
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {[
                { value: 'parto', label: 'Parto', icon: '🐹' },
                { value: 'apareamiento', label: 'Apareamiento', icon: '💕' },
                { value: 'chequeo', label: 'Chequeo', icon: '🏥' },
                { value: 'vacunacion', label: 'Vacunación', icon: '💉' },
                { value: 'destete', label: 'Destete', icon: '🍼' },
                { value: 'evaluacion', label: 'Evaluación', icon: '📋' }
              ].map((eventType) => (
                <Chip
                  key={eventType.value}
                  label={`${eventType.icon} ${eventType.label}`}
                  variant={filters.eventTypes.includes(eventType.value) ? 'filled' : 'outlined'}
                  color={filters.eventTypes.includes(eventType.value) ? 'primary' : 'default'}
                  onClick={() => handleFilterChange('eventTypes', eventType.value)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>

          {/* Filtro por prioridad */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Prioridad
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {[
                { value: 'low', label: 'Baja', icon: '🟢', color: 'success' },
                { value: 'medium', label: 'Media', icon: '🔵', color: 'info' },
                { value: 'high', label: 'Alta', icon: '🟠', color: 'warning' },
                { value: 'critical', label: 'Crítica', icon: '🔴', color: 'error' }
              ].map((priority) => (
                <Chip
                  key={priority.value}
                  label={`${priority.icon} ${priority.label}`}
                  variant={filters.priorities.includes(priority.value) ? 'filled' : 'outlined'}
                  color={filters.priorities.includes(priority.value) ? priority.color as 'success' | 'info' | 'warning' | 'error' : 'default'}
                  onClick={() => handleFilterChange('priorities', priority.value)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>

          {/* Filtro de eventos vencidos */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Estado
            </Typography>
            <Chip
              label="⚠️ Solo Vencidos"
              variant={filters.showOverdueOnly ? 'filled' : 'outlined'}
              color={filters.showOverdueOnly ? 'error' : 'default'}
              onClick={() => setFilters(prev => ({ ...prev, showOverdueOnly: !prev.showOverdueOnly }))}
              sx={{ cursor: 'pointer' }}
            />
          </Box>

          {/* Botón limpiar filtros */}
          <Box>
            <Button
              variant="outlined"
              size="small"
              onClick={handleClearFilters}
              disabled={filters.eventTypes.length === 0 && filters.priorities.length === 0 && !filters.showOverdueOnly}
            >
              Limpiar Filtros
            </Button>
          </Box>
        </Box>

        {/* Indicador de filtros activos */}
        {(filters.eventTypes.length > 0 || filters.priorities.length > 0) && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Mostrando {filteredEvents.length} de {events.length} eventos
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Navegación del calendario */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={handlePrevMonth}>
              <NavigateBefore />
            </IconButton>
            <Typography variant="h6">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Typography>
            <IconButton onClick={handleNextMonth}>
              <NavigateNext />
            </IconButton>
          </Box>
          <Button
            variant="outlined"
            startIcon={<TodayIcon />}
            onClick={handleToday}
            size="small"
          >
            Hoy
          </Button>
        </Box>
      </Paper>

      {/* Calendario */}
      <Paper sx={{ p: 2 }}>
        {/* Encabezados de días */}
        <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1} sx={{ mb: 1 }}>
          {dayNames.map((dayName) => (
            <Box
              key={dayName}
              sx={{
                p: 1,
                textAlign: 'center',
                fontWeight: 'bold',
                bgcolor: 'grey.100',
                borderRadius: 1
              }}
            >
              <Typography variant="body2">{dayName}</Typography>
            </Box>
          ))}
        </Box>

        {/* Días del calendario */}
        <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1}>
          {calendarDays.map((day, index) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            const isToday = day && 
              new Date().toDateString() === 
              new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

            return (
              <Card
                key={index}
                sx={{
                  minHeight: 120,
                  bgcolor: day ? (isToday ? 'primary.50' : 'white') : 'grey.50',
                  border: isToday ? 2 : 1,
                  borderColor: isToday ? 'primary.main' : 'grey.200',
                  cursor: day ? 'pointer' : 'default'
                }}
                onClick={() => day && setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
              >
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                  {day && (
                    <>
                      <Typography
                        variant="body2"
                        fontWeight={isToday ? 'bold' : 'normal'}
                        color={isToday ? 'primary.main' : 'text.primary'}
                      >
                        {day}
                      </Typography>
                      
                      {/* Eventos del día */}
                      {dayEvents.map((event) => (
                        <Chip
                          key={event.id}
                          label={getEventIcon(event.type)}
                          size="small"
                          color={getEventColor(event.type, event.status)}
                          onClick={(e) => {
                            e.stopPropagation(); // Evitar que se active el click del día
                            handleEventClick(event);
                          }}
                          sx={{ 
                            mt: 0.5, 
                            mr: 0.5, 
                            fontSize: '14px',
                            height: 28,
                            minWidth: 28,
                            cursor: 'pointer',
                            '&:hover': {
                              opacity: 0.8,
                              transform: 'scale(1.1)'
                            }
                          }}
                        />
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Paper>

      {/* Lista de eventos próximos */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Eventos Próximos
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {filteredEvents.length > 0 ? (
          filteredEvents.slice(0, 5).map((event) => (
            <Box key={event.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              {/* Línea principal con título y fecha */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {getEventIcon(event.type)} {event.title}
                  </Typography>
                  <Chip
                    label={event.status}
                    color={getEventColor(event.type, event.status)}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                  {formatEventDate(event.date)}
                </Typography>
              </Box>

              {/* Información adicional */}
              <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
                {/* Hora del evento */}
                {event.startDate && !event.allDay && (
                  <Chip
                    label={`🕐 ${new Date(event.startDate).toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                )}
                
                {/* Todo el día */}
                {event.allDay && (
                  <Chip
                    label="📅 Todo el día"
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                )}

                {/* Prioridad */}
                {event.priority && event.priority !== 'medium' && (
                  <Chip
                    label={`${getPriorityIcon(event.priority)} ${getPriorityLabel(event.priority)}`}
                    size="small"
                    color={getPriorityColor(event.priority)}
                    sx={{ fontSize: '0.75rem' }}
                  />
                )}

                {/* Animal asociado */}
                {event.animalId && (
                  <Chip
                    label={`🐹 Animal #${event.animalId}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                )}
              </Box>

              {/* Descripción */}
              {event.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                  {event.description}
                </Typography>
              )}
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            No hay eventos programados
          </Typography>
        )}
      </Paper>

      {/* Modal para crear eventos */}
      <EventCreator
        open={showEventCreator}
        onClose={() => setShowEventCreator(false)}
        initialDate={selectedDate}
        onEventCreated={handleEventCreated}
      />

      {/* Modal para detalles de eventos */}
      <EventDetails
        event={selectedEvent as unknown}
        open={showEventDetails}
        onClose={handleEventDetailsClose}
        onEventUpdated={handleEventUpdated}
      />
    </Box>
  );
};

export default ReproductiveCalendar;