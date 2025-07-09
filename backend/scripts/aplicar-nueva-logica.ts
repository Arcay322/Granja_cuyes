import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Nueva función para determinar propósito basado en edad y sexo
function determinarPropositoPorEdad(fechaNacimiento: Date, sexo: string): string {
  const hoy = new Date();
  const edadMeses = Math.floor((hoy.getTime() - fechaNacimiento.getTime()) / (1000 * 60 * 60 * 24 * 30));
  
  // Crías (menor de 1 mes)
  if (edadMeses < 1) {
    return 'Cría';
  }
  
  // Juveniles (1-2 meses)
  if (edadMeses < 2) {
    return 'Juvenil';
  }
  
  // A partir de 2 meses
  if (sexo === 'M' || sexo === 'Macho') {
    return 'Engorde'; // Todos los machos van a engorde por defecto
  } else {
    // Hembras: evaluar si están en edad reproductiva
    if (edadMeses >= 3) {
      return 'Reproducción'; // Hembras de 3+ meses van a reproducción
    } else {
      return 'Engorde'; // Hembras de 2-3 meses van a engorde temporalmente
    }
  }
}

// También actualizar la etapa de vida
function determinarEtapaPorEdad(fechaNacimiento: Date, sexo: string): string {
  const hoy = new Date();
  const edadMeses = Math.floor((hoy.getTime() - fechaNacimiento.getTime()) / (1000 * 60 * 60 * 24 * 30));
  
  // Crías (menor de 1 mes)
  if (edadMeses < 1) {
    return 'Cría';
  }
  
  // Juveniles (1-2 meses)
  if (edadMeses < 2) {
    return 'Juvenil';
  }
  
  // A partir de 2 meses
  if (sexo === 'M' || sexo === 'Macho') {
    if (edadMeses >= 18) {
      return 'Retirado'; // Machos muy viejos
    }
    return 'Engorde'; // Machos en edad productiva
  } else {
    // Hembras
    if (edadMeses < 3) {
      return 'Engorde'; // Aún no están en edad reproductiva
    } else if (edadMeses <= 24) {
      return 'Reproductora'; // En edad reproductiva activa
    } else {
      return 'Retirado'; // Muy viejas para reproducir
    }
  }
}

async function aplicarNuevaLogica() {
  console.log('🔄 Aplicando nueva lógica de asignación por edad y sexo...\n');

  try {
    const cuyes = await prisma.cuy.findMany();
    
    console.log(`📊 Total de cuyes a procesar: ${cuyes.length}\n`);

    let actualizados = 0;

    for (const cuy of cuyes) {
      const fechaNac = new Date(cuy.fechaNacimiento);
      const edadMeses = Math.floor((Date.now() - fechaNac.getTime()) / (1000 * 60 * 60 * 24 * 30));
      
      const nuevoPropositio = determinarPropositoPorEdad(fechaNac, cuy.sexo);
      const nuevaEtapa = determinarEtapaPorEdad(fechaNac, cuy.sexo);
      
      // Solo actualizar si hay cambios
      if (cuy.proposito !== nuevoPropositio || cuy.etapaVida !== nuevaEtapa) {
        await prisma.cuy.update({
          where: { id: cuy.id },
          data: {
            proposito: nuevoPropositio,
            etapaVida: nuevaEtapa
          }
        });
        
        console.log(`✅ ID ${cuy.id}: ${cuy.sexo === 'M' || cuy.sexo === 'Macho' ? 'Macho' : 'Hembra'} de ${edadMeses} meses`);
        console.log(`   Antes: ${cuy.etapaVida} → ${cuy.proposito}`);
        console.log(`   Ahora: ${nuevaEtapa} → ${nuevoPropositio}\n`);
        
        actualizados++;
      }
    }

    console.log(`\n📈 Resumen de la nueva lógica aplicada:`);
    console.log(`   - ${actualizados} cuyes actualizados`);
    
    // Mostrar distribución final
    const cuyesActualizados = await prisma.cuy.findMany();
    const distribucion = cuyesActualizados.reduce((acc, cuy) => {
      const key = `${cuy.sexo === 'M' || cuy.sexo === 'Macho' ? 'Machos' : 'Hembras'} - ${cuy.proposito}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`\n📊 Distribución final:`);
    Object.entries(distribucion).forEach(([categoria, cantidad]) => {
      console.log(`   ${categoria}: ${cantidad} cuyes`);
    });

    console.log(`\n💡 Nueva lógica aplicada:`);
    console.log(`   📅 CRÍAS: < 1 mes`);
    console.log(`   📅 JUVENILES: 1-2 meses`);
    console.log(`   📅 MACHOS: 2+ meses → Engorde (botón "Hacer Reproductor" disponible)`);
    console.log(`   📅 HEMBRAS: 2-3 meses → Engorde, 3+ meses → Reproducción`);
    console.log(`   📅 REPRODUCTORAS ACTIVAS: 3-24 meses`);
    console.log(`   📅 RETIRADOS: Machos 18+ meses, Hembras 24+ meses`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

aplicarNuevaLogica();
