import { Request } from 'express';

// Creamos nuestra propia interfaz que extiende la Request de Express
// y le añade la propiedad 'user' que nosotros insertamos en el middleware.
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: number;
        email: string;
        rol: string;
        // Añade aquí cualquier otro campo que venga en tu payload de JWT
    };
}
