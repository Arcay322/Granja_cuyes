// Este archivo nos permite extender tipos de librerías de terceros.

// Le decimos a TypeScript que queremos añadir propiedades al namespace global de Express.
declare namespace Express {
    // Extendemos la interfaz Request que viene con Express.
    export interface Request {
        // Añadimos una propiedad opcional 'user' al objeto Request.
        // Esto nos permitirá acceder a req.user de forma segura y con tipado.
        user?: {
            id: number;
            email: string;
            rol: string;
            // Puedes añadir cualquier otro campo que incluyas en el payload de tu JWT.
        };
    }
}
