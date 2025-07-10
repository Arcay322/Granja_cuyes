// Archivo recreado para evitar conflictos de tipos.
import { Router } from 'express';
import { login, register } from '../controllers/auth.controller';
// import { validate } from '../middlewares/validateRequest';

const router = Router();

// Rutas de Autenticación (sin validación ni autenticación por ahora)
router.post('/login', /* validate(loginSchema), */ login);
router.post('/register', /* validate(registerSchema), */ register);

export default router;
