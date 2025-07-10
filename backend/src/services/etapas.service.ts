import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tipos de etapas de vida
export enum EtapaVida {
  CRIA = 'Cría',
  JUVENIL = 'Juvenil',
  ENGORDE = 'Engorde',
  REPRODUCTOR = 'Reproductor',
  REPRODUCTORA = 'Reproductora',
  GESTANTE = 'Gestante',
  LACTANTE = 'Lactante',
  RETIRADO = 'Retirado'
}

// Tipos de propósito
export enum Proposito {
  ENGORDE = 'Engorde',
  REPRODUCCION = 'Reproducción',
  VENTA = 'Venta',
  INDEFINIDO = 'Indefinido'
}

// Configuración de edades en meses para transiciones
const EDAD_JUVENIL = 3;
const EDAD_ADULTO = 6;
const EDAD_REPRODUCTOR_MACHO = 8;

// Calcular edad en meses
const calcularEdadEnMeses = (fechaNacimiento: Date): number => {
  const ahora = new Date();
  const años = ahora.getFullYear() - fechaNacimiento.getFullYear();
  const meses = ahora.getMonth() - fechaNacimiento.getMonth();
  const días = ahora.getDate() - fechaNacimiento.getDate();

  let edadEnMeses = años * 12 + meses;
  if (días < 0) edadEnMeses -= 1;

  return edadEnMeses;
};

// Determinar etapa según edad, sexo y propósito
const determinarEtapaSugerida = (
  edadEnMeses: number,
  sexo: string,
  proposito: string,
  etapaActual: string
): string => {

  // Si está en estados especiales, mantener
  if (['Gestante', 'Lactante', 'Enfermo', 'Vendido', 'Fallecido', 'Retirado'].includes(etapaActual)) {
    return etapaActual;
  }

  // Reglas por edad
  if (edadEnMeses < EDAD_JUVENIL) {
    return EtapaVida.CRIA;
  }

  if (edadEnMeses < EDAD_ADULTO) {
    return EtapaVida.JUVENIL;
  }

  // Adultos: decidir según sexo y propósito
  if (sexo === 'M') {
    if (proposito === Proposito.REPRODUCCION) {
      return edadEnMeses >= EDAD_REPRODUCTOR_MACHO ? EtapaVida.REPRODUCTOR : EtapaVida.JUVENIL;
    } else {
      return EtapaVida.ENGORDE;
    }
  } else if (sexo === 'H') {
    if (proposito === Proposito.REPRODUCCION) {
      return EtapaVida.REPRODUCTORA;
    } else {
      return EtapaVida.ENGORDE;
    }
  }

  return EtapaVida.JUVENIL;
};

// Evaluar cuyes que necesitan transición de etapa
export const evaluarTransicionesAutomaticas = async () => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 Iniciando evaluación de transiciones de etapa...');
    }

    // Obtener cuyes activos que no han sido evaluados recientemente
    const cuyesParaEvaluar = await prisma.cuy.findMany({
      where: {
        estado: {
          notIn: ['Vendido', 'Fallecido']
        },
        OR: [
          { ultimaEvaluacion: null },
          {
            ultimaEvaluacion: {
              lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Hace más de 24 horas
            }
          }
        ]
      }
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`📋 Evaluando ${cuyesParaEvaluar.length} cuyes...`);
    }

    const transiciones = [];

    for (const cuy of cuyesParaEvaluar) {
      const edadEnMeses = calcularEdadEnMeses(cuy.fechaNacimiento);
      const etapaSugerida = determinarEtapaSugerida(
        edadEnMeses,
        cuy.sexo,
        cuy.proposito,
        cuy.etapaVida
      );

      if (etapaSugerida !== cuy.etapaVida) {
        transiciones.push({
          id: cuy.id,
          etapaActual: cuy.etapaVida,
          etapaSugerida,
          edadEnMeses: edadEnMeses.toFixed(1),
          sexo: cuy.sexo,
          proposito: cuy.proposito
        });
      }

      // Actualizar última evaluación
      await prisma.cuy.update({
        where: { id: cuy.id },
        data: { ultimaEvaluacion: new Date() }
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔄 ${transiciones.length} cuyes necesitan transición de etapa:`);
      transiciones.forEach(t => {
        console.log(`   CUY #${t.id}: ${t.etapaActual} → ${t.etapaSugerida} (${t.edadEnMeses} meses, ${t.sexo}, ${t.proposito})`);
      });
    }

    return transiciones;

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ Error al evaluar transiciones:', error);
    }
    throw error;
  }
};

// Aplicar transición de etapa manualmente
export const aplicarTransicionEtapa = async (cuyId: number, nuevaEtapa: string, motivo?: string) => {
  try {
    const cuy = await prisma.cuy.findUnique({
      where: { id: cuyId }
    });

    if (!cuy) {
      throw new Error('Cuy no encontrado');
    }

    const etapaAnterior = cuy.etapaVida;

    await prisma.cuy.update({
      where: { id: cuyId },
      data: {
        etapaVida: nuevaEtapa,
        ultimaEvaluacion: new Date()
      }
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ CUY #${cuyId}: ${etapaAnterior} → ${nuevaEtapa}`);
      if (motivo) console.log(`   Motivo: ${motivo}`);
    }

    return { etapaAnterior, nuevaEtapa };

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ Error al aplicar transición:', error);
    }
    throw error;
  }
};

// Obtener estadísticas de etapas
export const obtenerEstadisticasEtapas = async () => {
  try {
    const estadisticas = await prisma.cuy.groupBy({
      by: ['etapaVida'],
      _count: {
        id: true
      },
      where: {
        estado: {
          notIn: ['Vendido', 'Fallecido']
        }
      }
    });

    return estadisticas.map(stat => ({
      etapa: stat.etapaVida,
      cantidad: stat._count.id
    }));

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ Error al obtener estadísticas:', error);
    }
    throw error;
  }
};

// Obtener cuyes próximos a transición
export const obtenerProximasTransiciones = async (diasAnticipacion: number = 7) => {
  try {
    const cuyes = await prisma.cuy.findMany({
      where: {
        estado: {
          notIn: ['Vendido', 'Fallecido']
        }
      }
    });

    const proximasTransiciones = [];

    for (const cuy of cuyes) {
      const edadEnMeses = calcularEdadEnMeses(cuy.fechaNacimiento);

      // Verificar si está próximo a alguna transición importante
      let proximaTransicion = null;
      let diasParaTransicion = null;

      if (cuy.etapaVida === EtapaVida.CRIA && edadEnMeses >= (EDAD_JUVENIL - 0.5)) {
        proximaTransicion = EtapaVida.JUVENIL;
        diasParaTransicion = (EDAD_JUVENIL - edadEnMeses) * 30;
      } else if (cuy.etapaVida === EtapaVida.JUVENIL && edadEnMeses >= (EDAD_ADULTO - 0.5)) {
        proximaTransicion = cuy.sexo === 'M' ? EtapaVida.ENGORDE : EtapaVida.REPRODUCTORA;
        diasParaTransicion = (EDAD_ADULTO - edadEnMeses) * 30;
      }

      if (proximaTransicion && diasParaTransicion !== null && diasParaTransicion <= diasAnticipacion) {
        proximasTransiciones.push({
          id: cuy.id,
          raza: cuy.raza,
          sexo: cuy.sexo,
          etapaActual: cuy.etapaVida,
          proximaTransicion,
          diasParaTransicion: Math.ceil(diasParaTransicion),
          edadEnMeses: edadEnMeses.toFixed(1)
        });
      }
    }

    return proximasTransiciones;

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ Error al obtener próximas transiciones:', error);
    }
    throw error;
  }
};

// Actualizar propósito de un cuy
export const actualizarProposito = async (cuyId: number, nuevoProposito: string) => {
  try {
    const cuy = await prisma.cuy.update({
      where: { id: cuyId },
      data: { proposito: nuevoProposito }
    });

    // Reevaluar etapa después de cambiar propósito
    const edadEnMeses = calcularEdadEnMeses(cuy.fechaNacimiento);
    const nuevaEtapa = determinarEtapaSugerida(
      edadEnMeses,
      cuy.sexo,
      nuevoProposito,
      cuy.etapaVida
    );

    if (nuevaEtapa !== cuy.etapaVida) {
      await aplicarTransicionEtapa(cuyId, nuevaEtapa, `Cambio de propósito a ${nuevoProposito}`);
    }

    return cuy;

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ Error al actualizar propósito:', error);
    }
    throw error;
  }
};
