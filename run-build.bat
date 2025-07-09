@echo off
REM Script para ejecutar la corrección de errores y después construir el proyecto

REM Ejecutar el script de corrección de errores
echo Ejecutando script de corrección de errores...
node ./src/scripts/fix-common-errors.js

REM Compilar TypeScript
echo Compilando TypeScript...
tsc -b

REM Construir el proyecto con vite
echo Construyendo el proyecto con vite...
vite build
