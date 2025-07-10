#!/usr/bin/env pwsh
# Script para pruebas automáticas con SQLite en memoria

# 1. Copia schema.prisma a schema.test.prisma y cambia provider a sqlite
$schemaPath = "./prisma/schema.prisma"
$testSchemaPath = "./prisma/schema.test.prisma"

(Get-Content $schemaPath) -replace 'provider = "postgresql"', 'provider = "sqlite"' | Set-Content $testSchemaPath

# 2. Ejecuta migraciones y genera el cliente Prisma usando el schema de test y .env.test
npx prisma migrate deploy --schema=$testSchemaPath --env-file=.env.test
npx prisma generate --schema=$testSchemaPath --env-file=.env.test

# 3. Ejecuta los tests con Jest
$env:DATABASE_URL = "file:./test.db?mode=memory&cache=shared"
$env:NODE_ENV = "test"
npm test

# 4. Limpieza: elimina el schema de test generado
del $testSchemaPath
