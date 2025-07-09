import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función para determinar el propósito basado en la etapa
function determinarPropositoAutomatico(etapaVida: string, sexo: string): string {
  switch (etapaVida) {
    case 'Cría':
      return 'Cría';
    case 'Juvenil':
      return 'Indefinido'; // Se define más tarde según el plan
    case 'Engorde':
      return 'Engorde';
    case 'Reproductor':
    case 'Reproductora':
    case 'Gestante':
    case 'Lactante':
      return 'Reproducción';
    case 'Retirado':
      return 'Retirado';
    default:
      return 'Indefinido';
  }
}

async function main() {
  console.log('🔄 Iniciando corrección de propósitos...');

  // Obtener todos los cuyes
  const cuyes = await prisma.cuy.findMany({
    select: {
      id: true,
      etapaVida: true,
      proposito: true,
      sexo: true,
      fechaNacimiento: true
    }
  });

  console.log(`📊 Total de cuyes encontrados: ${cuyes.length}`);

  let actualizados = 0;
  let yaCorrectos = 0;

  for (const cuy of cuyes) {
    const propositoCalculado = determinarPropositoAutomatico(cuy.etapaVida || 'Cría', cuy.sexo);
    
    if (cuy.proposito !== propositoCalculado) {
      // Actualizar el propósito
      await prisma.cuy.update({
        where: { id: cuy.id },
        data: { proposito: propositoCalculado }
      });
      
      console.log(`✅ ID ${cuy.id}: ${cuy.proposito} → ${propositoCalculado} (Etapa: ${cuy.etapaVida})`);
      actualizados++;
    } else {
      yaCorrectos++;
    }
  }

  console.log('\n📈 Resumen de la migración:');
  console.log(`  ✅ Cuyes actualizados: ${actualizados}`);
  console.log(`  ⚡ Ya estaban correctos: ${yaCorrectos}`);
  console.log(`  📊 Total procesados: ${cuyes.length}`);

  // Verificar el resultado
  console.log('\n🔍 Verificando resultado...');
  const cuyesActualizados = await prisma.cuy.findMany({
    select: { proposito: true }
  });

  const propositoStats: Record<string, number> = {};
  cuyesActualizados.forEach(cuy => {
    const prop = cuy.proposito || 'Sin definir';
    propositoStats[prop] = (propositoStats[prop] || 0) + 1;
  });

  console.log('📊 Nueva distribución de propósitos:');
  Object.entries(propositoStats).forEach(([prop, count]) => {
    console.log(`  ${prop}: ${count} cuyes`);
  });

  console.log('\n🎉 ¡Migración completada exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la migración:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
