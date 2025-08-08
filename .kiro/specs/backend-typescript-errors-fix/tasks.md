# Implementation Plan

- [x] 1. Create missing reports controller file
  - Create `backend/src/controllers/reports/reports.controller.ts` with basic CRUD operations
  - Implement `generateReport`, `getReportHistory`, and `deleteReport` methods
  - Add proper TypeScript typing and error handling for all methods
  - Ensure controller exports match the import statements in routes
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Fix WebSocket service import/export consistency
  - Ensure WebSocket service uses consistent export pattern (both named and default export)
  - Update all imports of WebSocket service to use default import syntax
  - Remove any references to non-existent WebSocket methods like `broadcastCalendarUpdate`
  - Test WebSocket service initialization and basic functionality
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 3. Fix cache service reference errors
  - Replace all references to `reproductionCache` with `mainCache`
  - Update cache method calls to use existing cache service methods
  - Fix cache invalidation calls to use proper service methods
  - Ensure all cache operations use correct TypeScript typing
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 4. Fix TypeScript type annotation issues
  - Fix sort function parameter typing (change `b: unknown` to `b: any`)
  - Correct raw SQL query result typing in metrics service
  - Ensure all function parameters have proper TypeScript types
  - Fix any remaining type annotation errors in service files
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Validate backend compilation and startup
  - Run TypeScript compiler to ensure no compilation errors
  - Test backend server startup with `npm run dev`
  - Verify WebSocket service initializes correctly
  - Test cache service operations work properly
  - _Requirements: All requirements validation_

- [ ] 6. Create any additional missing controller files
  - Identify other missing controller files from route imports
  - Create placeholder controller files with basic structure
  - Implement minimal required methods for each controller
  - Add proper error handling and TypeScript typing
  - _Requirements: 1.1, 1.2, 1.3, 1.4_