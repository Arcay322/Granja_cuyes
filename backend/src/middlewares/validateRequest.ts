import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validateRequest = (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err: any) {
    // Mejorar la estructura de errores para el frontend
    res.status(400).json({
      message: 'Datos inválidos',
      errors: err.errors?.map((e: any) => ({
        path: e.path,
        message: e.message
      })) || err.errors
    });
  }
};
