import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getMetrics = async () => {
  // Total de cuyes activos
  const totalCuyes = await prisma.cuy.count({
    where: {
      estado: 'activo',
    },
  });

  // Total de ventas del mes actual
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  const ventas = await prisma.venta.findMany({
    where: {
      fecha: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth,
      },
    },
  });
  
  const totalVentas = ventas.reduce((sum, venta) => sum + Number(venta.total), 0);

  // Total de gastos del mes actual
  const gastos = await prisma.gasto.findMany({
    where: {
      fecha: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth,
      },
    },
  });
  
  const totalGastos = gastos.reduce((sum, gasto) => sum + Number(gasto.monto), 0);

  // Cálculo aproximado del valor del inventario
  const cuyesActivos = await prisma.cuy.findMany({
    where: {
      estado: 'activo',
    },
    select: {
      peso: true,
    },
  });
  
  // Asumimos un precio promedio por kg
  const precioPorKg = 25; // Precio en PEN
  const inventarioValor = cuyesActivos.reduce((sum, cuy) => sum + (Number(cuy.peso) * precioPorKg), 0);

  // Rentabilidad (Ventas - Gastos) / Gastos * 100
  const rentabilidad = totalGastos > 0 ? ((totalVentas - totalGastos) / totalGastos) * 100 : 0;

  return {
    totalCuyes,
    totalVentas,
    totalGastos,
    inventarioValor,
    rentabilidad,
  };
};

export const getPopulationGrowth = async () => {
  // Obtenemos datos para los últimos 6 meses
  const months = 6;
  const currentDate = new Date();
  const data = [];

  for (let i = 0; i < months; i++) {
    const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    // Nacimientos en este mes
    const nacimientos = await prisma.cuy.count({
      where: {
        fechaNacimiento: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Fallecimientos en este mes
    const fallecimientos = await prisma.cuy.count({
      where: {
        fechaFallecimiento: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Total de cuyes al final del mes
    const total = await prisma.cuy.count({
      where: {
        OR: [
          {
            fechaNacimiento: {
              lte: endOfMonth,
            },
            fechaFallecimiento: null,
            fechaVenta: null,
          },
          {
            fechaNacimiento: {
              lte: endOfMonth,
            },
            fechaFallecimiento: {
              gt: endOfMonth,
            },
            fechaVenta: null,
          },
          {
            fechaNacimiento: {
              lte: endOfMonth,
            },
            fechaFallecimiento: null,
            fechaVenta: {
              gt: endOfMonth,
            },
          },
        ],
      },
    });

    const monthName = startOfMonth.toLocaleDateString('es-ES', { month: 'short' });
    
    data.unshift({
      mes: monthName,
      nacimientos,
      fallecimientos,
      total,
    });
  }

  return data;
};

export const getVentasStats = async () => {
  // Ventas de los últimos 6 meses
  const months = 6;
  const currentDate = new Date();
  const data = [];

  for (let i = 0; i < months; i++) {
    const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const ventas = await prisma.venta.findMany({
      where: {
        fecha: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        detalles: true,
      },
    });

    const monto = ventas.reduce((sum, venta) => sum + Number(venta.total), 0);
    const unidades = ventas.reduce((sum, venta) => sum + venta.detalles.length, 0);

    const monthName = startOfMonth.toLocaleDateString('es-ES', { month: 'short' });
    
    data.unshift({
      mes: monthName,
      monto,
      unidades,
    });
  }

  return data;
};

export const getGastosStats = async () => {
  // Gastos por categoría en el último mes
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const gastos = await prisma.gasto.findMany({
    where: {
      fecha: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth,
      },
    },
  });

  // Agrupar por categoría
  const categorias: Record<string, number> = {};
  gastos.forEach((gasto) => {
    if (!categorias[gasto.categoria]) {
      categorias[gasto.categoria] = 0;
    }
    categorias[gasto.categoria] += Number(gasto.monto);
  });

  const data = Object.keys(categorias).map((categoria) => ({
    name: categoria,
    valor: categorias[categoria],
  }));

  return data;
};

export const getProductivityStats = async () => {
  // Productividad por galpón en los últimos 3 meses
  const currentDate = new Date();
  const threeMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1);

  // Obtener todos los galpones
  const cuyes = await prisma.cuy.findMany({
    select: {
      galpon: true,
    },
    distinct: ['galpon'],
  });

  const galpones = cuyes.map((cuy) => cuy.galpon);

  // Calcular estadísticas por galpón
  const data = [];

  for (const galpon of galpones) {
    // Nacimientos en este galpón
    const nacimientos = await prisma.cuy.count({
      where: {
        galpon,
        fechaNacimiento: {
          gte: threeMonthsAgo,
        },
      },
    });

    // Camadas en este galpón (si tenemos camadaId)
    const camadasSet = new Set();
    const cuyesEnGalpon = await prisma.cuy.findMany({
      where: {
        galpon,
        camadaId: {
          not: null,
        },
        fechaNacimiento: {
          gte: threeMonthsAgo,
        },
      },
      select: {
        camadaId: true,
      },
    });

    cuyesEnGalpon.forEach((cuy) => {
      if (cuy.camadaId) camadasSet.add(cuy.camadaId);
    });

    data.push({
      galpon,
      nacimientos,
      camadas: camadasSet.size,
    });
  }

  return data;
};
