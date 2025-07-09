#!/bin/bash

# Script de preparación para despliegue en Render
# Ejecutar antes de hacer push a GitHub

echo "🚀 Preparando SUMAQ UYWA para despliegue en Render..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Ejecuta este script desde la raíz del proyecto SUMAQ UYWA"
    exit 1
fi

echo "✅ Directorio verificado"

# Verificar que existe render.yaml
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: No se encontró render.yaml"
    exit 1
fi

echo "✅ render.yaml encontrado"

# Verificar configuración del backend
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: No se encontró backend/package.json"
    exit 1
fi

echo "✅ Backend configurado"

# Verificar que existe .gitignore
if [ ! -f ".gitignore" ]; then
    echo "❌ Error: No se encontró .gitignore"
    exit 1
fi

echo "✅ .gitignore verificado"

# Verificar scripts de build
if ! grep -q "\"build\":" package.json; then
    echo "❌ Error: No se encontró script de build en package.json del frontend"
    exit 1
fi

if ! grep -q "\"build\":" backend/package.json; then
    echo "❌ Error: No se encontró script de build en backend/package.json"
    exit 1
fi

echo "✅ Scripts de build verificados"

# Verificar que no hay archivos sensibles
echo "🔍 Verificando archivos sensibles..."

if [ -f ".env" ]; then
    echo "⚠️  Advertencia: Archivo .env encontrado - asegúrate de que esté en .gitignore"
fi

if [ -f "backend/.env" ]; then
    echo "⚠️  Advertencia: Archivo backend/.env encontrado - asegúrate de que esté en .gitignore"
fi

echo "✅ Verificación de seguridad completada"

# Limpiar archivos temporales
echo "🧹 Limpiando archivos temporales..."

# Limpiar node_modules si existen
if [ -d "node_modules" ]; then
    echo "🗑️  Limpiando node_modules del frontend..."
    rm -rf node_modules
fi

if [ -d "backend/node_modules" ]; then
    echo "🗑️  Limpiando node_modules del backend..."
    rm -rf backend/node_modules
fi

# Limpiar builds previos
if [ -d "dist" ]; then
    echo "🗑️  Limpiando dist del frontend..."
    rm -rf dist
fi

if [ -d "backend/dist" ]; then
    echo "🗑️  Limpiando dist del backend..."
    rm -rf backend/dist
fi

echo "✅ Limpieza completada"

# Verificar que git está inicializado
if [ ! -d ".git" ]; then
    echo "❌ Error: No es un repositorio git. Ejecuta: git init"
    exit 1
fi

echo "✅ Repositorio git verificado"

echo ""
echo "🎉 ¡Todo listo para desplegar!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Haz commit de los cambios: git add . && git commit -m 'Preparado para Render'"
echo "2. Haz push a GitHub: git push origin main"
echo "3. Ve a render.com y sigue la guía RENDER_DEPLOYMENT_GUIDE.md"
echo ""
echo "📖 Lee RENDER_DEPLOYMENT_GUIDE.md para instrucciones detalladas"
echo ""
