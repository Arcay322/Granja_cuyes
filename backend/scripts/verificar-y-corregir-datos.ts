import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarYCorregirDatos() {
  try {
    console.log('🔍 Verificando estado actual de los cuyes...\n');
    
    // Obtener todos los cuyes
    const cuyes = await prisma.cuy.findMany({
      select: { 
        id: true, 
        etapaVida: true, 
        proposito: true, 
        fechaNacimiento: true, 
        sexo: true,
        raza: true
      }
    });
    
    console.log(`📊 Total de cuyes: ${cuyes.length}\n`);
    
    // Mostrar estado actual
    console.log('📋 Estado actual:');
    cuyes.forEach(cuy => {
      console.log(`  ID ${cuy.id}: Raza=${cuy.raza}, Sexo=${cuy.sexo}, Etapa=${cuy.etapaVida}, Propósito=${cuy.proposito}`);
    });
    
    // Encontrar problemas
    const cuyesConSexoIndefinido = cuyes.filter(cuy => !cuy.sexo || cuy.sexo === 'Indefinido');
    const cuyesConEtapaProblematica = cuyes.filter(cuy => !cuy.etapaVida || cuy.etapaVida === 'Indefinido');
    const cuyesConPropositoIndefinido = cuyes.filter(cuy => cuy.proposito === 'Indefinido' && cuy.etapaVida !== 'Juvenil');
    
    console.log('\n⚠️ Problemas encontrados:');
    console.log(`- Cuyes con sexo indefinido: ${cuyesConSexoIndefinido.length}`);
    console.log(`- Cuyes con etapa problemática: ${cuyesConEtapaProblematica.length}`);
    console.log(`- Cuyes con propósito indefinido (no juveniles): ${cuyesConPropositoIndefinido.length}`);
    
    if (cuyesConSexoIndefinido.length > 0) {
      console.log('\n🔧 Corrigiendo cuyes con sexo indefinido...');
      
      for (const cuy of cuyesConSexoIndefinido) {
        // Asignar sexo aleatorio si no está definido
        const sexoAleatorio = Math.random() > 0.5 ? 'M' : 'H';
        await prisma.cuy.update({
          where: { id: cuy.id },
          data: { sexo: sexoAleatorio }
        });
        console.log(`  ✅ Cuy ID ${cuy.id}: sexo actualizado a ${sexoAleatorio}`);
      }
    }
    
    // Recalcular etapas y propósitos para todos los cuyes
    console.log('\n🔧 Recalculando etapas y propósitos...');
    
    const cuyesActualizados = await prisma.cuy.findMany();
    
    for (const cuy of cuyesActualizados) {
      const fechaNac = new Date(cuy.fechaNacimiento);
      const hoy = new Date();
      const edadMeses = (hoy.getTime() - fechaNac.getTime()) / (1000 * 60 * 60 * 24 * 30);
      
      let nuevaEtapa: string;
      let nuevoProposito: string;
      
      // Determinar etapa basada en edad
      if (edadMeses < 1.5) {
        nuevaEtapa = 'Cría';
        nuevoProposito = 'Cría';
      } else if (edadMeses < 3) {
        nuevaEtapa = 'Juvenil';
        nuevoProposito = 'Indefinido'; // Los juveniles quedan indefinidos hasta que se decida
      } else if (edadMeses < 6) {
        // Adultos jóvenes - depende del sexo
        if (cuy.sexo === 'H') {
          nuevaEtapa = 'Reproductora';
          nuevoProposito = 'Reproducción';
        } else {
          nuevaEtapa = 'Engorde';
          nuevoProposito = 'Engorde';
        }
      } else {
        // Adultos maduros
        if (cuy.sexo === 'H') {
          nuevaEtapa = 'Reproductora';
          nuevoProposito = 'Reproducción';
        } else {
          nuevaEtapa = 'Reproductor';
          nuevoProposito = 'Reproducción';
        }
      }
      
      // Actualizar solo si hay cambios
      if (cuy.etapaVida !== nuevaEtapa || cuy.proposito !== nuevoProposito) {
        await prisma.cuy.update({
          where: { id: cuy.id },
          data: {
            etapaVida: nuevaEtapa,
            proposito: nuevoProposito
          }
        });
        console.log(`  ✅ Cuy ID ${cuy.id}: ${cuy.etapaVida}->${nuevaEtapa}, ${cuy.proposito}->${nuevoProposito}`);
      }
    }
    
    // Mostrar estado final
    console.log('\n📊 Estado después de las correcciones:');
    const cuyesFinales = await prisma.cuy.findMany({
      select: { 
        id: true, 
        etapaVida: true, 
        proposito: true, 
        fechaNacimiento: true, 
        sexo: true,
        raza: true
      }
    });
    
    cuyesFinales.forEach(cuy => {
      const fechaNac = new Date(cuy.fechaNacimiento);
      const hoy = new Date();
      const edadMeses = Math.round((hoy.getTime() - fechaNac.getTime()) / (1000 * 60 * 60 * 24 * 30));
      console.log(`  ID ${cuy.id}: ${cuy.raza}, ${cuy.sexo}, ${edadMeses}m, ${cuy.etapaVida}, ${cuy.proposito}`);
    });
    
    // Resumen por categorías
    console.log('\n📈 Resumen final:');
    const etapas = cuyesFinales.reduce((acc, cuy) => {
      acc[cuy.etapaVida] = (acc[cuy.etapaVida] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const propositos = cuyesFinales.reduce((acc, cuy) => {
      acc[cuy.proposito] = (acc[cuy.proposito] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Etapas:', etapas);
    console.log('Propósitos:', propositos);
    
    console.log('\n✅ Verificación y corrección completada');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarYCorregirDatos();
