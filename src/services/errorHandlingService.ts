import { ErrorInfo } from '../components/common/ErrorDisplay';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface ErrorReport {
  id: string;
  error: ErrorInfo;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
  additionalInfo?: Record<string, any>;
}

class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorReports: ErrorReport[] = [];
  private retryAttempts: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Creates an ErrorInfo object from various error sources
   */
  createErrorInfo(
    error: Error | string | any,
    context?: Record<string, any>
  ): ErrorInfo {
    let errorInfo: ErrorInfo;

    if (typeof error === 'string') {
      errorInfo = {
        type: 'unknown',
        message: error,
        timestamp: new Date(),
        retryable: false,
        context
      };
    } else if (error instanceof Error) {
      errorInfo = this.parseError(error, context);
    } else if (error?.response) {
      // Axios error
      errorInfo = this.parseAxiosError(error, context);
    } else {
      errorInfo = {
        type: 'unknown',
        message: error?.message || 'Error desconocido',
        timestamp: new Date(),
        retryable: false,
        context
      };
    }

    return errorInfo;
  }

  /**
   * Parses a standard Error object
   */
  private parseError(error: Error, context?: Record<string, any>): ErrorInfo {
    return {
      type: 'unknown',
      message: error.message,
      details: error.stack,
      timestamp: new Date(),
      retryable: false,
      context
    };
  }

  /**
   * Parses an Axios error response
   */
  private parseAxiosError(error: any, context?: Record<string, any>): ErrorInfo {
    const status = error.response?.status;
    const data = error.response?.data;
    
    let type: ErrorInfo['type'] = 'network';
    let retryable = false;
    let message = 'Error de conexión';

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      type = 'timeout';
      message = 'La operación tardó más de lo esperado';
      retryable = true;
    } else if (!error.response) {
      type = 'network';
      message = 'No se pudo conectar con el servidor';
      retryable = true;
    } else {
      switch (status) {
        case 400:
          type = 'validation';
          message = data?.message || 'Datos de entrada inválidos';
          retryable = false;
          break;
        case 401:
          type = 'permission';
          message = 'No autorizado. Inicia sesión nuevamente';
          retryable = false;
          break;
        case 403:
          type = 'permission';
          message = 'No tienes permisos para realizar esta acción';
          retryable = false;
          break;
        case 404:
          type = 'server';
          message = 'Recurso no encontrado';
          retryable = false;
          break;
        case 422:
          type = 'validation';
          message = data?.message || 'Error de validación';
          retryable = false;
          break;
        case 429:
          type = 'server';
          message = 'Demasiadas solicitudes. Intenta más tarde';
          retryable = true;
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          type = 'server';
          message = 'Error interno del servidor';
          retryable = true;
          break;
        default:
          type = 'server';
          message = data?.message || `Error del servidor (${status})`;
          retryable = status >= 500;
      }
    }

    return {
      type,
      code: error.code || status?.toString(),
      message,
      details: JSON.stringify({
        status,
        statusText: error.response?.statusText,
        data: data,
        config: {
          method: error.config?.method,
          url: error.config?.url,
          headers: error.config?.headers
        }
      }, null, 2),
      timestamp: new Date(),
      retryable,
      context
    };
  }

  /**
   * Executes an operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    context?: Record<string, any>
  ): Promise<T> {
    const retryConfig: RetryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
      ...config
    };

    const operationId = this.generateOperationId();
    let lastError: any;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Clear retry count on success
        this.retryAttempts.delete(operationId);
        
        return result;
      } catch (error) {
        lastError = error;
        
        const errorInfo = this.createErrorInfo(error, {
          ...context,
          attempt: attempt + 1,
          maxRetries: retryConfig.maxRetries,
          operationId
        });

        // Log the error
        this.logError(errorInfo);

        // Don't retry if not retryable or max attempts reached
        if (!errorInfo.retryable || attempt >= retryConfig.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, retryConfig);
        
        // Update retry count
        this.retryAttempts.set(operationId, attempt + 1);
        
        // Wait before retry
        await this.sleep(delay);
      }
    }

    // All retries failed, throw the last error
    throw lastError;
  }

  /**
   * Calculates delay for retry with exponential backoff and optional jitter
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    const delay = Math.min(exponentialDelay, config.maxDelay);
    
    if (config.jitter) {
      // Add random jitter (±25%)
      const jitterRange = delay * 0.25;
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      return Math.max(0, delay + jitter);
    }
    
    return delay;
  }

  /**
   * Logs an error for debugging and monitoring
   */
  logError(error: ErrorInfo): void {
    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error: ${error.type.toUpperCase()}`);
      console.error('Message:', error.message);
      if (error.code) console.error('Code:', error.code);
      if (error.details) console.error('Details:', error.details);
      if (error.context) console.error('Context:', error.context);
      console.error('Timestamp:', error.timestamp);
      console.groupEnd();
    }

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(error);
    }
  }

  /**
   * Reports an error to external service
   */
  async reportError(error: ErrorInfo, additionalInfo?: Record<string, any>): Promise<void> {
    const report: ErrorReport = {
      id: this.generateReportId(),
      error,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      additionalInfo
    };

    this.errorReports.push(report);

    try {
      // Send to error reporting service
      await this.sendErrorReport(report);
    } catch (reportingError) {
      console.error('Failed to send error report:', reportingError);
    }
  }

  /**
   * Gets error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    recentErrors: ErrorInfo[];
    retryStats: { operationId: string; attempts: number }[];
  } {
    const errorsByType: Record<string, number> = {};
    
    this.errorReports.forEach(report => {
      const type = report.error.type;
      errorsByType[type] = (errorsByType[type] || 0) + 1;
    });

    const recentErrors = this.errorReports
      .slice(-10)
      .map(report => report.error);

    const retryStats = Array.from(this.retryAttempts.entries())
      .map(([operationId, attempts]) => ({ operationId, attempts }));

    return {
      totalErrors: this.errorReports.length,
      errorsByType,
      recentErrors,
      retryStats
    };
  }

  /**
   * Clears error history
   */
  clearErrorHistory(): void {
    this.errorReports = [];
    this.retryAttempts.clear();
  }

  // Private helper methods
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string | undefined {
    // Get from auth context or localStorage
    return localStorage.getItem('userId') || undefined;
  }

  private getSessionId(): string | undefined {
    // Get from session storage or generate
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  private async sendToLoggingService(error: ErrorInfo): Promise<void> {
    try {
      // In a real app, this would send to a service like Sentry, LogRocket, etc.
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      });
    } catch (loggingError) {
      console.error('Failed to send to logging service:', loggingError);
    }
  }

  private async sendErrorReport(report: ErrorReport): Promise<void> {
    try {
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(report)
      });
    } catch (reportingError) {
      console.error('Failed to send error report:', reportingError);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default ErrorHandlingService.getInstance();