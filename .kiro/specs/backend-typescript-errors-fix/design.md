# Design Document

## Overview

The backend TypeScript errors fix will systematically address all compilation errors preventing the backend server from starting. The solution involves creating missing controller files, fixing import/export patterns, correcting cache service references, and ensuring proper type annotations throughout the codebase.

## Architecture

### Error Categories
1. **Missing Controller Files** - Routes referencing non-existent controller files
2. **WebSocket Service Import/Export Issues** - Inconsistent import/export patterns
3. **Cache Service Reference Errors** - References to non-existent cache services
4. **Type Annotation Issues** - Incorrect or missing TypeScript type annotations

### Solution Strategy
1. **Create Missing Controllers** - Generate controller files with proper structure
2. **Standardize WebSocket Exports** - Use consistent export patterns
3. **Fix Cache Service References** - Update to use existing cache services
4. **Correct Type Annotations** - Fix all TypeScript type issues

## Components and Interfaces

### Missing Controller Structure

#### Reports Controller
```typescript
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export const generateReport = async (req: Request, res: Response) => {
  try {
    // Implementation for report generation
    res.json({ success: true, message: 'Report generated successfully' });
  } catch (error) {
    logger.error('Error generating report:', error);
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
};

export const getReportHistory = async (req: Request, res: Response) => {
  try {
    // Implementation for report history
    res.json({ success: true, data: [] });
  } catch (error) {
    logger.error('Error getting report history:', error);
    res.status(500).json({ success: false, error: 'Failed to get report history' });
  }
};

export const deleteReport = async (req: Request, res: Response) => {
  try {
    // Implementation for report deletion
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    logger.error('Error deleting report:', error);
    res.status(500).json({ success: false, error: 'Failed to delete report' });
  }
};
```

### WebSocket Service Export Pattern

#### Consistent Export Structure
```typescript
class WebSocketService {
  // ... class implementation
}

// Single instance export pattern
export const webSocketService = new WebSocketService();
export default webSocketService;
```

#### Import Pattern
```typescript
// Use default import consistently
import webSocketService from './services/websocket/websocket.service';
```

### Cache Service Reference Fixes

#### Replace Non-existent Cache References
```typescript
// Before (causing errors)
import { reproductionCache } from '../cache.service';
await reproductionCache.getStatistics(key);

// After (fixed)
import { mainCache } from '../cache.service';
const cachedStats = mainCache.get<ReproductionStatistics>(key);
```

#### Cache Method Standardization
```typescript
// Standardized cache operations
mainCache.set(key, value, ttl);
mainCache.get<T>(key);
mainCache.del(key);
cacheInvalidation.invalidateByDataChange(entity, action);
```

### Type Annotation Fixes

#### Sort Function Parameters
```typescript
// Before (causing errors)
array.sort((a: any, b: unknown) => {
  return b.score - a.score;
});

// After (fixed)
array.sort((a: any, b: any) => {
  return b.score - a.score;
});
```

#### Raw Query Result Typing
```typescript
// Before (causing errors)
const results = await prisma.$queryRawUnsafe(query) as any[];
const mapped = results.map((row: unknown) => ({
  field: row.field // Error: Property 'field' does not exist
}));

// After (fixed)
const results = await prisma.$queryRawUnsafe(query) as any[];
const mapped = results.map((row: any) => ({
  field: row.field
}));
```

## Error Handling

### Missing File Detection
```typescript
// Strategy for detecting missing files
const requiredControllers = [
  'reports/reports.controller',
  'calendar/calendar.controller',
  'alerts/alerts.controller'
];

// Validation during build process
requiredControllers.forEach(controller => {
  if (!fs.existsSync(`src/controllers/${controller}.ts`)) {
    console.error(`Missing controller: ${controller}`);
  }
});
```

### Import Validation
```typescript
// Strategy for validating imports
const validateImports = (filePath: string) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = extractImports(content);
  
  imports.forEach(importPath => {
    if (!fs.existsSync(resolveImportPath(importPath))) {
      console.error(`Invalid import in ${filePath}: ${importPath}`);
    }
  });
};
```

## Testing Strategy

### Compilation Validation
1. **TypeScript Compilation**: Ensure `npx tsc` passes without errors
2. **Server Start Test**: Verify backend starts successfully with `npm run dev`
3. **Import Resolution**: Validate all imports resolve correctly
4. **Type Safety**: Ensure all type annotations are correct

### Runtime Validation
1. **WebSocket Functionality**: Test WebSocket service initialization and methods
2. **Cache Operations**: Verify cache service methods work correctly
3. **Controller Endpoints**: Test that all route handlers exist and function
4. **Error Handling**: Ensure proper error responses for missing functionality

## Implementation Steps

### Phase 1: Create Missing Controllers
1. Identify all missing controller files from route imports
2. Create controller files with basic CRUD structure
3. Implement placeholder methods for all required endpoints
4. Add proper TypeScript typing and error handling

### Phase 2: Fix Import/Export Issues
1. Standardize WebSocket service export pattern
2. Update all WebSocket service imports to use default import
3. Remove references to non-existent cache services
4. Update cache service method calls to use existing services

### Phase 3: Fix Type Annotations
1. Identify all TypeScript type errors in service files
2. Fix sort function parameter typing issues
3. Correct raw query result typing
4. Ensure all function parameters have proper types

### Phase 4: Validation and Testing
1. Run TypeScript compiler to verify no compilation errors
2. Test backend server startup process
3. Validate WebSocket service functionality
4. Test cache service operations
5. Verify all route endpoints are accessible