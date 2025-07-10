import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  // Permitir JWT por cookie httpOnly o header Authorization
  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader && authHeader.split(' ')[1];
  const tokenFromCookie = req.cookies?.token;
  const token = tokenFromHeader || tokenFromCookie;
  if (!token) return res.status(401).json({ message: 'Token requerido' });
  jwt.verify(token, process.env.JWT_SECRET as string, (err: jwt.VerifyErrors | null, user: string | JwtPayload | undefined) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    (req as any).user = user;
    next();
  });
}
