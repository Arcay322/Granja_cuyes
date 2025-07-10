-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "email" TEXT,
ADD COLUMN     "telefono" TEXT;

-- AlterTable
ALTER TABLE "Cuy" ADD COLUMN     "etapaVida" TEXT NOT NULL DEFAULT 'Cría',
ADD COLUMN     "proposito" TEXT NOT NULL DEFAULT 'Indefinido';

-- AlterTable
ALTER TABLE "HistorialSalud" ADD COLUMN     "tratamiento" TEXT;

-- AlterTable
ALTER TABLE "Proveedor" ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "telefono" TEXT;
