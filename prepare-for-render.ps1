# Script de preparación para despliegue en Render (PowerShell)
# Ejecutar antes de hacer push a GitHub

Write-Host "🚀 Preparando SUMAQ UYWA para despliegue en Render..." -ForegroundColor Green

# Verificar que estamos en el directorio correcto
if (!(Test-Path "package.json") -or !(Test-Path "backend")) {
    Write-Host "❌ Error: Ejecuta este script desde la raíz del proyecto SUMAQ UYWA" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Directorio verificado" -ForegroundColor Green

# Verificar que existe render.yaml
if (!(Test-Path "render.yaml")) {
    Write-Host "❌ Error: No se encontró render.yaml" -ForegroundColor Red
    exit 1
}

Write-Host "✅ render.yaml encontrado" -ForegroundColor Green

# Verificar configuración del backend
if (!(Test-Path "backend/package.json")) {
    Write-Host "❌ Error: No se encontró backend/package.json" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend configurado" -ForegroundColor Green

# Verificar que existe .gitignore
if (!(Test-Path ".gitignore")) {
    Write-Host "❌ Error: No se encontró .gitignore" -ForegroundColor Red
    exit 1
}

Write-Host "✅ .gitignore verificado" -ForegroundColor Green

# Verificar scripts de build
$frontendPackage = Get-Content "package.json" | ConvertFrom-Json
$backendPackage = Get-Content "backend/package.json" | ConvertFrom-Json

if (!$frontendPackage.scripts.build) {
    Write-Host "❌ Error: No se encontró script de build en package.json del frontend" -ForegroundColor Red
    exit 1
}

if (!$backendPackage.scripts.build) {
    Write-Host "❌ Error: No se encontró script de build en backend/package.json" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Scripts de build verificados" -ForegroundColor Green

# Verificar que no hay archivos sensibles
Write-Host "🔍 Verificando archivos sensibles..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host "⚠️  Advertencia: Archivo .env encontrado - asegúrate de que esté en .gitignore" -ForegroundColor Yellow
}

if (Test-Path "backend/.env") {
    Write-Host "⚠️  Advertencia: Archivo backend/.env encontrado - asegúrate de que esté en .gitignore" -ForegroundColor Yellow
}

Write-Host "✅ Verificación de seguridad completada" -ForegroundColor Green

# Limpiar archivos temporales
Write-Host "🧹 Limpiando archivos temporales..." -ForegroundColor Yellow

# Limpiar node_modules si existen
if (Test-Path "node_modules") {
    Write-Host "🗑️  Limpiando node_modules del frontend..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules"
}

if (Test-Path "backend/node_modules") {
    Write-Host "🗑️  Limpiando node_modules del backend..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "backend/node_modules"
}

# Limpiar builds previos
if (Test-Path "dist") {
    Write-Host "🗑️  Limpiando dist del frontend..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "dist"
}

if (Test-Path "backend/dist") {
    Write-Host "🗑️  Limpiando dist del backend..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "backend/dist"
}

Write-Host "✅ Limpieza completada" -ForegroundColor Green

# Verificar que git está inicializado
if (!(Test-Path ".git")) {
    Write-Host "❌ Error: No es un repositorio git. Ejecuta: git init" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Repositorio git verificado" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 ¡Todo listo para desplegar!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Haz commit de los cambios: git add . && git commit -m 'Preparado para Render'" -ForegroundColor White
Write-Host "2. Haz push a GitHub: git push origin main" -ForegroundColor White
Write-Host "3. Ve a render.com y sigue la guía RENDER_DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host ""
Write-Host "📖 Lee RENDER_DEPLOYMENT_GUIDE.md para instrucciones detalladas" -ForegroundColor Cyan
Write-Host ""
