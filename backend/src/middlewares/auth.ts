import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  // Permitir JWT por cookie httpOnly o header Authorization
  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader && authHeader.split(' ')[1];
  const tokenFromCookie = req.cookies?.token;
  const token = tokenFromHeader || tokenFromCookie;
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Token de autenticación requerido',
      error: 'MISSING_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    
    // El token contiene userId, pero nuestros tipos esperan id
    // Mapeamos userId a id para mantener consistencia y aseguramos que sea un número
    const userId = decoded.userId || decoded.id;
    req.user = {
      id: typeof userId === 'bigint' ? Number(userId) : Number(userId),
      email: decoded.email,
      rol: decoded.rol || 'user' // rol por defecto si no está presente
    };
    
    next();
  } catch (err) {
    console.error('Error verificando token:', err);
    return res.status(403).json({ 
      success: false,
      message: 'Token inválido o expirado',
      error: 'INVALID_TOKEN'
    });
  }
}
