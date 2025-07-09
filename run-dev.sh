#!/bin/sh
# Script para ejecutar la corrección de errores y después compilar el proyecto

# Ejecutar el script de corrección de errores
echo "Ejecutando script de corrección de errores..."
node ./src/scripts/fix-common-errors.js

# Ejecutar vite
echo "Iniciando vite..."
vite
