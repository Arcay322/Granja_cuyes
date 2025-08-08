# Documento de Diseño

## Visión General

Este diseño aborda los problemas críticos identificados en el módulo de reproducción que impiden su funcionamiento correcto. Los problemas principales incluyen fallas de autenticación, advertencias de deprecación de MUI Grid, errores 500 en el dashboard, y problemas generales de manejo de errores. La solución se enfoca en corregir estos problemas de manera sistemática para restaurar la funcionalidad completa del módulo.

## Arquitectura

### Componentes Principales

1. **Sistema de Autenticación Mejorado**
   - Servicio de interceptores de Axios mejorado
   - Manejo consistente de tokens entre localStorage y sessionStorage
   - Middleware de autenticación backend robusto

2. **Actualización de Componentes MUI**
   - Migración de Grid v1 a Grid v2
   - Actualización de props deprecados
   - Mantenimiento de funcionalidad responsiva

3. **Controlador de Dashboard Corregido**
   - Manejo de errores mejorado
   - Importaciones de Prisma corregidas
   - Validación de datos robusta

4. **Sistema de Manejo de Errores Unificado**
   - Error boundaries para componentes React
   - Logging estructurado de errores
   - Mensajes de error amigables al usuario

## Componentes e Interfaces

### 1. Servicio de Autenticación (Frontend)

```typescript
interface AuthService {
  getToken(): string | null;
  setToken(token: string, remember: boolean): void;
  clearToken(): void;
  isTokenValid(): boolean;
  refreshToken(): Promise<string>;
}

interface ApiInterceptors {
  requestInterceptor: (config: AxiosRequestConfig) => AxiosRequestConfig;
  responseInterceptor: (response: AxiosResponse) => AxiosResponse;
  errorInterceptor: (error: AxiosError) => Promise<never>;
}
```

### 2. Middleware de Autenticación (Backend)

```typescript
interface AuthMiddleware {
  verifyToken(req: Request, res: Response, next: NextFunction): void;
  extractToken(req: Request): string | null;
  validateTokenFormat(token: string): boolean;
}

interface TokenPayload {
  userId: number;
  email: string;
  iat: number;
  exp: number;
}
```

### 3. Componentes MUI Actualizados

```typescript
interface GridProps {
  size: {
    xs?: number | 'auto';
    sm?: number | 'auto';
    md?: number | 'auto';
    lg?: number | 'auto';
    xl?: number | 'auto';
  };
  spacing?: number | { xs?: number; sm?: number; md?: number };
}
```

### 4. Dashboard Controller Mejorado

```typescript
interface DashboardController {
  getMetrics(req: Request, res: Response): Promise<void>;
  getChartsData(req: Request, res: Response): Promise<void>;
  getRealTimeData(req: Request, res: Response): Promise<void>;
  getExecutiveSummary(req: Request, res: Response): Promise<void>;
}

interface DashboardResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: Date;
  error?: string;
}
```

## Modelos de Datos

### 1. Token de Autenticación

```typescript
interface AuthToken {
  token: string;
  expiresAt: Date;
  refreshToken?: string;
  userId: number;
  email: string;
}

interface TokenStorage {
  type: 'localStorage' | 'sessionStorage';
  key: string;
  value: string;
}
```

### 2. Error Response

```typescript
interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  code: string;
  timestamp: Date;
  path: string;
}

interface ValidationError {
  field: string;
  message: string;
  value: any;
}
```

### 3. Dashboard Metrics

```typescript
interface DashboardMetrics {
  reproductiveStats: {
    activePregnancies: number;
    expectedBirths: number;
    successRate: number;
    averageLitterSize: number;
    totalBirthsThisMonth: number;
    totalBirthsLastMonth: number;
  };
  performanceMetrics: {
    breedingEfficiency: number;
    reproductiveCapacity: number;
    utilizationRate: number;
  };
  alerts: {
    overduePregnancies: number;
    inactiveReproducers: number;
    capacityWarnings: number;
  };
}
```

## Manejo de Errores

### 1. Frontend Error Boundaries

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  children: React.ReactNode;
}
```

### 2. Backend Error Middleware

```typescript
interface ErrorHandler {
  handleValidationError(error: ValidationError): ErrorResponse;
  handleAuthenticationError(error: AuthError): ErrorResponse;
  handleDatabaseError(error: PrismaError): ErrorResponse;
  handleGenericError(error: Error): ErrorResponse;
}
```

### 3. API Error Responses

```typescript
interface ApiErrorResponse {
  success: false;
  message: string;
  error: string;
  code: 'VALIDATION_ERROR' | 'AUTH_ERROR' | 'DATABASE_ERROR' | 'INTERNAL_ERROR';
  details?: ValidationError[];
  timestamp: Date;
}
```

## Estrategia de Testing

### 1. Tests de Autenticación

- Verificar almacenamiento correcto de tokens
- Probar interceptores de Axios
- Validar manejo de tokens expirados
- Testear redirección automática al login

### 2. Tests de Componentes MUI

- Verificar renderizado correcto con Grid v2
- Probar responsividad en diferentes tamaños
- Validar que no hay advertencias de deprecación
- Testear funcionalidad de layout

### 3. Tests de Dashboard

- Probar carga exitosa de métricas
- Verificar manejo de errores 500
- Validar formato de respuestas API
- Testear filtros y parámetros

### 4. Tests de Manejo de Errores

- Probar error boundaries en componentes
- Verificar logging de errores
- Validar mensajes de error amigables
- Testear recuperación de errores

## Consideraciones de Seguridad

### 1. Autenticación

- Validación robusta de tokens JWT
- Manejo seguro de tokens en el cliente
- Limpieza automática de tokens expirados
- Protección contra ataques CSRF

### 2. Autorización

- Verificación de permisos en endpoints
- Validación de acceso a recursos
- Logging de intentos de acceso no autorizados

### 3. Datos Sensibles

- No exposición de información sensible en logs
- Sanitización de datos en respuestas de error
- Protección de información de usuario

## Optimización de Rendimiento

### 1. Caching

- Cache de tokens de autenticación válidos
- Cache de métricas de dashboard
- Invalidación inteligente de cache

### 2. Lazy Loading

- Carga diferida de componentes pesados
- Optimización de imports de MUI
- Reducción de bundle size

### 3. Error Recovery

- Reintentos automáticos para errores temporales
- Fallbacks para componentes que fallan
- Recuperación graceful de errores de red

## Plan de Migración

### 1. Fase 1: Corrección de Autenticación
- Actualizar servicio de API
- Corregir middleware backend
- Probar flujo completo de autenticación

### 2. Fase 2: Actualización MUI
- Migrar componentes Grid uno por uno
- Probar responsividad
- Eliminar advertencias de deprecación

### 3. Fase 3: Corrección Dashboard
- Arreglar controlador backend
- Mejorar manejo de errores
- Validar métricas

### 4. Fase 4: Sistema de Errores
- Implementar error boundaries
- Mejorar logging
- Probar recuperación de errores