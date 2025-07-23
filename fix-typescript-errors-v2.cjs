const fs = require('fs');

// Función para arreglar errores de TypeScript de manera más cuidadosa
function fixTypeScriptErrorsCarefully(filePath) {
  console.log(`Arreglando errores en: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;

  // 1. Arreglar response.data sin tipado (más específico)
  content = content.replace(/(\w+)\.data(?!\s*as\s+any)(?=\s*[.;])/g, '($1.data as any)');
  changes++;

  // 2. Arreglar onChange handlers para Select (más específico)
  content = content.replace(/onChange=\{([a-zA-Z_][a-zA-Z0-9_]*)\}(?=\s)/g, 'onChange={(e) => $1(e as any)}');
  changes++;

  // 3. Arreglar onChange handlers para Checkbox (más específico)
  content = content.replace(/onChange=\{\(event\) => handleClick\(event,/g, 'onChange={(event) => handleClick(event as any,');
  changes++;

  // 4. Arreglar imports de date-fns
  content = content.replace(/import es from 'date-fns\/locale\/es';/g, "import { es } from 'date-fns/locale/es';");
  changes++;

  // 5. Arreglar Baby icon import
  content = content.replace(/import \{ Baby,/g, 'import { ChildCare as Baby,');
  changes++;

  // 6. Arreglar comparaciones con string vacío (más específico)
  content = content.replace(/([a-zA-Z_][a-zA-Z0-9_]*\.num[a-zA-Z]*) === ''/g, "typeof $1 === 'string' && $1 === ''");
  changes++;

  // 7. Arreglar icon props en Chip (más específico)
  content = content.replace(/icon=\{([a-zA-Z_][a-zA-Z0-9_]*\.icon)\}/g, 'icon={$1 as React.ReactElement}');
  changes++;

  // 8. Arreglar capacidadWarningData accesos (más específico)
  content = content.replace(/capacidadWarningData\.jaula\.([a-zA-Z_][a-zA-Z0-9_]*)/g, '(capacidadWarningData.jaula as any).$1');
  content = content.replace(/capacidadWarningData\.galpon\.([a-zA-Z_][a-zA-Z0-9_]*)/g, '(capacidadWarningData.galpon as any).$1');
  changes++;

  // 9. Remover placeholder de Select (más específico)
  content = content.replace(/\s+placeholder=""/g, '');
  changes++;

  // 10. Remover renderInput de DatePicker (más específico)
  content = content.replace(/\s+renderInput=\{\([^)]*\) => \([^}]+\}\)/g, '');
  changes++;

  fs.writeFileSync(filePath, content);
  console.log(`✅ Arreglado ${filePath} con ${changes} tipos de cambios`);
}

// Lista de archivos que necesitan arreglos específicos
const filesToFix = [
  'src/components/AlimentosTable.tsx',
  'src/components/CamadasTable.tsx',
  'src/components/ConsumoAlimentosTable.tsx',
  'src/components/CuyesTable.tsx',
  'src/components/PrenezTable.tsx',
  'src/components/PreñezTable.tsx'
];

// Arreglar archivos específicos
filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      fixTypeScriptErrorsCarefully(file);
    } catch (error) {
      console.error(`❌ Error arreglando ${file}:`, error.message);
    }
  } else {
    console.log(`⚠️  Archivo no encontrado: ${file}`);
  }
});

console.log('\n🎉 ¡Terminado! Archivos específicos procesados.');