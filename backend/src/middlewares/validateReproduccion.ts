import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// Enhanced error response interface
export interface ValidationErrorResponse {
  success: false;
  message: string;
  errors: {
    field: string;
    message: string;
    code: string;
    value?: any;
  }[];
  timestamp: string;
  path: string;
}

// Enhanced API error response interface
export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
  errors?: {
    field: string;
    message: string;
    code: string;
    value?: any;
  }[];
  timestamp: string;
  path: string;
  statusCode: number;
}

// Validation middleware factory
export const validateSchema = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = source === 'body' ? req.body : 
                           source === 'query' ? req.query : 
                           req.params;

      const validatedData = schema.parse(dataToValidate);
      
      // Replace the original data with validated data
      if (source === 'body') {
        req.body = validatedData;
      } else if (source === 'query') {
        req.query = validatedData as any;
      } else {
        req.params = validatedData as any;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          value: err.path.reduce((obj, key) => obj?.[key], source === 'body' ? req.body : source === 'query' ? req.query : req.params)
        }));

        const errorResponse: ValidationErrorResponse = {
          success: false,
          message: 'Errores de validación en los datos enviados',
          errors: validationErrors,
          timestamp: new Date().toISOString(),
          path: req.path
        };

        return res.status(400).json(errorResponse);
      }
      
      // Handle unexpected validation errors
      const errorResponse: ApiErrorResponse = {
        success: false,
        message: 'Error interno de validación',
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 500
      };

      return res.status(500).json(errorResponse);
    }
  };
};

// Enhanced error handler for reproduction module
export const handleReproductionError = (error: any, req: Request, res: Response, context: string) => {
  console.error(`Error in ${context}:`, error);

  // Handle Prisma errors
  if (error.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Ya existe un registro con estos datos',
      error: 'Violación de restricción única',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 409
    } as ApiErrorResponse);
  }

  if (error.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'El registro solicitado no fue encontrado',
      error: 'Registro no encontrado',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 404
    } as ApiErrorResponse);
  }

  if (error.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Error de referencia: el registro relacionado no existe',
      error: 'Violación de clave foránea',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 400
    } as ApiErrorResponse);
  }

  // Handle business logic errors
  if (error.message?.includes('No hay espacio suficiente')) {
    return res.status(409).json({
      success: false,
      message: error.message,
      error: 'Capacidad insuficiente',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 409
    } as ApiErrorResponse);
  }

  if (error.message?.includes('ya está preñada')) {
    return res.status(409).json({
      success: false,
      message: error.message,
      error: 'Conflicto reproductivo',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 409
    } as ApiErrorResponse);
  }

  if (error.message?.includes('Gestación muy corta') || error.message?.includes('período de gestación')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'Período de gestación inválido',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 400
    } as ApiErrorResponse);
  }

  // Handle validation errors
  if (error instanceof ZodError) {
    const validationErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
      value: err.path.reduce((obj, key) => obj?.[key], req.body)
    }));

    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: validationErrors,
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 400
    } as ApiErrorResponse);
  }

  // Handle network/timeout errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return res.status(503).json({
      success: false,
      message: 'Servicio temporalmente no disponible',
      error: 'Error de conexión a la base de datos',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 503
    } as ApiErrorResponse);
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.stack : 'Error interno',
    timestamp: new Date().toISOString(),
    path: req.path,
    statusCode
  } as ApiErrorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      handleReproductionError(error, req, res, fn.name || 'unknown');
    });
  };
};

// Success response helper
export const successResponse = (res: Response, data: any, message: string, statusCode: number = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  });
};

// Pagination response helper
export const paginatedResponse = (
  res: Response, 
  data: any[], 
  pagination: any, 
  message: string,
  statusCode: number = 200
) => {
  return res.status(statusCode).json({
    success: true,
    data,
    pagination,
    message,
    timestamp: new Date().toISOString()
  });
};