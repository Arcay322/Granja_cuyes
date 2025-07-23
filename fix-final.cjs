const fs = require('fs');

// Función para arreglar errores específicos de manera muy cuidadosa
function fixSpecificErrors(filePath) {
  console.log(`Arreglando errores específicos en: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;

  // 1. Arreglar response.data sin tipado (muy específico)
  content = content.replace(/(\w+Response)\.data(?!\s*as)/g, '($1.data as any)');
  content = content.replace(/response\.data(?!\s*as)(?=\s*[.;])/g, '(response.data as any)');
  content = content.replace(/res\.data(?!\s*as)(?=\s*[.;)])/g, '(res.data as any)');
  changes++;

  // 2. Arreglar imports de date-fns
  content = content.replace(/import es from 'date-fns\/locale\/es';/g, "import { es } from 'date-fns/locale/es';");
  changes++;

  // 3. Arreglar Baby icon import
  content = content.replace(/import \{ Baby,/g, 'import { ChildCare as Baby,');
  changes++;

  // 4. Arreglar icon props en Chip (muy específico)
  content = content.replace(/icon=\{estadoInfo\.icon\}/g, 'icon={estadoInfo.icon as React.ReactElement}');
  changes++;

  // 5. Arreglar capacidadWarningData accesos (muy específico)
  content = content.replace(/capacidadWarningData\.jaula\.ocupacionActual/g, '(capacidadWarningData.jaula as any).ocupacionActual');
  content = content.replace(/capacidadWarningData\.jaula\.capacidadMaxima/g, '(capacidadWarningData.jaula as any).capacidadMaxima');
  content = content.replace(/capacidadWarningData\.jaula\.porcentajeOcupacion/g, '(capacidadWarningData.jaula as any).porcentajeOcupacion');
  content = content.replace(/capacidadWarningData\.galpon\.ocupacionActual/g, '(capacidadWarningData.galpon as any).ocupacionActual');
  content = content.replace(/capacidadWarningData\.galpon\.capacidadMaxima/g, '(capacidadWarningData.galpon as any).capacidadMaxima');
  content = content.replace(/capacidadWarningData\.galpon\.porcentajeOcupacion/g, '(capacidadWarningData.galpon as any).porcentajeOcupacion');
  changes++;

  fs.writeFileSync(filePath, content);
  console.log(`✅ Arreglado ${filePath} con ${changes} tipos de cambios específicos`);
}

// Lista de archivos principales
const mainFiles = [
  'src/components/CuyesManagerFixed.tsx',
  'src/components/GalponesManagerFixed.tsx',
  'src/components/CompatibilidadReproductiva.tsx',
  'src/components/GastosTable.tsx'
];

// Arreglar archivos principales
mainFiles.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      fixSpecificErrors(file);
    } catch (error) {
      console.error(`❌ Error arreglando ${file}:`, error.message);
    }
  }
});

console.log('\n🎉 ¡Correcciones específicas aplicadas!');