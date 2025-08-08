# Documento de Diseño - Mejoras del Calendario Reproductivo

## Visión General

Este diseño aborda las mejoras prioritarias identificadas para el calendario reproductivo: interactividad con eventos mediante modales de detalles, sistema de filtros para mejorar la navegación, y detección visual de eventos vencidos. La solución se enfoca en mejorar la experiencia de usuario manteniendo la funcionalidad existente y agregando nuevas capacidades de manera intuitiva.

## Arquitectura

### Componentes Principales

1. **Sistema de Interactividad con Eventos**
   - Integración del componente EventDetails existente
   - Manejo de estado para modal de detalles
   - Comunicación entre calendario y modal de detalles

2. **Sistema de Filtros**
   - Controles de filtro en la interfaz
   - Lógica de filtrado en tiempo real
   - Estado de filtros persistente durante la sesión

3. **Detección de Eventos Vencidos**
   - Lógica para detectar eventos pasados
   - Actualización automática de estados
   - Indicadores visuales diferenciados

4. **Mejoras de Estado y Navegación**
   - Gestión mejorada del estado del calendario
   - Actualización automática después de cambios
   - Feedback visual para acciones del usuario

## Componentes e Interfaces

### 1. Sistema de Interactividad con Eventos

```typescript
interface EventInteractionState {
  selectedEvent: CalendarEvent | null;
  showEventDetails: boolean;
  isEventDetailsLoading: boolean;
}

interface EventClickHandler {
  handleEventClick: (event: CalendarEvent) => void;
  handleEventDetailsClose: () => void;
  handleEventUpdated: () => void;
}
```

### 2. Sistema de Filtros

```typescript
interface CalendarFilters {
  eventTypes: string[];
  priorities: string[];
  statuses: string[];
  showOverdueOnly: boolean;
}

interface FilterControls {
  filters: CalendarFilters;
  onFilterChange: (filters: CalendarFilters) => void;
  onClearFilters: () => void;
  availableEventTypes: EventType[];
  availablePriorities: Priority[];
}

interface EventType {
  value: string;
  label: string;
  icon: string;
  color: string;
}

interface Priority {
  value: string;
  label: string;
  color: string;
  icon: string;
}
```

### 3. Detección de Eventos Vencidos

```typescript
interface OverdueDetection {
  isEventOverdue: (event: CalendarEvent) => boolean;
  getOverdueEvents: (events: CalendarEvent[]) => CalendarEvent[];
  updateEventStatuses: (events: CalendarEvent[]) => CalendarEvent[];
}

interface OverdueIndicators {
  overdueCount: number;
  overdueEvents: CalendarEvent[];
  showOverdueAlert: boolean;
}
```

### 4. Estado Mejorado del Calendario

```typescript
interface EnhancedCalendarState {
  events: CalendarEvent[];
  filteredEvents: CalendarEvent[];
  filters: CalendarFilters;
  selectedEvent: CalendarEvent | null;
  showEventDetails: boolean;
  overdueCount: number;
  loading: boolean;
  error: string | null;
}
```

## Modelos de Datos

### 1. Evento de Calendario Extendido

```typescript
interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startDate?: string;
  endDate?: string;
  type: EventType;
  status: 'programado' | 'completado' | 'cancelado' | 'vencido';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  allDay?: boolean;
  animalId?: number;
  metadata?: Record<string, any>;
  isOverdue?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

### 2. Configuración de Filtros

```typescript
interface FilterConfiguration {
  eventTypes: {
    parto: { label: 'Parto', icon: '🐹', color: 'primary' };
    apareamiento: { label: 'Apareamiento', icon: '💕', color: 'secondary' };
    chequeo: { label: 'Chequeo', icon: '🏥', color: 'info' };
    vacunacion: { label: 'Vacunación', icon: '💉', color: 'warning' };
    destete: { label: 'Destete', icon: '🍼', color: 'success' };
    evaluacion: { label: 'Evaluación', icon: '📋', color: 'default' };
  };
  priorities: {
    low: { label: 'Baja', color: 'success', icon: '🟢' };
    medium: { label: 'Media', color: 'info', icon: '🔵' };
    high: { label: 'Alta', color: 'warning', icon: '🟠' };
    critical: { label: 'Crítica', color: 'error', icon: '🔴' };
  };
}
```

### 3. Respuesta de API Mejorada

```typescript
interface CalendarApiResponse {
  success: boolean;
  data: CalendarEvent[];
  overdueCount: number;
  totalEvents: number;
  message: string;
  timestamp: Date;
}
```

## Lógica de Negocio

### 1. Detección de Eventos Vencidos

```typescript
const isEventOverdue = (event: CalendarEvent): boolean => {
  const now = new Date();
  const eventDate = new Date(event.startDate || event.date);
  
  // Si el evento ya está completado o cancelado, no está vencido
  if (event.status === 'completado' || event.status === 'cancelado') {
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
```

### 2. Lógica de Filtrado

```typescript
const applyFilters = (events: CalendarEvent[], filters: CalendarFilters): CalendarEvent[] => {
  return events.filter(event => {
    // Filtro por tipo de evento
    if (filters.eventTypes.length > 0 && !filters.eventTypes.includes(event.type)) {
      return false;
    }
    
    // Filtro por prioridad
    if (filters.priorities.length > 0 && !filters.priorities.includes(event.priority)) {
      return false;
    }
    
    // Filtro por estado
    if (filters.statuses.length > 0 && !filters.statuses.includes(event.status)) {
      return false;
    }
    
    // Filtro solo eventos vencidos
    if (filters.showOverdueOnly && !isEventOverdue(event)) {
      return false;
    }
    
    return true;
  });
};
```

### 3. Actualización Automática de Estados

```typescript
const updateEventStatuses = (events: CalendarEvent[]): CalendarEvent[] => {
  return events.map(event => {
    if (event.status === 'programado' && isEventOverdue(event)) {
      return { ...event, status: 'vencido', isOverdue: true };
    }
    return { ...event, isOverdue: isEventOverdue(event) };
  });
};
```

## Interfaz de Usuario

### 1. Controles de Filtro

```typescript
interface FilterControlsUI {
  position: 'top' | 'sidebar';
  layout: 'horizontal' | 'vertical';
  components: {
    eventTypeFilter: MultiSelectChips;
    priorityFilter: MultiSelectChips;
    statusFilter: MultiSelectChips;
    overdueToggle: Switch;
    clearFiltersButton: Button;
  };
}
```

### 2. Indicadores Visuales

```typescript
interface VisualIndicators {
  overdueEvents: {
    backgroundColor: 'error.light';
    borderColor: 'error.main';
    textColor: 'error.contrastText';
    icon: '⚠️';
  };
  eventPriorities: {
    critical: { borderLeft: '4px solid red' };
    high: { borderLeft: '4px solid orange' };
    medium: { borderLeft: '4px solid blue' };
    low: { borderLeft: '4px solid green' };
  };
}
```

### 3. Modal de Detalles Integrado

```typescript
interface EventDetailsIntegration {
  trigger: 'click' | 'doubleClick';
  modal: EventDetails;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}
```

## Estrategia de Implementación

### 1. Fase 1: Click en Eventos → Modal de Detalles
- Integrar componente EventDetails existente
- Agregar manejo de click en eventos
- Implementar comunicación entre componentes
- Probar flujo completo de interacción

### 2. Fase 2: Sistema de Filtros
- Crear componentes de filtro
- Implementar lógica de filtrado
- Agregar controles de interfaz
- Probar combinaciones de filtros

### 3. Fase 3: Detección de Eventos Vencidos
- Implementar lógica de detección
- Agregar indicadores visuales
- Crear actualización automática
- Probar diferentes escenarios de tiempo

### 4. Fase 4: Integración y Pulimiento
- Combinar todas las funcionalidades
- Optimizar rendimiento
- Mejorar experiencia de usuario
- Pruebas completas del sistema

## Consideraciones de Rendimiento

### 1. Filtrado Eficiente
- Usar useMemo para cálculos de filtrado
- Evitar re-renderizados innecesarios
- Optimizar comparaciones de fechas

### 2. Detección de Eventos Vencidos
- Calcular solo cuando sea necesario
- Cache de resultados de detección
- Actualización inteligente de estados

### 3. Gestión de Estado
- Minimizar re-renders del calendario
- Estado local vs global optimizado
- Lazy loading de detalles de eventos

## Accesibilidad y UX

### 1. Navegación por Teclado
- Tab navigation en filtros
- Enter/Space para abrir detalles
- Escape para cerrar modales

### 2. Indicadores Claros
- Colores con suficiente contraste
- Íconos descriptivos
- Texto alternativo apropiado

### 3. Feedback Visual
- Loading states durante filtrado
- Confirmación de acciones
- Mensajes de error claros