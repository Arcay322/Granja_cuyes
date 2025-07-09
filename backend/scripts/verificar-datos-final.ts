import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarDatos() {
  console.log('🔍 Verificación final de datos de cuyes...\n');

  try {
    // Obtener todos los cuyes
    const cuyes = await prisma.cuy.findMany({
      select: {
        id: true,
        etapaVida: true,
        proposito: true,
        fechaNacimiento: true,
        sexo: true
      },
      orderBy: { id: 'asc' }
    });

    console.log(`📊 Total de cuyes en la base de datos: ${cuyes.length}\n`);

    // Mostrar todos los cuyes con su información
    console.log('📋 Lista detallada de cuyes:');
    cuyes.forEach(cuy => {
      const fechaNac = new Date(cuy.fechaNacimiento);
      const ahora = new Date();
      const edadMeses = Math.floor((ahora.getTime() - fechaNac.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
      
      console.log(`  🐹 ID ${cuy.id.toString().padEnd(3)} | Edad: ${edadMeses.toString().padEnd(2)} meses | Etapa: ${cuy.etapaVida?.padEnd(8) || 'null'} | Propósito: ${cuy.proposito?.padEnd(12) || 'null'} | Sexo: ${cuy.sexo || 'null'}`);
    });

    // Análisis de problemas
    console.log('\n⚠️ Análisis de problemas:');
    
    const problemaSexo = cuyes.filter(c => !c.sexo || c.sexo === 'Indefinido');
    const problemaEtapa = cuyes.filter(c => !c.etapaVida);
    const problemaProposito = cuyes.filter(c => !c.proposito);
    
    console.log(`- Cuyes sin sexo o con sexo "Indefinido": ${problemaSexo.length}`);
    if (problemaSexo.length > 0) {
      console.log('  IDs:', problemaSexo.map(c => c.id).join(', '));
    }
    
    console.log(`- Cuyes sin etapa de vida: ${problemaEtapa.length}`);
    if (problemaEtapa.length > 0) {
      console.log('  IDs:', problemaEtapa.map(c => c.id).join(', '));
    }
    
    console.log(`- Cuyes sin propósito: ${problemaProposito.length}`);
    if (problemaProposito.length > 0) {
      console.log('  IDs:', problemaProposito.map(c => c.id).join(', '));
    }

    // Estadísticas por etapa
    console.log('\n📈 Distribución por etapa de vida:');
    const etapas = ['Cría', 'Juvenil', 'Adulto', 'Reproductor'];
    etapas.forEach(etapa => {
      const count = cuyes.filter(c => c.etapaVida === etapa).length;
      console.log(`  ${etapa}: ${count} cuyes`);
    });

    // Estadísticas por propósito
    console.log('\n📈 Distribución por propósito:');
    const propositos = ['Carne', 'Reproducción', 'Engorde', 'Indefinido'];
    propositos.forEach(proposito => {
      const count = cuyes.filter(c => c.proposito === proposito).length;
      console.log(`  ${proposito}: ${count} cuyes`);
    });

    // Estadísticas por sexo
    console.log('\n📈 Distribución por sexo:');
    const sexos = ['Macho', 'Hembra', 'Indefinido'];
    sexos.forEach(sexo => {
      const count = cuyes.filter(c => c.sexo === sexo).length;
      console.log(`  ${sexo}: ${count} cuyes`);
    });

  } catch (error) {
    console.error('❌ Error al verificar datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarDatos();
