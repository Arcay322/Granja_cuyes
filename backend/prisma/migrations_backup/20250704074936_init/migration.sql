-- CreateTable
CREATE TABLE "Cuy" (
    "id" SERIAL NOT NULL,
    "raza" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "sexo" TEXT NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL,
    "galpon" TEXT NOT NULL,
    "jaula" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "camadaId" INTEGER,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVenta" TIMESTAMP(3),
    "fechaFallecimiento" TIMESTAMP(3),

    CONSTRAINT "Cuy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Camada" (
    "id" SERIAL NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "numVivos" INTEGER NOT NULL,
    "numMuertos" INTEGER NOT NULL,
    "padreId" INTEGER,
    "madreId" INTEGER,

    CONSTRAINT "Camada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movimiento" (
    "id" SERIAL NOT NULL,
    "cuyId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "origen" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,

    CONSTRAINT "Movimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alimento" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "proveedorId" INTEGER NOT NULL,
    "stock" DOUBLE PRECISION NOT NULL,
    "costoUnitario" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Alimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumoAlimento" (
    "id" SERIAL NOT NULL,
    "galpon" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "alimentoId" INTEGER NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ConsumoAlimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialSalud" (
    "id" SERIAL NOT NULL,
    "cuyId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "veterinario" TEXT NOT NULL,
    "medicamento" TEXT,
    "dosis" TEXT,
    "duracion" TEXT,

    CONSTRAINT "HistorialSalud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "estadoPago" TEXT NOT NULL,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VentaDetalle" (
    "id" SERIAL NOT NULL,
    "ventaId" INTEGER NOT NULL,
    "cuyId" INTEGER NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "VentaDetalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" SERIAL NOT NULL,
    "concepto" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "categoria" TEXT NOT NULL,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Cuy" ADD CONSTRAINT "Cuy_camadaId_fkey" FOREIGN KEY ("camadaId") REFERENCES "Camada"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_cuyId_fkey" FOREIGN KEY ("cuyId") REFERENCES "Cuy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alimento" ADD CONSTRAINT "Alimento_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumoAlimento" ADD CONSTRAINT "ConsumoAlimento_alimentoId_fkey" FOREIGN KEY ("alimentoId") REFERENCES "Alimento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialSalud" ADD CONSTRAINT "HistorialSalud_cuyId_fkey" FOREIGN KEY ("cuyId") REFERENCES "Cuy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaDetalle" ADD CONSTRAINT "VentaDetalle_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaDetalle" ADD CONSTRAINT "VentaDetalle_cuyId_fkey" FOREIGN KEY ("cuyId") REFERENCES "Cuy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
