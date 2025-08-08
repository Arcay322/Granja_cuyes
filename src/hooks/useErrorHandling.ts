import { useState, useCallback, useRef } from 'react';
import { useSystemNotifications } from './useSystemNotifications';
import ErrorHandlingService from '../services/errorHandlingService';
import { ErrorInfo } from '../components/common/ErrorDisplay';

export interface ErrorState {
  hasError: boolean;
  error: ErrorInfo | null;
  retryCount: number;
}

export interface ErrorHandlingOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  showNotification?: boolean;
  autoRetry?: boolean;
}

export const useErrorHandling = (options: ErrorHandlingOptions = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    showNotification = true,
    autoRetry = false
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

  const handleError = useCallback((error: any, context?: Record<string, any>) => {
    const errorInfo = ErrorHandlingService.createErrorInfo(error, context);
    
    setErrorState(prev => ({
      hasError: true,
      error: {
        ...errorInfo,
        retryCount: prev.retryCount,
        maxRetries
      },
      retryCount: prev.retryCount
    }));

    ErrorHandlingService.logError(errorInfo);

    if (showNotification) {
      showError(errorInfo.message);
    }
  }, [maxRetries, showNotification, showError]);

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
      retryCount: prev.retryCount + 1,
      error: prev.error ? {
        ...prev.error,
        retryCount: prev.retryCount + 1
      } : null
    }));

    try {
      const result = await operation();
      clearError();
      return result;
    } catch (error) {
      handleError(error, { 
        operation: 'retry',
        attempt: errorState.retryCount + 1 
      });
      
      // Schedule next retry if auto-retry is enabled
      if (autoRetry && errorState.retryCount + 1 < maxRetries) {
        const delay = Math.min(
          baseDelay * Math.pow(backoffMultiplier, errorState.retryCount),
          maxDelay
        );
        
        retryTimeoutRef.current = setTimeout(() => {
          retryOperation(operation);
        }, delay);
      }
    }
  }, [
    errorState.retryCount, 
    maxRetries, 
    baseDelay, 
    maxDelay, 
    backoffMultiplier,
    autoRetry,
    handleError, 
    clearError, 
    showWarning
  ]);

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> => {
    try {
      clearError();
      const result = await ErrorHandlingService.executeWithRetry(
        operation,
        {
          maxRetries,
          baseDelay,
          maxDelay,
          backoffMultiplier,
          jitter: true
        },
        context
      );
      return result;
    } catch (error) {
      handleError(error, context);
      return null;
    }
  }, [handleError, clearError, maxRetries, baseDelay, maxDelay, backoffMultiplier]);

  const reportError = useCallback(async (additionalInfo?: Record<string, any>) => {
    if (errorState.error) {
      await ErrorHandlingService.reportError(errorState.error, additionalInfo);
    }
  }, [errorState.error]);

  return {
    errorState,
    handleError,
    clearError,
    retryOperation,
    executeWithErrorHandling,
    reportError,
    hasError: errorState.hasError,
    error: errorState.error,
    canRetry: errorState.retryCount < maxRetries
  };
};

// Hook específico para operaciones de API
export const useApiErrorHandling = () => {
  const errorHandling = useErrorHandling({
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 30000,
    showNotification: true,
    autoRetry: false
  });

  const executeApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> => {
    return errorHandling.executeWithErrorHandling(apiCall, {
      ...context,
      type: 'api_call'
    });
  }, [errorHandling]);

  return {
    ...errorHandling,
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
  validate: (value: unknown) => string | null;
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