// Re-export all report data types for easier imports
export {
  ReportParameters,
  DateRange,
  ChartData,
  SaleRecord,
  ExpenseRecord,
  FinancialReportData,
  CuyRecord,
  GalponRecord,
  DistributionData,
  AlertRecord,
  InventoryReportData,
  PregnancyRecord,
  LitterRecord,
  ProjectionData,
  ReproductiveStats,
  ReproductiveReportData,
  HealthRecord,
  HealthReportData
} from '../services/reports/reportData.service';

// Additional utility types for report processing
export interface ReportGenerationOptions {
  includeCharts: boolean;
  includeDetails: boolean;
  maxRecords?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ReportMetadata {
  templateId: string;
  templateName: string;
  description: string;
  requiredParameters: string[];
  optionalParameters: string[];
  supportedFormats: string[];
  estimatedGenerationTime: number; // in seconds
}

export const REPORT_TEMPLATES: Record<string, ReportMetadata> = {
  financial: {
    templateId: 'financial',
    templateName: 'Reporte Financiero',
    description: 'Análisis de ventas, gastos e ingresos',
    requiredParameters: [],
    optionalParameters: ['dateRange', 'categoria'],
    supportedFormats: ['PDF', 'EXCEL', 'CSV'],
    estimatedGenerationTime: 30
  },
  inventory: {
    templateId: 'inventory',
    templateName: 'Reporte de Inventario',
    description: 'Reporte completo del inventario de cuyes',
    requiredParameters: [],
    optionalParameters: ['dateRange', 'galpon', 'etapaVida'],
    supportedFormats: ['PDF', 'EXCEL', 'CSV'],
    estimatedGenerationTime: 45
  },
  reproductive: {
    templateId: 'reproductive',
    templateName: 'Reporte de Reproducción',
    description: 'Estadísticas de reproducción y camadas',
    requiredParameters: [],
    optionalParameters: ['dateRange', 'estado'],
    supportedFormats: ['PDF', 'EXCEL', 'CSV'],
    estimatedGenerationTime: 60
  },
  health: {
    templateId: 'health',
    templateName: 'Reporte de Salud',
    description: 'Estado de salud del ganado',
    requiredParameters: [],
    optionalParameters: ['dateRange', 'galpon'],
    supportedFormats: ['PDF', 'EXCEL', 'CSV'],
    estimatedGenerationTime: 40
  }
};