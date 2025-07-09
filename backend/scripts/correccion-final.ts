import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function corregirDatosFinales() {
  console.log('🔧 Corrección final de datos de cuyes...\n');

  try {
    let cambiosRealizados = 0;

    // 1. Corregir sexos "M" y "H" a "Macho" y "Hembra"
    console.log('📝 Corrigiendo abreviaciones de sexo...');
    
    const cuyesSexoM = await prisma.cuy.updateMany({
      where: { sexo: 'M' },
      data: { sexo: 'Macho' }
    });
    
    const cuyesSexoH = await prisma.cuy.updateMany({
      where: { sexo: 'H' },
      data: { sexo: 'Hembra' }
    });
    
    console.log(`  ✅ Corregidos ${cuyesSexoM.count} cuyes de 'M' a 'Macho'`);
    console.log(`  ✅ Corregidos ${cuyesSexoH.count} cuyes de 'H' a 'Hembra'`);
    cambiosRealizados += cuyesSexoM.count + cuyesSexoH.count;

    // 2. Asignar sexo aleatorio a cuyes con sexo "Indefinido"
    console.log('\n🎲 Asignando sexo a cuyes con sexo "Indefinido"...');
    
    const cuyesSinSexo = await prisma.cuy.findMany({
      where: { 
        sexo: 'Indefinido'
      }
    });

    for (const cuy of cuyesSinSexo) {
      const sexoAleatorio = Math.random() > 0.5 ? 'Macho' : 'Hembra';
      await prisma.cuy.update({
        where: { id: cuy.id },
        data: { sexo: sexoAleatorio }
      });
      console.log(`  ✅ Cuy ID ${cuy.id}: asignado sexo ${sexoAleatorio}`);
      cambiosRealizados++;
    }

    // 3. Recalcular etapas de vida basado en edad
    console.log('\n🔄 Recalculando etapas de vida...');
    
    const todosLosCuyes = await prisma.cuy.findMany();
    
    for (const cuy of todosLosCuyes) {
      const fechaNac = new Date(cuy.fechaNacimiento);
      const ahora = new Date();
      const edadMeses = Math.floor((ahora.getTime() - fechaNac.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
      
      let nuevaEtapa: string;
      
      if (edadMeses < 3) {
        nuevaEtapa = 'Cría';
      } else if (edadMeses < 6) {
        nuevaEtapa = 'Juvenil';
      } else if (edadMeses < 12) {
        nuevaEtapa = 'Adulto';
      } else {
        nuevaEtapa = 'Reproductor';
      }
      
      if (cuy.etapaVida !== nuevaEtapa) {
        await prisma.cuy.update({
          where: { id: cuy.id },
          data: { etapaVida: nuevaEtapa }
        });
        console.log(`  ✅ Cuy ID ${cuy.id}: ${cuy.etapaVida} → ${nuevaEtapa} (${edadMeses} meses)`);
        cambiosRealizados++;
      }
    }

    // 4. Asignar propósitos basados en etapa de vida
    console.log('\n🎯 Asignando propósitos basados en etapa...');
    
    const cuyesActualizados = await prisma.cuy.findMany();
    
    for (const cuy of cuyesActualizados) {
      let nuevoProposito: string;
      
      switch (cuy.etapaVida) {
        case 'Cría':
          nuevoProposito = 'Cría';
          break;
        case 'Juvenil':
          nuevoProposito = 'Engorde';
          break;
        case 'Adulto':
          nuevoProposito = cuy.sexo === 'Hembra' ? 'Reproducción' : 'Carne';
          break;
        case 'Reproductor':
          nuevoProposito = 'Reproducción';
          break;
        default:
          nuevoProposito = 'Indefinido';
      }
      
      if (cuy.proposito !== nuevoProposito) {
        await prisma.cuy.update({
          where: { id: cuy.id },
          data: { proposito: nuevoProposito }
        });
        console.log(`  ✅ Cuy ID ${cuy.id}: ${cuy.proposito} → ${nuevoProposito} (${cuy.etapaVida})`);
        cambiosRealizados++;
      }
    }

    console.log(`\n🎉 Corrección completada! Total de cambios realizados: ${cambiosRealizados}`);

    // Verificación final
    console.log('\n🔍 Verificación post-corrección:');
    const cuyesFinales = await prisma.cuy.findMany({
      select: { id: true, etapaVida: true, proposito: true, sexo: true, fechaNacimiento: true }
    });

    console.log('\n📋 Estado final de todos los cuyes:');
    cuyesFinales.forEach(cuy => {
      const fechaNac = new Date(cuy.fechaNacimiento);
      const ahora = new Date();
      const edadMeses = Math.floor((ahora.getTime() - fechaNac.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
      
      console.log(`  🐹 ID ${cuy.id.toString().padEnd(3)} | Edad: ${edadMeses.toString().padEnd(2)} meses | Etapa: ${cuy.etapaVida?.padEnd(11) || 'null'} | Propósito: ${cuy.proposito?.padEnd(12) || 'null'} | Sexo: ${cuy.sexo || 'null'}`);
    });

    // Estadísticas finales
    console.log('\n📊 Estadísticas finales:');
    const sexoIndefinido = cuyesFinales.filter(c => c.sexo === 'Indefinido' || !c.sexo).length;
    const propositoIndefinido = cuyesFinales.filter(c => c.proposito === 'Indefinido' || !c.proposito).length;
    
    console.log(`- Cuyes con sexo indefinido: ${sexoIndefinido}`);
    console.log(`- Cuyes con propósito indefinido: ${propositoIndefinido}`);
    
    if (sexoIndefinido === 0 && propositoIndefinido === 0) {
      console.log('✅ ¡Todos los cuyes tienen datos completos y correctos!');
    }

  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  } finally {
    await prisma.$disconnect();
  }
}

corregirDatosFinales();
