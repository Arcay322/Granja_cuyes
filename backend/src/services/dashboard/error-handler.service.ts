import logger from '../../utils/logger';

export interface DashboardError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  context?: string;
}

export class DashboardErrorHandler {
  private static instance: DashboardErrorHandler;
  private errorHistory: DashboardError[] = [];
  private maxHistorySize = 100;

  private constructor() {}

  public static getInstance(): DashboardErrorHandler {
    if (!DashboardErrorHandler.instance) {
      DashboardErrorHandler.instance = new DashboardErrorHandler();
    }
    return DashboardErrorHandler.instance;
  }

  public handleError(error: any, context: string = 'dashboard'): DashboardError {
    const dashboardError: DashboardError = {
      code: this.getErrorCode(error),
      message: this.getErrorMessage(error),
      details: this.getErrorDetails(error),
      timestamp: new Date(),
      context
    };

    // Log error
    logger.error(`Dashboard Error [${dashboardError.code}]:`, {
      message: dashboardError.message,
      context: dashboardError.context,
      details: dashboardError.details
    });

    // Add to history
    this.addToHistory(dashboardError);

    return dashboardError;
  }

  private getErrorCode(error: any): string {
    if (error.code) return error.code;
    if (error.name) return error.name;
    if (error.response?.status) return `HTTP_${error.response.status}`;
    return 'UNKNOWN_ERROR';
  }

  private getErrorMessage(error: any): string {
    if (error.message) return error.message;
    if (error.response?.data?.message) return error.response.data.message;
    if (typeof error === 'string') return error;
    return 'An unexpected error occurred';
  }

  private getErrorDetails(error: any): any {
    return {
      stack: error.stack,
      response: error.response?.data,
      request: error.config ? {
        url: error.config.url,
        method: error.config.method,
        params: error.config.params
      } : undefined
    };
  }

  private addToHistory(error: DashboardError): void {
    this.errorHistory.unshift(error);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  public getErrorHistory(): DashboardError[] {
    return [...this.errorHistory];
  }

  public clearErrorHistory(): void {
    this.errorHistory = [];
  }

  public getErrorStats(): {
    totalErrors: number;
    errorsByCode: Record<string, number>;
    errorsByContext: Record<string, number>;
    recentErrors: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const errorsByCode: Record<string, number> = {};
    const errorsByContext: Record<string, number> = {};
    let recentErrors = 0;

    this.errorHistory.forEach(error => {
      // Count by code
      errorsByCode[error.code] = (errorsByCode[error.code] || 0) + 1;
      
      // Count by context
      errorsByContext[error.context || 'unknown'] = (errorsByContext[error.context || 'unknown'] || 0) + 1;
      
      // Count recent errors
      if (error.timestamp > oneHourAgo) {
        recentErrors++;
      }
    });

    return {
      totalErrors: this.errorHistory.length,
      errorsByCode,
      errorsByContext,
      recentErrors
    };
  }
}

// Singleton instance
export const dashboardErrorHandler = DashboardErrorHandler.getInstance();

// Error recovery strategies
export class ErrorRecoveryService {
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    context: string = 'dashboard'
  ): Promise<T> {
    const attempts = this.retryAttempts.get(operationId) || 0;

    try {
      const result = await operation();
      // Reset retry count on success
      this.retryAttempts.delete(operationId);
      return result;
    } catch (error) {
      const dashboardError = dashboardErrorHandler.handleError(error, context);
      
      if (attempts < this.maxRetries && this.isRetryableError(error)) {
        this.retryAttempts.set(operationId, attempts + 1);
        
        logger.info(`Retrying operation ${operationId}, attempt ${attempts + 1}/${this.maxRetries}`);
        
        // Wait before retry with exponential backoff
        await this.delay(this.retryDelay * Math.pow(2, attempts));
        
        return this.executeWithRetry(operation, operationId, context);
      } else {
        // Max retries reached or non-retryable error
        this.retryAttempts.delete(operationId);
        throw dashboardError;
      }
    }
  }

  private isRetryableError(error: any): boolean {
    // Network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return true;
    }
    
    // HTTP 5xx errors
    if (error.response?.status >= 500) {
      return true;
    }
    
    // Timeout errors
    if (error.code === 'ECONNABORTED') {
      return true;
    }
    
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public clearRetryHistory(): void {
    this.retryAttempts.clear();
  }
}

export const errorRecoveryService = new ErrorRecoveryService();

// Validation helpers
export class DashboardValidator {
  public static validateFilters(filters: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Date validation
    if (filters.dateFrom && filters.dateTo) {
      const fromDate = new Date(filters.dateFrom);
      const toDate = new Date(filters.dateTo);
      
      if (fromDate > toDate) {
        errors.push('La fecha de inicio debe ser anterior a la fecha de fin');
      }
      
      const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year
      if (toDate.getTime() - fromDate.getTime() > maxRange) {
        errors.push('El rango de fechas no puede ser mayor a 1 año');
      }
    }

    // Galpon validation
    if (filters.galpon && typeof filters.galpon !== 'string') {
      errors.push('El galpón debe ser una cadena de texto válida');
    }

    // Raza validation
    if (filters.raza && typeof filters.raza !== 'string') {
      errors.push('La raza debe ser una cadena de texto válida');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public static validateReportParameters(parameters: any, template: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template || !template.parameters) {
      return { isValid: true, errors: [] };
    }

    template.parameters.forEach((param: any) => {
      const value = parameters[param.name];
      
      // Required parameter validation
      if (param.required && (value === undefined || value === null || value === '')) {
        errors.push(`El parámetro '${param.label}' es requerido`);
        return;
      }

      // Type validation
      if (value !== undefined && value !== null && value !== '') {
        switch (param.type) {
          case 'number':
            if (isNaN(Number(value))) {
              errors.push(`El parámetro '${param.label}' debe ser un número válido`);
            }
            break;
          case 'date':
            if (isNaN(Date.parse(value))) {
              errors.push(`El parámetro '${param.label}' debe ser una fecha válida`);
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`El parámetro '${param.label}' debe ser verdadero o falso`);
            }
            break;
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public static validateExportOptions(options: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Format validation
    const validFormats = ['pdf', 'excel', 'csv'];
    if (!options.format || !validFormats.includes(options.format)) {
      errors.push('Formato de exportación no válido. Use: pdf, excel, csv');
    }

    // PDF specific validation
    if (options.format === 'pdf') {
      const validPageSizes = ['A4', 'Letter', 'Legal'];
      if (options.pageSize && !validPageSizes.includes(options.pageSize)) {
        errors.push('Tamaño de página no válido para PDF');
      }

      const validOrientations = ['portrait', 'landscape'];
      if (options.orientation && !validOrientations.includes(options.orientation)) {
        errors.push('Orientación no válida para PDF');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Circuit breaker pattern for external services
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  public getState(): string {
    return this.state;
  }

  public reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }
}