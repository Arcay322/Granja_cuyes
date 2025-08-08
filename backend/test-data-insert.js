const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertTestData() {
  try {
    console.log('🔄 Insertando datos de prueba...');

    // Crear clientes de prueba
    const cliente1 = await prisma.cliente.upsert({
      where: { id: 1 },
      update: {},
      create: {
        nombre: 'Juan Pérez',
        contacto: 'juan@email.com',
        direccion: 'Av. Principal 123',
        telefono: '987654321'
      }
    });

    const cliente2 = await prisma.cliente.upsert({
      where: { id: 2 },
      update: {},
      create: {
        nombre: 'María García',
        contacto: 'maria@email.com', 
        direccion: 'Calle Secundaria 456',
        telefono: '123456789'
      }
    });

    const cliente3 = await prisma.cliente.upsert({
      where: { id: 3 },
      update: {},
      create: {
        nombre: 'Carlos López',
        contacto: 'carlos@email.com',
        direccion: 'Jr. Los Andes 789',
        telefono: '555666777'
      }
    });

    console.log('✅ Clientes creados');

    // Crear algunos cuyes de prueba para las ventas
    const cuyes = [];
    for (let i = 1; i <= 10; i++) {
      const cuy = await prisma.cuy.upsert({
        where: { id: i },
        update: {},
        create: {
          raza: i % 2 === 0 ? 'Perú' : 'Andina',
          fechaNacimiento: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          sexo: i % 2 === 0 ? 'Macho' : 'Hembra',
          peso: 0.8 + Math.random() * 0.7, // Entre 0.8 y 1.5 kg
          galpon: `Galpon-${Math.floor(i / 3) + 1}`,
          jaula: `Jaula-${i}`,
          estado: 'Activo',
          etapaVida: 'Adulto',
          proposito: 'Venta'
        }
      });
      cuyes.push(cuy);
    }

    console.log('✅ Cuyes creados');

    // Crear ventas de prueba
    const ventas = [
      {
        fecha: new Date('2025-01-15'),
        clienteId: cliente1.id,
        total: 180.00,
        estadoPago: 'Pagado',
        detalles: [
          { cuyId: cuyes[0].id, peso: cuyes[0].peso, precioUnitario: 60.00 },
          { cuyId: cuyes[1].id, peso: cuyes[1].peso, precioUnitario: 60.00 },
          { cuyId: cuyes[2].id, peso: cuyes[2].peso, precioUnitario: 60.00 }
        ]
      },
      {
        fecha: new Date('2025-02-10'),
        clienteId: cliente2.id,
        total: 240.00,
        estadoPago: 'Pagado',
        detalles: [
          { cuyId: cuyes[3].id, peso: cuyes[3].peso, precioUnitario: 80.00 },
          { cuyId: cuyes[4].id, peso: cuyes[4].peso, precioUnitario: 80.00 },
          { cuyId: cuyes[5].id, peso: cuyes[5].peso, precioUnitario: 80.00 }
        ]
      },
      {
        fecha: new Date('2025-03-05'),
        clienteId: cliente3.id,
        total: 350.00,
        estadoPago: 'Pagado',
        detalles: [
          { cuyId: cuyes[6].id, peso: cuyes[6].peso, precioUnitario: 70.00 },
          { cuyId: cuyes[7].id, peso: cuyes[7].peso, precioUnitario: 70.00 },
          { cuyId: cuyes[8].id, peso: cuyes[8].peso, precioUnitario: 70.00 },
          { cuyId: cuyes[9].id, peso: cuyes[9].peso, precioUnitario: 70.00 },
          { cuyId: cuyes[0].id, peso: cuyes[0].peso, precioUnitario: 70.00 } // Reutilizar un cuy
        ]
      },
      {
        fecha: new Date('2025-04-20'),
        clienteId: cliente1.id,
        total: 420.00,
        estadoPago: 'Pendiente',
        detalles: [
          { cuyId: cuyes[1].id, peso: cuyes[1].peso, precioUnitario: 84.00 },
          { cuyId: cuyes[2].id, peso: cuyes[2].peso, precioUnitario: 84.00 },
          { cuyId: cuyes[3].id, peso: cuyes[3].peso, precioUnitario: 84.00 },
          { cuyId: cuyes[4].id, peso: cuyes[4].peso, precioUnitario: 84.00 },
          { cuyId: cuyes[5].id, peso: cuyes[5].peso, precioUnitario: 84.00 }
        ]
      },
      {
        fecha: new Date('2025-05-12'),
        clienteId: cliente2.id,
        total: 300.00,
        estadoPago: 'Pagado',
        detalles: [
          { cuyId: cuyes[6].id, peso: cuyes[6].peso, precioUnitario: 75.00 },
          { cuyId: cuyes[7].id, peso: cuyes[7].peso, precioUnitario: 75.00 },
          { cuyId: cuyes[8].id, peso: cuyes[8].peso, precioUnitario: 75.00 },
          { cuyId: cuyes[9].id, peso: cuyes[9].peso, precioUnitario: 75.00 }
        ]
      }
    ];

    for (const ventaData of ventas) {
      const venta = await prisma.venta.create({
        data: {
          fecha: ventaData.fecha,
          clienteId: ventaData.clienteId,
          total: ventaData.total,
          estadoPago: ventaData.estadoPago,
          detalles: {
            create: ventaData.detalles
          }
        }
      });
      console.log(`✅ Venta creada: ${venta.total} soles el ${venta.fecha.toLocaleDateString()}`);
    }

    // Crear gastos de prueba
    const gastos = [
      {
        concepto: 'Compra de alimento balanceado',
        fecha: new Date('2025-01-05'),
        monto: 250.00,
        categoria: 'Alimentación'
      },
      {
        concepto: 'Medicamentos y vitaminas',
        fecha: new Date('2025-01-20'),
        monto: 180.00,
        categoria: 'Salud'
      },
      {
        concepto: 'Reparación de jaulas',
        fecha: new Date('2025-02-03'),
        monto: 120.00,
        categoria: 'Mantenimiento'
      },
      {
        concepto: 'Compra de forraje',
        fecha: new Date('2025-02-15'),
        monto: 80.00,
        categoria: 'Alimentación'
      },
      {
        concepto: 'Consulta veterinaria',
        fecha: new Date('2025-03-01'),
        monto: 150.00,
        categoria: 'Salud'
      },
      {
        concepto: 'Materiales de limpieza',
        fecha: new Date('2025-03-10'),
        monto: 45.00,
        categoria: 'Mantenimiento'
      },
      {
        concepto: 'Suplementos nutricionales',
        fecha: new Date('2025-04-05'),
        monto: 200.00,
        categoria: 'Alimentación'
      },
      {
        concepto: 'Vacunas',
        fecha: new Date('2025-04-18'),
        monto: 300.00,
        categoria: 'Salud'
      },
      {
        concepto: 'Herramientas de trabajo',
        fecha: new Date('2025-05-02'),
        monto: 95.00,
        categoria: 'Equipamiento'
      },
      {
        concepto: 'Alimento concentrado premium',
        fecha: new Date('2025-05-20'),
        monto: 320.00,
        categoria: 'Alimentación'
      }
    ];

    for (const gastoData of gastos) {
      const gasto = await prisma.gasto.create({
        data: gastoData
      });
      console.log(`✅ Gasto creado: ${gasto.concepto} - ${gasto.monto} soles`);
    }

    console.log('\n📊 RESUMEN DE DATOS INSERTADOS:');
    console.log(`👥 Clientes: 3`);
    console.log(`🐹 Cuyes: 10`);
    console.log(`💰 Ventas: ${ventas.length}`);
    console.log(`💸 Gastos: ${gastos.length}`);
    
    const totalIngresos = ventas.reduce((sum, v) => sum + v.total, 0);
    const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
    const ganancia = totalIngresos - totalGastos;
    
    console.log(`\n💵 TOTALES FINANCIEROS:`);
    console.log(`📈 Total Ingresos: S/ ${totalIngresos.toFixed(2)}`);
    console.log(`📉 Total Gastos: S/ ${totalGastos.toFixed(2)}`);
    console.log(`💰 Ganancia Neta: S/ ${ganancia.toFixed(2)}`);
    console.log(`📊 Margen: ${((ganancia / totalIngresos) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Error insertando datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertTestData();