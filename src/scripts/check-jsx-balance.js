#!/usr/bin/env node

// Script para verificar rápidamente si hay etiquetas JSX no balanceadas en un archivo
// Uso: node check-jsx-balance.js archivo.tsx

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verifica si se proporcionó un archivo como argumento
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Error: Debes proporcionar la ruta a un archivo TSX/JSX');
  process.exit(1);
}

const filePath = args[0];

// Verificar si el archivo existe
if (!fs.existsSync(filePath)) {
  console.error(`Error: El archivo ${filePath} no existe`);
  process.exit(1);
}

// Leer el contenido del archivo
const content = fs.readFileSync(filePath, 'utf8');

// Función para verificar etiquetas balanceadas
function checkBalancedTags(content) {
  const stack = [];
  const lines = content.split('\n');
  let lineNumber = 0;
  
  // Expresión regular para encontrar etiquetas de apertura y cierre
  const tagRegex = /<\/?([A-Z][a-zA-Z0-9]*)/g;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    lineNumber = i + 1;
    
    let match;
    while ((match = tagRegex.exec(line)) !== null) {
      const isClosingTag = match[0].charAt(1) === '/';
      const tagName = match[1];
      
      // Si es una etiqueta de cierre
      if (isClosingTag) {
        // Si la pila está vacía, hay un error
        if (stack.length === 0) {
          console.error(`Error en línea ${lineNumber}: Etiqueta de cierre </​${tagName}> sin etiqueta de apertura correspondiente`);
          return false;
        }
        
        // Verificar si la etiqueta de cierre coincide con la última etiqueta abierta
        const lastTag = stack.pop();
        if (lastTag !== tagName) {
          console.error(`Error en línea ${lineNumber}: Etiqueta de cierre </​${tagName}> no coincide con la última etiqueta abierta <${lastTag}>`);
          console.error(`Pila actual de etiquetas: ${stack.join(', ')}`);
          return false;
        }
      } else {
        // Si es una etiqueta de apertura y no es self-closing
        if (!line.includes('/>', match.index)) {
          stack.push(tagName);
        }
      }
    }
  }
  
  // Si quedan etiquetas sin cerrar al final
  if (stack.length > 0) {
    console.error(`Error: Etiquetas sin cerrar: ${stack.join(', ')}`);
    return false;
  }
  
  return true;
}

// Verificar balanceo de etiquetas
const isBalanced = checkBalancedTags(content);

if (isBalanced) {
  console.log(`✅ El archivo ${path.basename(filePath)} tiene etiquetas JSX balanceadas`);
  process.exit(0);
} else {
  console.error(`❌ El archivo ${path.basename(filePath)} tiene problemas con las etiquetas JSX`);
  process.exit(1);
}
