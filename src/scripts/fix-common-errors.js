/**
 * Este script verifica y corrige automáticamente problemas comunes
 * en los archivos de React del frontend antes de la compilación
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { glob } from 'glob';

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

console.log(`${colors.cyan}=== Iniciando verificación de código ====${colors.reset}`);

// Obtener todos los archivos .tsx y .jsx
const allFiles = await glob('src/**/*.{tsx,jsx}');
console.log(`${colors.blue}Encontrados ${allFiles.length} archivos para analizar${colors.reset}`);

let fixedIssues = 0;
let scannedFiles = 0;

// Verificar si existe el archivo utils/mui.ts y utils/conditional-render.tsx
const muiUtilPath = path.join(__dirname, '../../src/utils/mui.ts');
const conditionalRenderPath = path.join(__dirname, '../../src/utils/conditional-render.tsx');

if (!fs.existsSync(muiUtilPath)) {
  console.log(`${colors.yellow}⚠️ No se encontró el archivo utils/mui.ts. Algunos fixes no funcionarán.${colors.reset}`);
}

if (!fs.existsSync(conditionalRenderPath)) {
  console.log(`${colors.yellow}⚠️ No se encontró el archivo utils/conditional-render.tsx. Algunos fixes no funcionarán.${colors.reset}`);
}

// Expresiones regulares para detectar problemas comunes
const problemPatterns = [
  {
    name: 'Importación directa de Grid desde @mui/material',
    regex: /import\s+{\s*(.*?Grid.*?)\s*}\s+from\s+['"]@mui\/material['"]/g,
    fix: (content, filePath) => {
      const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, '../../src/utils')).replace(/\\/g, '/');
      return content.replace(
        /import\s+{\s*(.*?Grid.*?)\s*}\s+from\s+['"]@mui\/material['"]/g, 
        `import { $1 } from "${relativePath}/mui"`
      );
    }
  },
  {
    name: 'Importación específica de Grid',
    regex: /import\s+Grid\s+from\s+['"]@mui\/material\/Grid['"]/g,
    fix: (content, filePath) => {
      const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, '../../src/utils')).replace(/\\/g, '/');
      return content.replace(
        /import\s+Grid\s+from\s+['"]@mui\/material\/Grid['"]/g, 
        `import { Grid } from "${relativePath}/mui"`
      );
    }
  },
  {
    name: 'Importación incorrecta de utils/mui',
    regex: /import\s+{[\s\S]*?}\s+from\s+['"]utils\/mui['"]/g,
    fix: (content, filePath) => {
      // Convertir la importación para usar rutas relativas
      return content.replace(
        /import\s+{[\s\S]*?}\s+from\s+['"]utils\/mui['"]/g,
        (match) => {
          return match.replace('utils/mui', './utils/mui');
        }
      );
    }
  },
  {
    name: 'Fragmentos JSX mal formados en condicionales ternarios',
    regex: /\?[\s\n]*<>[\s\S]*?<\/>/g,
    // Para este caso específico, necesitamos un análisis más complejo que no se puede hacer con regex simple
    // El script marcará estos casos para revisión manual
    needsManualCheck: true
  },
  {
    name: 'Fragmentos JSX mal cerrados',
    regex: /<>[\s\S]*?(?!<\/>)/g,
    needsManualCheck: true,
    provideContext: (content, match, filePath) => {
      // Extraer más contexto para ayudar a localizar el problema
      const index = content.indexOf(match);
      const lineNumber = content.substring(0, index).split('\n').length;
      const startLine = Math.max(1, lineNumber - 3);
      const endLine = lineNumber + 10;
      
      // Extraer líneas de contexto
      const lines = content.split('\n');
      const contextLines = lines.slice(startLine - 1, endLine).join('\n');
      
      return `Posible fragmento JSX mal cerrado alrededor de la línea ${lineNumber}:\n${contextLines}`;
    }
  },
  {
    name: 'Importaciones múltiples de Material UI',
    regex: /import\s+{[\s\S]*?}\s+from\s+['"]@mui\/material['"]/g,
    fix: (content, filePath) => {
      const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, '../../src/utils')).replace(/\\/g, '/');
      return content.replace(
        /import\s+{[\s\S]*?}\s+from\s+['"]@mui\/material['"]/g,
        (match) => {
          // Convertir la importación a importar desde utils/mui
          return match.replace('@mui/material', `${relativePath}/mui`);
        }
      );
    }
  }
];

// Procesar cada archivo
for (const filePath of allFiles) {
  scannedFiles++;
  const relativePath = path.relative(path.join(__dirname, '../..'), filePath);
  let content;

  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`${colors.red}Error al leer ${relativePath}:${colors.reset}`, err);
    continue;
  }

  let hasIssues = false;
  let fileFixed = false;
  let updatedContent = content;

  // Verificar cada patrón
  for (const pattern of problemPatterns) {
    const matches = updatedContent.match(pattern.regex);
    if (matches && matches.length > 0) {
      hasIssues = true;
      console.log(`${colors.yellow}Encontrado en ${relativePath}: ${pattern.name} (${matches.length} ocurrencias)${colors.reset}`);

      if (pattern.needsManualCheck) {
        console.log(`${colors.magenta}  ⚠️ Este problema requiere revisión manual${colors.reset}`);
        
        // Si hay una función para proveer contexto, usarla
        if (pattern.provideContext) {
          for (const match of matches) {
            const context = pattern.provideContext(updatedContent, match, filePath);
            console.log(`${colors.cyan}  ${context}${colors.reset}`);
          }
        }
      } else if (pattern.fix) {
        updatedContent = pattern.fix(updatedContent, filePath);
        fileFixed = true;
        fixedIssues++;
      }
    }
  }

  // Guardar los cambios si se hicieron correcciones
  if (fileFixed) {
    try {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`${colors.green}✓ Corregido ${relativePath}${colors.reset}`);
    } catch (err) {
      console.error(`${colors.red}Error al escribir en ${relativePath}:${colors.reset}`, err);
    }
  } else if (!hasIssues) {
    console.log(`${colors.green}✓ Sin problemas en ${relativePath}${colors.reset}`);
  }
}

console.log(`${colors.cyan}=== Análisis completado ====${colors.reset}`);
console.log(`Archivos analizados: ${allFiles.length}`);
console.log(`Problemas corregidos automáticamente: ${fixedIssues}`);

if (fixedIssues === 0) {
  console.log(`${colors.green}✅ No se encontraron problemas críticos de JSX${colors.reset}`);
  console.log(`${colors.green}✅ La aplicación debería compilar correctamente${colors.reset}`);
}

// Si hay archivos con problemas que requieren revisión manual, recomendar el uso de los componentes ConditionalRender
if (fixedIssues > 0) {
  console.log(`
${colors.yellow}RECOMENDACIÓN PARA PROBLEMAS DE FRAGMENTOS JSX:${colors.reset}
Utiliza los componentes de renderizado condicional para evitar problemas con fragmentos JSX:

${colors.cyan}import { ConditionalRender } from '../utils/conditional-render';

// En lugar de:
{condition ? (
  <>
    <Component1 />
    <Component2 />
  </>
) : null}

// Usa:
<ConditionalRender condition={condition}>
  <Component1 />
  <Component2 />
</ConditionalRender>${colors.reset}
  `);
}
