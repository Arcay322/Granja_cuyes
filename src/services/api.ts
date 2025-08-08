import axios from 'axios';
import { ApiResponse, ApiError } from '../types/api';
import { 
  isApiResponse, 
  isSuccessfulApiResponse, 
  extractErrorMessage, 
  extractErrorStatus,
  isApiError,
  hasErrorResponse
} from '../utils/typeGuards';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 10000, // 10 segundos timeout
});

// Función para obtener el token desde localStorage o sessionStorage
const getToken = (): string | null => {
  const localToken = localStorage.getItem('token');
  const sessionToken = sessionStorage.getItem('token');
  return localToken || sessionToken || null;
};

// Función para verificar si el token es válido (no expirado)
const isTokenValid = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch {
    return false;
  }
};

// Función para limpiar tokens
const clearTokens = (): void => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
};

// Interceptor de request - agregar token a todas las solicitudes
api.interceptors.request.use(
  (config: any) => {
    const token = getToken();
    
    if (token) {
      // Verificar si el token es válido antes de enviarlo
      if (isTokenValid(token)) {
        if (config.headers) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      } else {
        // Token expirado, limpiar y redirigir
        console.warn('Token expirado detectado, limpiando tokens...');
        clearTokens();
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    
    // Agregar headers adicionales
    if (config.headers) {
      config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
    }
    
    return config;
  },
  (error: any) => {
    console.error('Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

// Interceptor de response - manejar errores de autenticación
api.interceptors.response.use(
  (response: any) => {
    return response;
  },
  (error: any) => {
    if (hasErrorResponse(error)) {
      const status = extractErrorStatus(error);
      
      switch (status) {
        case 401:
          console.error('Error 401: No autorizado - Token inválido o expirado');
          clearTokens();
          
          // Solo redirigir si no estamos ya en login/register
          if (!window.location.pathname.includes('/login') && 
              !window.location.pathname.includes('/register')) {
            console.log('Redirigiendo al login...');
            window.location.href = '/login';
          }
          break;
          
        case 403:
          console.error('Error 403: Acceso prohibido');
          break;
          
        case 500:
          console.error('Error 500: Error interno del servidor');
          break;
          
        default:
          console.error(`Error ${status}:`, error.response?.data);
      }
    } else if (error.request) {
      console.error('Error de red - No se recibió respuesta del servidor:', error.message);
    } else {
      console.error('Error configurando la request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Función helper para verificar el estado de autenticación
export const isAuthenticated = (): boolean => {
  const token = getToken();
  return token !== null && isTokenValid(token);
};

// Función helper para obtener información del usuario del token
export const getUserFromToken = (): { userId: number; email: string } | null => {
  const token = getToken();
  if (!token || !isTokenValid(token)) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.userId,
      email: payload.email
    };
  } catch {
    return null;
  }
};

// Type-safe API methods
export class ApiService {
  /**
   * Generic GET request with type safety
   */
  static async get<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await api.get(url, config);
      if (isApiResponse<T>(response.data)) {
        return response.data;
      }
      throw new Error('Invalid API response format');
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Generic POST request with type safety
   */
  static async post<T>(url: string, data?: unknown, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await api.post(url, data, config);
      if (isApiResponse<T>(response.data)) {
        return response.data;
      }
      throw new Error('Invalid API response format');
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Generic PUT request with type safety
   */
  static async put<T>(url: string, data?: unknown, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await api.put(url, data, config);
      if (isApiResponse<T>(response.data)) {
        return response.data;
      }
      throw new Error('Invalid API response format');
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Generic DELETE request with type safety
   */
  static async delete<T>(url: string, config?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await api.delete(url, config as any);
      if (isApiResponse<T>(response.data)) {
        return response.data;
      }
      throw new Error('Invalid API response format');
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Transform axios error to ApiError
   */
  private static transformError(error: unknown): ApiError {
    if (isApiError(error)) {
      return error;
    }
    
    // Handle non-axios errors
    return {
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }

  /**
   * Safe API call with automatic error handling
   */
  static async safeCall<T>(
    apiCall: () => Promise<ApiResponse<T>>,
    onError?: (error: string) => void
  ): Promise<T | null> {
    try {
      const response = await apiCall();
      if (isSuccessfulApiResponse<T>(response)) {
        return response.data;
      }
      
      const errorMessage = response.error || response.message || 'API call failed';
      if (onError) {
        onError(errorMessage);
      }
      return null;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      if (onError) {
        onError(errorMessage);
      }
      return null;
    }
  }

  /**
   * Download file with proper error handling
   */
  static async downloadFile(url: string, filename?: string): Promise<void> {
    try {
      const response = await api.get(url, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data as BlobPart]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      throw this.transformError(error);
    }
  }
}

// Response transformation utilities
export const transformResponse = {
  /**
   * Extract data from successful response or return null
   */
  extractData: <T>(response: unknown): T | null => {
    if (isSuccessfulApiResponse<T>(response)) {
      return response.data;
    }
    return null;
  },

  /**
   * Extract error message from failed response
   */
  extractError: (response: unknown): string => {
    if (isApiResponse(response) && !response.success) {
      return response.error || response.message || 'Unknown error';
    }
    return extractErrorMessage(response);
  },

  /**
   * Check if response indicates success
   */
  isSuccess: (response: unknown): boolean => {
    return isSuccessfulApiResponse(response);
  }
};

export default api;
