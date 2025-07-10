-- AlterTable
ALTER TABLE "Cuy" ADD COLUMN     "etapaVida" TEXT NOT NULL DEFAULT 'Cría',
ADD COLUMN     "proposito" TEXT NOT NULL DEFAULT 'Indefinido',
ADD COLUMN     "ultimaEvaluacion" TIMESTAMP(3);
