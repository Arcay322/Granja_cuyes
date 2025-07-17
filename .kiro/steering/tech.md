# Technology Stack

## Frontend
- **React 19** with TypeScript
- **Vite** for development server and build tooling
- **Material UI (MUI)** for component library and theming
- **React Router** for client-side routing
- **Axios** for API communication
- **React Hot Toast** for notifications
- **Chart.js & Recharts** for data visualization

## Backend
- **Node.js** with Express and TypeScript
- **Prisma ORM** with PostgreSQL database
- **JWT** for authentication with bcrypt for password hashing
- **Winston** for structured logging
- **Swagger/OpenAPI** for API documentation
- **Helmet, CORS, Rate Limiting** for security

## Database
- **PostgreSQL** as primary database
- **Prisma** for schema management and migrations

## Development Tools
- **TypeScript** for type safety
- **ESLint** for code linting
- **Jest & Supertest** for testing
- **ts-node-dev** for backend development

## Common Commands

### Frontend Development
```bash
npm run dev                    # Start development server
npm run build                  # Production build
npm run preview               # Preview production build
npm run lint                  # Run ESLint
npm run fix-errors            # Fix common JSX errors
npm run validate-jsx          # Validate JSX syntax
```

### Backend Development
```bash
cd backend
npm run dev                   # Start development server with hot reload
npm run build                 # Compile TypeScript
npm run start                 # Run compiled version
npm run seed                  # Seed database with sample data
```

### Database Operations
```bash
cd backend
npx prisma generate           # Generate Prisma client
npx prisma migrate dev        # Run migrations in development
npx prisma migrate deploy     # Deploy migrations to production
npx prisma db seed           # Seed database
npx prisma studio            # Open Prisma Studio
```

### Full Stack Development
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
npm run dev
```

## Environment Variables
- Frontend: Uses `VITE_API_URL` for API endpoint configuration
- Backend: Requires `DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`
- CORS configured for multiple origins including localhost and production URLs