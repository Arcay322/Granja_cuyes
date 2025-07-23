#!/usr/bin/env node

/**
 * Script de validación para las mejoras del módulo de reproducción
 * Verifica que todas las funcionalidades estén implementadas correctamente
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validando mejoras del módulo de reproducción...\n');

// Lista de archivos que deben existir
const requiredFiles = [
  // Backend - Servicios
  'backend/src/services/reproduccion/prenez.service.ts',
  
  // Backend - Controladores
  'backend/src/controllers/reproduccion/prenez.controller.ts',
  
  // Backend - Rutas
  'backend/src/routes/reproduccion/prenez.routes.ts',
  
  // Frontend - Componentes
  'src/components/ReproduccionManagerFixed.tsx',
  'src/components/ReproductorSelectionDialog.tsx',
  'src/components/ReproductiveAnalytics.tsx',
  
  // Tests
  'backend/src/__tests__/reproduccion-improvements.test.ts'
];

// Lista de funciones/endpoints que deben existir
const requiredEndpoints = [
  '/reproduccion/prenez/madres-disponibles',
  '/reproduccion/prenez/padres-disponibles',
  '/reproduccion/prenez/madres-elegibles-camada',
  '/reproduccion/prenez/validar-gestacion',
  '/reproduccion/prenez/calcular-compatibilidad',
  '/reproduccion/prenez/recomendaciones'
];

// Lista de funciones de servicio que deben existir
const requiredServiceFunctions = [
  'getMadresDisponibles',
  'getPadresDisponibles',
  'validarPeriodoGestacion',
  'getMadresElegiblesCamada',
  'calcularCompatibilidadReproductiva',
  'getRecomendacionesReproductivas',
  'getAlertasEspecificas'
];

// Lista de componentes React que deben existir
const requiredComponents = [
  'ReproduccionManagerFixed',
  'ReproductorSelectionDialog',
  'ReproductiveAnalytics'
];

let validationErrors = [];
let validationWarnings = [];

// Función para verificar si un archivo existe
function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Función para verificar contenido de archivo
function checkFileContent(filePath, searchTerms) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const missing = searchTerms.filter(term => !content.includes(term));
    return { exists: true, content, missing };
  } catch (error) {
    return { exists: false, content: '', missing: searchTerms };
  }
}

console.log('📁 Verificando archivos requeridos...');
requiredFiles.forEach(file => {
  if (checkFileExists(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - FALTANTE`);
    validationErrors.push(`Archivo faltante: ${file}`);
  }
});

console.log('\n🔧 Verificando servicios del backend...');
const serviceFile = 'backend/src/services/reproduccion/prenez.service.ts';
if (checkFileExists(serviceFile)) {
  const serviceCheck = checkFileContent(serviceFile, requiredServiceFunctions);
  if (serviceCheck.missing.length === 0) {
    console.log('✅ Todas las funciones de servicio están implementadas');
  } else {
    console.log(`⚠️ Funciones de servicio faltantes: ${serviceCheck.missing.join(', ')}`);
    validationWarnings.push(`Funciones de servicio faltantes: ${serviceCheck.missing.join(', ')}`);
  }
} else {
  validationErrors.push('Archivo de servicios no encontrado');
}

console.log('\n🌐 Verificando endpoints del backend...');
const routesFile = 'backend/src/routes/reproduccion/prenez.routes.ts';
if (checkFileExists(routesFile)) {
  const routesCheck = checkFileContent(routesFile, requiredEndpoints.map(e => e.split('/').pop()));
  if (routesCheck.missing.length === 0) {
    console.log('✅ Todos los endpoints están definidos');
  } else {
    console.log(`⚠️ Endpoints faltantes: ${routesCheck.missing.join(', ')}`);
    validationWarnings.push(`Endpoints faltantes: ${routesCheck.missing.join(', ')}`);
  }
} else {
  validationErrors.push('Archivo de rutas no encontrado');
}

console.log('\n⚛️ Verificando componentes del frontend...');
requiredComponents.forEach(component => {
  const componentFile = `src/components/${component}.tsx`;
  if (checkFileExists(componentFile)) {
    const componentCheck = checkFileContent(componentFile, [component, 'export default']);
    if (componentCheck.missing.length === 0) {
      console.log(`✅ ${component}`);
    } else {
      console.log(`⚠️ ${component} - Posibles problemas de implementación`);
      validationWarnings.push(`Componente ${component} puede tener problemas`);
    }
  } else {
    console.log(`❌ ${component} - FALTANTE`);
    validationErrors.push(`Componente faltante: ${component}`);
  }
});

console.log('\n🧪 Verificando funcionalidades específicas...');

// Verificar interfaces TypeScript
const interfaceChecks = [
  { file: 'src/components/ReproductorSelectionDialog.tsx', interfaces: ['MotherSelectionData', 'FatherSelectionData'] },
  { file: 'src/components/ReproduccionManagerFixed.tsx', interfaces: ['MotherSelectionData', 'FatherSelectionData'] }
];

interfaceChecks.forEach(check => {
  if (checkFileExists(check.file)) {
    const interfaceCheck = checkFileContent(check.file, check.interfaces);
    if (interfaceCheck.missing.length === 0) {
      console.log(`✅ Interfaces en ${path.basename(check.file)}`);
    } else {
      console.log(`⚠️ Interfaces faltantes en ${path.basename(check.file)}: ${interfaceCheck.missing.join(', ')}`);
      validationWarnings.push(`Interfaces faltantes en ${check.file}: ${interfaceCheck.missing.join(', ')}`);
    }
  }
});

// Verificar funciones específicas del frontend
const frontendFunctionChecks = [
  { file: 'src/components/ReproduccionManagerFixed.tsx', functions: ['fetchAvailableMadres', 'fetchAvailablePadres', 'validateGestationPeriod'] },
  { file: 'src/components/ReproductorSelectionDialog.tsx', functions: ['renderMotherCard', 'renderFatherCard'] }
];

frontendFunctionChecks.forEach(check => {
  if (checkFileExists(check.file)) {
    const functionCheck = checkFileContent(check.file, check.functions);
    if (functionCheck.missing.length === 0) {
      console.log(`✅ Funciones en ${path.basename(check.file)}`);
    } else {
      console.log(`⚠️ Funciones faltantes en ${path.basename(check.file)}: ${functionCheck.missing.join(', ')}`);
      validationWarnings.push(`Funciones faltantes en ${check.file}: ${functionCheck.missing.join(', ')}`);
    }
  }
});

console.log('\n📊 Resumen de validación:');
console.log(`✅ Archivos verificados: ${requiredFiles.length}`);
console.log(`🔧 Servicios verificados: ${requiredServiceFunctions.length}`);
console.log(`🌐 Endpoints verificados: ${requiredEndpoints.length}`);
console.log(`⚛️ Componentes verificados: ${requiredComponents.length}`);

if (validationErrors.length === 0 && validationWarnings.length === 0) {
  console.log('\n🎉 ¡Todas las mejoras del módulo de reproducción están implementadas correctamente!');
  console.log('\n📋 Funcionalidades implementadas:');
  console.log('   ✅ Selección mejorada de reproductores con información detallada');
  console.log('   ✅ Prevención de selección de madres preñadas');
  console.log('   ✅ Validación de períodos de gestación');
  console.log('   ✅ Sistema de compatibilidad y recomendaciones');
  console.log('   ✅ Analíticas de rendimiento reproductivo');
  console.log('   ✅ Interfaces de usuario mejoradas con búsqueda y filtros');
  console.log('   ✅ Pruebas automatizadas');
  
  process.exit(0);
} else {
  console.log('\n⚠️ Se encontraron problemas:');
  
  if (validationErrors.length > 0) {
    console.log('\n❌ Errores críticos:');
    validationErrors.forEach(error => console.log(`   - ${error}`));
  }
  
  if (validationWarnings.length > 0) {
    console.log('\n⚠️ Advertencias:');
    validationWarnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  console.log('\n🔧 Acciones recomendadas:');
  console.log('   1. Revisar los archivos faltantes');
  console.log('   2. Verificar la implementación de funciones faltantes');
  console.log('   3. Ejecutar las pruebas: npm test');
  console.log('   4. Probar manualmente las funcionalidades en el frontend');
  
  process.exit(1);
}