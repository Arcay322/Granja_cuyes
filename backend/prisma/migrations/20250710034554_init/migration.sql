-- CreateTable
CREATE TABLE "Cuy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "raza" TEXT NOT NULL,
    "fechaNacimiento" DATETIME NOT NULL,
    "sexo" TEXT NOT NULL,
    "peso" REAL NOT NULL,
    "galpon" TEXT NOT NULL,
    "jaula" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "camadaId" INTEGER,
    "fechaRegistro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVenta" DATETIME,
    "fechaFallecimiento" DATETIME,
    "etapaVida" TEXT NOT NULL DEFAULT 'Cría',
    "proposito" TEXT NOT NULL DEFAULT 'Indefinido',
    "ultimaEvaluacion" DATETIME,
    CONSTRAINT "Cuy_camadaId_fkey" FOREIGN KEY ("camadaId") REFERENCES "Camada" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Camada" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fechaNacimiento" DATETIME NOT NULL,
    "numVivos" INTEGER NOT NULL,
    "numMuertos" INTEGER NOT NULL,
    "padreId" INTEGER,
    "madreId" INTEGER,
    "prenezId" INTEGER,
    CONSTRAINT "Camada_prenezId_fkey" FOREIGN KEY ("prenezId") REFERENCES "Prenez" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prenez" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "madreId" INTEGER NOT NULL,
    "padreId" INTEGER,
    "fechaPrenez" DATETIME NOT NULL,
    "fechaProbableParto" DATETIME NOT NULL,
    "notas" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "fechaCompletada" DATETIME
);

-- CreateTable
CREATE TABLE "Movimiento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cuyId" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "origen" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    CONSTRAINT "Movimiento_cuyId_fkey" FOREIGN KEY ("cuyId") REFERENCES "Cuy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alimento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "proveedorId" INTEGER NOT NULL,
    "stock" REAL NOT NULL,
    "costoUnitario" REAL NOT NULL,
    CONSTRAINT "Alimento_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsumoAlimento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "galpon" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "alimentoId" INTEGER NOT NULL,
    "cantidad" REAL NOT NULL,
    CONSTRAINT "ConsumoAlimento_alimentoId_fkey" FOREIGN KEY ("alimentoId") REFERENCES "Alimento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "HistorialSalud" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cuyId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "descripcion" TEXT NOT NULL,
    "veterinario" TEXT NOT NULL,
    "medicamento" TEXT,
    "dosis" TEXT,
    "duracion" TEXT,
    CONSTRAINT "HistorialSalud_cuyId_fkey" FOREIGN KEY ("cuyId") REFERENCES "Cuy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "direccion" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha" DATETIME NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "total" REAL NOT NULL,
    "estadoPago" TEXT NOT NULL,
    CONSTRAINT "Venta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VentaDetalle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ventaId" INTEGER NOT NULL,
    "cuyId" INTEGER NOT NULL,
    "peso" REAL NOT NULL,
    "precioUnitario" REAL NOT NULL,
    CONSTRAINT "VentaDetalle_cuyId_fkey" FOREIGN KEY ("cuyId") REFERENCES "Cuy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VentaDetalle_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "concepto" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "monto" REAL NOT NULL,
    "categoria" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Camada_prenezId_key" ON "Camada"("prenezId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
