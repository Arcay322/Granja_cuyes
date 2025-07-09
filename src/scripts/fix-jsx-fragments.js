/**
 * Script para corregir fragmentos JSX específicos en un archivo
 * 
 * Uso: node fix-jsx-fragments.js <ruta-al-archivo>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Obtener la ruta del archivo del argumento de línea de comandos
const filePath = process.argv[2];

if (!filePath) {
  console.log(`${colors.red}Error: Se requiere la ruta del archivo a corregir${colors.reset}`);
  console.log(`Uso: node fix-jsx-fragments.js <ruta-al-archivo>`);
  process.exit(1);
}

// Leer el archivo
let content;
try {
  content = fs.readFileSync(filePath, 'utf8');
} catch (err) {
  console.error(`${colors.red}Error al leer el archivo ${filePath}:${colors.reset}`, err);
  process.exit(1);
}

// Función para encontrar problemas potenciales con fragmentos JSX
function findJSXFragmentIssues(content) {
  const issues = [];
  
  // Buscar fragmentos JSX abiertos
  const openFragments = content.match(/<>(?!\s*<\/>\s*)/g) || [];
  
  // Buscar fragmentos JSX cerrados
  const closedFragments = content.match(/<\/>/g) || [];
  
  if (openFragments.length !== closedFragments.length) {
    issues.push({
      type: 'count_mismatch',
      message: `Discrepancia en el número de fragmentos JSX: ${openFragments.length} abiertos vs ${closedFragments.length} cerrados`
    });
  }
  
  // Buscar patrones problemáticos comunes
  const conditionalFragments = content.match(/\?[\s\n]*<>[\s\S]*?<\/>/g) || [];
  for (const fragment of conditionalFragments) {
    issues.push({
      type: 'conditional_fragment',
      content: fragment,
      message: 'Fragmento JSX en una expresión condicional. Considere usar ConditionalRender.'
    });
  }
  
  // Buscar fragmentos que podrían estar mal cerrados (heurística simple)
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<>') && !lines[i].includes('</>')) {
      // Buscar el cierre correspondiente en las siguientes líneas
      let found = false;
      for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
        if (lines[j].includes('</>')) {
          found = true;
          break;
        }
      }
      
      if (!found) {
        issues.push({
          type: 'unclosed_fragment',
          lineNumber: i + 1,
          content: lines[i],
          message: `Posible fragmento JSX sin cerrar en la línea ${i + 1}`
        });
      }
    }
  }
  
  return issues;
}

// Encontrar problemas
const issues = findJSXFragmentIssues(content);

if (issues.length === 0) {
  console.log(`${colors.green}No se encontraron problemas con fragmentos JSX en el archivo${colors.reset}`);
  process.exit(0);
}

// Mostrar problemas encontrados
console.log(`${colors.yellow}Se encontraron ${issues.length} problemas potenciales con fragmentos JSX:${colors.reset}`);
issues.forEach((issue, index) => {
  console.log(`${colors.cyan}Problema #${index + 1}: ${issue.message}${colors.reset}`);
  
  if (issue.content) {
    console.log(`${colors.magenta}Contenido:${colors.reset}`);
    console.log(issue.content);
  }
  
  if (issue.lineNumber) {
    console.log(`${colors.magenta}Línea ${issue.lineNumber}:${colors.reset} ${issue.content}`);
  }
  
  console.log();
});

// Sugerir correcciones
console.log(`${colors.green}Sugerencias para corregir los problemas:${colors.reset}`);

issues.forEach((issue, index) => {
  console.log(`${colors.cyan}Para el problema #${index + 1}:${colors.reset}`);
  
  switch (issue.type) {
    case 'count_mismatch':
      console.log(`- Verifique que cada fragmento <> tenga su correspondiente </>`);
      console.log(`- Considere usar el componente ConditionalRender para renderizado condicional`);
      break;
      
    case 'conditional_fragment':
      console.log(`- Reemplace:`);
      console.log(`${issue.content}`);
      console.log(`- Con:`);
      console.log(`<ConditionalRender condition={condición}>`);
      console.log(`  {/* contenido */}`);
      console.log(`</ConditionalRender>`);
      break;
      
    case 'unclosed_fragment':
      console.log(`- Asegúrese de cerrar el fragmento en la línea ${issue.lineNumber}:`);
      console.log(`${issue.content}`);
      console.log(`- Agregando </> donde corresponda`);
      break;
      
    default:
      console.log(`- Revise manualmente el código alrededor de la línea ${issue.lineNumber || 'mencionada'}`);
  }
  
  console.log();
});
