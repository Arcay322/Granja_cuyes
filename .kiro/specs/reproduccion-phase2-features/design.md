# Design Document

## Overview

La Fase 2 de mejoras del módulo de reproducción introduce funcionalidades avanzadas que transforman la experiencia de gestión reproductiva en SUMAQ UYWA. Este diseño se enfoca en crear herramientas visuales, sistemas de alertas inteligentes, planificación temporal y capacidades de reporte que eleven significativamente la eficiencia operativa.

## Architecture

### Frontend Architecture

```
src/
├── components/
│   ├── dashboard/
│   │   ├── ReproductiveDashboard.tsx          # Dashboard principal mejorado
│   │   ├── InteractiveCharts.tsx              # Gráficos interactivos
│   │   ├── MetricsCards.tsx                   # Tarjetas de métricas
│   │   └── RealTimeUpdates.tsx                # Actualizaciones en tiempo real
│   ├── alerts/
│   │   ├── AlertsManager.tsx                  # Gestor de alertas
│   │   ├── AlertsConfiguration.tsx            # Configuración de alertas
│   │   ├── NotificationCenter.tsx             # Centro de notificaciones
│   │   └── AlertsHistory.tsx                  # Historial de alertas
│   ├── calendar/
│   │   ├── ReproductiveCalendar.tsx           # Calendario principal
│   │   ├── EventDetails.tsx                   # Detalles de eventos
│   │   ├── EventCreator.tsx                   # Creador de eventos
│   │   └── CalendarViews.tsx                  # Vistas del calendario
│   └── reports/
│       ├── ReportsGenerator.tsx               # Generador de reportes
│       ├── ReportCustomizer.tsx               # Personalizador
│       ├── ExportOptions.tsx                  # Opciones de exportación
│       └── ReportsHistory.tsx                 # Historial de reportes
```

### Backend Architecture

```
backend/src/
├── services/
│   ├── dashboard/
│   │   ├── metrics.service.ts                 # Servicio de métricas
│   │   ├── charts.service.ts                  # Servicio de gráficos
│   │   └── realtime.service.ts                # Actualizaciones tiempo real
│   ├── alerts/
│   │   ├── alerts.service.ts                  # Servicio de alertas
│   │   ├── notifications.service.ts           # Servicio de notificaciones
│   │   └── scheduler.service.ts               # Programador de alertas
│   ├── calendar/
│   │   ├── events.service.ts                  # Servicio de eventos
│   │   ├── planning.service.ts                # Servicio de planificación
│   │   └── validation.service.ts              # Validación de eventos
│   └── reports/
│       ├── generator.service.ts               # Generador de reportes
│       ├── export.service.ts                  # Servicio de exportación
│       └── templates.service.ts               # Plantillas de reportes
├── controllers/
│   ├── dashboard.controller.ts                # Controlador dashboard
│   ├── alerts.controller.ts                   # Controlador alertas
│   ├── calendar.controller.ts                 # Controlador calendario
│   └── reports.controller.ts                  # Controlador reportes
└── jobs/
    ├── alertsScheduler.job.ts                 # Job de alertas programadas
    └── metricsUpdater.job.ts                  # Job de actualización métricas
```

## Components and Interfaces

### Dashboard Visual Mejorado

#### ReproductiveDashboard Component
- **Props**: `filters: DashboardFilters, refreshInterval: number`
- **State**: `metrics: DashboardMetrics, loading: boolean, error: string`
- **Features**:
  - Gráficos interactivos con Chart.js/Recharts
  - Métricas en tiempo real con WebSocket
  - Filtros dinámicos por fecha, galpón, raza
  - Diseño responsivo con Material-UI Grid

#### InteractiveCharts Component
- **Charts Types**: Line, Bar, Pie, Doughnut, Area
- **Data Sources**: Tasas de éxito, ciclos activos, proyecciones
- **Interactions**: Zoom, filtrado, drill-down
- **Export**: PNG, SVG, PDF

### Sistema de Alertas Avanzado

#### AlertsManager Component
- **Alert Types**: Partos próximos, preñeces vencidas, reproductoras inactivas
- **Configuration**: Umbrales personalizables, destinatarios, frecuencia
- **Delivery**: In-app notifications, email (futuro), push notifications
- **History**: Registro completo de alertas generadas y acciones tomadas

#### Notification System
```typescript
interface Alert {
  id: string;
  type: AlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data: any;
  createdAt: Date;
  readAt?: Date;
  actionTaken?: string;
}

interface AlertRule {
  id: string;
  name: string;
  type: AlertType;
  conditions: AlertCondition[];
  actions: AlertAction[];
  enabled: boolean;
}
```

### Calendario Reproductivo

#### ReproductiveCalendar Component
- **Views**: Month, Week, Day, Agenda
- **Events**: Partos programados, apareamientos, chequeos
- **Interactions**: Drag & drop, click to create, edit in place
- **Integration**: Sincronización con datos de preñez y camadas

#### Event Management
```typescript
interface ReproductiveEvent {
  id: string;
  type: 'parto' | 'apareamiento' | 'chequeo' | 'vacunacion';
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  animalId?: number;
  prenezId?: number;
  status: 'programado' | 'completado' | 'cancelado';
  reminders: Reminder[];
}
```

### Exportación de Reportes

#### ReportsGenerator Component
- **Templates**: Predefinidas y personalizables
- **Formats**: PDF, Excel, CSV
- **Content**: Tablas, gráficos, estadísticas, imágenes
- **Scheduling**: Reportes automáticos programados

#### Export Service Architecture
```typescript
interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  parameters: ReportParameter[];
}

interface ExportJob {
  id: string;
  templateId: string;
  parameters: Record<string, any>;
  format: 'pdf' | 'excel' | 'csv';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filePath?: string;
  createdAt: Date;
  completedAt?: Date;
}
```

## Data Models

### Dashboard Metrics
```typescript
interface DashboardMetrics {
  reproductiveStats: {
    activePregnancies: number;
    expectedBirths: number;
    successRate: number;
    averageLitterSize: number;
  };
  performanceMetrics: {
    topPerformingMothers: Animal[];
    topPerformingFathers: Animal[];
    breedingEfficiency: number;
  };
  trends: {
    monthlyBirths: ChartData;
    successRateHistory: ChartData;
    capacityUtilization: ChartData;
  };
}
```

### Alert Configuration
```typescript
interface AlertConfiguration {
  birthReminders: {
    enabled: boolean;
    daysBefore: number[];
    recipients: string[];
  };
  overduePregnancies: {
    enabled: boolean;
    daysOverdue: number;
    checkFrequency: 'daily' | 'weekly';
  };
  inactiveReproducers: {
    enabled: boolean;
    inactiveDays: number;
    excludeRetired: boolean;
  };
}
```

## Error Handling

### Dashboard Error Handling
- **Network Errors**: Retry logic with exponential backoff
- **Data Errors**: Graceful degradation with partial data display
- **Chart Errors**: Fallback to table view when charts fail
- **Real-time Errors**: Automatic reconnection for WebSocket

### Alert System Error Handling
- **Delivery Failures**: Queue system with retry mechanism
- **Configuration Errors**: Validation with user-friendly messages
- **Scheduling Errors**: Fallback to manual alert generation

### Export Error Handling
- **Generation Failures**: Detailed error reporting with suggestions
- **Format Errors**: Alternative format suggestions
- **Large Dataset Handling**: Chunked processing with progress indicators

## Testing Strategy

### Unit Testing
- **Dashboard Components**: Chart rendering, data transformation, filtering
- **Alert Services**: Rule evaluation, notification delivery, scheduling
- **Calendar Components**: Event creation, validation, date calculations
- **Export Services**: Template processing, format conversion, file generation

### Integration Testing
- **Real-time Updates**: WebSocket connection and data synchronization
- **Alert Workflows**: End-to-end alert generation and delivery
- **Calendar Integration**: Event synchronization with reproduction data
- **Export Workflows**: Complete report generation and download process

### Performance Testing
- **Dashboard Loading**: Large dataset handling and chart rendering
- **Alert Processing**: Bulk alert generation and delivery
- **Calendar Rendering**: Large number of events display
- **Export Generation**: Large report processing times

### User Experience Testing
- **Responsive Design**: All screen sizes and orientations
- **Accessibility**: Screen readers, keyboard navigation, color contrast
- **Usability**: Task completion rates, error recovery, user satisfaction
- **Cross-browser**: Chrome, Firefox, Safari, Edge compatibility

## Security Considerations

### Data Access Control
- **Role-based Access**: Different dashboard views for different user roles
- **Alert Permissions**: User-specific alert configuration and viewing
- **Export Restrictions**: Sensitive data filtering based on user permissions

### Data Privacy
- **Report Anonymization**: Option to exclude sensitive animal identifiers
- **Export Audit**: Logging of all report generations and downloads
- **Data Retention**: Automatic cleanup of temporary export files

## Performance Optimization

### Dashboard Performance
- **Lazy Loading**: Charts and components loaded on demand
- **Data Caching**: Intelligent caching of metrics and chart data
- **Virtual Scrolling**: For large data tables and lists
- **Debounced Updates**: Prevent excessive API calls during filtering

### Real-time Performance
- **WebSocket Optimization**: Efficient message batching and compression
- **Selective Updates**: Only update changed data sections
- **Connection Management**: Automatic reconnection and heartbeat

### Export Performance
- **Background Processing**: Large reports generated asynchronously
- **Streaming**: Large datasets processed in chunks
- **Caching**: Template and partial result caching
- **Compression**: Automatic file compression for downloads