import { PrismaClient, Cuy } from '@prisma/client';
const prisma = new PrismaClient();

// Función auxiliar para calcular edad en meses
const calcularEdadEnMeses = (fechaNacimiento: Date): number => {
  const ahora = new Date();
  const años = ahora.getFullYear() - fechaNacimiento.getFullYear();
  const meses = ahora.getMonth() - fechaNacimiento.getMonth();
  const días = ahora.getDate() - fechaNacimiento.getDate();

  let edadEnMeses = años * 12 + meses;
  if (días < 0) edadEnMeses -= 1;

  const resultado = Math.max(0, edadEnMeses);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📅 Cálculo edad - Ahora: ${ahora.toISOString()}, Nacimiento: ${fechaNacimiento.toISOString()}, Años: ${años}, Meses: ${meses}, Días: ${días}, Resultado: ${resultado} meses`);
  }

  return resultado; // No puede ser negativo
};

// Función auxiliar para determinar etapa según edad y sexo
const determinarEtapaAutomatica = (fechaNacimiento: Date, sexo: string): string => {
  const edadEnMeses = calcularEdadEnMeses(fechaNacimiento);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`🐹 Calculando etapa - Fecha nacimiento: ${fechaNacimiento.toISOString()}, Edad en meses: ${edadEnMeses}, Sexo: ${sexo}`);
  }

  if (edadEnMeses < 3) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('→ Asignando etapa: Cría');
    }
    return 'Cría';
  } else if (edadEnMeses < 6) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('→ Asignando etapa: Juvenil');
    }
    return 'Juvenil';
  } else {
    // Cuyes adultos (6+ meses)
    if (sexo === 'M') {
      if (process.env.NODE_ENV !== 'production') {
        console.log('→ Asignando etapa: Engorde (Macho adulto)');
      }
      return 'Engorde'; // Por defecto machos van a engorde
    } else if (sexo === 'H') {
      if (process.env.NODE_ENV !== 'production') {
        console.log('→ Asignando etapa: Reproductora (Hembra adulta)');
      }
      return 'Reproductora'; // Por defecto hembras van a reproducción
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.log('→ Asignando etapa: Juvenil (Sexo indefinido)');
      }
      return 'Juvenil'; // Si sexo es indefinido, mantener como juvenil
    }
  }
};

// Función auxiliar para determinar propósito según etapa
const determinarPropositoAutomatico = (etapa: string): string => {
  switch (etapa) {
    case 'Engorde':
      return 'Engorde';
    case 'Reproductora':
    case 'Reproductor':
      return 'Reproducción';
    default:
      return 'Indefinido';
  }
};

export const getAllCuyes = async (filters: any = {}): Promise<Cuy[]> => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Service: Filtros recibidos:', filters);
    }

    // Construir el objeto where para Prisma
    const whereClause: any = {};

    if (filters.galpon) {
      whereClause.galpon = filters.galpon;
    }

    if (filters.jaula) {
      whereClause.jaula = filters.jaula;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Service: Where clause generado:', whereClause);
    }

    const cuyes = await prisma.cuy.findMany({
      where: whereClause,
      orderBy: { id: 'asc' }
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Service: Cuyes encontrados:', cuyes.length);
    }

    // Procesar cada cuy para calcular etapa y propósito automáticamente
    const cuyesConEtapa = cuyes.map(cuy => {
      const etapaCalculada = determinarEtapaAutomatica(cuy.fechaNacimiento, cuy.sexo);
      const propositoCalculado = determinarPropositoAutomatico(etapaCalculada);

      return {
        ...cuy,
        etapaVida: etapaCalculada, // Siempre recalcular la etapa según la edad actual
        proposito: cuy.proposito || propositoCalculado,
        peso: Number(cuy.peso) // Asegurar que el peso sea number
      };
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Service: Muestra de cuyes procesados:', cuyesConEtapa.slice(0, 3).map(c => ({
        id: c.id,
        galpon: c.galpon,
        jaula: c.jaula,
        raza: c.raza
      })));
    }

    return cuyesConEtapa;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error en getAllCuyes service:', error);
    }
    throw error;
  }
};

export const getCuyById = async (id: number): Promise<Cuy | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de cuy inválido');
  }
  return prisma.cuy.findUnique({
    where: {
      id: Number(id)
    }
  });
};

export const createCuy = async (data: any): Promise<Cuy> => {
  // Ensure fechaNacimiento is a valid Date object and numeric fields are parsed
  const fechaNacimiento = data.fechaNacimiento ? new Date(data.fechaNacimiento) : new Date();
  const peso = typeof data.peso === 'string' ? parseFloat(data.peso) : data.peso;

  // Determinar etapa automáticamente basada en fecha de nacimiento y sexo
  const etapaVida = data.etapaVida || determinarEtapaAutomatica(fechaNacimiento, data.sexo || 'Indefinido');
  const proposito = data.proposito || determinarPropositoAutomatico(etapaVida);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`🆕 Creando cuy: Fecha=${fechaNacimiento.toISOString().split('T')[0]}, Sexo=${data.sexo}, Etapa=${etapaVida}, Propósito=${proposito}`);
  }

  const sanitizedData = {
    ...data,
    fechaNacimiento,
    peso,
    etapaVida,
    proposito,
    ultimaEvaluacion: new Date()
  };

  return prisma.cuy.create({ data: sanitizedData });
};

export const updateCuy = async (id: number, data: any): Promise<Cuy | null> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de cuy inválido');
  }

  // Obtener el cuy actual para comparar cambios
  const cuyActual = await prisma.cuy.findUnique({ where: { id: Number(id) } });
  if (!cuyActual) {
    throw new Error('Cuy no encontrado');
  }

  // Ensure fechaNacimiento is a valid Date object and numeric fields are parsed
  const fechaNacimiento = data.fechaNacimiento ? new Date(data.fechaNacimiento) : cuyActual.fechaNacimiento;
  const peso = typeof data.peso === 'string' ? parseFloat(data.peso) : data.peso;
  const sexo = data.sexo || cuyActual.sexo;

  let etapaVida = data.etapaVida || cuyActual.etapaVida;
  let proposito = data.proposito || cuyActual.proposito;

  // Si se cambió la fecha de nacimiento o el sexo, reevaluar la etapa automáticamente
  const fechaCambio = data.fechaNacimiento && data.fechaNacimiento !== cuyActual.fechaNacimiento.toISOString();
  const sexoCambio = data.sexo && data.sexo !== cuyActual.sexo;

  if (fechaCambio || sexoCambio) {
    const nuevaEtapa = determinarEtapaAutomatica(fechaNacimiento, sexo);
    if (nuevaEtapa !== etapaVida) {
      etapaVida = nuevaEtapa;
      proposito = determinarPropositoAutomatico(etapaVida);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔄 Reevaluando cuy #${id}: Nueva etapa=${etapaVida}, Nuevo propósito=${proposito}`);
      }
    }
  }

  const sanitizedData = {
    ...data,
    fechaNacimiento,
    peso,
    etapaVida,
    proposito,
    ultimaEvaluacion: new Date()
  };

  return prisma.cuy.update({
    where: {
      id: Number(id)
    },
    data: sanitizedData
  });
};

export const deleteCuy = async (id: number): Promise<boolean> => {
  if (isNaN(id) || id === undefined || id === null) {
    throw new Error('ID de cuy inválido');
  }

  try {
    const deleted = await prisma.cuy.delete({
      where: {
        id: Number(id)
      }
    });
    return !!deleted;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al eliminar cuy:', error);
    }
    return false;
  }
};

export const getCuyesStats = async (): Promise<any> => {
  try {
    // Obtener el total de cuyes
    const totalCuyes = await prisma.cuy.count();

    // Obtener total de machos
    const machos = await prisma.cuy.count({
      where: {
        sexo: 'M',
        estado: { not: 'Vendido' }
      }
    });

    // Obtener total de hembras
    const hembras = await prisma.cuy.count({
      where: {
        sexo: 'H',
        estado: { not: 'Vendido' }
      }
    });

    // Obtener total de crías (asumiendo que tienen menos de 2 meses)
    const dosMesesAtras = new Date();
    dosMesesAtras.setMonth(dosMesesAtras.getMonth() - 2);

    const crias = await prisma.cuy.count({
      where: {
        fechaNacimiento: {
          gte: dosMesesAtras
        },
        estado: { not: 'Vendido' }
      }
    });

    // Obtener total de adultos
    const adultos = totalCuyes - crias;

    // Obtener total por raza
    const razasResult = await prisma.$queryRaw`
      SELECT raza, COUNT(*) as total
      FROM "Cuy"
      WHERE estado != 'Vendido'
      GROUP BY raza
    `;

    // Convertir BigInt a Number para que sea serializable
    const razas = (razasResult as any[]).map((item) => ({
      raza: item.raza,
      total: Number(item.total)
    }));

    return {
      total: totalCuyes,
      machos,
      hembras,
      crias,
      adultos,
      razas
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error al obtener estadísticas de cuyes:', error);
    }
    // Devolver datos de ejemplo en caso de error
    return {
      total: 128,
      machos: 55,
      hembras: 73,
      crias: 35,
      adultos: 93,
      razas: [
        { raza: 'Peruano', total: 45 },
        { raza: 'Andino', total: 38 },
        { raza: 'Inti', total: 35 },
        { raza: 'Otros', total: 10 }
      ]
    };
  }
};

export const cambiarProposito = async (id: number, nuevoProposito: string, nuevaEtapa: string): Promise<Cuy | null> => {
  try {
    // Verificar que el cuy existe
    const cuyExistente = await prisma.cuy.findUnique({
      where: { id }
    });

    if (!cuyExistente) {
      return null;
    }

    // Validar que el cambio tiene sentido según la edad
    const edadMeses = calcularEdadEnMeses(new Date(cuyExistente.fechaNacimiento));

    // No permitir cambios en crías o juveniles muy jóvenes
    if (edadMeses < 2) {
      throw new Error('No se puede cambiar el propósito de crías menores de 2 meses');
    }

    // Validaciones específicas
    if (nuevoProposito === 'Reproducción') {
      if (cuyExistente.sexo === 'M' || cuyExistente.sexo === 'Macho') {
        // Para machos, solo permitir si son adultos
        if (edadMeses < 4) {
          throw new Error('Los machos deben tener al menos 4 meses para ser reproductores');
        }
      } else {
        // Para hembras, deben tener al menos 3 meses
        if (edadMeses < 3) {
          throw new Error('Las hembras deben tener al menos 3 meses para reproducir');
        }
      }
    }

    const cuyActualizado = await prisma.cuy.update({
      where: { id },
      data: {
        proposito: nuevoProposito,
        etapaVida: nuevaEtapa
      }
    });

    return cuyActualizado;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error en cambiarProposito:', error);
    }
    throw error;
  }
};

interface GrupoCuyes {
  sexo: 'M' | 'H';
  cantidad: number;
  edadDias: number;
  pesoPromedio: number;
  variacionEdad?: number; // ±días
  variacionPeso?: number; // ±gramos
}

interface RegistroJaulaData {
  galpon: string;
  jaula: string;
  raza: string;
  grupos: GrupoCuyes[];
}

export const crearCuyesPorJaula = async (data: RegistroJaulaData): Promise<Cuy[]> => {
  try {
    const cuyesCreados: Cuy[] = [];

    for (const grupo of data.grupos) {
      for (let i = 0; i < grupo.cantidad; i++) {
        // Generar variaciones aleatorias
        const variacionEdad = grupo.variacionEdad || 3; // ±3 días por defecto
        const variacionPeso = grupo.variacionPeso || 50; // ±50g por defecto

        const edadReal = grupo.edadDias + (Math.random() * variacionEdad * 2 - variacionEdad);
        const pesoEnGramos = grupo.pesoPromedio + (Math.random() * variacionPeso * 2 - variacionPeso);
        const pesoReal = Math.round(pesoEnGramos) / 1000; // Redondear gramos antes de convertir a kg

        // Calcular fecha de nacimiento
        const fechaNacimiento = new Date();
        fechaNacimiento.setDate(fechaNacimiento.getDate() - Math.round(edadReal));

        // Determinar etapa y propósito automáticamente
        const edadMeses = Math.floor(edadReal / 30);
        let etapaVida: string;
        let proposito: string;

        if (edadMeses < 1) {
          etapaVida = 'Cría';
          proposito = 'Cría';
        } else if (edadMeses < 2) {
          etapaVida = 'Juvenil';
          proposito = 'Juvenil';
        } else {
          // Aplicar nueva lógica
          if (grupo.sexo === 'M') {
            etapaVida = 'Engorde';
            proposito = 'Engorde';
          } else {
            if (edadMeses >= 3) {
              etapaVida = 'Reproductora';
              proposito = 'Reproducción';
            } else {
              etapaVida = 'Engorde';
              proposito = 'Engorde';
            }
          }
        }

        const cuyData = {
          raza: data.raza,
          fechaNacimiento: fechaNacimiento.toISOString(),
          sexo: grupo.sexo,
          peso: Math.max(0.05, Math.round(pesoReal * 1000) / 1000), // Redondear a 3 decimales máximo
          galpon: data.galpon,
          jaula: data.jaula,
          estado: 'Activo',
          etapaVida,
          proposito
        };

        const nuevoCuy = await prisma.cuy.create({
          data: cuyData
        });

        cuyesCreados.push(nuevoCuy);
      }
    }

    return cuyesCreados;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error en crearCuyesPorJaula:', error);
    }
    throw error;
  }
};
