import { Request, Response, NextFunction } from 'express';

export function logger(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${req.method} ${req.url}`);
  }
  next();
}
