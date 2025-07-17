# Project Structure & Architecture

## Monorepo Organization
```
sumaq-uywa/
├── src/                     # Frontend React application
├── backend/                 # Backend API server
├── public/                  # Static assets
└── [config files]           # Root-level configuration
```

## Frontend Structure (`src/`)
```
src/
├── components/              # Reusable UI components
│   ├── common/             # Generic components (CustomSelect, etc.)
│   └── [FeatureComponents] # Feature-specific components
├── pages/                  # Route-level page components
├── layouts/                # Layout components (SidebarLayout)
├── services/               # API communication layer
├── contexts/               # React contexts (NotificationContext)
├── hooks/                  # Custom React hooks
├── theme/                  # MUI theme configuration
├── types/                  # TypeScript type definitions
└── utils/                  # Utility functions
```

## Backend Structure (`backend/src/`)
```
backend/src/
├── controllers/            # Route handlers organized by feature
│   ├── alimentacion/      # Feed management
│   ├── inventario/        # Inventory (cuyes, galpones, proveedores)
│   ├── reproduccion/      # Breeding management
│   ├── salud/             # Health management
│   ├── ventas/            # Sales management
│   └── gastos/            # Expense management
├── routes/                # Express route definitions (mirrors controllers)
├── services/              # Business logic layer (mirrors controllers)
├── middlewares/           # Express middlewares (auth, validation, error handling)
├── schemas/               # Zod validation schemas
├── types/                 # TypeScript type definitions
└── utils/                 # Utilities (logger, prisma, swagger)
```

## Architecture Patterns

### Backend Patterns
- **Layered Architecture**: Controllers → Services → Database
- **Feature-based Organization**: Modules grouped by business domain
- **Schema Validation**: Zod schemas for request/response validation
- **Middleware Chain**: Authentication, validation, error handling
- **Factory Pattern**: CRUD factory for common operations

### Frontend Patterns
- **Component Composition**: Reusable components with clear separation
- **Custom Hooks**: Business logic extraction (useSystemNotifications, useDeleteConfirmation)
- **Context Pattern**: Global state management (NotificationContext)
- **Service Layer**: API abstraction with interceptors
- **Theme System**: Centralized MUI theming

## Naming Conventions

### Files & Directories
- **PascalCase**: React components (`CuyesManagerFixed.tsx`)
- **camelCase**: Services, hooks, utilities (`api.ts`, `useSystemNotifications.ts`)
- **kebab-case**: Configuration files (`eslint.config.js`)
- **lowercase**: Directories (`controllers/`, `services/`)

### Database & API
- **camelCase**: Database fields (`fechaNacimiento`, `galponId`)
- **PascalCase**: Prisma models (`Cuy`, `Galpon`, `HistorialSalud`)
- **kebab-case**: API endpoints (`/api/cuyes`, `/api/gastos`)

## Key Conventions

### Component Structure
- Components end with descriptive suffixes (`Table`, `Form`, `Manager`, `Widget`)
- Fixed versions indicated with `Fixed` suffix
- Common components in `src/components/common/`

### API Design
- RESTful endpoints with consistent HTTP methods
- JWT authentication with Bearer tokens
- Zod schema validation for all inputs
- Swagger documentation for all endpoints
- Consistent error response format

### Database Design
- Relational structure with foreign keys
- Audit fields (`fechaRegistro`, `fechaCreacion`)
- Soft deletes where appropriate (`estado` field)
- Descriptive field names in Spanish (domain language)

## Module Dependencies
- Frontend communicates with backend via `src/services/api.ts`
- Backend uses Prisma client for database operations
- Shared TypeScript types between frontend and backend
- Environment-based configuration for different deployment targets