import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función auxiliar para calcular edad en meses
const calcularEdadEnMeses = (fechaNacimiento: Date): number => {
  const ahora = new Date();
  const años = ahora.getFullYear() - fechaNacimiento.getFullYear();
  const meses = ahora.getMonth() - fechaNacimiento.getMonth();
  const días = ahora.getDate() - fechaNacimiento.getDate();
  
  let edadEnMeses = años * 12 + meses;
  if (días < 0) edadEnMeses -= 1;
  
  return Math.max(0, edadEnMeses);
};

export const debugEtapas = async (req: Request, res: Response) => {
  try {
    const cuyes = await prisma.cuy.findMany({
      where: {
        estado: {
          notIn: ['Vendido', 'Fallecido']
        }
      },
      orderBy: { id: 'asc' }
    });

    const debug = cuyes.map(cuy => {
      const edadEnMeses = calcularEdadEnMeses(cuy.fechaNacimiento);
      return {
        id: cuy.id,
        fechaNacimiento: cuy.fechaNacimiento.toISOString().split('T')[0],
        edadEnMeses: edadEnMeses.toFixed(1),
        sexo: cuy.sexo,
        etapaVida: cuy.etapaVida,
        proposito: cuy.proposito,
        estado: cuy.estado
      };
    });

    res.json({
      message: 'Debug de etapas de vida',
      total: cuyes.length,
      cuyes: debug,
      resumenPorEtapa: await prisma.cuy.groupBy({
        by: ['etapaVida'],
        _count: { id: true },
        where: {
          estado: { notIn: ['Vendido', 'Fallecido'] }
        }
      })
    });
  } catch (error) {
    console.error('Error en debug:', error);
    res.status(500).json({ error: 'Error al obtener debug' });
  }
};
