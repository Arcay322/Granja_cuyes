import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
    details: err.details || undefined
  });
}
