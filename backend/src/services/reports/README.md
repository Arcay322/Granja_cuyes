# Reports Services

This directory contains all services related to report generation and data processing.

## Services Overview

### ReportDataService (`reportData.service.ts`)
**NEW** - Core service responsible for fetching and processing real data from the database for report generation.

**Purpose**: Solves the problem of empty reports by providing actual data queries instead of placeholder data.

**Key Features**:
- Fetches real data from database for all report types
- Supports date range filtering and parameter validation
- Generates chart data for visualizations
- Provides structured data interfaces for each report type
- Includes error handling and logging

**Supported Report Types**:
- Financial Reports (`getFinancialReportData`)
- Inventory Reports (`getInventoryReportData`) 
- Reproductive Reports (`getReproductiveReportData`)
- Health Reports (`getHealthReportData`)

**Usage Example**:
```typescript
import { reportDataService } from './reportData.service';

const financialData = await reportDataService.getFinancialReportData({
  dateRange: {
    from: '2024-01-01',
    to: '2024-01-31'
  }
});
```

### Other Services

- `reports.service.ts` - Manages export jobs and file metadata
- `jobQueue.service.ts` - Handles asynchronous job processing
- `jobLifecycle.service.ts` - Manages job lifecycle and status
- `fileGenerator.service.ts` - Coordinates file generation
- `pdfGenerator.service.ts` - Generates PDF files
- `excelGenerator.service.ts` - Generates Excel files
- `csvGenerator.service.ts` - Generates CSV files
- `fileDownload.service.ts` - Handles file downloads
- `fileCleanup.service.ts` - Manages file cleanup and expiration
- `fileStorage.service.ts` - Handles file storage operations
- `notifications.service.ts` - Manages job notifications

## Data Flow

```
Frontend Request → Controller → JobQueue → ReportDataService → Database
                                    ↓
File Generators ← Real Data ← ReportDataService
```

## Integration Points

The `ReportDataService` integrates with:
1. **JobQueue** - Called during job processing to get real data
2. **Database** - Queries Prisma models for actual data
3. **File Generators** - Provides structured data for file creation
4. **Logging** - Records operations and errors

## Next Steps

1. **Task 2**: Implement financial report database queries
2. **Task 3**: Integrate with JobQueue service
3. **Task 4-6**: Implement other report types
4. **Task 7**: Enhance seed data for testing

## Testing

Run tests for the ReportDataService:
```bash
npm test -- reportData.service.test.ts
```

## Error Handling

The service includes comprehensive error handling:
- Parameter validation
- Database connection errors
- Invalid date ranges
- Missing data scenarios
- Graceful cleanup on errors