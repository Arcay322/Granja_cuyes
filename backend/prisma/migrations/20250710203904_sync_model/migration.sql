/*
  Warnings:

  - You are about to drop the column `prenezId` on the `Camada` table. All the data in the column will be lost.
  - You are about to drop the column `etapaVida` on the `Cuy` table. All the data in the column will be lost.
  - You are about to drop the column `proposito` on the `Cuy` table. All the data in the column will be lost.
  - You are about to drop the column `ultimaEvaluacion` on the `Cuy` table. All the data in the column will be lost.
  - You are about to drop the `Prenez` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Camada" DROP CONSTRAINT "Camada_prenezId_fkey";

-- DropIndex
DROP INDEX "Alimento_proveedorId_idx";

-- DropIndex
DROP INDEX "Camada_prenezId_key";

-- DropIndex
DROP INDEX "Cuy_estado_idx";

-- DropIndex
DROP INDEX "Cuy_fechaNacimiento_idx";

-- DropIndex
DROP INDEX "Cuy_galpon_idx";

-- DropIndex
DROP INDEX "Cuy_jaula_idx";

-- DropIndex
DROP INDEX "Gasto_categoria_idx";

-- DropIndex
DROP INDEX "Gasto_fecha_idx";

-- DropIndex
DROP INDEX "Venta_clienteId_idx";

-- DropIndex
DROP INDEX "Venta_fecha_idx";

-- AlterTable
ALTER TABLE "Camada" DROP COLUMN "prenezId";

-- AlterTable
ALTER TABLE "Cuy" DROP COLUMN "etapaVida",
DROP COLUMN "proposito",
DROP COLUMN "ultimaEvaluacion";

-- DropTable
DROP TABLE "Prenez";

-- DropTable
DROP TABLE "User";
