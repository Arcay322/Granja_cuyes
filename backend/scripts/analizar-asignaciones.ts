import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analizarAsignaciones() {
  try {
    console.log('🔍 Analizando cómo se asignaron las etapas y propósitos...\n');
    
    const cuyes = await prisma.cuy.findMany({
      select: {
        id: true,
        raza: true,
        sexo: true,
        fechaNacimiento: true,
        peso: true,
        etapaVida: true,
        proposito: true,
        estado: true
      },
      orderBy: {
        fechaNacimiento: 'asc'
      }
    });

    console.log(`📊 Total de cuyes: ${cuyes.length}\n`);

    // Análisis por propósito
    const porProposito = cuyes.reduce((acc, cuy) => {
      acc[cuy.proposito] = (acc[cuy.proposito] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('📈 Distribución por propósito:');
    Object.entries(porProposito).forEach(([proposito, cantidad]) => {
      console.log(`  ${proposito}: ${cantidad} cuyes`);
    });

    // Análisis por etapa
    const porEtapa = cuyes.reduce((acc, cuy) => {
      acc[cuy.etapaVida] = (acc[cuy.etapaVida] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📈 Distribución por etapa:');
    Object.entries(porEtapa).forEach(([etapa, cantidad]) => {
      console.log(`  ${etapa}: ${cantidad} cuyes`);
    });

    // Calcular edades actuales
    console.log('\n🎂 Análisis de edades:');
    cuyes.forEach(cuy => {
      const fechaNac = new Date(cuy.fechaNacimiento);
      const hoy = new Date();
      const edadMeses = Math.floor((hoy.getTime() - fechaNac.getTime()) / (1000 * 60 * 60 * 24 * 30));
      
      console.log(`ID ${cuy.id}: ${cuy.raza} ${cuy.sexo}, ${edadMeses} meses, ${cuy.peso}kg → Etapa: ${cuy.etapaVida} → Propósito: ${cuy.proposito}`);
    });

    console.log('\n💡 CONCLUSIÓN:');
    console.log('Las asignaciones actuales probablemente son artificiales.');
    console.log('En una granja real, necesitarías:');
    console.log('1. Evaluar cada cuy individualmente');
    console.log('2. Considerar genética, salud, conformación');
    console.log('3. Balancear necesidades del rebaño');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analizarAsignaciones();
