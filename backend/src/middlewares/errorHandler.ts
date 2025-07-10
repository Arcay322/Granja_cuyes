import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  status?: number;
  details?: any;
  isOperational?: boolean;
}

export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction) {
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';
  const isOperational = err.isOperational ?? false;

  // Log solo en desarrollo
  if (!isProd) {
    console.error(err);
  }

  // No exponer detalles internos en producción salvo errores operacionales
  res.status(status).json({
    message: isProd && !isOperational ? 'Error interno del servidor' : err.message || 'Error interno del servidor',
    details: !isProd || isOperational ? err.details || undefined : undefined
  });
}
