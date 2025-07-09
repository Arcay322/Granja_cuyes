import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function limpiarPesos() {
  console.log('🔧 Limpiando pesos con decimales largos...\n');

  try {
    const cuyes = await prisma.cuy.findMany({
      select: {
        id: true,
        peso: true
      }
    });

    console.log(`📊 Total de cuyes a revisar: ${cuyes.length}\n`);

    let actualizados = 0;

    for (const cuy of cuyes) {
      // Redondear a 3 decimales
      const pesoLimpio = Math.round(cuy.peso * 1000) / 1000;
      
      if (cuy.peso !== pesoLimpio) {
        await prisma.cuy.update({
          where: { id: cuy.id },
          data: { peso: pesoLimpio }
        });
        
        console.log(`✅ ID ${cuy.id}: ${cuy.peso} kg → ${pesoLimpio} kg`);
        actualizados++;
      }
    }

    console.log(`\n📈 Resumen:`);
    console.log(`   - ${actualizados} cuyes actualizados`);
    console.log(`   - ${cuyes.length - actualizados} cuyes ya tenían pesos correctos`);
    
    if (actualizados > 0) {
      console.log('\n✅ Pesos limpiados exitosamente!');
    } else {
      console.log('\n✅ Todos los pesos ya estaban correctos.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

limpiarPesos();
