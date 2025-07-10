# Script para pruebas automáticas con SQLite en memoria (PowerShell clásico)
# 1. Copia schema.prisma a schema.test.prisma y cambia provider a sqlite
$schemaPath = "./prisma/schema.prisma"
$testSchemaPath = "./prisma/schema.test.prisma"

(Get-Content $schemaPath) -replace 'provider = "postgresql"', 'provider = "sqlite"' | Set-Content $testSchemaPath

# 2. Elimina el cliente Prisma generado previamente
Remove-Item -Recurse -Force "./node_modules/@prisma/client" -ErrorAction SilentlyContinue

# 3. Ejecuta migraciones y genera el cliente Prisma usando el schema de test y .env.test
npx prisma migrate reset --force --skip-seed --schema=$testSchemaPath
npx prisma generate --schema=$testSchemaPath

# 4. Ejecuta los tests con Jest
$env:DATABASE_URL = "file:./test.db?mode=memory&cache=shared"
$env:NODE_ENV = "test"
npm test

# 5. Limpieza: elimina el schema de test generado
Remove-Item $testSchemaPath
