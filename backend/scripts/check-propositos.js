const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPropositos() {
  try {
    const cuyes = await prisma.cuy.findMany({
      select: { id: true, etapaVida: true, proposito: true, fechaNacimiento: true, sexo: true }     
    });
    
    console.log('🔍 Estado actual de los propósitos:');
    console.log('Total cuyes:', cuyes.length);

    const propositoStats = {};
    cuyes.forEach(cuy => {
      const prop = cuy.proposito || 'Sin definir';
      propositoStats[prop] = (propositoStats[prop] || 0) + 1;
    });

    console.log('\n📊 Distribución de propósitos:');
    Object.entries(propositoStats).forEach(([prop, count]) => {
      console.log(`  ${prop}: ${count} cuyes`);
    });

    console.log('\n🔍 Ejemplos de cuyes con Indefinido:');
    const indefinidos = cuyes.filter(c => c.proposito === 'Indefinido' || !c.proposito).slice(0, 5);
    indefinidos.forEach(cuy => {    
      const edad = Math.floor((new Date() - new Date(cuy.fechaNacimiento)) / (1000 * 60 * 60 * 24));
      console.log(`  ID ${cuy.id}: Etapa=${cuy.etapaVida}, Propósito=${cuy.proposito}, Sexo=${cuy.sexo}, Edad=${edad} días`);
    });

    console.log('\n🔍 Ejemplos de cuyes por etapa:');
    const etapaStats = {};
    cuyes.forEach(cuy => {
      const etapa = cuy.etapaVida || 'Sin etapa';
      if (!etapaStats[etapa]) etapaStats[etapa] = [];
      etapaStats[etapa].push(cuy);
    });

    Object.entries(etapaStats).forEach(([etapa, cuyes]) => {
      console.log(`  ${etapa}: ${cuyes.length} cuyes`);
      if (cuyes.length > 0) {
        const ejemplo = cuyes[0];
        console.log(`    Ejemplo: ID ${ejemplo.id}, Propósito=${ejemplo.proposito}`);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPropositos();
