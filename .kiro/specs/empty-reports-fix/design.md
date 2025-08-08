# Design Document - Corrección de Reportes Vacíos

## Overview

El problema de los reportes vacíos se debe a que el sistema actual de reportes está completamente enfocado en la gestión de trabajos de exportación (jobs, archivos, limpieza, etc.) pero **carece completamente de la lógica para obtener datos reales de la base de datos**. El método `generateReportData` en `jobQueue.service.ts` está devolviendo datos de prueba vacíos en lugar de consultar la base de datos real.

### Problema Identificado

1. **Falta de servicios de datos**: No existen servicios dedicados a obtener datos específicos para cada tipo de reporte
2. **Generación de datos vacía**: El `generateReportData` devuelve una estructura básica sin datos reales
3. **Sin consultas a la base de datos**: Los generadores de archivos (PDF, Excel, CSV) reciben datos vacíos
4. **Datos de seed insuficientes**: Los datos de prueba pueden no ser suficientes para demostrar funcionalidad

## Architecture

### Current Architecture (Problematic)
```
Frontend Request → Controller → JobQueue → generateReportData() → Empty Data → File Generators → Empty Files
```

### Proposed Architecture (Solution)
```
Frontend Request → Controller → JobQueue → ReportDataService → Database Queries → Real Data → File Generators → Populated Files
```

## Components and Interfaces

### 1. ReportDataService (New)
Servicio central que obtiene datos reales de la base de datos para cada tipo de reporte.

```typescript
interface ReportDataService {
  getFinancialReportData(parameters: ReportParameters): Promise<FinancialReportData>
  getInventoryReportData(parameters: ReportParameters): Promise<InventoryReportData>
  getReproductiveReportData(parameters: ReportParameters): Promise<ReproductiveReportData>
  getHealthReportData(parameters: ReportParameters): Promise<HealthReportData>
}
```

### 2. Report Data Interfaces
Interfaces específicas para cada tipo de reporte con datos estructurados.

```typescript
interface FinancialReportData {
  summary: {
    totalIncome: number
    totalExpenses: number
    netProfit: number
    profitMargin: number
  }
  sales: SaleRecord[]
  expenses: ExpenseRecord[]
  charts: ChartData[]
  period: DateRange
}

interface InventoryReportData {
  summary: {
    totalCuyes: number
    totalGalpones: number
    totalJaulas: number
    occupancyRate: number
  }
  cuyes: CuyRecord[]
  galpones: GalponRecord[]
  distribution: DistributionData[]
  alerts: AlertRecord[]
}

interface ReproductiveReportData {
  summary: {
    activePregnancies: number
    expectedBirths: number
    fertilityRate: number
    averageLitterSize: number
  }
  pregnancies: PregnancyRecord[]
  litters: LitterRecord[]
  projections: ProjectionData[]
  statistics: ReproductiveStats[]
}
```

### 3. Enhanced JobQueue Integration
Modificar el `jobQueue.service.ts` para usar el nuevo `ReportDataService`.

```typescript
private async generateReportData(job: QueuedJob): Promise<any> {
  const reportDataService = new ReportDataService();
  
  switch (job.templateId) {
    case 'financial':
      return await reportDataService.getFinancialReportData(job.parameters);
    case 'inventory':
      return await reportDataService.getInventoryReportData(job.parameters);
    case 'reproductive':
      return await reportDataService.getReproductiveReportData(job.parameters);
    case 'health':
      return await reportDataService.getHealthReportData(job.parameters);
    default:
      throw new Error(`Unknown template: ${job.templateId}`);
  }
}
```

### 4. Database Query Optimization
Consultas optimizadas para cada tipo de reporte con joins apropiados y filtros eficientes.

## Data Models

### Financial Report Queries
```sql
-- Sales data with customer information
SELECT v.*, c.nombre as cliente_nombre, c.telefono
FROM "Venta" v
LEFT JOIN "Cliente" c ON v.clienteId = c.id
WHERE v.fechaVenta BETWEEN ? AND ?

-- Expenses data with categories
SELECT g.*, 'gasto' as tipo
FROM "Gasto" g
WHERE g.fechaGasto BETWEEN ? AND ?
```

### Inventory Report Queries
```sql
-- Cuyes with galpon and jaula information
SELECT c.*, g.nombre as galpon_nombre, j.numero as jaula_numero, e.nombre as etapa_nombre
FROM "Cuy" c
LEFT JOIN "Jaula" j ON c.jaulaId = j.id
LEFT JOIN "Galpon" g ON j.galponId = g.id
LEFT JOIN "EtapaVida" e ON c.etapaVidaId = e.id

-- Galpon occupancy statistics
SELECT g.*, COUNT(c.id) as cuyes_count, g.capacidad
FROM "Galpon" g
LEFT JOIN "Jaula" j ON j.galponId = g.id
LEFT JOIN "Cuy" c ON c.jaulaId = j.id
GROUP BY g.id
```

### Reproductive Report Queries
```sql
-- Active pregnancies with expected dates
SELECT p.*, cm.nombre as madre_nombre, cp.nombre as padre_nombre
FROM "Prenez" p
LEFT JOIN "Cuy" cm ON p.madreId = cm.id
LEFT JOIN "Cuy" cp ON p.padreId = cp.id
WHERE p.estado = 'activa'

-- Recent litters with statistics
SELECT c.*, COUNT(cr.id) as total_crias
FROM "Camada" c
LEFT JOIN "Cuy" cr ON cr.camadaId = c.id
WHERE c.fechaNacimiento >= ?
GROUP BY c.id
```

## Error Handling

### 1. Data Validation
- Validar parámetros de entrada (fechas, filtros)
- Verificar que existen datos en el rango solicitado
- Manejar casos donde no hay datos disponibles

### 2. Query Error Handling
- Timeout en consultas largas
- Errores de conexión a base de datos
- Datos corruptos o inconsistentes

### 3. User-Friendly Messages
- Mensajes claros cuando no hay datos
- Sugerencias para ajustar filtros
- Información sobre períodos con datos disponibles

## Testing Strategy

### 1. Unit Tests
- Tests para cada método de `ReportDataService`
- Mocks de base de datos con datos conocidos
- Validación de estructura de datos devueltos

### 2. Integration Tests
- Tests end-to-end desde request hasta archivo generado
- Tests con datos reales de seed mejorado
- Validación de contenido de archivos generados

### 3. Data Quality Tests
- Verificar que los totales suman correctamente
- Validar relaciones entre entidades
- Comprobar consistencia de datos

## Implementation Plan

### Phase 1: Core Data Services
1. Crear `ReportDataService` con métodos básicos
2. Implementar consultas para reporte financiero
3. Integrar con `jobQueue.service.ts`
4. Probar generación de reporte financiero

### Phase 2: Complete Report Types
1. Implementar consultas para reporte de inventario
2. Implementar consultas para reporte reproductivo
3. Implementar consultas para reporte de salud
4. Probar todos los tipos de reportes

### Phase 3: Enhanced Seed Data
1. Mejorar datos de seed con más volumen
2. Crear datos distribuidos en diferentes períodos
3. Asegurar relaciones completas entre entidades
4. Validar que todos los reportes muestran datos

### Phase 4: Error Handling & UX
1. Implementar manejo de errores robusto
2. Crear mensajes informativos para usuarios
3. Agregar validaciones de parámetros
4. Optimizar rendimiento de consultas

## Performance Considerations

### Database Optimization
- Índices en campos de fecha para filtros temporales
- Índices en foreign keys para joins eficientes
- Paginación para reportes con muchos datos

### Caching Strategy
- Cache de datos agregados (totales, estadísticas)
- Cache de consultas frecuentes
- Invalidación de cache cuando cambian datos

### Memory Management
- Streaming para reportes grandes
- Procesamiento por lotes
- Límites de memoria para generación de archivos

## Security Considerations

### Data Access Control
- Verificar permisos de usuario para datos solicitados
- Filtrar datos según rol del usuario
- Auditoría de acceso a reportes sensibles

### Input Validation
- Sanitización de parámetros de fecha
- Validación de filtros de consulta
- Prevención de inyección SQL

## Monitoring and Logging

### Performance Monitoring
- Tiempo de ejecución de consultas
- Uso de memoria durante generación
- Tasa de éxito/fallo de reportes

### Business Intelligence
- Reportes más solicitados
- Patrones de uso por usuario
- Identificación de datos faltantes

## Migration Strategy

### Backward Compatibility
- Mantener APIs existentes funcionando
- Migración gradual de generadores
- Rollback plan si hay problemas

### Data Migration
- No se requiere migración de datos
- Solo cambios en lógica de aplicación
- Tests exhaustivos antes de despliegue