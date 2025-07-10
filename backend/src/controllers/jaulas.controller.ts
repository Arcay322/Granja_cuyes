import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Obtener todas las jaulas
export const getJaulas = async (req: Request, res: Response) => {
    try {
        const cuyes = await prisma.cuy.findMany({
            select: {
                galpon: true,
                jaula: true,
                raza: true,
                sexo: true,
                id: true
            }
        });

        // Agrupar por jaula
        const jaulasMap = new Map();

        cuyes.forEach(cuy => {
            const key = `${cuy.galpon}-${cuy.jaula}`;
            if (!jaulasMap.has(key)) {
                jaulasMap.set(key, {
                    jaula: cuy.jaula,
                    galpon: cuy.galpon,
                    totalCuyes: 0,
                    cuyesPorSexo: { machos: 0, hembras: 0 },
                    razas: new Set(),
                    edadPromedio: 0
                });
            }

            const jaulaData = jaulasMap.get(key);
            jaulaData.totalCuyes++;

            if (cuy.sexo === 'M') jaulaData.cuyesPorSexo.machos++;
            if (cuy.sexo === 'H') jaulaData.cuyesPorSexo.hembras++;

            jaulaData.razas.add(cuy.raza);
        });

        // Convertir a array
        const jaulas = Array.from(jaulasMap.values()).map(jaula => ({
            ...jaula,
            razas: Array.from(jaula.razas)
        }));

        res.json(jaulas);
    } catch (error) {
        console.error('Error al obtener jaulas:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Obtener una jaula específica
export const getJaula = async (req: Request, res: Response) => {
    try {
        const { galpon, jaula } = req.params;

        const cuyes = await prisma.cuy.findMany({
            where: {
                galpon,
                jaula
            },
            select: {
                galpon: true,
                jaula: true,
                raza: true,
                sexo: true,
                fechaNacimiento: true,
                id: true
            }
        });

        if (cuyes.length === 0) {
            return res.status(404).json({ message: 'Jaula no encontrada' });
        }

        const razas = new Set();
        let machos = 0;
        let hembras = 0;

        cuyes.forEach(cuy => {
            if (cuy.sexo === 'M') machos++;
            if (cuy.sexo === 'H') hembras++;
            razas.add(cuy.raza);
        });

        const jaulaData = {
            jaula,
            galpon,
            totalCuyes: cuyes.length,
            cuyesPorSexo: { machos, hembras },
            razas: Array.from(razas),
            edadPromedio: 0 // Se podría calcular si se necesita
        };

        res.json(jaulaData);
    } catch (error) {
        console.error('Error al obtener jaula:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Crear nueva jaula (solo valida que no exista)
export const createJaula = async (req: Request, res: Response) => {
    try {
        const { codigo, galpon, descripcion, capacidadMaxima, tipo, estado } = req.body;

        if (!codigo || !galpon) {
            return res.status(400).json({ message: 'El código de jaula y galpón son obligatorios' });
        }

        // Verificar que no exista una jaula con el mismo código en el mismo galpón
        const existingCuyes = await prisma.cuy.findFirst({
            where: {
                galpon,
                jaula: codigo
            }
        });

        if (existingCuyes) {
            return res.status(400).json({ message: 'Ya existe una jaula con ese código en el galpón' });
        }

        // Simular creación (no hay tabla específica para jaulas)
        const jaulaData = {
            jaula: codigo,
            galpon,
            descripcion,
            capacidadMaxima: capacidadMaxima || 20,
            tipo: tipo || 'Standard',
            estado: estado || 'Disponible',
            totalCuyes: 0,
            cuyesPorSexo: { machos: 0, hembras: 0 },
            razas: [],
            edadPromedio: 0
        };

        res.status(201).json(jaulaData);
    } catch (error) {
        console.error('Error al crear jaula:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Actualizar jaula (actualiza todos los cuyes de la jaula si se cambia el código)
export const updateJaula = async (req: Request, res: Response) => {
    try {
        const { galpon, jaula: currentCode } = req.params;
        const { codigo, descripcion, capacidadMaxima, tipo, estado } = req.body;

        if (!codigo) {
            return res.status(400).json({ message: 'El código de jaula es obligatorio' });
        }

        // Si se cambió el código, actualizar todos los cuyes
        if (codigo !== currentCode) {
            // Verificar que el nuevo código no exista en el mismo galpón
            const existingCuyes = await prisma.cuy.findFirst({
                where: {
                    galpon,
                    jaula: codigo
                }
            });

            if (existingCuyes) {
                return res.status(400).json({ message: 'Ya existe una jaula con ese código en el galpón' });
            }

            // Actualizar código en todos los cuyes
            await prisma.cuy.updateMany({
                where: {
                    galpon,
                    jaula: currentCode
                },
                data: { jaula: codigo }
            });
        }

        const updatedJaula = {
            jaula: codigo,
            galpon,
            descripcion,
            capacidadMaxima: capacidadMaxima || 20,
            tipo: tipo || 'Standard',
            estado: estado || 'Disponible'
        };

        res.json(updatedJaula);
    } catch (error) {
        console.error('Error al actualizar jaula:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Eliminar jaula (elimina todos los cuyes de la jaula)
export const deleteJaula = async (req: Request, res: Response) => {
    try {
        const { galpon, jaula } = req.params;

        // Verificar que la jaula existe
        const cuyesCount = await prisma.cuy.count({
            where: {
                galpon,
                jaula
            }
        });

        if (cuyesCount === 0) {
            return res.status(404).json({ message: 'Jaula no encontrada' });
        }

        // Eliminar todos los cuyes de la jaula
        await prisma.cuy.deleteMany({
            where: {
                galpon,
                jaula
            }
        });

        res.json({ message: `Jaula ${jaula} del galpón ${galpon} eliminada exitosamente junto con ${cuyesCount} cuyes` });
    } catch (error) {
        console.error('Error al eliminar jaula:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
