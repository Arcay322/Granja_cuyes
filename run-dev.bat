@echo off
REM Script para ejecutar la corrección de errores y después compilar el proyecto

REM Ejecutar el script de corrección de errores
echo Ejecutando script de corrección de errores...
node ./src/scripts/fix-common-errors.js

REM Iniciar vite
echo Iniciando vite...
vite
