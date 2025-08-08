# Design Document - Project Stabilization Week 1

## Overview

This design outlines the systematic approach to stabilize the SUMAQ UYWA project by addressing critical compilation errors, database issues, and missing service implementations. The solution focuses on immediate fixes that will allow the application to compile and run successfully.

## Architecture

### Current Issues Analysis

Based on the project analysis, the main architectural issues are:

1. **TypeScript Compilation Errors**: 27 errors in backend, 113 in frontend
2. **Database Connection Issues**: Pool timeouts and schema inconsistencies  
3. **Missing Service Methods**: WebSocket and integration services incomplete
4. **Broken Dependencies**: Import paths and module resolution issues

### Solution Architecture

```mermaid
graph TD
    A[Fix TypeScript Errors] --> B[Database Schema Repair]
    B --> C[Complete Service Implementations]
    C --> D[Dependency Resolution]
    D --> E[Application Startup Verification]
    E --> F[Test Suite Stabilization]
```

## Components and Interfaces

### 1. TypeScript Error Resolution

#### Backend Errors (27 identified)
- **Test Files**: Mock type issues, unknown property access
- **Service Files**: Missing method implementations, type mismatches
- **Middleware**: Property access on user object inconsistencies

#### Frontend Errors (113 identified)
- **Toast Notification Service**: JSX syntax errors in TypeScript file
- **Component Props**: Type definition mismatches

### 2. Database Schema Consistency

#### Schema Issues
- Missing columns referenced in queries (`fecha_nacimiento` vs `fechaNacimiento`)
- Connection pool configuration problems
- Migration state inconsistencies

#### Solution Design
```typescript
// Prisma Client Singleton Pattern
class PrismaService {
  private static instance: PrismaClient;
  
  public static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });
    }
    return PrismaService.instance;
  }
}
```

### 3. Service Implementation Completion

#### WebSocket Service Missing Methods
```typescript
interface WebSocketServiceInterface {
  broadcastDashboardUpdate(data: any): void;
  broadcastCalendarUpdate(event: any, action: string): void;
  broadcastReportUpdate(type: string, status: string): void;
}
```

#### Integration Service Dependencies
```typescript
interface IntegrationServiceDependencies {
  webSocketService: WebSocketServiceInterface;
  reportService: ReportServiceInterface;
  calendarService: CalendarServiceInterface;
}
```

## Data Models

### Database Connection Configuration
```typescript
interface DatabaseConfig {
  url: string;
  connectionLimit: number;
  connectionTimeout: number;
  queryTimeout: number;
}
```

### Service Registry Pattern
```typescript
interface ServiceRegistry {
  webSocket: WebSocketService;
  reports: ReportsService;
  calendar: CalendarService;
  integration: IntegrationService;
}
```

## Error Handling

### Compilation Error Categories

1. **Type Errors**: Resolve through proper type definitions
2. **Import Errors**: Fix module paths and exports
3. **Property Access Errors**: Ensure interface consistency
4. **Mock Errors**: Update test mocks to match implementations

### Database Error Handling

1. **Connection Errors**: Implement retry logic and connection pooling
2. **Schema Errors**: Run migrations and verify column names
3. **Query Errors**: Add proper error handling and logging

### Service Error Handling

1. **Missing Method Errors**: Implement stub methods with proper signatures
2. **Dependency Errors**: Use dependency injection pattern
3. **Integration Errors**: Add fallback mechanisms

## Testing Strategy

### Test Stabilization Approach

1. **Mock Updates**: Ensure all mocks match current service interfaces
2. **Database Tests**: Use test database configuration
3. **Integration Tests**: Mock external dependencies properly
4. **Type Safety**: Ensure test types match implementation types

### Test Categories to Fix

1. **Unit Tests**: Service method tests with proper mocks
2. **Integration Tests**: Database interaction tests
3. **Controller Tests**: API endpoint tests with authentication
4. **Service Tests**: Business logic tests with dependencies

## Implementation Phases

### Phase 1: Critical Compilation Fixes (Day 1-2)
- Fix TypeScript errors preventing compilation
- Resolve import/export issues
- Update type definitions

### Phase 2: Database Stabilization (Day 2-3)
- Reset and run migrations
- Fix schema inconsistencies
- Configure connection pooling

### Phase 3: Service Completion (Day 3-4)
- Implement missing WebSocket methods
- Complete integration service dependencies
- Fix service import issues

### Phase 4: Application Verification (Day 4-5)
- Verify application startup
- Test basic functionality
- Ensure authentication works

### Phase 5: Test Suite Repair (Day 5-7)
- Fix broken test mocks
- Update test configurations
- Verify test coverage

## Configuration Changes

### TypeScript Configuration Updates
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Database Configuration
```env
DATABASE_URL="postgresql://user:password@localhost:5432/cuyesdb"
PRISMA_CLIENT_ENGINE_TYPE="binary"
```

### Service Configuration
```typescript
const serviceConfig = {
  webSocket: {
    enabled: true,
    port: process.env.WS_PORT || 3001
  },
  database: {
    maxConnections: 10,
    timeout: 30000
  }
};
```

## Success Criteria

1. **Compilation Success**: Both frontend and backend compile without errors
2. **Application Startup**: Development servers start successfully
3. **Database Connectivity**: All database operations work without timeouts
4. **Service Functionality**: All critical services have working implementations
5. **Test Execution**: Test suite runs without compilation errors
6. **Basic Features**: Login, navigation, and core CRUD operations work