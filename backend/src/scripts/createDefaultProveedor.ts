import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    // Check if default proveedor exists
    const existingProveedor = await prisma.proveedor.findFirst({
      where: { id: 1 }
    });

    if (!existingProveedor) {
      // Create default proveedor
      await prisma.proveedor.create({
        data: {
          id: 1,
          nombre: 'Proveedor General',
          contacto: 'contacto@general.com'
        }
      });
      console.log('Proveedor por defecto creado con éxito');
    } else {
      console.log('El proveedor por defecto ya existe');
    }
  } catch (error) {
    console.error('Error al crear proveedor por defecto:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
