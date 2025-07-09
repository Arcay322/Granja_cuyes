import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función para calcular edad en meses
const calcularEdadEnMeses = (fechaNacimiento: Date): number => {
  const ahora = new Date(2025, 6, 7); // 7 de julio de 2025 (fecha del contexto)
  const años = ahora.getFullYear() - fechaNacimiento.getFullYear();
  const meses = ahora.getMonth() - fechaNacimiento.getMonth();
  const días = ahora.getDate() - fechaNacimiento.getDate();
  
  let edadEnMeses = años * 12 + meses;
  if (días < 0) edadEnMeses -= 1;
  
  return edadEnMeses;
};

// Función para determinar etapa según edad y sexo
const determinarEtapaCorrecta = (edadEnMeses: number, sexo: string): string => {
  console.log(`Determinando etapa para edad ${edadEnMeses} meses, sexo ${sexo}`);
  
  if (edadEnMeses < 3) {
    return 'Cría';
  } else if (edadEnMeses < 6) {
    return 'Juvenil';
  } else {
    // Cuyes adultos (6+ meses)
    if (sexo === 'M') {
      return 'Engorde'; // Por defecto machos van a engorde
    } else if (sexo === 'H') {
      return 'Reproductora'; // Por defecto hembras van a reproducción
    } else {
      return 'Juvenil'; // Si sexo es indefinido, mantener como juvenil
    }
  }
};

async function corregirEtapasExistentes() {
  try {
    console.log('🔄 Iniciando corrección de etapas de vida...');
    
    // Obtener todos los cuyes activos
    const cuyes = await prisma.cuy.findMany({
      where: {
        estado: {
          notIn: ['Vendido', 'Fallecido']
        }
      }
    });
    
    console.log(`📋 Encontrados ${cuyes.length} cuyes para evaluar`);
    
    let actualizados = 0;
    
    for (const cuy of cuyes) {
      const edadEnMeses = calcularEdadEnMeses(cuy.fechaNacimiento);
      const etapaCorrecta = determinarEtapaCorrecta(edadEnMeses, cuy.sexo);
      
      console.log(`CUY #${cuy.id}: ${cuy.fechaNacimiento.toISOString().split('T')[0]} (${edadEnMeses.toFixed(1)} meses) - ${cuy.sexo} - Etapa actual: ${cuy.etapaVida} → Nueva: ${etapaCorrecta}`);
      
      // Solo actualizar si la etapa es diferente
      if (cuy.etapaVida !== etapaCorrecta) {
        await prisma.cuy.update({
          where: { id: cuy.id },
          data: {
            etapaVida: etapaCorrecta,
            proposito: etapaCorrecta === 'Engorde' ? 'Engorde' : 
                      etapaCorrecta === 'Reproductora' ? 'Reproducción' : 
                      'Indefinido',
            ultimaEvaluacion: new Date()
          }
        });
        
        console.log(`  ✅ Actualizado: ${cuy.etapaVida} → ${etapaCorrecta}`);
        actualizados++;
      } else {
        console.log(`  ➡️ Sin cambios necesarios`);
      }
    }
    
    console.log(`\n🎉 Corrección completada: ${actualizados} cuyes actualizados de ${cuyes.length} evaluados`);
    
    // Mostrar resumen por etapas
    const resumen = await prisma.cuy.groupBy({
      by: ['etapaVida'],
      _count: {
        id: true
      },
      where: {
        estado: {
          notIn: ['Vendido', 'Fallecido']
        }
      }
    });
    
    console.log('\n📊 Resumen por etapas:');
    resumen.forEach(r => {
      console.log(`  ${r.etapaVida}: ${r._count.id} cuyes`);
    });
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la corrección
corregirEtapasExistentes();
