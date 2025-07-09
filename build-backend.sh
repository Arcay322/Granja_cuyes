#!/usr/bin/env bash
# Build script para Backend en Render

cd backend

# Instalar dependencias
npm install

# Generar cliente Prisma
npx prisma generate

# Construir TypeScript
npm run build

# Ejecutar migraciones (opcional, mejor hacerlo manual la primera vez)
# npx prisma migrate deploy
