#!/usr/bin/env bash
# Build script para Frontend en Render

# Instalar dependencias
npm install

# Construir el proyecto
npm run build

# Servir archivos estáticos
npm install -g serve
