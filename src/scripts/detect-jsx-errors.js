import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para buscar archivos con extensión específica
function findFiles(dir, ext) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(findFiles(filePath, ext));
    } else if (file.endsWith(ext)) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Encuentra errores comunes de JSX
function detectJSXErrors(content) {
  const errors = [];
  
  // Verificar etiquetas no cerradas
  const openTags = [];
  const regex = /<([a-zA-Z][a-zA-Z0-9]*)([^>]*?)(\/>|>)|<\/([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    // Si es un self-closing tag (con />) o un closing tag (</tag>)
    if (match[3] === '/>' || match[4]) {
      if (match[4]) {
        // Es un closing tag
        const tagName = match[4];
        // Buscar el último tag abierto de este tipo
        let foundIndex = -1;
        for (let i = openTags.length - 1; i >= 0; i--) {
          if (openTags[i].name === tagName) {
            foundIndex = i;
            break;
          }
        }
        
        // Si no encontramos un tag abierto correspondiente
        if (foundIndex === -1) {
          errors.push(`Closing tag </${tagName}> sin tag de apertura correspondiente`);
        } else {
          // Eliminar todos los tags hasta el tag encontrado
          // Esto maneja casos como <div><span></div> - span no cerrado
          const removedTags = openTags.splice(foundIndex);
          if (removedTags.length > 1) {
            // Si eliminamos más de uno, hay tags no cerrados
            for (let i = 0; i < removedTags.length - 1; i++) {
              errors.push(`Tag <${removedTags[i].name}> no cerrado`);
            }
          }
        }
      }
      // No hacemos nada especial para self-closing tags
    } else {
      // Es un opening tag
      const tagName = match[1];
      // No nos preocupamos por tags que típicamente no necesitan cierre
      if (!['img', 'input', 'br', 'hr', 'meta', 'link'].includes(tagName.toLowerCase())) {
        openTags.push({ name: tagName, pos: match.index });
      }
    }
  }
  
  // Al final, todos los tags deben estar cerrados
  if (openTags.length > 0) {
    for (const tag of openTags) {
      errors.push(`Tag <${tag.name}> no cerrado (posición: ${tag.pos})`);
    }
  }

  // Buscar fragmentos sueltos
  const fragmentRegex = /<>|<\/>/g;
  const fragments = [];
  while ((match = fragmentRegex.exec(content)) !== null) {
    fragments.push({ fragment: match[0], pos: match.index });
  }

  // Verificar que hay igual número de <> y </>
  const openFragments = fragments.filter(f => f.fragment === '<>').length;
  const closeFragments = fragments.filter(f => f.fragment === '</>').length;
  
  if (openFragments !== closeFragments) {
    errors.push(`Desbalance de fragmentos: ${openFragments} abiertos vs ${closeFragments} cerrados`);
  }
  
  return errors;
}

console.log('=== Iniciando validación avanzada de JSX ===');
const componentFiles = findFiles(path.join(__dirname, '..', 'components'), '.tsx');
let errorCount = 0;

componentFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const errors = detectJSXErrors(content);
    
    if (errors.length > 0) {
      console.error(`\nProblemas en ${path.basename(file)}:`);
      errors.forEach(err => console.error(`  - ${err}`));
      errorCount += errors.length;
    }
  } catch (error) {
    console.error(`Error al procesar ${file}:`, error);
  }
});

if (errorCount > 0) {
  console.error(`\n❌ Se encontraron ${errorCount} posibles problemas de JSX`);
  console.log('Recomendación: Revisa manualmente los archivos mencionados.');
  console.log('Nota: Esta herramienta es básica y puede dar falsos positivos.');
} else {
  console.log('✓ No se encontraron problemas obvios de JSX');
}

// No hacemos process.exit(1) para permitir continuar el desarrollo incluso con advertencias
