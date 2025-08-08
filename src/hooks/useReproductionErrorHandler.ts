import { useCallback } from 'react';
import { useSystemNotifications } from './useSystemNotifications';

interface ErrorDetails {
  code?: string;
  details?: any;
  timestamp?: string;
  path?: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
      error?: string;
      code?: string;
      details?: any;
    };
    status?: number;
  };
  message?: string;
  code?: string;
}

export const useReproductionErrorHandler = () => {
  const { checkSystemNotifications } = useSystemNotifications();

  const handleApiError = useCallback((error: ApiError, context: string = 'Operación') => {
    console.error(`Error en ${context}:`, error);

    let userMessage = 'Ha ocurrido un error inesperado';
    let errorCode = 'UNKNOWN_ERROR';
    let shouldRetry = false;

    if (error.response?.data) {
      const { message, error: errorType, code, details } = error.response.data;
      userMessage = message || 'Error del servidor';
      errorCode = code || errorType || 'SERVER_ERROR';

      // Determinar si el error es recuperable
      const status = error.response.status;
      shouldRetry = status ? status >= 500 || status === 408 || status === 429 : false;

      // Mensajes específicos para errores comunes del módulo de reproducción
      switch (errorCode) {
        case 'AUTH_ERROR':
        case 'INVALID_TOKEN':
          userMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
          // Redirigir al login después de un breve delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          break;

        case 'VALIDATION_ERROR':
          userMessage = 'Los datos proporcionados no son válidos. Por favor, revisa la información.';
          if (details && Array.isArray(details)) {
            const fieldErrors = details.map((d: any) => d.message).join(', ');
            userMessage += ` Errores: ${fieldErrors}`;
          }
          break;

        case 'NOT_FOUND':
          userMessage = 'El registro solicitado no fue encontrado. Puede haber sido eliminado.';
          break;

        case 'DUPLICATE_ENTRY':
          userMessage = 'Ya existe un registro con estos datos. Por favor, verifica la información.';
          break;

        case 'FOREIGN_KEY_CONSTRAINT':
          userMessage = 'No se puede completar la operación debido a dependencias con otros registros.';
          break;

        case 'DATABASE_ERROR':
          userMessage = 'Error de base de datos. Por favor, intenta nuevamente en unos momentos.';
          shouldRetry = true;
          break;

        case 'NETWORK_ERROR':
          userMessage = 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.';
          shouldRetry = true;
          break;

        default:
          if (status === 500) {
            userMessage = 'Error interno del servidor. El equipo técnico ha sido notificado.';
            shouldRetry = true;
          } else if (status === 503) {
            userMessage = 'El servicio no está disponible temporalmente. Intenta más tarde.';
            shouldRetry = true;
          }
      }
    } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      userMessage = 'Error de conexión. Verifica tu conexión a internet.';
      errorCode = 'NETWORK_ERROR';
      shouldRetry = true;
    } else if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
      userMessage = 'La operación tardó demasiado tiempo. Intenta nuevamente.';
      errorCode = 'TIMEOUT_ERROR';
      shouldRetry = true;
    }

    // Log estructurado del error
    const errorLog = {
      context,
      message: userMessage,
      code: errorCode,
      originalError: error.message,
      status: error.response?.status,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      shouldRetry
    };

    console.error('Error estructurado:', errorLog);

    return {
      message: userMessage,
      code: errorCode,
      shouldRetry,
      details: error.response?.data?.details
    };
  }, []);

  const handleFormError = useCallback((error: ApiError, formType: string) => {
    const context = `Formulario de ${formType}`;
    return handleApiError(error, context);
  }, [handleApiError]);

  const handleDataLoadError = useCallback((error: ApiError, dataType: string) => {
    const context = `Carga de ${dataType}`;
    return handleApiError(error, context);
  }, [handleApiError]);

  const handleSaveError = useCallback((error: ApiError, recordType: string) => {
    const context = `Guardado de ${recordType}`;
    return handleApiError(error, context);
  }, [handleApiError]);

  const handleDeleteError = useCallback((error: ApiError, recordType: string) => {
    const context = `Eliminación de ${recordType}`;
    return handleApiError(error, context);
  }, [handleApiError]);

  // Función para manejar errores de componentes React
  const handleComponentError = useCallback((error: Error, errorInfo?: any) => {
    console.error('Error de componente:', error, errorInfo);

    const errorLog = {
      type: 'COMPONENT_ERROR',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    console.error('Error de componente estructurado:', errorLog);

    // Aquí podrías enviar el error a un servicio de logging externo
    // como Sentry, LogRocket, etc.

    return {
      message: 'Ha ocurrido un error en la interfaz. La página se recargará automáticamente.',
      shouldReload: true
    };
  }, []);

  // Función para reintentar operaciones con backoff exponencial
  const retryOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        const errorInfo = handleApiError(error as ApiError, 'Reintento de operación');
        
        if (!errorInfo.shouldRetry || attempt === maxRetries) {
          throw error;
        }

        // Backoff exponencial con jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.log(`Reintentando operación en ${delay}ms (intento ${attempt}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }, [handleApiError]);

  // Función para verificar el estado de la conexión
  const checkConnectionStatus = useCallback(() => {
    return {
      isOnline: navigator.onLine,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      downlink: (navigator as any).connection?.downlink || 0
    };
  }, []);

  return {
    handleApiError,
    handleFormError,
    handleDataLoadError,
    handleSaveError,
    handleDeleteError,
    handleComponentError,
    retryOperation,
    checkConnectionStatus
  };
};

export default useReproductionErrorHandler;