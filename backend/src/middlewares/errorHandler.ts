import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import logger from '../utils/logger';

interface AppError extends Error {
  status?: number;
  details?: any;
  isOperational?: boolean;
  errorId?: string;
  code?: string;
}

interface ValidationError {
  field: string;
  message: string;
  value: any;
}

interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  code: string;
  timestamp: Date;
  path: string;
  errorId?: string;
  details?: ValidationError[] | any;
}

function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function handlePrismaError(error: PrismaClientKnownRequestError): { status: number; message: string; code: string; details?: any } {
  switch (error.code) {
    case 'P2002':
      return {
        status: 409,
        message: 'Ya existe un registro con estos datos únicos',
        code: 'DUPLICATE_ENTRY',
        details: { constraint: error.meta?.target }
      };
    case 'P2025':
      return {
        status: 404,
        message: 'Registro no encontrado',
        code: 'NOT_FOUND'
      };
    case 'P2003':
      return {
        status: 400,
        message: 'Violación de restricción de clave foránea',
        code: 'FOREIGN_KEY_CONSTRAINT',
        details: { field: error.meta?.field_name }
      };
    case 'P2014':
      return {
        status: 400,
        message: 'Los datos proporcionados violan una restricción de relación',
        code: 'RELATION_VIOLATION'
      };
    default:
      return {
        status: 500,
        message: 'Error de base de datos',
        code: 'DATABASE_ERROR'
      };
  }
}

function handleValidationError(error: PrismaClientValidationError): { status: number; message: string; code: string } {
  return {
    status: 400,
    message: 'Error de validación en los datos proporcionados',
    code: 'VALIDATION_ERROR'
  };
}

function logError(error: AppError, req: Request): void {
  const errorData = {
    errorId: error.errorId,
    message: error.message,
    stack: error.stack,
    status: error.status,
    code: error.code,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query
  };

  if (error.status && error.status < 500) {
    logger.warn('Client error:', errorData);
  } else {
    logger.error('Server error:', errorData);
  }
}

export function errorHandler(err: AppError | PrismaClientKnownRequestError | PrismaClientValidationError, req: Request, res: Response, next: NextFunction): void {
  const isProd = process.env.NODE_ENV === 'production';
  let status = 500;
  let message = 'Error interno del servidor';
  let code = 'INTERNAL_ERROR';
  let details: any = undefined;

  // Generar ID único para el error
  const errorId = generateErrorId();

  // Manejar diferentes tipos de errores
  if (err instanceof PrismaClientKnownRequestError) {
    const prismaError = handlePrismaError(err);
    status = prismaError.status;
    message = prismaError.message;
    code = prismaError.code;
    details = prismaError.details;
  } else if (err instanceof PrismaClientValidationError) {
    const validationError = handleValidationError(err);
    status = validationError.status;
    message = validationError.message;
    code = validationError.code;
  } else {
    // Error personalizado o genérico
    const appError = err as AppError;
    status = appError.status || 500;
    message = appError.message || 'Error interno del servidor';
    code = appError.code || 'INTERNAL_ERROR';
    details = appError.details;
    appError.errorId = errorId;
  }

  // Log del error
  const errorToLog = err as AppError;
  errorToLog.errorId = errorId;
  errorToLog.status = status;
  errorToLog.code = code;
  logError(errorToLog, req);

  // Preparar respuesta
  const errorResponse: ErrorResponse = {
    success: false,
    message: isProd && status >= 500 ? 'Error interno del servidor' : message,
    error: isProd && status >= 500 ? 'INTERNAL_ERROR' : code,
    code,
    timestamp: new Date(),
    path: req.path,
    errorId
  };

  // Incluir detalles solo en desarrollo o para errores operacionales
  if (!isProd || (status < 500 && details)) {
    errorResponse.details = details;
  }

  res.status(status).json(errorResponse);
}

// Middleware para manejar rutas no encontradas
export function notFoundHandler(req: Request, res: Response): void {
  const errorResponse: ErrorResponse = {
    success: false,
    message: `Ruta ${req.method} ${req.path} no encontrada`,
    error: 'NOT_FOUND',
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date(),
    path: req.path
  };

  logger.warn('Route not found:', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json(errorResponse);
}

// Función helper para crear errores personalizados
export function createError(message: string, status: number = 500, code: string = 'CUSTOM_ERROR', details?: any): AppError {
  const error = new Error(message) as AppError;
  error.status = status;
  error.code = code;
  error.details = details;
  error.isOperational = true;
  return error;
}

// Función helper para errores de validación
export function createValidationError(message: string, validationErrors: ValidationError[]): AppError {
  return createError(message, 400, 'VALIDATION_ERROR', validationErrors);
}

// Función helper para errores de autenticación
export function createAuthError(message: string = 'No autorizado'): AppError {
  return createError(message, 401, 'AUTH_ERROR');
}

// Función helper para errores de autorización
export function createForbiddenError(message: string = 'Acceso prohibido'): AppError {
  return createError(message, 403, 'FORBIDDEN_ERROR');
}

// Función helper para errores de recurso no encontrado
export function createNotFoundError(message: string = 'Recurso no encontrado'): AppError {
  return createError(message, 404, 'NOT_FOUND');
}
