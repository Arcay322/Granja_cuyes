#!/bin/sh
# Script para ejecutar la corrección de errores y después construir el proyecto

# Ejecutar el script de corrección de errores
echo "Ejecutando script de corrección de errores..."
node ./src/scripts/fix-common-errors.js

# Compilar TypeScript
echo "Compilando TypeScript..."
tsc -b

# Construir el proyecto con vite
echo "Construyendo el proyecto con vite..."
vite build
