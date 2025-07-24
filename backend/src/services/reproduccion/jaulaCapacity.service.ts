import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Verifica si hay espacio suficiente en la jaula de la madre para registrar una camada y sus crías.
 * @param galpon string
 * @param jaula string
 * @param cantidadAgregar número total de cuyes a agregar (madre + crías)
 * @param capacidadMaxima capacidad máxima de la jaula (si no se provee, se asume 10)
 * @returns { ok: boolean, totalCuyes: number, capacidad: number, faltantes: number }
 */
export async function verificarEspacioEnJaula(galpon: string, jaula: string, cantidadAgregar: number, capacidadMaxima?: number) {
  // Contar cuyes actuales en la jaula
  const totalCuyes = await prisma.cuy.count({
    where: { galpon, jaula }
  });
  // Capacidad máxima: si no se provee, usar 10 por defecto
  const capacidad = capacidadMaxima || 10;
  const faltantes = capacidad - totalCuyes;
  const ok = (totalCuyes + cantidadAgregar) <= capacidad;
  return { ok, totalCuyes, capacidad, faltantes };
}
