# Design Document

## Overview

This design document outlines the technical approach for Phase 1 optimizations of the Reproduction module. The focus is on improving performance, reliability, and maintainability through backend query optimization, enhanced validation, basic caching, and responsive design improvements.

## Architecture

### Backend Optimization Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Controllers   │───▶│   Services      │───▶│   Database      │
│                 │    │                 │    │                 │
│ - Input Validation   │ - Optimized     │    │ - Prisma ORM    │
│ - Error Handling     │   Queries       │    │ - Efficient     │
│ - Response Format    │ - Caching Layer │    │   Joins         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Frontend Optimization Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Components    │───▶│   Services      │───▶│   API Layer     │
│                 │    │                 │    │                 │
│ - Responsive    │    │ - Error         │    │ - Optimized     │
│   Design        │    │   Handling      │    │   Requests      │
│ - Form          │    │ - Validation    │    │ - Caching       │
│   Validation    │    │ - State Mgmt    │    │ - Retry Logic   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components and Interfaces

### 1. Optimized Database Queries

#### Enhanced Prenez Service
```typescript
interface OptimizedPrenezQuery {
  include: {
    madre: {
      select: {
        id: true;
        raza: true;
        galpon: true;
        jaula: true;
        etapaVida: true;
        peso: true;
      };
    };
    padre: {
      select: {
        id: true;
        raza: true;
        galpon: true;
        jaula: true;
        peso: true;
      };
    };
    camada: {
      select: {
        id: true;
        numVivos: true;
        numMuertos: true;
        fechaNacimiento: true;
      };
    };
  };
}
```

#### Cursor-based Pagination
```typescript
interface CursorPagination {
  cursor?: string;
  take: number;
  skip?: number;
  orderBy: {
    [key: string]: 'asc' | 'desc';
  };
}
```

### 2. Enhanced Validation System

#### Zod Schema Definitions
```typescript
const PrenezCreateSchema = z.object({
  madreId: z.number().positive('ID de madre debe ser positivo'),
  padreId: z.number().positive().optional(),
  fechaPrenez: z.string().datetime('Fecha de preñez inválida'),
  notas: z.string().max(500).optional(),
});

const CamadaCreateSchema = z.object({
  fechaNacimiento: z.string().datetime('Fecha de nacimiento inválida'),
  numVivos: z.number().min(0, 'Número de vivos no puede ser negativo'),
  numMuertos: z.number().min(0, 'Número de muertos no puede ser negativo'),
  madreId: z.number().positive('ID de madre requerido'),
  padreId: z.number().positive().optional(),
  numMachos: z.number().min(0).optional(),
  numHembras: z.number().min(0).optional(),
});
```

#### Error Response Interface
```typescript
interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: {
    field: string;
    message: string;
    code: string;
  }[];
  timestamp: string;
  path: string;
}
```

### 3. Caching Layer

#### Cache Configuration
```typescript
interface CacheConfig {
  statistics: {
    ttl: 300; // 5 minutes
    key: 'reproduction:stats';
  };
  animalLists: {
    ttl: 900; // 15 minutes
    key: 'reproduction:animals';
  };
  compatibility: {
    ttl: 900; // 15 minutes
    key: 'reproduction:compatibility';
  };
}
```

#### Cache Service Interface
```typescript
interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
  clear(): Promise<void>;
}
```

### 4. Responsive Design System

#### Breakpoint Configuration
```typescript
const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

const responsiveConfig = {
  tables: {
    xs: 'scroll',
    sm: 'scroll',
    md: 'fixed',
    lg: 'fixed',
    xl: 'fixed',
  },
  forms: {
    xs: 'single-column',
    sm: 'single-column',
    md: 'two-column',
    lg: 'two-column',
    xl: 'three-column',
  },
};
```

## Data Models

### Optimized Query Results
```typescript
interface OptimizedPrenez {
  id: number;
  fechaPrenez: Date;
  fechaProbableParto: Date;
  estado: string;
  notas?: string;
  madre: {
    id: number;
    raza: string;
    galpon: string;
    jaula: string;
    etapaVida: string;
    peso: number;
  };
  padre?: {
    id: number;
    raza: string;
    galpon: string;
    jaula: string;
    peso: number;
  };
  camada?: {
    id: number;
    numVivos: number;
    numMuertos: number;
    fechaNacimiento: Date;
  };
  // Calculated fields
  diasGestacion: number;
  diasRestantes: number;
  estadoCalculado: string;
}
```

### Cache Data Models
```typescript
interface CachedStatistics {
  data: ReproductionStatistics;
  timestamp: number;
  ttl: number;
}

interface CachedAnimalList {
  data: AvailableAnimals;
  filters: Record<string, any>;
  timestamp: number;
  ttl: number;
}
```

## Error Handling

### Error Classification
```typescript
enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  DATABASE = 'DATABASE_ERROR',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC_ERROR',
  NETWORK = 'NETWORK_ERROR',
  CACHE = 'CACHE_ERROR',
}

interface ErrorHandler {
  handle(error: Error, context: string): ApiErrorResponse;
  classify(error: Error): ErrorType;
  format(error: Error, type: ErrorType): string;
}
```

### Frontend Error Handling
```typescript
interface ErrorBoundary {
  fallback: React.ComponentType<{ error: Error }>;
  onError: (error: Error, errorInfo: ErrorInfo) => void;
  retry: () => void;
}

interface FormErrorHandler {
  validateField(field: string, value: any): string | null;
  displayErrors(errors: ValidationError[]): void;
  clearErrors(): void;
}
```

## Testing Strategy

### Backend Testing
- **Unit Tests**: Service functions with mocked Prisma client
- **Integration Tests**: Database operations with test database
- **Performance Tests**: Query optimization validation
- **Cache Tests**: Cache hit/miss scenarios

### Frontend Testing
- **Component Tests**: Responsive behavior across breakpoints
- **Form Tests**: Validation and error handling
- **Integration Tests**: API interaction and error scenarios
- **Accessibility Tests**: Screen reader and keyboard navigation

### Test Coverage Targets
- Backend Services: 90%+
- Frontend Components: 85%+
- Error Handling: 95%+
- Cache Operations: 90%+

## Performance Metrics

### Backend Performance
- Query response time: < 200ms for simple queries
- Complex queries with joins: < 500ms
- Cache hit ratio: > 80%
- Database connection pool utilization: < 70%

### Frontend Performance
- Initial page load: < 2 seconds
- Form submission response: < 1 second
- Table rendering: < 500ms for 100 rows
- Mobile responsiveness: All interactions < 300ms

## Security Considerations

### Input Validation
- All user inputs validated with Zod schemas
- SQL injection prevention through Prisma ORM
- XSS prevention through proper data sanitization
- CSRF protection on all mutation operations

### Cache Security
- No sensitive data in cache keys
- Cache invalidation on user logout
- Encrypted cache storage for sensitive operations
- Rate limiting on cache-intensive operations

## Deployment Strategy

### Backend Deployment
1. Database migration for any schema changes
2. Service deployment with zero-downtime strategy
3. Cache warming for critical data
4. Performance monitoring activation

### Frontend Deployment
1. Build optimization with code splitting
2. Asset optimization and compression
3. CDN deployment for static assets
4. Progressive web app features activation

## Monitoring and Observability

### Metrics to Track
- Query performance and slow query detection
- Cache hit/miss ratios and performance
- Error rates by type and endpoint
- User interaction patterns and performance
- Mobile vs desktop usage patterns

### Alerting
- Database query performance degradation
- Cache service unavailability
- High error rates in reproduction module
- Mobile performance issues