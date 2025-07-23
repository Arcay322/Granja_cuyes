# Design Document

## Overview

The TypeScript errors fix will systematically address all compilation errors in the frontend application. The solution involves fixing Material UI component usage, properly typing API responses, cleaning unused code, and correcting type import syntax.

## Architecture

### Error Categories
1. **Material UI Component Errors** - Grid, Typography component prop issues
2. **API Response Type Errors** - Missing interfaces for backend responses
3. **Unused Code Warnings** - Imports and variables that are declared but not used
4. **Type Import Syntax Errors** - Incorrect import syntax for TypeScript types

### Solution Strategy
1. **Fix Material UI Grid Issues** - Update Grid usage to match current MUI version
2. **Create API Response Interfaces** - Define proper types for all API responses
3. **Clean Unused Code** - Remove unused imports and variables
4. **Fix Type Imports** - Use type-only imports where required

## Components and Interfaces

### API Response Interfaces

#### Common Response Structure
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### Specific Data Interfaces
```typescript
interface Cuy {
  id: number;
  raza: string;
  sexo: 'M' | 'H';
  galpon: string;
  jaula: string;
  etapaVida: string;
  peso: number;
  fechaNacimiento: string;
  estado: 'Activo' | 'Enfermo' | 'Vendido' | 'Muerto';
  edad?: number;
}

interface Venta {
  id: number;
  fecha: string;
  total: number;
  clienteId: number;
  cliente?: string;
  detalles?: VentaDetalle[];
}

interface Gasto {
  id: number;
  fecha: string;
  monto: number;
  categoria: string;
  descripcion?: string;
  proveedor?: string;
}

interface Prenez {
  id: number;
  madreId: number;
  padreId: number;
  fechaPrenez: string;
  fechaEstimadaParto: string;
  estado: 'Activa' | 'Completada' | 'Fallida';
  observaciones?: string;
}
```

### Material UI Component Fixes

#### Grid Component Usage
```typescript
// Before (causing errors)
<Grid item xs={12} md={6}>
  <Component />
</Grid>

// After (fixed)
<Grid item xs={12} md={6}>
  <Component />
</Grid>
```

#### Typography Component Usage
```typescript
// Before (causing errors)
<Typography variant="body2" color="white" opacity={0.8}>
  Text
</Typography>

// After (fixed)
<Typography variant="body2" sx={{ color: 'white', opacity: 0.8 }}>
  Text
</Typography>
```

### Type Import Fixes

#### Material UI Type Imports
```typescript
// Before (causing errors)
import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';

// After (fixed)
import type { Theme } from '@mui/material/styles';
import type { SxProps } from '@mui/system';
```

#### Custom Type Exports
```typescript
// notifications.ts
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  date: string;
  link?: string;
}

export interface NotificationConfig {
  enabled: boolean;
  frequency: number;
  types: string[];
}

export interface NotificationRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: any[];
  actions: any[];
}
```

## Error Handling

### API Response Error Handling
```typescript
interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Generic API call with proper typing
async function apiCall<T>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const response = await api.get<ApiResponse<T>>(endpoint);
    return response.data;
  } catch (error: any) {
    throw new ApiError({
      message: error.response?.data?.message || error.message,
      code: error.response?.status?.toString(),
      details: error.response?.data
    });
  }
}
```

### Component Error Boundaries
```typescript
interface ComponentState {
  loading: boolean;
  error: string | null;
  data: any[];
}

// Proper state typing
const [state, setState] = useState<ComponentState>({
  loading: false,
  error: null,
  data: []
});
```

## Testing Strategy

### Type Safety Validation
1. **Compilation Test**: Ensure `npx tsc --noEmit` passes without errors
2. **Build Test**: Ensure `npm run build` completes successfully
3. **Runtime Test**: Verify components render without type-related runtime errors
4. **API Integration Test**: Validate API responses match defined interfaces

### Error Prevention
1. **Strict TypeScript Configuration**: Enable strict mode and all type checking options
2. **ESLint Rules**: Configure rules to catch unused imports and variables
3. **Pre-commit Hooks**: Run type checking before commits
4. **CI/CD Integration**: Include type checking in build pipeline