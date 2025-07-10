// Archivo recreado para evitar conflictos de tipos.
import { Router } from 'express';
import { login, logout, profile, register } from '../controllers/auth.controller';
// import { validate } from '../middlewares/validateRequest';

const router = Router();

// Rutas de Autenticación (sin validación ni autenticación por ahora)
router.post('/login', /* validate(loginSchema), */ login);
router.post('/register', /* validate(registerSchema), */ register);
router.get('/profile', /* authenticateToken, */ profile);
router.post('/logout', logout);

export default router;
