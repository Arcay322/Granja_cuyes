import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  status?: number;
  details?: any;
  isOperational?: boolean;
  errorId?: string; // Para trazabilidad
}

function generateErrorId() {
  return Math.random().toString(36).substring(2, 10);
}

export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction) {
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';
  const isOperational = err.isOperational ?? false;
  err.errorId = err.errorId || generateErrorId();

  // Log solo en desarrollo o para errores críticos
  if (!isProd || status >= 500) {
    console.error(`[ErrorID: ${err.errorId}]`, err);
    // Aquí puedes integrar con Sentry, Loggly, etc.
  }

  // No exponer detalles internos en producción salvo errores operacionales
  res.status(status).json({
    message: isProd && !isOperational ? 'Error interno del servidor' : err.message || 'Error interno del servidor',
    details: !isProd || isOperational ? err.details || undefined : undefined,
    errorId: err.errorId
  });
}
