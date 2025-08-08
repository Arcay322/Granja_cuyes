import { useState, useCallback, useRef } from 'react';
import { useSystemNotifications } from './useSystemNotifications';

export interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorCode?: string;
  context?: string;
  timestamp?: Date;
  retryCount: number;
}

export interface ErrorHandlingOptions {
  maxRetries?: number;
  retryDelay?: number;
  showNotification?: boolean;
  logToConsole?: boolean;
  logToService?: boolean;
}

export const useErrorHandling = (options: ErrorHandlingOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    showNotification = true,
    logToConsole = true,
    logToService = false
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    retryCount: 0
  });

  const systemNotifications = useSystemNotifications();
  const showError = (systemNotifications as any).showError || (() => {});
  const showWarning = (systemNotifications as any).showWarning || (() => {});
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const logError = useCallback((error: Error, context?: string) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    if (logToConsole) {
      console.error('Error logged:', errorData);
    }

    if (logToService) {
      // Send to external logging service
      fetch('/api/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      }).catch(logError => {
        console.error('Failed to log error to service:', logError);
      });
    }
  }, [logToConsole, logToService]);

  const handleError = useCallback((error: Error | string, context?: string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    setErrorState(prev => ({
      hasError: true,
      error: errorObj,
      context,
      timestamp: new Date(),
      retryCount: prev.retryCount
    }));

    logError(errorObj, context);

    if (showNotification) {
      showError(errorObj.message || 'Ha ocurrido un error inesperado');
    }
  }, [logError, showNotification, showError]);

  const clearError = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setErrorState({
      hasError: false,
      error: null,
      retryCount: 0
    });
  }, []);

  const retryOperation = useCallback(async (operation: () => Promise<any>) => {
    if (errorState.retryCount >= maxRetries) {
      showWarning('Se ha alcanzado el máximo número de reintentos');
      return;
    }

    setErrorState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1
    }));

    try {
      const result = await operation();
      clearError();
      return result;
    } catch (error) {
      handleError(error as Error, 'retry_operation');
      
      // Schedule next retry
      if (errorState.retryCount + 1 < maxRetries) {
        retryTimeoutRef.current = setTimeout(() => {
          retryOperation(operation);
        }, retryDelay * Math.pow(2, errorState.retryCount)); // Exponential backoff
      }
    }
  }, [errorState.retryCount, maxRetries, retryDelay, handleError, clearError, showWarning]);

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      clearError();
      const result = await operation();
      return result;
    } catch (error) {
      handleError(error as Error, context);
      return null;
    }
  }, [handleError, clearError]);

  return {
    errorState,
    handleError,
    clearError,
    retryOperation,
    executeWithErrorHandling,
    hasError: errorState.hasError,
    error: errorState.error,
    canRetry: errorState.retryCount < maxRetries
  };
};

// Hook específico para operaciones de API
export const useApiErrorHandling = () => {
  const { handleError, executeWithErrorHandling, ...rest } = useErrorHandling({
    maxRetries: 3,
    retryDelay: 2000,
    showNotification: true,
    logToService: true
  });

  const handleApiError = useCallback((error: any, context?: string) => {
    let errorMessage = 'Error de conexión con el servidor';
    let errorCode = 'API_ERROR';

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          errorMessage = data.message || 'Solicitud inválida';
          errorCode = 'BAD_REQUEST';
          break;
        case 401:
          errorMessage = 'No autorizado. Por favor, inicie sesión nuevamente';
          errorCode = 'UNAUTHORIZED';
          break;
        case 403:
          errorMessage = 'No tiene permisos para realizar esta acción';
          errorCode = 'FORBIDDEN';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado';
          errorCode = 'NOT_FOUND';
          break;
        case 422:
          errorMessage = data.message || 'Datos de entrada no válidos';
          errorCode = 'VALIDATION_ERROR';
          break;
        case 429:
          errorMessage = 'Demasiadas solicitudes. Intente más tarde';
          errorCode = 'RATE_LIMITED';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          errorCode = 'INTERNAL_ERROR';
          break;
        case 503:
          errorMessage = 'Servicio no disponible temporalmente';
          errorCode = 'SERVICE_UNAVAILABLE';
          break;
        default:
          errorMessage = data.message || `Error del servidor (${status})`;
          errorCode = `HTTP_${status}`;
      }
    } else if (error.request) {
      // Network error
      errorMessage = 'Error de conexión. Verifique su conexión a internet';
      errorCode = 'NETWORK_ERROR';
    } else {
      // Other error
      errorMessage = error.message || 'Error desconocido';
      errorCode = 'UNKNOWN_ERROR';
    }

    const apiError = new Error(errorMessage);
    (apiError as any).code = errorCode;
    (apiError as any).originalError = error;

    handleError(apiError, context);
  }, [handleError]);

  const executeApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      return await executeWithErrorHandling(apiCall, context);
    } catch (error) {
      handleApiError(error, context);
      return null;
    }
  }, [executeWithErrorHandling, handleApiError]);

  return {
    ...rest,
    handleApiError,
    executeApiCall
  };
};

// Hook para validación de formularios
export const useFormValidation = () => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const systemNotifications = useSystemNotifications();
  const showError = (systemNotifications as any).showError || (() => {});

  const validateField = useCallback((fieldName: string, value: any, rules: ValidationRule[]): string[] => {
    const errors: string[] = [];

    rules.forEach(rule => {
      const error = rule.validate(value);
      if (error) {
        errors.push(error);
      }
    });

    return errors;
  }, []);

  const validateForm = useCallback((formData: Record<string, any>, validationRules: Record<string, ValidationRule[]>): boolean => {
    const newErrors: Record<string, string[]> = {};
    let hasErrors = false;

    Object.keys(validationRules).forEach(fieldName => {
      const fieldErrors = validateField(fieldName, formData[fieldName], validationRules[fieldName]);
      if (fieldErrors.length > 0) {
        newErrors[fieldName] = fieldErrors;
        hasErrors = true;
      }
    });

    setValidationErrors(newErrors);

    if (hasErrors) {
      showError('Por favor, corrija los errores en el formulario');
    }

    return !hasErrors;
  }, [validateField, showError]);

  const clearValidationErrors = useCallback((fieldName?: string) => {
    if (fieldName) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    } else {
      setValidationErrors({});
    }
  }, []);

  const getFieldError = useCallback((fieldName: string): string | undefined => {
    const errors = validationErrors[fieldName];
    return errors && errors.length > 0 ? errors[0] : undefined;
  }, [validationErrors]);

  const hasFieldError = useCallback((fieldName: string): boolean => {
    return !!(validationErrors[fieldName] && validationErrors[fieldName].length > 0);
  }, [validationErrors]);

  return {
    validationErrors,
    validateField,
    validateForm,
    clearValidationErrors,
    getFieldError,
    hasFieldError
  };
};

// Tipos para validación
export interface ValidationRule {
  validate: (value: any) => string | null;
}

// Reglas de validación comunes
export const ValidationRules = {
  required: (message = 'Este campo es requerido'): ValidationRule => ({
    validate: (value) => {
      if (value === undefined || value === null || value === '') {
        return message;
      }
      return null;
    }
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => {
      if (typeof value === 'string' && value.length < min) {
        return message || `Debe tener al menos ${min} caracteres`;
      }
      return null;
    }
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => {
      if (typeof value === 'string' && value.length > max) {
        return message || `No puede exceder ${max} caracteres`;
      }
      return null;
    }
  }),

  email: (message = 'Debe ser un email válido'): ValidationRule => ({
    validate: (value) => {
      if (typeof value === 'string' && value.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return message;
        }
      }
      return null;
    }
  }),

  number: (message = 'Debe ser un número válido'): ValidationRule => ({
    validate: (value) => {
      if (value !== undefined && value !== null && value !== '' && isNaN(Number(value))) {
        return message;
      }
      return null;
    }
  }),

  min: (min: number, message?: string): ValidationRule => ({
    validate: (value) => {
      const num = Number(value);
      if (!isNaN(num) && num < min) {
        return message || `Debe ser mayor o igual a ${min}`;
      }
      return null;
    }
  }),

  max: (max: number, message?: string): ValidationRule => ({
    validate: (value) => {
      const num = Number(value);
      if (!isNaN(num) && num > max) {
        return message || `Debe ser menor o igual a ${max}`;
      }
      return null;
    }
  })
};