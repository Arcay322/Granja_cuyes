// Type Guards for API Responses and Error Handling

import { ApiResponse, ApiError } from '../types/api';

/**
 * Type guard to check if a response is a valid API response
 */
export function isApiResponse<T>(response: unknown): response is ApiResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    typeof (response as any).success === 'boolean' &&
    'data' in response
  );
}

/**
 * Type guard to check if a response is a successful API response
 */
export function isSuccessfulApiResponse<T>(response: unknown): response is ApiResponse<T> & { success: true } {
  return isApiResponse<T>(response) && response.success === true;
}

/**
 * Type guard to check if a response is a failed API response
 */
export function isFailedApiResponse<T>(response: unknown): response is ApiResponse<T> & { success: false } {
  return isApiResponse<T>(response) && response.success === false;
}

/**
 * Type guard to check if an error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    (
      ('response' in error && typeof (error as any).response === 'object') ||
      ('message' in error && typeof (error as any).message === 'string') ||
      ('request' in error)
    )
  );
}

/**
 * Type guard to check if an error has a response
 */
export function hasErrorResponse(error: unknown): error is ApiError & { response: NonNullable<ApiError['response']> } {
  return (
    isApiError(error) &&
    error.response !== undefined &&
    typeof error.response === 'object' &&
    error.response !== null
  );
}

/**
 * Type guard to check if an error response has data
 */
export function hasErrorResponseData(error: unknown): error is ApiError & { 
  response: { 
    data: NonNullable<NonNullable<ApiError['response']>['data']> 
  } 
} {
  return (
    hasErrorResponse(error) &&
    error.response.data !== undefined &&
    typeof error.response.data === 'object' &&
    error.response.data !== null
  );
}

/**
 * Type guard to check if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard to check if a value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if a value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a response contains pagination data
 */
export function hasPagination(response: unknown): response is { pagination: any } {
  return (
    isObject(response) &&
    'pagination' in response &&
    isObject(response.pagination)
  );
}

/**
 * Safely extract data from an API response
 */
export function extractApiData<T>(response: unknown): T | null {
  if (isSuccessfulApiResponse<T>(response)) {
    return response.data;
  }
  return null;
}

/**
 * Safely extract error message from an error object
 */
export function extractErrorMessage(error: unknown): string {
  if (hasErrorResponseData(error) && error.response.data.message) {
    return error.response.data.message;
  }
  
  if (hasErrorResponseData(error) && error.response.data.error) {
    return error.response.data.error;
  }
  
  if (isApiError(error) && error.message) {
    return error.message;
  }
  
  if (isString(error)) {
    return error;
  }
  
  return 'Ha ocurrido un error inesperado';
}

/**
 * Safely extract HTTP status code from an error
 */
export function extractErrorStatus(error: unknown): number | null {
  if (hasErrorResponse(error) && isNumber(error.response.status)) {
    return error.response.status;
  }
  return null;
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.request !== undefined && error.response === undefined;
  }
  return false;
}

/**
 * Check if an error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  if (isApiError(error) && error.code) {
    return error.code === 'ECONNABORTED' || error.code === 'TIMEOUT';
  }
  return false;
}

/**
 * Check if an error is a server error (5xx)
 */
export function isServerError(error: unknown): boolean {
  const status = extractErrorStatus(error);
  return status !== null && status >= 500 && status < 600;
}

/**
 * Check if an error is a client error (4xx)
 */
export function isClientError(error: unknown): boolean {
  const status = extractErrorStatus(error);
  return status !== null && status >= 400 && status < 500;
}

/**
 * Check if an error is an authentication error (401)
 */
export function isAuthError(error: unknown): boolean {
  const status = extractErrorStatus(error);
  return status === 401;
}

/**
 * Check if an error is a forbidden error (403)
 */
export function isForbiddenError(error: unknown): boolean {
  const status = extractErrorStatus(error);
  return status === 403;
}

/**
 * Check if an error is a not found error (404)
 */
export function isNotFoundError(error: unknown): boolean {
  const status = extractErrorStatus(error);
  return status === 404;
}

/**
 * Validate that a response has the expected structure for a specific endpoint
 */
export function validateResponseStructure<T>(
  response: unknown,
  validator: (data: unknown) => data is T
): response is ApiResponse<T> {
  if (!isSuccessfulApiResponse(response)) {
    return false;
  }
  
  return validator(response.data);
}

/**
 * Create a type-safe response handler
 */
export function createResponseHandler<T>(
  onSuccess: (data: T) => void,
  onError: (error: string) => void
) {
  return (response: unknown) => {
    if (isSuccessfulApiResponse<T>(response)) {
      onSuccess(response.data);
    } else if (isFailedApiResponse(response)) {
      onError(response.error || response.message || 'Error desconocido');
    } else {
      onError('Respuesta inválida del servidor');
    }
  };
}

/**
 * Create a type-safe error handler
 */
export function createErrorHandler(onError: (message: string, status?: number) => void) {
  return (error: unknown) => {
    const message = extractErrorMessage(error);
    const status = extractErrorStatus(error);
    onError(message, status || undefined);
  };
}