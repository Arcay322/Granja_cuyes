// filepath: c:\Users\Arcay\Desktop\cuyesgpt\backend\src\controllers\crud.factory.ts
import { PrismaClient } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';

// Define un tipo para los modelos de Prisma para asegurar que solo se usen nombres de modelos válidos.
type PrismaModel = keyof Omit<
    PrismaClient,
    | '$connect'
    | '$disconnect'
    | '$executeRaw'
    | '$executeRawUnsafe'
    | '$queryRaw'
    | '$queryRawUnsafe'
    | '$transaction'
    | '$on'
    | '$use'
>;

export const createCrudHandlers = (modelName: PrismaModel) => {
    const prisma = new PrismaClient();
    // Usamos 'any' aquí porque TypeScript no puede garantizar dinámicamente
    // que los métodos (findMany, findUnique, etc.) existen en el modelo seleccionado.
    // La validación se hace a través del tipo PrismaModel.
    const model = prisma[modelName] as any;

    return {
        /**
         * Obtiene todos los registros de un modelo, con paginación.
         * Query params: ?page=1&limit=10
         */
        getAll: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const page = parseInt(req.query.page as string) || 1;
                const limit = parseInt(req.query.limit as string) || 10;
                const skip = (page - 1) * limit;

                const [records, total] = await prisma.$transaction([
                    model.findMany({ skip, take: limit }),
                    model.count(),
                ]);

                res.json({
                    data: records,
                    total,
                    page,
                    totalPages: Math.ceil(total / limit),
                });
            } catch (error) {
                next(error);
            }
        },

        /**
         * Obtiene un registro por su ID.
         */
        getById: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const id = parseInt(req.params.id);
                if (isNaN(id)) {
                    return res.status(400).json({ message: 'El ID debe ser un número válido.' });
                }
                const record = await model.findUnique({ where: { id } });
                if (!record) {
                    return res.status(404).json({ message: `${String(modelName)} con ID ${id} no encontrado.` });
                }
                res.json(record);
            } catch (error) {
                next(error);
            }
        },

        /**
         * Crea un nuevo registro.
         */
        create: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const newRecord = await model.create({ data: req.body });
                res.status(201).json(newRecord);
            } catch (error) {
                next(error);
            }
        },

        /**
         * Actualiza un registro existente por su ID.
         */
        update: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const id = parseInt(req.params.id);
                if (isNaN(id)) {
                    return res.status(400).json({ message: 'El ID debe ser un número válido.' });
                }
                const updatedRecord = await model.update({
                    where: { id },
                    data: req.body,
                });
                res.json(updatedRecord);
            } catch (error) {
                next(error);
            }
        },

        /**
         * Elimina un registro por su ID.
         */
        delete: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const id = parseInt(req.params.id);
                if (isNaN(id)) {
                    return res.status(400).json({ message: 'El ID debe ser un número válido.' });
                }
                await model.delete({ where: { id } });
                res.status(204).send();
            } catch (error) {
                next(error);
            }
        },
    };
};
