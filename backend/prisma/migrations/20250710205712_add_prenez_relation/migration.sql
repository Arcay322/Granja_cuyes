/*
  Warnings:

  - A unique constraint covering the columns `[prenezId]` on the table `Camada` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Camada" ADD COLUMN     "prenezId" INTEGER;

-- CreateTable
CREATE TABLE "Prenez" (
    "id" SERIAL NOT NULL,
    "madreId" INTEGER NOT NULL,
    "padreId" INTEGER,
    "fechaPrenez" TIMESTAMP(3) NOT NULL,
    "fechaProbableParto" TIMESTAMP(3) NOT NULL,
    "notas" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "fechaCompletada" TIMESTAMP(3),

    CONSTRAINT "Prenez_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Camada_prenezId_key" ON "Camada"("prenezId");

-- AddForeignKey
ALTER TABLE "Camada" ADD CONSTRAINT "Camada_prenezId_fkey" FOREIGN KEY ("prenezId") REFERENCES "Prenez"("id") ON DELETE SET NULL ON UPDATE CASCADE;
