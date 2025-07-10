import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener todas las camadas
export const getAllCamadas = async () => {
  return prisma.camada.findMany({
    orderBy: { fechaNacimiento: 'desc' }
  });
};

// Obtener camada por ID
export const getCamadaById = async (id: number) => {
  return prisma.camada.findUnique({
    where: { id },
    include: {
      cuyes: true
    }
  });
};

// Crear nueva camada y las crías correspondientes
export const createCamada = async (data: {
  fechaNacimiento: Date | string;
  numVivos: number;
  numMuertos: number;
  padreId: number | null;
  madreId: number | null;
}) => {
  // Asegurarse de que la fecha esté en formato correcto para la base de datos
  let fechaNacimiento = data.fechaNacimiento;
  if (typeof fechaNacimiento === 'string') {
    fechaNacimiento = new Date(fechaNacimiento);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Convertida fecha de camada string a Date: ${fechaNacimiento}`);
    }
  }

  // Obtener información de los padres para determinar raza y otros datos
  const madre = data.madreId ? await prisma.cuy.findUnique({
    where: { id: data.madreId },
    select: { raza: true, galpon: true, jaula: true }
  }) : null;

  const padre = data.padreId ? await prisma.cuy.findUnique({
    where: { id: data.padreId },
    select: { raza: true }
  }) : null;

  // Usar transacción para asegurar que tanto la camada como las crías se crean correctamente
  const result = await prisma.$transaction(async (tx) => {
    // Crear la camada
    const camada = await tx.camada.create({
      data: {
        fechaNacimiento,
        numVivos: data.numVivos,
        numMuertos: data.numMuertos,
        padreId: data.padreId,
        madreId: data.madreId
      }
    });

    // Crear las crías vivas como registros individuales de cuyes
    const crias = [];
    for (let i = 0; i < data.numVivos; i++) {
      const cria = await tx.cuy.create({
        data: {
          raza: madre?.raza || 'Mixta', // Usar raza de la madre o 'Mixta' por defecto
          fechaNacimiento,
          sexo: 'Indefinido', // Se puede actualizar después cuando se determine
          peso: 0.08, // Peso promedio de cría (80g)
          galpon: madre?.galpon || 'General',
          jaula: madre?.jaula || 'General',
          estado: 'Activo', // Estado general
          etapaVida: 'Cría', // Etapa específica de vida
          proposito: 'Indefinido', // Se definirá cuando crezca
          camadaId: camada.id,
          ultimaEvaluacion: new Date() // Marcar como evaluado
        }
      });
      crias.push(cria);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ Camada creada con ${data.numVivos} crías individuales`);
    }

    return { camada, crias };
  });

  return result.camada;
};

// Actualizar camada existente
export const updateCamada = async (
  id: number,
  data: {
    fechaNacimiento: Date | string;
    numVivos: number;
    numMuertos: number;
    padreId: number | null;
    madreId: number | null;
  }
) => {
  // Verificar si existe
  const exists = await prisma.camada.findUnique({ where: { id } });
  if (!exists) return null;

  // Asegurarse de que la fecha esté en formato correcto para la base de datos
  let fechaNacimiento = data.fechaNacimiento;
  if (typeof fechaNacimiento === 'string') {
    fechaNacimiento = new Date(fechaNacimiento);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Convertida fecha de actualización de camada string a Date: ${fechaNacimiento}`);
    }
  }

  // Crear el objeto con la fecha formateada
  const formattedData = {
    ...data,
    fechaNacimiento
  };

  if (process.env.NODE_ENV !== 'production') {
    console.log(`Actualizando camada #${id} con fecha: ${formattedData.fechaNacimiento}`);
  }

  return prisma.camada.update({
    where: { id },
    data: formattedData
  });
};

// Eliminar camada
export const deleteCamada = async (id: number) => {
  // Verificar si existe
  const exists = await prisma.camada.findUnique({ where: { id } });
  if (!exists) return null;

  // Actualizar los cuyes asociados para eliminar la referencia a la camada
  await prisma.cuy.updateMany({
    where: { camadaId: id },
    data: { camadaId: null }
  });

  // Eliminar la camada
  return prisma.camada.delete({
    where: { id }
  });
};
