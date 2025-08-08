-- CreateTable
CREATE TABLE "Galpon" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "ubicacion" TEXT,
    "capacidadMaxima" INTEGER NOT NULL DEFAULT 50,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Galpon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jaula" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "galponId" INTEGER NOT NULL,
    "galponNombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "capacidadMaxima" INTEGER NOT NULL DEFAULT 10,
    "tipo" TEXT NOT NULL DEFAULT 'Estándar',
    "estado" TEXT NOT NULL DEFAULT 'Activo',

    CONSTRAINT "Jaula_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Galpon_nombre_key" ON "Galpon"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Jaula_galponNombre_nombre_key" ON "Jaula"("galponNombre", "nombre");

-- AddForeignKey
ALTER TABLE "Jaula" ADD CONSTRAINT "Jaula_galponId_fkey" FOREIGN KEY ("galponId") REFERENCES "Galpon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
