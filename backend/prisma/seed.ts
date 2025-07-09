import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed process...');

  // Limpiar datos existentes (opcional)
  console.log('Limpiando datos existentes...');
  try {
    await prisma.historialSalud.deleteMany({});
    await prisma.consumoAlimento.deleteMany({});
    await prisma.ventaDetalle.deleteMany({});
    await prisma.venta.deleteMany({});
    await prisma.cuy.deleteMany({});
    await prisma.camada.deleteMany({});
    await prisma.alimento.deleteMany({});
    await prisma.proveedor.deleteMany({});
    await prisma.cliente.deleteMany({});
    await prisma.gasto.deleteMany({});
    console.log('Datos existentes eliminados correctamente');
  } catch (error) {
    console.error('Error al limpiar datos:', error);
  }

  // Crear proveedores
  const proveedor1 = await prisma.proveedor.create({
    data: {
      nombre: 'Agropecuaria Los Andes',
      contacto: '987654321',
    },
  });

  const proveedor2 = await prisma.proveedor.create({
    data: {
      nombre: 'Nutrición Animal S.A.',
      contacto: '976543210',
    },
  });

  console.log('Proveedores creados:', proveedor1, proveedor2);

  // Crear alimentos
  const alimento1 = await prisma.alimento.create({
    data: {
      nombre: 'Alfalfa',
      descripcion: 'Forraje fresco rico en proteínas',
      unidad: 'kg',
      proveedorId: proveedor1.id,
      stock: 100,
      costoUnitario: 2.5,
    },
  });

  const alimento2 = await prisma.alimento.create({
    data: {
      nombre: 'Concentrado',
      descripcion: 'Alimento balanceado para cuyes',
      unidad: 'kg',
      proveedorId: proveedor2.id,
      stock: 50,
      costoUnitario: 5.0,
    },
  });

  console.log('Alimentos creados:', alimento1, alimento2);

  // Crear clientes
  const cliente1 = await prisma.cliente.create({
    data: {
      nombre: 'Restaurant El Cuy Dorado',
      contacto: '912345678',
      direccion: 'Av. Principal 123',
    },
  });

  const cliente2 = await prisma.cliente.create({
    data: {
      nombre: 'Familia Rodríguez',
      contacto: '923456789',
      direccion: 'Jr. Los Cuyes 456',
    },
  });

  console.log('Clientes creados:', cliente1, cliente2);

  // Crear cuyes adultos para reproducción
  const fechaActual = new Date('2025-07-05');
  
  // Calcular fecha hace 8 meses para cuyes adultos
  const fechaAdultos = new Date(fechaActual);
  fechaAdultos.setMonth(fechaAdultos.getMonth() - 8);
  
  // Cuyes hembras adultas
  const madre1 = await prisma.cuy.create({
    data: {
      raza: 'Perú',
      fechaNacimiento: fechaAdultos,
      sexo: 'Hembra',
      peso: 1.2,
      galpon: 'A',
      jaula: '1',
      estado: 'Activo',
    },
  });

  const madre2 = await prisma.cuy.create({
    data: {
      raza: 'Andina',
      fechaNacimiento: fechaAdultos,
      sexo: 'Hembra',
      peso: 1.3,
      galpon: 'A',
      jaula: '2',
      estado: 'Activo',
    },
  });

  // Cuyes machos adultos
  const padre1 = await prisma.cuy.create({
    data: {
      raza: 'Perú',
      fechaNacimiento: fechaAdultos,
      sexo: 'Macho',
      peso: 1.5,
      galpon: 'B',
      jaula: '1',
      estado: 'Activo',
    },
  });

  const padre2 = await prisma.cuy.create({
    data: {
      raza: 'Inti',
      fechaNacimiento: fechaAdultos,
      sexo: 'Macho',
      peso: 1.6,
      galpon: 'B',
      jaula: '2',
      estado: 'Activo',
    },
  });

  console.log('Cuyes adultos creados:', madre1, madre2, padre1, padre2);

  // Crear una camada
  const camada1 = await prisma.camada.create({
    data: {
      fechaNacimiento: new Date('2025-06-01'),
      numVivos: 4,
      numMuertos: 1,
      padreId: padre1.id,
      madreId: madre1.id,
    },
  });

  console.log('Camada creada:', camada1);

  // Crear cuyes de la camada
  const cuy1 = await prisma.cuy.create({
    data: {
      raza: 'Perú',
      fechaNacimiento: new Date('2025-06-01'),
      sexo: 'Hembra',
      peso: 0.3,
      galpon: 'C',
      jaula: '1',
      estado: 'Activo',
      camadaId: camada1.id,
    },
  });

  const cuy2 = await prisma.cuy.create({
    data: {
      raza: 'Perú',
      fechaNacimiento: new Date('2025-06-01'),
      sexo: 'Hembra',
      peso: 0.28,
      galpon: 'C',
      jaula: '1',
      estado: 'Activo',
      camadaId: camada1.id,
    },
  });

  const cuy3 = await prisma.cuy.create({
    data: {
      raza: 'Perú',
      fechaNacimiento: new Date('2025-06-01'),
      sexo: 'Macho',
      peso: 0.32,
      galpon: 'C',
      jaula: '2',
      estado: 'Activo',
      camadaId: camada1.id,
    },
  });

  const cuy4 = await prisma.cuy.create({
    data: {
      raza: 'Perú',
      fechaNacimiento: new Date('2025-06-01'),
      sexo: 'Macho',
      peso: 0.3,
      galpon: 'C',
      jaula: '2',
      estado: 'Activo',
      camadaId: camada1.id,
    },
  });

  console.log('Cuyes de camada creados:', cuy1, cuy2, cuy3, cuy4);

  // Crear algunos registros de salud
  const salud1 = await prisma.historialSalud.create({
    data: {
      cuyId: madre1.id,
      tipo: 'Control',
      fecha: new Date('2025-06-15'),
      descripcion: 'Control de rutina',
      veterinario: 'Dr. Pérez',
    },
  });

  console.log('Registro de salud creado:', salud1);

  // Crear consumo de alimentos
  const consumo1 = await prisma.consumoAlimento.create({
    data: {
      galpon: 'A',
      fecha: new Date('2025-06-20'),
      alimentoId: alimento1.id,
      cantidad: 5,
    },
  });

  console.log('Consumo de alimento creado:', consumo1);

  // Crear algunos gastos
  const gasto1 = await prisma.gasto.create({
    data: {
      concepto: 'Compra de medicamentos',
      fecha: new Date('2025-06-10'),
      monto: 150.0,
      categoria: 'Salud',
    },
  });

  const gasto2 = await prisma.gasto.create({
    data: {
      concepto: 'Mantenimiento de jaulas',
      fecha: new Date('2025-06-05'),
      monto: 200.0,
      categoria: 'Infraestructura',
    },
  });

  console.log('Gastos creados:', gasto1, gasto2);

  // Crear ventas
  const venta1 = await prisma.venta.create({
    data: {
      fecha: new Date('2025-06-15'),
      clienteId: cliente1.id,
      total: 450.00,
      estadoPago: 'Pagado',
    },
  });

  const venta2 = await prisma.venta.create({
    data: {
      fecha: new Date('2025-06-20'),
      clienteId: cliente2.id,
      total: 280.00,
      estadoPago: 'Pendiente',
    },
  });

  const venta3 = await prisma.venta.create({
    data: {
      fecha: new Date('2025-07-01'),
      clienteId: cliente1.id,
      total: 350.00,
      estadoPago: 'Pagado',
    },
  });

  console.log('Ventas creadas:', venta1, venta2, venta3);

  // Crear detalles de venta (solo para las ventas pagadas)
  const ventaDetalle1 = await prisma.ventaDetalle.create({
    data: {
      ventaId: venta1.id,
      cuyId: madre1.id,
      peso: 1.2,
      precioUnitario: 25.00,
    },
  });

  const ventaDetalle2 = await prisma.ventaDetalle.create({
    data: {
      ventaId: venta3.id,
      cuyId: madre2.id,
      peso: 1.3,
      precioUnitario: 22.00,
    },
  });

  console.log('Detalles de venta creados:', ventaDetalle1, ventaDetalle2);

  // Crear más registros de salud
  const salud2 = await prisma.historialSalud.create({
    data: {
      cuyId: madre2.id,
      tipo: 'Vacunación',
      fecha: new Date('2025-06-10'),
      descripcion: 'Vacuna contra enfermedades respiratorias',
      veterinario: 'Dr. García',
      medicamento: 'Vacuna Respiratoria',
      dosis: '0.5ml',
      duracion: 'Única aplicación',
    },
  });

  const salud3 = await prisma.historialSalud.create({
    data: {
      cuyId: padre1.id,
      tipo: 'Tratamiento',
      fecha: new Date('2025-06-25'),
      descripcion: 'Tratamiento preventivo antiparasitario',
      veterinario: 'Dr. Pérez',
      medicamento: 'Ivermectina',
      dosis: '1ml',
      duracion: '3 días',
    },
  });

  const salud4 = await prisma.historialSalud.create({
    data: {
      cuyId: cuy1.id,
      tipo: 'Emergencia',
      fecha: new Date('2025-07-05'),
      descripcion: 'Corte menor en la pata derecha',
      veterinario: 'Dr. García',
      medicamento: 'Antiséptico',
      dosis: 'Aplicación tópica',
      duracion: '7 días',
    },
  });

  console.log('Registros adicionales de salud creados:', salud2, salud3, salud4);

  // Crear un usuario administrador
  const user = await prisma.user.upsert({
    where: { email: 'admin@sumaquywa.com' },
    update: {},
    create: {
      email: 'admin@sumaquywa.com',
      password: '$2a$10$aMmfKfDdDa3hUgI8lbxD5OQ7vzJGUYVsJ3XQo6e83XGUxl8Dg1aZG', // contraseña: admin123
    },
  });

  console.log('Usuario creado:', user);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed process:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
