import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Iniciando validación de JSX ===');

// Usamos ESLint para validar JSX
exec('npx eslint --ext .tsx src/components/', (error, stdout, stderr) => {
  if (error) {
    console.error('Problemas de JSX encontrados:');
    console.error(stdout || stderr);
    process.exit(1); // Fallo para que no se inicie la aplicación con errores
  } else {
    console.log('✓ No se encontraron problemas de JSX en los componentes');
    // Continuar con el proceso normal
  }
});
